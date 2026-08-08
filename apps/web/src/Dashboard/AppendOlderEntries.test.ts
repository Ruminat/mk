import type { TMoodEntry } from "@mooduck/contracts";
import { describe, expect, it } from "vitest";
import { appendOlderEntries } from "./AppendOlderEntries";

function entry(id: number): TMoodEntry {
  return { id, value: 5, comment: null, createdAt: "2026-01-10T09:00:00.000Z" };
}

const ids = (entries: readonly TMoodEntry[]): number[] => entries.map((e) => e.id);

describe("appendOlderEntries", () => {
  it("should put the older page after what's already loaded", () => {
    expect(ids(appendOlderEntries([entry(9), entry(8)], [entry(7), entry(6)]))).toEqual([9, 8, 7, 6]);
  });

  it("should drop the row a mid-scroll check-in shifted into the next page", () => {
    // Writing an entry pushes everything down one, so offset-based paging hands
    // back the row we already have as the head of the next page.
    expect(ids(appendOlderEntries([entry(9), entry(8)], [entry(8), entry(7)]))).toEqual([9, 8, 7]);
  });

  it("should leave the list alone when the page comes back empty", () => {
    const current = [entry(9)];
    expect(appendOlderEntries(current, [])).toEqual(current);
  });
});
