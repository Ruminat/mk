import OpenAI from "openai";
import { getEnvironmentVariables } from "../../common/config/environment";
import { PerUserRateLimiter } from "../../common/rateLimiter/rateLimiter";
import { ServiceError } from "../../services/errors/ServiceError";

/** Thrown when a user has run out of AI quota for now. */
export class AiRateLimitError extends ServiceError {
  constructor() {
    super("AI rate limit exceeded");
    this.name = "AiRateLimitError";
  }
}

/**
 * Per-user throttle for the paid DeepSeek calls. Anyone can message the bot, so
 * without this a single sender could burn the AI budget (and hammer the server).
 * Allows up to 15 AI requests per minute per user.
 */
const aiRateLimiter = new PerUserRateLimiter({
  points: 15,
  durationSec: 60,
});

const getDeepSeekClient = () => {
  const apiKey = getEnvironmentVariables().deepseek.apiKey;

  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is not set");
  }

  return new OpenAI({ baseURL: "https://api.deepseek.com", apiKey });
};

export const aiService = {
  getDeepSeekReply: async ({
    prompt,
    userIdHash,
  }: {
    prompt: string;
    userIdHash: string;
  }): Promise<string | null> => {
    if (process.env.RETURN_PROMPT_INSTEAD_OF_ACTUALLY_REQUESTING === "true") {
      return prompt;
    }

    if (!(await aiRateLimiter.tryConsume(userIdHash))) {
      throw new AiRateLimitError();
    }

    const client = getDeepSeekClient();
    const completion = await client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "deepseek-v4-flash",
    });

    return completion?.choices?.[0]?.message?.content ?? null;
  },

  /**
   * Drop the throttling state held under a user's hash. Nothing personal lives
   * in it, but "delete everything about me" shouldn't leave a counter behind.
   */
  forgetUser: async (userIdHash: string): Promise<void> => {
    await aiRateLimiter.reset(userIdHash);
  },
};
