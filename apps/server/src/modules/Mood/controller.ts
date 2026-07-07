import { controller } from "../../common/http/controller";
import { getValidModel } from "../../common/http/validation";
import { ServiceError } from "../../services/errors/ServiceError";
import { AuthenticatedRequest } from "../Auth/model";
import { AddMoodRequestSchema, DeleteMoodRequestSchema } from "./schema";
import { moodService } from "./service";

/**
 * The numeric telegram id is carried in the JWT (never stored) and is required to
 * encrypt/decrypt the user's comments. Tokens issued before this
 * claim existed won't have it; those clients must sign in again.
 */
function requireTelegramId(req: AuthenticatedRequest): number {
  if (req.telegramId === undefined) {
    throw new ServiceError("Telegram re-authentication required");
  }
  return req.telegramId;
}

export const moodController = {
  addMoodEntry: controller(async (req) => {
    const moodParams = getValidModel(AddMoodRequestSchema, req.body);

    const addedMood = await moodService.addMoodEntry({
      ...moodParams,
      telegramUserIdHash: req.user.id,
      telegramId: requireTelegramId(req),
    });

    return { status: 200, result: { mood: addedMood } };
  }),

  deleteMoodEntry: controller(async (req) => {
    const moodParams = getValidModel(DeleteMoodRequestSchema, req.body);

    await moodService.deleteMoodEntry({ entryId: moodParams.id, userId: req.user.id });

    return { status: 200, result: { message: "Successfully deleted the mood" } };
  }),

  listMoodEntries: controller(async (req) => {
    const entries = await moodService.listMoodEntries({
      userId: req.user.id,
      telegramId: requireTelegramId(req),
    });

    return { status: 200, result: { moods: entries } };
  }),
};
