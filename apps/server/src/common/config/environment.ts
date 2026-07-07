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
  // 1-256 chars, only A-Z a-z 0-9 _ - (Telegram's constraint). Required in webhook mode.
  TELEGRAM_BOT_WEBHOOK_SECRET: string()
    .regex(/^[A-Za-z0-9_-]{1,256}$/)
    .optional(),
  TELEGRAM_USER_ID_SECURE_HASH: string().min(1, "TELEGRAM_USER_ID_SECURE_HASH is required"),
  // Separate secret from the identity hash: encrypts user content (mood comments,
  // chat messages) at rest. Must never equal TELEGRAM_USER_ID_SECURE_HASH.
  TELEGRAM_USER_DATA_ENCRYPTION_SECRET: string().min(
    1,
    "TELEGRAM_USER_DATA_ENCRYPTION_SECRET is required",
  ),
  ADMIN_TELEGRAM_LOGINS: string().optional(),
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

function parseAdminTelegramLogins(raw: string | undefined): string[] {
  if (!raw?.trim()) {
    return [];
  }
  return raw
    .split(",")
    .map((login) => login.trim().toLowerCase())
    .filter((login) => login.length > 0);
}

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
      webhookSecret: values.TELEGRAM_BOT_WEBHOOK_SECRET,
      telegramUserIdSecureHash: values.TELEGRAM_USER_ID_SECURE_HASH,
      adminTelegramLogins: parseAdminTelegramLogins(values.ADMIN_TELEGRAM_LOGINS),
    },

    crypto: {
      userDataEncryptionSecret: values.TELEGRAM_USER_DATA_ENCRYPTION_SECRET,
    },

    deepseek: {
      apiKey: values.DEEPSEEK_API_TOKEN,
    },
  };
}
