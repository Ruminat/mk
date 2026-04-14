import { randomFrom } from "@mooduck/core";

export const PROMPT_MODE = {
  friendly: "Будь добрым и поддерживающим, как лучший друг. Юмор не помешает, но только если чуть-чуть и если он в тему.",
  toxic:
    "Будь оригинальным, возможно, даже немного токсичным и чернушным (нужна остринка), но при этом забавным (чтобы поднять настроение).",
  absurd: "Ответь в немного абсурдной форме, но кратко и с юмором.",
  philosophical: "Ответь по-философски. Не городи сложных метафор, придерживайся краткости и добавь юмора, если уместно.",
} as const;

const promptModes = Object.values(PROMPT_MODE);

export function pickRandomPromptMode(): string {
  return randomFrom(promptModes);
}
