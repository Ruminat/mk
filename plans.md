# Feature Plans

Structured roadmap for upcoming work. Each section lists goals, current state, scope, and acceptance criteria.

---

## 1. Internationalization (i18n)

### Goal

Make **English the primary language** across the product. Russian becomes a **secondary locale**, used only when the user clearly prefers it.

### Language selection rules

Use Russian when **either** condition is true:

1. **The user writes in Russian** — detect language from the incoming message text.
2. **Telegram reports Russian as the user's app language** — read `language_code` from the Telegram `User` object (`message.from.language_code` in bot updates, same field in Login Widget auth data).

Reference: [Telegram Bot API — User](https://core.telegram.org/bots/api#user) (`language_code` is an optional IETF language tag, e.g. `en`, `en-US`, `ru`, `ru-RU`).

Otherwise, default to English.

Notes on `language_code`:

- It reflects the language set in the user's Telegram client, not keyboard layout.
- The field is optional — when missing, fall back to message-language detection, then to English.
- Treat any tag starting with `ru` (e.g. `ru`, `ru-RU`) as Russian.

### Current state

| Area | Language today |
| --- | --- |
| `apps/server` — Telegram bot replies, errors, commands | Russian |
| `apps/server` — AI system/user prompts (`Mood/prompts`, `TelegramBot/prompts`) | Russian |
| `apps/server` — validation messages (`Mood/schema.ts`, etc.) | Russian |
| `apps/landing`, `apps/web` | English |

### Scope

1. **Extract all user-facing strings** from the server (bot commands, handlers, validation errors, truncation suffixes, stat/last formatting).
2. **Extract AI prompt templates** — keep prompt *structure* stable; parameterize locale-specific tone/instructions.
3. **Introduce a small i18n layer** (e.g. `common/i18n/` or per-module locale files):
   - `en` — default catalog
   - `ru` — secondary catalog
   - Helper: `t(key, locale, params?)` or equivalent
4. **Resolve locale per request** in the Telegram bot flow:
   - Input: `message.from.language_code`, message text
   - Output: `"en" | "ru"`
   - Pass locale through command handlers and AI prompt builders
5. **Message-language detection** for the "user writes in Russian" rule — lightweight heuristic or library; only needed when `language_code` is absent or non-Russian but the message is clearly Russian.
6. **Web/API** — English by default; optionally honor `Accept-Language` later (lower priority than the bot).

### Out of scope (for now)

- Translating `ignored/` working docs (those stay in Russian per project convention).
- Localizing the landing page (already English).

### Acceptance criteria

- [x] Default bot experience is English for a user with `language_code: "en"` writing in English.
- [x] Bot responds in Russian when `language_code` starts with `ru`, even if the user writes in English.
- [x] Bot responds in Russian when the user writes in Russian, even if `language_code` is missing or non-Russian.
- [x] AI replies follow the same locale as bot UI strings in the same turn (prompts are localized per turn and instruct the model to answer in that language).
- [x] No hard-coded Russian (or English) strings left in bot handlers/commands — all go through the `common/i18n` layer.

---

## 2. Identity hashing — `telegramId`, not `telegramLogin`

### Goal

Ensure **every persistent user key** is derived from the numeric **Telegram user id** (`telegramId` / `message.from.id`), never from `username` (`telegramLogin`). Usernames can change at any time; if they were used as identity, all mood entries and chat history would be orphaned.

### Current state

**Already correct for mood & chat history:**

- `getTelegramUserIdSecureHash(userId: number)` in `common/telegram/telegramUserId.ts` hashes the numeric id via HMAC-SHA256.
- Bot flow: `getTelegramUserIdHash(props)` reads `message.from.id` → hash.
- `MoodTable.telegramUserIdHash`, `TelegramChatMessageTable.telegramUserIdHash`, and `UserTable.id` (after #1 fix) all use this hash.

**`telegramLogin` / `username` usage today (non-identity, OK to keep):**

- Admin checks: `isAdminTelegramLogin(username)` — compares against `ADMIN_TELEGRAM_LOGINS` env list.
- Debug formatting: show prompt to admins only.

**Gaps to fix:**

| Location | Issue |
| --- | --- |
| `Auth/service.ts` | Looks up / inserts users by plain `UserTable.telegramId` (numeric id stored in DB). |
| `UserTable.telegramId` column | Stores the raw numeric Telegram id — conflicts with the "never store telegramId" rule (see §3). |
| Legacy prod data | Old web users may have `id = telegram_<id>` instead of the secure hash (see `ignored/progress.md`). |

### Scope

1. **Audit** the entire codebase for any identity keyed on `username`, `telegramLogin`, or `telegram_<id>` string prefixes.
2. **Remove `UserTable.telegramId`** (or stop writing/reading it) — user lookup must go through `id` (= secure hash) only.
3. **Auth sign-in flow** — after Telegram auth, resolve the user by `getTelegramUserIdSecureHash(authData.id)`, not by plain `telegramId`.
4. **Data migration** (if prod has legacy rows):
   - Re-key `users.id` from `telegram_<id>` → `getTelegramUserIdSecureHash(id)`.
   - Re-key `mood_entries.telegram_user_id_hash` the same way.
   - Re-key `telegram_chat_messages.telegram_user_id_hash` the same way.
5. **Document** in code comments: `username` is display/admin-only; never use it for storage keys.

### Acceptance criteria

- [x] Grep for `username` / `telegramLogin` shows no usage as a DB key or hash input (only admin/display/in-transit).
- [x] No plain numeric `telegramId` persisted anywhere in the database (`users.telegram_id` column dropped — migration `0003_tough_dakota_north.sql`).
- [x] Web sign-in and bot resolve to the same hash for the same person (sign-in now looks up/creates by `getTelegramUserIdSecureHash(authData.id)`).
- [x] Existing prod data — N/A: there are no web users/entries, and bot data was always keyed by the secure hash (never `telegram_<id>`), so there is no legacy identity data to re-key. (A one-off re-key script was written and verified, then removed as dead code once we confirmed no legacy rows exist.)

---

## 3. Encryption of user notes and messages

### Goal

Encrypt **user-generated text at rest** (mood comments, chat history messages) so that a DB leak does not expose plaintext. Encryption key material is derived from the user's **numeric `telegramId`** plus a **server secret** — not from the stored hash.

### Security model

```
encrypt(plaintext, deriveKey(telegramId, ENCRYPTION_SECRET)) → ciphertext  → stored in DB
decrypt(ciphertext, deriveKey(telegramId, ENCRYPTION_SECRET)) → plaintext  → only in memory at request time
```

| What | Stored in DB | Never stored |
| --- | --- | --- |
| User identity (lookup key) | `telegramUserIdHash` = HMAC(telegramId, HASH_SECRET) | — |
| User content (comments, chat text) | Ciphertext | Plaintext |
| Raw Telegram user id | — | `telegramId` (only available live from Telegram API / auth payload) |

Important distinction:

- **Hash secret** (`TELEGRAM_USER_ID_SECURE_HASH`) — one-way identity; used for row lookup and rate limiting.
- **Encryption secret** (new env var, e.g. `TELEGRAM_USER_DATA_ENCRYPTION_SECRET`) — symmetric encryption; must be separate from the hash secret.

Use a **proven crypto library** (project rule: no hand-rolled crypto). Prefer Node `crypto` (`createCipheriv` / `createDecipheriv` with AES-256-GCM, or `scrypt`/`hkdf` for key derivation).

### Fields to encrypt

| Table | Column | Content |
| --- | --- | --- |
| `mood_entries` | `comment` | User mood notes |
| `telegram_chat_messages` | `text` | User and assistant messages in chat history |

Non-sensitive fields (`value`, `role`, timestamps, hashes) stay plaintext.

### Scope

1. **New crypto helpers** in `modules/crypto/` (or `common/crypto/`):
   - `deriveUserDataKey(telegramId: number, secret: string): Buffer`
   - `encryptUserData(plaintext: string, telegramId: number): string` — returns base64/hex blob with IV + auth tag
   - `decryptUserData(ciphertext: string, telegramId: number): string`
2. **New env var** `TELEGRAM_USER_DATA_ENCRYPTION_SECRET` — required at startup (fail-fast, same pattern as hash secret).
3. **Write path** — encrypt before INSERT/UPDATE in Mood service and `telegramChatHistoryDbStore`.
4. **Read path** — decrypt after SELECT, only inside handlers/services that already have `message.from.id` or authenticated Telegram auth data.
5. **Remove plain `telegramId` from DB** — drop `users.telegram_id` column (migration).
6. **Migration for existing plaintext** — one-time job: for each row, needs the original `telegramId` to encrypt. Options:
   - If prod is empty / dev-only: truncate and start fresh.
   - If prod has data keyed by hash: cannot encrypt retroactively without knowing each user's numeric id (not stored). Plan: accept that old comments stay plaintext or are cleared; new writes are encrypted.
7. **Tests** — round-trip encrypt/decrypt, wrong telegramId fails decrypt, empty/null comment handling, deterministic key derivation.

### Constraints

- **`telegramId` exists only in transit** — from `message.from.id`, Telegram Login Widget `authData.id`, or JWT session that was issued after Telegram auth. It must not appear in logs, DB columns, or error reports.
- **Web/API reads** — authenticated requests have `req.user.id` (hash) but not `telegramId`. Any web endpoint that returns decrypted comments must either:
  - (a) re-authenticate via Telegram Login on each sensitive read, or
  - (b) store nothing that requires `telegramId` for web-only flows, or
  - (c) accept that web reads of encrypted fields require a fresh Telegram auth payload with `id`.
  - Decide explicitly before implementation; the bot flow always has `telegramId` available.

### Acceptance criteria

- [ ] Mood comments and chat messages are stored as ciphertext in the DB.
- [ ] Plaintext is only ever held in memory during an active request that has `telegramId`.
- [ ] No column in any table stores raw `telegramId`.
- [ ] Encryption secret is separate from hash secret; both required at startup.
- [ ] Unit tests cover encrypt/decrypt and tamper detection (GCM auth tag).
- [ ] Documented migration path for existing plaintext rows.

---

## Suggested order of work

1. **§2 Identity hashing cleanup** — small, unblocks §3; remove `users.telegram_id`, fix auth lookup, migrate legacy keys.
2. **§3 Encryption** — depends on §2 (no plain id in DB; consistent hash keys).
3. **§1 i18n** — independent, but touches many of the same bot files; can run in parallel with §2/§3 or after.

## Cross-cutting checklist before deploy

- [ ] New env vars documented in `apps/server/docs/env.md`
- [ ] DB migrations generated and listed in deploy notes
- [ ] `pnpm codecheck` green
- [ ] Manual smoke test: same Telegram user → same hash → mood + chat + web auth unified
