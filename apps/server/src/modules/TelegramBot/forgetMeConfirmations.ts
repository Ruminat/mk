import { LRUCache } from "lru-cache";

/** How long the user has to confirm before the request goes stale. */
const CONFIRMATION_TTL_MS = 5 * 60 * 1000;
/** Bounded like every other per-user cache here; the least-recent requests are dropped. */
const MAX_PENDING_USERS = 1000;

/**
 * The exact words that confirm the deletion. Compared against `messageParsed`
 * (already lowercased and trimmed), so "Forget Me" works too.
 */
export const FORGET_ME_CONFIRMATION_PHRASE = "forget me";

/** A clock with a `now()` method, matching `lru-cache`'s `perf` option (injectable for tests). */
type TClock = { now: () => number };

export type TForgetMeConfirmationsOptions = {
  ttlMs?: number;
  maxPendingUsers?: number;
  clock?: TClock;
};

export type TForgetMeConfirmations = {
  /** Remember that this user asked to be forgotten and is one phrase away from it. */
  request: (telegramUserIdHash: string) => void;
  isPending: (telegramUserIdHash: string) => boolean;
  /** Forget the request itself — after it's honoured, or when the user does anything else. */
  clear: (telegramUserIdHash: string) => void;
};

/**
 * Tracks who is awaiting confirmation of `/forget-me`.
 *
 * Deliberately in-memory and short-lived: a confirmation that outlives a restart
 * — or an hour of silence — isn't a confirmation of anything any more, and this
 * is the one command with no undo.
 */
export function createForgetMeConfirmations(
  options: TForgetMeConfirmationsOptions = {},
): TForgetMeConfirmations {
  const cache = new LRUCache<string, true>({
    max: options.maxPendingUsers ?? MAX_PENDING_USERS,
    ttl: options.ttlMs ?? CONFIRMATION_TTL_MS,
    // Read the clock on every check rather than debouncing it, so the window
    // expires exactly when it should (same reasoning as the chat history cache).
    ttlResolution: 0,
    ...(options.clock ? { perf: options.clock } : {}),
  });

  return {
    request: (telegramUserIdHash) => {
      cache.set(telegramUserIdHash, true);
    },
    // `has` doesn't refresh the TTL: the window is counted from the request, not
    // from the last time we looked at it.
    isPending: (telegramUserIdHash) => cache.has(telegramUserIdHash),
    clear: (telegramUserIdHash) => {
      cache.delete(telegramUserIdHash);
    },
  };
}

/** The app-wide pending-confirmation state. */
export const forgetMeConfirmations = createForgetMeConfirmations();
