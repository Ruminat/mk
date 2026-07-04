# Context — the owner's vision for this project

**This file is the source of truth for how work happens here. Follow it.**

It is not a dump of facts scraped from the code — it records **the owner's
decisions, preferences, and corrections**: the things you can't infer by reading
the repo. When it conflicts with what the code currently looks like or with a
generic best practice, this file wins.

**Maintenance rule (do this automatically):** after any comment or correction
from the owner — especially "don't do X, do Y instead" — extract the durable
rule behind it and add it to this file. A correction that only lives in one chat
is lost; a correction written here is followed forever. Prefer updating an
existing point over piling on duplicates.

---

## Owner's decisions

- **Telegram is the single source of truth for identity.** No other auth methods
  (email/password was removed). The **Telegram bot flow is the reference
  implementation** — if a web/API flow diverges from it, change the other flow to
  match the bot, never the reverse.
- **Never persist raw telegram identity — no `telegramId`, no `username` — in the
  DB.** Identity keys are the HMAC hash (`getTelegramUserIdSecureHash`). A
  username/id exists only *in transit* (bot update, Login Widget payload, JWT
  session). Derived facts (e.g. admin status) are computed once from that
  in-transit value and carried in the **signed JWT**, never written to a column.
  See `plans.md` (§2 identity hashing, §3 encryption) for the full model.
- **Admin authorization uses one source: `ADMIN_TELEGRAM_LOGINS`** (telegram
  usernames), shared by the bot and the API — don't invent a second admin list.
  On sign-in the API derives `isAdmin` from the in-transit username via
  `isAdminLogin` and bakes it into the JWT; admin-only routes go through
  `authenticate` + `requireAdmin` (which reads the token's `isAdmin` flag).
- **Prefer a proven library over a hand-rolled implementation for tricky or
  critical logic.** When correctness/reliability matters — rate limiting, crypto,
  time/state math, **and anything parsing/escaping/serializing a format**
  (HTML/URL/SQL/JSON escaping, entity encoding) — reach for a well-established
  library instead of writing custom `replace` chains or regexes. Do this even
  when the hand-rolled version "looks obviously correct": formats have edge cases.
  A thin named wrapper around the library is fine (keeps call sites and intent
  clear). (Origins: a hand-rolled token bucket → `rate-limiter-flexible`; a
  hand-rolled HTML escaper → `he`.)
- **State that must survive restarts has to be persisted.** In-memory structures
  (caches, Maps) are wiped on every restart/release — anything a user would miss
  after a redeploy (e.g. chat context) must be backed by durable storage (the DB).
  Preferred shape: a **write-through cache** — the DB is the source of truth, an
  in-memory cache sits in front for speed/bounded memory, and a cache miss
  rehydrates from the DB. (Origin: the bot's chat history was in-memory only and
  lost on every release.)
- **Never turn a folder into a trashbag.** Organize by meaning; don't pile
  unrelated files into `common/` (or any single folder). See folder structure
  below.
- **Tests go in a separate `test/` folder**, not next to the source file. This
  overrides any "co-locate tests" advice from generic docs.
- **Working docs live in `ignored/`, written in simple Russian.** For the server
  review effort: `ignored/server.review.md` (the problem list),
  `ignored/progress.md` (Upcoming / Fixed tracker), and one report per task at
  `ignored/<N>.report.md`. Report only **real production problems** (security,
  bugs) — not linting, code style, or nitpicks.

---

## Folder structure — organize by meaning, not by type

- Group code by **domain / concern**, never as a flat dump of unrelated files in
  one folder. Do **not** pile everything into `common/` (or a top-level `utils/`,
  `hooks/`, `selectors/`).
- Server (`apps/server/src`):
  - `modules/<Feature>/` — feature modules (Auth, Mood, TelegramBot, AI, crypto),
    each with its own `route` / `controller` / `service` / `model` / `schema`.
  - `common/<concern>/` — shared cross-cutting code, grouped by concern:
    `config/`, `http/`, `database/`, `date/`, `telegram/`, `rateLimiter/`, `mood/`.
- Inside a feature/concern folder:
  - `models/` — types, schemas, constants, pure data shapes for that concern.
  - `test/` — tests go **here**, not beside the source file.
- **Split large files.** One helper per file / per concern. A grab-bag `utils.ts`
  of unrelated functions should be broken up.

## Tests

- Put tests in a **separate `test/` subfolder** inside the feature/concern folder
  (e.g. `common/rateLimiter/test/perUserRateLimiter.test.ts`). Do **not** drop
  `*.test.ts` next to the source it covers.
- Name the test file after the function/class under test.
- Vitest, `environment: node`. Test **pure logic and critical, non-obvious
  behaviour** — parsing, transforms, validation, limits. Skip trivial code.
- Readable, data-flow style: `describe("<file>.ts / <fnOrClass>")`,
  `it("should … when …")`, with input → call → output visible in the body. Small
  local factory helpers for fixtures. Use fake timers for time-based logic so
  tests stay deterministic.

## TypeScript

- Strict mode. Treat `T | undefined` from index access / optional props as real —
  narrow before use.
- **Named exports only.** No barrel `index.ts` that re-exports siblings. Import
  from concrete file paths.
- `import type` for type-only imports.
- Runtime validation (Zod) for anything persisted or deserialized; the schema
  lives next to the code that uses it.

## Naming

- **Server uses camelCase filenames** (existing convention) — keep new files
  consistent with the surrounding server code.
- The frontend repos use PascalCase per their own conventions; don't cross-apply
  frontend rules (PascalCase, React/SSR patterns) to the Node server.

## Tooling / CI

- `codecheck` = typecheck + lint + test; lint runs with zero warnings. Run before
  merge.
