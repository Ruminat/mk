import { useState } from "react";
import type { TLocale } from "@mooduck/core";
import type { TSessionUser } from "@mooduck/contracts";
import iconUrl from "@/assets/icon.png";
import type { TWebMessages } from "@/I18n/Catalogs/En";
import { LocaleSwitcher } from "@/I18n/LocaleSwitcher";
import styles from "./AppHeader.module.css";

interface AppHeaderProps {
  user: TSessionUser;
  locale: TLocale;
  messages: TWebMessages;
  onLocaleChange: (locale: TLocale) => void;
  onLogout: () => void;
}

export function AppHeader({ user, locale, messages, onLocaleChange, onLogout }: AppHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <img className={styles.brandIcon} src={iconUrl} alt="" width={40} height={40} />
        <span className={styles.wordmark}>{messages.app.wordmark}</span>
      </div>

      <div className={styles.account}>
        <LocaleSwitcher locale={locale} label={messages.header.localeSwitcherLabel} onChange={onLocaleChange} />
        <Avatar user={user} alt={messages.header.avatarAlt} />
        <span className={styles.name}>{user.name}</span>
        <button type="button" className={styles.logout} onClick={onLogout}>
          {messages.header.logout}
        </button>
      </div>
    </header>
  );
}

interface AvatarProps {
  user: TSessionUser;
  alt: string;
}

/** Telegram avatar with an initials fallback when the (third-party) image fails. */
function Avatar({ user, alt }: AvatarProps) {
  const [failed, setFailed] = useState(false);

  if (user.photo && !failed) {
    return (
      <img
        className={styles.avatar}
        src={user.photo}
        alt={alt}
        width={40}
        height={40}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span className={styles.avatarFallback} aria-hidden>
      {initials(user.name)}
    </span>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part.charAt(0)).join("");
  return (letters || "?").toUpperCase();
}
