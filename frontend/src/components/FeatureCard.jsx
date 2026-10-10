import React from "react";
import Icon from "./Icons.jsx";

export default function FeatureCard({ icon, title, desc }) {
  return (
    <div className="card feature-card">
      <div className="feature-icon" aria-hidden="true">
        {typeof icon === "string" && (icon.length > 2 || ["zap", "utensils", "clock", "shield", "coffee", "sparkles"].includes(icon)) ? (
          <Icon name={icon} size={22} color="var(--teal-dark)" />
        ) : (
          icon
        )}
      </div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}
