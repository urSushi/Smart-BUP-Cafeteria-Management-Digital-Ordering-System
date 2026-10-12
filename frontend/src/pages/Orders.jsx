import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import { useOrders } from "../context/OrderContext.jsx";
import QRCodeDisplay from "../components/QRCodeDisplay.jsx";
import OrderTrackingModal from "../components/OrderTrackingModal.jsx";
import ReviewModal from "../components/ReviewModal.jsx";
import Icon from "../components/Icons.jsx";
import { Spinner } from "../components/Loader.jsx";

export default function Orders() {
  const { activeOrders, pastOrders, loading, refreshOrders } = useOrders();
  const [activeTab, setActiveTab] = useState("active");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reviewOrder, setReviewOrder] = useState(null);

  const reviewedOrders = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("sbcms_reviewed_orders") || "[]");
    } catch {
      return [];
    }
  }, [reviewOrder]);

  const displayOrders = activeTab === "active" ? activeOrders : pastOrders;

  return (
    <>
      <Navbar />

      <main className="orders-page container" style={{ padding: "32px 16px 80px" }}>
        {/* Page Header */}
        <div className="orders-header">
          <div>
            <div className="home-eyebrow">
              <span className="pulse-dot" />
              <span>Personal Dining Portal</span>
            </div>
            <h1 style={{ margin: "6px 0 4px", fontSize: "1.85rem" }}>My Campus Orders</h1>
            <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: "0.9rem" }}>
              Track real-time kitchen preparation, view pickup tokens, and review meal receipts.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-mustard btn-sm"
              onClick={() => setReviewOrder({ isGeneral: true })}
            >
              <Icon name="star" size={14} />
              <span>Drop a Review</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={refreshOrders}
              disabled={loading}
            >
              <Icon name="zap" size={14} />
              <span>Refresh Status</span>
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="select-tabs" style={{ margin: "24px 0 28px", maxWidth: 440 }}>
          <button
            type="button"
            className={activeTab === "active" ? "active" : ""}
            onClick={() => setActiveTab("active")}
          >
            <span>Active Pickups</span>
            {activeOrders.length > 0 && <span className="tab-badge">{activeOrders.length}</span>}
          </button>
          <button
            type="button"
            className={activeTab === "history" ? "active" : ""}
            onClick={() => setActiveTab("history")}
          >
            <span>Past History</span>
            {pastOrders.length > 0 && <span className="tab-badge-muted">{pastOrders.length}</span>}
          </button>
        </div>

        {/* Orders List */}
        {displayOrders.length === 0 ? (
          <div className="card empty-orders-card" style={{ padding: 48, textAlign: "center" }}>
            <div className="empty-icon-circle" style={{ margin: "0 auto 16px" }}>
              <Icon name="shoppingBag" size={32} color="var(--ink-soft)" />
            </div>
            <h3>{activeTab === "active" ? "No active orders right now" : "No past orders found"}</h3>
            <p style={{ maxWidth: 400, margin: "8px auto 20px" }}>
              {activeTab === "active"
                ? "When you place a meal order, you can monitor kitchen status and view your pickup token right here."
                : "Your completed and picked-up cafeteria meals will be listed here for easy reordering and reviews."}
            </p>
            <Link to="/home" className="btn btn-primary">
              Order from Campus Cafeterias
            </Link>
          </div>
        ) : (
          <div className="orders-grid">
            {displayOrders.map((order) => {
              const isReady = order.orderStatus === "ready";
              const isPreparing = order.orderStatus === "preparing";
              const isCompleted = order.orderStatus === "completed";
              const isRefunded = order.orderStatus === "refunded" || order.paymentStatus === "refunded";
              const isRefundPending =
                (order.orderStatus === "refund_pending" || order.paymentStatus === "refund_pending") && !isRefunded;
              const isCancelled = (order.orderStatus === "cancelled" || isRefundPending || isRefunded) && !isCompleted;

              return (
                <div key={order.id} className={`card order-card-tile ${isReady ? "tile-ready" : ""}`}>
                  {/* Card Header */}
                  <div className="order-card-header">
                    <div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span className="token-chip">#{order.tokenNumber}</span>
                        <span className="order-deadline-tag">
                          {order.paymentMethod === "cash" ? "15m Counter Limit" : "30m Prepaid Window"}
                        </span>
                      </div>
                      <h3 style={{ margin: "6px 0 2px", fontSize: "1.15rem" }}>{order.cafeteriaName}</h3>
                      <span style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
                        {new Date(order.placedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · Order {order.id}
                      </span>
                    </div>

                    <div className="status-tag-wrap">
                      <span
                        className={`status-pill ${
                          isReady
                            ? "status-ready"
                            : isPreparing
                            ? "status-preparing"
                            : isCompleted
                            ? "status-completed"
                            : isRefunded
                            ? "status-refunded"
                            : isRefundPending
                            ? "status-refund-pending"
                            : isCancelled
                            ? "status-cancelled"
                            : "status-placed"
                        }`}
                      >
                        {isReady && <span className="pulse-dot" />}
                        {isReady
                          ? "Ready for Pickup!"
                          : isPreparing
                          ? "Cooking in Kitchen"
                          : isCompleted
                          ? "Collected"
                          : isRefunded
                          ? "Refunded via Admin"
                          : isRefundPending
                          ? "Refund Pending"
                          : isCancelled
                          ? "Cancelled"
                          : "Order Placed"}
                      </span>
                    </div>
                  </div>

                  {/* QR Preview & Pickup details for active orders */}
                  {activeTab === "active" && !isCancelled && (
                    <div className="order-active-banner">
                      <QRCodeDisplay
                        value={order.qrCodeData || `SBCMS:${order.id}:${order.tokenNumber}:${order.cafeteriaId}`}
                        size={80}
                      />
                      <div className="active-banner-info">
                        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--teal-dark)" }}>
                          EXPRESS COUNTER
                        </div>
                        <div style={{ fontSize: "1rem", fontWeight: 800 }}>{order.pickupCounter}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--ink-soft)", marginTop: 4 }}>
                          {isReady
                            ? "Food is boxed & waiting at counter!"
                            : `Estimated Ready in ~${order.prepTimeMinutes} mins`}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Items List */}
                  <div className="order-card-items">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="item-line">
                        <span>{item.qty}x {item.name}</span>
                        <span style={{ fontWeight: 600 }}>৳{item.price * item.qty}</span>
                      </div>
                    ))}
                  </div>

                  {/* Card Footer */}
                  <div className="order-card-footer">
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                        Paid via {order.paymentMethod.toUpperCase()} {isRefunded ? "(Refunded)" : isRefundPending ? "(Refund Due)" : ""}
                      </span>
                      <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--ink)" }}>
                        ৳{order.total}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      {(isCompleted || isReady) && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setReviewOrder(order)}
                          title="Rate and review your meal"
                        >
                          <Icon name="star" size={13} color="var(--mustard-dark)" />
                          <span>{reviewedOrders.includes(order.id) ? "Reviewed ✓" : "Review"}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <span>View Details</span>
                        <Icon name="chevronRight" size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modals */}
      <OrderTrackingModal
        isOpen={Boolean(selectedOrder)}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onOpenReview={(order) => setReviewOrder(order)}
      />

      <ReviewModal
        isOpen={Boolean(reviewOrder)}
        order={reviewOrder?.items ? reviewOrder : null}
        cafeteriaId={reviewOrder?.cafeteriaId}
        cafeteriaName={reviewOrder?.cafeteriaName}
        onClose={() => setReviewOrder(null)}
      />
    </>
  );
}
