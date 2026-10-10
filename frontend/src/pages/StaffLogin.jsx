import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Spinner } from "../components/Loader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import Icon from "../components/Icons.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import { mockAuth } from "../data/mockAuth.js";

export default function StaffLogin() {
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { staffLogin, loading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [selectedCanteenKey, setSelectedCanteenKey] = useState("");

  const isValid = staffId.trim().length > 0 && password.length >= 6;

  const staffDemos = mockAuth.getDemoCredentials().staffByCanteen || {};

  function handleCanteenSelect(key, item) {
    setSelectedCanteenKey(key);
    setStaffId(item.id);
    setPassword(item.password);
    setError("");
    toast.info(`Filled credentials for ${item.name} (${item.id}) — restricted to ${item.name}.`);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await staffLogin(staffId.trim(), password);
      toast.success("Welcome, Staff! Kitchen Display System activated.");
      navigate("/staff/dashboard");
    } catch (err) {
      setError(err.message || "Invalid staff credentials.");
    }
  }

  return (
    <div className="auth-shell portal-shell portal-staff">
      <div className="card auth-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div className="portal-badge portal-badge-amber" style={{ marginBottom: 0 }}>
            <Icon name="utensils" size={13} />
            <span>Kitchen & Order Fulfillment Portal</span>
          </div>
          <ThemeToggle />
        </div>

        <h1>Cafeteria Staff Login</h1>
        <p className="sub">
          Manage live counter orders, kitchen prep queues, and mark food items available.
        </p>

        {/* Separated Canteen Demo Pills (FR-10, FR-11) */}
        <div className="portal-canteen-demo-card">
          <div className="canteen-demo-header">
            <Icon name="sparkles" size={14} color="var(--mustard)" />
            <span>Select Demo Staff by Canteen (1-Click Fill):</span>
          </div>
          <div className="canteen-demo-grid">
            {Object.entries(staffDemos).map(([key, item]) => {
              const isSelected = staffId === item.id;
              return (
                <button
                  key={key}
                  type="button"
                  className={`canteen-demo-btn ${isSelected ? "active" : ""}`}
                  onClick={() => handleCanteenSelect(key, item)}
                >
                  <div className="canteen-demo-btn-top">
                    <strong>{item.name}</strong>
                    <span className="canteen-badge-id">{item.id}</span>
                  </div>
                  <div className="canteen-demo-btn-sub">
                    <span>{item.staffName}</span> · <span className="loc-text">{item.location}</span>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="canteen-demo-note">
            🔒 Staff members can only view & fulfill orders for their designated canteen.
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ textAlign: "left", marginTop: 16 }}>
          <div className="field">
            <label>Assigned Staff ID</label>
            <input
              className="input"
              placeholder="e.g. STF-001"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
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
            className="btn btn-mustard btn-block btn-lg"
            disabled={!isValid || loading}
            style={{ marginTop: 8 }}
          >
            {loading ? <Spinner dark /> : "Enter Kitchen Display"}
          </button>
        </form>

        <div className="portal-footer-links">
          <Link to="/" style={{ color: "var(--ink-soft)" }}>&larr; Back to Main Site</Link>
          <div style={{ display: "flex", gap: 12 }}>
            <Link to="/manager/login" style={{ color: "var(--ink-soft)" }}>Manager Portal</Link>
            <Link to="/admin/login" style={{ color: "var(--ink-soft)" }}>Admin Portal</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
