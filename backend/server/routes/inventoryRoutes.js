import { Router } from "express";
import {
  getInventory,
  updateStock,
  setThreshold,
  getAlerts,
} from "../controllers/inventoryController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", requireAuth, getInventory);
router.get("/alerts", requireAuth, getAlerts);
router.patch("/:id/stock", requireAuth, updateStock);
router.patch("/:id/threshold", requireAuth, setThreshold);

export default router;
