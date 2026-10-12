import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useOrders } from "../context/OrderContext.jsx";
import Icon from "./Icons.jsx";
import CartDrawer from "./CartDrawer.jsx";
import PaymentModal from "./PaymentModal.jsx";
import OrderConfirmationModal from "./OrderConfirmationModal.jsx";
import OrderTrackingModal from "./OrderTrackingModal.jsx";
import AuthPromptModal from "./AuthPromptModal.jsx";
import ReviewModal from "./ReviewModal.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

export default function Navbar() {
  const { authenticated, user, role, logout, login, staffLogin, managerLogin, adminLogin } = useAuth();
  const { itemsCount, total, setIsCartOpen } = useCart();
  const { activeOrders } = useOrders();

  const [open, setOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewTargetOrder, setReviewTargetOrder] = useState(null);
  const [isAutoReviewPopup, setIsAutoReviewPopup] = useState(false);

  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [activeSection, setActiveSection] = useState(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const h = window.location.hash.replace("#", "");
      if (h === "cafeterias") return "cafeterias";
      if (h === "about" || h === "features") return "features";
      if (h === "how-it-works") return "how-it-works";
      if (h === "faq") return "faq";
    }
    return "home";
  });

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Real-time scroll spy for smooth active section pills on landing page
  useEffect(() => {
    if (location.pathname !== "/") {
      setActiveSection("");
      return;
    }

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.pageYOffset || document.documentElement.scrollTop;
          if (scrollY < 260) {
            setActiveSection("home");
            ticking = false;
            return;
          }

          const sections = [
            { id: "faq", name: "faq" },
            { id: "features", altId: "about", name: "features" },
            { id: "how-it-works", name: "how-it-works" },
            { id: "cafeterias", name: "cafeterias" },
          ];

          for (const sec of sections) {
            const el = document.getElementById(sec.id) || (sec.altId ? document.getElementById(sec.altId) : null);
            if (el) {
              const rect = el.getBoundingClientRect();
              if (rect.top <= 200 && rect.bottom >= 60) {
                setActiveSection(sec.name);
                ticking = false;
                return;
              }
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  const handleBrandClick = (e) => {
    setOpen(false);
    if (!authenticated && location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.history.pushState(null, "", "/");
      setActiveSection("home");
    }
  };

  const handleHomeClick = (e) => {
    setOpen(false);
    if (location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.history.pushState(null, "", "/");
      setActiveSection("home");
    } else {
      navigate("/");
    }
  };

  const handleScrollToSection = (e, sectionId) => {
    e?.preventDefault();
    setOpen(false);
    setActiveSection(sectionId);

    if (location.pathname === "/") {
      const target =
        document.getElementById(sectionId) ||
        (sectionId === "features" ? document.getElementById("about") : null) ||
        (sectionId === "about" ? document.getElementById("features") : null);
      if (target) {
        const navOffset = 76;
        const targetPos = target.getBoundingClientRect().top + window.pageYOffset - navOffset;
        window.scrollTo({ top: targetPos, behavior: "smooth" });
        window.history.pushState(null, "", `#${sectionId}`);
      }
    } else {
      navigate(`/#${sectionId}`);
    }
  };

  function handleLogout() {
    logout();
    setUserDropdown(false);
    setOpen(false);
    toast.info("Logged out successfully.");
    navigate("/");
  }

  // Demo role switcher for testing convenience
  async function handleSwitchRole(targetRole) {
    setUserDropdown(false);
    try {
      if (targetRole === "student") {
        await login("2021-1-60-001", "password123", { direct: true });
        toast.success("Switched to Student Demo account (Sarah Rahman).");
        navigate("/home");
      } else if (targetRole === "faculty") {
        await login("FAC-101", "password123", { direct: true });
        toast.success("Switched to Faculty Demo account (Dr. Tanvir Ahmed).");
        navigate("/home");
      } else if (targetRole === "officer") {
        await login("OFF-301", "password123", { direct: true });
        toast.success("Switched to Officer Demo account (Mohammad Rafiqul Islam).");
        navigate("/home");
      } else if (targetRole === "staff") {
        await staffLogin("STF-001", "password123");
        toast.success("Switched to Staff Kitchen Portal (Rahim Mia).");
        navigate("/staff/dashboard");
      } else if (targetRole === "manager") {
        await managerLogin("MGR-001", "password123");
        toast.success("Switched to Manager Dining Ops Console (Kamal Hossain).");
        navigate("/manager/dashboard");
      } else if (targetRole === "admin") {
        await adminLogin("ADM-001", "password123");
        toast.success("Switched to System Administrator Console.");
        navigate("/admin/dashboard");
      }
    } catch (err) {
      toast.error(err.message);
    }
  }

  const roleLabelMap = {
    student: "Student",
    faculty: "Faculty",
    officer: "Officer",
    staff: "Univ Staff",
    cafeteria_staff: "Kitchen Staff",
    cafeteria_manager: "Dining Manager",
    admin: "System Administrator",
    guest: "Guest (7d)",
  };

  return (
    <>
      <header className="navbar">
        <div className="container navbar-inner">
          <Link to={authenticated ? "/home" : "/"} className="brand" onClick={handleBrandClick}>
            <span className="brand-mark">
              <Icon name="utensils" size={17} color="#fff" />
            </span>
            <div className="brand-text">
              <span className="brand-title">Smart Cafeteria</span>
              <span className="brand-sub">BUP University Dining</span>
            </div>
          </Link>

          <nav className="nav-links">
            {authenticated ? (
              <>
                <Link
                  to="/home"
                  className={`nav-link-btn ${location.pathname === "/home" || location.pathname.startsWith("/cafeteria") ? "active" : ""}`}
                  onClick={() => {
                    if (location.pathname === "/home") window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Cafeterias
                </Link>
                <Link
                  to="/orders"
                  className={`nav-link-btn ${location.pathname === "/orders" ? "active" : ""}`}
                >
                  <span>My Orders</span>
                  {activeOrders && activeOrders.length > 0 && (
                    <span className="nav-badge-pill">{activeOrders.length}</span>
                  )}
                </Link>

                {/* Direct Operational Portal Links based on role */}
                {role === "cafeteria_staff" && (
                  <Link
                    to="/staff/dashboard"
                    className={`nav-link-btn portal-nav-link ${location.pathname.startsWith("/staff") ? "active" : ""}`}
                  >
                    <Icon name="utensils" size={14} />
                    <span>Kitchen KDS</span>
                  </Link>
                )}

                {role === "cafeteria_manager" && (
                  <Link
                    to="/manager/dashboard"
                    className={`nav-link-btn portal-nav-link ${location.pathname.startsWith("/manager") ? "active" : ""}`}
                  >
                    <Icon name="shield" size={14} />
                    <span>Manager Console</span>
                  </Link>
                )}

                {role === "admin" && (
                  <Link
                    to="/admin/dashboard"
                    className={`nav-link-btn portal-nav-link ${location.pathname.startsWith("/admin") ? "active" : ""}`}
                  >
                    <Icon name="shield" size={14} />
                    <span>System Administrator</span>
                  </Link>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={`nav-link-btn ${location.pathname === "/" && activeSection === "home" ? "active" : ""}`}
                  onClick={handleHomeClick}
                >
                  Home
                </button>
                <button
                  type="button"
                  className={`nav-link-btn ${((location.pathname === "/" && activeSection === "cafeterias") || location.pathname === "/home" || location.pathname.startsWith("/cafeteria")) ? "active" : ""}`}
                  onClick={(e) => handleScrollToSection(e, "cafeterias")}
                >
                  Cafeterias
                </button>
                <button
                  type="button"
                  className={`nav-link-btn ${location.pathname === "/" && activeSection === "features" ? "active" : ""}`}
                  onClick={(e) => handleScrollToSection(e, "features")}
                >
                  Features
                </button>
                <button
                  type="button"
                  className={`nav-link-btn ${location.pathname === "/" && activeSection === "how-it-works" ? "active" : ""}`}
                  onClick={(e) => handleScrollToSection(e, "how-it-works")}
                >
                  How It Works
                </button>
                <button
                  type="button"
                  className={`nav-link-btn ${location.pathname === "/" && activeSection === "faq" ? "active" : ""}`}
                  onClick={(e) => handleScrollToSection(e, "faq")}
                >
                  FAQ
                </button>
              </>
            )}
          </nav>

          <div className="nav-actions">
            {/* Theme Switcher Button (Light Mode & Luminous Purple Dark Mode) */}
            <ThemeToggle />

            {/* Cart Button (Visible for signed-in users or whenever guest has items in cart) */}
            {(authenticated || itemsCount > 0) && (
              <button
                type="button"
                className="nav-cart-btn"
                onClick={() => setIsCartOpen(true)}
                aria-label="View meal cart"
              >
                <Icon name="shoppingBag" size={17} />
                {itemsCount > 0 && <span className="nav-cart-badge">{itemsCount}</span>}
                <span className="nav-cart-label">৳{total}</span>
              </button>
            )}

            {authenticated ? (
              <div className="nav-user-wrapper" ref={dropdownRef}>
                <button
                  className="nav-user-btn"
                  onClick={() => setUserDropdown((prev) => !prev)}
                  aria-expanded={userDropdown}
                >
                  <span className="nav-avatar">
                    {(user?.fullName || "U").charAt(0).toUpperCase()}
                  </span>
                  <div className="nav-user-info">
                    <span className="nav-user-name">
                      {user?.fullName?.split(" ")[0] || "User"}
                    </span>
                    <span className={`nav-role-badge badge-${role || "student"}`}>
                      {roleLabelMap[role] || "Member"}
                    </span>
                  </div>
                  <Icon name="chevronDown" size={14} />
                </button>

                {userDropdown && (
                  <div className="user-dropdown-menu">
                    <div className="dropdown-header">
                      <div className="dropdown-name">{user?.fullName || "Campus Member"}</div>
                      <div className="dropdown-id">
                        {user?.identifier ? `ID: ${user.identifier}` : user?.personalEmail || "Guest Access"}
                      </div>
                      {user?.department && (
                        <div className="dropdown-dept">{user.department}</div>
                      )}
                    </div>

                    <div className="dropdown-divider" />

                    <Link to="/orders" className="dropdown-item" onClick={() => setUserDropdown(false)}>
                      <Icon name="shoppingBag" size={16} />
                      <span>My Active Orders & History</span>
                    </Link>

                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => {
                        setUserDropdown(false);
                        setReviewModalOpen(true);
                      }}
                    >
                      <Icon name="star" size={16} color="var(--mustard-dark)" />
                      <span>Rate & Review Experience</span>
                    </button>

                    {/* Operational Quick Portals */}
                    {role === "cafeteria_staff" && (
                      <Link to="/staff/dashboard" className="dropdown-item" onClick={() => setUserDropdown(false)}>
                        <Icon name="utensils" size={16} />
                        <span>Staff Kitchen Display (KDS)</span>
                      </Link>
                    )}
                    {role === "cafeteria_manager" && (
                      <Link to="/manager/dashboard" className="dropdown-item" onClick={() => setUserDropdown(false)}>
                        <Icon name="shield" size={16} />
                        <span>Manager Operations Console</span>
                      </Link>
                    )}
                    {role === "admin" && (
                      <Link to="/admin/dashboard" className="dropdown-item" onClick={() => setUserDropdown(false)}>
                        <Icon name="shield" size={16} />
                        <span>System Administrator</span>
                      </Link>
                    )}

                    <div className="dropdown-divider" />
                    <div className="dropdown-section-title">Evaluation Role Switcher</div>

                    <div className="demo-switch-pills">
                      <button
                        className={`demo-pill ${role === "student" ? "active" : ""}`}
                        onClick={() => handleSwitchRole("student")}
                      >
                        Student
                      </button>
                      <button
                        className={`demo-pill ${role === "faculty" ? "active" : ""}`}
                        onClick={() => handleSwitchRole("faculty")}
                      >
                        Faculty
                      </button>
                      <button
                        className={`demo-pill ${role === "officer" ? "active" : ""}`}
                        onClick={() => handleSwitchRole("officer")}
                      >
                        Officer
                      </button>
                      <button
                        className={`demo-pill ${role === "cafeteria_staff" ? "active" : ""}`}
                        onClick={() => handleSwitchRole("staff")}
                      >
                        Staff
                      </button>
                      <button
                        className={`demo-pill ${role === "cafeteria_manager" ? "active" : ""}`}
                        onClick={() => handleSwitchRole("manager")}
                      >
                        Manager
                      </button>
                      <button
                        className={`demo-pill ${role === "admin" ? "active" : ""}`}
                        onClick={() => handleSwitchRole("admin")}
                      >
                        Admin
                      </button>
                    </div>

                    <div className="dropdown-divider" />

                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                      <Icon name="logOut" size={16} />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">
                  <Icon name="user" size={15} />
                  <span>Login</span>
                </Link>
                <Link to="/signup" className="btn btn-secondary">
                  Sign Up
                </Link>
                <Link to="/guest" className="btn btn-mustard">
                  <Icon name="shield" size={14} />
                  <span>Guest Pass</span>
                </Link>
              </>
            )}

            <button
              className="nav-hamburger"
              aria-label="Toggle navigation menu"
              onClick={() => setOpen((o) => !o)}
            >
              <Icon name={open ? "x" : "menu"} size={22} />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <div className={`nav-mobile-panel ${open ? "open" : ""}`}>
          {authenticated ? (
            <>
              <div className="mobile-user-card">
                <span className="nav-avatar">
                  {(user?.fullName || "U").charAt(0).toUpperCase()}
                </span>
                <div>
                  <div className="nav-user-name">{user?.fullName || "User"}</div>
                  <div className="dropdown-id">
                    {user?.identifier ? `ID: ${user.identifier}` : user?.personalEmail || "Campus Member"}
                  </div>
                </div>
              </div>

              <Link
                to="/home"
                className={`mobile-nav-link ${location.pathname === "/home" ? "active" : ""}`}
                onClick={() => setOpen(false)}
              >
                <span>Cafeterias Catalog</span>
                <Icon name="chevronRight" size={16} />
              </Link>
              <Link
                to="/orders"
                className={`mobile-nav-link ${location.pathname === "/orders" ? "active" : ""}`}
                onClick={() => setOpen(false)}
              >
                <span>My Active Orders</span>
                {activeOrders && activeOrders.length > 0 && (
                  <span className="nav-badge-pill">{activeOrders.length}</span>
                )}
              </Link>

              <button
                type="button"
                className="mobile-nav-link"
                style={{
                  width: "100%",
                  background: "none",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
                onClick={() => {
                  setOpen(false);
                  setReviewModalOpen(true);
                }}
              >
                <span>Rate & Review Experience</span>
                <Icon name="star" size={16} color="var(--mustard-dark)" />
              </button>

              {role === "cafeteria_staff" && (
                <Link
                  to="/staff/dashboard"
                  className="mobile-nav-link"
                  onClick={() => setOpen(false)}
                >
                  <span>Kitchen KDS Console</span>
                  <Icon name="utensils" size={16} />
                </Link>
              )}
              {role === "cafeteria_manager" && (
                <Link
                  to="/manager/dashboard"
                  className="mobile-nav-link"
                  onClick={() => setOpen(false)}
                >
                  <span>Manager Dining Console</span>
                  <Icon name="shield" size={16} />
                </Link>
              )}
              {role === "admin" && (
                <Link
                  to="/admin/dashboard"
                  className="mobile-nav-link"
                  onClick={() => setOpen(false)}
                >
                  <span>System Administrator</span>
                  <Icon name="shield" size={16} />
                </Link>
              )}

              <div className="dropdown-divider" />
              <button
                type="button"
                className="mobile-nav-link text-danger"
                onClick={handleLogout}
              >
                <span>Log Out</span>
                <Icon name="logOut" size={16} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`mobile-nav-link ${location.pathname === "/" && activeSection === "home" ? "active" : ""}`}
                onClick={handleHomeClick}
              >
                <span>Home</span>
                <Icon name="chevronRight" size={16} />
              </button>
              <button
                type="button"
                className={`mobile-nav-link ${((location.pathname === "/" && activeSection === "cafeterias") || location.pathname === "/home") ? "active" : ""}`}
                onClick={(e) => handleScrollToSection(e, "cafeterias")}
              >
                <span>Cafeterias</span>
                <Icon name="chevronRight" size={16} />
              </button>
              <button
                type="button"
                className={`mobile-nav-link ${location.pathname === "/" && activeSection === "features" ? "active" : ""}`}
                onClick={(e) => handleScrollToSection(e, "features")}
              >
                <span>Features</span>
                <Icon name="chevronRight" size={16} />
              </button>
              <button
                type="button"
                className={`mobile-nav-link ${location.pathname === "/" && activeSection === "how-it-works" ? "active" : ""}`}
                onClick={(e) => handleScrollToSection(e, "how-it-works")}
              >
                <span>How It Works</span>
                <Icon name="chevronRight" size={16} />
              </button>
              <button
                type="button"
                className={`mobile-nav-link ${location.pathname === "/" && activeSection === "faq" ? "active" : ""}`}
                onClick={(e) => handleScrollToSection(e, "faq")}
              >
                <span>FAQ</span>
                <Icon name="chevronRight" size={16} />
              </button>

              <div className="dropdown-divider" />

              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                <Link
                  to="/login"
                  className="btn btn-ghost"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={() => setOpen(false)}
                >
                  <Icon name="user" size={15} />
                  <span>Login</span>
                </Link>
                <Link
                  to="/signup"
                  className="btn btn-secondary"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={() => setOpen(false)}
                >
                  Sign Up
                </Link>
                <Link
                  to="/guest"
                  className="btn btn-mustard"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={() => setOpen(false)}
                >
                  <Icon name="shield" size={14} />
                  <span>Guest Pass</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Global Modals Mounted with Navbar */}
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
        onOrderConfirmed={(ord) => setConfirmedOrder(ord)}
      />

      <OrderConfirmationModal
        isOpen={Boolean(confirmedOrder)}
        order={confirmedOrder}
        onClose={(skipAutoPopup) => {
          const ord = confirmedOrder;
          setConfirmedOrder(null);
          if (!skipAutoPopup && ord && ord.id) {
            try {
              const dismissed = JSON.parse(localStorage.getItem("sbcms_dismissed_reviews") || "[]");
              const reviewed = JSON.parse(localStorage.getItem("sbcms_reviewed_orders") || "[]");
              if (!dismissed.includes(ord.id) && !reviewed.includes(ord.id)) {
                // Show popup for review after ordering & payment done!
                setReviewTargetOrder(ord);
                setIsAutoReviewPopup(true);
                setReviewModalOpen(true);
              }
            } catch {}
          }
        }}
        onTrackOrder={(ord) => setTrackingOrder(ord)}
        onOpenReview={(ord) => {
          setConfirmedOrder(null);
          setReviewTargetOrder(ord);
          setIsAutoReviewPopup(true);
          setReviewModalOpen(true);
        }}
      />

      <OrderTrackingModal
        isOpen={Boolean(trackingOrder)}
        order={trackingOrder}
        onClose={() => setTrackingOrder(null)}
        onOpenReview={(ord) => {
          setTrackingOrder(null);
          setReviewTargetOrder(ord);
          setIsAutoReviewPopup(false);
          setReviewModalOpen(true);
        }}
      />

      <ReviewModal
        isOpen={reviewModalOpen}
        order={reviewTargetOrder}
        isAutoPopup={isAutoReviewPopup}
        onClose={() => {
          setReviewModalOpen(false);
          setReviewTargetOrder(null);
          setIsAutoReviewPopup(false);
        }}
      />
    </>
  );
}
