# Turso Migrations

Migrations are managed with Drizzle Kit. Run from repo root or `apps/server`.

## Prerequisites

Set `TURSO_CONNECTION_URL` and `TURSO_AUTH_TOKEN` in `apps/server/.env`.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm db.generate` | Generate migration SQL from schema changes |
| `pnpm db.migrate` | Apply pending migrations to the database |
| `pnpm db.push` | Push schema directly (no migration files, for prototyping) |
| `pnpm db.studio` | Open Drizzle Studio to inspect the database |

## Workflow

1. **Change schema** — Edit `src/modules/*/model.ts` files.
2. **Generate migration** — `pnpm db.generate` (from root) or `cd apps/server && pnpm db.generate`.
3. **Review** — Inspect the generated SQL in `migrations/`.
4. **Apply** — `pnpm db.migrate` to run migrations.

Use `db.push` for quick local iteration; it syncs schema without creating migration files. Use `db.generate` + `db.migrate` for production and tracked changes.
