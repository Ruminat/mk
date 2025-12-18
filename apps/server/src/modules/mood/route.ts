import { Router } from "express";
import { authenticate } from "../auth/middleware";
import { moodController } from "./controller";

const router = Router();

router.post("/addMoodEntry", authenticate, moodController.addMoodEntry);
router.post("/deleteMoodEntry", authenticate, moodController.deleteMoodEntry);
router.get("/listMoodEntries", authenticate, moodController.listMoodEntries);

export const moodRouter = router;
