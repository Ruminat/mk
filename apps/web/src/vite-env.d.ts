/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Telegram bot username for the Login Widget (`data-telegram-login`). */
  readonly VITE_TELEGRAM_BOT_USERNAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
