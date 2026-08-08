import type { Response } from "express";
import type { TApiErrorCode } from "@mooduck/contracts";

/**
 * The one error envelope every `/api` route returns: `{ error: { code, message } }`.
 * `code` is the closed union from `@mooduck/contracts`, so the client branches on
 * it without matching on the human-readable message.
 */
export function sendApiError(res: Response, status: number, code: TApiErrorCode, message: string): void {
  res.status(status).json({ error: { code, message } });
}
