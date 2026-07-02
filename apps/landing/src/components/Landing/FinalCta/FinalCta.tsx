import Image from "next/image";
import { TELEGRAM_URL } from "../Definitions";
import { HeartSolidIcon, TelegramIcon } from "../Icons";
import styles from "./FinalCta.module.css";

export function FinalCta() {
  return (
    <section className={styles.section}>
      <svg className={styles.waves} viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden>
        <path d="M0 210 Q125 180 250 210 T500 210 T750 210 T1000 210" fill="none" stroke="#7fa6d6" strokeWidth="3" />
        <path d="M0 245 Q125 215 250 245 T500 245 T750 245 T1000 245" fill="none" stroke="#7fa6d6" strokeWidth="3" />
      </svg>

      <span className={styles.mascot}>
        <Image src="/ctaMascot.webp" alt="MooDuck mascot" fill sizes="96px" className={styles.cover} />
      </span>

      <div className={styles.copy}>
        <h2 className={styles.title}>Ready to start listening to yourself?</h2>
        <p className={styles.body}>Open MooDuck in Telegram and take a gentle step toward you.</p>
      </div>

      <div className={styles.actions}>
        <a className={styles.button} href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
          <TelegramIcon className={styles.buttonIcon} />
          Open in Telegram
        </a>
        <span className={styles.signoff}>
          You matter. Always.
          <HeartSolidIcon className={styles.signoffIcon} />
        </span>
      </div>
    </section>
  );
}
