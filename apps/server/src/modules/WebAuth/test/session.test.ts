import { describe, expect, it } from "vitest";
import {
  mintSessionPayload,
  readSessionCookie,
  sealSession,
  serializeClearedSessionCookie,
  serializeSessionCookie,
  SESSION_COOKIE_NAME,
  unsealSession,
  type TSessionPayload,
} from "../session";

const SECRET = "a-web-session-secret-at-least-32-chars-long";
const OTHER_SECRET = "a-different-web-session-secret-32-chars-plus";
const NOW = 1_700_000_000_000;

function makePayload(overrides: Partial<TSessionPayload> = {}): TSessionPayload {
  return mintSessionPayload({ tgId: 42, hash: "abc123", name: "Vlad", ...overrides }, NOW);
}

describe("session seal / unseal", () => {
  it("should round-trip a payload", () => {
    const payload = makePayload({ photo: "https://t.me/i/userpic/320/x.jpg" });
    const sealed = sealSession(payload, SECRET);
    expect(unsealSession(sealed, SECRET, NOW)).toEqual(payload);
  });

  it("should fail to unseal a tampered blob", () => {
    const sealed = sealSession(makePayload(), SECRET);
    const flipped = sealed.slice(0, -2) + (sealed.endsWith("a") ? "b" : "a") + sealed.slice(-1);
    expect(unsealSession(flipped, SECRET, NOW)).toBeNull();
  });

  it("should reject an expired payload", () => {
    const payload = makePayload();
    const sealed = sealSession(payload, SECRET);
    const afterExpiry = payload.exp + 1;
    expect(unsealSession(sealed, SECRET, afterExpiry)).toBeNull();
  });

  it("should reject a payload sealed with a different secret", () => {
    const sealed = sealSession(makePayload(), OTHER_SECRET);
    expect(unsealSession(sealed, SECRET, NOW)).toBeNull();
  });

  it("should reject a value that isn't our sealed format", () => {
    expect(unsealSession("not-a-sealed-cookie", SECRET, NOW)).toBeNull();
  });
});

describe("session cookie header", () => {
  it("should round-trip through the Cookie header", () => {
    const sealed = sealSession(makePayload(), SECRET);
    const setCookie = serializeSessionCookie(sealed, true);
    const cookieHeader = setCookie.split(";")[0]; // "name=value"
    expect(readSessionCookie(cookieHeader)).toBe(sealed);
  });

  it("should include the security flags and Secure when asked", () => {
    const setCookie = serializeSessionCookie("value", true);
    expect(setCookie).toContain(`${SESSION_COOKIE_NAME}=`);
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Strict");
    expect(setCookie).toContain("Path=/");
    expect(setCookie).toContain("Secure");
  });

  it("should omit Secure when not asked (local http dev)", () => {
    expect(serializeSessionCookie("value", false)).not.toContain("Secure");
  });

  it("should clear the cookie with Max-Age=0", () => {
    expect(serializeClearedSessionCookie(true)).toContain("Max-Age=0");
  });

  it("should return undefined when the cookie is absent", () => {
    expect(readSessionCookie(undefined)).toBeUndefined();
    expect(readSessionCookie("other=1; another=2")).toBeUndefined();
  });
});
