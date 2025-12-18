import { controller } from "../../common/controller";
import { getValidModel } from "../../common/validation";
import { AddMoodRequestSchema, DeleteMoodRequestSchema } from "./schema";
import { moodService } from "./service";

export const moodController = {
  addMoodEntry: controller(async (req) => {
    const moodParams = getValidModel(AddMoodRequestSchema, req.body);

    const addedMood = await moodService.addMoodEntry({ ...moodParams, userId: req.user.id });

    return { status: 200, result: { mood: addedMood } };
  }),

  deleteMoodEntry: controller(async (req) => {
    const moodParams = getValidModel(DeleteMoodRequestSchema, req.body);

    await moodService.deleteMoodEntry({ entryId: moodParams.id, userId: req.user.id });

    return { status: 200, result: { message: "Successfully deleted the mood" } };
  }),

  listMoodEntries: controller(async (req) => {
    const entries = await moodService.listMoodEntries({ userId: req.user.id });

    return { status: 200, result: { moods: entries } };
  }),
};
