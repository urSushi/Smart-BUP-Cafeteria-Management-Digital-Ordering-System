import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Icon from "../components/Icons.jsx";
import { Spinner, Skeleton } from "../components/Loader.jsx";
import { apiService } from "../services/apiService.js";
import { CAFETERIAS } from "../data/cafeterias.js";
import { fetchLiveCafeterias, subscribeSync } from "../utils/liveCafeterias.js";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import CartDrawer from "../components/CartDrawer.jsx";
import PaymentModal from "../components/PaymentModal.jsx";
import OrderConfirmationModal from "../components/OrderConfirmationModal.jsx";
import OrderTrackingModal from "../components/OrderTrackingModal.jsx";
import ReviewModal from "../components/ReviewModal.jsx";
import AuthPromptModal from "../components/AuthPromptModal.jsx";

export default function CafeteriaMenu() {
  const { id } = useParams();
  const { authenticated } = useAuth();
  const { addToCart, itemsCount, total, isCartOpen, setIsCartOpen } = useCart();

  const [cafeteria, setCafeteria] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("all");

  // Modals state
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [confirmOrder, setConfirmOrder] = useState(null);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [reviewOrder, setReviewOrder] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        // Load live cafeteria info with image and status hydration
        const liveList = await fetchLiveCafeterias();
        let currentCaf = liveList.find((c) => c.id.toLowerCase() === id.toLowerCase());
        if (!currentCaf) {
          currentCaf = CAFETERIAS.find((c) => c.id.toLowerCase() === id.toLowerCase());
        }
        setCafeteria(currentCaf);

        // Load menu items
        const menuList = await apiService.getMenu(id);
        if (Array.isArray(menuList) && menuList.length > 0) {
          setItems(menuList);
        } else {
          // fallback to popular items if mock
          setItems(currentCaf?.popularItems || []);
        }
      } catch (err) {
        console.error("Failed to load cafeteria menu:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Listen for live admin updates (open/close, queue time, menu stock)
    const unsubscribe = subscribeSync(loadData);
    const interval = setInterval(loadData, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [id]);

  // Categories list
  const categories = useMemo(() => {
    const cats = new Set(items.map((i) => i.category).filter(Boolean));
    return ["all", ...Array.from(cats)];
  }, [items]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCat = selectedCategory === "all" || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTag =
        tagFilter === "all" || (item.tags && item.tags.some((t) => t.toLowerCase() === tagFilter.toLowerCase()));
      return matchesCat && matchesSearch && matchesTag;
    });
  }, [items, selectedCategory, searchQuery, tagFilter]);

  if (loading && !cafeteria) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ padding: "60px 0", textAlign: "center" }}>
          <Spinner />
          <p style={{ marginTop: 12, color: "var(--ink-soft)" }}>Loading live cafeteria menu...</p>
        </div>
      </>
    );
  }

  if (!cafeteria) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ padding: "60px 0", textAlign: "center" }}>
          <h2>Cafeteria Not Found</h2>
          <p>The requested campus dining location does not exist.</p>
          <Link to="/home" className="btn btn-primary">
            Return to Campus Dining
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="menu-page">
        {/* Cafeteria Hero Banner */}
        <section className="menu-hero">
          <div className="container">
            <div className="menu-hero-card card">
              <div className="menu-hero-meta">
                <Link to="/home" className="back-link">
                  <Icon name="arrowLeft" size={15} />
                  <span>All Cafeterias</span>
                </Link>

                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                  <span className={`badge ${cafeteria.isOpen ? "badge-open" : "badge-closed"}`}>
                    {cafeteria.isOpen ? (
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
                  {cafeteria.isOpen && (
                    <span className="queue-pill">
                      <Icon name="clock" size={13} />
                      <span>~{cafeteria.queueMinutes}m wait ({cafeteria.crowdLevel})</span>
                    </span>
                  )}
                </div>

                <h1 style={{ margin: "10px 0 6px", fontSize: "2rem" }}>{cafeteria.name}</h1>
                <p className="menu-hero-tagline">{cafeteria.tagline}</p>

                <div className="menu-info-pills">
                  <div className="pill-item">
                    <Icon name="mapPin" size={14} color="var(--teal)" />
                    <span>{cafeteria.building} · {cafeteria.floor}</span>
                  </div>
                  <div className="pill-item">
                    <Icon name="clock" size={14} color="var(--teal)" />
                    <span>{cafeteria.openingHours}</span>
                  </div>
                  <div className="pill-item rating-pill">
                    <Icon name="star" size={14} color="var(--mustard-dark)" />
                    <strong>{cafeteria.rating}</strong>
                    <span>({cafeteria.reviewsCount} reviews)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Menu Section */}
        <section className="container menu-catalog-section">
          {/* Cafeteria Closed Notice if disabled by Admin / Manager */}
          {!cafeteria.isOpen && (
            <div
              className="status-cancelled-banner"
              style={{
                margin: "0 0 24px",
                padding: "16px 20px",
                borderRadius: "var(--radius-md)",
                display: "flex",
                alignItems: "center",
                gap: 14,
                border: "1.5px solid var(--brick)",
                background: "var(--brick-tint)",
              }}
            >
              <Icon name="alertCircle" size={24} color="var(--brick)" />
              <div>
                <strong style={{ fontSize: "1.05rem", color: "var(--brick)" }}>
                  Notice: {cafeteria.name} is Currently Closed
                </strong>
                <div style={{ fontSize: "0.88rem", marginTop: 4, color: "var(--ink-soft)" }}>
                  Kitchen service and meal order placement have been paused by university administration. You may browse catalog items, but online ordering is temporarily halted.
                </div>
              </div>
            </div>
          )}

          {/* Guest Browsing Notice */}
          {!authenticated && (
            <div className="guest-menu-banner">
              <div className="guest-menu-banner-content">
                <Icon name="info" size={18} color="var(--teal)" />
                <span>
                  <strong>Guest Browsing Mode:</strong> You can explore {cafeteria.name}'s menu, ingredients, and prep times freely. Log in or claim a Guest Pass to place an order and pay.
                </span>
              </div>
              <div className="guest-menu-banner-actions">
                <Link to="/login" className="btn btn-primary btn-sm">
                  Log In to Order
                </Link>
                <Link to="/guest" className="btn btn-mustard btn-sm">
                  7-Day Guest Pass
                </Link>
              </div>
            </div>
          )}

          {/* Controls: Category tabs & Search */}
          <div className="menu-controls-bar">
            <div className="search-box menu-search">
              <Icon name="search" size={16} color="var(--ink-soft)" />
              <input
                type="text"
                placeholder="Search food by name or craving..."
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

            <div className="category-scroll-tabs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`cat-pill ${selectedCategory === cat ? "active" : ""}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat === "all" ? "All Items" : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Items Grid */}
          <div className="menu-items-grid">
            {filteredItems.map((item) => {
              const isOutOfStock = !item.isAvailable || item.stockQuantity === 0;
              const isLowStock =
                item.stockQuantity <= (item.lowStockThreshold || 5) && item.stockQuantity > 0;

              return (
                <div key={item.id} className={`card menu-item-card ${isOutOfStock ? "item-sold-out" : ""}`}>
                  <div className="item-header">
                    <div>
                      <div className="item-category-tag">{item.category}</div>
                      <h3 className="item-name">{item.name}</h3>
                    </div>
                    <div className="item-price-tag">৳{item.price}</div>
                  </div>

                  <p className="item-desc">{item.description}</p>

                  {/* Attributes: Calories, Prep Time, Tags */}
                  <div className="item-specs">
                    {item.prepTimeMinutes && (
                      <span className="spec-item">
                        <Icon name="clock" size={13} color="var(--teal)" />
                        <span>~{item.prepTimeMinutes} mins</span>
                      </span>
                    )}
                    {item.calories && (
                      <span className="spec-item">
                        <Icon name="zap" size={13} color="var(--mustard-dark)" />
                        <span>{item.calories}</span>
                      </span>
                    )}
                    {item.tags && item.tags.length > 0 && (
                      <span className="tag-pill">{item.tags[0]}</span>
                    )}
                  </div>

                  {/* Stock Availability Footer (FR-13, FR-14) */}
                  <div className="item-footer">
                    <div className="stock-status-wrap">
                      {isOutOfStock ? (
                        <span className="stock-badge stock-sold-out">
                          <Icon name="alertCircle" size={13} />
                          <span>Sold Out</span>
                        </span>
                      ) : isLowStock ? (
                        <span className="stock-badge stock-low">
                          <span className="pulse-dot-amber" />
                          <span>Only {item.stockQuantity} left!</span>
                        </span>
                      ) : (
                        <span className="stock-badge stock-available">
                          <span className="pulse-dot" />
                          <span>In Stock: {item.stockQuantity}</span>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary btn-sm add-btn"
                      disabled={isOutOfStock || !cafeteria.isOpen}
                      onClick={() =>
                        addToCart({
                          ...item,
                          cafeteriaId: cafeteria.id,
                          cafeteriaName: cafeteria.name,
                        })
                      }
                    >
                      <span>
                        {!cafeteria.isOpen
                          ? "Cafeteria Closed"
                          : isOutOfStock
                          ? "Out of Stock"
                          : "Add to Cart"}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredItems.length === 0 && (
            <div className="empty-catalog-card card">
              <Icon name="search" size={32} color="var(--ink-soft)" />
              <h3>No items found</h3>
              <p>Try searching for a different dish or select another category tab.</p>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSelectedCategory("all");
                  setSearchQuery("");
                }}
              >
                Reset Menu Filters
              </button>
            </div>
          )}
        </section>

        {/* Floating Cart Pill (Mobile & Desktop) */}
        {itemsCount > 0 && (
          <div className="floating-cart-bar">
            <div className="floating-cart-inner">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="cart-count-bubble">{itemsCount}</span>
                <div>
                  <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.85)" }}>Cart Total</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff" }}>৳{total}</div>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-mustard"
                onClick={() => setIsCartOpen(true)}
              >
                <span>{authenticated ? "View Cart & Checkout" : "View Cart (Log In to Pay)"}</span>
                <Icon name="chevronRight" size={16} />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <CartDrawer
        onProceedToPayment={() => {
          if (!authenticated) {
            setAuthPromptOpen(true);
          } else {
            setPaymentOpen(true);
          }
        }}
        onRequireAuth={() => setAuthPromptOpen(true)}
      />

      <AuthPromptModal
        isOpen={authPromptOpen}
        onClose={() => setAuthPromptOpen(false)}
      />

      <PaymentModal
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onOrderConfirmed={(order) => setConfirmOrder(order)}
      />

      <OrderConfirmationModal
        isOpen={Boolean(confirmOrder)}
        order={confirmOrder}
        onClose={() => setConfirmOrder(null)}
        onTrackOrder={(order) => setTrackingOrder(order)}
      />

      <OrderTrackingModal
        isOpen={Boolean(trackingOrder)}
        order={trackingOrder}
        onClose={() => setTrackingOrder(null)}
        onOpenReview={(order) => setReviewOrder(order)}
      />

      <ReviewModal
        isOpen={Boolean(reviewOrder)}
        order={reviewOrder}
        onClose={() => setReviewOrder(null)}
      />
    </>
  );
}
