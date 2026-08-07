import type { TLocale } from "../../common/i18n/locale";
import { moodService } from "../Mood/service";
import { createTelegramLocaleResolver } from "./telegramLocaleResolver";
import { getRecentTelegramChatMessages } from "./telegramUserChatHistory";

/** How many recent mood entries we look at when working out a user's language. */
const MOOD_ENTRIES_FOR_LOCALE = 10;

type TProps = {
  languageCode: string | undefined;
  text: string | undefined;
  /** The raw numeric telegram id — needed to decrypt what the user wrote. */
  telegramId: number;
  telegramUserIdHash: string;
};

/** The app-wide locale memory. */
const resolver = createTelegramLocaleResolver();

/**
 * Reading either source can fail — both sit behind the database and per-user
 * decryption — and guessing a language is never worth failing a turn over. On an
 * error we just answer with that much less to go on.
 */
async function loadOrIgnore<TItem>(
  what: string,
  load: () => Promise<readonly TItem[]>,
): Promise<readonly TItem[]> {
  try {
    return await load();
  } catch (error) {
    console.log(`Could not read ${what} for locale detection:`, error);
    return [];
  }
}

async function loadChatTexts(props: TProps): Promise<readonly string[]> {
  const entries = await getRecentTelegramChatMessages({
    telegramUserIdHash: props.telegramUserIdHash,
    telegramId: props.telegramId,
  });

  // Only the user's own lines: the bot's replies just echo a locale we picked
  // earlier, so counting them would make the guess argue with itself.
  return entries.filter((entry) => entry.role === "user").map((entry) => entry.text);
}

async function loadMoodComments(props: TProps): Promise<readonly (string | null)[]> {
  const entries = await moodService.listMoodEntries({
    userId: props.telegramUserIdHash,
    telegramId: props.telegramId,
    limit: MOOD_ENTRIES_FOR_LOCALE,
  });

  return entries.map((entry) => entry.comment);
}

/**
 * Locale for one bot turn — see {@link createTelegramLocaleResolver} for how the
 * message, the chat history and the mood entries are weighed against each other.
 */
export function resolveTelegramLocale(props: TProps): Promise<TLocale> {
  return resolver.resolve({
    telegramUserIdHash: props.telegramUserIdHash,
    languageCode: props.languageCode,
    text: props.text,
    sources: {
      loadChatTexts: () => loadOrIgnore("chat history", () => loadChatTexts(props)),
      loadMoodComments: () => loadOrIgnore("mood entries", () => loadMoodComments(props)),
    },
  });
}

/** Forget which language a user speaks, along with the rest of their data. */
export function forgetTelegramLocale(telegramUserIdHash: string): void {
  resolver.forget(telegramUserIdHash);
}
