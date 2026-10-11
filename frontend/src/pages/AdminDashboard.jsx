import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { apiService } from "../services/apiService.js";
import { broadcastSync } from "../utils/liveCafeterias.js";
import Icon from "../components/Icons.jsx";
import { Spinner } from "../components/Loader.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";

const CANTEEN_MAP = {
  vista: { name: "Vista Cafe", location: "Academic Building GF", code: "VST" },
  amitie: { name: "Amitie Cafeteria", location: "FBS Building GF", code: "AMT" },
  pitstop: { name: "Pitstop", location: "FASS Walkway", code: "PST" },
  monpura: { name: "Third Place", location: "Monpura Lakeside Deck", code: "THP" },
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const toast = useToast();

  const isCanteenAdmin = Boolean(user?.cafeteriaId && user.cafeteriaId !== "all");
  const assignedCafeteriaId = user?.cafeteriaId;
  const canteenInfo = assignedCafeteriaId ? CANTEEN_MAP[assignedCafeteriaId] : null;

  const [adminAnalytics, setAdminAnalytics] = useState(null);
  const [promotions, setPromotions] = useState([]);
  const [userList, setUserList] = useState([]);
  const [pendingRefunds, setPendingRefunds] = useState([]);
  const [processingRefundId, setProcessingRefundId] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // overview | promotions | users | refunds
  const [loading, setLoading] = useState(true);

  // New promo modal
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [newPromo, setNewPromo] = useState({
    code: "",
    description: "",
    type: "percent",
    value: "15",
    minOrder: "100",
    maxDiscount: "50",
  });

  const loadData = useCallback(async () => {
    try {
      const [analyticsData, promoList, allUsers, refundsList] = await Promise.all([
        apiService.getAdminAnalytics(assignedCafeteriaId),
        apiService.listPromotions(),
        apiService.getAllUsers(),
        apiService.getPendingRefunds(assignedCafeteriaId),
      ]);
      setAdminAnalytics(analyticsData);
      setPromotions(promoList || []);
      setUserList(allUsers || []);
      const filteredRefunds = isCanteenAdmin
        ? (refundsList || []).filter((r) => r.cafeteriaId === assignedCafeteriaId)
        : (refundsList || []);
      setPendingRefunds(filteredRefunds);
    } catch (err) {
      console.warn("Admin fetch:", err);
    } finally {
      setLoading(false);
    }
  }, [assignedCafeteriaId, isCanteenAdmin]);

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 8000);
    return () => clearInterval(timer);
  }, [loadData]);

  // Process Admin Refund for uncollected prepaid order
  async function handleProcessRefund(order) {
    if (
      !window.confirm(
        `Are you sure you want to process and approve the refund of ৳${order.total} for Order #${order.tokenNumber} back to customer ${order.paymentMethod?.toUpperCase()} (${order.mobileNumber})?`
      )
    ) {
      return;
    }

    try {
      setProcessingRefundId(order.id);
      const res = await apiService.processAdminRefund(
        order.id,
        `Approved by System Admin: ৳${order.total} returned to ${order.paymentMethod?.toUpperCase()}`
      );
      toast.success(res.message || `Refund of ৳${order.total} returned successfully!`);
      broadcastSync("ORDER_REFUNDED", { orderId: order.id });
      await loadData();
    } catch (err) {
      toast.error(err.message || "Failed to process refund.");
    } finally {
      setProcessingRefundId(null);
    }
  }

  // Toggle Cafeteria Status (FR-20)
  async function handleToggleCafeteria(cafId, currentOpen) {
    if (isCanteenAdmin && cafId !== assignedCafeteriaId) {
      toast.error(`Unauthorized: You are only permitted to manage ${canteenInfo?.name || "your assigned canteen"}.`);
      return;
    }
    try {
      await apiService.updateCafeteriaStatus(cafId, { isOpen: !currentOpen });
      toast.success(`Cafeteria ${cafId} status updated to ${!currentOpen ? "OPEN" : "CLOSED"}.`);
      broadcastSync("CAFETERIA_UPDATED", { cafId, isOpen: !currentOpen });
      await loadData();
    } catch (err) {
      toast.error("Failed to toggle cafeteria status.");
    }
  }

  // Toggle Promotion (FR-19)
  async function handleTogglePromo(code) {
    try {
      await apiService.togglePromotion(code);
      toast.info(`Promo code ${code} status changed.`);
      broadcastSync("PROMOTION_UPDATED", { code });
      await loadData();
    } catch (err) {
      toast.error("Could not toggle promo code.");
    }
  }

  // Create Promo Code (FR-19)
  async function handleCreatePromo(e) {
    e.preventDefault();
    try {
      await apiService.createPromotion({
        ...newPromo,
        value: Number(newPromo.value),
        minOrder: Number(newPromo.minOrder),
        maxDiscount: Number(newPromo.maxDiscount),
      });
      toast.success(`Promotion ${newPromo.code.toUpperCase()} created successfully!`);
      broadcastSync("PROMOTION_UPDATED", { code: newPromo.code });
      setShowPromoModal(false);
      setNewPromo({
        code: "",
        description: "",
        type: "percent",
        value: "15",
        minOrder: "100",
        maxDiscount: "50",
      });
      await loadData();
    } catch (err) {
      toast.error("Failed to create promotion.");
    }
  }

  if (loading && !adminAnalytics) {
    return (
      <div className="admin-shell" style={{ padding: 60, textAlign: "center" }}>
        <Spinner />
        <p style={{ marginTop: 12, color: "var(--ink-soft)" }}>Loading University Admin & IT Console...</p>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      {/* Header */}
      <header className="admin-header">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link to="/home" className="brand" style={{ textDecoration: "none" }}>
            <span className="brand-mark">
              <Icon name="utensils" size={17} color="#fff" />
            </span>
            <div className="brand-text">
              <span className="brand-title" style={{ color: "var(--ink)", fontWeight: 700, fontSize: "1.18rem", lineHeight: 1.15 }}>
                Smart Cafeteria
              </span>
              <span className="brand-sub" style={{ color: "var(--teal)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                BUP UNIVERSITY DINING
              </span>
            </div>
          </Link>
          {isCanteenAdmin ? (
            <div
              className="admin-badge admin-badge-canteen"
              style={{
                background: "var(--teal-tint)",
                color: "var(--teal-dark)",
                border: "1px solid var(--teal)",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span style={{ fontSize: "0.85rem" }}>🔒</span>
              <span>CANTEEN ADMIN · {canteenInfo?.name?.toUpperCase() || assignedCafeteriaId?.toUpperCase()}</span>
            </div>
          ) : (
            <div className="admin-badge">MASTER SYSTEM ADMINISTRATOR (ALL CANTEENS)</div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="badge badge-open" style={{ background: "var(--teal-tint)", color: "var(--teal-dark)", border: "1px solid var(--teal)" }}>
            ● System Health: 99.8% Uptime
          </span>

          <ThemeToggle />

          <button type="button" className="btn btn-secondary btn-sm" onClick={logout}>
            <Icon name="logOut" size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="admin-content">
        {/* Navigation Tabs */}
        <div className="admin-tabs-row">
          <div className="admin-tabs">
            <button
              type="button"
              className={`a-tab ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              <Icon name="zap" size={15} />
              <span>{isCanteenAdmin ? `${canteenInfo?.name || "Canteen"} Overview` : "Cross-Cafeteria Comparison"}</span>
            </button>

            <button
              type="button"
              className={`a-tab ${activeTab === "promotions" ? "active" : ""}`}
              onClick={() => setActiveTab("promotions")}
            >
              <Icon name="sparkles" size={15} />
              <span>Campus Promotions ({promotions.length})</span>
            </button>

            <button
              type="button"
              className={`a-tab ${activeTab === "users" ? "active" : ""}`}
              onClick={() => setActiveTab("users")}
            >
              <Icon name="shield" size={15} />
              <span>User & Stakeholder Directory ({userList.length})</span>
            </button>

            <button
              type="button"
              className={`a-tab ${activeTab === "refunds" ? "active" : ""}`}
              onClick={() => setActiveTab("refunds")}
            >
              <Icon name="rotateCcw" size={15} />
              <span>Refund Management</span>
              {pendingRefunds.length > 0 && (
                <span className="tab-alert-badge" style={{ background: "#ef4444", color: "#fff" }}>
                  {pendingRefunds.length}
                </span>
              )}
            </button>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            {activeTab === "promotions" && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowPromoModal(true)}
              >
                <Icon name="plus" size={14} />
                <span>Create Campus Promo</span>
              </button>
            )}

            <button type="button" className="btn btn-secondary btn-sm" onClick={loadData}>
              <Icon name="zap" size={14} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Cross-Cafeteria Overview (FR-19) */}
        {activeTab === "overview" && (
          <div>
            {/* Campus Wide / Canteen-Specific Stat Cards */}
            <div className="admin-metrics-grid">
              <div className="admin-metric-card card">
                <span className="metric-title">
                  {isCanteenAdmin ? `${canteenInfo?.name} Daily Revenue` : "Campus-Wide Daily Revenue"}
                </span>
                <div className="metric-val">৳{adminAnalytics?.campusTotalRevenue?.toLocaleString() || 0}</div>
                <span className="metric-foot">
                  {isCanteenAdmin ? `Assigned Location: ${canteenInfo?.location}` : "Combined across all 4 dining facilities"}
                </span>
              </div>

              <div className="admin-metric-card card">
                <span className="metric-title">
                  {isCanteenAdmin ? `${canteenInfo?.name} Orders Today` : "Orders Processed Today"}
                </span>
                <div className="metric-val">{adminAnalytics?.campusTotalOrders || 0} Meals</div>
                <span className="metric-foot">
                  {isCanteenAdmin ? "Filtered strictly to your kitchen" : "Zero cash handling errors"}
                </span>
              </div>

              <div className="admin-metric-card card">
                <span className="metric-title">
                  {isCanteenAdmin ? `Patrons at ${canteenInfo?.name}` : "Active Student Customers"}
                </span>
                <div className="metric-val">{adminAnalytics?.activeStudentsOrderingToday || 0}</div>
                <span className="metric-foot">
                  {isCanteenAdmin ? "Active cafeteria diners today" : "Digital order penetration: ~68%"}
                </span>
              </div>

              <div className="admin-metric-card card">
                <span className="metric-title">Peak Rush Break Window</span>
                <div className="metric-val" style={{ fontSize: "1.4rem" }}>
                  {adminAnalytics?.peakClassBreakWindow}
                </div>
                <span className="metric-foot">Queue reduction: -72% vs manual card</span>
              </div>
            </div>

            {/* Side-by-Side Comparison Table (FR-19) */}
            <div className="admin-card card" style={{ marginTop: 24 }}>
              <div className="card-title-row">
                <div>
                  <h3>{isCanteenAdmin ? `${canteenInfo?.name} Operational Matrix & Control` : "Cross-Cafeteria Performance Matrix"}</h3>
                  <p className="card-sub-txt">
                    {isCanteenAdmin
                      ? `Consolidated operational status, revenue, queue delay, and stock health exclusively for ${canteenInfo?.name} (${canteenInfo?.location}).`
                      : "Consolidated operational status, revenue, queue delay, and stock health for all 4 locations."}
                  </p>
                </div>
              </div>

              <table className="staff-table" style={{ marginTop: 12 }}>
                <thead>
                  <tr>
                    <th>Cafeteria</th>
                    <th>Campus Building</th>
                    <th>Current Status</th>
                    <th>Average Queue</th>
                    <th>Orders Today</th>
                    <th>Revenue Today</th>
                    <th>Satisfaction</th>
                    <th>{isCanteenAdmin ? "Canteen Control" : "Master Override"}</th>
                  </tr>
                </thead>
                <tbody>
                  {(isCanteenAdmin
                    ? adminAnalytics?.cafeteriaReports?.filter((caf) => caf.id === assignedCafeteriaId)
                    : adminAnalytics?.cafeteriaReports
                  )?.map((caf) => (
                    <tr key={caf.id}>
                      <td>
                        <strong>{caf.name}</strong>
                      </td>
                      <td>{caf.building}</td>
                      <td>
                        <span className={`badge ${caf.isOpen ? "badge-open" : "badge-closed"}`}>
                          {caf.isOpen ? (
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
                      </td>
                      <td>
                        {caf.isOpen ? (
                          <span style={{ fontWeight: 700, color: "var(--teal)" }}>
                            ~{caf.queueMinutes}m ({caf.crowdLevel})
                          </span>
                        ) : (
                          <span style={{ color: "var(--ink-muted)" }}>—</span>
                        )}
                      </td>
                      <td>
                        <strong>{caf.ordersCount}</strong> orders
                      </td>
                      <td>
                        <strong style={{ color: "var(--teal)" }}>৳{caf.revenueToday?.toLocaleString()}</strong>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Icon name="star" size={13} color="var(--mustard)" />
                          <span>{caf.rating}</span>
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`btn btn-sm ${caf.isOpen ? "btn-danger-outline" : "btn-secondary"}`}
                          onClick={() => handleToggleCafeteria(caf.id, caf.isOpen)}
                        >
                          {caf.isOpen ? "Force Close" : "Open"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Campus Promotions (FR-19) */}
        {activeTab === "promotions" && (
          <div className="admin-card card">
            <div className="card-title-row">
              <div>
                <h3>Campus Promotions & Discount Codes (FR-19)</h3>
                <p className="card-sub-txt">
                  Manage university discounts, voucher codes, and semester food subsidies.
                </p>
              </div>
            </div>

            <table className="staff-table" style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th>Promo Code</th>
                  <th>Discount Rule</th>
                  <th>Min Order</th>
                  <th>Max Discount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {promotions.map((p) => (
                  <tr key={p.code}>
                    <td>
                      <span className="token-chip promo-chip">{p.code}</span>
                      <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: 2 }}>{p.description}</div>
                    </td>
                    <td>
                      <strong>{p.type === "percent" ? `${p.value}% OFF` : `৳${p.value} Flat OFF`}</strong>
                    </td>
                    <td>৳{p.minOrder || 0}</td>
                    <td>৳{p.maxDiscount || "Unlimited"}</td>
                    <td>
                      <span className={`badge ${p.active ? "badge-open" : "badge-closed"}`}>
                        {p.active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleTogglePromo(p.code)}
                      >
                        {p.active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: User Directory */}
        {activeTab === "users" && (
          <div className="admin-card card">
            <div className="card-title-row">
              <div>
                <h3>Stakeholder Directory & Roles</h3>
                <p className="card-sub-txt">Registered Students, Faculty, Staff, and Guest users.</p>
              </div>
            </div>

            <table className="staff-table" style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Role</th>
                  <th>Identifier</th>
                  <th>University / Personal Email</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {userList.map((u) => (
                  <tr key={u.id || u.identifier}>
                    <td>
                      <strong>{u.fullName}</strong>
                    </td>
                    <td>
                      <span className="badge badge-open" style={{ textTransform: "capitalize" }}>
                        {u.role?.replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      <span className="token-chip">{u.identifier}</span>
                    </td>
                    <td style={{ color: "var(--ink-soft)" }}>{u.universityEmail || u.personalEmail}</td>
                    <td>
                      <span className="badge badge-open">Verified</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Refund Management (30-Minute Mobile Banking Expirations) */}
        {activeTab === "refunds" && (
          <div className="admin-card card">
            <div className="card-title-row">
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <h3 style={{ margin: 0 }}>
                    {isCanteenAdmin
                      ? `${canteenInfo?.name} Refund Console (30-Minute Expiry)`
                      : "Mobile Banking Refund Console (30-Minute Expiry)"}
                  </h3>
                  <span className="badge badge-pending-alert">
                    {pendingRefunds.length} Pending Approval
                  </span>
                </div>
                <p className="card-sub-txt">
                  {isCanteenAdmin
                    ? `Prepaid orders placed at ${canteenInfo?.name} paid via bKash or Nagad that exceeded the 30-minute pickup window are queued here for your return.`
                    : "Orders paid via bKash or Nagad that were not picked up within the 30-minute window are cancelled and queued here for administrator refund dispatch."}
                </p>
              </div>
            </div>

            {/* Policy Context Alert */}
            <div className="admin-refund-policy-box">
              <Icon name="shield" size={20} color="var(--teal)" />
              <div>
                <strong>Automated University SRE Policy:</strong>
                <p style={{ margin: "2px 0 0", fontSize: "0.85rem", opacity: 0.9 }}>
                  Prepaid orders (bKash/Nagad) have a strict 30-minute pickup deadline.
                  When expired, food preparation stops, cafeteria inventory is restored, and customer payments are safely escrowed here for administrative return.
                </p>
              </div>
            </div>

            {pendingRefunds.length === 0 ? (
              <div className="empty-refunds-box" style={{ padding: "40px 20px", textAlign: "center" }}>
                <div className="empty-icon-circle" style={{ margin: "0 auto 12px" }}>
                  <Icon name="checkCircle" size={28} color="#10b981" />
                </div>
                <h4 style={{ margin: "0 0 6px" }}>No Pending Customer Refunds</h4>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--ink-soft)" }}>
                  {isCanteenAdmin
                    ? `All uncollected prepaid orders for ${canteenInfo?.name} have been successfully reviewed and refunded.`
                    : "All uncollected prepaid cafeteria orders have been successfully reviewed and refunded."}
                </p>
              </div>
            ) : (
              <table className="staff-table" style={{ marginTop: 14 }}>
                <thead>
                  <tr>
                    <th>Order & Token</th>
                    <th>Canteen</th>
                    <th>Customer Name</th>
                    <th>MFS Account Number</th>
                    <th>Gateway</th>
                    <th>Amount Payable</th>
                    <th>Order Timestamps</th>
                    <th>Auto-Cancel Reason</th>
                    <th>Admin Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRefunds.map((ord) => (
                    <tr key={ord.id}>
                      <td>
                        <span className="token-chip">#{ord.tokenNumber}</span>
                        <div style={{ fontSize: "0.78rem", color: "var(--ink-muted)", marginTop: 2 }}>{ord.id}</div>
                      </td>
                      <td>
                        <span className="badge badge-secondary" style={{ fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                          {ord.cafeteriaName || ord.cafeteriaId?.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <strong>{ord.userFullName}</strong>
                        <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>{ord.userIdentifier}</div>
                      </td>
                      <td>
                        <strong style={{ fontFamily: "monospace", fontSize: "0.95rem" }}>
                          +88 {ord.mobileNumber || "017XXXXXXXX"}
                        </strong>
                      </td>
                      <td>
                        <span
                          className={`badge ${ord.paymentMethod === "bkash" ? "mfs-badge-bkash" : "mfs-badge-nagad"}`}
                        >
                          {ord.paymentMethod}
                        </span>
                      </td>
                      <td>
                        <strong style={{ fontSize: "1.05rem", color: "var(--ink)" }}>৳{ord.total}</strong>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.8rem" }}>
                          Placed: {new Date(ord.placedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        {ord.cancelledAt && (
                          <div style={{ fontSize: "0.75rem", color: "var(--brick)" }}>
                            Expired: {new Date(ord.cancelledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: "0.78rem", color: "var(--mustard-dark)", maxWidth: 220, display: "inline-block" }}>
                          {ord.cancellationReason || "Exceeded 30-minute pickup window"}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ background: "#059669", borderColor: "#059669", whiteSpace: "nowrap" }}
                          disabled={processingRefundId === ord.id}
                          onClick={() => handleProcessRefund(ord)}
                        >
                          {processingRefundId === ord.id ? (
                            <Spinner />
                          ) : (
                            <>
                              <Icon name="rotateCcw" size={13} />
                              <span>Approve & Refund ৳{ord.total}</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Modal: Create Campus Promo (FR-19) */}
      {showPromoModal && (
        <div className="modal-backdrop" onClick={() => setShowPromoModal(false)}>
          <div className="modal-card card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3>Create Campus Promo Code</h3>
              <button className="modal-close-btn" onClick={() => setShowPromoModal(false)}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <form onSubmit={handleCreatePromo} style={{ marginTop: 14 }}>
              <div className="field">
                <label>Promo Code</label>
                <input
                  className="input"
                  placeholder="e.g. SEMESTER15"
                  value={newPromo.code}
                  onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              <div className="field">
                <label>Description</label>
                <input
                  className="input"
                  placeholder="e.g. 15% off for mid-term exams"
                  value={newPromo.description}
                  onChange={(e) => setNewPromo({ ...newPromo, description: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div className="field">
                  <label>Type</label>
                  <select
                    className="select"
                    value={newPromo.type}
                    onChange={(e) => setNewPromo({ ...newPromo, type: e.target.value })}
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat Amount (৳)</option>
                  </select>
                </div>

                <div className="field">
                  <label>Discount Value</label>
                  <input
                    type="number"
                    className="input"
                    value={newPromo.value}
                    onChange={(e) => setNewPromo({ ...newPromo, value: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div className="field">
                  <label>Min Order (৳)</label>
                  <input
                    type="number"
                    className="input"
                    value={newPromo.minOrder}
                    onChange={(e) => setNewPromo({ ...newPromo, minOrder: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label>Max Cap (৳)</label>
                  <input
                    type="number"
                    className="input"
                    value={newPromo.maxDiscount}
                    onChange={(e) => setNewPromo({ ...newPromo, maxDiscount: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-block btn-lg" style={{ marginTop: 10 }}>
                Publish Promo Code
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
