import { describe, expect, it } from "vitest";
import { isRussianText, resolveLocale } from "../resolveLocale";

describe("resolveLocale.ts / isRussianText", () => {
  it("should be true for clearly Russian text", () => {
    expect(isRussianText("отличный день")).toBe(true);
    expect(isRussianText("7 навернул пельменей")).toBe(true);
  });

  it("should be false for English and numbers only", () => {
    expect(isRussianText("great day")).toBe(false);
    expect(isRussianText("8")).toBe(false);
    expect(isRussianText("")).toBe(false);
    expect(isRussianText(undefined)).toBe(false);
  });

  it("should treat Cyrillic-dominant mixed text as Russian", () => {
    expect(isRussianText("ok норм день")).toBe(true);
  });

  it("should not flip to Russian on a single stray Cyrillic char in English text", () => {
    expect(isRussianText("this is a normal english sentence с")).toBe(false);
  });
});

describe("resolveLocale.ts / resolveLocale", () => {
  it("should default to English", () => {
    expect(resolveLocale({ languageCode: "en", text: "great day" })).toBe("en");
    expect(resolveLocale({})).toBe("en");
  });

  it("should be Russian when the telegram language_code is Russian, even for English text", () => {
    expect(resolveLocale({ languageCode: "ru", text: "great day" })).toBe("ru");
    expect(resolveLocale({ languageCode: "ru-RU", text: "hello" })).toBe("ru");
  });

  it("should be Russian when the message is Russian, even if language_code is missing or non-Russian", () => {
    expect(resolveLocale({ text: "отличный день" })).toBe("ru");
    expect(resolveLocale({ languageCode: "en", text: "отличный день" })).toBe("ru");
    expect(resolveLocale({ languageCode: undefined, text: "плохо" })).toBe("ru");
  });

  describe("memory of earlier messages", () => {
    it("should be Russian for a bare score when an earlier message was Russian", () => {
      expect(resolveLocale({ text: "7", previousTexts: ["5 как-то грустно..."] })).toBe("ru");
    });

    it("should stay Russian for a command that carries no language of its own", () => {
      expect(resolveLocale({ text: "/stat", previousTexts: ["8 навернул пельменей"] })).toBe("ru");
    });

    it("should find the Russian message anywhere in the history", () => {
      expect(resolveLocale({ text: "7", previousTexts: ["8", "5 грустно", "6"] })).toBe("ru");
    });

    it("should stay English when nothing in the history is Russian", () => {
      expect(resolveLocale({ text: "7", previousTexts: ["8 great day", "5", undefined] })).toBe("en");
      expect(resolveLocale({ text: "7", previousTexts: [] })).toBe("en");
    });
  });
});
