import React, { useState } from "react";
import { SAMPLE_ORDERS, SAMPLE_FAVORITES } from "../data/cafeterias.js";
import Icon from "./Icons.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function OrdersModal({ isOpen, onClose, initialTab = "orders" }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const toast = useToast();

  if (!isOpen) return null;

  function handleReorder(itemName) {
    toast.info(`Cart & checkout for "${itemName}" will be active in Module 2.`);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="modal-icon-badge">
              <Icon name="shoppingBag" size={20} color="var(--teal)" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.35rem" }}>My Campus Dining</h2>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--ink-soft)" }}>
                View your active pickups, dining history, and saved items
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="select-tabs" style={{ margin: "16px 0 20px" }}>
          <button
            type="button"
            className={activeTab === "orders" ? "active" : ""}
            onClick={() => setActiveTab("orders")}
          >
            Order History & Pickups
          </button>
          <button
            type="button"
            className={activeTab === "favorites" ? "active" : ""}
            onClick={() => setActiveTab("favorites")}
          >
            Saved Favorites
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: 4 }}>
          {activeTab === "orders" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {SAMPLE_ORDERS.map((order) => (
                <div key={order.id} className="order-ticket card" style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--teal-dark)", background: "var(--teal-tint)", padding: "2px 8px", borderRadius: 4 }}>
                        {order.id}
                      </span>
                      <h4 style={{ margin: "6px 0 2px", fontSize: "1.05rem" }}>{order.cafeteria}</h4>
                      <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>{order.time}</span>
                    </div>

                    <span className={`status-pill ${order.statusCode === "ready" ? "status-ready" : "status-completed"}`}>
                      {order.statusCode === "ready" && <span className="pulse-dot" />}
                      {order.status}
                    </span>
                  </div>

                  <div style={{ borderTop: "1px dashed var(--sand-line)", paddingTop: 10, marginBottom: 12 }}>
                    {order.items.map((item, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", marginBottom: 4 }}>
                        <span>{item.qty}x {item.name}</span>
                        <span style={{ fontWeight: 600 }}>৳{item.price * item.qty}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--sand-line)", paddingTop: 10 }}>
                    <div>
                      <span style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>Total Bill · Paid via bKash</span>
                      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--ink)" }}>৳{order.total}</div>
                    </div>
                    {order.statusCode === "ready" ? (
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--teal-dark)", fontWeight: 600 }}>Pickup at</span>
                        <div style={{ fontSize: "0.88rem", fontWeight: 700 }}>{order.pickupCounter}</div>
                      </div>
                    ) : (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleReorder(order.items[0]?.name)}
                      >
                        Reorder
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {SAMPLE_FAVORITES.map((fav) => (
                <div key={fav.id} className="card" style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--mustard-tint)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mustard-dark)" }}>
                      <Icon name="heart" size={18} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "0.98rem" }}>{fav.name}</h4>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--ink-soft)" }}>
                        {fav.cafeteria} · {fav.category}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontWeight: 700, color: "var(--teal-dark)" }}>৳{fav.price}</span>
                    <button className="btn btn-primary btn-sm" onClick={() => handleReorder(fav.name)}>
                      Order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ borderTop: "1px solid var(--sand-line)", marginTop: 20, paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>
            💡 Live order status updates automatically via WebSocket in Module 2.
          </span>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
