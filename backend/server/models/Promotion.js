// Promotions & Coupons Model for Smart BUP Cafeteria Management System (SBCMS)
// Supports FR-19 (University Admin promotion management)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PERSISTENT_FILE = path.resolve(__dirname, "../../database/persistent_promotions.json");

const DEFAULT_PROMOTIONS = [
  {
    code: "BUP20",
    description: "20% off on all campus cafeteria orders",
    type: "percent",
    value: 20,
    minOrder: 100,
    maxDiscount: 60,
    active: true,
    cafeteriaId: null, // all cafeterias
    expiresAt: "2026-12-31T23:59:59Z",
  },
  {
    code: "WELCOME50",
    description: "৳50 Flat discount for new semester",
    type: "flat",
    value: 50,
    minOrder: 150,
    maxDiscount: 50,
    active: true,
    cafeteriaId: null,
    expiresAt: "2026-12-31T23:59:59Z",
  },
  {
    code: "VISTA10",
    description: "10% off exclusive at Vista Cafe",
    type: "percent",
    value: 10,
    minOrder: 80,
    maxDiscount: 40,
    active: true,
    cafeteriaId: "vista",
    expiresAt: "2026-12-31T23:59:59Z",
  },
];

function loadPersistentPromotions() {
  try {
    if (fs.existsSync(PERSISTENT_FILE)) {
      const raw = fs.readFileSync(PERSISTENT_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[Promotion DB] Warning reading persistent_promotions.json:", err.message);
  }
  savePersistentPromotionsToFile(DEFAULT_PROMOTIONS);
  return [...DEFAULT_PROMOTIONS];
}

function savePersistentPromotionsToFile(list) {
  try {
    fs.writeFileSync(PERSISTENT_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.warn("[Promotion DB] Warning saving persistent_promotions.json:", err.message);
  }
}

let promotions = loadPersistentPromotions();

export function getAllPromotions() {
  return promotions;
}

export function findPromotionByCode(code) {
  if (!code) return null;
  return promotions.find((p) => p.code.toUpperCase() === code.trim().toUpperCase()) || null;
}

export function validatePromotion(code, subtotal, cafeteriaId) {
  const promo = findPromotionByCode(code);
  if (!promo || !promo.active) {
    return { valid: false, message: "Invalid or inactive promo code." };
  }
  if (promo.expiresAt && new Date() > new Date(promo.expiresAt)) {
    return { valid: false, message: "This coupon code has expired." };
  }
  if (promo.cafeteriaId && promo.cafeteriaId.toLowerCase() !== cafeteriaId?.toLowerCase()) {
    return { valid: false, message: `This coupon is only valid for ${promo.cafeteriaId}.` };
  }
  if (promo.minOrder && subtotal < promo.minOrder) {
    return { valid: false, message: `Minimum order amount of ৳${promo.minOrder} required for this coupon.` };
  }

  let discount = 0;
  if (promo.type === "percent") {
    discount = Math.round((subtotal * promo.value) / 100);
    if (promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount);
  } else if (promo.type === "flat") {
    discount = Math.min(promo.value, subtotal);
  }

  return { valid: true, discount, promo, message: `Applied coupon ${promo.code}: Saved ৳${discount}!` };
}

export function createPromotion(data) {
  const newPromo = {
    code: data.code.toUpperCase().trim(),
    description: data.description || "",
    type: data.type || "percent",
    value: Number(data.value),
    minOrder: Number(data.minOrder) || 0,
    maxDiscount: Number(data.maxDiscount) || 100,
    active: data.active ?? true,
    cafeteriaId: data.cafeteriaId || null,
    expiresAt: data.expiresAt || "2026-12-31T23:59:59Z",
  };
  promotions.push(newPromo);
  savePersistentPromotionsToFile(promotions);
  return newPromo;
}

export function togglePromotion(code) {
  const promo = findPromotionByCode(code);
  if (!promo) return null;
  promo.active = !promo.active;
  savePersistentPromotionsToFile(promotions);
  return promo;
}
