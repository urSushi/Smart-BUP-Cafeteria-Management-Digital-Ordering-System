import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import { Spinner } from "../components/Loader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import Icon from "../components/Icons.jsx";
import { mockAuth } from "../data/mockAuth.js";

export default function Login() {
  const [method, setMethod] = useState("id"); // "id" | "otp"
  const [universityId, setUniversityId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const { login, requestLoginOtp, loading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const idValid = universityId.trim().length >= 4 && password.length >= 6;
  const emailValid = /^\S+@\S+\.\S+$/.test(email);

  // Quick fill helper for all ER diagram user roles & entities
  function handleFillDemo(type) {
    setError("");
    const demos = mockAuth.getDemoCredentials();
    if (type === "student") {
      setMethod("id");
      setUniversityId(demos.student.id);
      setPassword(demos.student.password);
      toast.info("Filled with Student Demo credentials (CSE, Batch 2021).");
    } else if (type === "faculty") {
      setMethod("id");
      setUniversityId(demos.faculty.id);
      setPassword(demos.faculty.password);
      toast.info("Filled with Faculty Demo credentials (BBA, Asst. Prof).");
    } else if (type === "officer") {
      setMethod("id");
      setUniversityId(demos.officer.id);
      setPassword(demos.officer.password);
      toast.info("Filled with Officer Demo credentials (Registrar Office).");
    } else if (type === "staff") {
      setMethod("id");
      setUniversityId(demos.staff.id);
      setPassword(demos.staff.password);
      toast.info("Filled with University Staff Demo credentials.");
    } else if (type === "guest") {
      setMethod("id");
      setUniversityId(demos.guest.id);
      setPassword(demos.guest.password);
      toast.info("Filled with Guest Code credentials (7-day Dining Pass).");
    } else if (type === "admin") {
      setMethod("id");
      setUniversityId(demos.portalAdmin.id);
      setPassword(demos.portalAdmin.password);
      toast.info("Filled with System Administrator credentials.");
    } else if (type === "otp") {
      setMethod("otp");
      setEmail("student@bup.edu.bd");
      toast.info("Filled with Student Email for OTP test.");
    }
  }

  async function handleIdLogin(e) {
    e.preventDefault();
    setError("");
    try {
      await login(universityId.trim(), password);
      toast.success("Welcome back to Smart Cafeteria!");
      navigate("/home");
    } catch (err) {
      setError(err.message || "Failed to log in. Please check credentials.");
    }
  }

  async function handleOtpRequest(e) {
    e.preventDefault();
    setError("");
    try {
      await requestLoginOtp(email.trim());
      toast.info("Verification code sent! (Use demo code 123456)");
      navigate("/otp-verification");
    } catch (err) {
      setError(err.message || "Failed to send code.");
    }
  }

  return (
    <>
      <Navbar />
      <div className="auth-shell">
        <div className="card auth-card">
          <div className="auth-header-crest">
            <span className="crest-badge">
              <Icon name="utensils" size={20} color="#fff" />
            </span>
          </div>

          <h1>Welcome Back</h1>
          <p className="sub">
            Log in to your campus dining account to order ahead and skip all counter queues.
          </p>

          {/* Quick Demo Credentials Bar for Easy Evaluation */}
          <div className="demo-fill-bar">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span className="demo-fill-label" style={{ fontWeight: 600 }}>Quick-Fill Demo Credentials:</span>
            </div>
            <div className="demo-fill-buttons" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              <button
                type="button"
                className="demo-fill-btn"
                onClick={() => handleFillDemo("student")}
                title="Student Entity (CSE, Batch 2021)"
              >
                <Icon name="graduationCap" size={13} />
                <span>Student</span>
              </button>
              <button
                type="button"
                className="demo-fill-btn"
                onClick={() => handleFillDemo("faculty")}
                title="Faculty Entity (BBA, Asst. Prof)"
              >
                <Icon name="briefcase" size={13} />
                <span>Faculty</span>
              </button>
              <button
                type="button"
                className="demo-fill-btn"
                onClick={() => handleFillDemo("officer")}
                title="Officer Entity (Registrar Office)"
              >
                <Icon name="shield" size={13} />
                <span>Officer</span>
              </button>
              <button
                type="button"
                className="demo-fill-btn"
                onClick={() => handleFillDemo("staff")}
                title="Staff Entity (Operations)"
              >
                <Icon name="user" size={13} />
                <span>Staff</span>
              </button>
              <button
                type="button"
                className="demo-fill-btn"
                onClick={() => handleFillDemo("guest")}
                title="Guest Entity (Valid Pass)"
              >
                <Icon name="users" size={13} />
                <span>Guest</span>
              </button>
              <button
                type="button"
                className="demo-fill-btn"
                onClick={() => handleFillDemo("admin")}
                title="System Administrator Entity"
              >
                <Icon name="settings" size={13} />
                <span>Sys Admin</span>
              </button>
              <button
                type="button"
                className="demo-fill-btn"
                onClick={() => handleFillDemo("otp")}
              >
                <Icon name="mail" size={13} />
                <span>OTP</span>
              </button>
            </div>
          </div>

          <div className="select-tabs" style={{ marginTop: 16 }}>
            <button
              type="button"
              className={method === "id" ? "active" : ""}
              onClick={() => {
                setMethod("id");
                setError("");
              }}
            >
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Icon name="user" size={14} />
                <span>University ID</span>
              </span>
            </button>
            <button
              type="button"
              className={method === "otp" ? "active" : ""}
              onClick={() => {
                setMethod("otp");
                setError("");
              }}
            >
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Icon name="mail" size={14} />
                <span>Email OTP</span>
              </span>
            </button>
          </div>

          {method === "id" ? (
            <form onSubmit={handleIdLogin}>
              <div className="field">
                <label htmlFor="universityId">University ID / Employee ID</label>
                <div className="input-wrap">
                  <input
                    id="universityId"
                    className="input"
                    value={universityId}
                    onChange={(e) => setUniversityId(e.target.value)}
                    placeholder="e.g. 2021-1-60-001 or FAC-101"
                    autoComplete="username"
                    required
                  />
                </div>
                <p className="field-hint">Your assigned campus student or employee ID.</p>
              </div>

              <div className="field">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label htmlFor="password" style={{ margin: 0 }}>Password</label>
                  <button
                    type="button"
                    className="field-action-link"
                    onClick={() => {
                      setMethod("otp");
                      toast.info("Enter your registered email to log in with an OTP.");
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>

                <div className="input-wrap">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className={`input ${error ? "has-error" : ""}`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
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
                {error && (
                  <p className="field-error">
                    <Icon name="alertCircle" size={14} />
                    <span>{error}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block btn-lg"
                disabled={!idValid || loading}
              >
                {loading ? <Spinner /> : "Log In to Account"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpRequest}>
              <div className="field">
                <label htmlFor="email">Registered University / Personal Email</label>
                <div className="input-wrap">
                  <input
                    id="email"
                    type="email"
                    className={`input ${error ? "has-error" : ""}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@bup.edu.bd"
                    autoComplete="email"
                    required
                  />
                </div>
                <p className="field-hint">
                  We will send a 6-digit code to this address for passwordless entry.
                </p>
                {error && (
                  <p className="field-error">
                    <Icon name="alertCircle" size={14} />
                    <span>{error}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block btn-lg"
                disabled={!emailValid || loading}
              >
                {loading ? <Spinner /> : "Send Verification Code"}
              </button>
            </form>
          )}

          <div className="auth-separator">
            <span>or explore other options</span>
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <Link to="/signup" className="btn btn-secondary btn-block btn-sm">
              <Icon name="graduationCap" size={15} />
              <span>Create Account</span>
            </Link>
            <Link to="/guest" className="btn btn-mustard btn-block btn-sm">
              <Icon name="shield" size={14} />
              <span>Guest Pass</span>
            </Link>
          </div>

          <div className="portal-access-card">
            <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)", fontWeight: 600 }}>
              Staff & Operations:
            </span>
            <div className="portal-access-links">
              <Link to="/staff/login">Staff Portal</Link>
              <span>·</span>
              <Link to="/manager/login">Manager Portal</Link>
              <span>·</span>
              <Link to="/admin/login">Admin</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
