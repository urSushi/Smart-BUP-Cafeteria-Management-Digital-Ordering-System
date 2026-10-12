import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService.js";

// Authentication state machine (see architecture notes in README):
//   idle -> otp_pending -> verified -> authenticated
// `authStage` below tracks this; `authenticated` is the boolean guard
// that <ProtectedRoute> checks.

const AuthContext = createContext(null);
const STORAGE_KEY = "sbcms_session";

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

function saveSession(session) {
  if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  else localStorage.removeItem(STORAGE_KEY);
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => loadSession());
  const [authStage, setAuthStage] = useState(session ? "authenticated" : "idle");
  const [pendingAuth, setPendingAuth] = useState(null); // { email, purpose }
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    saveSession(session);
  }, [session]);

  function applySession(data) {
    const next = { token: data.token, user: data.user, role: data.user?.role };
    setSession(next);
    setAuthStage("authenticated");
    setPendingAuth(null);
    return next;
  }

  const DEMO_EMAILS = [
    "student@bup.edu.bd",
    "faculty@bup.edu.bd",
    "officer@bup.edu.bd",
    "staff@bup.edu.bd",
    "guest@bup.edu.bd",
    "admin@bup.edu.bd",
  ];

  async function register(payload) {
    setLoading(true);
    try {
      const res = await authService.register(payload);
      setAuthStage("otp_pending");
      const universityEmail = payload.universityEmail;
      const personalEmail = payload.personalEmail || payload.email;
      setPendingAuth({
        email: personalEmail || universityEmail,
        personalEmail: personalEmail || null,
        universityEmail: universityEmail || null,
        purpose: "register",
        devOtp: res?.devOtp,
        emailSent: res?.emailSent,
        isDemo: false, // Absolutely NO DEMO in signup option!
      });
      return res;
    } finally {
      setLoading(false);
    }
  }

  async function guestRegister(payload) {
    setLoading(true);
    try {
      const res = await authService.guestRegister(payload);
      setAuthStage("otp_pending");
      const email = payload.personalEmail;
      const isDemo = DEMO_EMAILS.includes(email?.toLowerCase());
      setPendingAuth({
        email,
        purpose: "guest",
        devOtp: res?.devOtp,
        emailSent: res?.emailSent,
        isDemo,
      });
      return res;
    } finally {
      setLoading(false);
    }
  }

  async function initiateLogin(identifier, password) {
    setLoading(true);
    try {
      const cleanId = String(identifier || "").trim();
      const res = await authService.login(cleanId, password);
      const user = res.user;

      const primaryEmail = user?.personalEmail || user?.universityEmail || cleanId;
      const isDemo =
        DEMO_EMAILS.includes(String(primaryEmail).toLowerCase()) ||
        DEMO_EMAILS.includes(String(user?.personalEmail || "").toLowerCase()) ||
        DEMO_EMAILS.includes(String(user?.universityEmail || "").toLowerCase()) ||
        ["2021-1-60-001", "fac-101", "off-301", "stf-001", "gst-8890", "adm-001"].includes(
          String(user?.identifier || cleanId).toLowerCase()
        );

      let otpRes = null;
      try {
        otpRes = await authService.sendOtp(primaryEmail, "login");
      } catch (otpErr) {
        console.warn("[AuthContext] OTP send notice:", otpErr);
      }

      setAuthStage("otp_pending");
      setPendingAuth({
        identifier: user?.identifier || cleanId,
        email: primaryEmail,
        personalEmail: user?.personalEmail || null,
        universityEmail: user?.universityEmail || null,
        purpose: "login",
        tempSession: res,
        devOtp: otpRes?.devOtp || (isDemo ? "123456" : null),
        emailSent: otpRes?.emailSent || false,
        isDemo,
      });

      return {
        ok: true,
        user,
        email: primaryEmail,
        devOtp: otpRes?.devOtp || (isDemo ? "123456" : null),
        isDemo,
      };
    } finally {
      setLoading(false);
    }
  }

  async function login(universityId, password, options = {}) {
    if (!options.direct) {
      return initiateLogin(universityId, password);
    }
    setLoading(true);
    try {
      const res = await authService.login(universityId, password);
      return applySession(res);
    } finally {
      setLoading(false);
    }
  }

  async function requestLoginOtp(email) {
    setLoading(true);
    try {
      const res = await authService.sendOtp(email, "login");
      setAuthStage("otp_pending");
      const isDemo = DEMO_EMAILS.includes(email?.toLowerCase());
      setPendingAuth({
        email,
        purpose: "login",
        devOtp: res?.devOtp,
        emailSent: res?.emailSent,
        isDemo,
      });
      return res;
    } finally {
      setLoading(false);
    }
  }

  async function sendOtp(email, purpose) {
    const res = await authService.sendOtp(email, purpose);
    if (res?.devOtp) {
      setPendingAuth((prev) => (prev ? { ...prev, devOtp: res.devOtp, emailSent: res.emailSent } : prev));
    }
    return res;
  }

  async function verifyOtp(otp) {
    if (!pendingAuth) throw new Error("Nothing to verify — start over.");
    setLoading(true);
    try {
      const res = await authService.verifyOtp(pendingAuth.email, otp, pendingAuth.purpose);
      setAuthStage("verified");
      if (res.token) {
        applySession(res);
      } else if (pendingAuth.tempSession) {
        applySession(pendingAuth.tempSession);
      }
      return res;
    } finally {
      setLoading(false);
    }
  }

  async function staffLogin(staffId, password) {
    setLoading(true);
    try {
      const res = await authService.staffLogin(staffId, password);
      return applySession(res);
    } finally {
      setLoading(false);
    }
  }

  async function managerLogin(managerId, password) {
    setLoading(true);
    try {
      const res = await authService.managerLogin(managerId, password);
      return applySession(res);
    } finally {
      setLoading(false);
    }
  }

  async function adminLogin(adminId, password) {
    setLoading(true);
    try {
      const res = await authService.adminLogin(adminId, password);
      return applySession(res);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setSession(null);
    setAuthStage("idle");
    setPendingAuth(null);
  }

  const value = useMemo(
    () => ({
      user: session?.user || null,
      role: session?.role || null,
      token: session?.token || null,
      authenticated: Boolean(session?.token),
      authStage,
      pendingAuth,
      loading,
      register,
      guestRegister,
      login,
      initiateLogin,
      requestLoginOtp,
      sendOtp,
      verifyOtp,
      staffLogin,
      managerLogin,
      adminLogin,
      logout,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session, authStage, pendingAuth, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
