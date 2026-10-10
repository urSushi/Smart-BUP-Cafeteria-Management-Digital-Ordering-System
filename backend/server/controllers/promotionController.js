import {
  getAllPromotions,
  validatePromotion,
  createPromotion,
  togglePromotion,
} from "../models/Promotion.js";

export function listPromotions(req, res) {
  const promos = getAllPromotions();
  return res.json(promos);
}

export function validate(req, res) {
  const { code, subtotal, cafeteriaId } = req.body;
  if (!code) return res.status(400).json({ message: "Promo code is required." });

  const result = validatePromotion(code, Number(subtotal) || 0, cafeteriaId);
  if (!result.valid) {
    return res.status(400).json({ message: result.message, valid: false });
  }

  return res.json(result);
}

export function addPromotion(req, res) {
  const { code, value, type } = req.body;
  if (!code || !value) {
    return res.status(400).json({ message: "Code and discount value are required." });
  }

  const promo = createPromotion(req.body);
  return res.status(201).json({ message: "Promotion created.", promo });
}

export function toggle(req, res) {
  const { code } = req.params;
  const promo = togglePromotion(code);
  if (!promo) return res.status(404).json({ message: "Promo code not found." });
  return res.json({ message: `Promotion ${promo.code} is now ${promo.active ? "active" : "inactive"}.`, promo });
}
