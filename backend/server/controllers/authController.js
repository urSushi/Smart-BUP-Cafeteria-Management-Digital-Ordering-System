import bcrypt from "bcryptjs";
import {
  createUser,
  findUserByEmail,
  findUserByIdentifier,
  findUserByIdentifierAndRole,
  toPublicUser,
  recordFailedLogin,
  clearFailedLogin,
  isAccountLocked,
  _debugAllUsers,
} from "../models/User.js";
import { issueOtp, issueOtpForUser } from "../models/OTP.js";
import { sendOTP } from "../utils/sendOTP.js";
import { generateToken } from "../utils/generateToken.js";

const ROLE_ID_FIELD = {
  student: "universityId",
  faculty: "facultyId",
  officer: "officerId",
  staff: "staffId",
};

const ROLE_REQUIRED_FIELDS = {
  student: ["fullName", "universityId", "personalEmail", "department", "phone", "password"],
  faculty: ["fullName", "facultyId", "personalEmail", "department", "designation", "phone", "password"],
  officer: ["fullName", "officerId", "personalEmail", "rank", "office", "phone", "password"],
  staff: ["fullName", "staffId", "personalEmail", "department", "officeDesignation", "phone", "password"],
};

export async function register(req, res) {
  const { role, password, confirmPassword } = req.body;

  if (!["student", "faculty", "officer", "staff"].includes(role)) {
    return res.status(400).json({ message: "Unknown role. Supported roles: student, faculty, officer, staff." });
  }

  const personalEmail = (req.body.personalEmail || req.body.email || "").trim();
  const universityEmail = (req.body.universityEmail || "").trim();
  req.body.personalEmail = personalEmail;
  req.body.universityEmail = universityEmail;

  const required = ROLE_REQUIRED_FIELDS[role];
  const missing = required.filter((f) => !req.body[f] || String(req.body[f]).trim() === "");
  if (missing.length) {
    return res.status(400).json({ message: `Missing required fields: ${missing.join(", ")}` });
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords don't match." });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters." });
  }

  const idField = ROLE_ID_FIELD[role];
  const identifier = req.body[idField];

  if (findUserByIdentifier(identifier)) {
    return res.status(409).json({ message: `An account with that ${idField} already exists.` });
  }
  if (personalEmail && findUserByEmail(personalEmail)) {
    return res.status(409).json({ message: "An account with that email address already exists." });
  }
  if (universityEmail && findUserByEmail(universityEmail)) {
    return res.status(409).json({ message: "An account with that official university email already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = createUser({
    role,
    fullName: req.body.fullName,
    identifier,
    universityEmail: universityEmail || null,
    personalEmail,
    department: req.body.department,
    program: req.body.program,
    semester: req.body.semester,
    batch: req.body.batch,
    designation: req.body.designation,
    rank: req.body.rank,
    office: req.body.office,
    officeDesignation: req.body.officeDesignation,
    section: req.body.section,
    phone: req.body.phone,
    passwordHash,
    verified: false,
  });

  const targetEmails = [user.personalEmail, user.universityEmail].filter(Boolean);
  const code = issueOtpForUser({ universityEmail: user.universityEmail, personalEmail: user.personalEmail }, "register");
  let emailSent = false;
  try {
    const sendResult = await sendOTP(targetEmails, code, "register");
    emailSent = Boolean(sendResult?.sent);
  } catch (mailErr) {
    console.warn(`[REGISTER] Warning: Could not deliver email to ${targetEmails.join(", ")}: ${mailErr.message}`);
  }

  const emailDestinations = user.universityEmail
    ? `${user.personalEmail} and ${user.universityEmail}`
    : user.personalEmail;

  return res.status(201).json({
    message: emailSent
      ? `Account created! Verification code sent to ${emailDestinations}.`
      : `Account created and stored in database. Complete verification to activate account.`,
    email: user.personalEmail || user.universityEmail,
    personalEmail: user.personalEmail,
    universityEmail: user.universityEmail,
    emailSent,
    ...(process.env.SMTP_USER ? {} : { devOtp: code }),
  });
}

export async function login(req, res) {
  const { universityId, identifier, email, guestCode, password } = req.body;
  const loginKey = universityId || identifier || email || guestCode;
  if (!loginKey || !password) {
    return res.status(400).json({ message: "Identifier (ID / Email / Guest Code) and password are required." });
  }

  // Look up by identifier, email, or guest code
  let user = findUserByIdentifier(loginKey) || findUserByEmail(loginKey);
  if (!user) {
    user = _debugAllUsers().find(
      (u) =>
        u.guestCode?.toLowerCase() === String(loginKey).toLowerCase() ||
        u.personalEmail?.toLowerCase() === String(loginKey).toLowerCase()
    );
  }

  if (!user || !["student", "faculty", "officer", "staff", "guest", "admin"].includes(user.role)) {
    return res.status(401).json({ message: "Invalid ID/Email or password." });
  }

  // Account Lockout check (FR-03)
  const lockStatus = isAccountLocked(user);
  if (lockStatus.locked) {
    return res.status(429).json({
      message: `Account is temporarily locked due to 5 failed attempts. Please wait ${lockStatus.minutesLeft} minute(s) before retrying.`,
      locked: true,
      minutesLeft: lockStatus.minutesLeft,
    });
  }

  if (!user.verified) {
    return res.status(403).json({
      message: "Please verify your email before logging in.",
      unverified: true,
      email: user.universityEmail || user.personalEmail,
    });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    recordFailedLogin(user.identifier);
    const attempts = user.failedLoginAttempts || 1;
    const remaining = Math.max(0, 5 - attempts);
    if (remaining === 0) {
      return res.status(429).json({
        message: "Account locked for 15 minutes due to 5 consecutive failed login attempts.",
        locked: true,
      });
    }
    return res.status(401).json({
      message: `Invalid ID/Email or password. (${remaining} attempts remaining before account cooldown)`,
    });
  }

  clearFailedLogin(user.identifier);
  const token = generateToken(user);
  return res.json({ token, user: toPublicUser(user) });
}

function portalLogin(role, identifierField) {
  return async (req, res) => {
    const identifier = req.body[identifierField] || req.body.identifier;
    const { password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ message: "ID and password are required." });
    }

    const user = findUserByIdentifierAndRole(identifier, role);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const lockStatus = isAccountLocked(user);
    if (lockStatus.locked) {
      return res.status(429).json({
        message: `Account is temporarily locked. Cooldown active for ${lockStatus.minutesLeft} more minutes.`,
        locked: true,
      });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      recordFailedLogin(user.identifier);
      return res.status(401).json({ message: "Invalid credentials." });
    }

    clearFailedLogin(user.identifier);
    const token = generateToken(user);
    return res.json({ token, user: toPublicUser(user) });
  };
}

export const staffLogin = portalLogin("cafeteria_staff", "staffId");
export const managerLogin = portalLogin("cafeteria_manager", "managerId");
export const adminLogin = portalLogin("admin", "adminId");
export const officerLogin = portalLogin("officer", "officerId");

