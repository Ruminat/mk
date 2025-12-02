// const response = await db.select().from(usersTable);

import { Router } from "express";
import { moodController } from "./controller";

const router = Router();

router.post("/addMoodEntry", moodController.addMoodEntry);
router.post("/deleteMoodEntry", moodController.deleteMoodEntry);
router.get("/listMoodEntries", moodController.listMoodEntries);

export const moodRouter = router;
