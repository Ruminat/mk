import { Express } from "express";
import TelegramBot from "node-telegram-bot-api";
import { getEnvironmentVariables } from "../../common/environment";
import { telegramOnMessage } from "./handlers/onMessage";

export type TMooDuckTelegramLifecycle = {
  shutdownTelegram: () => Promise<void>;
};

export async function setupMooDuckTelegramBot(app: Express): Promise<TMooDuckTelegramLifecycle | undefined> {
  const {
    telegramBot: { token, webhookDomain, webhookPath },
  } = getEnvironmentVariables();

  if (!token) {
    console.log("⚠️ Telegram bot token is not set");

    return undefined;
  }

  if (webhookDomain && webhookPath) {
    const bot = new TelegramBot(token);
    const url = `${webhookDomain}${webhookPath}`;

    app.post(webhookPath, (req, res) => {
      bot.processUpdate(req.body);
      res.sendStatus(200);
    });

    try {
      await bot.deleteWebHook();
      await bot.setWebHook(url);

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
