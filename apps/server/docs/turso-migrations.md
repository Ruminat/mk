# Turso Migrations

Migrations are managed with Drizzle Kit. Run from repo root or `apps/server`.

## Prerequisites

**Remote (Turso):** Set `TURSO_CONNECTION_URL` and `TURSO_AUTH_TOKEN` in `apps/server/.env`.

**Local dev:** Set `USE_LOCAL_DB=true` (and optionally `LOCAL_DB_PATH`) when `MODE=dev`. No Turso credentials needed. Database file defaults to `./data/local.db`.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm db.generate` | Generate migration SQL from schema changes |
| `pnpm db.migrate` | Apply pending migrations to the database |
| `pnpm db.push` | Push schema directly (no migration files, for prototyping) |
| `pnpm db.studio` | Open Drizzle Studio to inspect the database |
| `pnpm db.push.local` | Push schema to local SQLite (dev mode) |
| `pnpm db.migrate.local` | Run migrations on local SQLite |
| `pnpm db.studio.local` | Open Drizzle Studio for local DB |

## Workflow

1. **Change schema** — Edit `src/modules/*/model.ts` files.
2. **Generate migration** — `pnpm db.generate` (from root) or `cd apps/server && pnpm db.generate`.
3. **Review** — Inspect the generated SQL in `migrations/`.
4. **Apply** — `pnpm db.migrate` to run migrations (or `pnpm db.migrate.local` for local DB).

Use `db.push` for quick local iteration; it syncs schema without creating migration files. Use `db.generate` + `db.migrate` for production and tracked changes.
