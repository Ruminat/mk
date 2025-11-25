import { Router } from "express";
import { getUserInfo, uploadUserAvatar } from "../controllers/userController";

const router = Router();

router.get("/getUserInfo", getUserInfo);
router.post("/uploadUserAvatar", uploadUserAvatar);

export default router;
