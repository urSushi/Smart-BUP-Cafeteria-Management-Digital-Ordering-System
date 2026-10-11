import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { apiService } from "../services/apiService.js";
import QRScannerModal from "../components/QRScannerModal.jsx";
import Icon from "../components/Icons.jsx";
import { Spinner } from "../components/Loader.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";

const CANTEEN_INFO = {
  vista: { name: "Vista Cafe", location: "Academic Building GF", code: "VST" },
  amitie: { name: "Amitie Cafeteria", location: "FBS Building GF", code: "AMT" },
  pitstop: { name: "Pitstop", location: "FASS GF Walkway", code: "PST" },
  monpura: { name: "Third Place", location: "Monpura Lakeside Deck", code: "THP" },
};

export default function StaffDashboard() {
  const { user, logout } = useAuth();
  const toast = useToast();

  // Strict Staff Scoping: Access is permanently locked to staff member's assigned cafeteria
  const activeCafeteriaId = user?.cafeteriaId || "vista";
  const [activeTab, setActiveTab] = useState("orders"); // orders | inventory | menu
  const [orders, setOrders] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // New item form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "Rice Bowls",
    price: "",
    prepTimeMinutes: "8",
    calories: "450 kcal",
    stockQuantity: "25",
    description: "",
  });

  const loadData = useCallback(async () => {
    try {
      const [ordList, invList, alerts] = await Promise.all([
        apiService.getCafeteriaOrders(activeCafeteriaId),
        apiService.getInventory(activeCafeteriaId),
        apiService.getLowStockAlerts(activeCafeteriaId),
      ]);
      setOrders(ordList || []);
      setInventoryItems(invList || []);
      setLowStockAlerts(alerts?.alerts || []);
    } catch (err) {
      console.warn("Staff dashboard fetch:", err.message);
    } finally {
      setLoading(false);
    }
  }, [activeCafeteriaId]);

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 5000);
    return () => clearInterval(timer);
  }, [loadData]);

  // Status transitions (FR-10)
  async function handleStatusChange(orderId, newStatus) {
    try {
      await apiService.updateOrderStatus(orderId, newStatus);
      toast.success(`Order updated to "${newStatus}".`);
      await loadData();
    } catch (err) {
      toast.error(err.message || "Failed to update order status.");
    }
  }

  // Stock adjustment (FR-13)
  async function handleAdjustStock(itemId, delta) {
    const item = inventoryItems.find((i) => i.id === itemId);
    if (!item) return;
    const newQty = Math.max(0, item.stockQuantity + delta);
    try {
      await apiService.updateStock(itemId, newQty);
      toast.info(`Updated stock for ${item.name} to ${newQty}.`);
      await loadData();
    } catch (err) {
      toast.error("Could not update stock.");
    }
  }

  // Add new menu item (FR-12)
  async function handleCreateItem(e) {
    e.preventDefault();
    if (!newItem.name || !newItem.price) return;
    try {
      await apiService.createMenuItem({
        ...newItem,
        cafeteriaId: activeCafeteriaId,
      });
      toast.success(`Added "${newItem.name}" to menu!`);
      setShowAddModal(false);
      setNewItem({
        name: "",
        category: "Rice Bowls",
        price: "",
        prepTimeMinutes: "8",
        calories: "450 kcal",
        stockQuantity: "25",
        description: "",
      });
      await loadData();
    } catch (err) {
      toast.error("Failed to add menu item.");
    }
  }

  const placedOrders = orders.filter((o) => o.orderStatus === "placed");
  const preparingOrders = orders.filter((o) => o.orderStatus === "preparing");
  const readyOrders = orders.filter((o) => o.orderStatus === "ready");
  const completedOrders = orders.filter((o) => o.orderStatus === "completed").slice(0, 10);

  return (
    <div className="staff-portal-shell">
      {/* Top Staff Navigation Bar */}
      <header className="staff-header">
        <div className="staff-header-left">
          <div className="staff-brand">
            <span className="staff-badge">KDS PORTAL</span>
            <h2>{CANTEEN_INFO[activeCafeteriaId]?.name || "Cafeteria"} Kitchen Console</h2>
          </div>

          {/* Assigned Canteen Display (Locked to staff member's station) */}
          <div className="staff-canteen-station-badge" title="Access is restricted exclusively to your designated canteen">
            <div className="station-icon-wrap">
              <Icon name="mapPin" size={15} />
            </div>
            <div className="station-meta">
              <span className="station-label">ASSIGNED CANTEEN</span>
              <span className="station-name">
                {CANTEEN_INFO[activeCafeteriaId]?.name || "Assigned Canteen"}
                <span className="station-loc"> · {CANTEEN_INFO[activeCafeteriaId]?.location}</span>
              </span>
            </div>
            <span className="station-lock-chip">
              🔒 Locked Access
            </span>
          </div>
        </div>

        <div className="staff-header-right">
          <button
            type="button"
            className="btn btn-mustard btn-sm"
            onClick={() => setScannerOpen(true)}
          >
            <Icon name="maximize" size={16} />
            <span>Scan QR / Verify Token (FR-11)</span>
          </button>

          <div className="staff-user-chip">
            <div className="staff-avatar">{user?.fullName?.charAt(0) || "S"}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{user?.fullName}</div>
              <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>ID: {user?.identifier || "STF-001"}</div>
            </div>
          </div>

          <ThemeToggle />

          <button type="button" className="btn btn-secondary btn-sm" onClick={logout}>
            <Icon name="logOut" size={14} />
            <span>Exit</span>
          </button>
        </div>
      </header>

      {/* Low Stock Alert Warning Banner (FR-14) */}
      {lowStockAlerts.length > 0 && (
        <div className="staff-alert-banner">
          <Icon name="alertCircle" size={18} color="var(--mustard-dark)" />
          <span>
            <strong>LOW STOCK ALERT (FR-14):</strong> {lowStockAlerts.length} item(s) below threshold in this kitchen (
            {lowStockAlerts.map((i) => `${i.name}: ${i.stockQuantity} left`).join(", ")})!
          </span>
        </div>
      )}

      {/* Main Container */}
      <div className="staff-content-container">
        {/* Secondary Tab Bar */}
        <div className="staff-tabs-row">
          <div className="staff-tabs">
            <button
              type="button"
              className={`s-tab ${activeTab === "orders" ? "active" : ""}`}
              onClick={() => setActiveTab("orders")}
            >
              <Icon name="utensils" size={15} />
              <span>Live Order Queue ({placedOrders.length + preparingOrders.length + readyOrders.length})</span>
            </button>

            <button
              type="button"
              className={`s-tab ${activeTab === "inventory" ? "active" : ""}`}
              onClick={() => setActiveTab("inventory")}
            >
              <Icon name="shield" size={15} />
              <span>Inventory & Stock ({inventoryItems.length})</span>
              {lowStockAlerts.length > 0 && <span className="tab-alert-badge">{lowStockAlerts.length}</span>}
            </button>

            <button
              type="button"
              className={`s-tab ${activeTab === "menu" ? "active" : ""}`}
              onClick={() => setActiveTab("menu")}
            >
              <Icon name="coffee" size={15} />
              <span>Menu Catalog & Dishes</span>
            </button>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            {activeTab === "menu" && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowAddModal(true)}
              >
                <Icon name="plus" size={14} />
                <span>Add New Dish</span>
              </button>
            )}

            <button type="button" className="btn btn-secondary btn-sm" onClick={loadData}>
              <Icon name="zap" size={14} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Live Kitchen Orders Board (Kanban FR-10) */}
        {activeTab === "orders" && (
          <div className="kds-board">
            {/* Column 1: New Incoming Orders */}
            <div className="kds-column">
              <div className="kds-col-header col-header-new">
                <span className="col-indicator" />
                <h4>New Placed Orders</h4>
                <span className="kds-count">{placedOrders.length}</span>
              </div>
              <div className="kds-cards-list">
                {placedOrders.map((ord) => (
                  <div key={ord.id} className="kds-ticket card">
                    <div className="ticket-top">
                      <span className="ticket-token">#{ord.tokenNumber}</span>
                      <span className="ticket-time">{new Date(ord.placedAt).toLocaleTimeString()}</span>
                    </div>

                    <div className="ticket-student">
                      <strong>{ord.userFullName}</strong>
                      <div style={{ fontSize: "0.75rem", color: ord.paymentMethod === "cash" ? "var(--mustard-dark)" : "var(--teal)", fontWeight: 700, marginTop: 2 }}>
                        {ord.paymentMethod === "cash" ? "⏱️ 15m Counter Pickup" : "🛡️ 30m Prepaid Window"} · {ord.paymentMethod.toUpperCase()}
                      </div>
                    </div>

                    <div className="ticket-items">
                      {ord.items.map((it, idx) => (
                        <div key={idx} className="ticket-item-row">
                          <span className="qty-tag">{it.qty}x</span>
                          <span className="item-txt">{it.name}</span>
                          {it.notes && <span className="ticket-note">Note: {it.notes}</span>}
                        </div>
                      ))}
                    </div>

                    <div className="ticket-actions">
                      <button
                        type="button"
                        className="btn btn-primary btn-block btn-sm"
                        onClick={() => handleStatusChange(ord.id, "preparing")}
                      >
                        <Icon name="utensils" size={14} />
                        <span>Start Cooking</span>
                      </button>
                    </div>
                  </div>
                ))}
                {placedOrders.length === 0 && <div className="kds-empty">No new incoming orders</div>}
              </div>
            </div>

            {/* Column 2: In Kitchen Preparation */}
            <div className="kds-column">
              <div className="kds-col-header col-header-prep">
                <span className="col-indicator" />
                <h4>In Preparation</h4>
                <span className="kds-count">{preparingOrders.length}</span>
              </div>
              <div className="kds-cards-list">
                {preparingOrders.map((ord) => (
                  <div key={ord.id} className="kds-ticket card ticket-prep">
                    <div className="ticket-top">
                      <span className="ticket-token">#{ord.tokenNumber}</span>
                      <span className="ticket-time">Prep: ~{ord.prepTimeMinutes}m</span>
                    </div>

                    <div className="ticket-student">
                      <strong>{ord.userFullName}</strong>
                      <div style={{ fontSize: "0.75rem", color: ord.paymentMethod === "cash" ? "var(--mustard-dark)" : "var(--teal)", fontWeight: 700, marginTop: 2 }}>
                        {ord.paymentMethod === "cash" ? "⏱️ 15m Counter Window" : "🛡️ 30m Prepaid Window"} · {ord.paymentMethod.toUpperCase()}
                      </div>
                    </div>

                    <div className="ticket-items">
                      {ord.items.map((it, idx) => (
                        <div key={idx} className="ticket-item-row">
                          <span className="qty-tag">{it.qty}x</span>
                          <span className="item-txt">{it.name}</span>
                          {it.notes && <span className="ticket-note">Note: {it.notes}</span>}
                        </div>
                      ))}
                    </div>

                    <div className="ticket-actions">
                      <button
                        type="button"
                        className="btn btn-mustard btn-block btn-sm"
                        onClick={() => handleStatusChange(ord.id, "ready")}
                      >
                        <Icon name="bell" size={14} />
                        <span>Mark as Ready for Pickup</span>
                      </button>
                    </div>
                  </div>
                ))}
                {preparingOrders.length === 0 && <div className="kds-empty">No orders currently cooking</div>}
              </div>
            </div>

            {/* Column 3: Ready for Pickup */}
            <div className="kds-column">
              <div className="kds-col-header col-header-ready">
                <span className="col-indicator" />
                <h4>Ready for Pickup</h4>
                <span className="kds-count">{readyOrders.length}</span>
              </div>
              <div className="kds-cards-list">
                {readyOrders.map((ord) => (
                  <div key={ord.id} className="kds-ticket card ticket-ready">
                    <div className="ticket-top">
                      <span className="ticket-token" style={{ background: "var(--teal)", color: "#fff" }}>
                        #{ord.tokenNumber}
                      </span>
                      <span className="ticket-time">Waiting student</span>
                    </div>

                    <div className="ticket-student">
                      <strong>{ord.userFullName}</strong> · Total: ৳{ord.total}
                      <div style={{ fontSize: "0.75rem", color: ord.paymentMethod === "cash" ? "var(--mustard-dark)" : "var(--teal)", fontWeight: 700, marginTop: 2 }}>
                        {ord.paymentMethod === "cash" ? "⏱️ 15m Counter Window" : "🛡️ 30m Prepaid Window"}
                      </div>
                    </div>

                    <div className="ticket-items">
                      {ord.items.map((it, idx) => (
                        <div key={idx} className="ticket-item-row">
                          <span className="qty-tag">{it.qty}x</span>
                          <span className="item-txt">{it.name}</span>
                        </div>
                      ))}
                    </div>

                    <div className="ticket-actions" style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-block btn-sm"
                        onClick={() => handleStatusChange(ord.id, "completed")}
                      >
                        <Icon name="check" size={14} />
                        <span>Complete Handover</span>
                      </button>
                    </div>
                  </div>
                ))}
                {readyOrders.length === 0 && <div className="kds-empty">No orders awaiting pickup</div>}
              </div>
            </div>

            {/* Column 4: Completed Recently */}
            <div className="kds-column">
              <div className="kds-col-header col-header-done">
                <span className="col-indicator" />
                <h4>Fulfilled Today</h4>
                <span className="kds-count">{completedOrders.length}</span>
              </div>
              <div className="kds-cards-list">
                {completedOrders.map((ord) => (
                  <div key={ord.id} className="kds-ticket card ticket-done">
                    <div className="ticket-top">
                      <span className="ticket-token">#{ord.tokenNumber}</span>
                      <span className="ticket-time">Collected</span>
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "var(--ink-soft)" }}>
                      {ord.items.map((i) => `${i.qty}x ${i.name}`).join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Live Inventory Control (FR-13, FR-14) */}
        {activeTab === "inventory" && (
          <div className="staff-inventory-view card">
            <div className="inventory-view-header">
              <div>
                <h3>Real-Time Kitchen Stock Controller</h3>
                <p>Adjust available stock quantities. When quantity hits 0, students cannot order it (FR-13).</p>
              </div>
            </div>

            <table className="staff-table">
              <thead>
                <tr>
                  <th>Dish Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock Quantity (Live)</th>
                  <th>Low-Stock Alert Level</th>
                  <th>Status</th>
                  <th>Quick Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventoryItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                    </td>
                    <td>{item.category}</td>
                    <td>৳{item.price}</td>
                    <td>
                      <div className="stock-counter-cell">
                        <button
                          type="button"
                          className="btn-counter"
                          onClick={() => handleAdjustStock(item.id, -1)}
                        >
                          -
                        </button>
                        <span className="stock-number-cell">{item.stockQuantity}</span>
                        <button
                          type="button"
                          className="btn-counter"
                          onClick={() => handleAdjustStock(item.id, 1)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>
                        &le; {item.lowStockThreshold} units
                      </span>
                    </td>
                    <td>
                      {item.isOutOfStock ? (
                        <span className="badge badge-closed">Sold Out</span>
                      ) : item.isLowStock ? (
                        <span className="badge badge-open" style={{ background: "var(--mustard-tint)", color: "var(--mustard-dark)", border: "1px solid var(--mustard)" }}>
                          Low Stock Alert
                        </span>
                      ) : (
                        <span className="badge badge-open">Available</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleAdjustStock(item.id, 10)}
                        >
                          +10 Stock
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleAdjustStock(item.id, -item.stockQuantity)}
                        >
                          Mark 0
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Menu Catalog Management (FR-12) */}
        {activeTab === "menu" && (
          <div className="staff-menu-view card">
            <div className="inventory-view-header">
              <div>
                <h3>Kitchen Menu Management</h3>
                <p>Add, edit prices, and manage active dishes available for student ordering.</p>
              </div>
            </div>

            <div className="staff-dishes-grid">
              {inventoryItems.map((it) => (
                <div key={it.id} className="staff-dish-card card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <span className="item-category-tag">{it.category}</span>
                      <h4 style={{ margin: "4px 0 2px" }}>{it.name}</h4>
                    </div>
                    <div style={{ fontWeight: 800, color: "var(--teal-dark)" }}>৳{it.price}</div>
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--ink-soft)", margin: "8px 0" }}>
                    Stock: {it.stockQuantity} · Status: {it.isAvailable ? "Available" : "Disabled"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        staffCafeteriaId={activeCafeteriaId}
        onScanSuccess={() => loadData()}
      />

      {/* Add New Dish Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-card card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3>Add New Menu Item</h3>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateItem} style={{ marginTop: 14 }}>
              <div className="field">
                <label>Dish Name</label>
                <input
                  className="input"
                  placeholder="e.g. Chicken Chowmein"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div className="field">
                  <label>Category</label>
                  <select
                    className="select"
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  >
                    <option value="Rice Bowls">Rice Bowls</option>
                    <option value="Burgers & Fast Food">Burgers & Fast Food</option>
                    <option value="Snacks & Bakery">Snacks & Bakery</option>
                    <option value="Beverages">Beverages</option>
                    <option value="BBQ & Grill">BBQ & Grill</option>
                  </select>
                </div>

                <div className="field">
                  <label>Price (BDT ৳)</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="150"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div className="field">
                  <label>Initial Stock Units</label>
                  <input
                    type="number"
                    className="input"
                    value={newItem.stockQuantity}
                    onChange={(e) => setNewItem({ ...newItem, stockQuantity: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label>Prep Time (Minutes)</label>
                  <input
                    type="number"
                    className="input"
                    value={newItem.prepTimeMinutes}
                    onChange={(e) => setNewItem({ ...newItem, prepTimeMinutes: e.target.value })}
                  />
                </div>
              </div>

              <div className="field">
                <label>Description & Ingredients</label>
                <textarea
                  className="input"
                  rows={2}
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Freshly made..."
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block btn-lg" style={{ marginTop: 8 }}>
                Save Dish to Menu
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
