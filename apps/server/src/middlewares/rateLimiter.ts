import rateLimit from "express-rate-limit";
import { getEnvironmentVariables } from "../common/environment";

const {
  telegramBot: { webhookPath },
} = getEnvironmentVariables();

export const rateLimiter = {
  default: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: "draft-8", // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
    skip: (req) => {
      // Ignore Telegram webhook path
      return Boolean(webhookPath && req.originalUrl.startsWith(webhookPath));
    },
  }),

  auth: rateLimit({
    windowMs: 5 * 60 * 1000,
    limit: 5,
    message: "Too many login attempts, please try again later",
  }),
};
