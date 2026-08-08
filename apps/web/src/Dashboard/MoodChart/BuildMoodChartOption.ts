import type { EChartsOption } from "echarts";
import type { TLocale } from "@mooduck/core";
import type { TMoodEntry } from "@mooduck/contracts";
import { CHART_POINTS } from "../Definitions";

// Palette copied verbatim from the bot's charts/moodHistoryChart.ts so the web
// chart and the bot chart are pixel-consistent.
const GOLD = "#e5a63f";
const GREEN = "#3e8e6e";
const GRID = "#efe6d2";
const LABEL_INK = "#9c8f76";
const FONT_FAMILY = '"Nunito Sans", system-ui, sans-serif';

/**
 * The most recent `CHART_POINTS` entries as `[timeMs, value]`, oldest-first for
 * the time axis. Entries with a null/unreadable timestamp are dropped (they
 * can't be placed on a time axis) — exactly as the bot's chart does.
 */
export function selectChartPoints(entries: readonly TMoodEntry[]): [number, number][] {
  return entries
    .slice(0, CHART_POINTS)
    .filter((entry): entry is TMoodEntry & { createdAt: string } => entry.createdAt !== null)
    .map((entry) => [new Date(entry.createdAt).getTime(), entry.value] as [number, number])
    .filter(([time]) => !Number.isNaN(time))
    .sort((a, b) => a[0] - b[0]);
}

export function buildMoodChartOption(entries: readonly TMoodEntry[], locale: TLocale): EChartsOption {
  const points = selectChartPoints(entries);
  // A browser has full ICU, so use Intl for the axis labels (local, localized) —
  // this deliberately diverges from the bot, which hardcodes month tables because
  // minimal Node builds ship a cut-down ICU.
  const dateFormatter = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" });

  return {
    backgroundColor: "transparent",
    animation: false,
    useUTC: false, // a browser user wants dates in their own timezone
    textStyle: { fontFamily: FONT_FAMILY },
    grid: { left: 36, right: 18, top: 18, bottom: 28 },
    xAxis: {
      type: "time",
      axisTick: { show: false },
      axisLine: { lineStyle: { color: GRID } },
      splitLine: { show: false },
      axisLabel: {
        color: LABEL_INK,
        fontSize: 12,
        hideOverlap: true,
        margin: 12,
        formatter: (value: number) => dateFormatter.format(new Date(value)),
      },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 10,
      interval: 2, // guide lines at 0 / 2 / 4 / 6 / 8 / 10
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { color: LABEL_INK, fontSize: 12, margin: 10 },
      splitLine: { lineStyle: { color: GRID, width: 1 } },
    },
    series: [
      {
        type: "line",
        data: points,
        smooth: 0.35,
        symbol: "circle",
        symbolSize: 8,
        showSymbol: points.length <= 40,
        lineStyle: { color: GOLD, width: 3, cap: "round", join: "round" },
        itemStyle: { color: "#fff", borderColor: GREEN, borderWidth: 2 },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(229, 166, 63, 0.28)" },
              { offset: 1, color: "rgba(229, 166, 63, 0.02)" },
            ],
          },
        },
      },
    ],
  };
}
