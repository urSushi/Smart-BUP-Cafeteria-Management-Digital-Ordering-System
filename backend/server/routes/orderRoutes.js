import { Router } from "express";
import {
  placeOrder,
  getUserOrders,
  getCafeteriaOrders,
  getOrder,
  updateStatus,
  cancel,
  getRefundPendingOrders,
  adminProcessRefund,
} from "../controllers/orderController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireCafeteriaAccess } from "../middleware/canteenAccessMiddleware.js";

const router = Router();

router.post("/", requireAuth, placeOrder);
router.get("/my-orders", requireAuth, getUserOrders);
router.get("/cafeteria/:cafeteriaId", requireAuth, requireCafeteriaAccess("cafeteriaId", "params"), getCafeteriaOrders);
router.get("/refunds/pending", requireAuth, getRefundPendingOrders);
router.post("/:id/process-refund", requireAuth, adminProcessRefund);
router.get("/:id", getOrder);
router.patch("/:id/status", requireAuth, updateStatus);
router.post("/:id/cancel", requireAuth, cancel);

export default router;
