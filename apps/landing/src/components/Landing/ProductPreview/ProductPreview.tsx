import Image from "next/image";
import {
  CHAT_MESSAGES,
  MOOD_ENTRIES,
  MOOD_HISTORY_VALUES,
  PREVIEW_POINTS,
  TELEGRAM_URL,
  type ChatMessage,
} from "../Definitions";
import { BackArrowIcon, DotsVerticalIcon } from "../Icons";
import styles from "./ProductPreview.module.css";

export function ProductPreview() {
  return (
    <section className={styles.section}>
      <div className={styles.intro}>
        <span className={styles.eyebrow}>Product preview</span>
        <h2 className={styles.title}>Check in. Reflect. Grow with kindness.</h2>
        <p className={styles.body}>
          MooDuck meets you where you are — with simple conversations and meaningful insights.
        </p>

        <ul className={styles.points}>
          {PREVIEW_POINTS.map((point) => (
            <li key={point.text} className={styles.point}>
              <span className={styles.pointIconWrap} data-tone={point.tone}>
                <point.Icon className={styles.pointIcon} />
              </span>
              {point.text}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.chat}>
        <header className={styles.chatHeader}>
          <BackArrowIcon className={styles.backIcon} />
          <span className={styles.avatar}>
            <Image src="/chatAvatar.webp" alt="MooDuck" fill sizes="38px" className={styles.cover} />
          </span>
          <div className={styles.chatMeta}>
            <span className={styles.chatName}>MooDuck</span>
            <span className={styles.chatStatus}>bot</span>
          </div>
          <DotsVerticalIcon className={styles.menuIcon} />
        </header>

        <div className={styles.messages}>
          {CHAT_MESSAGES.map((message, index) => (
            <ChatBubble key={index} message={message} />
          ))}
        </div>
      </div>

      <div className={styles.history}>
        <h3 className={styles.historyTitle}>Your mood history</h3>
        <p className={styles.historyCaption}>Past 14 days</p>

        <MoodChart />

        <h4 className={styles.entriesTitle}>Recent entries</h4>
        <ul className={styles.entries}>
          {MOOD_ENTRIES.map((entry) => (
            <li key={entry.date} className={styles.entry}>
              <span className={styles.entryDate}>{entry.date}</span>
              <span className={styles.entryScore}>{entry.score}</span>
              <span className={styles.entryNote}>{entry.note}</span>
            </li>
          ))}
        </ul>

        <a
          className={styles.historyButton}
          href={TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          View all history
        </a>
      </div>
    </section>
  );
}

interface ChatBubbleProps {
  message: ChatMessage;
}

function ChatBubble({ message }: ChatBubbleProps) {
  return (
    <div className={styles.bubble} data-side={message.side}>
      <span className={styles.bubbleText}>{message.text}</span>
      <span className={styles.bubbleTime}>
        {message.time}
        {message.side === "user" ? <span className={styles.checks}> ✓✓</span> : null}
      </span>
    </div>
  );
}

/** Static demo line chart of the past 14 days of mood scores. */
function MoodChart() {
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
        aria-label="Line chart of mood scores over the past 14 days"
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
        <span>May 5</span>
        <span>May 10</span>
        <span>May 15</span>
        <span>May 20</span>
      </figcaption>
    </figure>
  );
}
