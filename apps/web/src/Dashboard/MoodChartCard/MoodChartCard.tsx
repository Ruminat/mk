import { useMemo } from "react";
import type { TLocale } from "@mooduck/core";
import type { TMoodEntry } from "@mooduck/contracts";
import type { TWebMessages } from "@/I18n/Catalogs/En";
import { MOOD_CHART_MIN_POINTS } from "../Definitions";
import { buildMoodChartOption, selectChartPoints } from "../MoodChart/BuildMoodChartOption";
import { MoodChart } from "../MoodChart/MoodChart";
import { useCompactChart } from "../MoodChart/UseCompactChart";
import styles from "./MoodChartCard.module.css";

interface MoodChartCardProps {
  messages: TWebMessages;
  locale: TLocale;
  entries: TMoodEntry[];
  loading: boolean;
}

export function MoodChartCard({ messages, locale, entries, loading }: MoodChartCardProps) {
  const m = messages.chart;
  const compact = useCompactChart();
  const option = useMemo(
    () => buildMoodChartOption(entries, locale, { compact }),
    [entries, locale, compact],
  );
  const canPlot = !loading && selectChartPoints(entries).length >= MOOD_CHART_MIN_POINTS;

  return (
    <section className={styles.card}>
      <div className={styles.head}>
        <h3 className={styles.title}>{m.title}</h3>
        <p className={styles.subtitle}>{m.subtitle}</p>
      </div>

      {canPlot ? (
        <MoodChart option={option} ariaLabel={`${m.title} — ${m.subtitle}`} />
      ) : (
        <p className={styles.empty}>{loading ? messages.states.loading : m.empty}</p>
      )}
    </section>
  );
}
