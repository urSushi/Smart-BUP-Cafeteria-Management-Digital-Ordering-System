import { Router } from "express";
import { verifyPickup, inspectToken } from "../controllers/pickupController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/verify", requireAuth, verifyPickup);
router.get("/inspect/:token", inspectToken);

export default router;
