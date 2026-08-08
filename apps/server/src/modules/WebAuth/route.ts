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

  // What the browser actually uses: the Login Widget navigates here.
  router.get("/telegram/callback", authRateLimiter, controller.loginWithTelegramCallback);

  // The same verification over a JSON body. Nothing in the app calls it — it
  // exists so local development can sign a payload and log in without a public
  // domain and a tunnel (see docs/LocalWebAppGuide.md). Not a second way in: it
  // demands the identical Telegram HMAC, and being a JSON POST with no CORS it
  // can't be triggered cross-origin at all.
  router.post("/telegram", authRateLimiter, requireJsonBody, controller.loginWithTelegram);

  router.get("/session", requireSession, controller.getSession);
  router.post("/logout", requireSession, controller.logout);

  return router;
}
