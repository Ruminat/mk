import OpenAI from "openai";
import { getEnvironmentVariables } from "../../common/environment";

const getDeepSeekClient = () => {
  const apiKey = getEnvironmentVariables().deepseek.apiKey;

  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is not set");
  }
  
  return new OpenAI({ baseURL: "https://api.deepseek.com", apiKey });
};

export const aiService = {
  getDeepSeekReply: async ({ prompt }: { prompt: string }): Promise<string | null> => {
    if (process.env.RETURN_PROMPT_INSTEAD_OF_ACTUALLY_REQUESTING === "true") {
      return prompt;
    }

    const client = getDeepSeekClient();
    const completion = await client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "deepseek-chat",
    });

    return completion?.choices?.[0]?.message?.content ?? null;
  },
};
