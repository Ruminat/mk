import { eq, sql } from "drizzle-orm";
import { getTelegramUserIdSecureHash } from "../common/telegram/telegramUserId";
import { db } from "../db/client";
import { UserTable } from "../modules/Auth/model";
import { MoodTable } from "../modules/Mood/model";
import { TelegramChatMessageTable } from "../modules/TelegramBot/model";

/**
 * One-time data migration (plans.md §2): re-key legacy identity.
 *
 * Old web rows stored the user under `telegram_<numericId>` instead of the
 * secure HMAC hash. This walks `users.id`, `mood_entries.telegram_user_id_hash`
 * and `telegram_chat_messages.telegram_user_id_hash`, and rewrites any such key
 * to `getTelegramUserIdSecureHash(numericId)` — so legacy web data lines up with
 * the bot and with new sign-ins.
 *
 * Safe to run repeatedly: once no `telegram_<id>` keys remain it's a no-op.
 * DRY RUN by default — pass `--apply` to actually write.
 *
 *   pnpm db.migrate.legacy-identity            # report what would change
 *   pnpm db.migrate.legacy-identity --apply    # perform the migration
 */

const LEGACY_PREFIX = "telegram_";
const APPLY = process.argv.includes("--apply");

/** `telegram_<numericId>` → secure hash, or undefined if it isn't a legacy key. */
function legacyKeyToHash(key: string): string | undefined {
  if (!key.startsWith(LEGACY_PREFIX)) {
    return undefined;
  }
  const raw = key.slice(LEGACY_PREFIX.length);
  if (!/^\d+$/.test(raw)) {
    return undefined;
  }
  const numericId = Number(raw);
  if (!Number.isSafeInteger(numericId)) {
    return undefined;
  }
  return getTelegramUserIdSecureHash(numericId);
}

async function rekeyUsers() {
  const users = await db.select().from(UserTable);
  const knownIds = new Set(users.map((u) => u.id));
  const legacy = users.filter((u) => u.id.startsWith(LEGACY_PREFIX));

  let rekeyed = 0;
  let mergedDuplicates = 0;
  let unparseable = 0;

  for (const user of legacy) {
    const newId = legacyKeyToHash(user.id);
    if (!newId) {
      unparseable++;
      console.log(`  ⚠️  users: cannot parse legacy id ${user.id} — left as-is`);
      continue;
    }

    if (knownIds.has(newId)) {
      // The person already exists under the hashed id (signed in via the new
      // flow). Drop the legacy duplicate; their data rows are re-keyed below.
      mergedDuplicates++;
      console.log(`  users: ${user.id} → ${newId} (hashed user exists → delete legacy dup)`);
      if (APPLY) {
        await db.delete(UserTable).where(eq(UserTable.id, user.id));
      }
    } else {
      rekeyed++;
      knownIds.add(newId);
      console.log(`  users: ${user.id} → ${newId}`);
      if (APPLY) {
        await db.update(UserTable).set({ id: newId }).where(eq(UserTable.id, user.id));
      }
    }
  }

  return { legacy: legacy.length, rekeyed, mergedDuplicates, unparseable };
}

/** Re-key a `telegram_user_id_hash` column shared by many rows. */
async function rekeyHashColumn(
  label: string,
  loadHashes: () => Promise<string[]>,
  updateHash: (oldHash: string, newHash: string) => Promise<void>,
) {
  const all = await loadHashes();
  const legacyHashes = [...new Set(all.filter((h) => h.startsWith(LEGACY_PREFIX)))];

  let rekeyed = 0;
  let unparseable = 0;

  for (const oldHash of legacyHashes) {
    const newHash = legacyKeyToHash(oldHash);
    if (!newHash) {
      unparseable++;
      console.log(`  ⚠️  ${label}: cannot parse legacy key ${oldHash} — left as-is`);
      continue;
    }
    rekeyed++;
    console.log(`  ${label}: ${oldHash} → ${newHash}`);
    if (APPLY) {
      await updateHash(oldHash, newHash);
    }
  }

  return { distinctLegacyKeys: legacyHashes.length, rekeyed, unparseable };
}

const REQUIRED_TABLES = ["users", "mood_entries", "telegram_chat_messages"];

/**
 * Fail fast with a clear message if the schema migrations haven't been applied
 * yet — otherwise the first query dies with a cryptic "no such table" error.
 */
async function assertSchemaMigrated() {
  const rows = await db.all<{ name: string }>(
    sql`SELECT name FROM sqlite_master WHERE type = 'table'`,
  );
  const present = new Set(rows.map((r) => r.name));
  const missing = REQUIRED_TABLES.filter((t) => !present.has(t));

  if (missing.length > 0) {
    console.error(
      `❌ This database is missing tables: ${missing.join(", ")}.\n` +
        `   Apply the schema migrations first, then re-run this:\n\n` +
        `     pnpm db.migrate\n\n` +
        `   (The legacy re-key must run AFTER the schema is up to date.)`,
    );
    process.exit(1);
  }
}

async function main() {
  await assertSchemaMigrated();

  console.log(
    APPLY
      ? "🗄️  Applying legacy identity re-key (WRITING to the DB)…\n"
      : "🔍 DRY RUN — nothing will be written. Pass --apply to perform the migration.\n",
  );

  const users = await rekeyUsers();
  const mood = await rekeyHashColumn(
    "mood_entries",
    async () => (await db.select({ h: MoodTable.telegramUserIdHash }).from(MoodTable)).map((r) => r.h),
    async (oldHash, newHash) => {
      await db
        .update(MoodTable)
        .set({ telegramUserIdHash: newHash })
        .where(eq(MoodTable.telegramUserIdHash, oldHash));
    },
  );
  const chat = await rekeyHashColumn(
    "telegram_chat_messages",
    async () =>
      (await db.select({ h: TelegramChatMessageTable.telegramUserIdHash }).from(TelegramChatMessageTable)).map(
        (r) => r.h,
      ),
    async (oldHash, newHash) => {
      await db
        .update(TelegramChatMessageTable)
        .set({ telegramUserIdHash: newHash })
        .where(eq(TelegramChatMessageTable.telegramUserIdHash, oldHash));
    },
  );

  console.log("\nSummary:");
  console.log("  users:", users);
  console.log("  mood_entries:", mood);
  console.log("  telegram_chat_messages:", chat);

  if (!APPLY) {
    console.log("\nDry run only — re-run with --apply to write these changes.");
  } else {
    console.log("\n✅ Done.");
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Legacy identity migration failed:", error);
  process.exit(1);
});
