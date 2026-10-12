import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import { Spinner } from "../components/Loader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import Icon from "../components/Icons.jsx";
import { mockAuth } from "../data/mockAuth.js";

export default function Login() {
  const [method, setMethod] = useState("id"); // "id" | "email"
  const [universityId, setUniversityId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const { initiateLogin, loading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const idValid = universityId.trim().length >= 3 && password.length >= 6;
  const emailValid = /^\S+@\S+\.\S+$/.test(email.trim()) && password.length >= 6;
  const formValid = method === "id" ? idValid : emailValid;

  // Quick fill helper for all ER diagram user roles & entities
  function handleFillDemo(type) {
    setError("");
    const demos = mockAuth.getDemoCredentials();
    if (type === "student") {
      setUniversityId(demos.student.id);
      setEmail(demos.student.email);
      setPassword(demos.student.password);
      toast.info("Filled with Student Demo credentials (CSE, Batch 2021).");
    } else if (type === "faculty") {
      setUniversityId(demos.faculty.id);
      setEmail(demos.faculty.email);
      setPassword(demos.faculty.password);
      toast.info("Filled with Faculty Demo credentials (BBA, Asst. Prof).");
    } else if (type === "officer") {
      setUniversityId(demos.officer.id);
      setEmail(demos.officer.email);
      setPassword(demos.officer.password);
      toast.info("Filled with Officer Demo credentials (Registrar Office).");
    } else if (type === "staff") {
      setUniversityId(demos.staff.id);
      setEmail(demos.staff.email);
      setPassword(demos.staff.password);
      toast.info("Filled with University Staff Demo credentials.");
    } else if (type === "guest") {
      setUniversityId(demos.guest.id);
      setEmail(demos.guest.email);
      setPassword(demos.guest.password);
      toast.info("Filled with Guest Code credentials (7-day Dining Pass).");
    } else if (type === "admin") {
      setUniversityId(demos.portalAdmin.id);
      setEmail("admin@bup.edu.bd");
      setPassword(demos.portalAdmin.password);
      toast.info("Filled with System Administrator credentials.");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const identifier = method === "id" ? universityId.trim() : email.trim();
    if (!identifier) {
      setError(method === "id" ? "Please enter your University ID / Employee ID." : "Please enter your registered email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    try {
      const res = await initiateLogin(identifier, password);
      toast.info(res.isDemo ? "Password verified! Demo 6-digit OTP dispatched (123456)." : "Password verified! 6-digit OTP sent to your registered email.");
      navigate("/otp-verification");
    } catch (err) {
      setError(err.message || "Failed to log in. Please check your credentials.");
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
              className={method === "email" ? "active" : ""}
              onClick={() => {
                setMethod("email");
                setError("");
              }}
            >
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Icon name="mail" size={14} />
                <span>Registered Email</span>
              </span>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {method === "id" ? (
              <div className="field">
                <label htmlFor="universityId">University ID / Employee ID</label>
                <div className="input-wrap">
                  <input
                    id="universityId"
                    className={`input ${error && !password ? "has-error" : ""}`}
                    value={universityId}
                    onChange={(e) => setUniversityId(e.target.value)}
                    placeholder="e.g. 2021-1-60-001 or FAC-101"
                    autoComplete="username"
                    required
                  />
                </div>
                <p className="field-hint">Your assigned campus student, faculty, officer, or staff ID.</p>
              </div>
            ) : (
              <div className="field">
                <label htmlFor="email">Registered University / Personal Email</label>
                <div className="input-wrap">
                  <input
                    id="email"
                    type="email"
                    className={`input ${error && !password ? "has-error" : ""}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. student@bup.edu.bd or personal@gmail.com"
                    autoComplete="email"
                    required
                  />
                </div>
                <p className="field-hint">The personal or official university email registered to your account.</p>
              </div>
            )}

            <div className="field">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label htmlFor="password" style={{ margin: 0 }}>Password</label>
                <button
                  type="button"
                  className="field-action-link"
                  onClick={() => {
                    toast.info("To reset your password, please contact the campus administrator at admin@bup.edu.bd.");
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

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 10,
                background: "var(--teal-tint)",
                border: "1px solid rgba(15, 118, 110, 0.2)",
                marginBottom: 18,
                fontSize: "0.82rem",
                color: "var(--teal)",
                lineHeight: 1.45,
              }}
            >
              <Icon name="shield" size={18} color="var(--teal)" style={{ flexShrink: 0 }} />
              <span>
                <strong>Mandatory 2FA Verification:</strong> A 6-digit OTP will be dispatched to your registered email upon password verification.
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={!formValid || loading}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Spinner />
                  <span>Verifying Credentials...</span>
                </span>
              ) : (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span>Verify Password &amp; Get OTP</span>
                  <Icon name="arrowRight" size={16} />
                </span>
              )}
            </button>
          </form>

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
