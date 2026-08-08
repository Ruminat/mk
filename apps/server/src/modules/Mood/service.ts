import { desc, eq } from "drizzle-orm";
import { db } from "../../db/client";
import { decryptUserData, encryptUserData } from "../crypto/userDataCrypto";
import { ServiceError } from "../../services/errors/ServiceError";
import { MoodTable, TInsertMoodEntry, TSelectMoodEntry } from "./model";

const LIST_MOOD_ENTRIES_MAX = 360;

/**
 * The single choke point for mood-comment encryption: every write goes through
 * here so the `comment` column can only ever hold ciphertext, and every read
 * decrypts it back. The key is derived from the caller's numeric `telegramId`
 * (never stored), so callers must supply it.
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

  /**
   * Delete every entry a user has. It doesn't insist on hitting anything — a user
   * with no entries is a valid, already-clean state — so it stays idempotent and
   * safe to retry.
   */
  deleteAllMoodEntries: async ({ userId }: { userId: string }): Promise<number> => {
    const response = await db.delete(MoodTable).where(eq(MoodTable.telegramUserIdHash, userId));

    return response.rowsAffected;
  },

  /**
   * A newest-first page. `offset` exists for the web's "load older" scroll; the
   * bot never passes it. The sort is a total order (`id` breaks any `created_at`
   * tie), so paging by offset can't reshuffle rows between requests.
   */
  listMoodEntries: async ({
    userId,
    telegramId,
    limit = LIST_MOOD_ENTRIES_MAX,
    offset = 0,
  }: {
    userId: string;
    telegramId: number;
    limit?: number;
    offset?: number;
  }) => {
    const cappedLimit = Math.min(limit, LIST_MOOD_ENTRIES_MAX);
    const response = await db
      .select()
      .from(MoodTable)
      .where(eq(MoodTable.telegramUserIdHash, userId))
      // Ordered by the raw column, not `datetime(created_at)`: the stored format
      // is fixed-width, so sorting it as text is already chronological — and
      // wrapping the column in a function would rule out the index.
      .orderBy(desc(MoodTable.createdAt), desc(MoodTable.id))
      .limit(cappedLimit)
      .offset(offset);

    return response.map((row) => decryptEntry(row, telegramId));
  },
};
