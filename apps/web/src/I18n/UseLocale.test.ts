import { describe, expect, it } from "vitest";
import { resolveStoredLocale } from "./UseLocale";

describe("resolveStoredLocale", () => {
  it("should prefer a valid stored preference over the browser", () => {
    expect(resolveStoredLocale("ru", ["en-US"])).toBe("ru");
    expect(resolveStoredLocale("en", ["ru-RU"])).toBe("en");
  });

  it("should fall back to the browser when there's no stored preference", () => {
    expect(resolveStoredLocale(null, ["ru-RU", "en"])).toBe("ru");
    expect(resolveStoredLocale(null, ["en-GB"])).toBe("en");
  });

  it("should ignore an invalid stored value and use the browser", () => {
    expect(resolveStoredLocale("de", ["ru"])).toBe("ru");
    expect(resolveStoredLocale("", ["en"])).toBe("en");
  });

  it("should default to English when nothing matches", () => {
    expect(resolveStoredLocale(null, [])).toBe("en");
  });
});
