import React, { useState, useEffect } from "react";
import { apiService } from "../services/apiService.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import Icon from "./Icons.jsx";
import { Spinner } from "./Loader.jsx";

const CAFETERIA_OPTIONS = [
  { id: "vista", name: "Vista Cafe" },
  { id: "amitie", name: "Cafeteria Amitie" },
  { id: "pitstop", name: "Pitstop Cafeteria" },
  { id: "thirdplace", name: "The Third Place" },
  { id: "system", name: "Overall Campus Dining Experience" },
];

export default function ReviewModal({
  order = null,
  cafeteriaId = null,
  cafeteriaName = null,
  isOpen,
  onClose,
  onReviewSubmitted,
}) {
  const { user } = useAuth();
  const toast = useToast();

  const isOrderSpecific = Boolean(order && order.id && order.items && order.items.length > 0);

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedCafeteria, setSelectedCafeteria] = useState("vista");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [customDish, setCustomDish] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRating(5);
      setHoverRating(0);
      setComment("");
      setCustomDish("");
      if (order?.cafeteriaId) {
        setSelectedCafeteria(order.cafeteriaId);
      } else if (cafeteriaId) {
        setSelectedCafeteria(cafeteriaId);
      } else {
        setSelectedCafeteria("vista");
      }

      if (order?.items?.[0]?.id) {
        setSelectedItemId(order.items[0].id);
      } else {
        setSelectedItemId("");
      }
    }
  }, [isOpen, order, cafeteriaId]);

  if (!isOpen) return null;

  const selectedItem = isOrderSpecific
    ? order.items.find((i) => i.id === selectedItemId) || order.items[0]
    : null;

  const resolvedCafeteriaName = isOrderSpecific
    ? order.cafeteriaName
    : cafeteriaName ||
      CAFETERIA_OPTIONS.find((c) => c.id === selectedCafeteria)?.name ||
      "BUP Campus Dining";

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const targetCafeteriaId = isOrderSpecific
      ? order.cafeteriaId
      : selectedCafeteria;

    const targetItemName = isOrderSpecific
      ? selectedItem?.name || "Cafeteria Meal"
      : customDish.trim() || "Campus Dining Experience";

    try {
      await apiService.addReview({
        orderId: isOrderSpecific ? order.id : null,
        cafeteriaId: targetCafeteriaId,
        menuItemId: isOrderSpecific ? selectedItem?.id || null : null,
        itemName: targetItemName,
        rating,
        comment: comment.trim(),
      });
    } catch (err) {
      // In case server is offline or mock mode, log warning but continue local save
      console.warn("Backend review submission notice:", err);
    }

    // Persist to localStorage so reviews immediately appear in testimonials wall
    try {
      const userReview = {
        id: `rev-${Date.now()}`,
        orderId: isOrderSpecific ? order.id : null,
        cafeteriaId: targetCafeteriaId,
        cafeteriaName: resolvedCafeteriaName,
        itemName: targetItemName,
        rating,
        quote: comment.trim() || `Rated ${rating} stars for ${resolvedCafeteriaName}!`,
        author: user?.fullName || "BUP Student",
        role: user?.department
          ? `${(user?.role || "Student").toUpperCase()} · ${user.department}`
          : user?.role
          ? user.role.toUpperCase()
          : "BUP Campus Member",
        avatar: (user?.fullName || "U").charAt(0).toUpperCase(),
        createdAt: new Date().toISOString(),
      };

      const saved = JSON.parse(localStorage.getItem("sbcms_user_reviews") || "[]");
      localStorage.setItem("sbcms_user_reviews", JSON.stringify([userReview, ...saved]));
    } catch (localErr) {
      console.warn("Could not cache review locally:", localErr);
    }

    toast.success("Thank you! Your feedback helps improve campus dining.");
    setLoading(false);
    onClose();
    if (onReviewSubmitted) onReviewSubmitted();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card card review-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="badge badge-open">
              {isOrderSpecific ? "Order Experience Feedback" : "Campus Dining Review"}
            </span>
            <h2 style={{ margin: "4px 0 2px", fontSize: "1.3rem" }}>
              {isOrderSpecific ? "Rate Your Meal" : "Drop a Review"}
            </h2>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--ink-soft)" }}>
              {isOrderSpecific
                ? `${order.cafeteriaName} · Order #${order.tokenNumber}`
                : "Share your rating and feedback to help improve university cafeterias"}
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: 14 }}>
          {/* If General Review: Cafeteria Selector */}
          {!isOrderSpecific && (
            <div className="field">
              <label>Select Cafeteria / Facility</label>
              <select
                className="select"
                value={selectedCafeteria}
                onChange={(e) => setSelectedCafeteria(e.target.value)}
              >
                {CAFETERIA_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* If General Review: Optional Meal / Item Name */}
          {!isOrderSpecific && (
            <div className="field">
              <label>Dish or Item Enjoyed (Optional)</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Crispy Chicken Burger, Tehari, Masala Chai..."
                value={customDish}
                onChange={(e) => setCustomDish(e.target.value)}
              />
            </div>
          )}

          {/* If Order Specific & Multiple Items: Item Selector */}
          {isOrderSpecific && order.items.length > 1 && (
            <div className="field">
              <label>Select Item to Rate</label>
              <select
                className="select"
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
              >
                {order.items.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Star selector */}
          <div style={{ textAlign: "center", margin: "16px 0" }}>
            <div style={{ display: "inline-flex", gap: 8 }}>
              {[1, 2, 3, 4, 5].map((star) => {
                const isLit = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 4,
                      transform: isLit ? "scale(1.15)" : "scale(1)",
                      transition: "transform 0.15s ease",
                    }}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    aria-label={`${star} star`}
                  >
                    <Icon
                      name="star"
                      size={32}
                      color={isLit ? "var(--mustard)" : "#d1d5db"}
                    />
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 6, fontWeight: 700, color: "var(--ink)" }}>
              {rating === 5
                ? "5 Stars · Outstanding!"
                : rating === 4
                ? "4 Stars · Very Good"
                : rating === 3
                ? "3 Stars · Average"
                : rating === 2
                ? "2 Stars · Needs Improvement"
                : "1 Star · Unsatisfactory"}
            </div>
          </div>

          <div className="field">
            <label>Feedback & Comments</label>
            <textarea
              className="input"
              rows={3}
              placeholder="How was the food temperature, flavor, hygiene, and counter speed? Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-mustard btn-block btn-lg"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? <Spinner dark /> : "Submit Rating & Review"}
          </button>
        </form>
      </div>
    </div>
  );
}
