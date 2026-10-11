import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { syncUserToDatabase } from "../db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PERSISTENT_FILE = path.resolve(__dirname, "../../database/persistent_users.json");

let users = [];
let nextId = 1;

function loadPersistentUsers() {
  try {
    if (fs.existsSync(PERSISTENT_FILE)) {
      const raw = fs.readFileSync(PERSISTENT_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn("[User DB] Warning reading persistent_users.json:", err.message);
  }
  return [];
}

function savePersistentUsers() {
  try {
    const toSave = users.filter((u) => u.isPersistent);
    fs.writeFileSync(PERSISTENT_FILE, JSON.stringify(toSave, null, 2), "utf-8");
  } catch (err) {
    console.warn("[User DB] Warning saving persistent_users.json:", err.message);
  }
}

export function createUser(data, isSeed = false) {
  const user = {
    id: nextId++,
    role: data.role, // "student" | "faculty" | "officer" | "staff" | "guest" | "cafeteria_staff" | "cafeteria_manager" | "admin"
    fullName: data.fullName,
    identifier: data.identifier || data.studentId || data.facultyId || data.officerId || data.staffId || data.guestCode || data.adminId,
    universityEmail: data.universityEmail || null,
    personalEmail: data.personalEmail || null,
    department: data.department || null,
    program: data.program || null,
    semester: data.semester || null,
    batch: data.batch || null, // for student (ER Diagram)
    designation: data.designation || null, // for faculty (ER Diagram)
    rank: data.rank || null, // for officer (ER Diagram)
    office: data.office || null, // for officer (ER Diagram)
    officeDesignation: data.officeDesignation || null,
    section: data.section || null, // for staff (ER Diagram)
    guestCode: data.guestCode || null, // for guest (ER Diagram)
    validUntil: data.validUntil || null, // for guest (ER Diagram)
    phone: data.phone || null,
    passwordHash: data.passwordHash,
    verified: data.verified ?? false,
    cafeteriaId: data.cafeteriaId || "vista", // for staff & managers
    staffRole: data.staffRole || (data.role === "cafeteria_staff" ? "kitchen" : null), // "cashier" | "kitchen" | "manager"
    failedLoginAttempts: 0,
    lockoutUntil: null,
    isPersistent: !isSeed,
    createdAt: data.createdAt || new Date().toISOString(),
  };
  users.push(user);
  if (!isSeed) {
    savePersistentUsers();
  }
  try {
    syncUserToDatabase(user);
  } catch {}
  return user;
}

export function findUserById(id) {
  return users.find((u) => u.id === id) || null;
}

export function findUserByIdentifier(identifier) {
  if (!identifier) return null;
  return users.find((u) => u.identifier?.toLowerCase() === String(identifier).toLowerCase()) || null;
}

export function findUserByEmail(email) {
  if (!email) return null;
  const lower = email.toLowerCase();
  return (
    users.find((u) => u.universityEmail?.toLowerCase() === lower || u.personalEmail?.toLowerCase() === lower) || null
  );
}

export function findUserByIdentifierAndRole(identifier, role) {
  return users.find((u) => u.role === role && u.identifier?.toLowerCase() === String(identifier).toLowerCase()) || null;
}

export function updateUserById(id, patch) {
  const user = findUserById(id);
  if (!user) return null;
  Object.assign(user, patch);
  if (user.isPersistent) {
    savePersistentUsers();
  }
  try {
    syncUserToDatabase(user);
  } catch {}
  return user;
}

export function recordFailedLogin(identifier) {
  const user = findUserByIdentifier(identifier);
  if (!user) return null;

  user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_MINUTES = 15;

  if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
    user.lockoutUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString();
  }
  return user;
}

export function clearFailedLogin(identifier) {
  const user = findUserByIdentifier(identifier);
  if (!user) return null;
  user.failedLoginAttempts = 0;
  user.lockoutUntil = null;
  return user;
}

export function isAccountLocked(user) {
  if (!user || !user.lockoutUntil) return { locked: false, minutesLeft: 0 };
  const now = new Date();
  const lockoutTime = new Date(user.lockoutUntil);
  if (now < lockoutTime) {
    const minutesLeft = Math.ceil((lockoutTime - now) / (60 * 1000));
    return { locked: true, minutesLeft };
  }
  // Cooldown elapsed, reset
  user.failedLoginAttempts = 0;
  user.lockoutUntil = null;
  return { locked: false, minutesLeft: 0 };
}

// Staff management for Cafeteria Managers (FR-18)
export function getStaffByCafeteria(cafeteriaId) {
  return users
    .filter((u) => u.role === "cafeteria_staff" && (!cafeteriaId || u.cafeteriaId === cafeteriaId))
    .map(toPublicUser);
}

export function createStaffMember(data) {
  const passwordHash = bcrypt.hashSync(data.password || "password123", 10);
  return createUser({
    role: "cafeteria_staff",
    fullName: data.fullName,
    identifier: data.identifier,
    universityEmail: data.email || `${data.identifier.toLowerCase()}@bup.edu.bd`,
    cafeteriaId: data.cafeteriaId || "vista",
    staffRole: data.staffRole || "kitchen", // cashier | kitchen
    passwordHash,
    verified: true,
  });
}

export function deleteStaffMember(identifier) {
  const idx = users.findIndex((u) => u.role === "cafeteria_staff" && u.identifier === identifier);
  if (idx !== -1) {
    users.splice(idx, 1);
    savePersistentUsers();
    return true;
  }
  return false;
}

export function getAllUsersAdmin() {
  return users.map(toPublicUser);
}

export function toPublicUser(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

// --- Seed demo operational accounts (ER diagram entities and roles) -------------
function seedOperationalAccount({ role, identifier, fullName, cafeteriaId, staffRole, department, batch, designation, rank, office, section, guestCode, validUntil, universityEmail, personalEmail }) {
  if (findUserByIdentifierAndRole(identifier, role)) return;
  createUser({
    role,
    fullName,
    identifier,
    universityEmail: universityEmail || `${identifier.toLowerCase()}@bup.edu.bd`,
    personalEmail: personalEmail || null,
    department: department || null,
    batch: batch || null,
    designation: designation || null,
    rank: rank || null,
    office: office || null,
    section: section || null,
    guestCode: guestCode || null,
    validUntil: validUntil || null,
    passwordHash: bcrypt.hashSync("password123", 10),
    verified: true,
    cafeteriaId: cafeteriaId || "vista",
    staffRole: staffRole || (role === "cafeteria_staff" ? "kitchen" : "manager"),
  }, true);
}

// All ISA Subclasses from the Chen ER Diagram
seedOperationalAccount({ role: "student", identifier: "2021-1-60-001", fullName: "Sarah Rahman", department: "Computer Science & Engineering (CSE)", batch: "2021", universityEmail: "student@bup.edu.bd" });
seedOperationalAccount({ role: "faculty", identifier: "FAC-101", fullName: "Dr. Tanvir Ahmed", department: "Business Administration (BBA)", designation: "Assistant Professor", universityEmail: "faculty@bup.edu.bd" });
seedOperationalAccount({ role: "officer", identifier: "OFF-301", fullName: "Mohammad Rafiqul Islam", rank: "Senior Section Officer", office: "Registrar Office", universityEmail: "officer@bup.edu.bd" });
seedOperationalAccount({ role: "staff", identifier: "STF-001", fullName: "Rahim Mia", section: "Cafeteria Operations", cafeteriaId: "vista", universityEmail: "staff@bup.edu.bd" });
seedOperationalAccount({ role: "guest", identifier: "GST-8890", guestCode: "GST-8890", fullName: "Kamal Uddin (Guest)", personalEmail: "guest@bup.edu.bd", validUntil: "2026-12-31 23:59:59" });

// Canteen-Specific Staff Accounts
seedOperationalAccount({ role: "cafeteria_staff", identifier: "STF-VST", fullName: "Rahim Mia (Vista Kitchen)", cafeteriaId: "vista", staffRole: "kitchen" });
seedOperationalAccount({ role: "cafeteria_staff", identifier: "STF-001", fullName: "Rahim Mia (Vista Kitchen)", cafeteriaId: "vista", staffRole: "kitchen" });
seedOperationalAccount({ role: "cafeteria_staff", identifier: "STF-AMT", fullName: "Abul Kashem (Amitie Kitchen)", cafeteriaId: "amitie", staffRole: "kitchen" });
seedOperationalAccount({ role: "cafeteria_staff", identifier: "STF-002", fullName: "Akram Khan (Amitie Cashier)", cafeteriaId: "amitie", staffRole: "cashier" });
seedOperationalAccount({ role: "cafeteria_staff", identifier: "STF-PST", fullName: "Jahangir Alam (Pitstop Counter)", cafeteriaId: "pitstop", staffRole: "kitchen" });
seedOperationalAccount({ role: "cafeteria_staff", identifier: "STF-THP", fullName: "Dulal Sen (Third Place Grill)", cafeteriaId: "monpura", staffRole: "kitchen" });

// Canteen-Specific Managers
seedOperationalAccount({ role: "cafeteria_manager", identifier: "MGR-001", fullName: "Kamal Hossain (Vista Manager)", cafeteriaId: "vista" });
seedOperationalAccount({ role: "cafeteria_manager", identifier: "MGR-VST", fullName: "Kamal Hossain (Vista Manager)", cafeteriaId: "vista" });
seedOperationalAccount({ role: "cafeteria_manager", identifier: "MGR-002", fullName: "Farzana Yasmin (Amitie Manager)", cafeteriaId: "amitie" });
seedOperationalAccount({ role: "cafeteria_manager", identifier: "MGR-AMT", fullName: "Farzana Yasmin (Amitie Manager)", cafeteriaId: "amitie" });
seedOperationalAccount({ role: "cafeteria_manager", identifier: "MGR-PST", fullName: "Tariqul Islam (Pitstop Manager)", cafeteriaId: "pitstop" });
seedOperationalAccount({ role: "cafeteria_manager", identifier: "MGR-THP", fullName: "Shamsur Rahman (Third Place Manager)", cafeteriaId: "monpura" });

// University Administrator (Single Main Admin for Central Campus)
seedOperationalAccount({ role: "admin", identifier: "ADM-001", fullName: "University Administrator", cafeteriaId: "all", universityEmail: "admin@bup.edu.bd" });

// --- Load & initialize persistent accounts registered by real users -------------
const savedUsers = loadPersistentUsers();
for (const su of savedUsers) {
  if (!findUserByIdentifier(su.identifier) && !findUserByEmail(su.universityEmail || su.personalEmail)) {
    su.id = nextId++;
    su.isPersistent = true;
    users.push(su);
    try {
      syncUserToDatabase(su);
    } catch {}
  }
}
if (savedUsers.length > 0) {
  console.log(`[User DB] Loaded ${savedUsers.length} persistent registered account(s) from database/persistent_users.json`);
}

export function _debugAllUsers() {
  return users;
}

