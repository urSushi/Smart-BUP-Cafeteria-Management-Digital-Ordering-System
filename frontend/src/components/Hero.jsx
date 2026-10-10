import React from "react";
import { Link } from "react-router-dom";
import Icon from "./Icons.jsx";
import vistaImg from "../assets/cafeterias/vista.jpg";
import amitieImg from "../assets/cafeterias/amitie.jpg";

export default function Hero({ cafeterias = [] }) {
  const amitie = cafeterias.find((c) => c.id === "amitie");
  const openList = cafeterias.filter((c) => c.isOpen);
  const fastest = openList.length > 0
    ? [...openList].sort((a, b) => a.queueMinutes - b.queueMinutes)[0]
    : cafeterias.find((c) => c.id === "vista") || cafeterias[0];

  const amitieOpen = amitie ? amitie.isOpen : true;
  const amitieQueue = amitie?.queueMinutes ?? 12;
  const amitieCrowd = amitie?.crowdLevel || "Peak Rush";

  return (
    <section className="hero">
      <div className="hero-bg" aria-hidden="true" />
      <div className="container hero-grid">
        <div className="hero-text-content">
          <div className="hero-eyebrow">
            <span className="live-pulse" />
            <span>4 Campus Cafeterias Live & Synced</span>
          </div>

          <h1 className="hero-heading">
            Skip The Queue, <br />
            <span className="gradient-text">Dine Smarter</span> on Campus.
          </h1>

          <p className="hero-lead">
            Real-time queue tracking, live kitchen-synced menus, and zero-wait pickup.
            Order from class, pick up when it's hot — designed for students, faculty & staff.
          </p>

          <div className="hero-actions">
            <a href="#cafeterias" className="btn btn-primary btn-lg">
              <Icon name="search" size={17} />
              <span>Explore Cafeterias</span>
            </a>
            <Link to="/login" className="btn btn-secondary btn-lg">
              <Icon name="user" size={17} />
              <span>University Login</span>
            </Link>
            <Link to="/guest" className="btn btn-mustard btn-lg">
              <Icon name="shield" size={16} />
              <span>Guest Pass</span>
            </Link>
          </div>

          <div className="hero-highlights">
            <div className="highlight-item">
              <Icon name="clock" size={15} color="var(--teal)" />
              <span>Avg. {fastest?.queueMinutes || 6} min queue</span>
            </div>
            <div className="highlight-item">
              <Icon name="utensils" size={15} color="var(--mustard-dark)" />
              <span>380+ Meals Served Today</span>
            </div>
            <div className="highlight-item">
              <Icon name="checkCircle" size={15} color="var(--teal)" />
              <span>Verified Campus ID</span>
            </div>
          </div>
        </div>

        {/* Dynamic interactive visual showcase */}
        <div className="hero-showcase">
          <div className="hero-ambient-orb" aria-hidden="true" />
          <div className="hero-card-floating hero-card-main">
            <div className="hero-card-img-wrap">
              <img src={amitie?.image || amitieImg} alt="Amitie Cafeteria" className="hero-card-img" />
              {amitieOpen ? (
                <div className="hero-badge-open">
                  <span className="pulse-dot" />
                  <span>Open · {amitieCrowd}</span>
                </div>
              ) : (
                <div className="hero-badge-closed">
                  <span className="closed-dot" />
                  <span>Closed · Offline</span>
                </div>
              )}
            </div>
            <div className="hero-card-body">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="hero-card-tag">{amitie?.name || "Amitie Cafeteria"}</span>
                <span className="hero-card-time" style={{ color: amitieOpen ? "var(--mustard-dark)" : "#ef4444" }}>
                  {amitieOpen ? `~${amitieQueue} min wait` : "Closed"}
                </span>
              </div>
              <h4 style={{ margin: "4px 0 2px", fontSize: "1.05rem" }}>Morog Polao & Juices</h4>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--ink-soft)" }}>
                FBS Building · Ground Floor {amitieOpen ? "" : "(Offline)"}
              </p>
            </div>
          </div>

          <div className="hero-card-floating hero-card-sub">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img
                src={fastest?.image || vistaImg}
                alt={fastest?.name || "Vista"}
                style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover" }}
              />
              <div>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--teal-dark)", textTransform: "uppercase" }}>
                  {openList.length > 0 ? "Fastest Queue Right Now" : "Campus Notice"}
                </span>
                <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                  {openList.length > 0 ? fastest?.name : "All Cafeterias Paused"}
                </div>
                <span style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
                  {openList.length > 0 ? `~${fastest?.queueMinutes} min queue time` : "Kitchen service closed"}
                </span>
              </div>
            </div>
          </div>

          <div className="hero-card-floating hero-card-pill">
            <div className="live-order-indicator">
              <span className="pulse-dot" />
              <div>
                <span style={{ fontSize: "0.72rem", color: "var(--teal-dark)", fontWeight: 700 }}>LIVE PICKUP READY</span>
                <div style={{ fontSize: "0.82rem", fontWeight: 600 }}>Order #SU-9281 @ Express Counter</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
