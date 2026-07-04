import { describe, expect, it } from "vitest";
import { AddMoodRequestSchema, MOOD_COMMENT_MAX_LENGTH } from "../schema";

describe("schema.ts / AddMoodRequestSchema", () => {
  it("should accept a valid score with a short comment", () => {
    const result = AddMoodRequestSchema.safeParse({ value: 7, comment: "хороший день" });

    expect(result.success).toBe(true);
  });

  it("should accept a mood entry without a comment (comment is optional)", () => {
    const result = AddMoodRequestSchema.safeParse({ value: 5 });

    expect(result.success).toBe(true);
  });

  it("should accept a comment exactly at the length limit", () => {
    const result = AddMoodRequestSchema.safeParse({
      value: 5,
      comment: "a".repeat(MOOD_COMMENT_MAX_LENGTH),
    });

    expect(result.success).toBe(true);
  });

  it("should reject a comment longer than the limit", () => {
    const result = AddMoodRequestSchema.safeParse({
      value: 5,
      comment: "a".repeat(MOOD_COMMENT_MAX_LENGTH + 1),
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["comment"]);
  });

  it("should reject a score outside 1..10", () => {
    expect(AddMoodRequestSchema.safeParse({ value: 0 }).success).toBe(false);
    expect(AddMoodRequestSchema.safeParse({ value: 11 }).success).toBe(false);
  });

  it("should reject a non-integer score", () => {
    expect(AddMoodRequestSchema.safeParse({ value: 5.5 }).success).toBe(false);
  });
});
