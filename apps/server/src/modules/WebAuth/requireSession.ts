import type { NextFunction, Request, Response } from "express";
import { sendApiError } from "../WebApi/apiError";
import { readSessionCookie, unsealSession, type TSessionPayload } from "./session";

/** A request that has passed `requireSession` carries the decoded session. */
export type AuthenticatedWebRequest = Request & { session: TSessionPayload };

/**
 * Gate for authenticated routes. A missing, expired, or tampered-with cookie is
 * a 401 — which the client turns into "drop back to the login screen". On
 * success the decoded session (numeric id, hash, name, photo) hangs off the
 * request for the controller.
 */
export function createRequireSession(sessionSecret: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const cookie = readSessionCookie(req.header("cookie"));
    const session = cookie ? unsealSession(cookie, sessionSecret, Date.now()) : null;

    if (!session) {
      sendApiError(res, 401, "unauthorized", "Not signed in");
      return;
    }

    (req as AuthenticatedWebRequest).session = session;
    next();
  };
}
