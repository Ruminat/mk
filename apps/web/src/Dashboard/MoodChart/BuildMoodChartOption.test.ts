import type { TMoodEntry } from "@mooduck/contracts";
import { describe, expect, it } from "vitest";
import { buildMoodChartOption, selectChartPoints } from "./BuildMoodChartOption";

function entry(id: number, value: number, iso: string | null): TMoodEntry {
  return { id, value, comment: null, createdAt: iso };
}

const T1 = "2026-01-10T09:00:00.000Z";
const T2 = "2026-01-11T09:00:00.000Z";
const T3 = "2026-01-12T09:00:00.000Z";

describe("selectChartPoints", () => {
  it("should map to [time, value] pairs, oldest-first", () => {
    // Entries arrive newest-first (T3, T2, T1); the chart wants oldest-first.
    const points = selectChartPoints([entry(3, 8, T3), entry(2, 5, T2), entry(1, 7, T1)]);
    expect(points).toEqual([
      [new Date(T1).getTime(), 7],
      [new Date(T2).getTime(), 5],
      [new Date(T3).getTime(), 8],
    ]);
  });

  it("should drop entries with a null timestamp", () => {
    const points = selectChartPoints([entry(2, 8, T2), entry(1, 6, null)]);
    expect(points).toEqual([[new Date(T2).getTime(), 8]]);
  });
});

describe("buildMoodChartOption", () => {
  it("should bound the y-axis 0..10 with an interval of 2", () => {
    const option = buildMoodChartOption([entry(1, 7, T1)], "en");
    const yAxis = option.yAxis as { min: number; max: number; interval: number };
    expect(yAxis.min).toBe(0);
    expect(yAxis.max).toBe(10);
    expect(yAxis.interval).toBe(2);
  });

  it("should put the selected points on the series", () => {
    const option = buildMoodChartOption([entry(2, 5, T2), entry(1, 7, T1)], "en");
    const series = option.series as Array<{ data: [number, number][] }>;
    expect(series[0]?.data).toEqual([
      [new Date(T1).getTime(), 7],
      [new Date(T2).getTime(), 5],
    ]);
  });
});
