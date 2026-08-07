import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/client";
import { decryptUserData, encryptUserData } from "../crypto/userDataCrypto";
import { ServiceError } from "../../services/errors/ServiceError";
import { MoodTable, TInsertMoodEntry, TSelectMoodEntry } from "./model";

const LIST_MOOD_ENTRIES_MAX = 360;

/**
 * The single choke point for mood-comment encryption: every write goes through
 * here so the `comment` column can only ever hold ciphertext, and every read
 * decrypts it back. The key is derived from the caller's numeric `telegramId`
 * (never stored), so both the bot and the web/API must supply it.
 */
function encryptComment(comment: string | null | undefined, telegramId: number): string | null {
  return comment == null ? null : encryptUserData(comment, telegramId);
}

function decryptEntry(row: TSelectMoodEntry, telegramId: number): TSelectMoodEntry {
  return row.comment == null ? row : { ...row, comment: decryptUserData(row.comment, telegramId) };
}

export const moodService = {
  addMoodEntry: async ({ telegramId, ...entry }: TInsertMoodEntry & { telegramId: number }) => {
    const response = await db
      .insert(MoodTable)
      .values({ ...entry, comment: encryptComment(entry.comment, telegramId) })
      .returning();

    if (response.length !== 1) {
      throw new ServiceError("Failed to add mood entry");
    }

    const [row] = response;

    // Return the row with the plaintext comment the caller passed in, so callers
    // never have to decrypt what they just wrote.
    return { ...row, comment: entry.comment ?? null };
  },

  deleteMoodEntry: async ({ entryId, userId }: { entryId: TSelectMoodEntry["id"]; userId: string }) => {
    const response = await db
      .delete(MoodTable)
      .where(and(eq(MoodTable.id, entryId), eq(MoodTable.telegramUserIdHash, userId)));

    if (response.rowsAffected !== 1) {
      throw new ServiceError("Failed to delete the mood entry");
    }
  },

  /**
   * Delete every entry a user has. Unlike {@link deleteMoodEntry} it doesn't
   * insist on hitting anything — a user with no entries is a valid, already-clean
   * state — so it stays idempotent and safe to retry.
   */
  deleteAllMoodEntries: async ({ userId }: { userId: string }): Promise<number> => {
    const response = await db.delete(MoodTable).where(eq(MoodTable.telegramUserIdHash, userId));

    return response.rowsAffected;
  },

  listMoodEntries: async ({
    userId,
    telegramId,
    limit = LIST_MOOD_ENTRIES_MAX,
  }: {
    userId: string;
    telegramId: number;
    limit?: number;
  }) => {
    const cappedLimit = Math.min(limit, LIST_MOOD_ENTRIES_MAX);
    const response = await db
      .select()
      .from(MoodTable)
      .where(eq(MoodTable.telegramUserIdHash, userId))
      .orderBy(desc(sql`datetime(${MoodTable.createdAt})`), desc(MoodTable.id))
      .limit(cappedLimit);

    return response.map((row) => decryptEntry(row, telegramId));
  },
};
