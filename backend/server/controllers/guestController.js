import bcrypt from "bcryptjs";
import { createGuest, findGuestByEmail } from "../models/Guest.js";
import { issueOtp } from "../models/OTP.js";
import { sendOTP } from "../utils/sendOTP.js";

export async function guestRegister(req, res) {
  const { fullName, personalEmail, phone, password, confirmPassword } = req.body;

  if (!fullName || !personalEmail || !phone || !password) {
    return res.status(400).json({ message: "Full name, email, phone, and password are all required." });
  }
  if (confirmPassword !== undefined && password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords don't match." });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  const existing = findGuestByEmail(personalEmail);
  if (existing && existing.status === "active") {
    return res.status(409).json({ message: "A guest account with that email is already active." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const guest = createGuest({ fullName, personalEmail, phone, passwordHash });

  const code = issueOtp(personalEmail, "guest");
  let emailSent = false;
  try {
    const sendRes = await sendOTP(personalEmail, code, "guest");
    emailSent = Boolean(sendRes?.sent);
  } catch (mailErr) {
    console.warn(`[GUEST REGISTER] Could not send email: ${mailErr.message}`);
  }

  return res.status(201).json({
    message: emailSent
      ? "Guest account created. Verification code sent to your email inbox."
      : "Guest account created. Enter verification code to activate your pass.",
    email: personalEmail,
    emailSent,
    ...(process.env.SMTP_USER ? {} : { devOtp: code }),
  });
}
