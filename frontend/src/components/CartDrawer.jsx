import React, { useState } from "react";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import Icon from "./Icons.jsx";
import AuthPromptModal from "./AuthPromptModal.jsx";
import { useLiveCafeterias } from "../utils/liveCafeterias.js";

export default function CartDrawer({ onProceedToPayment, onRequireAuth }) {
  const { authenticated } = useAuth();
  const { cafeterias } = useLiveCafeterias(4000);
  const {
    cartItems,
    cartCafeteria,
    itemsCount,
    subtotal,
    discount,
    total,
    promo,
    estimatedPrepTime,
    isCartOpen,
    setIsCartOpen,
    updateQty,
    updateItemNotes,
    removeFromCart,
    clearCart,
    applyPromoCode,
    removePromoCode,
  } = useCart();

  const [promoInput, setPromoInput] = useState("");
  const [editingNotesId, setEditingNotesId] = useState(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const currentCafeteriaObj = cafeterias.find((c) => c.id.toLowerCase() === cartCafeteria?.toLowerCase());
  const isCafeteriaClosed = currentCafeteriaObj ? !currentCafeteriaObj.isOpen : false;

  if (!isCartOpen) return null;

  const cafeteriaDisplayName =
    cartCafeteria === "vista"
      ? "Vista Cafe"
      : cartCafeteria === "amitie"
      ? "Amitie Cafeteria"
      : cartCafeteria === "pitstop"
      ? "Pitstop"
      : cartCafeteria === "monpura"
      ? "Third Place (Monpura)"
      : "Campus Cafeteria";

  function handleApplyPromo(e) {
    e.preventDefault();
    if (promoInput.trim()) {
      applyPromoCode(promoInput.trim());
      setPromoInput("");
    }
  }

  return (
    <div className="cart-backdrop" onClick={() => setIsCartOpen(false)}>
      <aside className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cart-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="cart-icon-bubble">
              <Icon name="shoppingBag" size={18} color="var(--teal)" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.15rem" }}>My Meal Cart</h3>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--teal-dark)", fontWeight: 600 }}>
                {cafeteriaDisplayName}
              </p>
            </div>
          </div>
          <button className="cart-close-btn" onClick={() => setIsCartOpen(false)} aria-label="Close cart">
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Content */}
        {cartItems.length === 0 ? (
          <div className="cart-empty-state">
            <div className="empty-icon-circle">
              <Icon name="utensils" size={32} color="var(--ink-soft)" />
            </div>
            <h4>Your cart is empty</h4>
            <p>Browse the cafeteria menu to select freshly prepared meals and snacks.</p>
            <button className="btn btn-primary btn-sm" onClick={() => setIsCartOpen(false)}>
              Browse Food Items
            </button>
          </div>
        ) : (
          <div className="cart-body">
            {/* Dynamic Prep Time Badge */}
            <div className="cart-prep-banner">
              <Icon name="clock" size={15} color="var(--mustard-dark)" />
              <span>
                Estimated Kitchen Prep: <strong>~{estimatedPrepTime} minutes</strong>
              </span>
            </div>

            {/* Items List */}
            <div className="cart-items-list">
              {cartItems.map((item) => (
                <div key={item.id} className="cart-item-card">
                  <div className="cart-item-main">
                    <div className="cart-item-info">
                      <div className="cart-item-title">{item.name}</div>
                      <div className="cart-item-price">৳{item.price} each</div>
                    </div>
                    <div className="cart-item-subtotal">৳{item.price * item.qty}</div>
                  </div>

                  {/* Quantity and Controls */}
                  <div className="cart-item-controls">
                    <div className="qty-pill">
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span>{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <button
                        type="button"
                        className="text-btn"
                        onClick={() => setEditingNotesId(editingNotesId === item.id ? null : item.id)}
                      >
                        <Icon name="messageSquare" size={13} />
                        <span>{item.notes ? "Edit note" : "Add note"}</span>
                      </button>

                      <button
                        type="button"
                        className="text-btn danger-text"
                        onClick={() => removeFromCart(item.id)}
                        aria-label="Remove item"
                      >
                        <Icon name="trash" size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Notes Input */}
                  {(editingNotesId === item.id || item.notes) && (
                    <div className="item-note-row">
                      <input
                        type="text"
                        placeholder="e.g. Less spicy, extra sauce, cold..."
                        value={item.notes || ""}
                        onChange={(e) => updateItemNotes(item.id, e.target.value)}
                        className="note-input"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Promo Code Section */}
            <div className="promo-box">
              {promo && promo.valid ? (
                <div className="promo-applied-badge">
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name="sparkles" size={14} color="var(--teal)" />
                    <span>
                      Coupon <strong>{promo.code}</strong> applied (-৳{discount})
                    </span>
                  </div>
                  <button type="button" onClick={removePromoCode} className="promo-remove-btn">
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="promo-form">
                  <input
                    type="text"
                    placeholder="Promo code (e.g. BUP20)"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    className="promo-input"
                  />
                  <button type="submit" className="btn btn-secondary btn-sm" disabled={!promoInput.trim()}>
                    Apply
                  </button>
                </form>
              )}
            </div>

            {/* Summary Breakdown */}
            <div className="cart-summary">
              <div className="summary-row">
                <span>Subtotal ({itemsCount} items)</span>
                <span>৳{subtotal}</span>
              </div>
              {discount > 0 && (
                <div className="summary-row discount-row">
                  <span>Campus Discount ({promo?.code})</span>
                  <span>-৳{discount}</span>
                </div>
              )}
              <div className="summary-row total-row">
                <span>Total Payable</span>
                <span className="total-amount">৳{total}</span>
              </div>
            </div>

            {/* Guest Order Notice when unauthenticated */}
            {!authenticated && (
              <div className="guest-cart-notice">
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <Icon name="shield" size={16} color="var(--mustard-dark)" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>Login Required to Order & Pay</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: 2 }}>
                      Your items are saved. Please log in or get a Guest Pass to complete checkout.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cafeteria Closed Notice */}
            {isCafeteriaClosed && (
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "var(--radius-sm)",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid #ef4444",
                  color: "#b91c1c",
                  fontSize: "0.82rem",
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Icon name="alertCircle" size={16} color="#dc2626" />
                <span>
                  <strong>{cafeteriaDisplayName} is currently closed.</strong> Online orders are paused by management. You cannot place an order at this moment.
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="cart-actions">
              {authenticated ? (
                <button
                  type="button"
                  className="btn btn-primary btn-block btn-lg"
                  disabled={isCafeteriaClosed}
                  onClick={() => {
                    if (isCafeteriaClosed) return;
                    setIsCartOpen(false);
                    if (onProceedToPayment) onProceedToPayment();
                  }}
                >
                  <span>{isCafeteriaClosed ? "Cafeteria Currently Closed" : "Proceed to Payment"}</span>
                  {!isCafeteriaClosed && <Icon name="arrowRight" size={16} />}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary btn-block btn-lg"
                  disabled={isCafeteriaClosed}
                  onClick={() => {
                    if (isCafeteriaClosed) return;
                    setIsCartOpen(false);
                    if (onRequireAuth) {
                      onRequireAuth();
                    } else {
                      setShowAuthPrompt(true);
                    }
                  }}
                >
                  <Icon name="lock" size={16} />
                  <span>{isCafeteriaClosed ? "Cafeteria Currently Closed" : "Log In to Order & Pay"}</span>
                  {!isCafeteriaClosed && <Icon name="arrowRight" size={16} />}
                </button>
              )}

              <button type="button" className="btn-link-muted" onClick={clearCart}>
                Clear Cart
              </button>
            </div>
          </div>
        )}
      </aside>

      <AuthPromptModal
        isOpen={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
      />
    </div>
  );
}
