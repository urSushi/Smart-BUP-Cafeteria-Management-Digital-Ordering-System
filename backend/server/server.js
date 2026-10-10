import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";

import authRoutes from "./routes/authRoutes.js";
import otpRoutes from "./routes/otpRoutes.js";
import guestRoutes from "./routes/guestRoutes.js";
import cafeteriaRoutes from "./routes/cafeteriaRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import pickupRoutes from "./routes/pickupRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import promotionRoutes from "./routes/promotionRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import databaseRoutes from "./routes/databaseRoutes.js";
import { initDatabase } from "./db.js";

const app = express();

// Initialize Hybrid Relational / PostgreSQL Database
initDatabase().catch((err) => console.error("[DB Init Warning]", err));

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json());
app.use(morgan("dev"));

// Authentication & Account verification
app.use("/api/auth", authRoutes);
app.use("/api/auth", otpRoutes);
app.use("/api/auth", guestRoutes);

// Cafeteria & Menu catalog
app.use("/api/cafeterias", cafeteriaRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/inventory", inventoryRoutes);

// Orders & Pickup Fulfillment
app.use("/api/orders", orderRoutes);
app.use("/api/pickup", pickupRoutes);
app.use("/api/payments", paymentRoutes);

// Ratings, Analytics & Administration
app.use("/api/reviews", reviewRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/database", databaseRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok", system: "SBCMS API v1.0", timestamp: new Date().toISOString() }));

app.use((req, res) => {
  res.status(404).json({ message: "Not found." });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || "Unexpected server error." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Smart BUP Cafeteria Management System (SBCMS) API listening on http://localhost:${PORT}`);
});
