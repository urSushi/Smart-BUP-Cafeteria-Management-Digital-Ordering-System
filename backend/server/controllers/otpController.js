import { issueOtp, verifyOtpCode } from "../models/OTP.js";
import { sendOTP } from "../utils/sendOTP.js";
import { findUserByEmail, toPublicUser, updateUserById } from "../models/User.js";
import { findGuestByEmail, activateGuest, toPublicGuest } from "../models/Guest.js";
import { generateToken } from "../utils/generateToken.js";

const VALID_PURPOSES = ["register", "login", "guest"];

export async function sendOtp(req, res) {
  const { email, purpose } = req.body;
  if (!email || !VALID_PURPOSES.includes(purpose)) {
    return res.status(400).json({ message: "A valid email and purpose are required." });
  }

  if (purpose === "login") {
    const user = findUserByEmail(email);
    if (!user || !user.verified) {
      return res.status(404).json({ message: "No verified account found for that email." });
    }
  } else if (purpose === "register") {
    const user = findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "No pending registration found for that email." });
    }
  } else if (purpose === "guest") {
    const guest = findGuestByEmail(email);
    if (!guest) {
      return res.status(404).json({ message: "No guest signup found for that email." });
    }
  }

  try {
    const code = issueOtp(email, purpose);
    let emailSent = false;
    try {
      const sendResult = await sendOTP(email, code, purpose);
      emailSent = Boolean(sendResult?.sent);
    } catch (mailErr) {
      console.warn(`[OTP RESEND] Warning: Could not deliver email to ${email}: ${mailErr.message}`);
    }
    return res.json({
      message: emailSent ? "Verification code sent to your email inbox." : "Verification code generated.",
      email,
      emailSent,
      ...(process.env.SMTP_USER ? {} : { devOtp: code }),
    });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message || "Could not send code." });
  }
}

export async function verifyOtp(req, res) {
  const { email, otp, purpose } = req.body;
  if (!email || !otp || !VALID_PURPOSES.includes(purpose)) {
    return res.status(400).json({ message: "Email, code, and purpose are required." });
  }

  const result = verifyOtpCode(email, purpose, otp);
  if (!result.ok) {
    return res.status(400).json({ message: result.reason });
  }

  if (purpose === "register") {
    const user = findUserByEmail(email);
    if (!user) return res.status(404).json({ message: "Account not found." });
    const updated = updateUserById(user.id, { verified: true }) || { ...user, verified: true };
    const token = generateToken(updated);
    return res.json({ message: "Verified successfully.", token, user: toPublicUser(updated) });
  }

  if (purpose === "login") {
    const user = findUserByEmail(email);
    if (!user) return res.status(404).json({ message: "Account not found." });
    const token = generateToken(user);
    return res.json({ message: "Verified.", token, user: toPublicUser(user) });
  }

  // purpose === "guest"
  const guest = findGuestByEmail(email);
  if (!guest) return res.status(404).json({ message: "Guest signup not found." });
  const activated = activateGuest(guest.id);
  const token = generateToken({ id: activated.id, role: "guest" });
  return res.json({ message: "Guest account activated.", token, user: { ...toPublicGuest(activated), role: "guest" } });
}
