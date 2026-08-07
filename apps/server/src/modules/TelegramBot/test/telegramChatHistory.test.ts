import { describe, expect, it } from "vitest";
import {
  createTelegramChatHistory,
  type TTelegramChatHistoryEntry,
  type TTelegramChatHistoryOptions,
  type TTelegramChatHistoryStore,
} from "../telegramChatHistory";

/**
 * A hand-advanced clock so TTL behaviour is fully deterministic (no real timers).
 * Starts at a positive base because lru-cache treats a `0` timestamp as "no TTL".
 */
function makeClock(start = 1_000_000) {
  let current = start;
  return {
    clock: { now: () => current },
    advance: (ms: number) => {
      current += ms;
    },
  };
}

/** An in-memory stand-in for the durable store; records appends so we can assert on them. */
function makeFakeStore(seed: Record<string, TTelegramChatHistoryEntry[]> = {}) {
  const data = new Map<string, TTelegramChatHistoryEntry[]>(
    Object.entries(seed).map(([key, value]) => [key, [...value]]),
  );
  const appendCalls: { hash: string; entry: TTelegramChatHistoryEntry; keepLast: number }[] = [];

  const store: TTelegramChatHistoryStore = {
    loadRecent: async (hash, limit) => (data.get(hash) ?? []).slice(-limit),
    append: async (hash, entry, keepLast) => {
      appendCalls.push({ hash, entry, keepLast });
      const arr = data.get(hash) ?? [];
      arr.push(entry);
      if (arr.length > keepLast) {
        arr.splice(0, arr.length - keepLast);
      }
      data.set(hash, arr);
    },
    clear: async (hash) => {
      const removed = data.get(hash)?.length ?? 0;
      data.delete(hash);
      return removed;
    },
  };

  return { data, appendCalls, store };
}

function makeHistory(options: TTelegramChatHistoryOptions = {}) {
  // A frozen clock by default: nothing expires unless a test advances it.
  return createTelegramChatHistory({ clock: makeClock().clock, ...options });
}

const userMessage = (text: string): TTelegramChatHistoryEntry => ({ role: "user", text });
const texts = (entries: readonly TTelegramChatHistoryEntry[]) => entries.map((entry) => entry.text);

describe("telegramUserChatHistory.ts / createTelegramChatHistory", () => {
  describe("per-user message cap (in-memory only)", () => {
    it("should keep only the most recent messages when a user exceeds the cap", async () => {
      const history = makeHistory({ maxMessagesPerUser: 3 });

      for (const text of ["1", "2", "3", "4", "5"]) {
        await history.append("user-1", userMessage(text));
      }

      expect(texts(await history.getRecent("user-1"))).toEqual(["3", "4", "5"]);
    });

    it("should return an empty history for an unknown user", async () => {
      const history = makeHistory();

      expect(await history.getRecent("nobody")).toEqual([]);
    });

    it("should keep each user's history separate", async () => {
      const history = makeHistory();

      await history.append("user-1", userMessage("a"));
      await history.append("user-2", userMessage("b"));

      expect(texts(await history.getRecent("user-1"))).toEqual(["a"]);
      expect(texts(await history.getRecent("user-2"))).toEqual(["b"]);
    });
  });

  describe("bounded user count — the memory-leak fix", () => {
    it("should evict the least-recently-used user once the tracked-user cap is exceeded", async () => {
      const history = makeHistory({ maxTrackedUsers: 3 });

      await history.append("user-1", userMessage("a"));
      await history.append("user-2", userMessage("b"));
      await history.append("user-3", userMessage("c"));
      await history.append("user-4", userMessage("d")); // pushes out user-1

      expect(await history.getRecent("user-1")).toEqual([]);
      expect(texts(await history.getRecent("user-4"))).toEqual(["d"]);
    });

    it("should never hold more than the cap even under many distinct users", async () => {
      const history = makeHistory({ maxTrackedUsers: 10 });

      for (let i = 0; i < 1000; i++) {
        await history.append(`user-${i}`, userMessage("x"));
      }

      // The 990 oldest are gone from the cache; only the last 10 survive.
      expect(await history.getRecent("user-0")).toEqual([]);
      expect(texts(await history.getRecent("user-999"))).toEqual(["x"]);
    });

    it("should spare a user from eviction when they were recently read", async () => {
      const history = makeHistory({ maxTrackedUsers: 3 });

      await history.append("user-1", userMessage("a"));
      await history.append("user-2", userMessage("b"));
      await history.append("user-3", userMessage("c"));

      // Touch user-1 so it is no longer the least-recently-used.
      await history.getRecent("user-1");

      await history.append("user-4", userMessage("d")); // should evict user-2, not user-1

      expect(texts(await history.getRecent("user-1"))).toEqual(["a"]);
      expect(await history.getRecent("user-2")).toEqual([]);
    });
  });

  describe("TTL — inactive cache entries are dropped", () => {
    it("should forget a user's cached history after the TTL elapses without activity", async () => {
      const { clock, advance } = makeClock();
      const history = createTelegramChatHistory({ ttlMs: 1000, clock });

      await history.append("user-1", userMessage("a"));

      advance(1001);

      expect(await history.getRecent("user-1")).toEqual([]);
    });

    it("should keep a history alive across the TTL while the conversation stays active", async () => {
      const { clock, advance } = makeClock();
      const history = createTelegramChatHistory({ ttlMs: 1000, clock });

      await history.append("user-1", userMessage("a"));

      advance(600);
      // Reading it (to build a prompt) counts as activity and refreshes the TTL.
      expect(texts(await history.getRecent("user-1"))).toEqual(["a"]);

      advance(600); // 1200ms since the append, but only 600ms since the last read
      expect(texts(await history.getRecent("user-1"))).toEqual(["a"]);
    });
  });

  describe("persistence — durable store survives restarts", () => {
    it("should write every message through to the store", async () => {
      const backing = makeFakeStore();
      const history = makeHistory({ store: backing.store, maxMessagesPerUser: 5 });

      await history.append("user-1", userMessage("hello"));

      expect(backing.appendCalls).toEqual([
        { hash: "user-1", entry: { role: "user", text: "hello" }, keepLast: 5 },
      ]);
      expect(texts(backing.data.get("user-1") ?? [])).toEqual(["hello"]);
    });

    it("should restore a user's history from the store after a restart (empty cache)", async () => {
      const backing = makeFakeStore({
        "user-1": [userMessage("earlier-1"), userMessage("earlier-2")],
      });

      // A brand-new instance models the process restarting with an empty cache.
      const restarted = makeHistory({ store: backing.store });

      expect(texts(await restarted.getRecent("user-1"))).toEqual(["earlier-1", "earlier-2"]);
    });

    it("should append onto the restored history, not a blank one, on the first message after restart", async () => {
      const backing = makeFakeStore({
        "user-1": [userMessage("before-restart")],
      });
      const restarted = makeHistory({ store: backing.store });

      await restarted.append("user-1", userMessage("after-restart"));

      expect(texts(await restarted.getRecent("user-1"))).toEqual(["before-restart", "after-restart"]);
      expect(texts(backing.data.get("user-1") ?? [])).toEqual(["before-restart", "after-restart"]);
    });

    it("should only load the capped number of messages when hydrating from the store", async () => {
      const backing = makeFakeStore({
        "user-1": [userMessage("1"), userMessage("2"), userMessage("3"), userMessage("4")],
      });
      const restarted = makeHistory({ store: backing.store, maxMessagesPerUser: 2 });

      expect(texts(await restarted.getRecent("user-1"))).toEqual(["3", "4"]);
    });
  });

  describe("clear — erasing a user (/forget-me)", () => {
    it("should remove the history from both the store and the cache", async () => {
      const backing = makeFakeStore();
      const history = makeHistory({ store: backing.store });

      await history.append("user-1", userMessage("a"));
      await history.append("user-1", userMessage("b"));

      expect(await history.clear("user-1")).toBe(2);

      expect(backing.data.get("user-1")).toBeUndefined();
      // Nothing left to rehydrate from, so the cleared history stays empty.
      expect(await history.getRecent("user-1")).toEqual([]);
    });

    it("should leave other users untouched", async () => {
      const backing = makeFakeStore();
      const history = makeHistory({ store: backing.store });

      await history.append("user-1", userMessage("a"));
      await history.append("user-2", userMessage("b"));

      await history.clear("user-1");

      expect(texts(await history.getRecent("user-2"))).toEqual(["b"]);
    });

    it("should be a no-op for a user with no history", async () => {
      const history = makeHistory({ store: makeFakeStore().store });

      expect(await history.clear("nobody")).toBe(0);
    });

    it("should start a clean history when the user comes back", async () => {
      const backing = makeFakeStore();
      const history = makeHistory({ store: backing.store });

      await history.append("user-1", userMessage("before"));
      await history.clear("user-1");
      await history.append("user-1", userMessage("after"));

      expect(texts(await history.getRecent("user-1"))).toEqual(["after"]);
    });
  });
});
