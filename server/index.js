import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDatabase, getPool, getDbStatus } from './db.js';
import {
  getSmtpStatus,
  verifySmtpConnection,
  sendEmailOtp,
  sendPetitionConfirmationEmail,
  hashOtp,
  generateOtp,
  generateVerificationToken,
  timingSafeVerify,
  maskEmail,
  RESEND_COOLDOWN_SECONDS
} from './emailService.js';
import {
  sendOtpSms,
  getSmsProviderInfo
} from './smsService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '1mb' }));
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ success: false, message: 'Invalid JSON request payload.' });
  }
  next(err);
});
app.use(cors({ origin: true, credentials: true }));

// Rate Limiters to protect against abuse and spam
const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { success: false, message: 'Too many OTP requests from this network. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: { success: false, message: 'Too many verification attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

const petitionActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 35,
  message: { success: false, message: 'Too many requests. Please wait a moment and try again.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Helper: validate email address format
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function sanitizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

// Helper: validate Indian 10-digit mobile number
function isValidIndianMobile(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  const tenDigits = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  return /^[6-9]\d{9}$/.test(tenDigits);
}

function sanitizePhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
}

// Helper: sanitize and extract canonical CTR petition reference number
function sanitizeReferenceNo(ref) {
  if (!ref || typeof ref !== 'string') return null;
  const trimmed = ref.trim().toUpperCase();
  const match = trimmed.match(/CTR-\d{4}-\d{6}/i);
  return match ? match[0].toUpperCase() : trimmed;
}

// ---------------- API ROUTES ---------------- //

/**
 * Health check endpoint: Reports database, Gmail SMTP, and SMS provider status
 */
app.get('/api/health', (req, res) => {
  const dbStatus = getDbStatus();
  const smtpInfo = getSmtpStatus();
  const smsInfo = getSmsProviderInfo();
  res.json({
    status: dbStatus.connected ? 'healthy' : 'degraded',
    service: 'CTR Nirmal Kumar Citizen Portal Backend',
    database: {
      connected: dbStatus.connected,
      host: dbStatus.host,
      database: dbStatus.database,
      error: dbStatus.error
    },
    smtp: smtpInfo,
    sms: smsInfo
  });
});

/**
 * Diagnostic Endpoint: Re-initializes and tests Gmail SMTP connection and authentication
 * Never exposes the password.
 */
app.get('/api/smtp/verify', async (req, res) => {
  try {
    const result = await verifySmtpConnection(true);
    res.status(result.success ? 200 : 401).json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Send OTP: Generates secure 6-digit OTP and delivers via free Gmail SMTP
 * (or SMS fallback if mobile number requested)
 */
app.post('/api/otp/send', otpSendLimiter, async (req, res) => {
  try {
    const { email, phone, purpose, referenceNo } = req.body;

    const cleanEmail = sanitizeEmail(email);
    const cleanPhone = sanitizePhone(phone);

    // Purpose validation: 'login', 'submit_petition', 'track_petition'
    if (!['login', 'submit_petition', 'track_petition'].includes(purpose)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification purpose.'
      });
    }

    // Require either email or phone
    if (!cleanEmail && !cleanPhone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    if (cleanEmail && !isValidEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address (e.g., yourname@gmail.com).'
      });
    }

    if (cleanPhone && !isValidIndianMobile(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit Indian mobile number.'
      });
    }

    const pool = await getPool();

    // If purpose is tracking, verify that a petition matching referenceNo and identity exists first
    const cleanRef = sanitizeReferenceNo(referenceNo);
    if (purpose === 'track_petition') {
      if (!cleanRef || cleanRef.length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Petition reference number is required for tracking.'
        });
      }

      let trackQuery = `
        SELECT p.id, p.reference_no, p.email, p.phone, c.email AS petitioner_email, c.phone AS petitioner_phone
        FROM petitions p
        LEFT JOIN petitioners c ON p.petitioner_id = c.id
        WHERE LOWER(p.reference_no) = LOWER(?)
      `;
      const trackParams = [cleanRef];

      if (cleanEmail) {
        trackQuery += ` AND (LOWER(COALESCE(p.email, '')) = LOWER(?) OR LOWER(COALESCE(c.email, '')) = LOWER(?))`;
        trackParams.push(cleanEmail, cleanEmail);
      } else if (cleanPhone) {
        trackQuery += ` AND (p.phone = ? OR c.phone = ?)`;
        trackParams.push(cleanPhone, cleanPhone);
      }

      const [matchingPetitions] = await pool.query(trackQuery + ' LIMIT 1', trackParams);

      if (matchingPetitions.length === 0) {
        return res.status(404).json({
          success: false,
          message: cleanEmail
            ? `No petition found for reference number "${cleanRef}" registered to email "${cleanEmail}".`
            : `No petition found for reference number "${cleanRef}".`
        });
      }
    }

    // Check for resend cooldown (60 seconds)
    const [recentOtps] = await pool.query(
      `SELECT id, TIMESTAMPDIFF(SECOND, created_at, NOW()) AS elapsed_seconds
       FROM otp_verifications
       WHERE (
         (? IS NOT NULL AND email = ?)
         OR (? IS NOT NULL AND phone = ?)
       ) AND purpose = ? AND is_verified = FALSE AND expires_at > NOW()
       ORDER BY id DESC LIMIT 1`,
      [cleanEmail || null, cleanEmail || null, cleanPhone || null, cleanPhone || null, purpose]
    );

    if (recentOtps.length > 0 && recentOtps[0].elapsed_seconds !== null && recentOtps[0].elapsed_seconds < RESEND_COOLDOWN_SECONDS) {
      const waitTime = RESEND_COOLDOWN_SECONDS - recentOtps[0].elapsed_seconds;
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitTime} seconds before requesting a new OTP.`,
        remainingSeconds: waitTime
      });
    }

    // Generate cryptographically secure 6-digit OTP
    const otp = generateOtp();
    const identifier = cleanEmail || cleanPhone;
    const otpHash = hashOtp(identifier, otp);

    // Dispatch delivery FIRST: strictly do not mark or store OTP as sent if SMTP fails!
    let deliveryMessage = '';
    let deliveryChannel = 'email';

    if (cleanEmail) {
      // Send real email via Gmail SMTP
      await sendEmailOtp({
        email: cleanEmail,
        otp,
        purpose,
        referenceNo: cleanRef
      });
      deliveryMessage = `A 6-digit verification code has been sent to ${maskEmail(cleanEmail)}.`;
      deliveryChannel = 'email';
    } else {
      // SMS delivery fallback
      const smsResult = await sendOtpSms(cleanPhone, otp, purpose);
      deliveryMessage = `Verification code sent to +91 ******${cleanPhone.slice(-4)}.`;
      deliveryChannel = 'sms';
    }

    // Save to database only after the message is accepted by the SMTP server
    await pool.query(
      `INSERT INTO otp_verifications (email, phone, otp_hash, purpose, reference_no, expires_at)
       VALUES (?, ?, ?, ?, ?, NOW() + INTERVAL 5 MINUTE)`,
      [
        cleanEmail || null,
        cleanPhone || null,
        otpHash,
        purpose,
        cleanRef
      ]
    );

    return res.json({
      success: true,
      message: deliveryMessage,
      cooldownSeconds: RESEND_COOLDOWN_SECONDS,
      channel: deliveryChannel,
      destination: cleanEmail ? maskEmail(cleanEmail) : `+91 ******${cleanPhone.slice(-4)}`
    });
  } catch (error) {
    console.error('[Send OTP Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send verification code. Please check configuration.'
    });
  }
});

/**
 * Verify OTP: Validates OTP against stored HMAC-SHA256 hash using timing-safe comparison
 */
app.post('/api/otp/verify', otpVerifyLimiter, async (req, res) => {
  try {
    const { email, phone, otp, purpose } = req.body;

    const cleanEmail = sanitizeEmail(email);
    const cleanPhone = sanitizePhone(phone);

    if (!cleanEmail && !cleanPhone) {
      return res.status(400).json({ success: false, message: 'Email address or mobile number is required.' });
    }

    if (!otp || typeof otp !== 'string' || !/^\d{6}$/.test(otp.trim())) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 6-digit verification code.' });
    }

    const cleanOtp = otp.trim();
    const pool = await getPool();
    const identifier = cleanEmail || cleanPhone;

    // Query latest active unverified OTP for this identifier and purpose
    const [rows] = await pool.query(
      `SELECT id, otp_hash, attempts, max_attempts, reference_no, email, phone,
              TIMESTAMPDIFF(SECOND, NOW(), expires_at) AS seconds_left
       FROM otp_verifications
       WHERE (
         (? IS NOT NULL AND email = ?)
         OR (? IS NOT NULL AND phone = ?)
       ) AND purpose = ? AND is_verified = FALSE AND expires_at > NOW()
       ORDER BY id DESC LIMIT 1`,
      [cleanEmail || null, cleanEmail || null, cleanPhone || null, cleanPhone || null, purpose]
    );

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active verification code found or code has expired (valid for 5 minutes). Please request a new OTP.'
      });
    }

    const record = rows[0];

    // Check if maximum verification attempts reached
    if (record.attempts >= record.max_attempts) {
      return res.status(429).json({
        success: false,
        message: 'Maximum verification attempts exceeded. Please request a new OTP.'
      });
    }

    // Verify hash with timing-safe comparison
    const submittedHash = hashOtp(identifier, cleanOtp);
    const isMatch = timingSafeVerify(submittedHash, record.otp_hash);

    if (!isMatch) {
      const remainingAttempts = record.max_attempts - (record.attempts + 1);
      await pool.query('UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = ?', [record.id]);

      return res.status(400).json({
        success: false,
        message: remainingAttempts > 0
          ? `Incorrect verification code. ${remainingAttempts} attempt(s) remaining.`
          : 'Incorrect code. Maximum verification attempts exceeded. Please request a new OTP.'
      });
    }

    // Success: Generate cryptographically secure single-use verification token
    const verificationToken = generateVerificationToken();
    await pool.query(
      'UPDATE otp_verifications SET is_verified = TRUE, verification_token = ?, attempts = attempts + 1 WHERE id = ?',
      [verificationToken, record.id]
    );

    return res.json({
      success: true,
      message: cleanEmail ? 'Email verified successfully.' : 'Mobile number verified successfully.',
      verificationToken,
      email: record.email || cleanEmail,
      phone: record.phone || cleanPhone
    });
  } catch (error) {
    console.error('[Verify OTP Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Verification failed. Please try again.'
    });
  }
});

/**
 * Submit Petition: Saves petition details to MySQL only after successful OTP verification
 */
app.post('/api/petitions/submit', petitionActionLimiter, async (req, res) => {
  try {
    const { verificationToken, email, phone, name, constituency, subject, details, category } = req.body;

    if (!verificationToken || typeof verificationToken !== 'string') {
      return res.status(401).json({
        success: false,
        message: 'Verification required. Please complete OTP verification before submitting a petition.'
      });
    }

    const cleanEmail = sanitizeEmail(email);
    const cleanPhone = sanitizePhone(phone);

    if (!cleanEmail && !cleanPhone) {
      return res.status(400).json({ success: false, message: 'Valid email address is required.' });
    }

    if (cleanEmail && !isValidEmail(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Please provide the petitioner name.' });
    }

    if (!subject || subject.trim().length < 3 || subject.trim().length > 150) {
      return res.status(400).json({ success: false, message: 'Petition subject must be between 3 and 150 characters.' });
    }

    if (!details || details.trim().length < 10 || details.trim().length > 2000) {
      return res.status(400).json({ success: false, message: 'Petition details must be between 10 and 2000 characters.' });
    }

    const pool = await getPool();

    // Verify token validity (must be for submit_petition or login, verified, and under 15 minutes old)
    const [tokenRecords] = await pool.query(
      `SELECT id, email, phone FROM otp_verifications
       WHERE verification_token = ?
         AND (
           (? IS NOT NULL AND email = ?)
           OR (? IS NOT NULL AND phone = ?)
         )
         AND purpose IN ('submit_petition', 'login')
         AND is_verified = TRUE
         AND TIMESTAMPDIFF(MINUTE, created_at, NOW()) <= 15
       LIMIT 1`,
      [verificationToken, cleanEmail || null, cleanEmail || null, cleanPhone || null, cleanPhone || null]
    );

    if (tokenRecords.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Verification session expired or invalid. Please verify your email again.'
      });
    }

    // Invalidate the token immediately to prevent replay submissions
    await pool.query('UPDATE otp_verifications SET verification_token = NULL WHERE id = ?', [tokenRecords[0].id]);

    // Upsert petitioner
    const cleanName = name.trim();
    const cleanConstituency = constituency ? constituency.trim() : 'Thiruparankundram';

    // Find existing petitioner by email or phone
    const [existingPetitioner] = await pool.query(
      `SELECT id FROM petitioners
       WHERE (? IS NOT NULL AND LOWER(email) = LOWER(?))
          OR (? IS NOT NULL AND phone = ?)
       LIMIT 1`,
      [cleanEmail || null, cleanEmail || null, cleanPhone || null, cleanPhone || null]
    );

    let petitionerId;
    if (existingPetitioner.length > 0) {
      petitionerId = existingPetitioner[0].id;
      await pool.query(
        `UPDATE petitioners
         SET name = ?,
             email = COALESCE(?, email),
             phone = COALESCE(?, phone),
             constituency = ?
         WHERE id = ?`,
        [cleanName, cleanEmail || null, cleanPhone || null, cleanConstituency, petitionerId]
      );
    } else {
      const [insertResult] = await pool.query(
        'INSERT INTO petitioners (email, phone, name, constituency) VALUES (?, ?, ?, ?)',
        [cleanEmail || null, cleanPhone || null, cleanName, cleanConstituency]
      );
      petitionerId = insertResult.insertId;
    }

    // Generate unique petition reference number: CTR-YYYYMM-XXXXXX
    const dateObj = new Date();
    const yearMonth = `${dateObj.getFullYear().toString().slice(-2)}${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const referenceNo = `CTR-${yearMonth}-${randomSuffix}`;

    const cleanSubject = subject.trim();
    const cleanDetails = details.trim();
    const cleanCategory = category ? category.trim() : 'Public Welfare';

    // Insert petition
    const [petitionResult] = await pool.query(
      `INSERT INTO petitions (reference_no, petitioner_id, email, phone, subject, description, category, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Received')`,
      [referenceNo, petitionerId, cleanEmail || null, cleanPhone || null, cleanSubject, cleanDetails, cleanCategory]
    );

    const petitionId = petitionResult.insertId;

    // Record initial status in status history
    await pool.query(
      `INSERT INTO petition_status_history (petition_id, status, comments, updated_by)
       VALUES (?, 'Received', 'Petition registered successfully via Citizen Portal.', 'Constituency Office')`,
      [petitionId]
    );

    // Asynchronously send petition confirmation email if email is provided
    if (cleanEmail) {
      sendPetitionConfirmationEmail({
        to: cleanEmail,
        name: cleanName,
        referenceNo,
        subject: cleanSubject,
        category: cleanCategory
      }).catch((e) => console.warn('[Confirmation Email Error]:', e.message));
    }

    return res.status(201).json({
      success: true,
      message: 'Petition submitted successfully and recorded in the database.',
      referenceNo,
      petition: {
        referenceNo,
        petitionerName: cleanName,
        email: cleanEmail ? maskEmail(cleanEmail) : null,
        phone: cleanPhone ? `+91 ******${cleanPhone.slice(-4)}` : null,
        subject: cleanSubject,
        status: 'Received',
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Submit Petition Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit petition. Please try again.'
    });
  }
});

/**
 * Track Petition: Displays verified tracking info only after OTP verification
 */
app.post('/api/petitions/track', petitionActionLimiter, async (req, res) => {
  try {
    const { verificationToken, referenceNo, email, phone } = req.body;

    if (!verificationToken || typeof verificationToken !== 'string') {
      return res.status(401).json({
        success: false,
        message: 'Security verification required. Please verify via OTP to view petition status.'
      });
    }

    const cleanEmail = sanitizeEmail(email);
    const cleanPhone = sanitizePhone(phone);

    if (!cleanEmail && !cleanPhone) {
      return res.status(400).json({ success: false, message: 'Registered email address or mobile number is required.' });
    }

    if (!referenceNo || typeof referenceNo !== 'string') {
      return res.status(400).json({ success: false, message: 'Petition reference number is required.' });
    }

    const cleanRef = sanitizeReferenceNo(referenceNo);
    if (!cleanRef) {
      return res.status(400).json({ success: false, message: 'Valid petition reference number is required.' });
    }
    const pool = await getPool();

    // Verify token validity for tracking
    const [tokenRecords] = await pool.query(
      `SELECT id FROM otp_verifications
       WHERE verification_token = ?
         AND (
           (? IS NOT NULL AND email = ?)
           OR (? IS NOT NULL AND phone = ?)
         )
         AND purpose IN ('track_petition', 'login')
         AND is_verified = TRUE
         AND TIMESTAMPDIFF(MINUTE, created_at, NOW()) <= 30
       LIMIT 1`,
      [verificationToken, cleanEmail || null, cleanEmail || null, cleanPhone || null, cleanPhone || null]
    );

    if (tokenRecords.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Tracking session expired or unauthorized. Please verify your email again.'
      });
    }

    // Query petition and petitioner details
    let matchQuery = `
      SELECT p.id, p.reference_no, p.subject, p.description, p.category, p.status,
             p.admin_notes, p.created_at, p.updated_at, p.email, p.phone,
             c.name AS petitioner_name, c.constituency
      FROM petitions p
      JOIN petitioners c ON p.petitioner_id = c.id
      WHERE LOWER(p.reference_no) = LOWER(?)
    `;
    const matchParams = [cleanRef];

    if (cleanEmail) {
      matchQuery += ` AND (LOWER(COALESCE(p.email, '')) = LOWER(?) OR LOWER(COALESCE(c.email, '')) = LOWER(?))`;
      matchParams.push(cleanEmail, cleanEmail);
    } else if (cleanPhone) {
      matchQuery += ` AND (p.phone = ? OR c.phone = ?)`;
      matchParams.push(cleanPhone, cleanPhone);
    }

    const [petitions] = await pool.query(matchQuery + ' LIMIT 1', matchParams);

    if (petitions.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No record found for reference number "${cleanRef}" registered to this account.`
      });
    }

    const petition = petitions[0];

    // Query status history timeline
    const [history] = await pool.query(
      `SELECT id, status, comments, updated_by, created_at
       FROM petition_status_history
       WHERE petition_id = ?
       ORDER BY created_at ASC`,
      [petition.id]
    );

    return res.json({
      success: true,
      petition: {
        referenceNo: petition.reference_no,
        subject: petition.subject,
        description: petition.description,
        category: petition.category,
        status: petition.status,
        adminNotes: petition.admin_notes,
        createdAt: petition.created_at,
        updatedAt: petition.updated_at,
        petitionerName: petition.petitioner_name,
        constituency: petition.constituency,
        maskedEmail: petition.email ? maskEmail(petition.email) : null,
        maskedPhone: petition.phone ? `+91 ******${petition.phone.slice(-4)}` : null,
        history: history.map((item) => ({
          status: item.status,
          comments: item.comments,
          updatedBy: item.updated_by,
          date: item.created_at
        }))
      }
    });
  } catch (error) {
    console.error('[Track Petition Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to track petition. Please try again.'
    });
  }
});

/**
 * Citizen Login Petitions: Retrieves all petitions submitted by a verified email
 */
app.post('/api/citizen/my-petitions', petitionActionLimiter, async (req, res) => {
  try {
    const { verificationToken, email } = req.body;
    const cleanEmail = sanitizeEmail(email);

    if (!verificationToken || !cleanEmail) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const pool = await getPool();
    const [tokenRecords] = await pool.query(
      `SELECT id FROM otp_verifications
       WHERE verification_token = ? AND email = ?
         AND is_verified = TRUE
         AND TIMESTAMPDIFF(MINUTE, created_at, NOW()) <= 60
       LIMIT 1`,
      [verificationToken, cleanEmail]
    );

    if (tokenRecords.length === 0) {
      return res.status(403).json({ success: false, message: 'Session expired. Please log in again.' });
    }

    const [petitions] = await pool.query(
      `SELECT p.reference_no, p.subject, p.category, p.status, p.created_at
       FROM petitions p
       LEFT JOIN petitioners c ON p.petitioner_id = c.id
       WHERE LOWER(COALESCE(p.email, '')) = LOWER(?)
          OR LOWER(COALESCE(c.email, '')) = LOWER(?)
       ORDER BY p.id DESC`,
      [cleanEmail, cleanEmail]
    );

    return res.json({
      success: true,
      email: cleanEmail,
      petitions: petitions.map((p) => ({
        referenceNo: p.reference_no,
        subject: p.subject,
        category: p.category,
        status: p.status,
        createdAt: p.created_at
      }))
    });
  } catch (error) {
    console.error('[My Petitions Error]:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Global API error handler ensuring JSON responses
app.use('/api', (err, req, res, next) => {
  console.error('[API Error]:', err);
  return res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error occurred.'
  });
});

// ---------------- STATIC FRONTEND SERVING ---------------- //
const distPath = path.resolve(__dirname, '../dist');
const publicPath = path.resolve(__dirname, '../public');

// Serve compiled static assets from dist/ and public/
app.use(express.static(distPath));
app.use(express.static(publicPath));

// Fallback: for any non-API GET request, serve dist/index.html (Single Page Application)
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: `API route "${req.path}" not found.` });
  }

  const indexPath = path.resolve(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  return res.status(404).send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Frontend Build Required</title>
      </head>
      <body style="font-family:sans-serif;padding:40px;text-align:center;background:#f7f4ed;color:#251914;">
        <h2 style="color:#78221e;">Frontend build not found</h2>
        <p>Please run <code>npm run build</code> in the project directory, or view the live development server on <a href="https://localhost:5173" style="color:#78221e;">https://localhost:5173</a>.</p>
      </body>
    </html>
  `);
});

// Start server immediately on 0.0.0.0 and PORT to guarantee instant port binding on Render
function startServer() {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] CTR Nirmal Kumar Backend API running on port ${PORT}`);
    const smtpStatus = getSmtpStatus();
    console.log(`[SMTP] Status: ${smtpStatus.status} (Host: ${smtpStatus.host}:${smtpStatus.port}, User: ${smtpStatus.senderEmail})`);
  });

  // Render Load Balancer compatibility: keep-alive > 90s prevents 502 Bad Gateway errors
  server.keepAliveTimeout = 120 * 1000;
  server.headersTimeout = 125 * 1000;

  // Initialize database concurrently
  initDatabase().catch((dbErr) => {
    console.error('[Database Error during startup]:', dbErr.message);
  });

  // Graceful shutdown handling for Render zero-downtime deploys
  const gracefulShutdown = (signal) => {
    console.log(`[Server] Received ${signal}, closing server gracefully...`);
    server.close(() => {
      console.log('[Server] HTTP connections closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

startServer();
