import { RateLimiterMemory } from "rate-limiter-flexible";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PerUserRateLimiterOptions } from "../models/rateLimiterOptions";
import { PerUserRateLimiter } from "../rateLimiter";

/** Build a limiter with sane defaults; override only what a test cares about. */
function makeLimiter(options: Partial<PerUserRateLimiterOptions> = {}): PerUserRateLimiter {
  return new PerUserRateLimiter({ points: 3, durationSec: 60, ...options });
}

/** Consume `times` in a row for one key and collect each verdict, in order. */
async function consumeInSequence(
  limiter: PerUserRateLimiter,
  key: string,
  times: number,
): Promise<boolean[]> {
  const verdicts: boolean[] = [];
  for (let i = 0; i < times; i++) {
    verdicts.push(await limiter.tryConsume(key));
  }
  return verdicts;
}

/** Fire `times` consumptions concurrently for one key (a burst / thundering herd). */
async function consumeConcurrently(
  limiter: PerUserRateLimiter,
  key: string,
  times: number,
): Promise<boolean[]> {
  return Promise.all(Array.from({ length: times }, () => limiter.tryConsume(key)));
}

const countAllowed = (verdicts: boolean[]): number => verdicts.filter(Boolean).length;

describe("rateLimiter.ts / PerUserRateLimiter", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("basic allowance within the window", () => {
    it("should allow every consumption when the user stays within `points`", async () => {
      const limiter = makeLimiter({ points: 3 });

      const verdicts = await consumeInSequence(limiter, "user-1", 3);

      expect(verdicts).toEqual([true, true, true]);
    });

    it("should allow exactly `points` and throttle only the very next one (boundary)", async () => {
      const limiter = makeLimiter({ points: 3 });

      const verdicts = await consumeInSequence(limiter, "user-1", 4);

      expect(verdicts).toEqual([true, true, true, false]);
    });

    it("should allow a single request when `points` is 1", async () => {
      const limiter = makeLimiter({ points: 1 });

      const verdicts = await consumeInSequence(limiter, "user-1", 2);

      expect(verdicts).toEqual([true, false]);
    });

    it("should never allow anything when `points` is 0", async () => {
      const limiter = makeLimiter({ points: 0 });

      const verdicts = await consumeInSequence(limiter, "user-1", 3);

      expect(verdicts).toEqual([false, false, false]);
    });

    it("should keep returning false for every extra attempt once over the limit", async () => {
      const limiter = makeLimiter({ points: 2 });

      const verdicts = await consumeInSequence(limiter, "spammer", 6);

      expect(verdicts).toEqual([true, true, false, false, false, false]);
    });
  });

  describe("per-user isolation — one abuser must not starve everyone else", () => {
    it("should count each user separately when different keys consume", async () => {
      const limiter = makeLimiter({ points: 1 });

      const firstUser = await limiter.tryConsume("user-1");
      const secondUser = await limiter.tryConsume("user-2");
      const firstUserAgain = await limiter.tryConsume("user-1");

      expect({ firstUser, secondUser, firstUserAgain }).toEqual({
        firstUser: true,
        secondUser: true,
        firstUserAgain: false,
      });
    });

    it("should still fully serve a fresh user while another user is completely throttled", async () => {
      const limiter = makeLimiter({ points: 2 });

      // Abuser burns through their budget and gets blocked.
      const abuser = await consumeInSequence(limiter, "abuser", 10);
      // A legit user shows up afterwards and must get their full allowance.
      const legit = await consumeInSequence(limiter, "legit", 2);

      expect(countAllowed(abuser)).toBe(2);
      expect(legit).toEqual([true, true]);
    });

    it("should treat visually similar keys as distinct buckets", async () => {
      const limiter = makeLimiter({ points: 1 });

      const results = {
        empty: await limiter.tryConsume(""),
        space: await limiter.tryConsume(" "),
        zero: await limiter.tryConsume("0"),
        unicode: await limiter.tryConsume("user-1​"),
        plain: await limiter.tryConsume("user-1"),
      };

      expect(results).toEqual({
        empty: true,
        space: true,
        zero: true,
        unicode: true,
        plain: true,
      });
    });

    it("should keep an empty-string key isolated from other keys", async () => {
      const limiter = makeLimiter({ points: 1 });

      const emptyFirst = await limiter.tryConsume("");
      const emptySecond = await limiter.tryConsume("");
      const otherUser = await limiter.tryConsume("user-1");

      expect({ emptyFirst, emptySecond, otherUser }).toEqual({
        emptyFirst: true,
        emptySecond: false,
        otherUser: true,
      });
    });
  });

  describe("bursts / concurrency — the thundering-herd (DDoS) case", () => {
    it("should let through exactly `points` when many requests arrive at once", async () => {
      const limiter = makeLimiter({ points: 15 });

      const verdicts = await consumeConcurrently(limiter, "user-1", 50);

      expect(countAllowed(verdicts)).toBe(15);
      expect(verdicts.filter((allowed) => !allowed)).toHaveLength(35);
    });

    it("should not leak extra allowances when the burst exactly equals `points`", async () => {
      const limiter = makeLimiter({ points: 15 });

      const verdicts = await consumeConcurrently(limiter, "user-1", 15);

      expect(countAllowed(verdicts)).toBe(15);
    });

    it("should give every user their own full budget under a simultaneous multi-user burst", async () => {
      const limiter = makeLimiter({ points: 5 });
      const users = ["a", "b", "c", "d"];

      const perUser = await Promise.all(
        users.map((user) => consumeConcurrently(limiter, user, 20)),
      );

      for (const verdicts of perUser) {
        expect(countAllowed(verdicts)).toBe(5);
      }
    });
  });

  describe("window reset — fixed window, boundaries, and recovery", () => {
    it("should keep throttling when only part of the window has elapsed", async () => {
      vi.useFakeTimers();
      const limiter = makeLimiter({ points: 1, durationSec: 60 });

      await limiter.tryConsume("user-1");

      vi.advanceTimersByTime(30_000);
      const stillInWindow = await limiter.tryConsume("user-1");

      expect(stillInWindow).toBe(false);
    });

    it("should still throttle one millisecond before the window closes", async () => {
      vi.useFakeTimers();
      const limiter = makeLimiter({ points: 1, durationSec: 60 });

      await limiter.tryConsume("user-1");

      vi.advanceTimersByTime(59_999);
      const justBeforeReset = await limiter.tryConsume("user-1");

      expect(justBeforeReset).toBe(false);
    });

    it("should allow consumption again once the window has fully elapsed", async () => {
      vi.useFakeTimers();
      const limiter = makeLimiter({ points: 1, durationSec: 60 });

      await limiter.tryConsume("user-1");
      const throttledInWindow = await limiter.tryConsume("user-1");

      vi.advanceTimersByTime(60_000);
      const afterWindow = await limiter.tryConsume("user-1");

      expect({ throttledInWindow, afterWindow }).toEqual({
        throttledInWindow: false,
        afterWindow: true,
      });
    });

    it("should restore the FULL budget (not just one slot) after the window resets", async () => {
      vi.useFakeTimers();
      const limiter = makeLimiter({ points: 3, durationSec: 60 });

      const firstWindow = await consumeInSequence(limiter, "user-1", 4);

      vi.advanceTimersByTime(60_000);
      const secondWindow = await consumeInSequence(limiter, "user-1", 4);

      expect(firstWindow).toEqual([true, true, true, false]);
      expect(secondWindow).toEqual([true, true, true, false]);
    });

    it("should not extend a user's block when they keep hammering inside the window", async () => {
      vi.useFakeTimers();
      const limiter = makeLimiter({ points: 1, durationSec: 60 });

      // First request opens the window; a flood of rejected attempts follows.
      await limiter.tryConsume("user-1");
      await consumeInSequence(limiter, "user-1", 100);

      // The window must still close on schedule — spamming doesn't punish longer.
      vi.advanceTimersByTime(60_000);
      const afterWindow = await limiter.tryConsume("user-1");

      expect(afterWindow).toBe(true);
    });

    it("should serve a steady user forever when they stay under the limit across many windows", async () => {
      vi.useFakeTimers();
      const limiter = makeLimiter({ points: 3, durationSec: 60 });
      const verdicts: boolean[] = [];

      // Two requests per minute for ten minutes — comfortably under the limit.
      for (let minute = 0; minute < 10; minute++) {
        verdicts.push(await limiter.tryConsume("steady-user"));
        verdicts.push(await limiter.tryConsume("steady-user"));
        vi.advanceTimersByTime(60_000);
      }

      expect(verdicts).toHaveLength(20);
      expect(verdicts.every(Boolean)).toBe(true);
    });

    it("should honour a short window independently of the default", async () => {
      vi.useFakeTimers();
      const limiter = makeLimiter({ points: 1, durationSec: 1 });

      await limiter.tryConsume("user-1");
      const withinSecond = await limiter.tryConsume("user-1");

      vi.advanceTimersByTime(1_000);
      const afterSecond = await limiter.tryConsume("user-1");

      expect({ withinSecond, afterSecond }).toEqual({
        withinSecond: false,
        afterSecond: true,
      });
    });
  });

  describe("store failures — must not be silently read as a verdict", () => {
    it("should propagate a real store error instead of swallowing it as 'throttled'", async () => {
      const storeError = new Error("store is down");
      vi.spyOn(RateLimiterMemory.prototype, "consume").mockRejectedValueOnce(storeError);
      const limiter = makeLimiter();

      await expect(limiter.tryConsume("user-1")).rejects.toThrow("store is down");
    });

    it("should recover on the next call once the store error clears", async () => {
      vi.spyOn(RateLimiterMemory.prototype, "consume").mockRejectedValueOnce(
        new Error("transient store failure"),
      );
      const limiter = makeLimiter({ points: 1 });

      await expect(limiter.tryConsume("user-1")).rejects.toThrow("transient store failure");
      const afterRecovery = await limiter.tryConsume("user-1");

      expect(afterRecovery).toBe(true);
    });
  });
});
