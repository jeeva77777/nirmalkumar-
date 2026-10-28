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
      connectionTimeout: 12000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    });
  }
  return activeTransporter;
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

  const status = getSmtpStatus();
  if (!status.isConfigured) {
    throw new Error(
      'Gmail SMTP is not configured on the server. Please set SMTP_APP_PASSWORD in your .env file with a 16-character Google App Password for ironkyle007@gmail.com (requires Google Account 2-Step Verification).'
    );
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

    // Provide crystal-clear troubleshooting guidance for Gmail SMTP errors
    if (err.code === 'EAUTH' || (err.response && err.response.includes('Username and Password not accepted'))) {
      throw new Error(
        'Gmail SMTP Authentication Failed: Google rejected login credentials for ironkyle007@gmail.com. ' +
        'Please ensure 2-Step Verification is active on ironkyle007@gmail.com and generate a 16-character App Password at ' +
        'https://myaccount.google.com/apppasswords. Do not use your normal Google account password.'
      );
    }

    if (err.code === 'ESOCKET' || err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
      throw new Error(
        `Gmail SMTP Connection Failed (${err.code}): Unable to connect to smtp.gmail.com:587. ` +
        'Please check your network connection and ensure outbound port 587 (STARTTLS) is not blocked.'
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
