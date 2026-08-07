import { Resvg } from "@resvg/resvg-js";
import * as echarts from "echarts";
import { existsSync } from "fs";
import path from "path";
import type { TLocale } from "../../../common/i18n/locale";
import type { TSelectMoodEntry } from "../../Mood/model";

/**
 * Renders a user's recent mood scores as a PNG line chart for the /stat command.
 *
 * ECharts draws the plot (SSR → SVG); resvg turns it into PNG. Axis labels (dates
 * along the bottom, the 0–10 scale on the left) are drawn into the image, so a
 * font is required — we ship one with the app and hand it to resvg, which means
 * text renders identically on any headless host with no system fonts installed.
 *
 * Brand palette matches the landing chart: gold line, green-ringed dots on a cream
 * surface, faint grid, soft gold area fill.
 */

const SURFACE = "#fffdf7";
const GOLD = "#e5a63f";
const GREEN = "#3e8e6e";
const GRID = "#efe6d2";
const LABEL_INK = "#9c8f76";
const FONT_FAMILY = "PT Sans";

const WIDTH = 900;
const HEIGHT = 420;
/** Most recent check-ins to plot; older ones are dropped so the line stays readable. */
const MAX_POINTS = 100;

/** How many points we need before a line chart is meaningful. */
export const MOOD_CHART_MIN_POINTS = 2;

/** Bundled font, resolved from the package root (cwd is apps/server at runtime). */
const FONT_PATH = path.resolve(process.cwd(), "assets/fonts/PTSans-Regular.ttf");

/**
 * @param entries mood entries newest-first (as `listMoodEntries` returns them).
 * @returns the number of points that will actually be plotted (capped at MAX_POINTS).
 */
export function moodChartPointCount(entries: TSelectMoodEntry[]): number {
  return Math.min(entries.length, MAX_POINTS);
}

// Hardcoded (not Intl) so the labels are identical on any host — minimal Node
// builds ship a cut-down ICU that would render Russian months as English.
const MONTHS_EN = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTHS_RU = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

/** Human date for a time-axis tick: "may 15" (en) / "15 мая" (ru). Uses UTC to match the stored timestamps. */
function formatTimeLabel(ms: number, locale: TLocale): string {
  const date = new Date(ms);
  const monthIndex = date.getUTCMonth();
  const day = date.getUTCDate();
  return locale === "ru" ? `${day} ${MONTHS_RU[monthIndex]}` : `${MONTHS_EN[monthIndex]} ${day}`;
}

export function renderMoodHistoryChart(entries: TSelectMoodEntry[], locale: TLocale): Buffer {
  // Entries arrive newest-first; plot the most recent window on a *time* axis so
  // each point sits at its real timestamp — uneven gaps (an hour vs. a month) are
  // shown honestly as narrow vs. wide spacing, not squashed to equal steps.
  const points = [...entries]
    .slice(0, MAX_POINTS)
    // A point can't be placed on a time axis without a time, so drop it.
    .filter((entry) => entry.createdAt !== null)
    .map((entry) => [entry.createdAt!.getTime(), entry.value] as [number, number])
    .sort((a, b) => a[0] - b[0]);

  const chart = echarts.init(null, null, {
    renderer: "svg",
    ssr: true,
    width: WIDTH,
    height: HEIGHT,
  });

  chart.setOption({
    backgroundColor: SURFACE,
    animation: false,
    useUTC: true, // stored timestamps are UTC; keep ticks/labels in UTC too
    textStyle: { fontFamily: FONT_FAMILY },
    grid: { left: 44, right: 28, top: 28, bottom: 40 },
    xAxis: {
      type: "time",
      axisTick: { show: false },
      axisLine: { lineStyle: { color: GRID } },
      splitLine: { show: false },
      axisLabel: {
        color: LABEL_INK,
        fontSize: 20,
        hideOverlap: true,
        margin: 14,
        formatter: (value: number) => formatTimeLabel(value, locale),
      },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 10,
      interval: 2, // labels + guide lines at 0 / 2 / 4 / 6 / 8 / 10
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { color: LABEL_INK, fontSize: 20, margin: 12 },
      splitLine: { lineStyle: { color: GRID, width: 1 } },
    },
    series: [
      {
        type: "line",
        data: points,
        smooth: 0.35,
        symbol: "circle",
        symbolSize: 9,
        // Dots read nicely on a short series (the landing look); on a dense one
        // they clutter, so let the line speak for itself.
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
  });

  const svg = chart.renderToSVGString();
  chart.dispose();

  // Ship our font; fall back to system fonts only if the asset is somehow missing.
  const hasFont = existsSync(FONT_PATH);
  const png = new Resvg(svg, {
    background: SURFACE,
    fitTo: { mode: "zoom", value: 2 }, // 2× for a crisp image; Telegram scales it down
    font: hasFont
      ? { fontFiles: [FONT_PATH], loadSystemFonts: false, defaultFontFamily: FONT_FAMILY }
      : { loadSystemFonts: true },
  })
    .render()
    .asPng();

  return Buffer.from(png);
}
