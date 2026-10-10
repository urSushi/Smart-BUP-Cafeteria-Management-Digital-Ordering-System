import React, { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import GuestSignup from "./pages/GuestSignup.jsx";
import OTPVerification from "./pages/OTPVerification.jsx";
import Home from "./pages/Home.jsx";
import CafeteriaMenu from "./pages/CafeteriaMenu.jsx";
import Orders from "./pages/Orders.jsx";
import StaffLogin from "./pages/StaffLogin.jsx";
import ManagerLogin from "./pages/ManagerLogin.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import StaffDashboard from "./pages/StaffDashboard.jsx";
import ManagerDashboard from "./pages/ManagerDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const targetId = hash.replace("#", "");
      const scrollToHashElement = () => {
        const el =
          document.getElementById(targetId) ||
          (targetId === "features" ? document.getElementById("about") : null) ||
          (targetId === "about" ? document.getElementById("features") : null);
        if (el) {
          const navOffset = 76;
          const pos = el.getBoundingClientRect().top + window.pageYOffset - navOffset;
          window.scrollTo({ top: pos, behavior: "smooth" });
          return true;
        }
        return false;
      };

      if (!scrollToHashElement()) {
        const timer = setTimeout(scrollToHashElement, 90);
        return () => clearTimeout(timer);
      }
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname, hash]);

  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public Landing & Authentication */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/guest" element={<GuestSignup />} />
        <Route path="/otp-verification" element={<OTPVerification />} />

        {/* Operational Portals Login */}
        <Route path="/staff/login" element={<StaffLogin />} />
        <Route path="/manager/login" element={<ManagerLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Public Cafeteria Directory & Menu Catalog (No login required to view) */}
        <Route path="/home" element={<Home />} />
        <Route path="/cafeteria/:id" element={<CafeteriaMenu />} />
        <Route path="/menu/:id" element={<CafeteriaMenu />} />

        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />

        {/* Operational Dashboards (Role-Protected) */}
        <Route
          path="/staff/dashboard"
          element={
            <ProtectedRoute allowedRoles={["cafeteria_staff", "cafeteria_manager", "admin"]}>
              <StaffDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/dashboard"
          element={
            <ProtectedRoute allowedRoles={["cafeteria_manager", "admin"]}>
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Landing />} />
      </Routes>
    </>
  );
}
