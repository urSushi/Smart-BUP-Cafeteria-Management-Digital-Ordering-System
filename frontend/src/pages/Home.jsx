import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import CafeteriaCard from "../components/CafeteriaCard.jsx";
import { CafeteriaCardSkeleton } from "../components/Loader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import Icon from "../components/Icons.jsx";
import OrdersModal from "../components/OrdersModal.jsx";
import { useLiveCafeterias } from "../utils/liveCafeterias.js";
import { TESTIMONIALS } from "../data/cafeterias.js";
import ReviewModal from "../components/ReviewModal.jsx";

export default function Home() {
  const { user, role, authenticated } = useAuth();
  const { cafeterias, loading: cafeteriasLoading } = useLiveCafeterias(4000);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [ordersTab, setOrdersTab] = useState("orders");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewsRevision, setReviewsRevision] = useState(0);

  const userReviews = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("sbcms_user_reviews") || "[]");
    } catch (e) {
      return [];
    }
  }, [reviewsRevision]);

  const allTestimonials = useMemo(() => {
    return [...userReviews, ...TESTIMONIALS];
  }, [userReviews]);

  useEffect(() => {
    const t = setTimeout(() => setInitialLoading(false), 350);
    return () => clearTimeout(t);
  }, []);

  const loading = initialLoading && cafeteriasLoading;

  const filteredCafeterias = useMemo(() => {
    return cafeterias.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.building.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.cuisine.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.popularItems?.some((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;
      if (filterType === "open") return c.isOpen;
      if (filterType === "fast") return c.isOpen && c.queueMinutes <= 6;
      return true;
    });
  }, [cafeterias, searchQuery, filterType]);

  const [bdTime, setBdTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setBdTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    // Exact hour in Bangladesh Standard Time (BST, UTC+6)
    const bdHour = parseInt(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Dhaka",
        hour: "numeric",
        hourCycle: "h23",
      }).format(bdTime),
      10
    );

    // Bangladesh Standard Time categories:
    // 05:00 - 11:59 -> Morning ("Good morning")
    // 12:00 - 16:59 -> Afternoon ("Good afternoon")
    // 17:00 - 04:59 -> Evening / Night ("Good evening")
    if (bdHour >= 5 && bdHour < 12) return "Good morning";
    if (bdHour >= 12 && bdHour < 17) return "Good afternoon";
    return "Good evening";
  };

  const bdTimeFormatted = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(bdTime);

  const firstName = user?.fullName ? user.fullName.split(" ")[0] : "Campus Member";

  return (
    <>
      <Navbar />

      <main className="home-dashboard">
        <div className="container">
          {/* Operational Role Banner if Staff/Manager/Admin */}
          {["cafeteria_staff", "cafeteria_manager", "admin"].includes(role) && (
            <div className={`operational-banner op-banner-${role}`}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Icon name="shield" size={18} />
                <div>
                  <strong>
                    {role === "cafeteria_staff"
                      ? "Staff Kitchen Display Mode"
                      : role === "cafeteria_manager"
                      ? "Cafeteria Operations & Manager Console"
                      : "System Administrator View"}
                  </strong>
                  <div style={{ fontSize: "0.82rem", opacity: 0.9 }}>
                    Authenticated as {user?.fullName} ({user?.identifier}). Module 1 authenticated session active.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Guest Expiration Warning Pill if Guest */}
          {role === "guest" && (
            <div className="guest-banner">
              <Icon name="clock" size={16} color="var(--mustard-dark)" />
              <span>
                <strong>Temporary Guest Account:</strong> Valid for 7 days. Enjoy ordering from all 4 cafeterias.
              </span>
            </div>
          )}

          {/* Public Browsing Banner when unauthenticated */}
          {!authenticated && (
            <div className="guest-banner" style={{ background: "rgba(15, 118, 110, 0.08)", borderColor: "rgba(15, 118, 110, 0.25)" }}>
              <Icon name="info" size={16} color="var(--teal)" />
              <span>
                <strong>Public Browsing:</strong> Explore live cafeteria queue times, crowd levels, and full food menus freely. Sign in or claim a Guest Pass whenever you are ready to order and pay.
              </span>
            </div>
          )}

          {/* Header & Personalized Greeting */}
          <div className="home-header">
            <div>
              <div className="home-eyebrow" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span className="pulse-dot" />
                <span>Smart Campus Dining Live</span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    color: "var(--teal)",
                    background: "var(--teal-tint)",
                    border: "1px solid rgba(20, 184, 166, 0.25)",
                    padding: "2px 8px",
                    borderRadius: 12,
                  }}
                >
                  <Icon name="clock" size={12} color="var(--teal)" />
                  <span>{bdTimeFormatted} BST (Dhaka)</span>
                </span>
              </div>
              <h1 className="home-greeting">
                {getGreeting()}, {user?.fullName ? firstName : "Campus Guest"} 👋
              </h1>
              <p className="home-sub">
                {user?.department
                  ? `${user.department} · ${user.identifier ? `ID: ${user.identifier}` : "Campus Member"}`
                  : "Pick a cafeteria below to check live queue wait times and browse today's menu."}
              </p>
            </div>

            <div className="home-header-actions">
              {authenticated ? (
                <>
                  <button
                    className="btn btn-mustard"
                    onClick={() => setReviewOpen(true)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                  >
                    <Icon name="star" size={15} />
                    <span>Drop a Review</span>
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setOrdersTab("orders");
                      setOrdersModalOpen(true);
                    }}
                  >
                    <Icon name="shoppingBag" size={16} />
                    <span>My Orders</span>
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setOrdersTab("favorites");
                      setOrdersModalOpen(true);
                    }}
                  >
                    <Icon name="heart" size={16} />
                    <span>Favorites</span>
                  </button>
                </>
              ) : (
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    className="btn btn-mustard"
                    onClick={() => setReviewOpen(true)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                  >
                    <Icon name="star" size={15} />
                    <span>Drop a Review</span>
                  </button>
                  <Link to="/login" className="btn btn-secondary">
                    <Icon name="user" size={15} />
                    <span>Log In</span>
                  </Link>
                  <Link to="/guest" className="btn btn-mustard">
                    <Icon name="shield" size={14} />
                    <span>Guest Pass</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Live Campus Advisory Ticker */}
          <div className="campus-advisory">
            <div className="advisory-icon">
              <Icon name="zap" size={17} color="var(--teal)" />
            </div>
            <div className="advisory-text">
              <strong>Campus Lunch Rush Advisory:</strong> Amitie is experiencing peak lines (~12 min).
              For fastest service, visit <strong>Vista Cafe</strong> (6 min) or <strong>Pitstop</strong> (3 min).
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="directory-toolbar" style={{ margin: "24px 0 28px" }}>
            <div className="search-box">
              <Icon name="search" size={16} color="var(--ink-soft)" />
              <input
                type="text"
                placeholder="Search by cafeteria name, building, or food..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button className="search-clear" onClick={() => setSearchQuery("")}>
                  <Icon name="x" size={14} />
                </button>
              )}
            </div>

            <div className="filter-pill-group">
              <button
                className={`filter-pill ${filterType === "all" ? "active" : ""}`}
                onClick={() => setFilterType("all")}
              >
                All Cafeterias ({cafeterias.length})
              </button>
              <button
                className={`filter-pill ${filterType === "open" ? "active" : ""}`}
                onClick={() => setFilterType("open")}
              >
                <span className="pulse-dot" />
                Open Now ({cafeterias.filter((c) => c.isOpen).length})
              </button>
              <button
                className={`filter-pill ${filterType === "fast" ? "active" : ""}`}
                onClick={() => setFilterType("fast")}
              >
                Fastest Queue (&le;6m)
              </button>
            </div>
          </div>

          {/* Cafeteria Cards Grid */}
          <div className="cafeteria-grid" style={{ marginBottom: 60 }}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <CafeteriaCardSkeleton key={i} />)
            ) : filteredCafeterias.length > 0 ? (
              filteredCafeterias.map((c) => <CafeteriaCard key={c.id} cafeteria={c} />)
            ) : (
              <div className="card empty-search-card" style={{ gridColumn: "1 / -1", padding: 40, textAlign: "center" }}>
                <Icon name="search" size={32} color="var(--ink-soft)" />
                <h3 style={{ marginTop: 12 }}>No cafeterias match "{searchQuery}"</h3>
                <p>Try searching for "Tehari", "Amitie", or clear filters.</p>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterType("all");
                  }}
                >
                  Reset Search
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Student & Faculty Testimonials (Campus Buzz) - as per Home before login */}
        <section className="section" style={{ background: "var(--teal-tint)" }}>
          <div className="container">
            <div className="section-head">
              <span className="section-eyebrow">
                <Icon name="heart" size={14} />
                <span>Campus Buzz</span>
              </span>
              <h2>Loved by Students & Faculty Across Campus</h2>
              <p>Here is what the university community has to say about their dining experience.</p>

              <div style={{ marginTop: 20, display: "flex", justifyContent: "center" }}>
                <button
                  type="button"
                  className="btn btn-mustard"
                  onClick={() => setReviewOpen(true)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}
                >
                  <Icon name="star" size={16} />
                  <span>Drop a Review</span>
                </button>
              </div>
            </div>

            <div className="testimonials-grid">
              {allTestimonials.map((t) => (
                <div key={t.id} className="card testimonial-card">
                  {t.rating && (
                    <div style={{ display: "flex", gap: 3, marginBottom: 8 }}>
                      {[...Array(t.rating)].map((_, i) => (
                        <Icon key={i} name="star" size={14} color="var(--mustard-dark)" />
                      ))}
                    </div>
                  )}
                  <p className="testimonial-quote">"{t.quote}"</p>
                  <div className="testimonial-author">
                    <div className="author-avatar">{t.avatar || (t.author ? t.author.charAt(0).toUpperCase() : "U")}</div>
                    <div>
                      <div className="author-name">{t.author}</div>
                      <div className="author-role">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Orders and Favorites Modal */}
      <OrdersModal
        isOpen={ordersModalOpen}
        onClose={() => setOrdersModalOpen(false)}
        initialTab={ordersTab}
      />

      <ReviewModal
        isOpen={reviewOpen}
        onClose={() => setReviewOpen(false)}
        onReviewSubmitted={() => setReviewsRevision((r) => r + 1)}
      />
    </>
  );
}
