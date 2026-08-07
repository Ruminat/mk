import { getTableColumns } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { MoodTable } from "../../../modules/Mood/model";
import { TelegramChatMessageTable } from "../../../modules/TelegramBot/model";

/**
 * Tested through the real column rather than a helper, so this covers the wiring
 * too: if a table ever stops using the shared factory, these fail.
 */
const readCreatedAt = (table: typeof MoodTable | typeof TelegramChatMessageTable, stored: string) =>
  getTableColumns(table).createdAt.mapFromDriverValue(stored) as Date | null;

describe("commonFields.ts / createdAt", () => {
  it("should read SQLite's CURRENT_TIMESTAMP as UTC", () => {
    // The regression this guards: read as local time, every entry on a UTC+3
    // host came out three hours older than it was.
    expect(readCreatedAt(MoodTable, "2026-08-07 12:00:00")?.toISOString()).toBe(
      "2026-08-07T12:00:00.000Z",
    );
  });

  it("should not depend on the host timezone", () => {
    const parsed = readCreatedAt(MoodTable, "2026-08-07 12:00:00");

    expect(parsed?.getTime()).toBe(Date.UTC(2026, 7, 7, 12, 0, 0));
  });

  it("should hand the app a Date, not a string", () => {
    expect(readCreatedAt(MoodTable, "2026-08-07 12:00:00")).toBeInstanceOf(Date);
  });

  it("should keep entries in the order they were written", () => {
    const earlier = readCreatedAt(MoodTable, "2026-08-07 12:00:00")!;
    const later = readCreatedAt(MoodTable, "2026-08-07 12:00:01")!;

    expect(later.getTime()).toBeGreaterThan(earlier.getTime());
  });

  it("should report an unreadable value as absent, never as an Invalid Date", () => {
    // An Invalid Date would sail through every type check and turn the first bit
    // of arithmetic into NaN; null makes callers deal with it.
    expect(readCreatedAt(MoodTable, "not a timestamp")).toBeNull();
    expect(readCreatedAt(MoodTable, "")).toBeNull();
  });

  it("should behave the same on every table that uses the shared column", () => {
    expect(readCreatedAt(TelegramChatMessageTable, "2026-08-07 12:00:00")?.toISOString()).toBe(
      "2026-08-07T12:00:00.000Z",
    );
  });

  it("should still be a text column, so the stored format is unchanged", () => {
    expect(getTableColumns(MoodTable).createdAt.getSQLType()).toBe("text");
  });
});
