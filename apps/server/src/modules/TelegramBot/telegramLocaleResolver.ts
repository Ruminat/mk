import { LRUCache } from "lru-cache";
import { DEFAULT_LOCALE, type TLocale } from "@mooduck/core";
import { resolveLocale } from "../../common/i18n/resolveLocale";

/** How long a locale worked out from a user's history stays good for. */
const LOCALE_TTL_MS = 60 * 60 * 1000;
/** Hard cap on how many users' locales live in memory; least-recently-used are evicted. */
const MAX_TRACKED_USERS = 5000;

/**
 * Everything MooDuck remembers a user saying, as plaintext. Loaded lazily and in
 * order, so a source that costs a query is never touched if an earlier one has
 * already settled the question.
 */
export type TLocaleMemorySources = {
  /** The user's own lines from the chat history. */
  loadChatTexts: () => Promise<readonly (string | null | undefined)[]>;
  /** The comments they left on their mood entries. */
  loadMoodComments: () => Promise<readonly (string | null | undefined)[]>;
};

export type TResolveLocaleArgs = {
  telegramUserIdHash: string;
  languageCode: string | undefined;
  text: string | undefined;
  sources: TLocaleMemorySources;
};

/** A clock with a `now()` method, matching `lru-cache`'s `perf` option (injectable for tests). */
type TClock = { now: () => number };

export type TTelegramLocaleResolverOptions = {
  ttlMs?: number;
  maxTrackedUsers?: number;
  clock?: TClock;
};

export type TTelegramLocaleResolver = {
  resolve: (args: TResolveLocaleArgs) => Promise<TLocale>;
  /** Drop what we worked out about a user — they asked to be forgotten. */
  forget: (telegramUserIdHash: string) => void;
};

/**
 * Picks the language for a bot turn, and remembers it.
 *
 * The rules themselves live in {@link resolveLocale}; what this adds is memory,
 * in two layers. A message that is Russian on its own decides the turn outright.
 * Otherwise — a bare "7", a `/stat` — we fall back to what the user said before:
 * their chat history first, then the comments on their mood entries, which reach
 * much further back than the ten messages the history keeps.
 *
 * That fallback costs reads, so the answer is cached per user: it's a property of
 * the person, not of the message, and re-deriving it on every "7" would query the
 * database for something that hasn't changed. A Russian message still overrides
 * the cache immediately, so switching language is never held up by it.
 */
export function createTelegramLocaleResolver(
  options: TTelegramLocaleResolverOptions = {},
): TTelegramLocaleResolver {
  const cache = new LRUCache<string, TLocale>({
    max: options.maxTrackedUsers ?? MAX_TRACKED_USERS,
    ttl: options.ttlMs ?? LOCALE_TTL_MS,
    // Read the clock on every check instead of debouncing it (which relies on a
    // real timer). Cost is negligible at our message rate and keeps expiry exact.
    ttlResolution: 0,
    // An ongoing conversation shouldn't have to re-derive the same locale hourly.
    updateAgeOnGet: true,
    ...(options.clock ? { perf: options.clock } : {}),
  });

  function remember(telegramUserIdHash: string, locale: TLocale): TLocale {
    cache.set(telegramUserIdHash, locale);
    return locale;
  }

  async function resolve(args: TResolveLocaleArgs): Promise<TLocale> {
    const fromThisMessage = resolveLocale({
      languageCode: args.languageCode,
      text: args.text,
    });

    // This message speaks for itself — and for the ones after it.
    if (fromThisMessage !== DEFAULT_LOCALE) {
      return remember(args.telegramUserIdHash, fromThisMessage);
    }

    const remembered = cache.get(args.telegramUserIdHash);
    if (remembered) {
      return remembered;
    }

    // Chat history first: the reply is about to load it anyway, so it's usually
    // already in memory, while mood entries are always a real query.
    const fromChat = resolveLocale({ previousTexts: await args.sources.loadChatTexts() });
    if (fromChat !== DEFAULT_LOCALE) {
      return remember(args.telegramUserIdHash, fromChat);
    }

    const fromMoods = resolveLocale({ previousTexts: await args.sources.loadMoodComments() });
    return remember(args.telegramUserIdHash, fromMoods);
  }

  return {
    resolve,
    forget: (telegramUserIdHash) => {
      cache.delete(telegramUserIdHash);
    },
  };
}
