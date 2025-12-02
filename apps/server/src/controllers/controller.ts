import { Request, Response } from "express";
import { logger } from "../services/logger";

export function controller<TResult>(
  baseController: (
    req: Request,
    res: Response
  ) => Promise<{
    status: number;
    result: TResult;
  }>
) {
  return async (req: Request, res: Response) => {
    try {
      const { status, result } = await baseController(req, res);

      res.status(status).json(result);
    } catch (error) {
      logger.error("Controller error", error);

      res.status(500).json({ error: "Internal server error" });
    }
  };
}
