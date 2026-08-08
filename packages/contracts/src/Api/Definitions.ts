import { z } from "zod";

/**
 * The one error envelope every `/api` route returns. `code` is a closed union so
 * the client can branch on it without matching on human-readable `message`.
 */
export const API_ERROR_CODES = ["unauthorized", "invalid_input", "rate_limited", "internal"] as const;

export const ApiErrorCodeSchema = z.enum(API_ERROR_CODES);
export type TApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;

export const ApiErrorSchema = z.object({
  error: z.object({
    code: ApiErrorCodeSchema,
    message: z.string(),
  }),
});
export type TApiError = z.infer<typeof ApiErrorSchema>;
