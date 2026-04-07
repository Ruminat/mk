import { Router } from "express";
import { adminController } from "./controller";

const router = Router();

router.get("/getDeployInfo", adminController.getDeployInfo);

export const adminRouter = router;
