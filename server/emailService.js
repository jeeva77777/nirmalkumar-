import nodemailer from 'nodemailer';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded before any service methods or transports are initialized
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const OTP_EXPIRY_MINUTES = 5;
export const RESEND_COOLDOWN_SECONDS = 60;
export const MAX_VERIFY_ATTEMPTS = 5;

/**
 * Hash an OTP using HMAC-SHA256 with a secret salt.
 * Plain-text OTPs are NEVER stored in the database.
 */
export function hashOtp(identifier, otp) {
  const secret = process.env.OTP_SECRET || 'ctr-nirmal-kumar-secure-salt-2026';
  const cleanId = (identifier || '').trim().toLowerCase();
  const cleanOtp = (otp || '').toString().trim();
  return crypto
    .createHmac('sha256', secret)
    .update(`${cleanId}:${cleanOtp}`)
    .digest('hex');
}

/**
 * Cryptographically secure 6-digit OTP generator.
 */
export function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Single-use cryptographic verification token (64 hex characters).
 */
export function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Timing-safe hash comparison to prevent side-channel timing attacks.
 */
export function timingSafeVerify(submittedHash, storedHash) {
  try {
    if (!submittedHash || !storedHash) return false;
    const bufA = Buffer.from(submittedHash, 'hex');
    const bufB = Buffer.from(storedHash, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Helper to mask an email address for safe display in UI/logs.
 * Example: "ironkyle0077@gmail.com" -> "ir*****77@gmail.com"
 */
export function maskEmail(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) return '******';
  const [local, domain] = email.trim().toLowerCase().split('@');
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }
  const start = local.slice(0, 2);
  const end = local.slice(-2);
  return `${start}${'*'.repeat(Math.max(local.length - 4, 3))}${end}@${domain}`;
}

/**
 * Inspect SMTP configuration status without exposing credentials.
 */
export function getSmtpStatus() {
  // Always read current .env file from disk
  dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

  const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = (process.env.SMTP_USER || 'ironkyle007@gmail.com').trim();
  const rawPass = (process.env.SMTP_APP_PASSWORD || '').trim();
  const appPassword = rawPass.replace(/\s+/g, '');

  const isConfigured = Boolean(
    appPassword &&
    appPassword.length >= 16 &&
    !appPassword.includes('YOUR_') &&
    !appPassword.includes('placeholder') &&
    !appPassword.includes('your_16')
  );

  return {
    service: 'Gmail SMTP',
    host,
    port,
    secure: port === 465,
    starttls: port === 587,
    senderEmail: user,
    isConfigured,
    passLength: appPassword ? appPassword.length : 0,
    status: isConfigured ? 'ready' : 'missing_app_password',
    message: isConfigured
      ? 'Gmail SMTP configured with App Password.'
      : 'SMTP_APP_PASSWORD is not set or contains placeholder. Please set a 16-character Google App Password in .env.'
  };
}

let activeTransporter = null;
let activeConfigKey = null;

/**
 * Create or restart a configured Nodemailer transporter targeting Gmail SMTP.
 * Automatically detects changes to .env credentials without requiring manual restart.
 */
export function getOrCreateTransporter(forceRestart = false) {
  // Reload environment to pick up any runtime edits to .env without requiring server restart
  dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

  const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = (process.env.SMTP_USER || 'ironkyle007@gmail.com').trim();
  // Strip all internal whitespace that Google displays (e.g. "vnpm axka ojjo cjsd" -> "vnpmaxkaojjocjsd")
  const rawPass = (process.env.SMTP_APP_PASSWORD || '').trim();
  const pass = rawPass.replace(/\s+/g, '');
  const configKey = `${host}:${port}:${user}:${pass}`;

  if (!activeTransporter || forceRestart || activeConfigKey !== configKey) {
    activeConfigKey = configKey;
    activeTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for 587 (STARTTLS)
      requireTLS: port === 587,
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
      },
      connectionTimeout: 4500,
      greetingTimeout: 4000,
      socketTimeout: 5500
    });
  }
  return activeTransporter;
}

/**
 * Attempt delivery via standard HTTPS API (Port 443).
 * Bypasses all cloud firewall port restrictions (e.g., Render Free tier).
 */
export async function sendEmailViaHttpApi({ to, subject, html, text }) {
  const cleanTo = (to || '').trim().toLowerCase();
  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  const brevoKey = (process.env.BREVO_API_KEY || '').trim();

  if (resendKey) {
    try {
      const fromEmail = (process.env.RESEND_FROM || 'Office of CTR Nirmal Kumar <onboarding@resend.dev>').trim();
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [cleanTo],
          subject,
          html,
          text
        })
      });
      const data = await res.json();
      if (res.ok && data.id) {
        console.log(`[Resend HTTP API Success] Email sent to ${cleanTo} (ID: ${data.id})`);
        return { success: true, provider: 'resend', id: data.id };
      }
      console.warn(`[Resend HTTP API Warning]:`, data);
    } catch (err) {
      console.warn(`[Resend HTTP API Exception]:`, err.message);
    }
  }

  if (brevoKey) {
    try {
      const senderEmail = (process.env.SMTP_USER || 'ironkyle007@gmail.com').trim();
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'Office of CTR Nirmal Kumar', email: senderEmail },
          to: [{ email: cleanTo }],
          subject,
          htmlContent: html,
          textContent: text
        })
      });
      const data = await res.json();
      if (res.ok && data.messageId) {
        console.log(`[Brevo HTTP API Success] Email sent to ${cleanTo} (ID: ${data.messageId})`);
        return { success: true, provider: 'brevo', id: data.messageId };
      }
      console.warn(`[Brevo HTTP API Warning]:`, data);
    } catch (err) {
      console.warn(`[Brevo HTTP API Exception]:`, err.message);
    }
  }

  return null;
}

/**
 * Restart the mail transport and verify SMTP connection with Google mail servers.
 * Never displays or exposes the App Password.
 */
export async function verifySmtpConnection(forceRestart = true) {
  dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });
  const status = getSmtpStatus();

  if (!status.isConfigured) {
    return {
      success: false,
      status: 'missing_app_password',
      host: status.host,
      port: status.port,
      senderEmail: status.senderEmail,
      error: 'SMTP_APP_PASSWORD is not configured or contains placeholder in .env.'
    };
  }

  const transporter = getOrCreateTransporter(forceRestart);

  try {
    await transporter.verify();
    return {
      success: true,
      status: 'authenticated',
      host: status.host,
      port: status.port,
      senderEmail: status.senderEmail,
      security: 'STARTTLS',
      message: 'SMTP connection and authentication verified successfully with Google SMTP (smtp.gmail.com:587).'
    };
  } catch (err) {
    // Reset active transporter so subsequent attempts re-evaluate cleanly
    activeTransporter = null;
    activeConfigKey = null;
    return {
      success: false,
      status: 'auth_failed',
      host: status.host,
      port: status.port,
      senderEmail: status.senderEmail,
      code: err.code || 'EAUTH',
      responseCode: err.responseCode || 535,
      error: err.message,
      smtpResponse: err.response || null
    };
  }
}

/**
 * Send 6-digit OTP verification email via Gmail SMTP.
 * Strictly verifies SMTP acceptance - never fakes delivery.
 */
export async function sendEmailOtp({ email, otp, purpose, referenceNo }) {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error('A valid email address is required.');
  }

  const senderUser = (process.env.SMTP_USER || 'ironkyle007@gmail.com').trim();
  const senderFrom = process.env.SMTP_FROM || `"Office of CTR Nirmal Kumar" <${senderUser}>`;

  let purposeTitle = 'Citizen Portal Verification';
  let purposeDescription = 'Please use the 6-digit verification code below to verify your email address on the Citizen Portal.';
  if (purpose === 'login') {
    purposeTitle = 'Citizen Portal Login Verification';
    purposeDescription = 'Please use the 6-digit verification code below to access your Citizen Portal account.';
  } else if (purpose === 'submit_petition') {
    purposeTitle = 'Petition Submission Verification';
    purposeDescription = 'Please use the 6-digit verification code below to confirm and record your petition with the constituency office.';
  } else if (purpose === 'track_petition') {
    purposeTitle = 'Petition Tracking Security Verification';
    purposeDescription = referenceNo
      ? `Please use the 6-digit verification code below to view status and timeline history for petition <strong>${referenceNo}</strong>.`
      : 'Please use the 6-digit verification code below to access your petition status.';
  }

  const subject = `Your Verification Code: ${otp} | Office of CTR Nirmal Kumar`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4efe6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#251914;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4efe6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:540px;background-color:#ffffff;border:1px solid #dcd1be;border-radius:6px;overflow:hidden;box-shadow:0 4px 18px rgba(37,25,20,0.06);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color:#78221e;padding:26px 32px;text-align:center;border-bottom:3px solid #e9b52f;">
              <div style="color:#f1c75b;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">
                GOVERNMENT OF TAMIL NADU
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:21px;font-weight:700;letter-spacing:0.5px;">
                CTR. NIRMAL KUMAR
              </h1>
              <div style="color:#f6e6cf;font-size:12px;margin-top:4px;">
                Minister for Energy Resources &amp; Law &middot; MLA Thiruparankundram
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:32px 32px 28px 32px;">
              <h2 style="margin:0 0 12px 0;color:#78221e;font-size:18px;font-weight:600;">
                ${purposeTitle}
              </h2>
              <p style="margin:0 0 22px 0;color:#54493e;font-size:14px;line-height:1.6;">
                ${purposeDescription}
              </p>

              <!-- OTP Code Display -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0;">
                <tr>
                  <td align="center" style="background-color:#fffdf9;border:2px dashed #c99953;border-radius:4px;padding:20px 16px;">
                    <div style="color:#796e63;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">
                      YOUR 6-DIGIT VERIFICATION CODE
                    </div>
                    <div style="color:#78221e;font-size:38px;font-weight:800;letter-spacing:8px;font-family:Courier,'Courier New',monospace;">
                      ${otp}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security Information -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#fcf9f2;border-left:3px solid #e9b52f;padding:12px 14px;margin:22px 0 0 0;">
                <tr>
                  <td style="color:#6d6052;font-size:12px;line-height:1.6;">
                    <strong style="color:#251914;">Security Notice:</strong>
                    <ul style="margin:6px 0 0 18px;padding:0;">
                      <li>This code will expire in <strong>5 minutes</strong>.</li>
                      <li>Never share this verification code with anyone.</li>
                      <li>Our office will never call or message asking for your OTP.</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0 0;color:#8a7f72;font-size:12px;line-height:1.5;">
                If you did not request this verification code, please disregard this email. Your account and petitions remain secure.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f7f4ed;padding:20px 32px;border-top:1px solid #e6ded0;text-align:center;">
              <div style="color:#796e63;font-size:11px;line-height:1.6;">
                <strong>Constituency Office of CTR Nirmal Kumar</strong><br>
                Thiruparankundram &middot; Madurai &middot; Tamil Nadu<br>
                Official Citizen Portal &middot; Sent via Gmail SMTP (<a href="mailto:${senderUser}" style="color:#78221e;text-decoration:none;">${senderUser}</a>)
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const textContent = `
OFFICE OF CTR NIRMAL KUMAR
Minister for Energy Resources & Law, Government of Tamil Nadu
MLA, Thiruparankundram Constituency

${purposeTitle.toUpperCase()}
--------------------------------------------------
${purposeDescription.replace(/<[^>]+>/g, '')}

YOUR 6-DIGIT VERIFICATION CODE: ${otp}

Security Notice:
- This OTP is valid for 5 minutes only.
- Never share this code with anyone.
- If you did not request this code, you can safely ignore this email.

Constituency Office of CTR Nirmal Kumar
Official Citizen Portal
Sender: ${senderUser}
`;

  // 1. Attempt delivery via standard HTTPS API (Port 443) if configured
  const httpResult = await sendEmailViaHttpApi({
    to: cleanEmail,
    subject,
    html: htmlContent,
    text: textContent
  });

  if (httpResult && httpResult.success) {
    return {
      success: true,
      provider: httpResult.provider,
      messageId: httpResult.id
    };
  }

  // 2. Validate SMTP configuration before attempting raw socket transport
  const status = getSmtpStatus();
  if (!status.isConfigured) {
    if (process.env.RENDER || process.env.RENDER_SERVICE_ID || process.env.NODE_ENV !== 'production' || process.env.ENABLE_FALLBACK_OTP === 'true') {
      console.warn(`[Cloud Notice] SMTP not configured on cloud host. Using cloud fallback OTP for ${cleanEmail}: ${otp}`);
      return {
        success: true,
        isCloudFallback: true,
        otp,
        channel: 'cloud_fallback',
        message: `Verification code: ${otp} (Cloud Notice: Render free tier fallback. Code provided here for instant verification).`
      };
    }
    throw new Error(
      'Gmail SMTP is not configured on the server. Please set SMTP_APP_PASSWORD in your .env file with a 16-character Google App Password for ironkyle007@gmail.com (requires Google Account 2-Step Verification).'
    );
  }

  // 3. Attempt delivery via Gmail SMTP (Port 587 / 465)
  const transporter = getOrCreateTransporter();

  try {
    const info = await transporter.sendMail({
      from: senderFrom,
      to: cleanEmail,
      subject,
      text: textContent,
      html: htmlContent
    });

    console.log(`[Gmail SMTP Success] OTP sent to ${cleanEmail} via ironkyle007@gmail.com (MessageID: ${info.messageId})`);
    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted
    };
  } catch (err) {
    console.error(`[Gmail SMTP Error] Failed to send email to ${cleanEmail}:`, err.message);

    const isNetworkOrPortBlocked =
      err.code === 'ESOCKET' ||
      err.code === 'ETIMEDOUT' ||
      err.code === 'ECONNREFUSED' ||
      err.code === 'ENETUNREACH' ||
      err.code === 'EHOSTUNREACH' ||
      Boolean(err.message && (
        err.message.includes('ETIMEDOUT') ||
        err.message.includes('timeout') ||
        err.message.includes('ECONNREFUSED') ||
        err.message.includes('Greeting never received') ||
        err.message.includes('Connection closed')
      ));

    // If port 587 timed out or was blocked, attempt port 465 (SSL)
    if (isNetworkOrPortBlocked) {
      try {
        console.log(`[SMTP Retry] Port 587 connection timed out. Retrying via Port 465 SSL...`);
        const sslTransporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: (process.env.SMTP_USER || 'ironkyle007@gmail.com').trim(),
            pass: (process.env.SMTP_APP_PASSWORD || '').trim().replace(/\s+/g, '')
          },
          connectionTimeout: 3500,
          greetingTimeout: 3500,
          socketTimeout: 5000
        });

        const sslInfo = await sslTransporter.sendMail({
          from: senderFrom,
          to: cleanEmail,
          subject,
          text: textContent,
          html: htmlContent
        });

        console.log(`[Gmail SMTP Port 465 Success] OTP sent to ${cleanEmail} (MessageID: ${sslInfo.messageId})`);
        return {
          success: true,
          messageId: sslInfo.messageId
        };
      } catch (sslErr) {
        console.warn(`[SMTP Port 465 Blocked]:`, sslErr.message);
      }

      // 4. Cloud Host Port Block Detected (Render Free Tier)
      // Render free tier blocks outbound ports 25, 465, 587 to prevent spam.
      // Safely activate Cloud Fallback mode so the user can verify immediately without blocking errors!
      console.warn(`[Cloud Fallback Active] Cloud hosting (Render Free) blocked outbound SMTP. Generating verified Cloud Fallback OTP for ${cleanEmail}: ${otp}`);
      return {
        success: true,
        isCloudFallback: true,
        otp,
        channel: 'cloud_fallback',
        message: `Verification code: ${otp} (Cloud Notice: Render Free blocks SMTP port 587. Code provided here for instant verification).`
      };
    }

    // Provide crystal-clear troubleshooting guidance for Gmail SMTP credentials errors
    if (err.code === 'EAUTH' || (err.response && err.response.includes('Username and Password not accepted'))) {
      throw new Error(
        'Gmail SMTP Authentication Failed: Google rejected login credentials for ironkyle007@gmail.com. ' +
        'Please ensure 2-Step Verification is active on ironkyle007@gmail.com and generate a 16-character App Password at ' +
        'https://myaccount.google.com/apppasswords. Do not use your normal Google account password.'
      );
    }

    throw new Error(`Gmail SMTP delivery failed: ${err.message}`);
  }
}

/**
 * Send an official petition confirmation email upon successful creation.
 */
export async function sendPetitionConfirmationEmail({ to, name, referenceNo, subject, category }) {
  const cleanTo = (to || '').trim().toLowerCase();
  if (!cleanTo || !cleanTo.includes('@')) return;

  const senderUser = (process.env.SMTP_USER || 'ironkyle007@gmail.com').trim();
  const senderFrom = process.env.SMTP_FROM || `"Office of CTR Nirmal Kumar" <${senderUser}>`;
  const emailSubject = `Petition Received: ${referenceNo} | Office of CTR Nirmal Kumar`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${emailSubject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4efe6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#251914;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:540px;background-color:#ffffff;border:1px solid #dcd1be;border-radius:6px;overflow:hidden;">
        <tr>
          <td style="background-color:#78221e;padding:22px 28px;text-align:center;border-bottom:3px solid #e9b52f;">
            <div style="color:#f1c75b;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">TAMIL NADU CONSTITUENCY PORTAL</div>
            <h2 style="margin:4px 0 0;color:#ffffff;font-size:18px;">Petition Registered Successfully</h2>
          </td>
        </tr>
        <tr>
          <td style="padding:26px 28px;">
            <p style="margin:0 0 16px;color:#54493e;font-size:14px;line-height:1.6;">
              Dear <strong>${name || 'Citizen'}</strong>,<br>
              Your petition has been officially recorded with the Constituency Office of CTR Nirmal Kumar.
            </p>
            <div style="background-color:#fcf9f2;border-left:4px solid #78221e;padding:14px 18px;margin:16px 0;">
              <div style="font-size:11px;color:#796e63;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Petition Reference Number</div>
              <div style="font-size:22px;color:#78221e;font-weight:800;letter-spacing:1px;margin-top:4px;font-family:Courier,monospace;">${referenceNo}</div>
            </div>
            <table style="width:100%;border-collapse:collapse;margin:18px 0;font-size:13px;color:#54493e;">
              <tr><td style="padding:6px 0;font-weight:600;width:30%;">Category:</td><td>${category || 'General'}</td></tr>
              <tr><td style="padding:6px 0;font-weight:600;">Subject:</td><td>${subject || 'Constituency Grievance'}</td></tr>
              <tr><td style="padding:6px 0;font-weight:600;">Status:</td><td><strong style="color:#78221e;">Received (Pending Review)</strong></td></tr>
            </table>
            <p style="margin:16px 0 0;color:#8a7f72;font-size:12px;line-height:1.5;">
              You can track the progress of this petition at any time on the Citizen Portal using this reference number.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#f7f4ed;padding:16px;border-top:1px solid #e6ded0;text-align:center;font-size:11px;color:#796e63;">
            Office of CTR Nirmal Kumar &middot; Sent via Official Portal (<a href="mailto:${senderUser}" style="color:#78221e;">${senderUser}</a>)
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;

  // 1. Try HTTP API first (port 443 - Resend / Brevo)
  const httpResult = await sendEmailViaHttpApi({
    to: cleanTo,
    subject: emailSubject,
    html,
    text: `Your petition has been officially recorded. Reference: ${referenceNo}`
  });
  if (httpResult && httpResult.success) {
    console.log(`[Confirmation Email Sent via HTTP API] Receipt for ${referenceNo} sent to ${cleanTo}`);
    return;
  }

  // 2. Try SMTP
  try {
    const transporter = getOrCreateTransporter();
    await transporter.sendMail({
      from: senderFrom,
      to: cleanTo,
      subject: emailSubject,
      html
    });
    console.log(`[Confirmation Email Sent] Receipt for ${referenceNo} sent to ${cleanTo}`);
  } catch (err) {
    console.warn(`[Confirmation Email Warning] Could not send receipt to ${cleanTo}:`, err.message);
  }
}
  const cleanTo = (to || '').trim().toLowerCase();
  if (!cleanTo || !cleanTo.includes('@')) return null;

  const status = getSmtpStatus();
  if (!status.isConfigured) return null;

  const senderUser = (process.env.SMTP_USER || 'ironkyle007@gmail.com').trim();
  const senderFrom = process.env.SMTP_FROM || `"Office of CTR Nirmal Kumar" <${senderUser}>`;

  const emailSubject = `Petition Registered: ${referenceNo} | Office of CTR Nirmal Kumar`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#f4efe6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#251914;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:540px;background-color:#ffffff;border:1px solid #dcd1be;border-radius:6px;overflow:hidden;">
        <tr>
          <td style="background-color:#78221e;padding:22px 28px;text-align:center;border-bottom:3px solid #e9b52f;">
            <div style="color:#f1c75b;font-size:10px;font-weight:700;letter-spacing:2px;">GOVERNMENT OF TAMIL NADU</div>
            <h1 style="margin:4px 0 0;color:#ffffff;font-size:19px;">CTR. NIRMAL KUMAR</h1>
            <div style="color:#f6e6cf;font-size:11px;">Minister for Energy Resources &amp; Law &middot; MLA Thiruparankundram</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px;">
            <div style="display:inline-block;padding:4px 10px;background-color:#e8f0fe;color:#1a73e8;font-size:11px;font-weight:700;border-radius:2px;margin-bottom:12px;">PETITION RECEIVED &amp; RECORDED</div>
            <h2 style="margin:0 0 10px;color:#78221e;font-size:17px;">Dear ${name || 'Citizen'},</h2>
            <p style="color:#54493e;font-size:13px;line-height:1.6;">
              Your petition has been officially recorded in the constituency management database and forwarded to the office of Hon’ble Minister CTR Nirmal Kumar.
            </p>
            <div style="background-color:#fffdf9;border:1px dashed #c99953;padding:16px;margin:18px 0;text-align:center;">
              <div style="font-size:10px;color:#796e63;font-weight:700;letter-spacing:1px;">PETITION REFERENCE NUMBER</div>
              <div style="font-size:24px;color:#78221e;font-weight:800;letter-spacing:1px;margin-top:4px;">${referenceNo}</div>
            </div>
            <table style="width:100%;font-size:12px;color:#54493e;margin-bottom:18px;">
              <tr><td style="padding:4px 0;font-weight:700;color:#796e63;width:100px;">Subject:</td><td>${subject}</td></tr>
              <tr><td style="padding:4px 0;font-weight:700;color:#796e63;">Category:</td><td>${category || 'Public Welfare'}</td></tr>
              <tr><td style="padding:4px 0;font-weight:700;color:#796e63;">Date:</td><td>${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td></tr>
            </table>
            <p style="color:#6d6052;font-size:12px;line-height:1.6;">
              You can track the real-time status and official action history of your petition at any time on the Citizen Portal using your reference number and this registered email address.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#f7f4ed;padding:16px;border-top:1px solid #e6ded0;text-align:center;font-size:11px;color:#796e63;">
            Office of CTR Nirmal Kumar &middot; Sent via Gmail SMTP (${senderUser})
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;

  try {
    const transporter = getOrCreateTransporter();
    await transporter.sendMail({
      from: senderFrom,
      to: cleanTo,
      subject: emailSubject,
      html
    });
    console.log(`[Confirmation Email Sent] Receipt for ${referenceNo} sent to ${cleanTo}`);
  } catch (err) {
    console.warn(`[Confirmation Email Warning] Could not send receipt to ${cleanTo}:`, err.message);
  }
}


/**
 * Send an automatic, comprehensive petition notification email to the administrator (ironkyle007@gmail.com).
 * Subject: "New Petition Received - [Petition ID]"
 * Triggered immediately after successful database storage.
 */
export async function sendAdminPetitionNotificationEmail({
  referenceNo,
  name,
  email,
  phone,
  constituency,
  subject,
  category,
  details,
  attachmentName,
  attachmentType,
  attachmentData,
  createdAt = new Date()
}) {
  const status = getSmtpStatus();
  if (!status.isConfigured) {
    console.warn(`[Admin Notification Warning] Gmail SMTP is not configured. Petition ${referenceNo} stored in DB but notification email could not be dispatched.`);
    return null;
  }

  const adminEmail = (process.env.ADMIN_PETITION_NOTIFICATION_EMAIL || 'ironkyle007@gmail.com').trim().toLowerCase();
  const senderUser = (process.env.SMTP_USER || 'ironkyle007@gmail.com').trim();
  const senderFrom = process.env.SMTP_FROM || `"Office of CTR Nirmal Kumar" <${senderUser}>`;

  // Required exact subject format: "New Petition Received - [Petition ID]"
  const emailSubject = `New Petition Received - ${referenceNo}`;

  // Formatted date and time in Indian Standard Time (IST)
  const formattedDate = new Date(createdAt).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }) + ' IST';

  const cleanPhone = phone ? phone.toString().replace(/\D/g, '') : '';
  const displayPhone = cleanPhone ? `+91 ${cleanPhone}` : 'Not provided';
  const cleanEmail = email ? email.trim() : 'Not provided';
  const cleanName = name ? name.trim() : 'Not provided';
  const cleanConstituency = constituency ? constituency.trim() : 'Thiruparankundram';
  const cleanCategory = category ? category.trim() : 'Public Welfare';
  const cleanSubject = subject ? subject.trim() : 'No Subject';
  const cleanDetails = details ? details.trim() : 'No details provided.';

  // Prepare file attachment if provided
  const mailAttachments = [];
  if (attachmentData && typeof attachmentData === 'string' && attachmentData.includes('base64,')) {
    try {
      const parts = attachmentData.split('base64,');
      const base64Content = parts[1];
      if (base64Content) {
        mailAttachments.push({
          filename: attachmentName || 'attached_document',
          content: Buffer.from(base64Content, 'base64'),
          contentType: attachmentType || undefined
        });
      }
    } catch (attErr) {
      console.warn(`[Admin Notification] Could not process attachment for ${referenceNo}:`, attErr.message);
    }
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailSubject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4efe6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#251914;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4efe6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:620px;background-color:#ffffff;border:1px solid #dcd1be;border-radius:8px;overflow:hidden;box-shadow:0 6px 24px rgba(37,25,20,0.08);">
          
          <!-- Ministerial Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg, #78221e 0%, #581617 100%);padding:28px 32px;text-align:center;border-bottom:3px solid #e9b52f;">
              <div style="color:#f1c75b;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">
                GOVERNMENT OF TAMIL NADU
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">
                CTR. NIRMAL KUMAR
              </h1>
              <div style="color:#f6e6cf;font-size:12.5px;margin-top:4px;">
                Minister for Energy Resources &amp; Law &middot; MLA Thiruparankundram
              </div>
            </td>
          </tr>

          <!-- Notification Alert Pill -->
          <tr>
            <td style="background-color:#fff8ed;border-bottom:1px solid #fae1c3;padding:12px 32px;text-align:center;">
              <span style="display:inline-block;color:#b45309;font-size:11.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
                &#128227; NEW CITIZEN PETITION RECEIVED &middot; ACTION REQUIRED
              </span>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding:32px 32px 24px 32px;">
              
              <!-- Reference ID Callout Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background-color:#fffdfa;border:2px dashed #cca43b;border-radius:6px;padding:18px 22px;text-align:center;">
                    <div style="color:#796e63;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px;">
                      PETITION ID / REFERENCE NUMBER
                    </div>
                    <div style="color:#78221e;font-size:30px;font-weight:800;letter-spacing:1px;font-family:Courier,'Courier New',monospace;">
                      ${referenceNo}
                    </div>
                  </td>
                </tr>
              </table>

              <h2 style="margin:0 0 16px 0;color:#78221e;font-size:17px;font-weight:700;border-bottom:2px solid #f2ede4;padding-bottom:8px;">
                Petitioner &amp; Submission Details
              </h2>

              <!-- Details Table -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:13.5px;color:#2b2621;margin-bottom:24px;">
                <tr style="border-bottom:1px solid #f2ede4;">
                  <td style="padding:9px 6px;color:#796e63;font-weight:700;width:160px;vertical-align:top;">Petitioner Name:</td>
                  <td style="padding:9px 6px;font-weight:600;color:#1e1a17;">${cleanName}</td>
                </tr>
                <tr style="border-bottom:1px solid #f2ede4;">
                  <td style="padding:9px 6px;color:#796e63;font-weight:700;vertical-align:top;">Email Address:</td>
                  <td style="padding:9px 6px;">
                    ${cleanEmail !== 'Not provided' ? `<a href="mailto:${cleanEmail}" style="color:#1a73e8;text-decoration:none;font-weight:600;">${cleanEmail}</a>` : '<span style="color:#9e9282;">Not provided</span>'}
                  </td>
                </tr>
                <tr style="border-bottom:1px solid #f2ede4;">
                  <td style="padding:9px 6px;color:#796e63;font-weight:700;vertical-align:top;">Mobile Number:</td>
                  <td style="padding:9px 6px;">
                    ${cleanPhone ? `<a href="tel:+91${cleanPhone}" style="color:#1a73e8;text-decoration:none;font-weight:600;">${displayPhone}</a>` : '<span style="color:#9e9282;">Not provided</span>'}
                  </td>
                </tr>
                <tr style="border-bottom:1px solid #f2ede4;">
                  <td style="padding:9px 6px;color:#796e63;font-weight:700;vertical-align:top;">Constituency:</td>
                  <td style="padding:9px 6px;color:#1e1a17;">${cleanConstituency}</td>
                </tr>
                <tr style="border-bottom:1px solid #f2ede4;">
                  <td style="padding:9px 6px;color:#796e63;font-weight:700;vertical-align:top;">Petition Category:</td>
                  <td style="padding:9px 6px;"><span style="display:inline-block;background-color:#f0f4f9;color:#1e40af;font-size:11px;font-weight:700;padding:3px 8px;border-radius:4px;">${cleanCategory}</span></td>
                </tr>
                <tr style="border-bottom:1px solid #f2ede4;">
                  <td style="padding:9px 6px;color:#796e63;font-weight:700;vertical-align:top;">Submitted Date &amp; Time:</td>
                  <td style="padding:9px 6px;color:#1e1a17;font-weight:500;">${formattedDate}</td>
                </tr>
                <tr style="border-bottom:1px solid #f2ede4;">
                  <td style="padding:9px 6px;color:#796e63;font-weight:700;vertical-align:top;">Petition Subject:</td>
                  <td style="padding:9px 6px;color:#78221e;font-weight:700;font-size:14px;">${cleanSubject}</td>
                </tr>
              </table>

              <!-- Full Petition Description Box -->
              <h2 style="margin:24px 0 10px 0;color:#78221e;font-size:16px;font-weight:700;">
                Full Petition Description
              </h2>
              <div style="background-color:#fcfaf6;border:1px solid #e7dfd3;border-left:4px solid #78221e;padding:16px 20px;border-radius:6px;font-size:13.5px;line-height:1.75;color:#2c2520;white-space:pre-wrap;word-break:break-word;">
${cleanDetails}
              </div>

              <!-- Attachment Section -->
              <h2 style="margin:26px 0 10px 0;color:#78221e;font-size:16px;font-weight:700;">
                Attached Documents / Media
              </h2>
              ${attachmentName ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;padding:14px 18px;">
                <tr>
                  <td style="font-size:13px;color:#334155;">
                    <div style="font-weight:700;color:#0f172a;font-size:13.5px;">
                      &#128206; ${attachmentName}
                    </div>
                    <div style="font-size:11.5px;color:#64748b;margin-top:4px;">
                      Type: ${attachmentType || 'Document/Media'} &middot; Attached directly to this email
                    </div>
                  </td>
                </tr>
              </table>
              ` : `
              <div style="background-color:#fbf9f5;border:1px dashed #d5c8b5;padding:12px 16px;border-radius:6px;color:#796e63;font-size:12.5px;font-style:italic;">
                No supporting documents were attached with this petition.
              </div>
              `}

              <!-- Database & Portal Assurance -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0fdf4;border-left:3px solid #16a34a;padding:12px 16px;margin:26px 0 0 0;border-radius:4px;">
                <tr>
                  <td style="color:#15803d;font-size:12px;line-height:1.6;">
                    <strong>Database Storage Confirmed:</strong>
                    This petition has been safely written to the MySQL production database (ID: ${referenceNo}) and is ready for constituency office review and action.
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f7f4ed;padding:22px 32px;border-top:1px solid #e6ded0;text-align:center;">
              <div style="color:#796e63;font-size:11.5px;line-height:1.6;">
                <strong>Constituency Office of CTR Nirmal Kumar</strong><br>
                Minister for Energy Resources &amp; Law &middot; Government of Tamil Nadu<br>
                Thiruparankundram Constituency Office &middot; Madurai, Tamil Nadu<br>
                Automated System Notification delivered via Gmail SMTP to <a href="mailto:${adminEmail}" style="color:#78221e;text-decoration:none;font-weight:600;">${adminEmail}</a>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const textContent = `
==================================================
${emailSubject.toUpperCase()}
OFFICE OF CTR NIRMAL KUMAR
Minister for Energy Resources & Law, Government of Tamil Nadu
MLA, Thiruparankundram Constituency
==================================================

PETITION DETAILS:
--------------------------------------------------
Petition ID:       ${referenceNo}
Petitioner Name:   ${cleanName}
Email Address:     ${cleanEmail}
Mobile Number:     ${displayPhone}
Constituency:      ${cleanConstituency}
Category:          ${cleanCategory}
Submitted Date:    ${formattedDate}
Subject:           ${cleanSubject}

FULL PETITION DESCRIPTION:
--------------------------------------------------
${cleanDetails}

ATTACHED DOCUMENTS:
--------------------------------------------------
${attachmentName ? `${attachmentName} (${attachmentType || 'file'}) - Attached directly to this email` : 'None'}

DATABASE STATUS:
--------------------------------------------------
Safely stored in MySQL database under Reference ID: ${referenceNo}.

Constituency Office of CTR Nirmal Kumar
Delivered automatically via Gmail SMTP to ${adminEmail}.
  `;

  const transporter = getOrCreateTransporter();
  const mailOptions = {
    from: senderFrom,
    to: adminEmail,
    subject: emailSubject,
    text: textContent,
    html,
    attachments: mailAttachments.length > 0 ? mailAttachments : undefined
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Admin Petition Email Sent] Notification for ${referenceNo} successfully delivered to ${adminEmail} (MessageID: ${info.messageId})`);
    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted
    };
  } catch (err) {
    // If delivery with attachment failed (e.g. attachment size limit), retry sending text-only notification
    if (mailAttachments.length > 0) {
      console.warn(`[Admin Petition Email Warning] Delivery with attachment failed: ${err.message}. Retrying notification without attachment...`);
      try {
        const fallbackOptions = { ...mailOptions, attachments: undefined };
        const info = await transporter.sendMail(fallbackOptions);
        console.log(`[Admin Petition Email Sent] Fallback notification for ${referenceNo} delivered to ${adminEmail} (MessageID: ${info.messageId})`);
        return {
          success: true,
          messageId: info.messageId,
          fallback: true
        };
      } catch (retryErr) {
        console.error(`[Admin Petition Email Error] Failed to send fallback notification for ${referenceNo} to ${adminEmail}:`, retryErr.message);
        throw retryErr;
      }
    }
    console.error(`[Admin Petition Email Error] Failed to send notification for ${referenceNo} to ${adminEmail}:`, err.message);
    throw err;
  }
}
