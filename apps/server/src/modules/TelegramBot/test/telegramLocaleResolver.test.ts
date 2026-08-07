import { describe, expect, it } from "vitest";
import {
  createTelegramLocaleResolver,
  type TResolveLocaleArgs,
} from "../telegramLocaleResolver";

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

/**
 * Sources that count how often they're read — the point of the cache is that the
 * database is queried for a user's language once, not once per message.
 */
function makeSources(chatTexts: string[] = [], moodComments: (string | null)[] = []) {
  const calls = { chat: 0, moods: 0 };

  return {
    calls,
    sources: {
      loadChatTexts: async () => {
        calls.chat++;
        return chatTexts;
      },
      loadMoodComments: async () => {
        calls.moods++;
        return moodComments;
      },
    },
  };
}

function turn(overrides: Partial<TResolveLocaleArgs> & Pick<TResolveLocaleArgs, "sources">) {
  return {
    telegramUserIdHash: "user-1",
    languageCode: "en",
    text: "7",
    ...overrides,
  } satisfies TResolveLocaleArgs;
}

describe("telegramLocaleResolver.ts / createTelegramLocaleResolver", () => {
  describe("what decides the locale", () => {
    it("should take a Russian message at its word, without reading any history", async () => {
      const resolver = createTelegramLocaleResolver();
      const { sources, calls } = makeSources();

      expect(await resolver.resolve(turn({ text: "5 как-то грустно...", sources }))).toBe("ru");
      expect(calls).toEqual({ chat: 0, moods: 0 });
    });

    it("should fall back to earlier chat messages for a bare score", async () => {
      const resolver = createTelegramLocaleResolver();
      const { sources } = makeSources(["5 как-то грустно..."]);

      expect(await resolver.resolve(turn({ text: "7", sources }))).toBe("ru");
    });

    it("should fall back to mood comments when the chat history has nothing Russian", async () => {
      const resolver = createTelegramLocaleResolver();
      const { sources } = makeSources([], ["навернул пельменей", null]);

      expect(await resolver.resolve(turn({ text: "7", sources }))).toBe("ru");
    });

    it("should not read mood entries when the chat history already settled it", async () => {
      const resolver = createTelegramLocaleResolver();
      const { sources, calls } = makeSources(["8 отличный день"], ["ещё по-русски"]);

      await resolver.resolve(turn({ text: "7", sources }));

      expect(calls).toEqual({ chat: 1, moods: 0 });
    });

    it("should stay English when neither the message nor the memory is Russian", async () => {
      const resolver = createTelegramLocaleResolver();
      const { sources, calls } = makeSources(["8 great day"], ["fine", null]);

      expect(await resolver.resolve(turn({ text: "7", sources }))).toBe("en");
      expect(calls).toEqual({ chat: 1, moods: 1 });
    });
  });

  describe("remembering it — one lookup per user, not per message", () => {
    it("should not read anything again on the next bare message", async () => {
      const resolver = createTelegramLocaleResolver();
      const { sources, calls } = makeSources(["5 грустно"]);

      expect(await resolver.resolve(turn({ text: "7", sources }))).toBe("ru");
      expect(await resolver.resolve(turn({ text: "8", sources }))).toBe("ru");
      expect(await resolver.resolve(turn({ text: "/stat", sources }))).toBe("ru");

      expect(calls).toEqual({ chat: 1, moods: 0 });
    });

    it("should remember an English verdict too, instead of re-querying for it", async () => {
      const resolver = createTelegramLocaleResolver();
      const { sources, calls } = makeSources(["8 great day"], ["fine"]);

      await resolver.resolve(turn({ text: "7", sources }));
      await resolver.resolve(turn({ text: "8", sources }));

      expect(calls).toEqual({ chat: 1, moods: 1 });
    });

    it("should remember a Russian message so the next bare one needs no lookup", async () => {
      const resolver = createTelegramLocaleResolver();
      const { sources, calls } = makeSources();

      await resolver.resolve(turn({ text: "5 как-то грустно...", sources }));

      expect(await resolver.resolve(turn({ text: "7", sources }))).toBe("ru");
      expect(calls).toEqual({ chat: 0, moods: 0 });
    });

    it("should let a Russian message override a remembered English verdict at once", async () => {
      const resolver = createTelegramLocaleResolver();
      const { sources } = makeSources(["8 great day"], ["fine"]);

      expect(await resolver.resolve(turn({ text: "7", sources }))).toBe("en");
      expect(await resolver.resolve(turn({ text: "5 грустно", sources }))).toBe("ru");
      expect(await resolver.resolve(turn({ text: "7", sources }))).toBe("ru");
    });

    it("should keep each user's language separate", async () => {
      const resolver = createTelegramLocaleResolver();
      const russian = makeSources(["5 грустно"]);
      const english = makeSources(["5 sad"]);

      expect(
        await resolver.resolve(turn({ telegramUserIdHash: "ru-user", sources: russian.sources })),
      ).toBe("ru");
      expect(
        await resolver.resolve(turn({ telegramUserIdHash: "en-user", sources: english.sources })),
      ).toBe("en");
    });

    it("should look again once the remembered locale has expired", async () => {
      const { clock, advance } = makeClock();
      const resolver = createTelegramLocaleResolver({ ttlMs: 1000, clock });
      const { sources, calls } = makeSources(["5 грустно"]);

      await resolver.resolve(turn({ text: "7", sources }));
      advance(1001);
      await resolver.resolve(turn({ text: "7", sources }));

      expect(calls.chat).toBe(2);
    });

    it("should keep a locale alive while the conversation stays active", async () => {
      const { clock, advance } = makeClock();
      const resolver = createTelegramLocaleResolver({ ttlMs: 1000, clock });
      const { sources, calls } = makeSources(["5 грустно"]);

      await resolver.resolve(turn({ text: "7", sources }));

      advance(600);
      await resolver.resolve(turn({ text: "7", sources }));
      advance(600); // 1200ms since the lookup, but only 600ms since it was last used
      await resolver.resolve(turn({ text: "7", sources }));

      expect(calls.chat).toBe(1);
    });

    it("should never hold more than the tracked-user cap", async () => {
      const resolver = createTelegramLocaleResolver({ maxTrackedUsers: 2 });
      const first = makeSources(["5 грустно"]);

      await resolver.resolve(turn({ telegramUserIdHash: "user-1", sources: first.sources }));
      await resolver.resolve(turn({ telegramUserIdHash: "user-2", sources: makeSources().sources }));
      await resolver.resolve(turn({ telegramUserIdHash: "user-3", sources: makeSources().sources }));

      // user-1 was pushed out, so their locale has to be worked out again.
      await resolver.resolve(turn({ telegramUserIdHash: "user-1", sources: first.sources }));
      expect(first.calls.chat).toBe(2);
    });
  });

  describe("forget — erasing a user (/forgetMe)", () => {
    it("should work the locale out from scratch after the user is forgotten", async () => {
      const resolver = createTelegramLocaleResolver();
      const { sources, calls } = makeSources(["5 грустно"]);

      await resolver.resolve(turn({ text: "7", sources }));
      resolver.forget("user-1");
      await resolver.resolve(turn({ text: "7", sources }));

      expect(calls.chat).toBe(2);
    });

    it("should leave other users' locales alone", async () => {
      const resolver = createTelegramLocaleResolver();
      const other = makeSources(["5 грустно"]);

      await resolver.resolve(turn({ telegramUserIdHash: "user-2", sources: other.sources }));
      resolver.forget("user-1");
      await resolver.resolve(turn({ telegramUserIdHash: "user-2", sources: other.sources }));

      expect(other.calls.chat).toBe(1);
    });
  });
});
