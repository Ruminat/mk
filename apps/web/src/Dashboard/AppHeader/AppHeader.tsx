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

/**
 * The Telegram avatar sits on top of the initials rather than replacing them.
 *
 * The picture comes from Telegram's CDN, which some networks can't reach — and a
 * request that hangs never fires `error`, so swapping on `onError` leaves the
 * slot empty for as long as the browser keeps waiting. Layering means the
 * initials are what's on screen until (and unless) the image actually decodes.
 * `alt=""` for the same reason: a broken image must draw nothing, not squeeze a
 * sentence into a 40px circle.
 */
function Avatar({ user, alt }: AvatarProps) {
  return (
    <span className={styles.avatar} role="img" aria-label={alt}>
      <span aria-hidden>{initials(user.name)}</span>
      {user.photo ? (
        <img
          className={styles.avatarImage}
          src={user.photo}
          alt=""
          width={40}
          height={40}
          referrerPolicy="no-referrer"
        />
      ) : null}
    </span>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part.charAt(0)).join("");
  return (letters || "?").toUpperCase();
}
