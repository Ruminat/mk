import { describe, expect, it } from "vitest";
import { formatRelativeTime } from "./FormatRelativeTime";

const NOW = 1_700_000_000_000;
const at = (msAgo: number): string => new Date(NOW - msAgo).toISOString();

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("formatRelativeTime — English", () => {
  it("should read the whole table", () => {
    expect(formatRelativeTime(at(30 * 1000), "en", NOW)).toBe("just now");
    expect(formatRelativeTime(at(3 * MINUTE), "en", NOW)).toBe("3 min ago");
    expect(formatRelativeTime(at(2 * HOUR), "en", NOW)).toBe("2h ago");
    expect(formatRelativeTime(at(25 * HOUR), "en", NOW)).toBe("yesterday");
    expect(formatRelativeTime(at(3 * DAY), "en", NOW)).toBe("3d ago");
  });
});

describe("formatRelativeTime — Russian", () => {
  it("should read the whole table", () => {
    expect(formatRelativeTime(at(30 * 1000), "ru", NOW)).toBe("только что");
    expect(formatRelativeTime(at(3 * MINUTE), "ru", NOW)).toBe("3 мин. назад");
    expect(formatRelativeTime(at(2 * HOUR), "ru", NOW)).toBe("2 ч. назад");
    expect(formatRelativeTime(at(25 * HOUR), "ru", NOW)).toBe("вчера");
    expect(formatRelativeTime(at(3 * DAY), "ru", NOW)).toBe("3 дн. назад");
  });
});

describe("formatRelativeTime — edge cases", () => {
  it("should render a sane default for a null timestamp", () => {
    expect(formatRelativeTime(null, "en", NOW)).toBe("just now");
    expect(formatRelativeTime(null, "ru", NOW)).toBe("только что");
  });
});
