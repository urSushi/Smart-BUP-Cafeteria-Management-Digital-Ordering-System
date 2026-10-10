import { Router } from "express";
import { getManagerAnalytics, getAdminAnalytics } from "../controllers/analyticsController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireCafeteriaAccess } from "../middleware/canteenAccessMiddleware.js";

const router = Router();

router.get("/manager/:cafeteriaId", requireAuth, requireCafeteriaAccess("cafeteriaId", "params"), getManagerAnalytics);
router.get("/admin/cross-cafeteria", requireAuth, getAdminAnalytics);

export default router;
