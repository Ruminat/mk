import { config } from "dotenv";
import z, { number, object, string, url } from "zod";

config({ path: ".env" });

const envSchema = object({
  MODE: z.enum(["prod", "dev"]).optional(),
  PORT: number().optional(),
  TURSO_CONNECTION_URL: string(),
  TURSO_AUTH_TOKEN: string(),
  JWT_SECRET: string(),
  TELEGRAM_BOT_TOKEN: string().optional(),
  TELEGRAM_BOT_WEBHOOK_DOMAIN: url().optional(),
  TELEGRAM_BOT_WEBHOOK_PATH: string()
    .regex(/(\/\w+)+/)
    .optional(),
});

export function getEnvironmentVariables() {
  const values = envSchema.parse(process.env);

  return {
    isDev: (values.MODE ?? "dev") === "dev",
    port: values.PORT ?? 3001,

    turso: {
      url: values.TURSO_CONNECTION_URL,
      authToken: values.TURSO_AUTH_TOKEN,
    },

    auth: {
      jwtSecret: values.JWT_SECRET,
      telegramBotToken: values.TELEGRAM_BOT_TOKEN,
    },

    telegramBot: {
      token: values.TELEGRAM_BOT_TOKEN,
      webhookDomain: values.TELEGRAM_BOT_WEBHOOK_DOMAIN,
      webhookPath: values.TELEGRAM_BOT_WEBHOOK_PATH,
    },
  };
}
