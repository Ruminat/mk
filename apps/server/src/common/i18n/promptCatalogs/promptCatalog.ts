/**
 * Localized AI prompt catalog. Full parallel text per locale (the model is
 * instructed and expected to answer in the resolved language). The dynamic,
 * language-neutral parts (scores, word limits, rendered entries) are computed by
 * the callers and passed in.
 */
export type TPromptCatalog = {
  /** MooDuck's personality / tone block. */
  personality: string;
  /** Short role line ("You are a companion in a mood chat-bot."). */
  role: string;
  /** Full "avoid these clichés" sentence, including the banned-phrase list. */
  banPhrases: string;
  /** "Limit: up to N words." */
  wordsLimit: (limit: number) => string;
  /**
   * Which language to answer in. States the locale we resolved for this user as
   * the default, and tells the model to follow the language they actually write
   * in — our guess is only a guess, and someone may switch for a message or two.
   */
  replyLanguage: string;

  /** The "the user wrote: …" clause for a mood entry, or "" when no comment. */
  moodCommentSection: (comment: string) => string;
  /** Prompt for reacting to a single mood entry. */
  moodPrompt: (args: {
    score: string;
    commentSection: string;
    wordsLimit: number;
    recentComments: string;
  }) => string;

  /** Speaker label for a chat-history line. */
  chatSpeaker: (speaker: "user" | "assistant") => string;
  /** Header shown above the rendered chat history. */
  chatHistoryHeader: (count: number) => string;
  /** Prompt for a free-form chat reply. */
  chatPrompt: (args: { historyBlock: string; wordsLimit: number }) => string;

  /** Prompt for /last (comment on the recent mood streak). */
  lastPrompt: (args: { block: string; wordsLimit: number }) => string;
  /** Prompt for /stat (comment on the statistics). */
  statPrompt: (args: { stats: string; wordsLimit: number }) => string;

  /** Intro + rendered recent comments, fed as extra context to the mood prompt. */
  recentComments: (renderedEntries: string) => string;
};
