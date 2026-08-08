import { describe, expect, it } from "vitest";
import { resolveBrowserLocale } from "./resolveBrowserLocale";

describe("resolveBrowserLocale", () => {
  it("should pick Russian when the first tag is Russian", () => {
    expect(resolveBrowserLocale(["ru-RU", "en"])).toBe("ru");
  });

  it("should pick English for an English region tag", () => {
    expect(resolveBrowserLocale(["en-GB"])).toBe("en");
  });

  it("should be case-insensitive on the primary subtag", () => {
    expect(resolveBrowserLocale(["RU"])).toBe("ru");
  });

  it("should default to English for an empty list", () => {
    expect(resolveBrowserLocale([])).toBe("en");
  });

  it("should skip an unsupported tag and fall through to the next one", () => {
    expect(resolveBrowserLocale(["de", "ru"])).toBe("ru");
  });

  it("should default to English when no tag is supported", () => {
    expect(resolveBrowserLocale(["de", "fr"])).toBe("en");
  });
});
