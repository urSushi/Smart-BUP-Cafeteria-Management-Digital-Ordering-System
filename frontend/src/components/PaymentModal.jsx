import React, { useState } from "react";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { apiService } from "../services/apiService.js";
import { useOrders } from "../context/OrderContext.jsx";
import QRCodeDisplay from "./QRCodeDisplay.jsx";
import Icon from "./Icons.jsx";
import { Spinner } from "./Loader.jsx";

// Audio tone synthesizer for QR scan acoustic feedback
function playScanSound(success = true) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = success ? "sine" : "sawtooth";
    osc.frequency.setValueAtTime(success ? 880 : 220, now);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  } catch {}
}

export default function PaymentModal({ isOpen, onClose, onOrderConfirmed }) {
  const { cartItems, cartCafeteria, total, subtotal, discount, promo, clearCart } = useCart();
  const { user, authenticated } = useAuth();
  const { refreshOrders } = useOrders();
  const toast = useToast();

  const [method, setMethod] = useState("bkash"); // bkash | nagad | qr | cash
  const [step, setStep] = useState("input"); // input | otp | pin (for MFS number flow)
  const [mfsMode, setMfsMode] = useState("otp"); // "otp" | "qr" (inside bKash/Nagad)
  const [qrSubMode, setQrSubMode] = useState("merchant"); // "merchant" | "scanner" (inside QR Pay)
  const [counterQrCode, setCounterQrCode] = useState("BUP-COUNTER-01-VISTA-PAY");
  const [mobileNumber, setMobileNumber] = useState("01711223344");
  const [otp, setOtp] = useState("123456");
  const [pin, setPin] = useState("12345");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;
  if (!authenticated) return null;

  const cafeteriaDisplayName =
    cartCafeteria === "amitie"
      ? "Café Amitie"
      : cartCafeteria === "club"
      ? "Faculty & Officers Club"
      : "Vista Café (Main BUP)";

  async function handleCompleteOrder(paymentDetails = {}) {
    if (!authenticated || !user) {
      toast.error("You must be logged in to pay and place an order.");
      onClose();
      return;
    }
    setLoading(true);
    try {
      const activeMethod = paymentDetails.method || method;
      let transactionId = null;

      // 1. Confirm Payment with backend sandbox gateway
      if (activeMethod !== "cash") {
        const payPayload = {
          method: activeMethod,
          mobileNumber: paymentDetails.mobileNumber || mobileNumber,
          otp: paymentDetails.otp || otp,
          pin: paymentDetails.pin || pin,
          amount: total,
          qrPayload: paymentDetails.qrPayload || `BUP-QR-${Date.now()}`,
        };

        const payRes = await apiService.confirmPayment(payPayload);
        transactionId = payRes.transactionId;

        // If it's a QR payment, play the acoustic tone feedback
        if (["qr", "bangla_qr", "bkash_qr", "nagad_qr"].includes(activeMethod) || paymentDetails.isQr) {
          playScanSound(true);
        }
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
        paymentMethod: activeMethod,
        transactionId,
        mobileNumber: activeMethod !== "cash" ? mobileNumber : (user?.phone || "01711223344"),
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
      playScanSound(false);
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
              Integrated Payment & QR Gateway
            </span>
            <h2 style={{ margin: "4px 0 2px", fontSize: "1.35rem" }}>Complete Payment</h2>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-soft)" }}>
              Payable Amount: <strong style={{ color: "var(--teal)", fontSize: "1.05rem" }}>৳{total}</strong>
              <span style={{ margin: "0 6px", color: "var(--sand-line)" }}>•</span>
              <span>{cafeteriaDisplayName}</span>
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* 4 Payment Method Selector Tabs */}
        <div className="payment-method-tabs payment-method-tabs-4">
          {/* 1. bKash */}
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
              <span style={{ display: "block" }}>bKash</span>
              <span className="pay-tab-sub">App / OTP</span>
            </div>
          </button>

          {/* 2. Nagad */}
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
              <span style={{ display: "block" }}>Nagad</span>
              <span className="pay-tab-sub">App / OTP</span>
            </div>
          </button>

          {/* 3. Bangla QR / Scan to Pay */}
          <button
            type="button"
            className={`pay-tab ${method === "qr" ? "active qr-active" : ""}`}
            onClick={() => {
              setMethod("qr");
              setStep("input");
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Icon name="qrCode" size={18} color="var(--teal)" />
              <span className="pay-tab-logo" style={{ color: "var(--teal)", fontSize: "0.95rem" }}>QR Pay</span>
            </div>
            <div>
              <span style={{ display: "block" }}>Bangla QR</span>
              <span className="pay-tab-sub" style={{ color: "var(--teal)" }}>Any App</span>
            </div>
          </button>

          {/* 4. Cash on Counter */}
          <button
            type="button"
            className={`pay-tab ${method === "cash" ? "active cash-active" : ""}`}
            onClick={() => {
              setMethod("cash");
              setStep("input");
            }}
          >
            <Icon name="coffee" size={18} color="var(--mustard-dark)" />
            <div>
              <span style={{ display: "block" }}>Counter</span>
              <span className="pay-tab-sub" style={{ color: "var(--brick)" }}>15m Limit</span>
            </div>
          </button>
        </div>

        {/* Gateway Body */}
        <div className="payment-body">
          {/* ======================= CASE 1: CASH AT COUNTER ======================= */}
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
          ) : method === "qr" ? (
            /* ======================= CASE 2: QR SCAN / BANGLA QR ======================= */
            <div className="qr-payment-wrapper">
              {/* 30-Minute Pickup & Admin Refund Protection Banner */}
              <div className="deadline-alert-banner alert-prepaid" style={{ marginBottom: 12 }}>
                <Icon name="shield" size={20} color="var(--teal)" />
                <div>
                  <strong style={{ color: "var(--teal)" }}>🛡️ 30-Minute Window & Automated Refund Protection:</strong>
                  <div style={{ fontSize: "0.82rem", marginTop: 2 }}>
                    Orders paid via QR enjoy a <strong>30-minute</strong> pickup window with automatic refund protection back to your account via System Admin.
                  </div>
                </div>
              </div>

              {/* QR Sub-Mode Selector */}
              <div className="qr-submode-tabs">
                <button
                  type="button"
                  className={`qr-submode-btn ${qrSubMode === "merchant" ? "active" : ""}`}
                  onClick={() => setQrSubMode("merchant")}
                >
                  <Icon name="qrCode" size={16} />
                  <span>Merchant QR (Scan from Phone)</span>
                </button>
                <button
                  type="button"
                  className={`qr-submode-btn ${qrSubMode === "scanner" ? "active" : ""}`}
                  onClick={() => setQrSubMode("scanner")}
                >
                  <Icon name="camera" size={16} />
                  <span>Camera Scanner (Scan POS / Counter)</span>
                </button>
              </div>

              {qrSubMode === "merchant" ? (
                /* Sub-Mode A: Display Merchant QR Code */
                <div className="qr-display-panel">
                  <div className="qr-box-center">
                    <QRCodeDisplay
                      value={`BANGLA-QR:BUP:${cartCafeteria || "vista"}:AMT=${total}:REF=${user?.identifier || "STUDENT"}:T=${Date.now()}`}
                      size={180}
                      fgColor="#0f766e"
                      tokenText={`PAYABLE: ৳${total}`}
                    />
                  </div>

                  {/* Merchant Details Card */}
                  <div className="qr-merchant-info-card">
                    <div className="qr-info-row">
                      <span className="qr-info-label">Merchant Name:</span>
                      <strong className="qr-info-value">{cafeteriaDisplayName}</strong>
                    </div>
                    <div className="qr-info-row">
                      <span className="qr-info-label">Terminal / Merchant ID:</span>
                      <code className="qr-info-code">BUP-QR-{(cartCafeteria || "vista").toUpperCase()}-01</code>
                    </div>
                    <div className="qr-info-row">
                      <span className="qr-info-label">Student ID / Ref:</span>
                      <strong className="qr-info-value">{user?.identifier || "2021-1-60-001"}</strong>
                    </div>
                  </div>

                  {/* Interoperable Apps Strip */}
                  <div className="qr-interop-strip">
                    <span className="qr-interop-title">Accepted via Bangla QR:</span>
                    <div className="qr-interop-tags">
                      <span className="qr-tag bkash-tag">bKash QR</span>
                      <span className="qr-tag nagad-tag">Nagad QR</span>
                      <span className="qr-tag upay-tag">Upay</span>
                      <span className="qr-tag cellfin-tag">CellFin</span>
                      <span className="qr-tag bank-tag">Bank Apps</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Sub-Mode B: Camera Viewfinder to Scan Cafeteria Counter QR */
                <div className="qr-scanner-panel">
                  <div className="scanner-viewfinder-box" style={{ height: 180, marginTop: 4 }}>
                    <div className="laser-scan-line" />
                    <div className="viewfinder-lens">
                      <Icon name="maximize" size={50} color="var(--teal)" style={{ opacity: 0.9 }} />
                      <span className="lens-text">Align Cafeteria Counter QR or POS Terminal</span>
                    </div>
                  </div>

                  {/* Quick-test evaluation chips */}
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginBottom: 6, fontWeight: 700 }}>
                      Select or Scan Counter Terminal:
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className={`tag-btn ${counterQrCode.includes("VISTA") ? "active-tag" : ""}`}
                        onClick={() => setCounterQrCode("BUP-COUNTER-01-VISTA-PAY")}
                      >
                        📷 Vista Counter #1
                      </button>
                      <button
                        type="button"
                        className={`tag-btn ${counterQrCode.includes("AMITIE") ? "active-tag" : ""}`}
                        onClick={() => setCounterQrCode("BUP-COUNTER-02-AMITIE-PAY")}
                      >
                        📷 Amitie Counter #1
                      </button>
                      <button
                        type="button"
                        className={`tag-btn ${counterQrCode.includes("CLUB") ? "active-tag" : ""}`}
                        onClick={() => setCounterQrCode("BUP-COUNTER-03-CLUB-PAY")}
                      >
                        📷 Faculty Club POS
                      </button>
                    </div>
                  </div>

                  <div className="field" style={{ marginTop: 10 }}>
                    <input
                      type="text"
                      className="input input-sm"
                      value={counterQrCode}
                      onChange={(e) => setCounterQrCode(e.target.value.toUpperCase())}
                      placeholder="e.g. BUP-COUNTER-01-VISTA-PAY"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ======================= CASE 3: BKASH & NAGAD PGW ======================= */
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

              {/* MFS Mode Switch: OTP Input vs QR Scan */}
              <div className="mfs-mode-toggle-bar">
                <button
                  type="button"
                  className={`mfs-pill-btn ${mfsMode === "otp" ? "active" : ""}`}
                  onClick={() => setMfsMode("otp")}
                >
                  <span>Number & PIN</span>
                </button>
                <button
                  type="button"
                  className={`mfs-pill-btn ${mfsMode === "qr" ? "active" : ""}`}
                  onClick={() => setMfsMode("qr")}
                >
                  <Icon name="qrCode" size={14} />
                  <span>Scan {method.toUpperCase()} QR</span>
                </button>
              </div>

              {mfsMode === "qr" ? (
                /* MFS QR Display */
                <div style={{ textAlign: "center", padding: "10px 0" }}>
                  <QRCodeDisplay
                    value={`${method.toUpperCase()}-PAY:BUP:${cartCafeteria || "vista"}:AMT=${total}:REF=${user?.identifier || "STUDENT"}`}
                    size={160}
                    fgColor={method === "bkash" ? "#e1136e" : "#ea580c"}
                    tokenText={`${method.toUpperCase()} MERCHANT`}
                  />
                  <div style={{ marginTop: 8, fontSize: "0.82rem", color: "var(--ink-soft)" }}>
                    Scan with your <strong>{method.toUpperCase()} app</strong> and tap Pay below.
                  </div>
                </div>
              ) : (
                /* MFS Form Steps */
                <>
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
                </>
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
            ) : method === "qr" ? (
              <button
                type="button"
                className="btn btn-primary btn-block btn-lg btn-qr-action"
                disabled={loading}
                onClick={() =>
                  handleCompleteOrder({
                    method: "qr",
                    isQr: true,
                    qrPayload: qrSubMode === "merchant" ? `BANGLA-QR-BUP-${total}` : counterQrCode,
                  })
                }
              >
                {loading ? (
                  <Spinner />
                ) : (
                  <>
                    <Icon name="zap" size={18} />
                    <span>
                      {qrSubMode === "merchant"
                        ? `Simulate Instant QR Payment (৳${total})`
                        : `Scan & Pay Instantly (৳${total})`}
                    </span>
                  </>
                )}
              </button>
            ) : mfsMode === "qr" ? (
              <button
                type="button"
                className={`btn btn-block btn-lg ${method === "bkash" ? "btn-bkash" : "btn-nagad"}`}
                disabled={loading}
                onClick={() =>
                  handleCompleteOrder({
                    method: `${method}_qr`,
                    isQr: true,
                    qrPayload: `${method.toUpperCase()}-QR-PAY-${total}`,
                  })
                }
              >
                {loading ? <Spinner /> : `Authorize ${method.toUpperCase()} QR Payment (৳${total})`}
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
