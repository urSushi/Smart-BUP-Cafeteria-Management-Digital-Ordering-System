import { Router } from "express";
import {
  getMenu,
  getItem,
  addItem,
  editItem,
  removeItem,
  toggleAvailability,
} from "../controllers/menuController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", getMenu);
router.get("/:id", getItem);
router.post("/", requireAuth, addItem);
router.put("/:id", requireAuth, editItem);
router.delete("/:id", requireAuth, removeItem);
router.patch("/:id/availability", requireAuth, toggleAvailability);

export default router;
