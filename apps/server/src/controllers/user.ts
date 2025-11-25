import { Request, Response } from "express";
import * as userService from "../services/userService";

export const getUserInfo = async (_: Request, res: Response) => {
  const info = await userService.getInfo();
  res.json(info);
};

export const uploadUserAvatar = async (req: Request, res: Response) => {
  const file = req.body.avatarBase64;
  const result = await userService.uploadAvatar(file);
  res.json(result);
};
