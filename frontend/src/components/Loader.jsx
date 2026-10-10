import React from "react";

/** Inline spinner — pass `dark` when placing it on a light background. */
export function Spinner({ dark = false }) {
  return <span className={`spinner ${dark ? "spinner-dark" : ""}`} aria-label="Loading" />;
}

/** Skeleton block — set width/height via style or className for the shape you need. */
export function Skeleton({ style, className = "" }) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

/** Skeleton stand-in for an <InfoCard> while landing-page data is loading. */
export function InfoCardSkeleton() {
  return (
    <div className="card info-card">
      <Skeleton style={{ height: 12, width: "60%", marginBottom: 10 }} />
      <Skeleton style={{ height: 22, width: "80%", marginBottom: 8 }} />
      <Skeleton style={{ height: 10, width: "40%" }} />
    </div>
  );
}

/** Skeleton stand-in for a <CafeteriaCard> while cafeteria data is loading. */
export function CafeteriaCardSkeleton() {
  return (
    <div className="card cafeteria-card">
      <Skeleton style={{ height: 190, borderRadius: 0 }} />
      <div className="cafeteria-body">
        <Skeleton style={{ height: 18, width: "50%", marginBottom: 12 }} />
        <Skeleton style={{ height: 12, width: "70%", marginBottom: 16 }} />
        <Skeleton style={{ height: 38, width: "100%" }} />
      </div>
    </div>
  );
}

export default Spinner;
