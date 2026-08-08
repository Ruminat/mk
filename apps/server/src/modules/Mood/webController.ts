import type { Request, Response } from "express";
import { CreateMoodEntrySchema, type TMoodEntry } from "@mooduck/contracts";
import { sendApiError } from "../WebApi/apiError";
import type { AuthenticatedWebRequest } from "../WebAuth/requireSession";
import type { TSelectMoodEntry } from "./model";
import { moodService } from "./service";
import { ListMoodEntriesQuerySchema } from "./webSchema";

/**
 * Thin bridge from the session to `moodService` — no new DB code, no new
 * queries. The web is a second front door onto the exact same data the bot
 * writes: same identity hash (`session.hash`), same numeric id for encryption
 * (`session.tgId`), same ordering and limits.
 */

function toWireEntry(row: TSelectMoodEntry): TMoodEntry {
  return {
    id: row.id,
    value: row.value,
    comment: row.comment, // already decrypted by moodService
    // A `Date | null` from the driver boundary (null = unreadable timestamp).
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : null,
  };
}

export const webMoodController = {
  listEntries: async (req: Request, res: Response): Promise<void> => {
    const { session } = req as AuthenticatedWebRequest;

    const query = ListMoodEntriesQuerySchema.safeParse(req.query);
    if (!query.success) {
      sendApiError(res, 400, "invalid_input", "Invalid limit");
      return;
    }

    const rows = await moodService.listMoodEntries({
      userId: session.hash,
      telegramId: session.tgId,
      ...(query.data.limit !== undefined ? { limit: query.data.limit } : {}),
    });

    res.status(200).json({ entries: rows.map(toWireEntry) });
  },

  addEntry: async (req: Request, res: Response): Promise<void> => {
    const { session } = req as AuthenticatedWebRequest;

    const parsed = CreateMoodEntrySchema.safeParse(req.body);
    if (!parsed.success) {
      sendApiError(res, 400, "invalid_input", "Expected { value: 1..10, comment?: string }");
      return;
    }

    const row = await moodService.addMoodEntry({
      telegramId: session.tgId,
      telegramUserIdHash: session.hash,
      value: parsed.data.value,
      comment: parsed.data.comment ?? null,
    });

    res.status(201).json({ entry: toWireEntry(row) });
  },
};
