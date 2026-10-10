import { Router } from "express";
import { initiatePayment, confirmPayment } from "../controllers/paymentController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/initiate", requireAuth, initiatePayment);
router.post("/confirm", requireAuth, confirmPayment);

export default router;
