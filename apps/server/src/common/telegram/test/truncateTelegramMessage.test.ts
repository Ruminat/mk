import he from "he";
import { describe, expect, it } from "vitest";
import { truncateTelegramMessage } from "../truncateTelegramMessage";

describe("truncateTelegramMessage.ts / truncateTelegramMessage", () => {
  it("should return short text unchanged", () => {
    expect(truncateTelegramMessage("привет")).toBe("привет");
  });

  it("should keep text that is exactly at the limit", () => {
    const text = "a".repeat(10);
    expect(truncateTelegramMessage(text, { maxChars: 10, suffix: "…" })).toBe(text);
  });

  it("should cut over-long text and append the suffix within the budget", () => {
    const result = truncateTelegramMessage("a".repeat(20), { maxChars: 10, suffix: "…(cut)" });

    expect(result).toBe("aaaa…(cut)");
    expect(result.length).toBe(10);
  });

  it("should not leave a bare '&' when the cut lands inside an escaped entity", () => {
    // Escaped text whose entity `&lt;` straddles the truncation boundary.
    const escaped = he.escape(`${"a".repeat(7)}<tail`);
    const result = truncateTelegramMessage(escaped, { maxChars: 9, suffix: "…" });

    expect(result).not.toMatch(/&[a-z]*$/i);
    expect(result.endsWith("…")).toBe(true);
    // Only the complete prefix survives; the split `&lt;` is dropped entirely.
    expect(result).toBe("aaaaaaa…");
  });

  it("should preserve a complete entity that ends right at the boundary", () => {
    const escaped = he.escape("<");
    const result = truncateTelegramMessage(`${escaped}${"b".repeat(20)}`, {
      maxChars: 10,
      suffix: "…",
    });

    expect(result.startsWith("&lt;")).toBe(true);
  });
});
