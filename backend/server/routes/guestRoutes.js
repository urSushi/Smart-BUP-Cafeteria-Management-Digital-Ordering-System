import { Router } from "express";
import { guestRegister } from "../controllers/guestController.js";

const router = Router();

router.post("/guest-register", guestRegister);

export default router;
