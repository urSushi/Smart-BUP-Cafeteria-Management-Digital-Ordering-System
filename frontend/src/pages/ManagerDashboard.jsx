import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { apiService } from "../services/apiService.js";
import { broadcastSync } from "../utils/liveCafeterias.js";
import Icon from "../components/Icons.jsx";
import { Spinner } from "../components/Loader.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";

const CANTEEN_INFO = {
  vista: { name: "Vista Cafe", location: "Academic Building GF", code: "VST" },
  amitie: { name: "Amitie Cafeteria", location: "FBS Building GF", code: "AMT" },
  pitstop: { name: "Pitstop", location: "FASS GF Walkway", code: "PST" },
  monpura: { name: "Third Place", location: "Monpura Lakeside Deck", code: "THP" },
};

export default function ManagerDashboard() {
  const { user, logout } = useAuth();
  const toast = useToast();

  // Strict Manager Scoping: Operations & analytics locked exclusively to assigned canteen
  const activeCafeteriaId = user?.cafeteriaId || "vista";
  const [analytics, setAnalytics] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [cafeteria, setCafeteria] = useState(null);
  const [loading, setLoading] = useState(true);

  // New staff modal
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [newStaff, setNewStaff] = useState({
    fullName: "",
    identifier: `STF-${CANTEEN_INFO[user?.cafeteriaId || "vista"]?.code || "VST"}-`,
    email: "",
    staffRole: "kitchen",
    password: "password123",
  });

  const loadData = useCallback(async () => {
    try {
      const [anData, stList, cafData] = await Promise.all([
        apiService.getManagerAnalytics(activeCafeteriaId),
        apiService.getStaff(activeCafeteriaId),
        apiService.getCafeteria(activeCafeteriaId),
      ]);
      setAnalytics(anData);
      setStaffList(stList || []);
      setCafeteria(cafData);
    } catch (err) {
      console.warn("Manager dashboard fetch:", err);
    } finally {
      setLoading(false);
    }
  }, [activeCafeteriaId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Toggle Cafeteria Open/Closed (FR-20)
  async function handleToggleStatus() {
    if (!cafeteria) return;
    try {
      const nextOpen = !cafeteria.isOpen;
      await apiService.updateCafeteriaStatus(activeCafeteriaId, { isOpen: nextOpen });
      toast.success(`${cafeteria.name} is now marked ${nextOpen ? "OPEN" : "CLOSED"}.`);
      broadcastSync("CAFETERIA_UPDATED", { activeCafeteriaId, isOpen: nextOpen });
      await loadData();
    } catch (err) {
      toast.error("Failed to update status.");
    }
  }

  // Create staff account (FR-18)
  async function handleCreateStaff(e) {
    e.preventDefault();
    try {
      await apiService.addStaff({
        ...newStaff,
        cafeteriaId: activeCafeteriaId,
      });
      toast.success(`Staff account for ${newStaff.fullName} created!`);
      setShowStaffModal(false);
      setNewStaff({
        fullName: "",
        identifier: `STF-${CANTEEN_INFO[activeCafeteriaId]?.code || "VST"}-`,
        email: "",
        staffRole: "kitchen",
        password: "password123",
      });
      await loadData();
    } catch (err) {
      toast.error(err.message || "Failed to create staff account.");
    }
  }

  // Remove staff account (FR-18)
  async function handleRemoveStaff(identifier) {
    if (!window.confirm(`Are you sure you want to deactivate staff account ${identifier}?`)) return;
    try {
      await apiService.removeStaff(identifier);
      toast.info(`Staff account ${identifier} deactivated.`);
      await loadData();
    } catch (err) {
      toast.error("Could not remove staff account.");
    }
  }

  if (loading && !analytics) {
    return (
      <div className="manager-shell" style={{ padding: 60, textAlign: "center" }}>
        <Spinner />
        <p style={{ marginTop: 12, color: "#9ca3af" }}>Loading manager operational analytics...</p>
      </div>
    );
  }

  return (
    <div className="manager-shell">
      {/* Top Header */}
      <header className="manager-header">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div className="manager-badge">DINING OPS CONSOLE</div>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.3rem", color: "var(--ink)" }}>
              {CANTEEN_INFO[activeCafeteriaId]?.name || "Cafeteria"} Operations & Analytics
            </h2>
            <div style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>
              BUP Operational Analytics Module (FR-17 & FR-18)
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Assigned Canteen Display (Locked to manager's station) */}
          <div className="staff-canteen-station-badge" title="Access is restricted exclusively to your designated canteen">
            <div className="station-icon-wrap">
              <Icon name="mapPin" size={15} />
            </div>
            <div className="station-meta">
              <span className="station-label">ASSIGNED CANTEEN</span>
              <span className="station-name">
                {CANTEEN_INFO[activeCafeteriaId]?.name || cafeteria?.name || "Assigned Canteen"}
                <span className="station-loc"> · {CANTEEN_INFO[activeCafeteriaId]?.location || cafeteria?.location}</span>
              </span>
            </div>
            <span className="station-lock-chip">
              🔒 Locked Access
            </span>
          </div>

          {/* Operational Open/Close Toggle (FR-20) */}
          {cafeteria && (
            <button
              type="button"
              className={`btn btn-sm ${cafeteria.isOpen ? "btn-danger-outline" : "btn-primary"}`}
              onClick={handleToggleStatus}
            >
              <Icon name="clock" size={14} />
              <span>{cafeteria.isOpen ? "Force Close Counter" : "Open Cafeteria"}</span>
            </button>
          )}

          <ThemeToggle />

          <button type="button" className="btn btn-secondary btn-sm" onClick={logout}>
            <Icon name="logOut" size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="manager-content">
        {/* Metric Cards Row */}
        <div className="metrics-grid">
          <div className="metric-card card">
            <div className="metric-header">
              <span>Today's Total Sales</span>
              <Icon name="shoppingBag" size={18} color="var(--teal)" />
            </div>
            <div className="metric-number">৳{analytics?.todayRevenue?.toLocaleString() || 0}</div>
            <div className="metric-sub">Across fulfilled student counter orders</div>
          </div>

          <div className="metric-card card">
            <div className="metric-header">
              <span>Weekly Revenue Trend</span>
              <Icon name="zap" size={18} color="var(--mustard)" />
            </div>
            <div className="metric-number">৳{Math.round(analytics?.weeklyRevenue || 0).toLocaleString()}</div>
            <div className="metric-sub">+18.4% compared to previous term</div>
          </div>

          <div className="metric-card card">
            <div className="metric-header">
              <span>Order Volume</span>
              <Icon name="checkCircle" size={18} color="var(--teal)" />
            </div>
            <div className="metric-number">{analytics?.totalOrdersCount || 0} Orders</div>
            <div className="metric-sub">
              {analytics?.completedOrdersCount} Fulfilled · {analytics?.cancelledOrdersCount} Cancelled
            </div>
          </div>

          <div className="metric-card card">
            <div className="metric-header">
              <span>Stock Turnover Rate</span>
              <Icon name="shield" size={18} color="var(--mustard-dark)" />
            </div>
            <div className="metric-number">{analytics?.inventoryStats?.turnoverRate || "82%"}</div>
            <div className="metric-sub">
              {analytics?.inventoryStats?.lowStockAlertCount || 0} low-stock alerts active
            </div>
          </div>
        </div>

        {/* Charts & Top Sellers Row */}
        <div className="manager-row-2">
          {/* Peak Hours Breakdown Bar Chart (FR-17) */}
          <div className="manager-card card">
            <div className="card-title-row">
              <h3>Campus Peak Break-Time Traffic</h3>
              <span className="badge badge-open">Hourly Order Distribution</span>
            </div>
            <p className="card-sub-txt">
              Aggregated orders by break windows to optimize kitchen staffing and food prep batches.
            </p>

            <div className="peak-hours-chart">
              {analytics?.hourlyPeakData?.map((slot, idx) => {
                const maxOrders = Math.max(...analytics.hourlyPeakData.map((d) => d.orders));
                const pct = Math.round((slot.orders / maxOrders) * 100);
                const isPeak = slot.orders === maxOrders;

                return (
                  <div key={idx} className="chart-bar-col">
                    <div className="chart-bar-wrap">
                      <div
                        className={`chart-bar-fill ${isPeak ? "bar-peak" : ""}`}
                        style={{ height: `${pct}%` }}
                      >
                        <span className="bar-tooltip">{slot.orders} orders</span>
                      </div>
                    </div>
                    <span className="bar-time">{slot.hour}</span>
                    <span className="bar-tag">{slot.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Best Selling Items Leaderboard (FR-17) */}
          <div className="manager-card card">
            <div className="card-title-row">
              <h3>Top Selling Meals</h3>
              <span className="badge badge-open">Highest Volume</span>
            </div>
            <p className="card-sub-txt">Top student favourites generated from digital order checkouts.</p>

            <div className="bestsellers-list">
              {analytics?.bestSellers?.map((dish, i) => (
                <div key={i} className="bestseller-item">
                  <div className="bestseller-rank">#{i + 1}</div>
                  <div className="bestseller-info">
                    <strong>{dish.name}</strong>
                    <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>৳{dish.price} per portion</div>
                  </div>
                  <div className="bestseller-stats">
                    <div style={{ fontWeight: 800, color: "var(--teal)" }}>{dish.qty} Sold</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>৳{dish.revenue.toLocaleString()}</div>
                  </div>
                </div>
              ))}
              {(!analytics?.bestSellers || analytics.bestSellers.length === 0) && (
                <p style={{ color: "var(--ink-muted)", textAlign: "center", padding: 20 }}>No sales recorded yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Staff Management Section (FR-18) */}
        <div className="manager-card card" style={{ marginTop: 24 }}>
          <div className="card-title-row">
            <div>
              <h3>Staff Account Management (FR-18)</h3>
              <p className="card-sub-txt">
                Assign and manage Cashier, Kitchen, and Counter personnel for {cafeteria?.name}.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-mustard btn-sm"
              onClick={() => setShowStaffModal(true)}
            >
              <Icon name="plus" size={14} />
              <span>Create Staff Member</span>
            </button>
          </div>

          <table className="staff-table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Staff Name</th>
                <th>Identifier / ID</th>
                <th>Assigned Role</th>
                <th>Campus Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((st) => (
                <tr key={st.id || st.identifier}>
                  <td>
                    <strong>{st.fullName}</strong>
                  </td>
                  <td>
                    <span className="token-chip">{st.identifier}</span>
                  </td>
                  <td>
                    <span className="badge badge-open">
                      {st.staffRole === "cashier" ? "Counter Cashier" : "Kitchen Chef"}
                    </span>
                  </td>
                  <td style={{ color: "var(--ink-soft)" }}>{st.universityEmail}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm danger-btn"
                      onClick={() => handleRemoveStaff(st.identifier)}
                    >
                      Deactivate
                    </button>
                  </td>
                </tr>
              ))}
              {staffList.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--ink-muted)", padding: 24 }}>
                    No staff accounts assigned to this cafeteria yet. Click "Create Staff Member" to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Staff Member (FR-18) */}
      {showStaffModal && (
        <div className="modal-backdrop" onClick={() => setShowStaffModal(false)}>
          <div className="modal-card card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3>Create Staff Account</h3>
              <button className="modal-close-btn" onClick={() => setShowStaffModal(false)}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateStaff} style={{ marginTop: 14 }}>
              <div className="field">
                <label>Full Name</label>
                <input
                  className="input"
                  placeholder="e.g. Belal Hossain"
                  value={newStaff.fullName}
                  onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="field">
                <label>Staff ID Identifier</label>
                <input
                  className="input"
                  placeholder="e.g. STF-015"
                  value={newStaff.identifier}
                  onChange={(e) => setNewStaff({ ...newStaff, identifier: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              <div className="field">
                <label>Role Assignment</label>
                <select
                  className="select"
                  value={newStaff.staffRole}
                  onChange={(e) => setNewStaff({ ...newStaff, staffRole: e.target.value })}
                >
                  <option value="kitchen">Kitchen Chef / Cook</option>
                  <option value="cashier">Counter Cashier</option>
                </select>
              </div>

              <div className="field">
                <label>Initial Password</label>
                <input
                  type="text"
                  className="input"
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="btn btn-mustard btn-block btn-lg" style={{ marginTop: 10 }}>
                Create Account & Grant Access
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
