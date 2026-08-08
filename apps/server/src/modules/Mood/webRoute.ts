import { type NextFunction, type Request, type Response, Router } from "express";
import { PerUserRateLimiter } from "../../common/rateLimiter/rateLimiter";
import { sendApiError } from "../WebApi/apiError";
import { requireJsonBody } from "../WebApi/requireJsonBody";
import { type AuthenticatedWebRequest, createRequireSession } from "../WebAuth/requireSession";
import { webMoodController } from "./webController";

export type TWebMoodConfig = {
  sessionSecret: string;
};

/** Per-identity write throttle: a real person doesn't check in 20 times a minute. */
function createWriteThrottle() {
  const limiter = new PerUserRateLimiter({ points: 20, durationSec: 60 });
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { session } = req as AuthenticatedWebRequest;
    const allowed = await limiter.tryConsume(session.hash);
    if (!allowed) {
      sendApiError(res, 429, "rate_limited", "Too many check-ins, give it a minute");
      return;
    }
    next();
  };
}

/** `/api/mood/*`: read and append mood entries for the signed-in user. */
export function createWebMoodRouter(config: TWebMoodConfig): Router {
  const requireSession = createRequireSession(config.sessionSecret);
  const throttleWrites = createWriteThrottle();

  const router = Router();
  router.get("/entries", requireSession, webMoodController.listEntries);
  router.post("/entries", requireSession, throttleWrites, requireJsonBody, webMoodController.addEntry);

  return router;
}
