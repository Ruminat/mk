import express, { type Express } from "express";
import { getEnvironmentVariables } from "../../common/config/environment";
import { createWebMoodRouter } from "../Mood/webRoute";
import { createWebAuthRouter } from "../WebAuth/route";
import { apiRateLimiter } from "./rateLimit";

/**
 * Mount the web `/api` under one router. Enabled only when both the bot token
 * (its HMAC keys the Login Widget) and `WEB_SESSION_SECRET` (seals the cookie)
 * are present — otherwise the web has no way to mint or read a session, so we
 * register nothing and say why, exactly like the bot's "token not set" branch.
 *
 * Must be called inside `bootstrap()`, AFTER the Telegram webhook route and
 * BEFORE `registerFallbackHandlers()`, or every `/api` call hits the 404
 * catch-all.
 */
export function registerWebApi(app: Express): void {
  const {
    telegramBot: { token },
    web: { sessionSecret },
    isDev,
  } = getEnvironmentVariables();

  if (!token) {
    console.log("⚠️ Web API disabled: TELEGRAM_BOT_TOKEN is not set");
    return;
  }
  if (!sessionSecret) {
    console.log("⚠️ Web API disabled: WEB_SESSION_SECRET is not set");
    return;
  }

  const config = { botToken: token, sessionSecret, secureCookies: !isDev };

  const api = express.Router();
  api.use(apiRateLimiter);
  api.use("/auth", createWebAuthRouter(config));
  api.use("/mood", createWebMoodRouter({ sessionSecret }));

  app.use("/api", api);
  console.log("🌐 Web API mounted at /api");
}
