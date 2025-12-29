import { Request, Response } from "express";
import { logger } from "../services/logger";
import { AuthenticatedRequest } from "../modules/Auth/model";

type ControllerHandler<TResult, TRequest extends Request = Request> = (
  req: TRequest,
  res: Response
) => Promise<{
  status: number;
  result: TResult;
}>;

/**
 * Controller wrapper for authenticated routes
 * Use this for protected endpoints that require authentication
 * The request will have req.user available
 */
export function controller<TResult>(baseController: ControllerHandler<TResult, AuthenticatedRequest>) {
  return createController<TResult, AuthenticatedRequest>(baseController);
}

/**
 * Controller wrapper for unauthenticated routes
 * Use this for public endpoints that don't require authentication
 */
export function unauthenticatedController<TResult>(baseController: ControllerHandler<TResult, Request>) {
  return createController<TResult, Request>(baseController);
}

function createController<TResult, TRequest extends Request = Request>(
  baseController: ControllerHandler<TResult, TRequest>
) {
  return async (req: Request, res: Response) => {
    try {
      const { status, result } = await baseController(req as TRequest, res);

      res.status(status).json(result);
    } catch (error) {
      logger.error("Controller error", error);

      res.status(500).json({ error: "Internal server error" });
    }
  };
}
