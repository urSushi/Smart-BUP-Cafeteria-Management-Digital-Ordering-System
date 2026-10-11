import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import { Spinner } from "../components/Loader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import Icon from "../components/Icons.jsx";

export default function GuestSignup() {
  const [form, setForm] = useState({
    fullName: "",
    personalEmail: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { guestRegister, loading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const set = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const emailValid = /^\S+@\S+\.\S+$/.test(form.personalEmail);
  const passwordsMatch = form.password.length >= 6 && form.password === form.confirmPassword;
  const isValid =
    form.fullName.trim().length > 1 && emailValid && form.phone.trim().length >= 7 && passwordsMatch;

  function handleFillDemoGuest() {
    setError("");
    const randomId = Math.floor(100 + Math.random() * 900);
    setForm({
      fullName: "Kamran Hassan (Visitor)",
      personalEmail: `kamran.guest${randomId}@gmail.com`,
      phone: "01788990011",
      password: "password123",
      confirmPassword: "password123",
    });
    toast.info("Filled with sample visitor pass data.");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await guestRegister(form);
      toast.info("Verify your email code to activate your 7-day campus pass.");
      navigate("/otp-verification");
    } catch (err) {
      setError(err.message || "Failed to initiate guest pass.");
    }
  }

  return (
    <>
      <Navbar />
      <div className="auth-shell">
        <div className="card auth-card">
          <div className="auth-header-crest">
            <span className="crest-badge" style={{ background: "linear-gradient(135deg, var(--mustard), var(--mustard-dark))" }}>
              <Icon name="shield" size={20} color="#fff" />
            </span>
          </div>

          <span className="portal-badge" style={{ background: "var(--mustard-tint)", color: "var(--mustard-dark)", border: "1px solid var(--mustard)" }}>
            Campus Visitor Pass · 7 Days Access
          </span>

          <h1>Continue as Guest</h1>
          <p className="sub">
            Attending a conference, seminar, or visiting campus? Enjoy full mobile cafeteria ordering without a student ID.
          </p>

          <div className="demo-fill-bar" style={{ marginBottom: 18 }}>
            <span className="demo-fill-label">Instant Test:</span>
            <button
              type="button"
              className="demo-fill-btn"
              onClick={handleFillDemoGuest}
            >
              <Icon name="sparkles" size={13} />
              <span>Fill Sample Guest Data</span>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Full Name</label>
              <input
                className="input"
                placeholder="e.g. Kamran Hassan"
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Email Address</label>
              <input
                type="email"
                className="input"
                placeholder="e.g. yourname.visitor@gmail.com"
                value={form.personalEmail}
                onChange={(e) => set("personalEmail", e.target.value)}
                required
              />
              <p className="field-hint">Your 6-digit activation code will be sent here.</p>
            </div>

            <div className="field">
              <label>Contact Phone Number</label>
              <input
                type="tel"
                className="input"
                placeholder="e.g. 01712-345678"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Password</label>
              <div className="input-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  className="input"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="e.g. At least 6 characters"
                  required
                />
                <button
                  type="button"
                  className="input-toggle"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <Icon name={showPassword ? "eyeOff" : "eye"} size={17} />
                </button>
              </div>
            </div>

            <div className="field">
              <label>Confirm Password</label>
              <div className="input-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`input ${form.confirmPassword && !passwordsMatch ? "has-error" : ""}`}
                  value={form.confirmPassword}
                  onChange={(e) => set("confirmPassword", e.target.value)}
                  placeholder="e.g. Re-enter your password"
                  required
                />
              </div>
              {form.confirmPassword && !passwordsMatch && (
                <p className="field-error">
                  <Icon name="alertCircle" size={13} />
                  <span>Passwords do not match.</span>
                </p>
              )}
            </div>

            {error && (
              <p className="field-error" style={{ marginBottom: 14 }}>
                <Icon name="alertCircle" size={14} />
                <span>{error}</span>
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={!isValid || loading}
            >
              {loading ? <Spinner /> : "Issue 7-Day Guest Pass"}
            </button>
          </form>

          <div className="info-box-guest" style={{ marginTop: 20, padding: 14, background: "var(--paper)", borderRadius: "var(--radius-sm)", border: "1px dashed var(--sand-line)", fontSize: "0.82rem", color: "var(--ink-soft)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>
              <Icon name="clock" size={14} color="var(--mustard-dark)" />
              <span>Automatic 7-Day Window</span>
            </div>
            Guest passes remain active for exactly 7 days from the moment of OTP verification. You can re-register anytime.
          </div>

          <p className="auth-foot" style={{ marginTop: 20 }}>
            Have an official university ID? <Link to="/signup">Register as Student/Staff</Link>
          </p>
        </div>
      </div>
    </>
  );
}
