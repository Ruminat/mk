# Environment Variables

Create `apps/server/.env`. Variables are validated at startup via `common/environment.ts`.

## Required

| Variable     | Description                   |
| ------------ | ----------------------------- |
| `JWT_SECRET` | Secret for signing JWT tokens |

## Database

Either use **local DB** (dev only) or **Turso** (remote).

**Local (dev):** Set `USE_LOCAL_DB=true` with `MODE=dev`. No Turso credentials needed.

| Variable        | Description                                              |
| --------------- | -------------------------------------------------------- |
| `USE_LOCAL_DB`  | `true` or `1` to use local SQLite (only when `MODE=dev`) |
| `LOCAL_DB_PATH` | Path to SQLite file (default: `./data/local.db`)         |

**Turso (remote):** Required when not using local DB.

| Variable               | Description        |
| ---------------------- | ------------------ |
| `TURSO_CONNECTION_URL` | Turso database URL |
| `TURSO_AUTH_TOKEN`     | Turso auth token   |

## Optional

| Variable                       | Description                                   |
| ------------------------------ | --------------------------------------------- |
| `MODE`                         | `dev` or `prod` (default: `dev`)              |
| `PORT`                         | Server port (default: `3001`)                 |
| `TELEGRAM_BOT_TOKEN`           | Telegram bot token for auth                   |
| `TELEGRAM_BOT_WEBHOOK_DOMAIN`  | Webhook base URL (e.g. `https://example.com`) |
| `TELEGRAM_BOT_WEBHOOK_PATH`    | Webhook path (e.g. `/api/telegram/webhook`)   |
| `TELEGRAM_USER_ID_SECURE_HASH` | Hash for encrypting Telegram user IDs         |
| `DEEPSEEK_API_TOKEN`           | API key for DeepSeek AI                       |
