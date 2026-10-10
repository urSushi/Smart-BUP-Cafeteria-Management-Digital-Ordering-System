import React from "react";
import QRCodeDisplay from "./QRCodeDisplay.jsx";
import Icon from "./Icons.jsx";

export default function OrderConfirmationModal({ order, isOpen, onClose, onTrackOrder }) {
  if (!isOpen || !order) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card card order-confirm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Success Header */}
        <div className="order-confirm-header">
          <div className="success-pulse-circle">
            <Icon name="checkCircle" size={36} color="var(--teal)" />
          </div>
          <h2 style={{ margin: "12px 0 4px", fontSize: "1.5rem" }}>Order Confirmed!</h2>
          <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--ink-soft)" }}>
            Sent to {order.cafeteriaName} kitchen queue
          </p>
        </div>

        {/* Token and QR Display Card */}
        <div className="token-qr-hero">
          <div className="token-callout">
            <span className="token-label">YOUR PICKUP TOKEN</span>
            <div className="token-number-hero">#{order.tokenNumber}</div>
            <span className="token-sub">Present this number or scan QR at counter</span>
          </div>

          <div style={{ margin: "14px 0" }}>
            <QRCodeDisplay
              value={order.qrCodeData || `SBCMS:${order.id}:${order.tokenNumber}:${order.cafeteriaId}`}
              size={150}
              tokenText={`#${order.tokenNumber}`}
            />
          </div>

          {/* Logistics pill */}
          <div className="confirm-meta-grid">
            <div className="meta-box">
              <Icon name="clock" size={16} color="var(--teal)" />
              <div>
                <span className="meta-muted">Estimated Prep</span>
                <strong>~{order.prepTimeMinutes} mins</strong>
              </div>
            </div>

            <div className="meta-box">
              <Icon name="mapPin" size={16} color="var(--teal)" />
              <div>
                <span className="meta-muted">Pickup Window</span>
                <strong>{order.pickupCounter}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Items summary */}
        <div className="confirm-items-snippet">
          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--ink-soft)", marginBottom: 6 }}>
            ORDERED ITEMS ({order.items.length})
          </div>
          {order.items.map((item, idx) => (
            <div key={idx} className="confirm-item-row">
              <span>{item.qty}x {item.name}</span>
              <span style={{ fontWeight: 600 }}>৳{item.price * item.qty}</span>
            </div>
          ))}
          <div className="confirm-total-row">
            <span>Total Paid ({order.paymentMethod.toUpperCase()})</span>
            <strong>৳{order.total}</strong>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ flex: 1 }}
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ flex: 2 }}
            onClick={() => {
              onClose();
              if (onTrackOrder) onTrackOrder(order);
            }}
          >
            <Icon name="zap" size={16} />
            <span>Track Live Order</span>
          </button>
        </div>
      </div>
    </div>
  );
}
