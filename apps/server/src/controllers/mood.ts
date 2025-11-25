import { Request, Response } from "express";
import * as moodService from "../services/moodService";

export const addMoodEntry = async (req: Request, res: Response) => {
  const entry = await moodService.add(req.body);
  res.json(entry);
};

export const deleteMoodEntry = async (req: Request, res: Response) => {
  const result = await moodService.remove(req.body.id);
  res.json(result);
};

export const listMoodEntries = async (_: Request, res: Response) => {
  const entries = await moodService.list();
  res.json(entries);
};
