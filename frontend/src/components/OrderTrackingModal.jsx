import React, { useState, useEffect } from "react";
import QRCodeDisplay from "./QRCodeDisplay.jsx";
import { useOrders } from "../context/OrderContext.jsx";
import Icon from "./Icons.jsx";
import { Spinner } from "./Loader.jsx";
import { apiService } from "../services/apiService.js";
import { subscribeSync } from "../utils/liveCafeterias.js";

const STAGES = [
  { key: "placed", label: "Placed", desc: "Order received by cafeteria", icon: "checkCircle" },
  { key: "preparing", label: "Preparing", desc: "Chef is cooking your meal", icon: "utensils" },
  { key: "ready", label: "Ready for Pickup", desc: "Ready at the express window", icon: "bell" },
  { key: "completed", label: "Picked Up", desc: "Collected & handed over", icon: "check" },
];

export default function OrderTrackingModal({ order, isOpen, onClose, onOpenReview }) {
  const { cancelUserOrder, loading } = useOrders();
  const [cancelling, setCancelling] = useState(false);

  // Live Pickup Deadline Countdown (15 mins for Counter, 30 mins for Mobile Banking)
  const [remainingSec, setRemainingSec] = useState(0);

  // Live FIFO Kitchen Queue Standing
  const [queueInfo, setQueueInfo] = useState({ position: 1, ahead: 0 });

  useEffect(() => {
    if (!order) return;
    function calcRemaining() {
      if (order.expiresAt) {
        return Math.max(0, Math.floor((new Date(order.expiresAt).getTime() - Date.now()) / 1000));
      }
      const deadlineMins = order.pickupDeadlineMinutes || (order.paymentMethod === "cash" ? 15 : 30);
      const target = new Date(order.placedAt).getTime() + deadlineMins * 60 * 1000;
      return Math.max(0, Math.floor((target - Date.now()) / 1000));
    }

    setRemainingSec(calcRemaining());
    const interval = setInterval(() => {
      setRemainingSec(calcRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [order]);

  useEffect(() => {
    if (!order || !isOpen) return;
    if (order.orderStatus !== "placed" && order.orderStatus !== "preparing") return;

    let mounted = true;
    async function fetchQueue() {
      try {
        const cafOrders = await apiService.getCafeteriaOrders(order.cafeteriaId);
        if (!mounted || !Array.isArray(cafOrders)) return;
        const activeEarlier = cafOrders.filter(
          (o) =>
            o.id !== order.id &&
            ["placed", "preparing"].includes(o.orderStatus) &&
            new Date(o.placedAt).getTime() < new Date(order.placedAt).getTime()
        );
        setQueueInfo({
          position: activeEarlier.length + 1,
          ahead: activeEarlier.length,
        });
      } catch {}
    }

    fetchQueue();
    const unsub = subscribeSync(fetchQueue);
    const interval = setInterval(fetchQueue, 4000);
    return () => {
      mounted = false;
      unsub();
      clearInterval(interval);
    };
  }, [order?.id, order?.orderStatus, order?.placedAt, order?.cafeteriaId, isOpen]);

  if (!isOpen || !order) return null;

  const currentIdx =
    order.orderStatus === "placed"
      ? 0
      : order.orderStatus === "preparing"
      ? 1
      : order.orderStatus === "ready"
      ? 2
      : order.orderStatus === "completed"
      ? 3
      : -1; // cancelled or refund

  const isRefunded = order.orderStatus === "refunded" || order.paymentStatus === "refunded";
  const isRefundPending =
    (order.orderStatus === "refund_pending" || order.paymentStatus === "refund_pending") && !isRefunded;
  const isCancelled = (order.orderStatus === "cancelled" || isRefundPending || isRefunded) && order.orderStatus !== "completed";
  const canCancel = order.orderStatus === "placed";

  async function handleCancel() {
    if (!window.confirm("Are you sure you want to cancel this order? Stock will be restored.")) return;
    setCancelling(true);
    try {
      await cancelUserOrder(order.id, "Student requested cancellation before prep");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card card tracking-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <span className="badge badge-open">Live Campus Order Tracker</span>
            <h2 style={{ margin: "6px 0 2px", fontSize: "1.35rem" }}>
              #{order.tokenNumber} · {order.cafeteriaName}
            </h2>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--ink-soft)" }}>
              Order ID: {order.id} · Placed {new Date(order.placedAt).toLocaleTimeString()}
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Live Countdown Urgency Banner for Active Orders */}
        {!isCancelled && order.orderStatus !== "completed" && (
          <div className={`countdown-pickup-banner ${remainingSec < 180 ? "countdown-urgent" : ""}`}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name="clock" size={20} color={remainingSec < 180 ? "var(--brick)" : "var(--teal)"} />
              <div>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {order.paymentMethod === "cash" ? "Counter 15m Pickup Deadline" : "Prepaid 30m Pickup Window"}
                </div>
                <div style={{ fontSize: "0.78rem", opacity: 0.9 }}>
                  {order.paymentMethod === "cash"
                    ? "Collect & pay at counter before timer reaches 00:00"
                    : "If uncollected after 30m, refunded to your mobile banking account via Admin"}
                </div>
              </div>
            </div>
            <div className="countdown-clock">
              <span className="clock-digits">
                {String(Math.floor(remainingSec / 60)).padStart(2, "0")}:{String(remainingSec % 60).padStart(2, "0")}
              </span>
              <span className="clock-sub">REMAINING</span>
            </div>
          </div>
        )}

        {/* Status Callout Banner */}
        {isRefunded ? (
          <div className="status-refunded-banner">
            <Icon name="checkCircle" size={22} color="var(--teal)" />
            <div>
              <strong style={{ color: "var(--teal)" }}>Refund Completed by System Admin</strong>
              <div style={{ fontSize: "0.82rem", marginTop: 2 }}>
                ৳{order.total} has been refunded back to your {order.paymentMethod?.toUpperCase()} account ({order.mobileNumber || "Registered Account"}).
              </div>
              {order.refundTxnId && (
                <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: 2 }}>
                  Refund Ref: <strong>{order.refundTxnId}</strong> · Processed by {order.refundProcessedBy || "System Administrator"}
                </div>
              )}
            </div>
          </div>
        ) : isRefundPending ? (
          <div className="status-refund-pending-banner">
            <Icon name="alertCircle" size={22} color="var(--mustard-dark)" />
            <div>
              <strong style={{ color: "var(--mustard-dark)" }}>30-Min Window Expired · Refund Pending via Admin</strong>
              <div style={{ fontSize: "0.82rem", marginTop: 2 }}>
                This prepaid order exceeded the 30-minute pickup window and has been cancelled.
                Your payment of <strong>৳{order.total}</strong> is queued for return to your <strong>{order.paymentMethod?.toUpperCase()}</strong> account via the System Admin.
              </div>
            </div>
          </div>
        ) : isCancelled ? (
          <div className="status-cancelled-banner">
            <Icon name="alertCircle" size={20} color="var(--brick)" />
            <div>
              <strong>Order Cancelled</strong>
              <div style={{ fontSize: "0.82rem" }}>
                {order.cancellationReason || "This order was cancelled prior to food preparation."}
              </div>
            </div>
          </div>
        ) : (
          <div className={`status-highlight-banner stage-${order.orderStatus}`}>
            <div className="pulse-dot" />
            <div>
              <strong>
                {order.orderStatus === "placed"
                  ? "Order Confirmed & Queued"
                  : order.orderStatus === "preparing"
                  ? "Kitchen is Preparing Your Fresh Meal"
                  : order.orderStatus === "ready"
                  ? "HOT & READY FOR PICKUP!"
                  : "Order Completed & Collected"}
              </strong>
              <div style={{ fontSize: "0.84rem", opacity: 0.9 }}>
                {order.orderStatus === "ready"
                  ? `Please head to ${order.pickupCounter} with your token or QR code!`
                  : `Estimated kitchen prep: ~${order.prepTimeMinutes} mins from placement.`}
              </div>
            </div>
          </div>
        )}

        {/* Real-time FIFO Queue Status for Placed & Cooking Orders */}
        {!isCancelled && ["placed", "preparing"].includes(order.orderStatus) && (
          <div className="fifo-student-queue-banner">
            <div className={`fifo-queue-rank ${queueInfo.position === 1 ? "rank-lead" : ""}`}>
              <span className="rank-num">#{queueInfo.position}</span>
              <span className="rank-label">IN LINE</span>
            </div>
            <div className="fifo-queue-details">
              <strong>
                {queueInfo.position === 1
                  ? "🥇 1st in Line — Next Up for Preparation!"
                  : `⏳ Kitchen Queue: #${queueInfo.position} in Line`}
              </strong>
              <div style={{ fontSize: "0.8rem", color: "var(--ink-soft)", marginTop: 2 }}>
                {queueInfo.position === 1
                  ? "Your order was placed first and has priority in the kitchen."
                  : `${queueInfo.ahead} earlier ${queueInfo.ahead === 1 ? "order is" : "orders are"} being prepared ahead of yours.`}
              </div>
            </div>
          </div>
        )}

        {/* 4-Stage Timeline Stepper */}
        {!isCancelled && (
          <div className="stepper-container">
            {STAGES.map((s, idx) => {
              const isPast = idx < currentIdx;
              const isCurrent = idx === currentIdx;
              const isFuture = idx > currentIdx;

              return (
                <div key={s.key} className={`step-item ${isCurrent ? "current" : isPast ? "done" : "future"}`}>
                  <div className="step-circle">
                    {isPast ? <Icon name="check" size={14} /> : <span>{idx + 1}</span>}
                  </div>
                  <div className="step-label">
                    <span className="step-title">{s.label}</span>
                    <span className="step-sub">{s.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* QR & Token Verification Box */}
        {!isCancelled && (
          <div className="tracking-qr-box">
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <QRCodeDisplay
                value={order.qrCodeData || `SBCMS:${order.id}:${order.tokenNumber}:${order.cafeteriaId}`}
                size={120}
              />
              <div style={{ textAlign: "left" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--teal-dark)", textTransform: "uppercase" }}>
                  Express Pickup Token
                </span>
                <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--ink)", letterSpacing: "1px" }}>
                  #{order.tokenNumber}
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--ink-soft)", marginTop: 4 }}>
                  Counter: <strong>{order.pickupCounter}</strong>
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--ink-soft)" }}>
                  Payment: <strong>{order.paymentMethod.toUpperCase()} ({order.paymentStatus})</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Items Breakdown */}
        <div className="tracking-items-section">
          <h4 style={{ margin: "0 0 8px", fontSize: "0.95rem" }}>Order Details</h4>
          {order.items.map((i, idx) => (
            <div key={idx} className="tracking-item-row">
              <div>
                <strong>{i.qty}x {i.name}</strong>
                {i.notes && <div className="tracking-item-note">Note: {i.notes}</div>}
              </div>
              <span>৳{i.price * i.qty}</span>
            </div>
          ))}
          <div className="tracking-total-row">
            <span>Total Amount</span>
            <strong>৳{order.total}</strong>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="tracking-footer">
          {canCancel && (
            <button
              type="button"
              className="btn btn-secondary btn-sm danger-btn"
              disabled={cancelling || loading}
              onClick={handleCancel}
            >
              {cancelling ? <Spinner /> : "Cancel Order (Pre-Kitchen)"}
            </button>
          )}

          {order.orderStatus === "completed" && (
            <button
              type="button"
              className="btn btn-mustard btn-sm"
              onClick={() => {
                onClose();
                if (onOpenReview) onOpenReview(order);
              }}
            >
              <Icon name="star" size={14} />
              <span>Rate Your Meal</span>
            </button>
          )}

          <button type="button" className="btn btn-primary btn-sm" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
