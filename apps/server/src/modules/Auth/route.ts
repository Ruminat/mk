import { Router } from "express";
import { authController } from "./controller";
import { authenticate } from "./middleware";

const router = Router();

// Public routes
router.post("/telegram/signin", authController.signInWithTelegram);
router.post("/email/signup", authController.signUpWithEmail);
router.post("/email/signin", authController.signInWithEmail);

// Protected routes
router.get("/me", authenticate, authController.getMe);

export const authRouter = router;
