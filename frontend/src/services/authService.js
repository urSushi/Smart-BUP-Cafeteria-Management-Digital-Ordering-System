// Module 1 Authentication Service.
// Automatically connects to the backend API when available.
// If the backend server is offline or unreachable (e.g. database not created,
// or frontend running standalone), it seamlessly falls back to the in-memory
// client-side dummy store (`mockAuth`) so all pages and flows work perfectly.

import { mockAuth } from "../data/mockAuth.js";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/auth";

async function request(path, body, mockFallbackFn) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    let data = {};
    try {
      data = await res.json();
    } catch {
      // empty response
    }

    if (!res.ok) {
      throw new Error(data.message || "Request failed");
    }
    return data;
  } catch (err) {
    // If backend connection fails (server offline, abort timeout, network error),
    // execute the seamless mock fallback with dummy data!
    if (mockFallbackFn) {
      console.info(`[SBCMS Demo Mode] Backend unreachable at ${path}, using mock data provider.`);
      return await mockFallbackFn();
    }
    throw err;
  }
}

export const authService = {
  register: (payload) =>
    request("/register", payload, () => mockAuth.register(payload)),

  login: (universityId, password) =>
    request("/login", { universityId, password }, () => mockAuth.login(universityId, password)),

  sendOtp: (email, purpose) =>
    request("/send-otp", { email, purpose }, () => mockAuth.sendOtp(email, purpose)),

  verifyOtp: (email, otp, purpose) =>
    request("/verify-otp", { email, otp, purpose }, () => mockAuth.verifyOtp(email, otp, purpose)),

  guestRegister: (payload) =>
    request("/guest-register", payload, () => mockAuth.guestRegister(payload)),

  staffLogin: (staffId, password) =>
    request("/staff/login", { staffId, password }, () => mockAuth.staffLogin(staffId, password)),

  managerLogin: (managerId, password) =>
    request("/manager/login", { managerId, password }, () => mockAuth.managerLogin(managerId, password)),

  adminLogin: (adminId, password) =>
    request("/admin/login", { adminId, password }, () => mockAuth.adminLogin(adminId, password)),
};
