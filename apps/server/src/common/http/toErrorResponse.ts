import { ValidationError } from "./validation";

export type THttpErrorResponse = {
  status: number;
  body: { error: string; details?: { path: string; message: string }[] };
};

/**
 * Map a thrown error to an HTTP response. A failed request validation is the
 * client's fault, so it becomes a 400 with the specific field problems — not a
 * misleading 500. Everything else stays an opaque 500 (details are logged, not
 * leaked to the caller).
 */
export function toErrorResponse(error: unknown): THttpErrorResponse {
  if (error instanceof ValidationError) {
    return {
      status: 400,
      body: {
        error: "Validation failed",
        details: error.zodError.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    };
  }

  return { status: 500, body: { error: "Internal server error" } };
}
