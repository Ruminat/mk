import Image from "next/image";
import type { TLandingMessages } from "@/I18n/Catalogs/En";
import {
  CHAT_MESSAGES,
  MOOD_ENTRIES,
  MOOD_HISTORY_VALUES,
  PREVIEW_POINTS,
  TELEGRAM_URL,
  type ChatSide,
} from "../Definitions";
import { BackArrowIcon, DotsVerticalIcon } from "../Icons";
import styles from "./ProductPreview.module.css";

interface ProductPreviewProps {
  messages: TLandingMessages;
}

export function ProductPreview({ messages }: ProductPreviewProps) {
  const { preview } = messages;

  return (
    <section className={styles.section}>
      <div className={styles.intro}>
        <span className={styles.eyebrow}>{preview.eyebrow}</span>
        <h2 className={styles.title}>{preview.title}</h2>
        <p className={styles.body}>{preview.body}</p>

        <ul className={styles.points}>
          {PREVIEW_POINTS.map((point) => (
            <li key={point.id} className={styles.point}>
              <span className={styles.pointIconWrap} data-tone={point.tone}>
                <point.Icon className={styles.pointIcon} />
              </span>
              {preview.points[point.id]}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.chat}>
        <header className={styles.chatHeader}>
          <BackArrowIcon className={styles.backIcon} />
          <span className={styles.avatar}>
            <Image src="/chatAvatar.webp" alt="" fill sizes="38px" className={styles.cover} />
          </span>
          <div className={styles.chatMeta}>
            <span className={styles.chatName}>{preview.chatName}</span>
            <span className={styles.chatStatus}>{preview.chatStatus}</span>
          </div>
          <DotsVerticalIcon className={styles.menuIcon} />
        </header>

        <div className={styles.messages}>
          {CHAT_MESSAGES.map((message) => (
            <ChatBubble
              key={message.id}
              side={message.side}
              time={message.time}
              text={preview.chat[message.id]}
            />
          ))}
        </div>
      </div>

      <div className={styles.history}>
        <h3 className={styles.historyTitle}>{preview.historyTitle}</h3>
        <p className={styles.historyCaption}>{preview.historyCaption}</p>

        <MoodChart ariaLabel={preview.chartAriaLabel} labels={preview.chartLabels} />

        <h4 className={styles.entriesTitle}>{preview.entriesTitle}</h4>
        <ul className={styles.entries}>
          {MOOD_ENTRIES.map((entry) => {
            const copy = preview.entries[entry.id];
            return (
              <li key={entry.id} className={styles.entry}>
                <span className={styles.entryDate}>{copy.date}</span>
                <span className={styles.entryScore}>{entry.score}</span>
                <span className={styles.entryNote}>{copy.note}</span>
              </li>
            );
          })}
        </ul>

        <a
          className={styles.historyButton}
          href={TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          {preview.viewAll}
        </a>
      </div>
    </section>
  );
}

interface ChatBubbleProps {
  side: ChatSide;
  time: string;
  text: string;
}

function ChatBubble({ side, time, text }: ChatBubbleProps) {
  return (
    <div className={styles.bubble} data-side={side}>
      <span className={styles.bubbleText}>{text}</span>
      <span className={styles.bubbleTime}>
        {time}
        {side === "user" ? <span className={styles.checks}> ✓✓</span> : null}
      </span>
    </div>
  );
}

interface MoodChartProps {
  ariaLabel: string;
  labels: readonly string[];
}

/** Static demo line chart of the past 14 days of mood scores. */
function MoodChart({ ariaLabel, labels }: MoodChartProps) {
  const width = 280;
  const height = 130;
  const padX = 8;
  const padY = 10;
  const stepX = (width - padX * 2) / (MOOD_HISTORY_VALUES.length - 1);
  const toY = (value: number) => height - padY - (value / 10) * (height - padY * 2);
  const points = MOOD_HISTORY_VALUES.map((value, index) => ({
    x: padX + index * stepX,
    y: toY(value),
  }));
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

  return (
    <figure className={styles.chart}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={styles.chartSvg}
        role="img"
        aria-label={ariaLabel}
      >
        {[0, 5, 10].map((value) => (
          <line
            key={value}
            x1={padX}
            x2={width - padX}
            y1={toY(value)}
            y2={toY(value)}
            className={styles.chartGrid}
          />
        ))}
        <path d={path} className={styles.chartLine} />
        {points.map((point, index) => (
          <circle key={index} cx={point.x} cy={point.y} r="3.2" className={styles.chartDot} />
        ))}
      </svg>
      <figcaption className={styles.chartLabels} aria-hidden>
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </figcaption>
    </figure>
  );
}
