import { DEFAULT_LOCALE, type TLocale } from "../../common/i18n/locale";
import { resolveLocale } from "../../common/i18n/resolveLocale";
import { getRecentTelegramChatMessages } from "./telegramUserChatHistory";

type TProps = {
  languageCode: string | undefined;
  text: string | undefined;
  /** The raw numeric telegram id — needed to decrypt the stored history. */
  telegramId: number;
  telegramUserIdHash: string;
};

/**
 * The user's own earlier messages, as plaintext.
 *
 * Best effort by design: the history sits behind the DB and per-user decryption,
 * and guessing a language is never worth failing a turn over — if it can't be
 * read we simply answer with no memory to go on.
 */
async function getRememberedUserTexts(props: TProps): Promise<string[]> {
  try {
    const entries = await getRecentTelegramChatMessages({
      telegramUserIdHash: props.telegramUserIdHash,
      telegramId: props.telegramId,
    });

    // Only the user's own lines: the bot's replies just echo a locale we picked
    // earlier, so counting them would make the guess argue with itself.
    return entries.filter((entry) => entry.role === "user").map((entry) => entry.text);
  } catch (error) {
    console.log("Could not read chat history for locale detection:", error);
    return [];
  }
}

/**
 * Locale for one bot turn: the per-message rules first and, when this message
 * says nothing about the language on its own, the user's remembered messages.
 * That's what keeps a bare "7" right after "5 как-то грустно" in Russian.
 *
 * History is only read when it can still change the answer, so the already
 * settled cases cost nothing extra.
 */
export async function resolveTelegramLocale(props: TProps): Promise<TLocale> {
  const fromThisMessage = resolveLocale({
    languageCode: props.languageCode,
    text: props.text,
  });

  if (fromThisMessage !== DEFAULT_LOCALE) {
    return fromThisMessage;
  }

  return resolveLocale({ previousTexts: await getRememberedUserTexts(props) });
}
