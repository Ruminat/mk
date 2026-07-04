import { afterEach, describe, expect, it, vi } from "vitest";
import { PerUserRateLimiter } from "../rateLimiter";

describe("rateLimiter.ts / PerUserRateLimiter", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should allow every consumption when the user stays within `points`", async () => {
    const limiter = new PerUserRateLimiter({ points: 3, durationSec: 60 });

    const results = [
      await limiter.tryConsume("user-1"),
      await limiter.tryConsume("user-1"),
      await limiter.tryConsume("user-1"),
    ];

    expect(results).toEqual([true, true, true]);
  });

  it("should throttle the next consumption when the user exceeds `points`", async () => {
    const limiter = new PerUserRateLimiter({ points: 2, durationSec: 60 });

    await limiter.tryConsume("user-1");
    await limiter.tryConsume("user-1");
    const throttled = await limiter.tryConsume("user-1");

    expect(throttled).toBe(false);
  });

  it("should count each user separately when different keys consume", async () => {
    const limiter = new PerUserRateLimiter({ points: 1, durationSec: 60 });

    const firstUser = await limiter.tryConsume("user-1");
    const secondUser = await limiter.tryConsume("user-2");
    const firstUserAgain = await limiter.tryConsume("user-1");

    expect({ firstUser, secondUser, firstUserAgain }).toEqual({
      firstUser: true,
      secondUser: true,
      firstUserAgain: false,
    });
  });

  it("should allow consumption again when the window has fully elapsed", async () => {
    vi.useFakeTimers();
    const limiter = new PerUserRateLimiter({ points: 1, durationSec: 60 });

    await limiter.tryConsume("user-1");
    const throttledInWindow = await limiter.tryConsume("user-1");

    vi.advanceTimersByTime(60_000);
    const afterWindow = await limiter.tryConsume("user-1");

    expect({ throttledInWindow, afterWindow }).toEqual({
      throttledInWindow: false,
      afterWindow: true,
    });
  });

  it("should keep throttling when only part of the window has elapsed", async () => {
    vi.useFakeTimers();
    const limiter = new PerUserRateLimiter({ points: 1, durationSec: 60 });

    await limiter.tryConsume("user-1");

    vi.advanceTimersByTime(30_000);
    const stillInWindow = await limiter.tryConsume("user-1");

    expect(stillInWindow).toBe(false);
  });
});
