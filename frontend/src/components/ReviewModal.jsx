import React, { useState } from "react";
import { apiService } from "../services/apiService.js";
import { useToast } from "../context/ToastContext.jsx";
import Icon from "./Icons.jsx";
import { Spinner } from "./Loader.jsx";

export default function ReviewModal({ order, isOpen, onClose, onReviewSubmitted }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedItemId, setSelectedItemId] = useState(order?.items?.[0]?.id || "");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  if (!isOpen || !order) return null;

  const selectedItem = order.items.find((i) => i.id === selectedItemId) || order.items[0];

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiService.addReview({
        orderId: order.id,
        cafeteriaId: order.cafeteriaId,
        menuItemId: selectedItem?.id || null,
        itemName: selectedItem?.name || "Cafeteria Meal",
        rating,
        comment: comment.trim(),
      });
      toast.success("Thank you! Your feedback helps improve campus dining.");
      onClose();
      if (onReviewSubmitted) onReviewSubmitted();
    } catch (err) {
      toast.error(err.message || "Could not submit review.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card card review-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="badge badge-open">Student Experience Feedback</span>
            <h2 style={{ margin: "4px 0 2px", fontSize: "1.3rem" }}>Rate Your Meal</h2>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--ink-soft)" }}>
              {order.cafeteriaName} · Order #{order.tokenNumber}
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: 14 }}>
          {/* Select which item to rate if multiple */}
          {order.items.length > 1 && (
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
              placeholder="How was the food temperature, flavor, and pickup speed? Share your thoughts..."
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
