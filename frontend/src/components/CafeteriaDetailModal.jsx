import React from "react";
import Icon from "./Icons.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function CafeteriaDetailModal({ cafeteria, isOpen, onClose, onOpenMenu }) {
  const toast = useToast();

  if (!isOpen || !cafeteria) return null;

  const {
    id,
    name,
    tagline,
    building,
    floor,
    image,
    isOpen: open,
    openingHours,
    queueMinutes,
    crowdLevel,
    rating,
    reviewsCount,
    cuisine,
    popularItems = [],
  } = cafeteria;

  function handleStartOrder() {
    if (!open) {
      toast.info(`${name} is currently closed. Reopens at ${openingHours}.`);
      return;
    }
    onClose();
    if (onOpenMenu) onOpenMenu();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card card detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="detail-hero">
          <img src={image} alt={name} className="detail-hero-img" />
          <div className="detail-hero-overlay">
            <span className={`badge ${open ? "badge-open" : "badge-closed"}`}>
              {open ? (
                <>
                  <span className="pulse-dot" />
                  <span>Open Now</span>
                </>
              ) : (
                <>
                  <span className="closed-dot" />
                  <span>Closed</span>
                </>
              )}
            </span>
            <button className="detail-close-btn" onClick={onClose} aria-label="Close">
              <Icon name="x" size={18} />
            </button>
          </div>
        </div>

        <div className="detail-content">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div>
              <h2 style={{ margin: "0 0 4px", fontSize: "1.45rem" }}>{name}</h2>
              <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--teal-dark)", fontWeight: 500 }}>
                {tagline}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--mustard-tint)", padding: "4px 10px", borderRadius: 999 }}>
              <Icon name="star" size={15} color="var(--mustard-dark)" />
              <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--ink)" }}>{rating}</span>
              <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>({reviewsCount})</span>
            </div>
          </div>

          <div className="detail-meta-grid">
            <div className="detail-meta-item">
              <Icon name="mapPin" size={16} color="var(--teal)" />
              <div>
                <span className="meta-label">Location</span>
                <span className="meta-val">{building}, {floor}</span>
              </div>
            </div>
            <div className="detail-meta-item">
              <Icon name="clock" size={16} color="var(--teal)" />
              <div>
                <span className="meta-label">Operating Hours</span>
                <span className="meta-val">{openingHours}</span>
              </div>
            </div>
            <div className="detail-meta-item">
              <Icon name="zap" size={16} color="var(--mustard-dark)" />
              <div>
                <span className="meta-label">Live Queue Estimate</span>
                <span className="meta-val" style={{ color: open ? "var(--teal-dark)" : "var(--ink-soft)", fontWeight: 700 }}>
                  {open ? `~${queueMinutes} min wait (${crowdLevel})` : "Closed"}
                </span>
              </div>
            </div>
            <div className="detail-meta-item">
              <Icon name="utensils" size={16} color="var(--teal)" />
              <div>
                <span className="meta-label">Cuisine</span>
                <span className="meta-val">{cuisine}</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Today's Kitchen Menu</h3>
              <span style={{ fontSize: "0.8rem", color: "var(--teal-dark)", fontWeight: 600 }}>
                ● Synced Live with Counter
              </span>
            </div>

            <div className="popular-items-grid">
              {popularItems.map((item, i) => (
                <div key={i} className="popular-item-card">
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span className="item-tag">{item.tag}</span>
                      <span style={{ fontSize: "0.74rem", color: "var(--ink-soft)" }}>{item.calories}</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{item.name}</div>
                    <div style={{ fontWeight: 700, color: "var(--teal-dark)", marginTop: 6, fontSize: "1.05rem" }}>
                      ৳{item.price}
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleStartOrder(item)}
                    disabled={!open}
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="detail-actions" style={{ marginTop: 24, display: "flex", gap: 12 }}>
            <button
              className="btn btn-primary btn-block"
              onClick={() => {
                if (popularItems[0]) handleStartOrder(popularItems[0]);
              }}
              disabled={!open}
            >
              {open ? "Order Ahead from This Cafeteria" : "Cafeteria Currently Closed"}
            </button>
            <button className="btn btn-secondary" onClick={onClose}>
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
