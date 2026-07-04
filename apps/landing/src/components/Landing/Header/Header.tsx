import Image from "next/image";
import { NAV_LINKS, TELEGRAM_URL } from "../Definitions";
import { TelegramIcon } from "../Icons";
import styles from "./Header.module.css";

export function Header() {
  return (
    <header className={styles.header}>
      <a className={styles.brand} href="#top" aria-label="MooDuck — back to top">
        <span className={styles.brandIcon}>
          <Image src="/icon.png" alt="" fill sizes="40px" className={styles.cover} />
        </span>
        <span className={styles.brandName}>MooDuck</span>
      </a>

      <nav className={styles.nav} aria-label="Main">
        {NAV_LINKS.map((link) => (
          <a
            key={link.label}
            className={styles.navLink}
            href={link.href}
            {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {link.label}
          </a>
        ))}
      </nav>

      <a className={styles.cta} href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
        <TelegramIcon className={styles.ctaIcon} />
        <span className={styles.ctaLabel}>Open in Telegram</span>
        <span className={styles.ctaLabelShort}>Telegram</span>
      </a>
    </header>
  );
}
