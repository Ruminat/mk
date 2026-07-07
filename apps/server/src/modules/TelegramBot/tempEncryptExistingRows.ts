import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { encryptUserData, isEncrypted } from "../crypto/userDataCrypto";
import { MoodTable } from "../Mood/model";
import { TelegramChatMessageTable } from "./model";

/**
 * ⚠️ TEMPORARY one-off migration — DELETE after test + prod are migrated.
 *
 * The encryption key is derived from the numeric telegram id, which we never
 * persist (only its hash). But it's available live on every incoming message
 * (`message.from.id`), so when the user messages the bot we use that id to encrypt
 * any of their pre-existing plaintext rows in place. Idempotent (already-encrypted
 * rows are skipped), so it's a no-op once everything is migrated.
 *
 * To remove: delete this file and its call in handlers/onMessage.ts.
 */
export async function encryptExistingRowsForUser(params: {
  telegramUserIdHash: string;
  telegramId: number;
}): Promise<void> {
  const { telegramUserIdHash, telegramId } = params;
  let encrypted = 0;

  const moodRows = await db
    .select({ id: MoodTable.id, comment: MoodTable.comment })
    .from(MoodTable)
    .where(eq(MoodTable.telegramUserIdHash, telegramUserIdHash));

  for (const row of moodRows) {
    if (row.comment == null || row.comment === "" || isEncrypted(row.comment)) {
      continue;
    }
    await db
      .update(MoodTable)
      .set({ comment: encryptUserData(row.comment, telegramId) })
      .where(eq(MoodTable.id, row.id));
    encrypted++;
  }

  const chatRows = await db
    .select({ id: TelegramChatMessageTable.id, text: TelegramChatMessageTable.text })
    .from(TelegramChatMessageTable)
    .where(eq(TelegramChatMessageTable.telegramUserIdHash, telegramUserIdHash));

  for (const row of chatRows) {
    if (row.text === "" || isEncrypted(row.text)) {
      continue;
    }
    await db
      .update(TelegramChatMessageTable)
      .set({ text: encryptUserData(row.text, telegramId) })
      .where(eq(TelegramChatMessageTable.id, row.id));
    encrypted++;
  }

  if (encrypted > 0) {
    console.log(`[temp encrypt migration] encrypted ${encrypted} legacy row(s) for the current user`);
  }
}
