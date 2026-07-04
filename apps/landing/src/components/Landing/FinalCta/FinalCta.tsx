import Image from "next/image";
import { GITHUB_URL, TELEGRAM_URL } from "../Definitions";
import { GithubIcon, LockIcon, TelegramIcon } from "../Icons";
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
        <h2 className={styles.title}>You deserve a space that&apos;s just for you.</h2>
        <p className={styles.body}>Start your gentle mood journey with MooDuck.</p>

        <div className={styles.actions}>
          <a
            className={`${styles.button} ${styles.buttonPrimary}`}
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <TelegramIcon className={styles.buttonIcon} />
            Open in Telegram
          </a>
          <a
            className={`${styles.button} ${styles.buttonGhost}`}
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <GithubIcon className={styles.buttonIcon} />
            View on GitHub
          </a>
        </div>

        <p className={styles.signoff}>
          <LockIcon className={styles.signoffIcon} />
          Private. Low pressure. Always here for you.
        </p>
      </div>
    </section>
  );
}
