import {
  getMenuItemsByCafeteria,
  getMenuItemById,
  updateMenuItem,
  getLowStockAlerts,
} from "../models/MenuItem.js";

export function getInventory(req, res) {
  let { cafeteriaId } = req.query;

  // Strict Canteen Isolation: If requester is a staff or manager, enforce their cafeteriaId
  if (req.user?.cafeteriaId && req.user.cafeteriaId !== "all") {
    if (cafeteriaId && cafeteriaId !== "all" && cafeteriaId.toLowerCase() !== req.user.cafeteriaId.toLowerCase()) {
      return res.status(403).json({
        message: `Access denied. Privacy violation: You cannot access inventory for other cafeterias (${cafeteriaId}).`,
      });
    }
    cafeteriaId = req.user.cafeteriaId;
  }

  const items = getMenuItemsByCafeteria(cafeteriaId);
  return res.json(
    items.map((i) => ({
      id: i.id,
      name: i.name,
      cafeteriaId: i.cafeteriaId,
      category: i.category,
      price: i.price,
      stockQuantity: i.stockQuantity,
      lowStockThreshold: i.lowStockThreshold,
      isAvailable: i.isAvailable,
      isLowStock: i.stockQuantity <= i.lowStockThreshold && i.stockQuantity > 0,
      isOutOfStock: i.stockQuantity === 0,
    }))
  );
}

export function updateStock(req, res) {
  const { id } = req.params;
  const { stockQuantity } = req.body;
  if (stockQuantity === undefined || Number.isNaN(Number(stockQuantity))) {
    return res.status(400).json({ message: "Valid stockQuantity is required." });
  }

  const existing = getMenuItemById(id);
  if (!existing) return res.status(404).json({ message: "Item not found." });

  // Strict Canteen Isolation: cannot alter stock of another cafeteria
  if (req.user?.cafeteriaId && req.user.cafeteriaId !== "all") {
    if (existing.cafeteriaId && existing.cafeteriaId.toLowerCase() !== req.user.cafeteriaId.toLowerCase()) {
      return res.status(403).json({
        message: `Access denied. Privacy violation: This inventory item belongs to ${existing.cafeteriaId}, not your assigned counter (${req.user.cafeteriaId}).`,
      });
    }
  }

  const updated = updateMenuItem(id, { stockQuantity: Number(stockQuantity) });
  if (!updated) return res.status(404).json({ message: "Item not found." });

  return res.json({
    message: `Stock updated for ${updated.name} to ${updated.stockQuantity}.`,
    item: updated,
  });
}

export function setThreshold(req, res) {
  const { id } = req.params;
  const { lowStockThreshold } = req.body;
  if (lowStockThreshold === undefined || Number.isNaN(Number(lowStockThreshold))) {
    return res.status(400).json({ message: "Valid lowStockThreshold is required." });
  }

  const existing = getMenuItemById(id);
  if (!existing) return res.status(404).json({ message: "Item not found." });

  // Strict Canteen Isolation
  if (req.user?.cafeteriaId && req.user.cafeteriaId !== "all") {
    if (existing.cafeteriaId && existing.cafeteriaId.toLowerCase() !== req.user.cafeteriaId.toLowerCase()) {
      return res.status(403).json({
        message: `Access denied. Privacy violation: This inventory item belongs to ${existing.cafeteriaId}, not your assigned counter (${req.user.cafeteriaId}).`,
      });
    }
  }

  const updated = updateMenuItem(id, { lowStockThreshold: Number(lowStockThreshold) });
  if (!updated) return res.status(404).json({ message: "Item not found." });

  return res.json({
    message: `Low stock threshold for ${updated.name} set to ${updated.lowStockThreshold}.`,
    item: updated,
  });
}

export function getAlerts(req, res) {
  let { cafeteriaId } = req.query;

  // Strict Canteen Isolation
  if (req.user?.cafeteriaId && req.user.cafeteriaId !== "all") {
    if (cafeteriaId && cafeteriaId !== "all" && cafeteriaId.toLowerCase() !== req.user.cafeteriaId.toLowerCase()) {
      return res.status(403).json({
        message: `Access denied. Privacy violation: You cannot access low-stock alerts for other cafeterias (${cafeteriaId}).`,
      });
    }
    cafeteriaId = req.user.cafeteriaId;
  }

  const alerts = getLowStockAlerts(cafeteriaId);
  return res.json({
    count: alerts.length,
    alerts,
  });
}
