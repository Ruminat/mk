# Testing the web app locally

The web app (`apps/web`) is a Vite SPA that talks to the server's `/api`. Both have to be running,
and you have to get past Telegram-only auth — which is the only fiddly part, because the Telegram
Login Widget **refuses to render on `localhost`**.

There are two ways to work around that:

- **[The quick way](#the-quick-way-no-telegram-no-tunnel)** — sign the login payload yourself with
  the bot token. No tunnel, no BotFather. Use this 95% of the time.
- **[The full way](#the-full-way-real-telegram-login)** — a dev bot behind an HTTPS tunnel, so you
  click the real blue button. Use this when you're changing the login screen itself.

---

## One-time setup

### 1. Install

```sh
pnpm install
```

### 2. Add `WEB_SESSION_SECRET` to `apps/server/.env`

The web `/api` refuses to mount without it. It must be **≥32 characters** and **different** from
`TELEGRAM_USER_ID_SECURE_HASH` and `TELEGRAM_USER_DATA_ENCRYPTION_SECRET` — the env schema
enforces both rules and the server won't boot otherwise.

```sh
echo "WEB_SESSION_SECRET=$(openssl rand -hex 32)" >> apps/server/.env
```

### 3. Create the local database

Never point local development at Turso. `USE_LOCAL_DB=true` (which the `*.local` scripts set for
you) uses a plain SQLite file at `apps/server/data/local.db`, which is gitignored.

```sh
pnpm db.migrate.local
```

> **Use a dev bot token.** `TELEGRAM_BOT_TOKEN` in `apps/server/.env` does double duty: the bot
> uses it to talk to Telegram, and the web API uses its SHA-256 as the HMAC key for login. Running
> locally with the *production* token starts a second consumer of the same bot's updates. Make a
> throwaway bot with [@BotFather](https://t.me/BotFather) and use that token instead.

---

## The quick way (no Telegram, no tunnel)

### 1. Start the server

```sh
pnpm dev.local
```

Wait for these two lines — if the second one is missing, the API isn't mounted:

```
🌐 Web API mounted at /api
💾 Using local SQLite database
```

### 2. Start the web app

In a second terminal:

```sh
pnpm --filter mooduck-web dev
```

It serves at **<http://localhost:5173/app/>** (note the `/app/` — `base` is set for nginx) and
proxies `/api` to `localhost:3001`, so the browser sees one origin and the session cookie works.

### 3. Mint a login payload

The widget won't render on localhost, but nothing stops you from producing the exact payload it
would have produced. This is not a backdoor: it needs the bot token, and the server verifies the
same HMAC it would for a real login.

Save this outside the repo, e.g. `/tmp/mooduck-login.mjs`:

```js
import { createHash, createHmac } from "node:crypto";
import { readFileSync } from "node:fs";

const ENV_PATH = "apps/server/.env";
const TELEGRAM_ID = Number(process.argv[2] ?? 777000);

const token = readFileSync(ENV_PATH, "utf8")
  .split("\n")
  .map((line) => line.trim())
  .find((line) => line.startsWith("TELEGRAM_BOT_TOKEN="))
  ?.slice("TELEGRAM_BOT_TOKEN=".length)
  .replace(/^["']|["']$/g, "");

if (!token) throw new Error(`TELEGRAM_BOT_TOKEN not found in ${ENV_PATH}`);

const payload = {
  id: TELEGRAM_ID,
  first_name: "Vlad",
  username: "local_dev",
  auth_date: Math.floor(Date.now() / 1000),
};

// Login Widget signing: secret_key = SHA256(bot_token).
// (Mini Apps use HMAC(bot_token, "WebAppData") instead — different thing.)
const dataCheckString = Object.keys(payload)
  .sort()
  .map((key) => `${key}=${payload[key]}`)
  .join("\n");

payload.hash = createHmac("sha256", createHash("sha256").update(token).digest())
  .update(dataCheckString)
  .digest("hex");

console.log(JSON.stringify(payload));
```

Run it from the repo root:

```sh
node /tmp/mooduck-login.mjs
```

`auth_date` is checked against a 15-minute window, so re-run it if you leave it sitting.

### 4. Sign in

Open <http://localhost:5173/app/>, open the devtools console, and run this with the JSON from the
previous step pasted in:

```js
await fetch("/api/auth/telegram", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: '<paste the JSON here>',
}).then((r) => r.json());

location.reload();
```

The request has to come **from the page** so the browser stores the `Set-Cookie`. The cookie is
`HttpOnly; SameSite=Strict`, and `Secure` is omitted in dev so plain HTTP works.

### 5. What you should see

The dashboard: header with your name and the `EN / RU` switch, the 1–10 check-in card, three stat
tiles, the mood chart and the Recent list. A fresh account shows `—` in the tiles and
"Not enough check-ins to plot yet" in the chart card — the chart needs two entries.

Save a check-in and it should appear in Recent immediately, with the tiles updating.

---

## Checking it against the bot

This is the test that actually matters: the web is supposed to be a second front door onto the
bot's data, not a parallel universe.

1. Get your real numeric Telegram id from [@userinfobot](https://t.me/userinfobot).
2. Mint a payload for **that** id: `node /tmp/mooduck-login.mjs 123456789`.
3. Sign in and save a check-in on the web.
4. Message your dev bot `/last`.

The web entry should be in the bot's list, comment and all. It works because both sides key
everything on `getTelegramUserIdSecureHash(id)` and encrypt with a key derived from the same
numeric id — so the identity hash and the ciphertext match by construction, not by convention.

You can confirm the encryption is real:

```sh
cd apps/server && node -e '
const { createClient } = require("@libsql/client");
createClient({ url: "file:" + process.cwd() + "/data/local.db" })
  .execute("select id, value, substr(comment, 1, 30) as comment from mood_entries")
  .then((r) => { console.log(r.rows); process.exit(0); });
'
```

The `comment` column should read `__v1:<base64 noise>`, never your plaintext.

---

## The full way (real Telegram login)

Only needed when you're working on the login screen itself.

1. **Make a dev bot** with [@BotFather](https://t.me/BotFather) and put its token in
   `apps/server/.env`.
2. **Start an HTTPS tunnel to the Vite dev server** (port 5173, not 3001 — Vite proxies `/api`):
   ```sh
   cloudflared tunnel --url http://localhost:5173
   ```
   Note the hostname it prints, e.g. `something-random.trycloudflare.com`.
3. **Register the domain**: send BotFather `/setdomain`, pick your dev bot, and give it that
   hostname (host only, no path, no scheme). Without this the widget silently renders nothing.
4. **Tell Vite the host is allowed** and give the app the bot username:
   ```sh
   # apps/web/.env.local
   VITE_TELEGRAM_BOT_USERNAME=your_dev_bot
   ```
   ```sh
   VITE_DEV_TUNNEL_HOST=something-random.trycloudflare.com pnpm --filter mooduck-web dev
   ```
   Vite 7 rejects unknown `Host` headers with "This host is not allowed" otherwise.
5. Open `https://something-random.trycloudflare.com/app/` and click the button.

The tunnel hostname changes every restart, so you'll be re-running `/setdomain` — which is most of
why the quick way exists.

---

## Poking the API directly

| Method | Path | Body |
|---|---|---|
| `POST` | `/api/auth/telegram` | signed Login Widget payload |
| `GET` | `/api/auth/session` | — |
| `POST` | `/api/auth/logout` | — |
| `GET` | `/api/mood/entries?limit=360` | — |
| `POST` | `/api/mood/entries` | `{ "value": 1..10, "comment": "optional" }` |

`POST /api/auth/telegram` is the one route that mints a session, and it's the same one the
real login page uses — the widget hands its verified payload to the browser, which posts it
here. That's why signing a payload yourself is enough to log in locally.

With a cookie jar:

```sh
node /tmp/mooduck-login.mjs > /tmp/payload.json

curl -s -c /tmp/jar -X POST http://localhost:3001/api/auth/telegram \
  -H 'Content-Type: application/json' -d @/tmp/payload.json

curl -s -b /tmp/jar -X POST http://localhost:3001/api/mood/entries \
  -H 'Content-Type: application/json' -d '{"value":7,"comment":"quiet morning"}'

curl -s -b /tmp/jar 'http://localhost:3001/api/mood/entries?limit=5'
```

Every failure returns the same envelope — `{"error":{"code":"unauthorized","message":"..."}}` —
with `code` from a fixed union, because the client owns all the user-facing copy.

---

## Troubleshooting

**`⚠️ Web API disabled: WEB_SESSION_SECRET is not set`** — step 2 of the one-time setup. The same
line appears for a missing `TELEGRAM_BOT_TOKEN`.

**Server won't boot, `WEB_SESSION_SECRET must differ from ...`** — you reused one of the other two
secrets. Generate a fresh one.

**Server won't boot, `PORT: expected number, received string`** — don't set `PORT` in `.env` or on
the command line. It's typed as a number and env vars are always strings, so setting it at all
crashes startup. The default 3001 is what the Vite proxy expects anyway.

**"The Telegram login button couldn't load"** — expected on localhost without
`VITE_TELEGRAM_BOT_USERNAME`. Use the quick way, or set up the tunnel.

**401 on everything after signing in** — you're probably hitting `localhost:3001` from a page
served at `localhost:5173`. The cookie is `SameSite=Strict`; go through the Vite proxy (relative
`/api/...` URLs) so it's one origin.

**Vite says "This host is not allowed"** — set `VITE_DEV_TUNNEL_HOST` to the tunnel hostname.

**Login returns 401 with a payload that worked a minute ago** — `auth_date` is only good for 15
minutes. Re-mint it.

**The chart is empty** — it needs at least two entries. That's deliberate; a one-point line chart
says nothing.

---

## Resetting

```sh
rm apps/server/data/local.db
pnpm db.migrate.local
```

Logging out (or changing `WEB_SESSION_SECRET`) invalidates the cookie without touching data.

## Before you push

```sh
pnpm typecheck
pnpm test
```
