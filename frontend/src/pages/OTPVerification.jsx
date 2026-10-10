import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import OTPModal from "../components/OTPModal.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import Icon from "../components/Icons.jsx";

const PURPOSE_COPY = {
  register: {
    title: "Verify University Email",
    sub: "Confirm your email address to complete registration.",
  },
  login: {
    title: "Two-Factor Verification",
    sub: "Verify it's you to securely log in to your account.",
  },
  guest: {
    title: "Activate Guest Access",
    sub: "Verify your email to start your 7-day campus pass.",
  },
};

export default function OTPVerification() {
  const { pendingAuth, verifyOtp, sendOtp, loading } = useAuth();
  const [error, setError] = useState("");
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    setError("");
  }, [pendingAuth]);

  // If page is accessed directly, provide a demo fallback context instead of bouncing
  const effectiveAuth = pendingAuth || {
    email: "student@bup.edu.bd",
    purpose: "login",
    isDemo: true,
  };

  async function handleVerify(otp) {
    setError("");
    try {
      const res = await verifyOtp(otp);
      if (res.token) {
        toast.success("Identity verified! Welcome to Smart Cafeteria.");
        navigate("/home");
      } else {
        toast.success("Verified successfully. You may now log in.");
        navigate("/login");
      }
    } catch (err) {
      setError(err.message || "Invalid or expired verification code. Please check your email.");
    }
  }

  async function handleResend() {
    try {
      const res = await sendOtp(effectiveAuth.email, effectiveAuth.purpose);
      if (res?.emailSent) {
        toast.info("A new 6-digit verification code has been dispatched to your email inbox.");
      } else {
        toast.info("A new 6-digit verification code has been generated in the database.");
      }
    } catch (err) {
      toast.error(err.message || "Failed to resend code.");
    }
  }

  const copy = PURPOSE_COPY[effectiveAuth.purpose] || PURPOSE_COPY.register;

  return (
    <>
      <Navbar />
      <div className="auth-shell">
        <div className="card auth-card">
          <div className="auth-header-crest">
            <span className="crest-badge">
              <Icon name="shield" size={20} color="#fff" />
            </span>
          </div>

          <h1>{copy.title}</h1>
          <p className="sub">{copy.sub}</p>

          <OTPModal
            email={effectiveAuth.email}
            personalEmail={effectiveAuth.personalEmail}
            purpose={effectiveAuth.purpose}
            isDemo={effectiveAuth.isDemo}
            devOtp={effectiveAuth.devOtp}
            emailSent={effectiveAuth.emailSent}
            onVerify={handleVerify}
            onResend={handleResend}
            loading={loading}
            error={error}
          />

          <div style={{ marginTop: 24, borderTop: "1px solid var(--sand-line)", paddingTop: 14 }}>
            <Link to="/login" style={{ fontSize: "0.85rem", color: "var(--ink-soft)", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon name="arrowRight" size={14} style={{ transform: "rotate(180deg)" }} />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
