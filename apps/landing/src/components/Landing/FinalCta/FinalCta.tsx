import Image from "next/image";
import type { TLandingMessages } from "@/I18n/Catalogs/En";
import { GITHUB_URL, TELEGRAM_URL, WEB_APP_URL } from "../Definitions";
import { BrowserIcon, GithubIcon, LockIcon, TelegramIcon } from "../Icons";
import styles from "./FinalCta.module.css";

interface FinalCtaProps {
  messages: TLandingMessages;
}

export function FinalCta({ messages }: FinalCtaProps) {
  const { finalCta, cta } = messages;

  return (
    <section className={styles.section}>
      <svg className={styles.waves} viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden>
        <path d="M0 210 Q125 180 250 210 T500 210 T750 210 T1000 210" fill="none" stroke="#7fa6d6" strokeWidth="3" />
        <path d="M0 245 Q125 215 250 245 T500 245 T750 245 T1000 245" fill="none" stroke="#7fa6d6" strokeWidth="3" />
      </svg>

      <span className={styles.mascot}>
        <Image src="/ctaMascot.webp" alt="" fill sizes="96px" className={styles.cover} />
      </span>

      <div className={styles.copy}>
        <h2 className={styles.title}>{finalCta.title}</h2>
        <p className={styles.body}>{finalCta.body}</p>

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
          {/* Same host, different app — a normal navigation, so no target/rel. */}
          <a className={`${styles.button} ${styles.buttonGhost}`} href={WEB_APP_URL}>
            <BrowserIcon className={styles.buttonIcon} />
            {cta.openWebApp}
          </a>
          <a
            className={`${styles.button} ${styles.buttonGhost}`}
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <GithubIcon className={styles.buttonIcon} />
            {cta.viewOnGithub}
          </a>
        </div>

        <p className={styles.signoff}>
          <LockIcon className={styles.signoffIcon} />
          {finalCta.signoff}
        </p>
      </div>
    </section>
  );
}
