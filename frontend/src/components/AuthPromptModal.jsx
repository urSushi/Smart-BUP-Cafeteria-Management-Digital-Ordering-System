import React from "react";
import { useNavigate } from "react-router-dom";
import Icon from "./Icons.jsx";
import { useCart } from "../context/CartContext.jsx";

export default function AuthPromptModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { itemsCount, total } = useCart();

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card card auth-prompt-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 480 }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "var(--teal-tint)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--teal)",
              }}
            >
              <Icon name="lock" size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.25rem", color: "var(--ink)" }}>Login Required to Order</h3>
              <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "var(--ink-soft)" }}>
                Browsing is public, but placing orders & paying requires sign-in.
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Cart preservation pill */}
        {itemsCount > 0 && (
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(15, 118, 110, 0.08)",
              border: "1px solid rgba(15, 118, 110, 0.2)",
              borderRadius: "var(--radius-md)",
              marginBottom: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "0.85rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="shoppingBag" size={16} color="var(--teal)" />
              <span>
                Your cart (<strong>{itemsCount} items · ৳{total}</strong>) will be saved!
              </span>
            </div>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--teal-dark)", textTransform: "uppercase" }}>
              Saved in Cart
            </span>
          </div>
        )}

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* 1. Student / Staff Login */}
          <button
            type="button"
            className="auth-choice-card"
            onClick={() => {
              onClose();
              navigate("/login");
            }}
          >
            <div className="choice-icon choice-primary">
              <Icon name="user" size={18} />
            </div>
            <div className="choice-info">
              <strong>University Account Login</strong>
              <span>For BUP Students, Faculty members, and Staff</span>
            </div>
            <Icon name="chevronRight" size={16} color="var(--ink-muted)" />
          </button>

          {/* 2. Guest Pass */}
          <button
            type="button"
            className="auth-choice-card"
            onClick={() => {
              onClose();
              navigate("/guest");
            }}
          >
            <div className="choice-icon choice-mustard">
              <Icon name="shield" size={18} />
            </div>
            <div className="choice-info">
              <strong>Instant 7-Day Guest Pass</strong>
              <span>Fast access for visitors, guardians, and guests</span>
            </div>
            <Icon name="chevronRight" size={16} color="var(--ink-muted)" />
          </button>

          {/* 3. Register */}
          <button
            type="button"
            className="auth-choice-card"
            onClick={() => {
              onClose();
              navigate("/signup");
            }}
          >
            <div className="choice-icon choice-subtle">
              <Icon name="sparkles" size={18} />
            </div>
            <div className="choice-info">
              <strong>Register New Student / Staff Account</strong>
              <span>Requires verified @bup.edu.bd university email</span>
            </div>
            <Icon name="chevronRight" size={16} color="var(--ink-muted)" />
          </button>
        </div>

        {/* Cancel button */}
        <div style={{ marginTop: 18, textAlign: "center" }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ width: "100%", color: "var(--ink-soft)" }}
            onClick={onClose}
          >
            Continue Browsing Menu
          </button>
        </div>
      </div>
    </div>
  );
}
