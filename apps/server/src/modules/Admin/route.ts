import { Router } from "express";
import { authenticate, requireAdmin } from "../Auth/middleware";
import { adminController } from "./controller";

const router = Router();

router.get("/getDeployInfo", authenticate, requireAdmin, adminController.getDeployInfo);

export const adminRouter = router;
