import { useCallback, useState } from "react";
import type { TLocale } from "@mooduck/core";
import type { TSessionUser } from "@mooduck/contracts";
import iconUrl from "@/assets/icon.png";
import { authApi } from "@/Api/AuthApi";
import { LocaleSwitcher } from "@/I18n/LocaleSwitcher";
import { webMessages } from "@/I18n/Messages";
import { TelegramLoginButton } from "./TelegramLoginButton";
import styles from "./LoginPage.module.css";

interface LoginPageProps {
  locale: TLocale;
  onLocaleChange: (locale: TLocale) => void;
  onAuthenticated: (user: TSessionUser) => void;
}

/** Anonymous state: a small centred card with the Telegram login button. */
export function LoginPage({ locale, onLocaleChange, onAuthenticated }: LoginPageProps) {
  const m = webMessages(locale);
  const [unavailable, setUnavailable] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleAuth = useCallback(
    async (payload: Record<string, unknown>) => {
      setFailed(false);
      try {
        onAuthenticated(await authApi.loginWithTelegram(payload));
      } catch {
        // The widget verified the person; this is our own exchange failing, which
        // is worth saying plainly rather than blaming the button.
        setFailed(true);
      }
    },
    [onAuthenticated],
  );

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
          <TelegramLoginButton onAuth={handleAuth} onUnavailable={handleUnavailable} />
        </div>

        {failed ? <p className={styles.unavailable}>{m.login.failed}</p> : null}
        {unavailable ? <p className={styles.unavailable}>{m.login.widgetUnavailable}</p> : null}
      </section>
    </main>
  );
}
