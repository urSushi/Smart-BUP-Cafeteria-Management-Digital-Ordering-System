import { verifyAndCollectPickup, getOrderByToken, getOrderById } from "../models/Order.js";

export function verifyPickup(req, res) {
  let { tokenOrQr, cafeteriaId } = req.body;
  if (!tokenOrQr) {
    return res.status(400).json({ message: "Please scan a QR code or enter a pickup token number." });
  }

  // Strict Canteen Isolation: If staff or manager is authenticated, enforce their assigned canteen
  if (req.user?.cafeteriaId && req.user.cafeteriaId !== "all") {
    if (cafeteriaId && cafeteriaId.toLowerCase() !== req.user.cafeteriaId.toLowerCase()) {
      return res.status(403).json({
        message: `Access denied. Privacy violation: You cannot verify order tokens for other canteens (${cafeteriaId}).`,
      });
    }
    cafeteriaId = req.user.cafeteriaId;
  }

  try {
    const result = verifyAndCollectPickup(tokenOrQr, cafeteriaId);
    return res.json(result);
  } catch (err) {
    return res.status(409).json({ message: err.message });
  }
}

export function inspectToken(req, res) {
  const { token } = req.params;
  const order = getOrderByToken(token) || getOrderById(token);
  if (!order) return res.status(404).json({ message: "Token not found." });

  return res.json({
    tokenNumber: order.tokenNumber,
    orderId: order.id,
    cafeteriaName: order.cafeteriaName,
    userFullName: order.userFullName,
    orderStatus: order.orderStatus,
    isCollected: order.isCollected,
    collectedAt: order.collectedAt,
    items: order.items,
    total: order.total,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
  });
}
