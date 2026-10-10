import React, { useState } from "react";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { apiService } from "../services/apiService.js";
import { useOrders } from "../context/OrderContext.jsx";
import Icon from "./Icons.jsx";
import { Spinner } from "./Loader.jsx";

export default function PaymentModal({ isOpen, onClose, onOrderConfirmed }) {
  const { cartItems, cartCafeteria, total, subtotal, discount, promo, clearCart } = useCart();
  const { user, authenticated } = useAuth();
  const { refreshOrders } = useOrders();
  const toast = useToast();

  const [method, setMethod] = useState("bkash"); // bkash | nagad | cash
  const [step, setStep] = useState("input"); // input | otp | pin
  const [mobileNumber, setMobileNumber] = useState("01711223344");
  const [otp, setOtp] = useState("123456");
  const [pin, setPin] = useState("12345");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;
  if (!authenticated) return null;

  async function handleCompleteOrder(paymentDetails) {
    if (!authenticated || !user) {
      toast.error("You must be logged in to pay and place an order.");
      onClose();
      return;
    }
    setLoading(true);
    try {
      // 1. Confirm Payment with sandbox service
      let transactionId = null;
      if (method !== "cash") {
        const payRes = await apiService.confirmPayment({
          method,
          mobileNumber,
          otp,
          pin,
          amount: total,
        });
        transactionId = payRes.transactionId;
      }

      // 2. Place Order in Backend API
      const orderPayload = {
        cafeteriaId: cartCafeteria,
        items: cartItems.map((i) => ({
          id: i.id,
          name: i.name,
          price: i.price,
          qty: i.qty,
          notes: i.notes || "",
        })),
        subtotal,
        discount,
        promoCode: promo?.code || null,
        total,
        paymentMethod: method,
        transactionId,
        mobileNumber: method !== "cash" ? mobileNumber : (user?.phone || "01711223344"),
        userFullName: user?.fullName || "BUP Student",
        userIdentifier: user?.identifier || "2021-1-60-001",
        userId: user?.id || 1,
      };

      const res = await apiService.placeOrder(orderPayload);
      clearCart();
      toast.success(`Order placed! Your pickup token is #${res.order.tokenNumber}.`);
      await refreshOrders();
      onClose();
      if (onOrderConfirmed) onOrderConfirmed(res.order);
    } catch (err) {
      toast.error(err.message || "Payment or order submission failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card card payment-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="payment-modal-header">
          <div>
            <span className="badge badge-open" style={{ marginBottom: 4 }}>
              Sandbox Payment Gateway
            </span>
            <h2 style={{ margin: "4px 0 2px", fontSize: "1.35rem" }}>Complete Payment</h2>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-soft)" }}>
              Total Payable: <strong style={{ color: "var(--ink)", fontSize: "1rem" }}>৳{total}</strong>
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Payment Method Selector */}
        <div className="payment-method-tabs">
          <button
            type="button"
            className={`pay-tab ${method === "bkash" ? "active bkash-active" : ""}`}
            onClick={() => {
              setMethod("bkash");
              setStep("input");
            }}
          >
            <span className="pay-tab-logo bkash-logo">bKash</span>
            <div>
              <span style={{ display: "block" }}>bKash Wallet</span>
              <span className="pay-tab-sub">30m · Auto Refund</span>
            </div>
          </button>

          <button
            type="button"
            className={`pay-tab ${method === "nagad" ? "active nagad-active" : ""}`}
            onClick={() => {
              setMethod("nagad");
              setStep("input");
            }}
          >
            <span className="pay-tab-logo nagad-logo">Nagad</span>
            <div>
              <span style={{ display: "block" }}>Nagad Wallet</span>
              <span className="pay-tab-sub">30m · Auto Refund</span>
            </div>
          </button>

          <button
            type="button"
            className={`pay-tab ${method === "cash" ? "active cash-active" : ""}`}
            onClick={() => {
              setMethod("cash");
              setStep("input");
            }}
          >
            <Icon name="coffee" size={18} color="var(--teal)" />
            <div>
              <span style={{ display: "block" }}>Pay at Counter</span>
              <span className="pay-tab-sub" style={{ color: "var(--brick)" }}>15m Pickup Limit</span>
            </div>
          </button>
        </div>

        {/* Gateway Body */}
        <div className="payment-body">
          {method === "cash" ? (
            <div className="cash-counter-box">
              <div className="cash-icon-circle">
                <Icon name="zap" size={28} color="var(--teal)" />
              </div>
              <h4>Cash on Pickup (Reliability Fallback)</h4>
              <p>
                No mobile balance right now? No problem! Your order will be sent straight to the kitchen.
                Simply show your <strong>Token Number</strong> or <strong>QR Code</strong> at the counter and pay in cash.
              </p>

              {/* 15-Minute Pickup Policy Callout */}
              <div className="deadline-alert-banner alert-counter">
                <Icon name="clock" size={20} color="var(--brick)" />
                <div>
                  <strong style={{ color: "var(--brick)" }}>⚠️ Strict 15-Minute Pickup Deadline:</strong>
                  <div style={{ fontSize: "0.82rem", marginTop: 2 }}>
                    You must pick up your meal within <strong>15 minutes</strong> of placing this order.
                    If uncollected after 15 minutes, the order will be automatically cancelled to prevent food waste.
                  </div>
                </div>
              </div>

              <div className="cash-notice">
                <Icon name="shield" size={15} color="var(--teal-dark)" />
                <span>Single-collection guarantee: order closes immediately upon payment & collection.</span>
              </div>
            </div>
          ) : (
            <div className={`mfs-sandbox-box ${method === "bkash" ? "bkash-theme" : "nagad-theme"}`}>
              {/* 30-Minute Pickup & Admin Refund Protection Banner */}
              <div className="deadline-alert-banner alert-prepaid">
                <Icon name="shield" size={20} color="var(--teal)" />
                <div>
                  <strong style={{ color: "var(--teal)" }}>🛡️ 30-Minute Pickup Window & Admin Refund Protection:</strong>
                  <div style={{ fontSize: "0.82rem", marginTop: 2 }}>
                    You have <strong>30 minutes</strong> to collect your meal. If uncollected within 30 minutes, your order is automatically cancelled, and your paid <strong>৳{total}</strong> will be refunded back to your {method.toUpperCase()} account via the System Admin.
                  </div>
                </div>
              </div>

              <div className="mfs-header" style={{ marginTop: 12 }}>
                <strong>{method.toUpperCase()} PGW Sandbox</strong>
                <span className="sandbox-pill">TEST MODE</span>
              </div>

              {step === "input" && (
                <div className="mfs-form-step">
                  <label>Your {method === "bkash" ? "bKash" : "Nagad"} Account Number</label>
                  <div className="mfs-input-wrap">
                    <span className="prefix">+88</span>
                    <input
                      type="text"
                      className="mfs-input"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="01XXXXXXXXX"
                    />
                  </div>
                  <p className="mfs-hint">Demo evaluation number pre-filled. Click continue to receive sandbox OTP.</p>
                </div>
              )}

              {step === "otp" && (
                <div className="mfs-form-step">
                  <label>Enter 6-Digit Verification Code (OTP)</label>
                  <input
                    type="text"
                    className="mfs-input otp-large"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                  />
                  <p className="mfs-hint">Sandbox code: <strong>123456</strong></p>
                </div>
              )}

              {step === "pin" && (
                <div className="mfs-form-step">
                  <label>Enter {method.toUpperCase()} PIN</label>
                  <input
                    type="password"
                    className="mfs-input pin-large"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    maxLength={5}
                    placeholder="•••••"
                  />
                  <p className="mfs-hint">Sandbox PIN: <strong>12345</strong></p>
                </div>
              )}
            </div>
          )}

          {/* Action Footer */}
          <div className="payment-footer-actions">
            {method === "cash" ? (
              <button
                type="button"
                className="btn btn-primary btn-block btn-lg"
                disabled={loading}
                onClick={() => handleCompleteOrder({ method: "cash" })}
              >
                {loading ? <Spinner /> : `Confirm & Place Order (৳${total})`}
              </button>
            ) : step === "input" ? (
              <button
                type="button"
                className={`btn btn-block btn-lg ${method === "bkash" ? "btn-bkash" : "btn-nagad"}`}
                onClick={() => setStep("otp")}
              >
                <span>Continue to OTP</span>
                <Icon name="arrowRight" size={16} />
              </button>
            ) : step === "otp" ? (
              <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-lg"
                  style={{ minWidth: 90 }}
                  onClick={() => setStep("input")}
                >
                  Back
                </button>
                <button
                  type="button"
                  className={`btn btn-lg ${method === "bkash" ? "btn-bkash" : "btn-nagad"}`}
                  style={{ flex: 1 }}
                  onClick={() => setStep("pin")}
                >
                  <span>Verify OTP</span>
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-lg"
                  style={{ minWidth: 90 }}
                  onClick={() => setStep("otp")}
                >
                  Back
                </button>
                <button
                  type="button"
                  className={`btn btn-lg ${method === "bkash" ? "btn-bkash" : "btn-nagad"}`}
                  style={{ flex: 1 }}
                  disabled={loading}
                  onClick={() => handleCompleteOrder({ method, mobileNumber, otp, pin })}
                >
                  {loading ? <Spinner /> : `Pay ৳${total} & Place Order`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
