# Environment Variables

Create `apps/server/.env`. Variables are validated at startup via `common/environment.ts`.

## Required

| Variable                       | Description                                                                                     |
| ------------------------------ | ----------------------------------------------------------------------------------------------- |
| `TELEGRAM_USER_ID_SECURE_HASH` | Secret used to derive the user identity hash (the key everything is stored under) |
| `TELEGRAM_USER_DATA_ENCRYPTION_SECRET` | Secret used to encrypt user content at rest (mood comments, chat messages) via AES-256-GCM. **Must be different from `TELEGRAM_USER_ID_SECURE_HASH`.** Rotating it makes existing ciphertext undecryptable — treat as permanent and back it up. |

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

## Web API

The web app's `/api` is enabled only when **both** `TELEGRAM_BOT_TOKEN` (its HMAC
verifies the Telegram Login Widget) and `WEB_SESSION_SECRET` are set; otherwise
the routes aren't registered and a warning is logged. The numeric telegram id is
never persisted — it lives only inside the sealed session cookie.

| Variable             | Description                                                                                                                                                                                       |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `WEB_SESSION_SECRET` | Seals the web session cookie (AES-256-GCM key via HKDF). **≥32 chars, and must differ from `TELEGRAM_USER_ID_SECURE_HASH` and `TELEGRAM_USER_DATA_ENCRYPTION_SECRET`.** Rotating it logs everyone out. |
| `WEB_APP_ORIGIN`     | Optional. Only needed if the app is ever served from a different host than the API; absent ⇒ same-origin, no CORS.                                                                                |

## Optional

| Variable                       | Description                                   |
| ------------------------------ | --------------------------------------------- |
| `MODE`                         | `dev` or `prod` (default: `dev`)              |
| `PORT`                         | Server port (default: `3001`)                 |
| `TELEGRAM_BOT_TOKEN`           | Telegram bot token. Also required for the web API (its HMAC keys the Login Widget). |
| `TELEGRAM_BOT_WEBHOOK_DOMAIN`  | Webhook base URL (e.g. `https://example.com`) |
| `TELEGRAM_BOT_WEBHOOK_PATH`    | Webhook path (e.g. `/api/telegram/webhook`)   |
| `TELEGRAM_BOT_WEBHOOK_SECRET`  | Secret token validated on every webhook request (`A-Z a-z 0-9 _ -`, 1-256 chars). **Required in webhook mode.** |
| `ADMIN_TELEGRAM_LOGINS`        | Comma-separated Telegram **@usernames** (without `@`) allowed to use `/debug` |
| `DEEPSEEK_API_TOKEN`           | API key for DeepSeek AI                       |
