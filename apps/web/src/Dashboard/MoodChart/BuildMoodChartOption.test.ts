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

describe("buildMoodChartOption / compact", () => {
  const entries = [entry(2, 5, T2), entry(1, 7, T1)];

  it("should draw smaller type and a thinner line on a phone", () => {
    const wide = buildMoodChartOption(entries, "en");
    const narrow = buildMoodChartOption(entries, "en", { compact: true });

    const size = (option: ReturnType<typeof buildMoodChartOption>) =>
      (option.yAxis as { axisLabel: { fontSize: number } }).axisLabel.fontSize;
    const lineWidth = (option: ReturnType<typeof buildMoodChartOption>) =>
      (option.series as [{ lineStyle: { width: number } }])[0].lineStyle.width;

    expect(size(narrow)).toBeLessThan(size(wide));
    expect(lineWidth(narrow)).toBeLessThan(lineWidth(wide));
  });

  it("should leave less room for axis margins on a phone", () => {
    const wide = buildMoodChartOption(entries, "en").grid as { left: number };
    const narrow = buildMoodChartOption(entries, "en", { compact: true }).grid as { left: number };

    expect(narrow.left).toBeLessThan(wide.left);
  });

  it("should default to the roomy layout when nothing is passed", () => {
    // Compared field by field rather than with toEqual: the option carries an
    // axis `formatter` closure, which is a fresh function on every call.
    const implicit = buildMoodChartOption(entries, "en");
    const explicit = buildMoodChartOption(entries, "en", { compact: false });

    expect(implicit.grid).toEqual(explicit.grid);
    expect((implicit.yAxis as { axisLabel: unknown }).axisLabel).toEqual(
      (explicit.yAxis as { axisLabel: unknown }).axisLabel,
    );
  });
});
