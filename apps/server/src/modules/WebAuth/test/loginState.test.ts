import { describe, expect, it } from "vitest";
import { LOGIN_STATE_COOKIE_NAME, LOGIN_STATE_COOKIE_PATH } from "@mooduck/contracts";
import { readCookie } from "../cookies";
import {
  isWellFormedLoginState,
  loginStateMatches,
  serializeClearedLoginStateCookie,
} from "../loginState";

const NONCE = "a1b2c3d4e5f60718293a4b5c6d7e8f90";

describe("loginState.ts", () => {
  describe("isWellFormedLoginState", () => {
    it("should accept a hex nonce of the length the client generates", () => {
      expect(isWellFormedLoginState(NONCE)).toBe(true);
    });

    it("should reject anything too short to be worth guessing against", () => {
      expect(isWellFormedLoginState("a1b2c3d4e5f6071")).toBe(false);
    });

    it("should reject an over-long value rather than hashing megabytes", () => {
      expect(isWellFormedLoginState("a".repeat(129))).toBe(false);
    });

    it("should reject characters that never appear in a generated nonce", () => {
      expect(isWellFormedLoginState(`${NONCE.slice(0, 31)};`)).toBe(false);
      expect(isWellFormedLoginState(`${NONCE.slice(0, 31)} `)).toBe(false);
    });

    it("should reject non-strings", () => {
      expect(isWellFormedLoginState(undefined)).toBe(false);
      expect(isWellFormedLoginState(12345678901234567890)).toBe(false);
      // Express gives a repeated query parameter as an array — never a match.
      expect(isWellFormedLoginState([NONCE])).toBe(false);
    });
  });

  describe("loginStateMatches", () => {
    it("should accept the nonce the browser echoed back", () => {
      expect(loginStateMatches(NONCE, NONCE)).toBe(true);
    });

    it("should reject a callback whose query nonce differs from the cookie", () => {
      // The login-CSRF case: the attacker's signed payload arrives with their
      // nonce, but the victim's browser sends its own cookie (or none).
      expect(loginStateMatches(NONCE, `b${NONCE.slice(1)}`)).toBe(false);
    });

    it("should reject a callback with no state cookie at all", () => {
      expect(loginStateMatches(NONCE, undefined)).toBe(false);
    });

    it("should reject a callback with no state in the query", () => {
      expect(loginStateMatches(undefined, NONCE)).toBe(false);
    });

    it("should not treat a prefix as a match", () => {
      expect(loginStateMatches(NONCE.slice(0, 16), NONCE)).toBe(false);
    });

    it("should reject when both sides are missing, rather than matching on emptiness", () => {
      expect(loginStateMatches(undefined, undefined)).toBe(false);
      expect(loginStateMatches("", "")).toBe(false);
    });
  });

  describe("serializeClearedLoginStateCookie", () => {
    it("should expire the cookie on the path the browser wrote it to", () => {
      const cookie = serializeClearedLoginStateCookie(true);

      expect(cookie).toContain(`${LOGIN_STATE_COOKIE_NAME}=`);
      expect(cookie).toContain(`Path=${LOGIN_STATE_COOKIE_PATH}`);
      expect(cookie).toContain("Max-Age=0");
    });

    it("should stay SameSite=Lax so it survives the top-level callback navigation", () => {
      expect(serializeClearedLoginStateCookie(true)).toContain("SameSite=Lax");
    });

    it("should only set Secure when the caller is on https", () => {
      expect(serializeClearedLoginStateCookie(true)).toContain("; Secure");
      expect(serializeClearedLoginStateCookie(false)).not.toContain("Secure");
    });
  });

  describe("readCookie", () => {
    it("should find the state cookie among others", () => {
      const header = `mooduck_session=abc; ${LOGIN_STATE_COOKIE_NAME}=${NONCE}; other=1`;

      expect(readCookie(header, LOGIN_STATE_COOKIE_NAME)).toBe(NONCE);
    });

    it("should return undefined when the header is absent or the cookie is missing", () => {
      expect(readCookie(undefined, LOGIN_STATE_COOKIE_NAME)).toBeUndefined();
      expect(readCookie("other=1", LOGIN_STATE_COOKIE_NAME)).toBeUndefined();
    });

    it("should not match a cookie whose name merely ends with ours", () => {
      expect(readCookie(`not_${LOGIN_STATE_COOKIE_NAME}=${NONCE}`, LOGIN_STATE_COOKIE_NAME)).toBeUndefined();
    });
  });
});
