import {
  getMenuItemsByCafeteria,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../models/MenuItem.js";

export function getMenu(req, res) {
  const { cafeteriaId } = req.query;
  const items = getMenuItemsByCafeteria(cafeteriaId);
  return res.json(items);
}

export function getItem(req, res) {
  const { id } = req.params;
  const item = getMenuItemById(id);
  if (!item) return res.status(404).json({ message: "Item not found." });
  return res.json(item);
}

export function addItem(req, res) {
  let { cafeteriaId, name, price, category } = req.body;

  // Strict Canteen Isolation: Manager/staff can only add dishes for their own cafeteria
  if (req.user?.cafeteriaId && req.user.cafeteriaId !== "all") {
    if (cafeteriaId && cafeteriaId.toLowerCase() !== req.user.cafeteriaId.toLowerCase()) {
      return res.status(403).json({
        message: `Access denied. Privacy violation: You can only add menu items for your assigned cafeteria (${req.user.cafeteriaId}).`,
      });
    }
    cafeteriaId = req.user.cafeteriaId;
    req.body.cafeteriaId = req.user.cafeteriaId;
  }

  if (!cafeteriaId || !name || !price) {
    return res.status(400).json({ message: "Cafeteria, name, and price are required." });
  }
  const newItem = createMenuItem(req.body);
  return res.status(201).json({ message: "Menu item created.", item: newItem });
}

export function editItem(req, res) {
  const { id } = req.params;
  const existing = getMenuItemById(id);
  if (!existing) return res.status(404).json({ message: "Item not found." });

  // Strict Canteen Isolation
  if (req.user?.cafeteriaId && req.user.cafeteriaId !== "all") {
    if (existing.cafeteriaId && existing.cafeteriaId.toLowerCase() !== req.user.cafeteriaId.toLowerCase()) {
      return res.status(403).json({
        message: `Access denied. Privacy violation: This dish belongs to ${existing.cafeteriaId}, not your assigned counter (${req.user.cafeteriaId}).`,
      });
    }
  }

  const updated = updateMenuItem(id, req.body);
  if (!updated) return res.status(404).json({ message: "Item not found." });
  return res.json({ message: "Menu item updated.", item: updated });
}

export function removeItem(req, res) {
  const { id } = req.params;
  const existing = getMenuItemById(id);
  if (!existing) return res.status(404).json({ message: "Item not found." });

  // Strict Canteen Isolation
  if (req.user?.cafeteriaId && req.user.cafeteriaId !== "all") {
    if (existing.cafeteriaId && existing.cafeteriaId.toLowerCase() !== req.user.cafeteriaId.toLowerCase()) {
      return res.status(403).json({
        message: `Access denied. Privacy violation: This dish belongs to ${existing.cafeteriaId}, not your assigned counter (${req.user.cafeteriaId}).`,
      });
    }
  }

  const ok = deleteMenuItem(id);
  if (!ok) return res.status(404).json({ message: "Item not found." });
  return res.json({ message: "Menu item deleted." });
}

export function toggleAvailability(req, res) {
  const { id } = req.params;
  const item = getMenuItemById(id);
  if (!item) return res.status(404).json({ message: "Item not found." });

  // Strict Canteen Isolation
  if (req.user?.cafeteriaId && req.user.cafeteriaId !== "all") {
    if (item.cafeteriaId && item.cafeteriaId.toLowerCase() !== req.user.cafeteriaId.toLowerCase()) {
      return res.status(403).json({
        message: `Access denied. Privacy violation: This dish belongs to ${item.cafeteriaId}, not your assigned counter (${req.user.cafeteriaId}).`,
      });
    }
  }

  item.isAvailable = !item.isAvailable;
  return res.json({ message: `Item is now ${item.isAvailable ? "available" : "unavailable"}.`, item });
}
