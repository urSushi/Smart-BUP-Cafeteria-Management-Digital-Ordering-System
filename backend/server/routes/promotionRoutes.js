import { Router } from "express";
import {
  listPromotions,
  validate,
  addPromotion,
  toggle,
} from "../controllers/promotionController.js";

const router = Router();

router.get("/", listPromotions);
router.post("/validate", validate);
router.post("/", addPromotion);
router.patch("/:code/toggle", toggle);

export default router;
