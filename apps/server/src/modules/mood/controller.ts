import { controller } from "../../controllers/controller";

export const moodController = {
  addMoodEntry: controller(async (req, res) => {
    return { status: 200, result: {} };
  }),

  deleteMoodEntry: controller(async () => {
    return { status: 200, result: {} };
  }),

  listMoodEntries: controller(async () => {
    return { status: 200, result: {} };
  }),
};
