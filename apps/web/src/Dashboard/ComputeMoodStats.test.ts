import type { TMoodEntry } from "@mooduck/contracts";
import { describe, expect, it } from "vitest";
import { computeMoodStats } from "./ComputeMoodStats";

function entry(value: number): TMoodEntry {
  return { id: value, value, comment: null, createdAt: null };
}

describe("computeMoodStats", () => {
  it("should return a null average and zero count for an empty list", () => {
    expect(computeMoodStats([])).toEqual({ average: null, count: 0 });
  });

  it("should average the values and count them", () => {
    expect(computeMoodStats([entry(6), entry(7), entry(8)])).toEqual({ average: 7, count: 3 });
  });

  it("should round the average to one decimal", () => {
    // (6 + 7) / 2 = 6.5; (5 + 6 + 8) / 3 = 6.333… → 6.3
    expect(computeMoodStats([entry(6), entry(7)]).average).toBe(6.5);
    expect(computeMoodStats([entry(5), entry(6), entry(8)]).average).toBe(6.3);
  });
});
