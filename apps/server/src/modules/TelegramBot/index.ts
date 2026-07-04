import { timingSafeEqual } from "crypto";
import { Express } from "express";
import TelegramBot from "node-telegram-bot-api";
import { getEnvironmentVariables } from "../../common/config/environment";
import { telegramOnMessage } from "./handlers/onMessage";

/**
 * Constant-time comparison of the secret Telegram echoes back in the
 * `X-Telegram-Bot-Api-Secret-Token` header. Rejects mismatched lengths first
 * (timingSafeEqual throws otherwise) and avoids leaking the secret via timing.
 */
function isValidWebhookSecret(provided: string | undefined, expected: string): boolean {
  if (!provided) {
    return false;
  }

  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export type TMooDuckTelegramLifecycle = {
  shutdownTelegram: () => Promise<void>;
};

export async function setupMooDuckTelegramBot(app: Express): Promise<TMooDuckTelegramLifecycle | undefined> {
  const {
    telegramBot: { token, webhookDomain, webhookPath, webhookSecret },
  } = getEnvironmentVariables();

  if (!token) {
    console.log("⚠️ Telegram bot token is not set");

    return undefined;
  }

  if (webhookDomain && webhookPath) {
    if (!webhookSecret) {
      throw new Error("TELEGRAM_BOT_WEBHOOK_SECRET is required when running the bot in webhook mode");
    }

    const bot = new TelegramBot(token);
    const url = `${webhookDomain}${webhookPath}`;

    app.post(webhookPath, (req, res) => {
      // Only Telegram knows the secret; anyone else POSTing to this path is rejected
      // before we touch the body, the DB, or the (paid) AI.
      if (!isValidWebhookSecret(req.header("x-telegram-bot-api-secret-token"), webhookSecret)) {
        res.sendStatus(401);
        return;
      }

      bot.processUpdate(req.body);
      res.sendStatus(200);
    });

    try {
      await bot.deleteWebHook();
      await bot.setWebHook(url, { secret_token: webhookSecret });

      const info = await bot.getWebHookInfo();
      const me = await bot.getMe();

      console.log(`🤖 Running telegram bot ${me.username ?? "???"} on ${info.url}`);

      if (info.pending_update_count > 0) {
        console.log(`The bot has ${info.pending_update_count} pending updates`);
      }

      listen(bot);
    } catch (error) {
      console.error("❌ Webhook setup failed:", error);
    }

    return {
      shutdownTelegram: async () => {
        const id = setTimeout(() => {
          console.error("Could not close Telegram webhook in time, forcefully shutting down");
          process.exit(1);
        }, 5000);

        try {
          const removed = await bot.deleteWebHook();

          if (removed) {
            console.log("✅ Telegram webhook removed");
          } else {
            console.log("⚠️ Couldn't remove the telegram bot webhook");
          }
        } finally {
          clearTimeout(id);
        }
      },
    };
  }

  const pollingBot = new TelegramBot(token, { polling: true });

  listen(pollingBot);

  console.log(`🤖 Running telegram bot in polling mode`);

  return {
    shutdownTelegram: async () => {
      if (pollingBot.isPolling()) {
        await pollingBot.stopPolling({ cancel: true });
      }
    },
  };
}

function listen(bot: TelegramBot) {
  telegramOnMessage(bot);
}
