import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The deletion saga reaches the database (and, through it, the validated
 * environment), which a unit test has neither of. Stubbing it here keeps the test
 * about the one thing this command decides — what it claims and what it does with
 * it — and lets us assert that nothing is deleted when nothing was confirmed.
 */
const forgetUser = vi.fn(async () => ({ moodEntries: 0, chatMessages: 0 }));
// `vi.mock` is hoisted above the imports below, so the real saga never loads.
vi.mock("../sagas/forgetUser", () => ({ forgetUser: () => forgetUser() }));

import { telegramForgetMeCommand } from "../commands/forgetMe";
import type { TTelegramCommandProps } from "../definitions";
import { forgetMeConfirmations } from "../forgetMeConfirmations";

/** Only the fields the command reads, parsed exactly as `onMessage` parses them. */
function props(text: string, telegramUserIdHash = "user-1"): TTelegramCommandProps {
  return {
    messageParsed: text.toLowerCase().replace(/ё/g, "е").trim(),
    locale: "en",
    telegramUserIdHash,
    telegramId: 1,
  } as TTelegramCommandProps;
}

const replyText = (reply: unknown) => (reply as { text: string }).text;

describe("commands/forgetMe.ts / telegramForgetMeCommand", () => {
  beforeEach(() => {
    forgetUser.mockClear();
    forgetMeConfirmations.clear("user-1");
  });

  describe("what the command claims", () => {
    it("should claim the command however the user cases it", () => {
      // Telegram highlights a command only up to the first dash, hence /forgetMe.
      expect(telegramForgetMeCommand.test(props("/forgetMe"))).toBe(true);
      expect(telegramForgetMeCommand.test(props("/forgetme"))).toBe(true);
      expect(telegramForgetMeCommand.test(props("/FORGETME"))).toBe(true);
    });

    it("should no longer answer to the old hyphenated name", () => {
      expect(telegramForgetMeCommand.test(props("/forget-me"))).toBe(false);
    });

    it("should claim the confirmation phrase even with nothing armed", () => {
      // The whole point: this must never fall through to the chat history or the AI.
      expect(telegramForgetMeCommand.test(props("forget me"))).toBe(true);
      expect(telegramForgetMeCommand.test(props("Forget Me"))).toBe(true);
    });

    it("should leave ordinary messages alone", () => {
      expect(telegramForgetMeCommand.test(props("7"))).toBe(false);
      expect(telegramForgetMeCommand.test(props("please forget me"))).toBe(false);
      expect(telegramForgetMeCommand.test(props("/help"))).toBe(false);
    });
  });

  describe("what it does", () => {
    it("should ask for confirmation and arm the request", async () => {
      const reply = await telegramForgetMeCommand.getReply(props("/forgetMe"));

      expect(replyText(reply)).toContain("forget me");
      expect(forgetMeConfirmations.isPending("user-1")).toBe(true);
      expect(forgetUser).not.toHaveBeenCalled();
    });

    it("should delete everything once the armed request is confirmed", async () => {
      await telegramForgetMeCommand.getReply(props("/forgetMe"));
      await telegramForgetMeCommand.getReply(props("forget me"));

      expect(forgetUser).toHaveBeenCalledTimes(1);
      // The confirmation is spent, so a repeat can't delete again by itself.
      expect(forgetMeConfirmations.isPending("user-1")).toBe(false);
    });

    it("should delete nothing when the phrase arrives out of the blue", async () => {
      const reply = await telegramForgetMeCommand.getReply(props("forget me"));

      expect(forgetUser).not.toHaveBeenCalled();
      expect(replyText(reply)).toContain("/forgetMe");
    });

    it("should not let one user's confirmation erase another", async () => {
      await telegramForgetMeCommand.getReply(props("/forgetMe", "user-1"));
      await telegramForgetMeCommand.getReply(props("forget me", "user-2"));

      expect(forgetUser).not.toHaveBeenCalled();
      expect(forgetMeConfirmations.isPending("user-1")).toBe(true);
    });
  });
});
