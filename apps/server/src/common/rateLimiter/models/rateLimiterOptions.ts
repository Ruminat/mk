export type PerUserRateLimiterOptions = {
  /** Max actions allowed per key within `durationSec`. */
  points: number;
  /** Length of the window, in seconds, before a key's points reset. */
  durationSec: number;
};
