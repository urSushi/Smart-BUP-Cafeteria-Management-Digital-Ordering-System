import {
  createOrder,
  getOrderById,
  getOrdersByUser,
  getOrdersByCafeteria,
  updateOrderStatus,
  cancelOrder,
  getPendingRefundOrders,
  processAdminRefund,
} from "../models/Order.js";
import { validatePromotion } from "../models/Promotion.js";

export function placeOrder(req, res) {
  try {
    const { cafeteriaId, items, paymentMethod, promoCode, userFullName, userIdentifier, mobileNumber, transactionId } = req.body;

    if (!cafeteriaId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Cafeteria and at least one item are required." });
    }

    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => sum + item.price * (item.qty || 1), 0);
    let discount = 0;

    // Apply promo code if provided
    if (promoCode) {
      const promoResult = validatePromotion(promoCode, subtotal, cafeteriaId);
      if (promoResult.valid) {
        discount = promoResult.discount;
      }
    }

    const total = Math.max(0, subtotal - discount);

    const order = createOrder({
      cafeteriaId,
      items,
      subtotal,
      discount,
      promoCode: discount > 0 ? promoCode : null,
      total,
      paymentMethod: paymentMethod || "bkash",
      transactionId: transactionId || null,
      mobileNumber: mobileNumber || req.user?.phone || "01711223344",
      userFullName: userFullName || req.user?.fullName || (req.user?.role === "faculty" ? "BUP Faculty" : "BUP User"),
      userIdentifier: userIdentifier || req.user?.identifier || (req.user?.id ? String(req.user.id) : "guest"),
      userId: req.user?.id || req.body.userId || req.user?.identifier || userIdentifier || "guest",
    });

    return res.status(201).json({
      message: "Order placed successfully!",
      order,
    });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Failed to place order." });
  }
}

export function getUserOrders(req, res) {
  const primaryKey = req.user?.identifier || req.query.userIdentifier || req.query.userId;
  const secondaryKey = req.user?.id ? String(req.user.id) : null;
  if (!primaryKey && !secondaryKey) {
    return res.json([]);
  }
  const list = getOrdersByUser(primaryKey, secondaryKey);
  return res.json(list);
}

export function getCafeteriaOrders(req, res) {
  const { cafeteriaId } = req.params;
  const list = getOrdersByCafeteria(cafeteriaId);
  return res.json(list);
}

export function getOrder(req, res) {
  const { id } = req.params;
  const order = getOrderById(id);
  if (!order) return res.status(404).json({ message: "Order not found." });
  return res.json(order);
}

export function updateStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  if (!["placed", "preparing", "ready", "completed", "cancelled"].includes(status)) {
    return res.status(400).json({ message: "Invalid order status." });
  }

  const existingOrder = getOrderById(id);
  if (!existingOrder) return res.status(404).json({ message: "Order not found." });

  // Privacy & Access Check: Staff/Manager can only modify orders of their own cafeteria
  if (req.user) {
    const isMasterAdmin = req.user.role === "admin" && (req.user.cafeteriaId === "all" || !req.user.cafeteriaId);
    if (!isMasterAdmin && req.user.cafeteriaId) {
      if (req.user.cafeteriaId.toLowerCase() !== existingOrder.cafeteriaId.toLowerCase()) {
        return res.status(403).json({
          message: `Access denied. Privacy violation: This order belongs to ${existingOrder.cafeteriaName || existingOrder.cafeteriaId}, not your assigned counter (${req.user.cafeteriaId}).`,
        });
      }
    }
  }

  const updated = updateOrderStatus(id, status);
  if (!updated) return res.status(404).json({ message: "Order not found." });

  return res.json({
    message: `Order #${updated.tokenNumber} marked as "${status}".`,
    order: updated,
  });
}

export function cancel(req, res) {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const cancelled = cancelOrder(id, reason);
    return res.json({
      message: `Order #${cancelled.tokenNumber} has been successfully cancelled and items returned to stock.`,
      order: cancelled,
    });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Could not cancel order." });
  }
}

export function getRefundPendingOrders(req, res) {
  try {
    let { cafeteriaId } = req.query;
    if (req.user?.cafeteriaId && req.user.cafeteriaId !== "all") {
      if (cafeteriaId && cafeteriaId !== "all" && cafeteriaId.toLowerCase() !== req.user.cafeteriaId.toLowerCase()) {
        return res.status(403).json({
          message: `Access denied. You can only view pending refunds for your assigned cafeteria (${req.user.cafeteriaId}).`,
        });
      }
      cafeteriaId = req.user.cafeteriaId;
    }
    const list = getPendingRefundOrders(cafeteriaId);
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to fetch pending refunds." });
  }
}

export function adminProcessRefund(req, res) {
  const { id } = req.params;
  const { note } = req.body;

  try {
    const targetOrder = getOrderById(id);
    if (!targetOrder) return res.status(404).json({ message: "Order not found." });

    if (req.user?.cafeteriaId && req.user.cafeteriaId !== "all") {
      if (targetOrder.cafeteriaId.toLowerCase() !== req.user.cafeteriaId.toLowerCase()) {
        return res.status(403).json({
          message: `Access denied. This order belongs to ${targetOrder.cafeteriaName || targetOrder.cafeteriaId}. You cannot process refunds for other cafeterias.`,
        });
      }
    }

    const refunded = processAdminRefund(id, note);
    return res.json({
      message: `Refund of ৳${refunded.total} processed successfully for order #${refunded.tokenNumber}! Returned to customer ${refunded.paymentMethod.toUpperCase()} (${refunded.mobileNumber}).`,
      order: refunded,
    });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Failed to process refund." });
  }
}
