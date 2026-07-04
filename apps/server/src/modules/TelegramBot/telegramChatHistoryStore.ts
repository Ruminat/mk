import { and, desc, eq, notInArray } from "drizzle-orm";
import { db } from "../../db/client";
import { TelegramChatMessageTable } from "./model";
import type { TTelegramChatHistoryStore } from "./telegramChatHistory";

/**
 * Durable backing store for chat history (see {@link TTelegramChatHistoryStore}).
 * Persists to the `telegram_chat_messages` table so context outlives restarts,
 * and prunes each user down to their most recent `keepLast` messages so the
 * table can't grow without bound.
 */
export const telegramChatHistoryDbStore: TTelegramChatHistoryStore = {
  loadRecent: async (telegramUserIdHash, limit) => {
    const rows = await db
      .select({ role: TelegramChatMessageTable.role, text: TelegramChatMessageTable.text })
      .from(TelegramChatMessageTable)
      .where(eq(TelegramChatMessageTable.telegramUserIdHash, telegramUserIdHash))
      .orderBy(desc(TelegramChatMessageTable.id))
      .limit(limit);

    // Newest-first from the query; history is consumed oldest-first.
    return rows.reverse();
  },

  append: async (telegramUserIdHash, entry, keepLast) => {
    await db.insert(TelegramChatMessageTable).values({
      telegramUserIdHash,
      role: entry.role,
      text: entry.text,
    });

    const recentIds = db
      .select({ id: TelegramChatMessageTable.id })
      .from(TelegramChatMessageTable)
      .where(eq(TelegramChatMessageTable.telegramUserIdHash, telegramUserIdHash))
      .orderBy(desc(TelegramChatMessageTable.id))
      .limit(keepLast);

    await db
      .delete(TelegramChatMessageTable)
      .where(
        and(
          eq(TelegramChatMessageTable.telegramUserIdHash, telegramUserIdHash),
          notInArray(TelegramChatMessageTable.id, recentIds),
        ),
      );
  },
};
