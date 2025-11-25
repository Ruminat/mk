import { Router } from "express";
import { addMoodEntry, deleteMoodEntry, listMoodEntries } from "../controllers/moodController";

const router = Router();

router.post("/addMoodEntry", addMoodEntry);
router.post("/deleteMoodEntry", deleteMoodEntry);
router.get("/listMoodEntries", listMoodEntries);

export default router;
