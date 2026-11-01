import { mongoService } from './mongodb.ts';
import { twilioService } from './twilioService.ts';

export interface OTPRecord {
  id: string;
  phone: string;
  code: string;
  customerId?: string;
  orderId?: string;
  createdAt: string;
  expiresAt: string; // 5 minutes TTL
  verified: boolean;
  attempts: number;
}

export interface SessionAuthStatus {
  phone: string;
  authenticated: boolean;
  authenticatedAt?: string;
  authenticatedUntil?: string; // 15 minutes validity
}

// In-Memory fallback store
const otpStore = new Map<string, OTPRecord>();
const authSessionStore = new Map<string, SessionAuthStatus>();

function formatPhone(phone: string): string {
  let clean = phone.replace(/[\s\-\(\)]/g, '');
  if (!clean.startsWith('+')) {
    if (clean.length === 10) clean = `+91${clean}`;
    else clean = `+${clean}`;
  }
  return clean;
}

/**
 * Generate 6-digit OTP, store in MongoDB with 5-min expiration, and dispatch SMS
 */
export async function generateAndSendOtp(params: {
  phone: string;
  customerId?: string;
  orderId?: string;
}): Promise<{
  success: boolean;
  phone: string;
  expiresAt: string;
  messageSid?: string;
  simulatedCode?: string; // Included for instant dev sandbox testing
}> {
  const formattedPhone = formatPhone(params.phone);
  
  // Generate random 6-digit numeric OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 5 * 60 * 1000).toISOString(); // 5 minutes TTL

  const record: OTPRecord = {
    id: `otp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    phone: formattedPhone,
    code,
    customerId: params.customerId,
    orderId: params.orderId,
    createdAt: now.toISOString(),
    expiresAt,
    verified: false,
    attempts: 0,
  };

  // Save to Memory & MongoDB
  otpStore.set(formattedPhone, record);
  await mongoService.saveOtpRecord(record);

  // Dispatch SMS via Twilio Messaging API
  const smsResult = await twilioService.sendOtpSms(formattedPhone, code);

  return {
    success: true,
    phone: formattedPhone,
    expiresAt,
    messageSid: smsResult.messageSid,
    simulatedCode: code,
  };
}

/**
 * Verify 6-digit OTP code with 5-minute expiration & attempt tracking
 */
export async function verifyOtpCode(params: {
  phone: string;
  code: string;
}): Promise<{
  success: boolean;
  message: string;
  authenticatedUntil?: string;
}> {
  const formattedPhone = formatPhone(params.phone);
  const cleanCode = params.code.trim();

  // Retrieve record
  let record = otpStore.get(formattedPhone);
  if (!record) {
    const mongoDoc = await mongoService.getOtpRecord(formattedPhone);
    if (mongoDoc) record = mongoDoc as OTPRecord;
  }

  if (!record) {
    return {
      success: false,
      message: 'No active OTP verification code found for this phone number. Please request a new code.',
    };
  }

  // Check 5-minute expiration
  const nowMs = Date.now();
  const expiresMs = new Date(record.expiresAt).getTime();
  if (nowMs > expiresMs) {
    return {
      success: false,
      message: 'The verification code has expired (5-minute validity). Please request a new OTP.',
    };
  }

  // Check attempts limit (max 3)
  if (record.attempts >= 3) {
    return {
      success: false,
      message: 'Maximum verification attempts exceeded. Please request a new OTP code.',
    };
  }

  // Check code match
  if (record.code !== cleanCode) {
    record.attempts += 1;
    otpStore.set(formattedPhone, record);
    await mongoService.saveOtpRecord(record);

    const remainingAttempts = 3 - record.attempts;
    return {
      success: false,
      message: `Invalid verification code. ${remainingAttempts} attempt(s) remaining.`,
    };
  }

  // Code match success! Mark verified
  record.verified = true;
  otpStore.set(formattedPhone, record);
  await mongoService.saveOtpRecord(record);

  // Authenticate session for 15 minutes
  const authUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  authSessionStore.set(formattedPhone, {
    phone: formattedPhone,
    authenticated: true,
    authenticatedAt: new Date().toISOString(),
    authenticatedUntil: authUntil,
  });

  return {
    success: true,
    message: 'OTP verified successfully! Your session is authenticated for 15 minutes.',
    authenticatedUntil: authUntil,
  };
}

/**
 * Check if the customer phone session is authenticated (valid for 15 minutes)
 */
export function isSessionAuthenticated(phone?: string): boolean {
  if (!phone) return false;
  const formattedPhone = formatPhone(phone);
  const session = authSessionStore.get(formattedPhone);

  if (!session || !session.authenticated || !session.authenticatedUntil) {
    return false;
  }

  if (Date.now() > new Date(session.authenticatedUntil).getTime()) {
    authSessionStore.delete(formattedPhone);
    return false;
  }

  return true;
}

/**
 * Get active session status for a phone number
 */
export function getSessionStatus(phone?: string): SessionAuthStatus {
  if (!phone) return { phone: '', authenticated: false };
  const formattedPhone = formatPhone(phone);
  const authenticated = isSessionAuthenticated(formattedPhone);
  const session = authSessionStore.get(formattedPhone);

  return {
    phone: formattedPhone,
    authenticated,
    authenticatedAt: session?.authenticatedAt,
    authenticatedUntil: session?.authenticatedUntil,
  };
}
