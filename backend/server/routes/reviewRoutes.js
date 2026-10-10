import { Router } from "express";
import { addReview, getByCafeteria, getByItem } from "../controllers/reviewController.js";

const router = Router();

router.post("/", addReview);
router.get("/cafeteria/:cafeteriaId", getByCafeteria);
router.get("/item/:itemId", getByItem);

export default router;
