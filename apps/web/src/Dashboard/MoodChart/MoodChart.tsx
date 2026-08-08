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

    const resize = () => chart.resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, true);
  }, [option]);

  return <div ref={containerRef} className={styles.chart} role="img" aria-label={ariaLabel} />;
}
