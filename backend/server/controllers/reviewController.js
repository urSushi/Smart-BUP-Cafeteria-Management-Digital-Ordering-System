import { createReview, getReviewsByCafeteria, getReviewsByMenuItem } from "../models/Review.js";

export function addReview(req, res) {
  const { cafeteriaId, menuItemId, itemName, rating, comment, orderId } = req.body;

  if (!cafeteriaId || !rating) {
    return res.status(400).json({ message: "Cafeteria ID and rating (1-5) are required." });
  }

  const review = createReview({
    orderId,
    cafeteriaId,
    menuItemId,
    itemName,
    rating,
    comment,
    userId: req.user?.id || 1,
    userName: req.user?.fullName || "BUP Student",
  });

  return res.status(201).json({
    message: "Thank you for your rating and feedback!",
    review,
  });
}

export function getByCafeteria(req, res) {
  const { cafeteriaId } = req.params;
  const list = getReviewsByCafeteria(cafeteriaId);
  return res.json(list);
}

export function getByItem(req, res) {
  const { itemId } = req.params;
  const list = getReviewsByMenuItem(itemId);
  return res.json(list);
}
