import crypto from "crypto";
import { saveOtpToDatabase } from "../db.js";

const EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds

export const DEMO_EMAILS = [
  "student@bup.edu.bd",
  "faculty@bup.edu.bd",
  "officer@bup.edu.bd",
  "staff@bup.edu.bd",
  "guest@bup.edu.bd",
  "admin@bup.edu.bd",
];
export const DEMO_OTP_CODE = "123456";

export function isDemoEmail(email) {
  if (!email) return false;
  const lower = String(email).trim().toLowerCase();
  return DEMO_EMAILS.includes(lower) || lower.includes("demo");
}

// Keyed by `${email}:${purpose}` so the same email can have independent
// codes in flight for, say, a login OTP and a registration OTP.
const store = new Map();

function key(email, purpose) {
  return `${email.toLowerCase()}:${purpose}`;
}

/**
 * Generates an actual 6-digit cryptographic numeric combination (100000 - 999999)
 */
function generateCode() {
  return String(crypto.randomInt(100000, 1000000));
}

/** Creates and stores a fresh code in memory and database, throwing if cooldown hasn't passed. */
export function issueOtp(email, purpose) {
  const k = key(email, purpose);
  const existing = store.get(k);
  if (existing && existing.resendAvailableAt > Date.now()) {
    const waitSeconds = Math.ceil((existing.resendAvailableAt - Date.now()) / 1000);
    const err = new Error(`Please wait ${waitSeconds}s before requesting another code.`);
    err.status = 429;
    throw err;
  }

  const now = Date.now();
  // Demo code is strictly for signin/login option — NEVER applicable in registration/signup!
  const isDemo = isDemoEmail(email) && purpose === "login";
  const code = isDemo ? DEMO_OTP_CODE : generateCode();
  const record = {
    code,
    email,
    purpose,
    expiresAt: now + EXPIRY_MS,
    resendAvailableAt: now + RESEND_COOLDOWN_MS,
    attempts: 0,
    isDemo,
  };
  store.set(k, record);

  // Store in relational database table
  try {
    saveOtpToDatabase({ email, code, purpose, expiresAt: record.expiresAt });
  } catch (dbErr) {
    console.warn("[OTP] DB save warning:", dbErr.message);
  }

  return code;
}

/**
 * Creates and stores a real-time cryptographic OTP for an account being created.
 * Registers code against both the official university email (Education mail)
 * and designated personal email if provided.
 */
export function issueOtpForUser({ universityEmail, personalEmail }, purpose = "register") {
  const now = Date.now();
  // Registration is strictly for real account creation — no demo code!
  const code = generateCode();
  const record = {
    code,
    email: universityEmail || personalEmail,
    purpose,
    expiresAt: now + EXPIRY_MS,
    resendAvailableAt: now + RESEND_COOLDOWN_MS,
    attempts: 0,
    isDemo: false,
  };

  if (universityEmail) {
    store.set(key(universityEmail, purpose), record);
    try {
      saveOtpToDatabase({ email: universityEmail, code, purpose, expiresAt: record.expiresAt });
    } catch (e) {}
  }

  if (personalEmail && personalEmail.toLowerCase() !== universityEmail?.toLowerCase()) {
    store.set(key(personalEmail, purpose), record);
    try {
      saveOtpToDatabase({ email: personalEmail, code, purpose, expiresAt: record.expiresAt });
    } catch (e) {}
  }

  return code;
}

export function verifyOtpCode(email, purpose, code) {
  const cleanCode = String(code).trim();
  // Demo code 123456 is ONLY allowed for login purpose with demo accounts, NEVER signup/register!
  const isDemo = isDemoEmail(email) && purpose === "login";

  // Direct bypass for demo accounts using the demo code ONLY on login
  if (isDemo && cleanCode === DEMO_OTP_CODE) {
    const k = key(email, purpose);
    store.delete(k);
    return { ok: true, isDemo: true };
  }

  const k = key(email, purpose);
  const record = store.get(k);

  if (!record) {
    return { ok: false, reason: "No verification code was requested for this email." };
  }

  if (Date.now() > record.expiresAt) {
    store.delete(k);
    return { ok: false, reason: "This code has expired. Please request a new code." };
  }

  record.attempts += 1;
  if (record.attempts > 6) {
    store.delete(k);
    return { ok: false, reason: "Too many failed attempts. Please request a new code." };
  }

  // Strict match against actual code combination generated & saved, or demo code for demo signin
  const isMatch = record.code === cleanCode || (record.isDemo && cleanCode === DEMO_OTP_CODE && purpose === "login");

  if (!isMatch) {
    return { ok: false, reason: "Incorrect verification code. Please check your email." };
  }

  store.delete(k);
  return { ok: true, isDemo: record.isDemo };
}

export function peekOtp(email, purpose) {
  const k = key(email, purpose);
  return store.get(k)?.code || null;
}
