import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Hero from "../components/Hero.jsx";
import FeatureCard from "../components/FeatureCard.jsx";
import CafeteriaCard from "../components/CafeteriaCard.jsx";
import { InfoCardSkeleton, CafeteriaCardSkeleton } from "../components/Loader.jsx";
import { FEATURES, TESTIMONIALS, FAQS } from "../data/cafeterias.js";
import Icon from "../components/Icons.jsx";
import { useLiveCafeterias } from "../utils/liveCafeterias.js";
import ReviewModal from "../components/ReviewModal.jsx";

export default function Landing() {
  const { cafeterias, loading: liveLoading } = useLiveCafeterias(4000);
  const [infoLoading, setInfoLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // "all" | "open" | "fast"
  const [expandedFaq, setExpandedFaq] = useState(0);
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
    const t1 = setTimeout(() => setInfoLoading(false), 300);
    const t2 = setTimeout(() => setInitialLoading(false), 450);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const cafeteriasLoading = initialLoading && liveLoading;

  const openCafeterias = useMemo(() => cafeterias.filter((c) => c.isOpen), [cafeterias]);
  const openCount = openCafeterias.length;

  const fastestCaf = useMemo(() => {
    if (openCafeterias.length === 0) return null;
    return [...openCafeterias].sort((a, b) => a.queueMinutes - b.queueMinutes)[0];
  }, [openCafeterias]);

  const dynamicInfoCards = useMemo(() => {
    return [
      {
        id: "special",
        label: "Today's Special",
        value: "Morog Polao",
        sub: "Amitie Cafeteria · Fresh Batch",
        icon: "utensils",
      },
      {
        id: "queue",
        label: "Shortest Queue",
        value: fastestCaf ? `${fastestCaf.queueMinutes} mins` : "All Paused",
        sub: fastestCaf ? `${fastestCaf.name} · Ready to grab` : "No counters currently active",
        icon: "clock",
      },
      {
        id: "open",
        label: "Open Cafeterias",
        value: `${openCount} of ${cafeterias.length}`,
        sub: openCount === cafeterias.length ? "All 4 locations serving" : `${cafeterias.length - openCount} location(s) currently closed`,
        icon: "coffee",
      },
      {
        id: "popular",
        label: "Orders Today",
        value: "384+",
        sub: "89% picked up in under 5 mins",
        icon: "shoppingBag",
      },
      {
        id: "activity",
        label: "Campus Lunch Rush",
        value: openCount > 0 ? "Active" : "Closed",
        sub: "Live synced with kitchen counters",
        icon: "zap",
      },
    ];
  }, [fastestCaf, openCount, cafeterias.length]);

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

  return (
    <>
      <Navbar />
      <Hero cafeterias={cafeterias} />

      {/* Live Campus Dining Metrics */}
      <div className="container" style={{ position: "relative", zIndex: 10 }}>
        <div className="info-grid">
          {infoLoading
            ? Array.from({ length: 5 }).map((_, i) => <InfoCardSkeleton key={i} />)
            : dynamicInfoCards.map((card) => (
                <div key={card.id} className="card info-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span className="info-label">{card.label}</span>
                    <Icon name={card.icon || "sparkles"} size={16} color="var(--teal)" />
                  </div>
                  <div className="info-value">{card.value}</div>
                  <div className="info-sub">{card.sub}</div>
                </div>
              ))}
        </div>
      </div>

      {/* Cafeteria Directory Section */}
      <section className="section" id="cafeterias">
        <div className="container">
          <div className="section-head">
            <span className="section-eyebrow">
              <Icon name="mapPin" size={14} />
              <span>Campus Dining Network</span>
            </span>
            <h2>Open Across Campus, Right Now</h2>
            <p>
              Four university cafeterias, live kitchen queues, and instant ordering from anywhere on campus.
            </p>

            {/* Live Filter & Search Toolbar */}
            <div className="directory-toolbar">
              <div className="search-box">
                <Icon name="search" size={16} color="var(--ink-soft)" />
                <input
                  type="text"
                  placeholder="Search cafeteria, building, or food item..."
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
                  All ({cafeterias.length})
                </button>
                <button
                  className={`filter-pill ${filterType === "open" ? "active" : ""}`}
                  onClick={() => setFilterType("open")}
                >
                  <span className="pulse-dot" />
                  Open Now ({openCount})
                </button>
                <button
                  className={`filter-pill ${filterType === "fast" ? "active" : ""}`}
                  onClick={() => setFilterType("fast")}
                >
                  Fastest Queue (&le;6m)
                </button>
              </div>
            </div>
          </div>

          <div className="cafeteria-grid">
            {cafeteriasLoading ? (
              Array.from({ length: 4 }).map((_, i) => <CafeteriaCardSkeleton key={i} />)
            ) : filteredCafeterias.length > 0 ? (
              filteredCafeterias.map((c) => <CafeteriaCard key={c.id} cafeteria={c} />)
            ) : (
              <div className="card empty-search-card" style={{ gridColumn: "1 / -1", padding: 40, textAlign: "center" }}>
                <Icon name="search" size={32} color="var(--ink-soft)" />
                <h3 style={{ marginTop: 12 }}>No cafeterias match your search</h3>
                <p>Try searching for "Tehari", "Coffee", or reset filters.</p>
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
      </section>

      {/* How It Works Section */}
      <section className="section" id="how-it-works" style={{ background: "var(--sand)" }}>
        <div className="container">
          <div className="section-head">
            <span className="section-eyebrow">
              <Icon name="zap" size={14} />
              <span>Three Simple Steps</span>
            </span>
            <h2>How Campus Dining Works</h2>
            <p>From your lecture room to hot meal pickup in minutes — no waiting in line.</p>
          </div>

          <div className="steps-grid">
            <div className="card step-card">
              <div className="step-number">1</div>
              <div className="step-icon">
                <Icon name="search" size={24} color="var(--teal)" />
              </div>
              <h3>Pick Your Cafeteria</h3>
              <p>Check live queue wait times, current seating availability, and see today's freshly prepared specials.</p>
            </div>

            <div className="card step-card">
              <div className="step-number">2</div>
              <div className="step-icon">
                <Icon name="shoppingBag" size={24} color="var(--teal)" />
              </div>
              <h3>Order Ahead Online</h3>
              <p>Customize your meal, see real-time price totals, and pay securely via bKash, student ID card, or cash on pickup.</p>
            </div>

            <div className="card step-card">
              <div className="step-number">3</div>
              <div className="step-icon">
                <Icon name="checkCircle" size={24} color="var(--teal)" />
              </div>
              <h3>Express Counter Pickup</h3>
              <p>Receive your digital pickup token. Walk straight to the dedicated fast-lane counter and grab your meal.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section" id="features">
        <span id="about" style={{ display: "none" }} />
        <div className="container">
          <div className="section-head">
            <span className="section-eyebrow">
              <Icon name="shield" size={14} />
              <span>Built for University Life</span>
            </span>
            <h2>Smart Features Engineered for Campus</h2>
            <p>Designed specifically to solve peak hour lunch rushes and long queues between classes.</p>
          </div>
          <div className="feature-grid">
            {FEATURES.map((f) => (
              <FeatureCard key={f.id} icon={f.icon} title={f.title} desc={f.desc} />
            ))}
          </div>
        </div>
      </section>

      {/* Student & Faculty Testimonials */}
      <section className="section" style={{ background: "var(--teal-tint)" }}>
        <div className="container">
          <div className="section-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
            <div>
              <span className="section-eyebrow">
                <Icon name="heart" size={14} />
                <span>Campus Buzz</span>
              </span>
              <h2>Loved by Students & Faculty Across Campus</h2>
              <p>Here is what the university community has to say about their dining experience.</p>
            </div>

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

      {/* FAQ Accordion Section */}
      <section className="section" id="faq">
        <div className="container" style={{ maxWidth: 860 }}>
          <div className="section-head">
            <span className="section-eyebrow">
              <Icon name="sparkles" size={14} />
              <span>Got Questions?</span>
            </span>
            <h2>Frequently Asked Questions</h2>
            <p>Everything you need to know about the Smart Cafeteria Management System.</p>
          </div>

          <div className="faq-list">
            {FAQS.map((faq, index) => {
              const isOpen = expandedFaq === index;
              return (
                <div key={index} className={`card faq-item ${isOpen ? "open" : ""}`}>
                  <button
                    className="faq-question-btn"
                    onClick={() => setExpandedFaq(isOpen ? -1 : index)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <Icon
                      name="chevronDown"
                      size={18}
                      className={`faq-icon ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isOpen && <div className="faq-answer-body">{faq.a}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* University Footer */}
      <footer className="footer" id="contact">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand-col">
              <div className="brand" style={{ marginBottom: 12 }}>
                <span className="brand-mark">
                  <Icon name="utensils" size={16} color="#fff" />
                </span>
                <span>Smart University Cafeteria</span>
              </div>
              <p style={{ fontSize: "0.88rem", maxWidth: 360 }}>
                Official campus dining automation system. Streamlining food preparation, order fulfillment, and queue management for the entire university community.
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <span className="portal-badge" style={{ margin: 0 }}>Module 1 Verified</span>
                <span className="portal-badge" style={{ margin: 0, background: "var(--teal)", color: "#fff" }}>
                  BUP Campus
                </span>
              </div>
            </div>

            <div className="footer-links-col">
              <h4>Quick Access</h4>
              <ul>
                <li><Link to="/login">University Login</Link></li>
                <li><Link to="/signup">Register Account</Link></li>
                <li><Link to="/guest">Visitor Guest Pass</Link></li>
                <li><a href="#cafeterias">Cafeterias Directory</a></li>
              </ul>
            </div>

            <div className="footer-links-col">
              <h4>Operational Portals</h4>
              <ul>
                <li><Link to="/staff/login">Staff Kitchen Portal</Link></li>
                <li><Link to="/manager/login">Cafeteria Manager</Link></li>
                <li><Link to="/admin/login">System Administrator</Link></li>
              </ul>
            </div>

            <div className="footer-links-col">
              <h4>Help & Support</h4>
              <p style={{ fontSize: "0.85rem", margin: "0 0 8px" }}>
                IT Operations Center, Level 4
              </p>
              <p style={{ fontSize: "0.85rem", margin: 0 }}>
                Email: support.cafeteria@bup.edu.bd
              </p>
              <p style={{ fontSize: "0.85rem", margin: "4px 0 0" }}>
                Campus Helpline: +880 2-8000441
              </p>
            </div>
          </div>

          <div className="footer-bottom">
            <div>
              &copy; {new Date().getFullYear()} Smart University Cafeteria Management System (SBCMS). All rights reserved.
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <Link to="/staff/login">Staff Login</Link>
              <Link to="/manager/login">Manager Login</Link>
              <Link to="/admin/login">System Administrator</Link>
            </div>
          </div>
        </div>
      </footer>

      <ReviewModal
        isOpen={reviewOpen}
        onClose={() => setReviewOpen(false)}
        onReviewSubmitted={() => setReviewsRevision((r) => r + 1)}
      />
    </>
  );
}
