import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "./Icons.jsx";
import CafeteriaDetailModal from "./CafeteriaDetailModal.jsx";

export default function CafeteriaCard({ cafeteria }) {
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  const {
    id,
    name,
    tagline,
    building,
    floor,
    image,
    isOpen,
    queueMinutes,
    crowdLevel,
    rating = 4.8,
    popularItems = [],
  } = cafeteria;

  function handleNavigateToMenu() {
    navigate(`/cafeteria/${id}`);
  }

  return (
    <>
      <div
        className={`card cafeteria-card ${!isOpen ? "is-closed" : ""}`}
        onClick={handleNavigateToMenu}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleNavigateToMenu();
          }
        }}
      >
        <div className="cafeteria-media">
          <img src={image} alt={`${name} cafeteria`} loading="lazy" />
          <div className="cafeteria-badges">
            <span className={`badge ${isOpen ? "badge-open" : "badge-closed"}`}>
              {isOpen ? (
                <>
                  <span className="pulse-dot" />
                  <span>Open Now</span>
                </>
              ) : (
                <>
                  <span className="closed-dot" />
                  <span>Closed</span>
                </>
              )}
            </span>

            {isOpen && (
              <span className={`queue-badge ${queueMinutes <= 5 ? "queue-fast" : "queue-moderate"}`}>
                <Icon name="clock" size={13} />
                <span>~{queueMinutes} min wait</span>
              </span>
            )}
          </div>
        </div>

        <div className="cafeteria-body">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <h3 style={{ margin: "0 0 2px" }}>{name}</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: "0.85rem", fontWeight: 700, color: "var(--mustard-dark)" }}>
              <Icon name="star" size={14} color="var(--mustard-dark)" />
              <span>{rating}</span>
            </div>
          </div>

          <p className="cafeteria-location">
            <Icon name="mapPin" size={14} color="var(--teal)" />
            <span>{building} · {floor}</span>
          </p>

          {tagline && (
            <p className="cafeteria-tagline">{tagline}</p>
          )}

          {popularItems.length > 0 && (
            <div className="cafeteria-preview-item">
              <span className="preview-label">Popular Today:</span>
              <span className="preview-name">{popularItems[0].name} (৳{popularItems[0].price})</span>
            </div>
          )}

          <div className="cafeteria-card-footer">
            <span className="crowd-status">
              Status: <strong style={{ color: isOpen ? "var(--teal-dark)" : "var(--brick)" }}>
                {isOpen ? `${crowdLevel} Rush` : "Reopens Later"}
              </strong>
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setModalOpen(true);
                }}
              >
                Quick Info
              </button>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigateToMenu();
                }}
              >
                <span>View Menu</span>
                <Icon name="chevronRight" size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <CafeteriaDetailModal
        cafeteria={cafeteria}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onOpenMenu={handleNavigateToMenu}
      />
    </>
  );
}
