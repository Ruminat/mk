import { RateLimiterMemory } from "rate-limiter-flexible";
import type { PerUserRateLimiterOptions } from "./models/rateLimiterOptions";

/**
 * Thin, reliable per-key rate limiter for work that isn't tied to an HTTP
 * request (e.g. Telegram messages), where `express-rate-limit` doesn't apply.
 *
 * Backed by `rate-limiter-flexible` (RateLimiterMemory): it handles the window
 * math and expires keys on its own, so memory stays bounded to active keys.
 * Swappable for a Redis-backed store later without touching call sites.
 */
export class PerUserRateLimiter {
  private readonly limiter: RateLimiterMemory;

  constructor({ points, durationSec }: PerUserRateLimiterOptions) {
    this.limiter = new RateLimiterMemory({ points, duration: durationSec });
  }

  /** Consume one point for `key`. Resolves `true` if allowed, `false` if throttled. */
  async tryConsume(key: string): Promise<boolean> {
    try {
      await this.limiter.consume(key, 1);
      return true;
    } catch (rejection) {
      // The library rejects with a RateLimiterRes when throttled, but with a real
      // Error on an actual store failure — only the former means "throttled".
      if (rejection instanceof Error) {
        throw rejection;
      }
      return false;
    }
  }

  /** Drop everything remembered about `key` — its counter and its current window. */
  async reset(key: string): Promise<void> {
    await this.limiter.delete(key);
  }
}
