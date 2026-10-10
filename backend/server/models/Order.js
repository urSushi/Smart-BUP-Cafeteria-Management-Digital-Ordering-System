// Order Model for Smart BUP Cafeteria Management System (SBCMS)
// Handles order lifecycle, token & QR code generation (FR-07), real-time status (FR-08),
// prep time calculation (FR-21), order cancellation (FR-15), single collection verification (FR-22),
// and 15-minute cash counter / 30-minute mobile banking auto-cancellation & Admin refund processing.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { deductStockForOrder, restoreStockForOrder, getMenuItemById } from "./MenuItem.js";
import { getCafeteriaById } from "./Cafeteria.js";
import { syncOrderToDatabase } from "../db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PERSISTENT_FILE = path.resolve(__dirname, "../../database/persistent_orders.json");

const CAFETERIA_PREFIX = {
  vista: "VST",
  amitie: "AMT",
  pitstop: "PST",
  monpura: "THP",
};

let tokenCounter = 1000;
let orderCounter = 9300;

let defaultOrders = [
  {
    id: "ORD-9281",
    tokenNumber: "VST-1042",
    qrCodeData: "SBCMS:ORD-9281:VST-1042:vista:260",
    userId: 1,
    userFullName: "Sarah Rahman",
    userIdentifier: "2021-1-60-001",
    mobileNumber: "01711223344",
    cafeteriaId: "vista",
    cafeteriaName: "Vista Cafe",
    items: [
      { id: "item-vis-2", name: "Egg Fried Rice with Chicken Chilli", price: 180, qty: 1, notes: "Less spicy please" },
      { id: "item-vis-4", name: "Iced Cold Coffee with Ice Cream", price: 80, qty: 1, notes: "" },
    ],
    subtotal: 260,
    discount: 0,
    promoCode: null,
    total: 260,
    paymentMethod: "bkash",
    paymentStatus: "paid",
    transactionId: "TRX-BK-784912",
    orderStatus: "ready", // ready for pickup!
    placedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    prepTimeMinutes: 10,
    pickupDeadlineMinutes: 30,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    estimatedReadyAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    readyAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    completedAt: null,
    cancelledAt: null,
    cancellationReason: null,
    refundedAt: null,
    refundTxnId: null,
    refundProcessedBy: null,
    adminRefundNote: null,
    isCollected: false,
    collectedAt: null,
    pickupCounter: "Counter 2 (Express)",
  },
  {
    id: "ORD-9104",
    tokenNumber: "AMT-2015",
    qrCodeData: "SBCMS:ORD-9104:AMT-2015:amitie:200",
    userId: 1,
    userFullName: "Sarah Rahman",
    userIdentifier: "2021-1-60-001",
    mobileNumber: "01711223344",
    cafeteriaId: "amitie",
    cafeteriaName: "Amitie Cafeteria",
    items: [
      { id: "item-amt-6", name: "Chicken Tehari", price: 70, qty: 1, notes: "" },
      { id: "item-amt-31", name: "Milk Tea", price: 10, qty: 1, notes: "Hot" },
    ],
    subtotal: 80,
    discount: 0,
    promoCode: null,
    total: 80,
    paymentMethod: "bkash",
    paymentStatus: "paid",
    transactionId: "TRX-BK-662910",
    orderStatus: "completed",
    placedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    prepTimeMinutes: 5,
    pickupDeadlineMinutes: 30,
    expiresAt: new Date(Date.now() - 24 * 3600 * 1000 + 30 * 60 * 1000).toISOString(),
    estimatedReadyAt: new Date(Date.now() - 24 * 3600 * 1000 + 5 * 60 * 1000).toISOString(),
    readyAt: new Date(Date.now() - 24 * 3600 * 1000 + 4 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 24 * 3600 * 1000 + 10 * 60 * 1000).toISOString(),
    cancelledAt: null,
    cancellationReason: null,
    refundedAt: null,
    refundTxnId: null,
    refundProcessedBy: null,
    adminRefundNote: null,
    isCollected: true,
    collectedAt: new Date(Date.now() - 24 * 3600 * 1000 + 10 * 60 * 1000).toISOString(),
    pickupCounter: "Counter 1",
  },
  {
    id: "ORD-9022",
    tokenNumber: "AMT-2088",
    qrCodeData: "SBCMS:ORD-9022:AMT-2088:amitie:180",
    userId: 2,
    userFullName: "Tanvir Hasan",
    userIdentifier: "2020-2-60-019",
    mobileNumber: "01788990011",
    cafeteriaId: "amitie",
    cafeteriaName: "Amitie Cafeteria",
    items: [
      { id: "item-amt-15", name: "Morog Polao (Chicken Pilaf)", price: 130, qty: 1, notes: "Extra salad" },
      { id: "item-amt-20", name: "Chicken Shawarma", price: 50, qty: 1, notes: "" },
    ],
    subtotal: 180,
    discount: 0,
    promoCode: null,
    total: 180,
    paymentMethod: "bkash",
    paymentStatus: "refund_pending",
    transactionId: "TRX-BK-918234",
    orderStatus: "refund_pending",
    placedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    prepTimeMinutes: 10,
    pickupDeadlineMinutes: 30,
    expiresAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    estimatedReadyAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    readyAt: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    completedAt: null,
    cancelledAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    cancellationReason: "Exceeded 30-minute pickup window; Refund of ৳180 pending via System Admin",
    refundedAt: null,
    refundTxnId: null,
    refundProcessedBy: null,
    adminRefundNote: null,
    isCollected: false,
    collectedAt: null,
    pickupCounter: "Counter 1",
  },
];

function savePersistentOrdersToFile(list) {
  try {
    fs.writeFileSync(PERSISTENT_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.warn("[Order DB] Warning saving persistent_orders.json:", err.message);
  }
}

function loadPersistentOrders() {
  try {
    if (fs.existsSync(PERSISTENT_FILE)) {
      const raw = fs.readFileSync(PERSISTENT_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.forEach((o) => {
          const ordNum = parseInt(o.id?.replace(/\D/g, "") || "0", 10);
          if (ordNum > orderCounter) orderCounter = ordNum;
          const tokNum = parseInt(o.tokenNumber?.replace(/\D/g, "") || "0", 10);
          if (tokNum > tokenCounter) tokenCounter = tokNum;
        });
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[Order DB] Warning reading persistent_orders.json:", err.message);
  }
  savePersistentOrdersToFile(defaultOrders);
  return [...defaultOrders];
}

let orders = loadPersistentOrders();

// Initialize database synchronization for persistent/seed orders
orders.forEach((o) => syncOrderToDatabase(o));

/**
 * Sweeps active orders and automatically enforces pickup deadlines:
 * - 15 Minutes for Cash / Counter orders -> Cancelled, items restored to stock.
 * - 30 Minutes for Mobile Banking (bKash/Nagad) -> Cancelled, refund queued (refund_pending), items restored.
 */
export function checkAndExpireOrders() {
  const now = Date.now();
  let changed = false;

  for (const order of orders) {
    if (["placed", "preparing", "ready"].includes(order.orderStatus)) {
      if (order.expiresAt && now > new Date(order.expiresAt).getTime()) {
        changed = true;
        const nowIso = new Date().toISOString();

        if (order.paymentMethod === "cash") {
          // 15-Minute Counter Order Expiry
          order.orderStatus = "cancelled";
          order.paymentStatus = "unpaid";
          order.cancelledAt = nowIso;
          order.cancellationReason = "Exceeded 15-minute counter pickup window";
        } else {
          // 30-Minute Prepaid Order Expiry (Queue for Admin Refund)
          order.orderStatus = "refund_pending";
          order.paymentStatus = "refund_pending";
          order.cancelledAt = nowIso;
          order.cancellationReason = `Exceeded 30-minute pickup window; Refund of ৳${order.total} pending via System Admin`;
        }

        // Restore stock to cafeteria inventory
        try {
          restoreStockForOrder(order.items);
        } catch (err) {
          console.warn(`[Order Expire] Stock restore for ${order.id}:`, err.message);
        }

        syncOrderToDatabase(order);
      }
    }
  }

  if (changed) {
    savePersistentOrdersToFile(orders);
  }

  return changed;
}

export function getAllOrders() {
  checkAndExpireOrders();
  return orders;
}

export function getOrderById(id) {
  if (!id) return null;
  checkAndExpireOrders();
  return orders.find((o) => o.id.toUpperCase() === id.toUpperCase()) || null;
}

export function getOrderByToken(tokenNumber) {
  if (!tokenNumber) return null;
  checkAndExpireOrders();
  const clean = tokenNumber.replace("#", "").trim().toUpperCase();
  return orders.find((o) => o.tokenNumber.toUpperCase() === clean) || null;
}

export function getOrdersByUser(userId) {
  if (!userId) return [];
  checkAndExpireOrders();
  return orders
    .filter((o) => o.userId === userId || o.userIdentifier === String(userId))
    .sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt));
}

export function getOrdersByCafeteria(cafeteriaId) {
  checkAndExpireOrders();
  if (!cafeteriaId) return orders;
  return orders
    .filter((o) => o.cafeteriaId.toLowerCase() === cafeteriaId.toLowerCase())
    .sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt));
}

export function getPendingRefundOrders(cafeteriaId = null) {
  checkAndExpireOrders();
  let list = orders.filter((o) => o.paymentStatus === "refund_pending" || o.orderStatus === "refund_pending");
  if (cafeteriaId && cafeteriaId !== "all") {
    list = list.filter((o) => o.cafeteriaId === cafeteriaId);
  }
  return list.sort((a, b) => new Date(b.cancelledAt || b.placedAt) - new Date(a.cancelledAt || a.placedAt));
}

export function createOrder(data) {
  const caf = getCafeteriaById(data.cafeteriaId);
  if (!caf) throw new Error("Invalid cafeteria specified.");
  if (!caf.isOpen) throw new Error(`${caf.name} is currently closed.`);

  if (!data.items || data.items.length === 0) {
    throw new Error("Cannot place an empty order.");
  }

  // 1. Stock check and atomic deduction (FR-13)
  deductStockForOrder(data.items);

  // 2. Generate unique token number (e.g., VST-1043) and Order ID (FR-07)
  const prefix = CAFETERIA_PREFIX[data.cafeteriaId.toLowerCase()] || "SBC";
  tokenCounter += 1;
  orderCounter += 1;

  const tokenNumber = `${prefix}-${tokenCounter}`;
  const orderId = `ORD-${orderCounter}`;

  // 3. Dynamic preparation time calculation (FR-21)
  // Max item prep time + active queue factor
  const basePrep = Math.max(
    ...data.items.map((i) => {
      const dbItem = getMenuItemById(i.id || i.menuItemId);
      return i.prepTimeMinutes || dbItem?.prepTimeMinutes || 6;
    })
  );
  const activeOrdersInCaf = orders.filter(
    (o) => o.cafeteriaId === data.cafeteriaId && ["placed", "preparing"].includes(o.orderStatus)
  ).length;
  const prepTimeMinutes = basePrep + Math.min(10, Math.floor(activeOrdersInCaf * 1.5));

  const placedAt = new Date().toISOString();
  const estimatedReadyAt = new Date(Date.now() + prepTimeMinutes * 60 * 1000).toISOString();

  // 4. Pickup deadline rule:
  // Counter Cash = 15 minutes limit
  // Prepaid Mobile Banking (bKash / Nagad) = 30 minutes limit
  const isCounterCash = data.paymentMethod === "cash";
  const pickupDeadlineMinutes = isCounterCash ? 15 : 30;
  const expiresAt = new Date(Date.now() + pickupDeadlineMinutes * 60 * 1000).toISOString();

  // QR Code Data Payload
  const qrCodeData = `SBCMS:${orderId}:${tokenNumber}:${data.cafeteriaId}:${data.total}`;

  const newOrder = {
    id: orderId,
    tokenNumber,
    qrCodeData,
    userId: data.userId || 1,
    userFullName: data.userFullName || "BUP Student",
    userIdentifier: data.userIdentifier || "2021-1-60-001",
    mobileNumber: data.mobileNumber || "01711223344",
    cafeteriaId: data.cafeteriaId,
    cafeteriaName: caf.name,
    items: data.items,
    subtotal: Number(data.subtotal) || 0,
    discount: Number(data.discount) || 0,
    promoCode: data.promoCode || null,
    total: Number(data.total) || 0,
    paymentMethod: data.paymentMethod || "bkash", // bkash | nagad | cash
    paymentStatus: isCounterCash ? "pending" : "paid",
    transactionId: data.transactionId || (isCounterCash ? null : `TRX-${Date.now().toString().slice(-6)}`),
    orderStatus: "placed", // Placed -> Preparing -> Ready -> Completed
    placedAt,
    prepTimeMinutes,
    pickupDeadlineMinutes,
    expiresAt,
    estimatedReadyAt,
    readyAt: null,
    completedAt: null,
    cancelledAt: null,
    cancellationReason: null,
    refundedAt: null,
    refundTxnId: null,
    refundProcessedBy: null,
    adminRefundNote: null,
    isCollected: false,
    collectedAt: null,
    pickupCounter: caf.pickupCounter || "Counter 1",
  };

  orders.unshift(newOrder);
  syncOrderToDatabase(newOrder);
  savePersistentOrdersToFile(orders);

  return newOrder;
}

export function updateOrderStatus(orderId, nextStatus) {
  const order = getOrderById(orderId);
  if (!order) return null;

  order.orderStatus = nextStatus;
  const now = new Date().toISOString();

  if (nextStatus === "ready") {
    order.readyAt = now;
  } else if (nextStatus === "completed") {
    order.completedAt = now;
    order.isCollected = true;
    order.collectedAt = now;
    if (order.paymentStatus === "pending") {
      order.paymentStatus = "paid"; // collected at counter cash
    }
  } else if (nextStatus === "cancelled") {
    order.cancelledAt = now;
  }

  syncOrderToDatabase(order);
  savePersistentOrdersToFile(orders);
  return order;
}

// Order cancellation prior to preparation (FR-15)
export function cancelOrder(orderId, reason = "Cancelled by student") {
  const order = getOrderById(orderId);
  if (!order) throw new Error("Order not found.");

  if (order.orderStatus !== "placed") {
    throw new Error(
      `Cannot cancel order. The kitchen has already started preparing it (Status: ${order.orderStatus}).`
    );
  }

  // Restore inventory stock (FR-15)
  restoreStockForOrder(order.items);

  const isPrepaid = order.paymentMethod !== "cash" && order.paymentStatus === "paid";
  order.cancelledAt = new Date().toISOString();

  if (isPrepaid) {
    order.orderStatus = "refund_pending";
    order.paymentStatus = "refund_pending";
    order.cancellationReason = `${reason}; Refund of ৳${order.total} pending via System Admin`;
  } else {
    order.orderStatus = "cancelled";
    order.cancellationReason = reason;
  }

  syncOrderToDatabase(order);
  savePersistentOrdersToFile(orders);
  return order;
}

/**
 * Execute System Administrator Refund for uncollected or cancelled prepaid order
 */
export function processAdminRefund(orderId, adminNote = "") {
  const order = getOrderById(orderId);
  if (!order) throw new Error("Order not found.");

  if (order.paymentStatus !== "refund_pending" && order.orderStatus !== "refund_pending") {
    throw new Error(`Order #${order.tokenNumber} is not marked for pending refund (Current status: ${order.paymentStatus}).`);
  }

  const now = new Date().toISOString();
  const methodPrefix = order.paymentMethod === "bkash" ? "REF-BK" : order.paymentMethod === "nagad" ? "REF-NG" : "REF-MFS";
  const refundTxnId = `${methodPrefix}-${Math.floor(100000 + Math.random() * 900000)}`;

  order.paymentStatus = "refunded";
  order.orderStatus = "refunded";
  order.refundedAt = now;
  order.refundTxnId = refundTxnId;
  order.refundProcessedBy = "System Administrator";
  order.adminRefundNote = adminNote || `Refund of ৳${order.total} processed back to customer ${order.paymentMethod.toUpperCase()} (${order.mobileNumber})`;

  syncOrderToDatabase(order);
  savePersistentOrdersToFile(orders);
  return order;
}

// Token & QR Code Pickup Verification & Prevention of Duplicate Collection (FR-11, FR-22)
export function verifyAndCollectPickup(tokenOrQr, staffCafeteriaId) {
  if (!tokenOrQr) throw new Error("Please scan or enter a pickup token.");

  let token = tokenOrQr.trim();
  // Handle QR code content if full string scanned (e.g. SBCMS:ORD-9281:VST-1042:...)
  if (token.startsWith("SBCMS:")) {
    const parts = token.split(":");
    token = parts[2] || parts[1];
  }
  token = token.replace("#", "").toUpperCase();

  const order = getOrderByToken(token) || getOrderById(token);
  if (!order) {
    throw new Error(`Token or Order "${token}" not found in system.`);
  }

  // Verify cafeteria match
  if (staffCafeteriaId && order.cafeteriaId.toLowerCase() !== staffCafeteriaId.toLowerCase()) {
    throw new Error(
      `Wrong Cafeteria! Order #${order.tokenNumber} belongs to ${order.cafeteriaName}, not your counter.`
    );
  }

  // FR-22: Prevent order from being collected more than once!
  if (order.isCollected || order.orderStatus === "completed") {
    const formattedTime = new Date(order.collectedAt || Date.now()).toLocaleTimeString();
    throw new Error(
      `ALREADY COLLECTED! Order #${order.tokenNumber} was already handed over at ${formattedTime}. Duplicate collection prohibited.`
    );
  }

  if (order.orderStatus === "cancelled" || order.orderStatus === "refund_pending" || order.orderStatus === "refunded") {
    throw new Error(`Order #${order.tokenNumber} was cancelled (${order.cancellationReason || "Pickup window expired"}) and cannot be fulfilled.`);
  }

  // Complete handover
  order.isCollected = true;
  order.collectedAt = new Date().toISOString();
  order.completedAt = new Date().toISOString();
  order.orderStatus = "completed";
  if (order.paymentStatus === "pending") {
    order.paymentStatus = "paid"; // cash received
  }

  syncOrderToDatabase(order);
  savePersistentOrdersToFile(orders);

  return {
    success: true,
    order,
    message: `Order #${order.tokenNumber} verified successfully! Hand over food to ${order.userFullName}.`,
  };
}
