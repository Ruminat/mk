import type { NextFunction, Request, Response } from "express";
import { sendApiError } from "./apiError";

/**
 * Belt-and-braces CSRF defence for mutating routes: with `SameSite=Strict` and a
 * JSON-only body, a cross-site form POST (which can't set `application/json`)
 * can't reach the handler. `express.json` already only parses this content type;
 * this rejects anything else outright instead of running with an empty body.
 */
export function requireJsonBody(req: Request, res: Response, next: NextFunction): void {
  const contentType = req.header("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    sendApiError(res, 415, "invalid_input", "Content-Type must be application/json");
    return;
  }
  next();
}
