import { describe, expect, it } from "vitest";
import { getHashFromNumber } from "./utils";

const SECRET = "test-secret-key";

describe("getTelegramUserIdSecureHash", () => {
  it("returns a 16-character string", () => {
    const hash = getHashFromNumber(123456789, { secret: SECRET });
    expect(hash).toHaveLength(16);
    expect(typeof hash).toBe("string");
  });

  it("returns only base64url-safe characters (alphanumeric, hyphen, underscore)", () => {
    const hash = getHashFromNumber(123456789, { secret: SECRET });
    expect(hash).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("returns the same hash for the same userId and secret", () => {
    const hash1 = getHashFromNumber(123456789, { secret: SECRET });
    const hash2 = getHashFromNumber(123456789, { secret: SECRET });
    expect(hash1).toBe(hash2);
  });

  it("returns different hashes for different userIds", () => {
    const hash1 = getHashFromNumber(123456789, { secret: SECRET });
    const hash2 = getHashFromNumber(987654321, { secret: SECRET });
    expect(hash1).not.toBe(hash2);
  });

  it("returns different hashes for different secrets", () => {
    const hash1 = getHashFromNumber(123456789, { secret: "secret-a" });
    const hash2 = getHashFromNumber(123456789, { secret: "secret-b" });
    expect(hash1).not.toBe(hash2);
  });

  it("handles zero userId", () => {
    const hash = getHashFromNumber(0, { secret: SECRET });
    expect(hash).toHaveLength(16);
    expect(hash).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("handles large userId", () => {
    const hash = getHashFromNumber(2147483647, { secret: SECRET });
    expect(hash).toHaveLength(16);
    expect(hash).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
