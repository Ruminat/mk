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

/**
 * Short numeric date for the x-axis: "20.05" (ru) / "05/20" (en). Zero-padded so a
 * single-digit month can't be misread as a decimal next to the numeric y-axis, and
 * no month names → no font-coverage worries.
 */
function formatDateLabel(createdAt: string | null, locale: TLocale): string {
  const match = createdAt?.match(/^\d{4}-(\d{2})-(\d{2})/);
  if (!match) {
    return "";
  }
  const [, month, day] = match;
  return locale === "ru" ? `${day}.${month}` : `${month}/${day}`;
}

export function renderMoodHistoryChart(entries: TSelectMoodEntry[], locale: TLocale): Buffer {
  // Entries arrive newest-first; plot the most recent window oldest → newest.
  const window = [...entries].slice(0, MAX_POINTS).reverse();
  const values = window.map((entry) => entry.value);
  const dates = window.map((entry) => formatDateLabel(entry.createdAt, locale));

  const chart = echarts.init(null, null, {
    renderer: "svg",
    ssr: true,
    width: WIDTH,
    height: HEIGHT,
  });

  chart.setOption({
    backgroundColor: SURFACE,
    animation: false,
    textStyle: { fontFamily: FONT_FAMILY },
    grid: { left: 44, right: 28, top: 28, bottom: 40 },
    xAxis: {
      type: "category",
      data: dates,
      boundaryGap: false,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: GRID } },
      splitLine: { show: false },
      axisLabel: {
        color: LABEL_INK,
        fontSize: 20,
        hideOverlap: true,
        margin: 14,
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
        data: values,
        smooth: 0.35,
        symbol: "circle",
        symbolSize: 9,
        // Dots read nicely on a short series (the landing look); on a dense one
        // they clutter, so let the line speak for itself.
        showSymbol: values.length <= 40,
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
