import { Router } from "express";
import { listStaff, addStaff, removeStaff, listAllUsers } from "../controllers/staffController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", requireAuth, listStaff);
router.post("/", requireAuth, addStaff);
router.delete("/:identifier", requireAuth, removeStaff);
router.get("/all-users", requireAuth, listAllUsers);

export default router;
