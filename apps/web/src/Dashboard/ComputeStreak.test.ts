import type { TMoodEntry } from "@mooduck/contracts";
import { describe, expect, it } from "vitest";
import { computeStreak } from "./ComputeStreak";

// Build entries from LOCAL date components so the test is timezone-agnostic: the
// same instant round-trips through toISOString()/new Date() to the same local day.
function localEntry(year: number, month: number, day: number, hour = 12): TMoodEntry {
  const iso = new Date(year, month, day, hour).toISOString();
  return { id: day, value: 7, comment: null, createdAt: iso };
}

const NOW = new Date(2026, 0, 15, 10); // 15 Jan 2026, local

describe("computeStreak", () => {
  it("should be 0 for an empty list", () => {
    expect(computeStreak([], NOW)).toBe(0);
  });

  it("should be 1 for a single check-in today", () => {
    expect(computeStreak([localEntry(2026, 0, 15, 9)], NOW)).toBe(1);
  });

  it("should be 1 when today has none but yesterday does", () => {
    expect(computeStreak([localEntry(2026, 0, 14, 20)], NOW)).toBe(1);
  });

  it("should count consecutive days back from today", () => {
    const entries = [localEntry(2026, 0, 15), localEntry(2026, 0, 14), localEntry(2026, 0, 13)];
    expect(computeStreak(entries, NOW)).toBe(3);
  });

  it("should stop at a two-day gap", () => {
    // today + yesterday, then nothing on the 13th, then the 12th → streak of 2.
    const entries = [localEntry(2026, 0, 15), localEntry(2026, 0, 14), localEntry(2026, 0, 12)];
    expect(computeStreak(entries, NOW)).toBe(2);
  });

  it("should count several entries on the same day as one", () => {
    const entries = [localEntry(2026, 0, 15, 9), localEntry(2026, 0, 15, 20)];
    expect(computeStreak(entries, NOW)).toBe(1);
  });

  it("should treat entries either side of local midnight as two days", () => {
    const entries = [localEntry(2026, 0, 15, 0), localEntry(2026, 0, 14, 23)];
    expect(computeStreak(entries, NOW)).toBe(2);
  });

  it("should be 0 when the most recent check-in is older than yesterday", () => {
    expect(computeStreak([localEntry(2026, 0, 10)], NOW)).toBe(0);
  });

  it("should skip entries with a null timestamp", () => {
    const entries: TMoodEntry[] = [
      { id: 1, value: 5, comment: null, createdAt: null },
      localEntry(2026, 0, 15),
    ];
    expect(computeStreak(entries, NOW)).toBe(1);
  });
});
