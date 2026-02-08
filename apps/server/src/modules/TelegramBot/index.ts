import { Express } from "express";
import TelegramBot from "node-telegram-bot-api";
import { getEnvironmentVariables } from "../../common/environment";
import { telegramOnMessage } from "./handlers/onMessage";

export async function setupMooDuckTelegramBot(app: Express) {
  const {
    telegramBot: { token, webhookDomain, webhookPath },
  } = getEnvironmentVariables();

  if (!token) {
    console.log("⚠️ Telegram bot token is not set");

    return;
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

    process.on("SIGTERM", async () => {
      const id = setTimeout(() => {
        console.error("Could not close connections in time, forcefully shutting down");
        process.exit(1);
      }, 5000);

      const removed = await bot.deleteWebHook();

      if (removed) {
        console.log("✅ Telegram webhook removed");
      } else {
        console.log("⚠️ Couldn't remove the telegram bot");
      }

      clearTimeout(id);
    });
  } else {
    const pollingBot = new TelegramBot(token, { polling: true });

    listen(pollingBot);

    console.log(`🤖 Running telegram bot in polling mode`);
  }
}

function listen(bot: TelegramBot) {
  telegramOnMessage(bot);
}
