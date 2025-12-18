import { config } from "dotenv";
import z from "zod";

config({ path: ".env" });

const envSchema = z.object({
  PORT: z.number().optional(),
  TURSO_CONNECTION_URL: z.string(),
  TURSO_AUTH_TOKEN: z.string(),
  JWT_SECRET: z.string(),
  TELEGRAM_BOT_TOKEN: z.string(),
});

export function getEnvironmentVariables() {
  const values = envSchema.parse(process.env);

  return {
    port: values.PORT ?? 3001,

    turso: {
      url: values.TURSO_CONNECTION_URL,
      authToken: values.TURSO_AUTH_TOKEN,
    },

    auth: {
      jwtSecret: values.JWT_SECRET,
      telegramBotToken: values.TELEGRAM_BOT_TOKEN,
    },
  };
}
