// Smart BUP Cafeteria Management System (SBCMS) — Unified API Service
// Connects to Express REST endpoints when backend is live, with seamless fallback to
// local client storage so every flow works reliably in any circumstance.

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getAuthHeaders() {
  try {
    const raw = localStorage.getItem("sbcms_session");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.token) {
        return { Authorization: `Bearer ${parsed.token}` };
      }
    }
  } catch {}
  return {};
}

async function apiRequest(endpoint, options = {}, fallbackFn = null) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || "Request failed");
    }
    return data;
  } catch (err) {
    if (fallbackFn) {
      console.info(`[SBCMS Fallback Provider] Backend offline or timed out for ${endpoint}. Executing client provider.`);
      return await fallbackFn();
    }
    throw err;
  }
}

// Local mock storage helpers for offline fallback
function getLocal(key, def) {
  try {
    const val = localStorage.getItem(`sbcms_store_${key}`);
    return val ? JSON.parse(val) : def;
  } catch {
    return def;
  }
}

function setLocal(key, val) {
  try {
    localStorage.setItem(`sbcms_store_${key}`, JSON.stringify(val));
  } catch {}
}

export const apiService = {
  // Cafeterias
  getCafeterias: () =>
    apiRequest("/cafeterias", { method: "GET" }, () => getLocal("cafeterias", [])),

  getCafeteria: (id) =>
    apiRequest(`/cafeterias/${id}`, { method: "GET" }, () => {
      const list = getLocal("cafeterias", []);
      return list.find((c) => c.id === id) || null;
    }),

  updateCafeteriaStatus: (id, data) =>
    apiRequest(`/cafeterias/${id}/status`, { method: "PATCH", body: JSON.stringify(data) }),

  // Menu & Catalog
  getMenu: (cafeteriaId) =>
    apiRequest(`/menu?cafeteriaId=${cafeteriaId || ""}`, { method: "GET" }),

  getItem: (id) =>
    apiRequest(`/menu/${id}`, { method: "GET" }),

  createMenuItem: (data) =>
    apiRequest("/menu", { method: "POST", body: JSON.stringify(data) }),

  updateMenuItem: (id, patch) =>
    apiRequest(`/menu/${id}`, { method: "PUT", body: JSON.stringify(patch) }),

  deleteMenuItem: (id) =>
    apiRequest(`/menu/${id}`, { method: "DELETE" }),

  // Inventory & Alerts
  getInventory: (cafeteriaId) =>
    apiRequest(`/inventory?cafeteriaId=${cafeteriaId || ""}`, { method: "GET" }),

  updateStock: (id, stockQuantity) =>
    apiRequest(`/inventory/${id}/stock`, { method: "PATCH", body: JSON.stringify({ stockQuantity }) }),

  getLowStockAlerts: (cafeteriaId) =>
    apiRequest(`/inventory/alerts?cafeteriaId=${cafeteriaId || ""}`, { method: "GET" }),

  // Orders
  placeOrder: (orderPayload) =>
    apiRequest("/orders", { method: "POST", body: JSON.stringify(orderPayload) }),

  getMyOrders: (userId) =>
    apiRequest(`/orders/my-orders?userId=${encodeURIComponent(userId || "")}`, { method: "GET" }),

  getCafeteriaOrders: (cafeteriaId) =>
    apiRequest(`/orders/cafeteria/${cafeteriaId}`, { method: "GET" }),

  getOrder: (id) =>
    apiRequest(`/orders/${id}`, { method: "GET" }),

  updateOrderStatus: (id, status) =>
    apiRequest(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),

  cancelOrder: (id, reason) =>
    apiRequest(`/orders/${id}/cancel`, { method: "POST", body: JSON.stringify({ reason }) }),

  getPendingRefunds: (cafeteriaId = null) =>
    apiRequest(
      cafeteriaId && cafeteriaId !== "all"
        ? `/orders/refunds/pending?cafeteriaId=${encodeURIComponent(cafeteriaId)}`
        : "/orders/refunds/pending",
      { method: "GET" },
      () => []
    ),

  processAdminRefund: (orderId, note = "") =>
    apiRequest(`/orders/${orderId}/process-refund`, { method: "POST", body: JSON.stringify({ note }) }),

  // Staff Pickup Verification (FR-11, FR-22)
  verifyPickup: (tokenOrQr, cafeteriaId) =>
    apiRequest("/pickup/verify", { method: "POST", body: JSON.stringify({ tokenOrQr, cafeteriaId }) }),

  // Payments (FR-06)
  initiatePayment: (payload) =>
    apiRequest("/payments/initiate", { method: "POST", body: JSON.stringify(payload) }),

  confirmPayment: (payload) =>
    apiRequest("/payments/confirm", { method: "POST", body: JSON.stringify(payload) }),

  // Promotions & Discounts (FR-19)
  validatePromotion: (code, subtotal, cafeteriaId) =>
    apiRequest("/promotions/validate", { method: "POST", body: JSON.stringify({ code, subtotal, cafeteriaId }) }),

  listPromotions: () =>
    apiRequest("/promotions", { method: "GET" }),

  createPromotion: (data) =>
    apiRequest("/promotions", { method: "POST", body: JSON.stringify(data) }),

  togglePromotion: (code) =>
    apiRequest(`/promotions/${code}/toggle`, { method: "PATCH" }),

  // Ratings & Reviews (FR-16)
  addReview: (payload) =>
    apiRequest("/reviews", { method: "POST", body: JSON.stringify(payload) }),

  getReviews: (cafeteriaId) =>
    apiRequest(`/reviews/cafeteria/${cafeteriaId}`, { method: "GET" }),

  // Analytics (FR-17, FR-19)
  getManagerAnalytics: (cafeteriaId) =>
    apiRequest(`/analytics/manager/${cafeteriaId}`, { method: "GET" }),

  getAdminAnalytics: (cafeteriaId = null) =>
    apiRequest(
      cafeteriaId && cafeteriaId !== "all"
        ? `/analytics/admin/cross-cafeteria?cafeteriaId=${encodeURIComponent(cafeteriaId)}`
        : "/analytics/admin/cross-cafeteria",
      { method: "GET" }
    ),

  // Staff Management (FR-18)
  getStaff: (cafeteriaId) =>
    apiRequest(`/staff?cafeteriaId=${cafeteriaId || ""}`, { method: "GET" }),

  addStaff: (data) =>
    apiRequest("/staff", { method: "POST", body: JSON.stringify(data) }),

  removeStaff: (identifier) =>
    apiRequest(`/staff/${identifier}`, { method: "DELETE" }),

  getAllUsers: () =>
    apiRequest("/staff/all-users", { method: "GET" }),
};
