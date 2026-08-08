import rateLimit from "express-rate-limit";
import { sendApiError } from "./apiError";

const WINDOW_MS = 15 * 60 * 1000;

/**
 * The global IP limiter (100 / 15 min) is too tight for a dashboard that fires
 * 2–3 requests per page load, so `/api` gets its own, roomier limiter. A stricter
 * one guards `POST /api/auth/telegram` to blunt HMAC-guessing noise.
 */
export const apiRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  ipv6Subnet: 56,
  handler: (_req, res) => sendApiError(res, 429, "rate_limited", "Too many requests"),
});

export const authRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  ipv6Subnet: 56,
  handler: (_req, res) => sendApiError(res, 429, "rate_limited", "Too many login attempts"),
});
