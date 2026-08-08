import { LOCALES, type TLocale } from "@mooduck/core";
import styles from "./LocaleSwitcher.module.css";

interface LocaleSwitcherProps {
  locale: TLocale;
  label: string;
  onChange: (locale: TLocale) => void;
}

/** Quiet EN / RU toggle; writes the choice and re-renders, no reload. */
export function LocaleSwitcher({ locale, label, onChange }: LocaleSwitcherProps) {
  return (
    <div className={styles.switcher} role="group" aria-label={label}>
      {LOCALES.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            className={styles.link}
            data-active={active}
            aria-pressed={active}
            onClick={() => onChange(code)}
          >
            {code.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
