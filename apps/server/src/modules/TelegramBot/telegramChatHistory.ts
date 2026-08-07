import { LRUCache } from "lru-cache";

/** How many of a user's most recent messages we keep for AI context. */
const MAX_CHAT_MESSAGES = 10;
/** Hard cap on how many users' histories live in memory; least-recently-used are evicted. */
const MAX_TRACKED_USERS = 5000;
/** Drop a user's cached history after this long without activity (it's reloaded from the store on demand). */
const HISTORY_TTL_MS = 60 * 60 * 1000;

export type TTelegramChatHistoryEntry = {
  role: "user" | "assistant";
  text: string;
};

/**
 * Durable backing store for chat history. The cache is only an in-memory
 * accelerator; this is the source of truth that survives restarts/releases.
 */
export type TTelegramChatHistoryStore = {
  /** Most recent `limit` messages for a user, oldest-first. */
  loadRecent: (telegramUserIdHash: string, limit: number) => Promise<TTelegramChatHistoryEntry[]>;
  /** Persist one message and keep only the user's most recent `keepLast`. */
  append: (telegramUserIdHash: string, entry: TTelegramChatHistoryEntry, keepLast: number) => Promise<void>;
  /** Drop everything stored for a user; resolves with how many messages were removed. */
  clear: (telegramUserIdHash: string) => Promise<number>;
};

/** A clock with a `now()` method, matching `lru-cache`'s `perf` option (injectable for tests). */
type TClock = { now: () => number };

export type TTelegramChatHistoryOptions = {
  maxMessagesPerUser?: number;
  maxTrackedUsers?: number;
  ttlMs?: number;
  clock?: TClock;
  /** Persistence layer; omit for a pure in-memory (non-durable) history. */
  store?: TTelegramChatHistoryStore;
};

export type TTelegramChatHistory = {
  append: (telegramUserIdHash: string, entry: TTelegramChatHistoryEntry) => Promise<void>;
  getRecent: (telegramUserIdHash: string) => Promise<readonly TTelegramChatHistoryEntry[]>;
  /** Erase a user's history everywhere; resolves with how many messages were removed. */
  clear: (telegramUserIdHash: string) => Promise<number>;
};

/**
 * Per-user chat history for the bot's AI context.
 *
 * Write-through: the durable `store` is the source of truth, and an LRU cache
 * sits in front of it for speed and bounded memory. At most `maxTrackedUsers`
 * histories are cached (least-recently-active evicted) and each expires after
 * `ttlMs` of inactivity — on a miss (e.g. right after a restart) it's rehydrated
 * from the store, so context survives releases.
 */
export function createTelegramChatHistory(options: TTelegramChatHistoryOptions = {}): TTelegramChatHistory {
  const maxMessagesPerUser = options.maxMessagesPerUser ?? MAX_CHAT_MESSAGES;
  const ttl = options.ttlMs ?? HISTORY_TTL_MS;
  const store = options.store;

  const cache = new LRUCache<string, TTelegramChatHistoryEntry[]>({
    max: options.maxTrackedUsers ?? MAX_TRACKED_USERS,
    ttl,
    // Read the clock on every check instead of debouncing it (which relies on a
    // real timer). Cost is negligible at our message rate and keeps expiry exact.
    ttlResolution: 0,
    // Keep an ongoing conversation alive: reading it to build the prompt counts as activity.
    updateAgeOnGet: true,
    ...(options.clock ? { perf: options.clock } : {}),
  });

  /** Return the cached history, hydrating it from the store on a miss. */
  async function load(telegramUserIdHash: string): Promise<TTelegramChatHistoryEntry[]> {
    const cached = cache.get(telegramUserIdHash);
    if (cached) {
      return cached;
    }

    const loaded = store ? await store.loadRecent(telegramUserIdHash, maxMessagesPerUser) : [];
    if (loaded.length > 0) {
      cache.set(telegramUserIdHash, loaded);
    }
    return loaded;
  }

  async function append(telegramUserIdHash: string, entry: TTelegramChatHistoryEntry): Promise<void> {
    const existing = await load(telegramUserIdHash);
    const next = [...existing, entry];
    if (next.length > maxMessagesPerUser) {
      next.splice(0, next.length - maxMessagesPerUser);
    }
    cache.set(telegramUserIdHash, next);

    if (store) {
      await store.append(telegramUserIdHash, entry, maxMessagesPerUser);
    }
  }

  async function getRecent(telegramUserIdHash: string): Promise<readonly TTelegramChatHistoryEntry[]> {
    return load(telegramUserIdHash);
  }

  async function clear(telegramUserIdHash: string): Promise<number> {
    // Durable rows first: dropping the cache before them would let a concurrent
    // read rehydrate it from the very rows we're about to delete.
    const removed = store ? await store.clear(telegramUserIdHash) : 0;
    cache.delete(telegramUserIdHash);
    return removed;
  }

  return { append, getRecent, clear };
}
