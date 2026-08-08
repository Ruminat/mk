import Image from "next/image";
import type { TLandingMessages } from "@/I18n/Catalogs/En";
import { GITHUB_URL, TELEGRAM_URL } from "../Definitions";
import { GithubIcon, HeartSolidIcon, LockIcon, TelegramIcon } from "../Icons";
import styles from "./Hero.module.css";

interface HeroProps {
  messages: TLandingMessages;
}

export function Hero({ messages }: HeroProps) {
  const { hero, cta } = messages;

  return (
    <section className={styles.hero}>
      <div className={styles.intro}>
        <h1 className={styles.title}>
          {hero.titleLead}&nbsp;{hero.titleTail}
          <HeartSolidIcon className={styles.titleHeart} />
        </h1>

        <p className={styles.subtitle}>{hero.subtitle}</p>

        <div className={styles.actions}>
          <a
            className={`${styles.button} ${styles.buttonPrimary}`}
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <TelegramIcon className={styles.buttonIcon} />
            {cta.openInTelegram}
          </a>
          <a
            className={`${styles.button} ${styles.buttonSecondary}`}
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <GithubIcon className={styles.buttonIcon} />
            {cta.viewOnGithub}
          </a>
        </div>

        <p className={styles.note}>
          <LockIcon className={styles.noteIcon} />
          {hero.privacyNote}
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
            alt={hero.mascotAlt}
            fill
            priority
            sizes="(max-width: 768px) 300px, 430px"
            className={styles.cover}
          />
        </div>
      </div>
    </section>
  );
}
