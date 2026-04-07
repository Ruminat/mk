import { randomFrom } from "@mooduck/core";

export const PROMPT_MODE = {
  friendly: "Будь добрым и поддерживающим, как лучший друг.",
  toxic:
    "Будь оригинальным, возможно, даже немного токсичным и чернушным (нужна остринка), но при этом забавным (чтобы поднять настроение).",
  absurd: "Ответь чем-то совершенно абсурдным и неожиданным, возможно даже бессмысленным, но желательно забавным.",
  philosophical: "Начни рассуждать о смысле жизни, но кратко и с юмором.",
} as const;

const promptModes = Object.values(PROMPT_MODE);

export function pickRandomPromptMode(): string {
  return randomFrom(promptModes);
}
