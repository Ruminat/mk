import { createHash, createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import { verifyTelegramLogin } from "../verifyTelegramLogin";

const FAKE_TOKEN = "123456:fake-bot-token-for-tests";
const AUTH_DATE = 1_700_000_000; // seconds
const NOW = AUTH_DATE * 1000 + 60_000; // one minute after auth_date

/** Sign a payload the same way Telegram's Login Widget does. */
function sign(fields: Record<string, string | number>, token: string): Record<string, string | number> {
  const dataCheckString = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join("\n");
  const secretKey = createHash("sha256").update(token).digest();
  const hash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  return { ...fields, hash };
}

function validFields(): Record<string, string | number> {
  return {
    id: 42,
    first_name: "Vlad",
    username: "vlad",
    photo_url: "https://t.me/i/userpic/320/abc.jpg",
    auth_date: AUTH_DATE,
  };
}

describe("verifyTelegramLogin", () => {
  it("should accept a correctly signed payload and return the user", () => {
    const payload = sign(validFields(), FAKE_TOKEN);
    const result = verifyTelegramLogin(payload, FAKE_TOKEN, { now: NOW });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.id).toBe(42);
      expect(result.user.firstName).toBe("Vlad");
      expect(result.user.photoUrl).toBe("https://t.me/i/userpic/320/abc.jpg");
    }
  });

  it("should reject a tampered id", () => {
    const payload = sign(validFields(), FAKE_TOKEN);
    const result = verifyTelegramLogin({ ...payload, id: 43 }, FAKE_TOKEN, { now: NOW });
    expect(result).toEqual({ ok: false, reason: "invalid_hash" });
  });

  it("should reject a tampered hash", () => {
    const payload = sign(validFields(), FAKE_TOKEN);
    const result = verifyTelegramLogin({ ...payload, hash: "deadbeef".repeat(8) }, FAKE_TOKEN, { now: NOW });
    expect(result).toEqual({ ok: false, reason: "invalid_hash" });
  });

  it("should reject a missing hash", () => {
    const { hash: _hash, ...unsigned } = sign(validFields(), FAKE_TOKEN);
    const result = verifyTelegramLogin(unsigned, FAKE_TOKEN, { now: NOW });
    expect(result).toEqual({ ok: false, reason: "malformed" });
  });

  it("should reject an auth_date older than the max age", () => {
    const payload = sign(validFields(), FAKE_TOKEN);
    const twentyMinutesLater = AUTH_DATE * 1000 + 20 * 60 * 1000;
    const result = verifyTelegramLogin(payload, FAKE_TOKEN, { now: twentyMinutesLater });
    expect(result).toEqual({ ok: false, reason: "expired" });
  });

  it("should still verify when Telegram adds an unknown field", () => {
    const payload = sign({ ...validFields(), some_future_field: "x" }, FAKE_TOKEN);
    const result = verifyTelegramLogin(payload, FAKE_TOKEN, { now: NOW });
    expect(result.ok).toBe(true);
  });

  it("should reject a payload signed with a different bot token", () => {
    const payload = sign(validFields(), "999:some-other-token");
    const result = verifyTelegramLogin(payload, FAKE_TOKEN, { now: NOW });
    expect(result).toEqual({ ok: false, reason: "invalid_hash" });
  });

  it("should reject a non-positive id even when correctly signed", () => {
    const payload = sign({ ...validFields(), id: 0 }, FAKE_TOKEN);
    const result = verifyTelegramLogin(payload, FAKE_TOKEN, { now: NOW });
    expect(result).toEqual({ ok: false, reason: "invalid_id" });
  });

  it("should drop a photo_url that isn't https on a Telegram host", () => {
    const payload = sign(
      { ...validFields(), photo_url: "http://evil.example.com/x.jpg" },
      FAKE_TOKEN,
    );
    const result = verifyTelegramLogin(payload, FAKE_TOKEN, { now: NOW });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.photoUrl).toBeUndefined();
    }
  });
});
