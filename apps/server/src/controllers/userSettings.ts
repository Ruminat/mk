import { Request, Response } from "express";
import * as settingsService from "../services/userSettingsService";

export const updateSettings = async (req: Request, res: Response) => {
  const updated = await settingsService.update(req.body);
  res.json(updated);
};

export const getSettings = async (req: Request, res: Response) => {
  const settings = await settingsService.get();
  res.json(settings);
};
