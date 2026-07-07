import { describe, expect, it } from "vitest";
import {
  decryptWithSecret,
  deriveUserDataKey,
  encryptWithSecret,
} from "../userDataCryptoCore";

const SECRET = "test-encryption-secret";
const OTHER_SECRET = "a-different-secret";
const TELEGRAM_ID = 123456789;
const OTHER_TELEGRAM_ID = 987654321;

const encrypt = (plaintext: string, telegramId = TELEGRAM_ID, secret = SECRET) =>
  encryptWithSecret(plaintext, { telegramId, secret });
const decrypt = (stored: string, telegramId = TELEGRAM_ID, secret = SECRET) =>
  decryptWithSecret(stored, { telegramId, secret });

describe("userDataCrypto.ts", () => {
  describe("round-trip", () => {
    it("decrypts back to the original plaintext", () => {
      const plaintext = "feeling great today 😀 — 8/10";
      expect(decrypt(encrypt(plaintext))).toBe(plaintext);
    });

    it("handles an empty string", () => {
      expect(decrypt(encrypt(""))).toBe("");
    });

    it("handles long unicode text", () => {
      const plaintext = "привет ".repeat(500) + "🦆".repeat(100);
      expect(decrypt(encrypt(plaintext))).toBe(plaintext);
    });

    it("produces ciphertext that does not contain the plaintext", () => {
      const plaintext = "super-secret-note";
      expect(encrypt(plaintext)).not.toContain(plaintext);
    });
  });

  describe("non-determinism (random IV)", () => {
    it("produces different ciphertext for the same input each time", () => {
      const plaintext = "same input";
      expect(encrypt(plaintext)).not.toBe(encrypt(plaintext));
    });

    it("still decrypts both independent ciphertexts to the same plaintext", () => {
      const plaintext = "same input";
      expect(decrypt(encrypt(plaintext))).toBe(plaintext);
      expect(decrypt(encrypt(plaintext))).toBe(plaintext);
    });
  });

  describe("key derivation", () => {
    it("is deterministic for the same id + secret", () => {
      const a = deriveUserDataKey({ telegramId: TELEGRAM_ID, secret: SECRET });
      const b = deriveUserDataKey({ telegramId: TELEGRAM_ID, secret: SECRET });
      expect(a.equals(b)).toBe(true);
      expect(a).toHaveLength(32); // AES-256
    });

    it("differs for a different telegram id", () => {
      const a = deriveUserDataKey({ telegramId: TELEGRAM_ID, secret: SECRET });
      const b = deriveUserDataKey({ telegramId: OTHER_TELEGRAM_ID, secret: SECRET });
      expect(a.equals(b)).toBe(false);
    });

    it("differs for a different secret", () => {
      const a = deriveUserDataKey({ telegramId: TELEGRAM_ID, secret: SECRET });
      const b = deriveUserDataKey({ telegramId: TELEGRAM_ID, secret: OTHER_SECRET });
      expect(a.equals(b)).toBe(false);
    });

    it("rejects an empty secret", () => {
      expect(() => deriveUserDataKey({ telegramId: TELEGRAM_ID, secret: "" })).toThrow();
    });
  });

  describe("wrong key fails to decrypt (GCM auth)", () => {
    it("throws when decrypting with a different telegram id", () => {
      const blob = encrypt("private");
      expect(() => decrypt(blob, OTHER_TELEGRAM_ID)).toThrow();
    });

    it("throws when decrypting with a different secret", () => {
      const blob = encrypt("private");
      expect(() => decrypt(blob, TELEGRAM_ID, OTHER_SECRET)).toThrow();
    });
  });

  describe("tamper detection", () => {
    // The version prefix is everything up to and including the first ":" (base64
    // never contains one) — derived from a real blob so these stay correct if the
    // prefix string ever changes.
    const versionPrefix = (() => {
      const sample = encrypt("x");
      return sample.slice(0, sample.indexOf(":") + 1);
    })();

    it("throws when the ciphertext body is altered", () => {
      const blob = encrypt("integrity matters");
      const body = blob.slice(versionPrefix.length);
      const flippedChar = body[body.length - 2] === "A" ? "B" : "A";
      const tampered =
        versionPrefix + body.slice(0, body.length - 2) + flippedChar + body.slice(body.length - 1);
      expect(() => decrypt(tampered)).toThrow();
    });

    it("throws when the blob is truncated below the iv+tag length", () => {
      expect(() => decrypt(`${versionPrefix}AAAA`)).toThrow();
    });
  });

  describe("rejects non-encrypted input (all stored content is encrypted)", () => {
    it("throws on an un-prefixed value", () => {
      expect(() => decrypt("just a plain old comment")).toThrow();
    });

    it("throws on an empty string", () => {
      expect(() => decrypt("")).toThrow();
    });
  });
});
