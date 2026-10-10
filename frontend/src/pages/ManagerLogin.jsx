import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Spinner } from "../components/Loader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import Icon from "../components/Icons.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import { mockAuth } from "../data/mockAuth.js";

export default function ManagerLogin() {
  const [managerId, setManagerId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { managerLogin, loading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [selectedManagerKey, setSelectedManagerKey] = useState("");

  const isValid = managerId.trim().length > 0 && password.length >= 6;

  const managerDemos = mockAuth.getDemoCredentials().managerByCanteen || {};

  function handleManagerSelect(key, item) {
    setSelectedManagerKey(key);
    setManagerId(item.id);
    setPassword(item.password);
    setError("");
    toast.info(`Filled credentials for ${item.name} (${item.id}) — ${item.location}.`);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await managerLogin(managerId.trim(), password);
      toast.success("Welcome, Manager! Operations dashboard activated.");
      navigate("/manager/dashboard");
    } catch (err) {
      setError(err.message || "Invalid manager credentials.");
    }
  }

  return (
    <div className="auth-shell portal-shell portal-manager">
      <div className="card auth-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div className="portal-badge portal-badge-teal" style={{ marginBottom: 0 }}>
            <Icon name="briefcase" size={13} />
            <span>Cafeteria Dining Operations & Menu</span>
          </div>
          <ThemeToggle />
        </div>

        <h1>Manager Portal Login</h1>
        <p className="sub">
          Manage cafeteria menus, pricing, inventory stock, staff shifts, and daily sales reports.
        </p>

        {/* Separated Canteen Manager Demo Pills */}
        <div className="portal-canteen-demo-card">
          <div className="canteen-demo-header">
            <Icon name="briefcase" size={14} color="var(--teal)" />
            <span>Select Demo Manager by Canteen (1-Click Fill):</span>
          </div>
          <div className="canteen-demo-grid">
            {Object.entries(managerDemos).map(([key, item]) => {
              const isSelected = managerId === item.id;
              return (
                <button
                  key={key}
                  type="button"
                  className={`canteen-demo-btn ${isSelected ? "active" : ""}`}
                  onClick={() => handleManagerSelect(key, item)}
                >
                  <div className="canteen-demo-btn-top">
                    <strong>{item.name}</strong>
                    <span className="canteen-badge-id">{item.id}</span>
                  </div>
                  <div className="canteen-demo-btn-sub">
                    <span>{item.mgrName}</span> · <span className="loc-text">{item.location}</span>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="canteen-demo-note">
            💼 Canteen managers oversee food menus, staff allocations, and operational performance.
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ textAlign: "left", marginTop: 16 }}>
          <div className="field">
            <label>Assigned Manager ID</label>
            <input
              className="input"
              placeholder="e.g. MGR-001"
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Password</label>
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
            {loading ? <Spinner /> : "Access Manager Console"}
          </button>
        </form>

        <div className="portal-footer-links">
          <Link to="/" style={{ color: "var(--ink-soft)" }}>&larr; Back to Main Site</Link>
          <div style={{ display: "flex", gap: 12 }}>
            <Link to="/staff/login" style={{ color: "var(--ink-soft)" }}>Staff Portal</Link>
            <Link to="/admin/login" style={{ color: "var(--ink-soft)" }}>Admin Portal</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
