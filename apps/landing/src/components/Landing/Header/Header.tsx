import Image from "next/image";
import Link from "next/link";
import { LOCALES, type TLocale } from "@mooduck/core";
import type { TLandingMessages } from "@/I18n/Catalogs/En";
import { NAV_LINKS, TELEGRAM_URL } from "../Definitions";
import { TelegramIcon } from "../Icons";
import styles from "./Header.module.css";

interface HeaderProps {
  locale: TLocale;
  messages: TLandingMessages;
}

export function Header({ locale, messages }: HeaderProps) {
  return (
    <header className={styles.header}>
      <a className={styles.brand} href="#top" aria-label={messages.header.backToTop}>
        <span className={styles.brandIcon}>
          <Image src="/icon.png" alt="" fill sizes="40px" className={styles.cover} />
        </span>
        <span className={styles.brandName}>MooDuck</span>
      </a>

      <nav className={styles.nav} aria-label="Main">
        {NAV_LINKS.map((link) => (
          <a
            key={link.id}
            className={styles.navLink}
            href={link.href}
            {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {messages.nav[link.id]}
          </a>
        ))}
      </nav>

      <LocaleSwitcher locale={locale} label={messages.header.localeSwitcherLabel} />

      <a className={styles.cta} href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
        <TelegramIcon className={styles.ctaIcon} />
        <span className={styles.ctaLabel}>{messages.cta.openInTelegram}</span>
        <span className={styles.ctaLabelShort}>{messages.cta.openInTelegramShort}</span>
      </a>
    </header>
  );
}

interface LocaleSwitcherProps {
  locale: TLocale;
  label: string;
}

/** Quiet EN / RU pair; each links to the sibling static page. */
function LocaleSwitcher({ locale, label }: LocaleSwitcherProps) {
  return (
    <div className={styles.switcher} role="group" aria-label={label}>
      {LOCALES.map((code) => {
        const active = code === locale;
        return (
          <Link
            key={code}
            href={`/${code}`}
            hrefLang={code}
            className={styles.switcherLink}
            data-active={active}
            {...(active ? { "aria-current": "true" as const } : {})}
          >
            {code.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}
