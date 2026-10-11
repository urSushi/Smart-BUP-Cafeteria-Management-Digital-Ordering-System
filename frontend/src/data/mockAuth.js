// Client-side mock auth store & simulator for Module 1.
// Ensures that whether the backend is running or not, all flows
// (Registration, Login, Guest, OTP verification, Staff, Manager, Admin)
// work seamlessly with instant feedback, zero errors, and realistic data.

const MOCK_STORAGE_KEY = "sbcms_mock_users";
const MOCK_GUESTS_KEY = "sbcms_mock_guests";

const INITIAL_USERS = [
  {
    id: 1,
    role: "student",
    fullName: "Sarah Rahman",
    identifier: "2021-1-60-001",
    universityEmail: "student@bup.edu.bd",
    personalEmail: "sarah.rahman@gmail.com",
    department: "Computer Science & Engineering",
    program: "B.Sc. in CSE",
    semester: "8th Semester",
    phone: "01711223344",
    password: "password123",
    verified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    role: "faculty",
    fullName: "Dr. Tanvir Ahmed",
    identifier: "FAC-101",
    universityEmail: "faculty@bup.edu.bd",
    personalEmail: "tanvir.faculty@gmail.com",
    department: "Business Administration",
    designation: "Associate Professor",
    phone: "01811223344",
    password: "password123",
    verified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    role: "staff",
    fullName: "Mohammad Kabir",
    identifier: "STF-001",
    universityEmail: "staff@bup.edu.bd",
    personalEmail: "kabir.staff@gmail.com",
    department: "IT & Network Systems",
    officeDesignation: "Senior Systems Engineer",
    section: "Cafeteria Operations",
    phone: "01911223344",
    password: "password123",
    verified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 7,
    role: "officer",
    fullName: "Mohammad Rafiqul Islam",
    identifier: "OFF-301",
    universityEmail: "officer@bup.edu.bd",
    personalEmail: "rafiq.officer@gmail.com",
    rank: "Senior Section Officer",
    office: "Registrar Office",
    phone: "01711000003",
    password: "password123",
    verified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 8,
    role: "guest",
    fullName: "Kamal Uddin (Guest)",
    identifier: "GST-8890",
    guestCode: "GST-8890",
    personalEmail: "guest@bup.edu.bd",
    validUntil: "2026-12-31 23:59:59",
    phone: "01811000005",
    password: "password123",
    verified: true,
    createdAt: new Date().toISOString(),
  },
  // --- Canteen-Specific Staff (FR-10, FR-11, FR-12) ---
  {
    id: 4,
    role: "cafeteria_staff",
    fullName: "Rahim Mia (Vista Kitchen)",
    identifier: "STF-VST",
    cafeteriaId: "vista",
    cafeteriaName: "Vista Cafe",
    universityEmail: "kitchen.vista@bup.edu.bd",
    password: "password123",
    verified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 41,
    role: "cafeteria_staff",
    fullName: "Rahim Mia (Vista Kitchen - Legacy ID)",
    identifier: "STF-001",
    cafeteriaId: "vista",
    cafeteriaName: "Vista Cafe",
    universityEmail: "staff.vista@bup.edu.bd",
    password: "password123",
    verified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 42,
    role: "cafeteria_staff",
    fullName: "Abul Kashem (Amitie Kitchen)",
    identifier: "STF-AMT",
    cafeteriaId: "amitie",
    cafeteriaName: "Amitie Cafeteria",
    universityEmail: "kitchen.amitie@bup.edu.bd",
    password: "password123",
    verified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 43,
    role: "cafeteria_staff",
    fullName: "Jahangir Alam (Pitstop Counter)",
    identifier: "STF-PST",
    cafeteriaId: "pitstop",
    cafeteriaName: "Pitstop",
    universityEmail: "kitchen.pitstop@bup.edu.bd",
    password: "password123",
    verified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 44,
    role: "cafeteria_staff",
    fullName: "Dulal Sen (Third Place Grill)",
    identifier: "STF-THP",
    cafeteriaId: "monpura",
    cafeteriaName: "Third Place",
    universityEmail: "kitchen.monpura@bup.edu.bd",
    password: "password123",
    verified: true,
    createdAt: new Date().toISOString(),
  },
  // --- Canteen Managers ---
  {
    id: 5,
    role: "cafeteria_manager",
    fullName: "Kamal Hossain (Vista Operations)",
    identifier: "MGR-001",
    cafeteriaId: "vista",
    cafeteriaName: "Vista Cafe",
    universityEmail: "manager.vista@bup.edu.bd",
    password: "password123",
    verified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 51,
    role: "cafeteria_manager",
    fullName: "Kamal Hossain (Vista Operations)",
    identifier: "MGR-VST",
    cafeteriaId: "vista",
    cafeteriaName: "Vista Cafe",
    universityEmail: "mgr.vista@bup.edu.bd",
    password: "password123",
    verified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 52,
    role: "cafeteria_manager",
    fullName: "Farzana Yasmin (Amitie Operations)",
    identifier: "MGR-AMT",
    cafeteriaId: "amitie",
    cafeteriaName: "Amitie Cafeteria",
    universityEmail: "manager.amitie@bup.edu.bd",
    password: "password123",
    verified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 53,
    role: "cafeteria_manager",
    fullName: "Tariqul Islam (Pitstop Operations)",
    identifier: "MGR-PST",
    cafeteriaId: "pitstop",
    cafeteriaName: "Pitstop",
    universityEmail: "manager.pitstop@bup.edu.bd",
    password: "password123",
    verified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 54,
    role: "cafeteria_manager",
    fullName: "Shamsur Rahman (Third Place Operations)",
    identifier: "MGR-THP",
    cafeteriaId: "monpura",
    cafeteriaName: "Third Place",
    universityEmail: "manager.monpura@bup.edu.bd",
    password: "password123",
    verified: true,
    createdAt: new Date().toISOString(),
  },
  // --- University Administrator (Single Main Admin for Central Campus) ---
  {
    id: 6,
    role: "admin",
    fullName: "University Administrator",
    identifier: "ADM-001",
    cafeteriaId: "all",
    cafeteriaName: "All Campus Dining Facilities",
    universityEmail: "admin@bup.edu.bd",
    password: "password123",
    verified: true,
    createdAt: new Date().toISOString(),
  },
];

function loadStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveStored(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // quota exceeded or private mode
  }
}

let mockUsers = loadStored(MOCK_STORAGE_KEY, INITIAL_USERS);
let mockGuests = loadStored(MOCK_GUESTS_KEY, []);

// In-memory OTP simulation
const otpStore = new Map(); // key -> { code, email, purpose, expiresAt }
let latestOtpCode = "123456";

export function getLatestOtp() {
  return latestOtpCode;
}

function sleep(ms = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateMockToken(user) {
  return `mock_jwt_token_${user.id}_${Date.now()}`;
}

export const mockAuth = {
  getDemoCredentials() {
    return {
      student: { id: "2021-1-60-001", email: "student@bup.edu.bd", password: "password123", label: "Student Demo (CSE, Batch 2021)" },
      faculty: { id: "FAC-101", email: "faculty@bup.edu.bd", password: "password123", label: "Faculty Demo (BBA, Asst. Prof)" },
      officer: { id: "OFF-301", email: "officer@bup.edu.bd", password: "password123", label: "Officer Demo (Registrar Office)" },
      staff: { id: "STF-001", email: "staff@bup.edu.bd", password: "password123", label: "Univ Staff Demo (Operations)" },
      guest: { id: "GST-8890", email: "guest@bup.edu.bd", password: "password123", label: "Guest Demo (Pass Valid)" },
      // Legacy single shortcuts
      portalStaff: { id: "STF-VST", password: "password123", label: "Vista Staff" },
      portalManager: { id: "MGR-VST", password: "password123", label: "Vista Manager" },
      portalAdmin: { id: "ADM-001", password: "password123", label: "University Administrator" },
      // University Administrator (Single Main Central Campus Admin)
      admin: { id: "ADM-001", password: "password123", name: "University Administrator", scope: "All Canteens", location: "Central Campus", cafeteriaId: "all" },
      adminByCanteen: {
        all: { id: "ADM-001", password: "password123", name: "University Administrator", scope: "All Canteens", location: "Central Campus", cafeteriaId: "all" },
      },
      // Separated Canteen Manager Logins
      managerByCanteen: {
        vista: { id: "MGR-VST", password: "password123", name: "Vista Manager", mgrName: "Kamal Hossain", location: "Academic GF", cafeteriaId: "vista" },
        amitie: { id: "MGR-AMT", password: "password123", name: "Amitie Manager", mgrName: "Farzana Yasmin", location: "FBS GF", cafeteriaId: "amitie" },
        pitstop: { id: "MGR-PST", password: "password123", name: "Pitstop Manager", mgrName: "Tariqul Islam", location: "FASS Walkway", cafeteriaId: "pitstop" },
        monpura: { id: "MGR-THP", password: "password123", name: "Third Place Manager", mgrName: "Shamsur Rahman", location: "Lakeside Deck", cafeteriaId: "monpura" },
      },
    };
  },

  async login(universityId, password) {
    await sleep(400);
    const cleanId = String(universityId).trim().toLowerCase();
    const user = mockUsers.find(
      (u) =>
        (u.identifier?.toLowerCase() === cleanId ||
          u.guestCode?.toLowerCase() === cleanId ||
          u.universityEmail?.toLowerCase() === cleanId ||
          u.personalEmail?.toLowerCase() === cleanId) &&
        ["student", "faculty", "officer", "staff", "guest", "admin"].includes(u.role)
    );

    if (!user) {
      throw new Error("No account found with this ID or Email.");
    }
    if (user.password !== password && password !== "password123") {
      throw new Error("Incorrect password. Please try again.");
    }

    return {
      message: "Login successful",
      token: generateMockToken(user),
      user: {
        id: user.id,
        role: user.role,
        fullName: user.fullName,
        identifier: user.identifier,
        universityEmail: user.universityEmail,
        personalEmail: user.personalEmail,
        department: user.department,
        program: user.program,
        semester: user.semester,
        batch: user.batch,
        designation: user.designation,
        rank: user.rank,
        office: user.office,
        section: user.section,
        guestCode: user.guestCode,
      },
    };
  },

  async register(payload) {
    await sleep(500);
    const identifier = payload.universityId || payload.facultyId || payload.officerId || payload.staffId;
    const personalEmail = (payload.personalEmail || payload.email || "").trim();
    const universityEmail = (payload.universityEmail || "").trim();

    if (!personalEmail) {
      throw new Error("Email Address is mandatory.");
    }

    const existing = mockUsers.find(
      (u) =>
        (identifier && u.identifier?.toLowerCase() === identifier?.toLowerCase()) ||
        (personalEmail && (u.personalEmail?.toLowerCase() === personalEmail.toLowerCase() || u.universityEmail?.toLowerCase() === personalEmail.toLowerCase())) ||
        (universityEmail && (u.universityEmail?.toLowerCase() === universityEmail.toLowerCase() || u.personalEmail?.toLowerCase() === universityEmail.toLowerCase()))
    );

    if (existing) {
      throw new Error("An account with this ID or email address already exists.");
    }

    const newUser = {
      id: mockUsers.length + 10,
      role: payload.role || "student",
      fullName: payload.fullName,
      identifier,
      universityEmail: universityEmail || null,
      personalEmail,
      department: payload.department,
      program: payload.program || null,
      semester: payload.semester || null,
      batch: payload.batch || null,
      designation: payload.designation || null,
      rank: payload.rank || null,
      office: payload.office || null,
      officeDesignation: payload.officeDesignation || null,
      section: payload.section || null,
      phone: payload.phone,
      password: payload.password,
      verified: false,
      createdAt: new Date().toISOString(),
    };

    mockUsers.push(newUser);
    saveStored(MOCK_STORAGE_KEY, mockUsers);

    const email = personalEmail || universityEmail;
    const otpRes = await this.sendOtp(email, "register");
    if (universityEmail && universityEmail.toLowerCase() !== email.toLowerCase()) {
      const existingOtp = otpStore.get(`${email.toLowerCase()}:register`);
      if (existingOtp) {
        otpStore.set(`${universityEmail.toLowerCase()}:register`, existingOtp);
      }
    }

    return {
      message: "Registration initiated. Verification code sent.",
      email,
      personalEmail,
      universityEmail: universityEmail || null,
      devOtp: otpRes?.devOtp,
    };
  },

  async guestRegister(payload) {
    await sleep(450);
    const existing = mockGuests.find(
      (g) => g.personalEmail?.toLowerCase() === payload.personalEmail.toLowerCase()
    );

    let guest;
    if (existing) {
      guest = existing;
      guest.fullName = payload.fullName;
      guest.phone = payload.phone;
      guest.password = payload.password;
    } else {
      guest = {
        id: `guest_${Date.now()}`,
        fullName: payload.fullName,
        personalEmail: payload.personalEmail,
        phone: payload.phone,
        password: payload.password,
        status: "pending_otp",
        verified: false,
        createdAt: new Date().toISOString(),
        expiresAt: null,
      };
      mockGuests.push(guest);
    }
    saveStored(MOCK_GUESTS_KEY, mockGuests);

    await this.sendOtp(payload.personalEmail, "guest");

    return {
      message: "Guest pass requested. Verification code sent.",
      email: payload.personalEmail,
    };
  },

  async sendOtp(email, purpose) {
    await sleep(350);
    const cleanEmail = String(email || "").trim().toLowerCase();
    const isDemo =
      ["student@bup.edu.bd", "faculty@bup.edu.bd", "officer@bup.edu.bd", "staff@bup.edu.bd", "guest@bup.edu.bd", "admin@bup.edu.bd"].includes(cleanEmail) ||
      cleanEmail.includes("demo");
    const code = isDemo ? "123456" : String(Math.floor(100000 + Math.random() * 900000));
    latestOtpCode = code;
    otpStore.set(`${cleanEmail}:${purpose}`, {
      code,
      email: cleanEmail,
      purpose,
      isDemo,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    console.info(`[SBCMS Auth] Dispatched 6-digit OTP for ${cleanEmail}: ${code}`);

    return {
      message: `Verification code sent to ${cleanEmail}`,
      email: cleanEmail,
      isDemo,
      devOtp: code,
    };
  },

  async verifyOtp(email, otp, purpose) {
    await sleep(450);
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanOtp = String(otp).trim();
    const isDemo =
      purpose === "login" &&
      (["student@bup.edu.bd", "faculty@bup.edu.bd", "officer@bup.edu.bd", "staff@bup.edu.bd", "guest@bup.edu.bd", "admin@bup.edu.bd"].includes(cleanEmail) ||
        cleanEmail.includes("demo"));
    const record = otpStore.get(`${cleanEmail}:${purpose}`);

    const isMatch = (isDemo && cleanOtp === "123456") || (record && (record.code === cleanOtp || (record.isDemo && cleanOtp === "123456" && purpose === "login")));

    if (!isMatch) {
      throw new Error("Invalid or expired verification code. Please check your email.");
    }

    if (purpose === "guest") {
      const guest = mockGuests.find((g) => g.personalEmail?.toLowerCase() === email.toLowerCase());
      if (guest) {
        guest.verified = true;
        guest.status = "active";
        guest.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        saveStored(MOCK_GUESTS_KEY, mockGuests);
        return {
          message: "Guest pass activated",
          token: `guest_token_${guest.id}`,
          user: {
            id: guest.id,
            role: "guest",
            fullName: guest.fullName,
            personalEmail: guest.personalEmail,
            expiresAt: guest.expiresAt,
            isGuest: true,
          },
        };
      }
    }

    // Check registered user or email login
    const user = mockUsers.find(
      (u) =>
        u.universityEmail?.toLowerCase() === email.toLowerCase() ||
        u.personalEmail?.toLowerCase() === email.toLowerCase()
    );

    if (user) {
      user.verified = true;
      saveStored(MOCK_STORAGE_KEY, mockUsers);
      return {
        message: "Email verified successfully",
        token: generateMockToken(user),
        user: {
          id: user.id,
          role: user.role,
          fullName: user.fullName,
          identifier: user.identifier,
          universityEmail: user.universityEmail,
          department: user.department,
          program: user.program,
          semester: user.semester,
        },
      };
    }

    // Default verified placeholder user
    const fallbackUser = {
      id: Date.now(),
      role: "student",
      fullName: email.split("@")[0].replace(".", " "),
      identifier: "2021-DEMO",
      universityEmail: email,
    };

    return {
      message: "Verified successfully",
      token: generateMockToken(fallbackUser),
      user: fallbackUser,
    };
  },

  async staffLogin(staffId, password) {
    await sleep(400);
    const cleanId = String(staffId).trim().toLowerCase();
    const user = mockUsers.find(
      (u) => u.identifier?.toLowerCase() === cleanId && u.role === "cafeteria_staff"
    );
    if (!user || (user.password !== password && password !== "password123")) {
      throw new Error("Invalid Staff credentials. Please select or enter a valid canteen staff ID and password.");
    }
    return {
      message: `Staff portal authenticated (${user.cafeteriaName || "Kitchen"})`,
      token: generateMockToken(user),
      user: {
        id: user.id,
        role: "cafeteria_staff",
        fullName: user.fullName,
        identifier: user.identifier,
        cafeteriaId: user.cafeteriaId || "vista",
        cafeteriaName: user.cafeteriaName || "Vista Cafe",
        portalTitle: `${user.cafeteriaName || "Cafeteria"} Kitchen & Staff Portal`,
      },
    };
  },

  async managerLogin(managerId, password) {
    await sleep(400);
    const cleanId = String(managerId).trim().toLowerCase();
    const user = mockUsers.find(
      (u) => u.identifier?.toLowerCase() === cleanId && u.role === "cafeteria_manager"
    );
    if (!user || (user.password !== password && password !== "password123")) {
      throw new Error("Invalid Manager credentials. Please select or enter a valid canteen manager ID and password.");
    }
    return {
      message: `Manager portal authenticated (${user.cafeteriaName || "Operations"})`,
      token: generateMockToken(user),
      user: {
        id: user.id,
        role: "cafeteria_manager",
        fullName: user.fullName,
        identifier: user.identifier,
        cafeteriaId: user.cafeteriaId || "vista",
        cafeteriaName: user.cafeteriaName || "Vista Cafe",
        portalTitle: `${user.cafeteriaName || "Cafeteria"} Operations & Menu Manager`,
      },
    };
  },

  async adminLogin(adminId, password) {
    await sleep(400);
    const cleanId = String(adminId).trim().toLowerCase();
    const user = mockUsers.find(
      (u) => u.identifier?.toLowerCase() === cleanId && u.role === "admin"
    );
    if (!user || (user.password !== password && password !== "password123")) {
      throw new Error("Invalid Admin credentials. Please select or enter a valid canteen/system admin ID and password.");
    }
    return {
      message: `Admin portal authenticated (${user.cafeteriaName || "System"})`,
      token: generateMockToken(user),
      user: {
        id: user.id,
        role: "admin",
        fullName: user.fullName,
        identifier: user.identifier,
        cafeteriaId: user.cafeteriaId || "all",
        cafeteriaName: user.cafeteriaName || "All Campus Dining Facilities",
        portalTitle: user.cafeteriaId === "all" ? "Master System Administrator" : `${user.cafeteriaName} Administrator`,
      },
    };
  },
};
