import crypto from 'crypto';
import twilio from 'twilio';
import https from 'https';

const OTP_SECRET = process.env.OTP_SECRET || 'ctr-nirmal-kumar-secret-key-salt-2026';
const OTP_EXPIRY_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_VERIFY_ATTEMPTS = 5;

// Hash OTP with salt using HMAC SHA-256
export function hashOtp(phone, otp) {
  return crypto
    .createHmac('sha256', OTP_SECRET)
    .update(`${phone}:${otp}`)
    .digest('hex');
}

// Generate secure 6-digit OTP
export function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

// Generate single-use verification token
export function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Check provider configuration
export function getSmsProviderInfo() {
  const provider = (process.env.SMS_PROVIDER || 'twilio').toLowerCase();
  const hasTwilio = Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    !process.env.TWILIO_ACCOUNT_SID.includes('YOUR_') &&
    process.env.TWILIO_AUTH_TOKEN &&
    !process.env.TWILIO_AUTH_TOKEN.includes('YOUR_') &&
    process.env.TWILIO_PHONE_NUMBER &&
    !process.env.TWILIO_PHONE_NUMBER.includes('YOUR_')
  );

  const hasMsg91 = Boolean(
    process.env.MSG91_AUTH_KEY &&
    !process.env.MSG91_AUTH_KEY.includes('YOUR_') &&
    process.env.MSG91_TEMPLATE_ID &&
    !process.env.MSG91_TEMPLATE_ID.includes('YOUR_')
  );

  const devMode = process.env.OTP_DEV_MODE === 'true' && process.env.NODE_ENV !== 'production';

  return {
    provider,
    isConfigured: provider === 'twilio' ? hasTwilio : provider === 'msg91' ? hasMsg91 : false,
    devMode,
    configuredProvider: hasTwilio ? 'twilio' : hasMsg91 ? 'msg91' : null
  };
}

/**
 * Send real SMS OTP to Indian mobile number using Twilio or MSG91
 */
export async function sendOtpSms(phone, otp, purpose) {
  const provider = (process.env.SMS_PROVIDER || 'twilio').toLowerCase();
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevMode = process.env.OTP_DEV_MODE === 'true' && !isProduction;

  // Format phone to E.164 (+91XXXXXXXXXX)
  const normalizedPhone = phone.startsWith('+91') ? phone : `+91${phone.replace(/\D/g, '')}`;
  const purposeText = purpose === 'submit_petition' ? 'Petition Submission' : 'Petition Tracking';
  const messageBody = `Your OTP for CTR Nirmal Kumar Citizen Portal (${purposeText}) is ${otp}. Valid for 5 minutes. Do not share this code with anyone.`;

  // Real Twilio Delivery
  if (provider === 'twilio') {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber || accountSid.includes('YOUR_')) {
      if (isDevMode) {
        console.warn(`[SMS DEV MODE] Twilio credentials not set. DEV OTP for ${normalizedPhone}: [${otp}]`);
        return { success: true, devMode: true, message: 'OTP generated in development mode (logged to server console).' };
      }
      throw new Error(
        'SMS Provider Error: Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER) are missing or incomplete in .env. Please configure real SMS credentials.'
      );
    }

    try {
      const client = twilio(accountSid, authToken);
      const message = await client.messages.create({
        body: messageBody,
        from: fromNumber,
        to: normalizedPhone
      });

      console.log(`[SMS Delivered] Sent real OTP to ${normalizedPhone} via Twilio SID: ${message.sid}`);
      return { success: true, sid: message.sid };
    } catch (err) {
      console.error(`[Twilio Error] Failed to send SMS to ${normalizedPhone}:`, err.message);
      if (isDevMode) {
        console.warn(`[SMS DEV FALLBACK] Real SMS failed (${err.message}). DEV OTP for ${normalizedPhone}: [${otp}]`);
        return { success: true, devMode: true, warning: err.message };
      }
      throw new Error(`Failed to deliver SMS via Twilio: ${err.message}`);
    }
  }

  // Real MSG91 Delivery
  if (provider === 'msg91') {
    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;
    const senderId = process.env.MSG91_SENDER_ID || 'CTRNKL';

    if (!authKey || !templateId || authKey.includes('YOUR_')) {
      if (isDevMode) {
        console.warn(`[SMS DEV MODE] MSG91 credentials not set. DEV OTP for ${normalizedPhone}: [${otp}]`);
        return { success: true, devMode: true, message: 'OTP generated in development mode (logged to server console).' };
      }
      throw new Error(
        'SMS Provider Error: MSG91 credentials (MSG91_AUTH_KEY, MSG91_TEMPLATE_ID) are missing or incomplete in .env. Please configure real SMS credentials.'
      );
    }

    // Call MSG91 Send OTP API
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        template_id: templateId,
        mobile: normalizedPhone.replace('+', ''),
        authkey: authKey,
        otp: otp,
        sender: senderId
      });

      const options = {
        hostname: 'control.msg91.com',
        port: 443,
        path: '/api/v5/otp',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          authkey: authKey
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode === 200 && parsed.type !== 'error') {
              console.log(`[MSG91 Delivered] Sent OTP to ${normalizedPhone}:`, parsed.message);
              resolve({ success: true, response: parsed });
            } else {
              reject(new Error(parsed.message || `MSG91 failed with HTTP ${res.statusCode}`));
            }
          } catch (e) {
            reject(new Error(`Failed to parse MSG91 response: ${data}`));
          }
        });
      });

      req.on('error', (e) => reject(e));
      req.write(postData);
      req.end();
    });
  }

  throw new Error(`Unsupported SMS_PROVIDER "${provider}". Supported providers: twilio, msg91.`);
}

export { OTP_EXPIRY_MINUTES, RESEND_COOLDOWN_SECONDS, MAX_VERIFY_ATTEMPTS };
