import rateLimit from "express-rate-limit";
import { getEnvironmentVariables } from "../common/config/environment";

const {
  telegramBot: { webhookPath },
} = getEnvironmentVariables();

/**
 * The server exposes only `/health` and the Telegram webhook now, and the
 * webhook is exempt — so this is cheap insurance against someone hammering the
 * process with junk, not a limit anything legitimate can reach. The bot's own
 * per-user throttling is a separate thing (see `PerUserRateLimiter`).
 */
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: "draft-8", // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
  skip: (req) => {
    // Telegram is not a stranger, and its update rate is its own business.
    return Boolean(webhookPath && req.originalUrl.startsWith(webhookPath));
  },
});
