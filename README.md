# Mooduck

![MooDuck landing hero](apps/landing/docs/screenshot.png)

Mooduck is a small mood journal: you log how you feel on a 1–10 scale, optionally add a short note, and review your history. It lives entirely in a **Telegram bot**; the backend stores a **hashed Telegram user id**, not a user profile, and encrypts everything you write.

The repo is a **pnpm** + **Turborepo** monorepo.

There is also a **web app** at `mooduck.shrek-labs.dev/app` — a second front door onto the exact same data. It authenticates **only** through the Telegram Login Widget, and writes through the same `moodService` with the same identity hash and encryption as the bot, so a check-in made on the web shows up in the bot's `/last` and vice versa. Both the landing and the web app ship in **English and Russian**.

## Repository layout

| Path | Role |
|------|------|
| `apps/landing` | **mooduck-landing** — React 19 + Next.js (App Router) marketing site, Tailwind CSS v4 + CSS Modules; localized (`/en`, `/ru`) static export (`out/`) served by nginx |
| `apps/web` | **mooduck-web** — the dashboard: Vite + React 19, CSS Modules, ECharts; Telegram-only auth; built to `dist/` and served by nginx at `/app` |
| `apps/server` | **mooduck-server** — the Telegram bot + web `/api`: Express, Drizzle ORM, SQLite (Turso in production or a local file in dev) |
| `packages/core` | Shared non-UI utilities and the locale primitives (`Locale`, `Null`, `Number`, `Random`, …) |
| `packages/contracts` | Shared wire format (Zod schemas + types) the server and web validate against |

## Prerequisites

- [Node.js](https://nodejs.org/) (CI uses 22; match or exceed that locally)
- [pnpm](https://pnpm.io/) **9.x** or newer (`package.json` pins the workspace package manager)

## Install

```sh
pnpm install
```

## Environment

Server configuration is validated in `apps/server/src/common/config/environment.ts` (see also `apps/server/docs/env.md`). At minimum you need:

- **`TELEGRAM_USER_ID_SECURE_HASH`** — secret the user identity hash is derived from
- **`TELEGRAM_USER_DATA_ENCRYPTION_SECRET`** — secret that encrypts mood comments and chat messages at rest. Must differ from the one above, and rotating it makes existing data undecryptable
- **Database** — either Turso (`TURSO_CONNECTION_URL`, `TURSO_AUTH_TOKEN`) or, in dev only, `USE_LOCAL_DB=true` with optional `LOCAL_DB_PATH` (defaults to `data/local.db` under the server app)

Optional but used when you enable those features:

- **Telegram** — `TELEGRAM_BOT_TOKEN` plus the webhook settings (without a token the bot simply doesn't start)
- **Web API** — `WEB_SESSION_SECRET` (≥32 chars, different from the two secrets above) enables the web `/api`; the app also needs `TELEGRAM_BOT_TOKEN`
- **DeepSeek** — `DEEPSEEK_API_TOKEN` for AI-assisted replies

Copy or create `.env` under `apps/server` as you normally would for local work.

The web app (`apps/web`) reads one build-time variable, `VITE_TELEGRAM_BOT_USERNAME`, the bot username the Login Widget renders for. The widget only works on the domain registered with BotFather (`/setdomain`) and **will not render on `localhost`** — there is deliberately no dev bypass, so local development uses a separate dev bot pointed at an HTTPS tunnel (`Secure` cookies need HTTPS).

📖 **[Testing the web app locally](docs/LocalWebAppGuide.md)** — how to run the dashboard on your machine, including how to sign in without a tunnel.

## Common scripts (repo root)

| Script | What it does |
|--------|----------------|
| `pnpm dev` | Runs Turborepo `dev` (server + landing and related packages, with `MODE=dev`) |
| `pnpm dev.landing` | Dev for the Next.js landing site only (`http://localhost:3002`) |
| `pnpm dev.server` | Dev for the bot server only |
| `pnpm --filter mooduck-web dev` | Dev for the web app (`http://localhost:5173/app`; proxies `/api` to `:3001`) |
| `pnpm dev.local` | Server dev with **`USE_LOCAL_DB=true`** (local SQLite file) |
| `pnpm build` | Production build (`MODE=prod`) |
| `pnpm typecheck` | Typecheck across the workspace |
| `pnpm test` | Tests (where configured; server uses Vitest) |
| `pnpm db.push.local` / `pnpm db.migrate.local` / `pnpm db.studio.local` | Drizzle against the local DB (dev + `USE_LOCAL_DB`) |
| `pnpm db.push` / `pnpm db.migrate` / `pnpm db.studio` | Drizzle against configured remote DB |

Package-specific scripts (lint, `test.watch`, etc.) live in each `package.json`.

Running the web app needs the server up as well, plus a way past Telegram-only auth — see [Testing the web app locally](docs/LocalWebAppGuide.md).

## Production process

- **`pnpm start`** — Turborepo `start` for production-oriented entrypoints.
- **`pnpm start.server`** — Run the built server bundle only.
- **`pnpm pm2.start`** / **`pnpm pm2.restart`** — PM2 helpers using `ecosystem.config.js`.

CI (`.github/workflows/deploy.yml`) installs with a frozen lockfile, runs `pnpm run codecheck` (typecheck + placeholder lint), then deploys to a VPS via SSH and `./deploy.sh` on the host.

## Tech stack (short)

- **Landing:** React 19, Next.js (App Router, static export), Tailwind CSS v4 + CSS Modules
- **Web app:** Vite, React 19, TypeScript, CSS Modules, ECharts, Zod (via `@mooduck/contracts`)
- **Server:** Express, Drizzle + libSQL/Turso, Zod, optional `node-telegram-bot-api` and OpenAI-compatible client for DeepSeek
- **Repo:** Turborepo, Prettier at the root

---

Internal conventions (types vs interfaces, no barrel re-exports, module layout) are documented in `.cursorrules` for contributors.
