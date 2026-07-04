import { Router } from "express";
import { authController } from "./controller";
import { authenticate } from "./middleware";

const router = Router();

// Public routes
router.post("/telegram/signin", authController.signInWithTelegram);

// Protected routes
router.get("/me", authenticate, authController.getMe);

export const authRouter = router;
