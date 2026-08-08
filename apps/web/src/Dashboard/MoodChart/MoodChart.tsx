import { useEffect, useRef } from "react";
import { LineChart } from "echarts/charts";
import { GridComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { SVGRenderer } from "echarts/renderers";
import type { EChartsOption } from "echarts";
import styles from "./MoodChart.module.css";

// Tree-shaken: only what the mood line needs (SVG renderer, like the bot).
echarts.use([LineChart, GridComponent, SVGRenderer]);

interface MoodChartProps {
  option: EChartsOption;
  ariaLabel: string;
}

export function MoodChart({ option, ariaLabel }: MoodChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof echarts.init> | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const chart = echarts.init(container, null, { renderer: "svg" });
    chartRef.current = chart;

    // ECharts fixes its canvas to whatever the container measured at init, so it
    // has to be told when that changes. Watching the element rather than the
    // window catches every cause — rotation, the card being re-laid out, the
    // grid collapsing to one column — not just a viewport resize.
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(container);

    return () => {
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, true);
  }, [option]);

  return <div ref={containerRef} className={styles.chart} role="img" aria-label={ariaLabel} />;
}
