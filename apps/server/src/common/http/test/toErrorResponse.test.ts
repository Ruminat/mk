import { describe, expect, it } from "vitest";
import { z } from "zod";
import { toErrorResponse } from "../toErrorResponse";
import { ValidationError } from "../validation";

/** Build a real ValidationError the way getValidModel does, from a failed parse. */
function makeValidationError() {
  const schema = z.object({ comment: z.string().max(3) });
  const parsed = schema.safeParse({ comment: "too long" });
  if (parsed.success) {
    throw new Error("expected the parse to fail");
  }
  return new ValidationError(parsed.error);
}

describe("toErrorResponse.ts / toErrorResponse", () => {
  it("should map a ValidationError to a 400 with per-field details", () => {
    const response = toErrorResponse(makeValidationError());

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Validation failed");
    expect(response.body.details).toEqual([{ path: "comment", message: expect.any(String) }]);
  });

  it("should map an unknown error to an opaque 500 without leaking details", () => {
    const response = toErrorResponse(new Error("database exploded"));

    expect(response).toEqual({ status: 500, body: { error: "Internal server error" } });
  });

  it("should treat a non-Error throw as a 500", () => {
    const response = toErrorResponse("just a string");

    expect(response.status).toBe(500);
  });
});
