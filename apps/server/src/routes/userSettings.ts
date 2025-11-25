import { Router } from "express";
import { updateSettings, getSettings } from "../controllers/userSettingsController";

const router = Router();

router.post("/updateSettings", updateSettings);
router.get("/getSettings", getSettings);

export default router;
