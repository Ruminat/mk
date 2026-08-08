import { Router } from "express";
import { authRateLimiter } from "../WebApi/rateLimit";
import { requireJsonBody } from "../WebApi/requireJsonBody";
import { createWebAuthController, type TWebAuthConfig } from "./controller";
import { createRequireSession } from "./requireSession";

/** `/api/auth/*`: the only routes that mint, read, or clear a session. */
export function createWebAuthRouter(config: TWebAuthConfig): Router {
  const controller = createWebAuthController(config);
  const requireSession = createRequireSession(config.sessionSecret);

  const router = Router();

  // The only route that mints a session: the widget's verified payload, posted
  // same-origin by the login page. Local development signs its own payload and
  // posts it here too (see docs/LocalWebAppGuide.md).
  router.post("/telegram", authRateLimiter, requireJsonBody, controller.loginWithTelegram);

  router.get("/session", requireSession, controller.getSession);
  router.get("/avatar", requireSession, controller.getAvatar);
  router.post("/logout", requireSession, controller.logout);

  return router;
}
