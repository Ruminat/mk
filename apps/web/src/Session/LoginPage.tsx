import { useCallback, useState } from "react";
import type { TLocale } from "@mooduck/core";
import iconUrl from "@/assets/icon.png";
import { LocaleSwitcher } from "@/I18n/LocaleSwitcher";
import { webMessages } from "@/I18n/Messages";
import { TelegramLoginButton } from "./TelegramLoginButton";
import styles from "./LoginPage.module.css";

const LOGIN_RESULT_PARAM = "login";
const LOGIN_FAILED = "failed";

function consumeLoginFailure(): boolean {
  const params = new URLSearchParams(window.location.search);
  if (params.get(LOGIN_RESULT_PARAM) !== LOGIN_FAILED) {
    return false;
  }

  params.delete(LOGIN_RESULT_PARAM);
  const query = params.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);

  return true;
}

/**
 * A failed callback sends the browser back to `/app/?login=failed`. Read that
 * once per page load and strip it, so the message doesn't outlive a refresh.
 *
 * At module scope rather than in a hook on purpose: this consumes something it
 * then destroys, and StrictMode double-invokes both lazy initialisers and effects
 * in development, so neither would run it exactly once.
 */
const loginFailed = consumeLoginFailure();

interface LoginPageProps {
  locale: TLocale;
  onLocaleChange: (locale: TLocale) => void;
}

/**
 * Anonymous state: a small centred card with the Telegram login button.
 *
 * There is no success path to handle here. The widget navigates away to the auth
 * callback, which sets the session cookie and sends the browser back to `/app/`,
 * where `useSession` picks it up on the next mount.
 */
export function LoginPage({ locale, onLocaleChange }: LoginPageProps) {
  const m = webMessages(locale);
  const [unavailable, setUnavailable] = useState(false);

  const handleUnavailable = useCallback(() => setUnavailable(true), []);

  return (
    <main className={styles.page}>
      <div className={styles.switcherRow}>
        <LocaleSwitcher locale={locale} label={m.header.localeSwitcherLabel} onChange={onLocaleChange} />
      </div>

      <section className={styles.card}>
        <img className={styles.icon} src={iconUrl} alt="" width={64} height={64} />
        <h1 className={styles.heading}>{m.login.heading}</h1>
        <p className={styles.tagline}>{m.login.tagline}</p>
        <p className={styles.prompt}>{m.login.prompt}</p>

        <div className={styles.button}>
          <TelegramLoginButton onUnavailable={handleUnavailable} />
        </div>

        {loginFailed ? <p className={styles.unavailable}>{m.login.failed}</p> : null}
        {unavailable ? <p className={styles.unavailable}>{m.login.widgetUnavailable}</p> : null}
      </section>
    </main>
  );
}
