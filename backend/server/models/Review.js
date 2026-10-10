// Review & Rating Model for Smart BUP Cafeteria Management System (SBCMS)
// Supports FR-16 (Student ratings and reviews)

import { getCafeteriaById } from "./Cafeteria.js";
import { getMenuItemById } from "./MenuItem.js";

let reviews = [
  {
    id: "rev-1",
    orderId: "ORD-9281",
    cafeteriaId: "vista",
    menuItemId: "item-vis-1",
    itemName: "Crispy Chicken Burger",
    userId: 1,
    userName: "Sarah Rahman",
    rating: 5,
    comment: "The chicken was super crispy and freshly made! Fast pickup too.",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "rev-2",
    orderId: "ORD-9104",
    cafeteriaId: "amitie",
    menuItemId: "item-amt-6",
    itemName: "Chicken Tehari",
    userId: 1,
    userName: "Sarah Rahman",
    rating: 5,
    comment: "Best value Chicken Tehari on campus without a doubt. Very flavorful, hot, and filling.",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "rev-3",
    orderId: "ORD-8832",
    cafeteriaId: "pitstop",
    menuItemId: "item-pst-2",
    itemName: "Crispy Fried Chicken",
    userId: 2,
    userName: "Dr. Tanvir Ahmed",
    rating: 5,
    comment: "Great quick lunch between lectures. Crispy, hot, and flavorful chicken!",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

export function getReviewsByCafeteria(cafeteriaId) {
  if (!cafeteriaId) return reviews;
  return reviews.filter((r) => r.cafeteriaId.toLowerCase() === cafeteriaId.toLowerCase());
}

export function getReviewsByMenuItem(menuItemId) {
  if (!menuItemId) return [];
  return reviews.filter((r) => r.menuItemId === menuItemId);
}

export function createReview(data) {
  const newReview = {
    id: `rev-${Date.now()}`,
    orderId: data.orderId || null,
    cafeteriaId: data.cafeteriaId,
    menuItemId: data.menuItemId || null,
    itemName: data.itemName || "Meal Item",
    userId: data.userId || null,
    userName: data.userName || "Campus Student",
    rating: Math.min(5, Math.max(1, Number(data.rating))),
    comment: data.comment || "",
    createdAt: new Date().toISOString(),
  };

  reviews.unshift(newReview);

  // Recalculate average rating for cafeteria if applicable
  const caf = getCafeteriaById(data.cafeteriaId);
  if (caf) {
    const cafReviews = reviews.filter((r) => r.cafeteriaId === data.cafeteriaId);
    const avg = cafReviews.reduce((sum, r) => sum + r.rating, 0) / cafReviews.length;
    caf.rating = Number(avg.toFixed(1));
    caf.reviewsCount = cafReviews.length;
  }

  // Recalculate rating for menu item if applicable
  if (data.menuItemId) {
    const item = getMenuItemById(data.menuItemId);
    if (item) {
      const itemReviews = reviews.filter((r) => r.menuItemId === data.menuItemId);
      const avg = itemReviews.reduce((sum, r) => sum + r.rating, 0) / itemReviews.length;
      item.rating = Number(avg.toFixed(1));
      item.reviewsCount = itemReviews.length;
    }
  }

  return newReview;
}
