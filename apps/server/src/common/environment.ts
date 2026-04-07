import { config } from "dotenv";
import path from "path";
import z, { number, object, string, url } from "zod";

config({ path: ".env" });

const envSchema = object({
  MODE: z.enum(["prod", "dev"]).optional(),
  PORT: number().optional(),
  USE_LOCAL_DB: z.string().optional().transform((v) => v === "true" || v === "1"),
  LOCAL_DB_PATH: string().optional(),
  TURSO_CONNECTION_URL: string().optional(),
  TURSO_AUTH_TOKEN: string().optional(),
  JWT_SECRET: string(),
  TELEGRAM_BOT_TOKEN: string().optional(),
  TELEGRAM_BOT_WEBHOOK_DOMAIN: url().optional(),
  TELEGRAM_BOT_WEBHOOK_PATH: string()
    .regex(/(\/\w+)+/)
    .optional(),
  TELEGRAM_USER_ID_SECURE_HASH: string().optional(),
  DEEPSEEK_API_TOKEN: string().optional(),
}).refine(
  (data) => {
    const isDev = (data.MODE ?? "dev") === "dev";
    const useLocalDb = data.USE_LOCAL_DB && isDev;
    if (useLocalDb) return true;
    return !!(data.TURSO_CONNECTION_URL && data.TURSO_AUTH_TOKEN);
  },
  {
    message:
      "Either USE_LOCAL_DB=true with MODE=dev, or TURSO_CONNECTION_URL and TURSO_AUTH_TOKEN are required",
  },
);

const values = envSchema.parse(process.env);

export function getEnvironmentVariables() {
  const isDev = (values.MODE ?? "dev") === "dev";
  const useLocalDb = values.USE_LOCAL_DB && isDev;
  const localDbPath =
    values.LOCAL_DB_PATH ?? path.join(process.cwd(), "data", "local.db");

  return {
    isDev,
    port: values.PORT ?? 3001,

    useLocalDb,
    localDbPath,

    turso: {
      url: values.TURSO_CONNECTION_URL ?? "",
      authToken: values.TURSO_AUTH_TOKEN ?? "",
    },

    auth: {
      jwtSecret: values.JWT_SECRET,
      telegramBotToken: values.TELEGRAM_BOT_TOKEN,
    },

    telegramBot: {
      token: values.TELEGRAM_BOT_TOKEN,
      webhookDomain: values.TELEGRAM_BOT_WEBHOOK_DOMAIN,
      webhookPath: values.TELEGRAM_BOT_WEBHOOK_PATH,
      telegramUserIdSecureHash: values.TELEGRAM_USER_ID_SECURE_HASH,
    },

    deepseek: {
      apiKey: values.DEEPSEEK_API_TOKEN,
    },
  };
}
