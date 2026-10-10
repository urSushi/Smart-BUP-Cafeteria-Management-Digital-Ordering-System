import { Router } from "express";
import { getCafeterias, getCafeteria, updateStatus } from "../controllers/cafeteriaController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireCafeteriaAccess } from "../middleware/canteenAccessMiddleware.js";

const router = Router();

router.get("/", getCafeterias);
router.get("/:id", getCafeteria);
router.patch("/:id/status", requireAuth, requireCafeteriaAccess("id", "params"), updateStatus);

export default router;
