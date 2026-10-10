import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Spinner } from "../components/Loader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import Icon from "../components/Icons.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import { mockAuth } from "../data/mockAuth.js";

export default function AdminLogin() {
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { adminLogin, loading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [selectedAdminKey, setSelectedAdminKey] = useState("");

  const isValid = adminId.trim().length > 0 && password.length >= 6;

  const adminDemos = mockAuth.getDemoCredentials().adminByCanteen || {};

  function handleAdminSelect(key, item) {
    setSelectedAdminKey(key);
    setAdminId(item.id);
    setPassword(item.password);
    setError("");
    toast.info(`Filled credentials for ${item.name} (${item.id}) — ${item.scope}.`);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await adminLogin(adminId.trim(), password);
      toast.success("Welcome, Administrator! Portal access granted.");
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message || "Invalid administrator credentials.");
    }
  }

  return (
    <div className="auth-shell portal-shell portal-admin">
      <div className="card auth-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div className="portal-badge portal-badge-teal" style={{ marginBottom: 0 }}>
            <Icon name="shield" size={13} />
            <span>System Administration & Governance</span>
          </div>
          <ThemeToggle />
        </div>

        <h1>System Administrator Login</h1>
        <p className="sub">
          Oversee campus user permissions, cafeteria vendor contracts, system logs, and security policies.
        </p>

        {/* Separated Canteen Admin Demo Pills */}
        <div className="portal-canteen-demo-card portal-canteen-demo-admin">
          <div className="canteen-demo-header">
            <Icon name="shield" size={14} color="var(--teal)" />
            <span>Select Administrator Scope (1-Click Fill):</span>
          </div>
          <div className="canteen-demo-grid canteen-demo-grid-admin">
            {Object.entries(adminDemos).map(([key, item]) => {
              const isSelected = adminId === item.id;
              return (
                <button
                  key={key}
                  type="button"
                  className={`canteen-demo-btn ${key === "all" ? "canteen-demo-btn-master" : ""} ${isSelected ? "active" : ""}`}
                  onClick={() => handleAdminSelect(key, item)}
                >
                  <div className="canteen-demo-btn-top">
                    <strong>{item.name}</strong>
                    <span className="canteen-badge-id">{item.id}</span>
                  </div>
                  <div className="canteen-demo-btn-sub">
                    <span>{item.scope}</span> · <span className="loc-text">{item.location}</span>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="canteen-demo-note">
            🛡️ Canteen admins manage only their assigned facility; Master Admin oversees all 4 canteens.
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ textAlign: "left", marginTop: 16 }}>
          <div className="field">
            <label>Master Admin ID</label>
            <input
              className="input"
              placeholder="e.g. ADM-001"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Admin Password</label>
            <div className="input-wrap">
              <input
                type={showPassword ? "text" : "password"}
                className={`input ${error ? "has-error" : ""}`}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="input-toggle"
                onClick={() => setShowPassword((s) => !s)}
                aria-label="Toggle password"
                style={{ color: "var(--ink-soft)" }}
              >
                <Icon name={showPassword ? "eyeOff" : "eye"} size={16} />
              </button>
            </div>
            {error && (
              <p className="field-error">
                <Icon name="alertCircle" size={13} />
                <span>{error}</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={!isValid || loading}
            style={{ marginTop: 8 }}
          >
            {loading ? <Spinner /> : "Authorize Admin Access"}
          </button>
        </form>

        <div className="portal-footer-links">
          <Link to="/" style={{ color: "var(--ink-soft)" }}>&larr; Back to Main Site</Link>
          <div style={{ display: "flex", gap: 12 }}>
            <Link to="/staff/login" style={{ color: "var(--ink-soft)" }}>Staff Portal</Link>
            <Link to="/manager/login" style={{ color: "var(--ink-soft)" }}>Manager Portal</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
