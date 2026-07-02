import Image from "next/image";
import { GITHUB_URL, TELEGRAM_URL } from "../Definitions";
import { GithubIcon, HeartIcon, TelegramIcon } from "../Icons";
import styles from "./Hero.module.css";

export function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.intro}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>
            <Image src="/brandIcon.webp" alt="MooDuck logo" fill sizes="52px" className={styles.cover} />
          </span>
          <span className={styles.brandName}>MooDuck</span>
        </div>

        <h1 className={styles.title}>A calm place to&nbsp;listen to yourself.</h1>

        <p className={styles.subtitle}>
          MooDuck is your private Telegram mood journal. Check in, add short notes, and reflect
          gently — all in a safe, judgment-free space.
        </p>

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
            className={`${styles.button} ${styles.buttonSecondary}`}
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <GithubIcon className={styles.buttonIcon} />
            View on GitHub
          </a>
        </div>

        <p className={styles.note}>
          <HeartIcon className={styles.noteIcon} />
          Made with care for quieter days and brighter ones.
        </p>
      </div>

      <div className={styles.mascotColumn}>
        <div className={styles.mascot}>
          <svg className={styles.mascotWaves} viewBox="0 0 400 400" preserveAspectRatio="none" aria-hidden>
            <path d="M0 300 Q50 285 100 300 T200 300 T300 300 T400 300" fill="none" stroke="#5b8ac4" strokeWidth="3" />
            <path d="M0 330 Q50 315 100 330 T200 330 T300 330 T400 330" fill="none" stroke="#5b8ac4" strokeWidth="3" />
            <path d="M0 360 Q50 345 100 360 T200 360 T300 360 T400 360" fill="none" stroke="#5b8ac4" strokeWidth="3" />
          </svg>
          <Image
            src="/heroMascot.webp"
            alt="MooDuck mascot — a scholarly duck holding a journal"
            fill
            priority
            sizes="(max-width: 768px) 280px, 430px"
            className={styles.cover}
          />
        </div>
      </div>
    </section>
  );
}
