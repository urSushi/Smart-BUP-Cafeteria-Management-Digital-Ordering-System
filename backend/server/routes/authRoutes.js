import { Router } from "express";
import { register, login, staffLogin, managerLogin, adminLogin, officerLogin } from "../controllers/authController.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/staff/login", staffLogin);
router.post("/manager/login", managerLogin);
router.post("/admin/login", adminLogin);
router.post("/officer/login", officerLogin);

export default router;
