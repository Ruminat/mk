import { useCallback, useEffect, useState } from "react";
import { LOCALES, resolveBrowserLocale, type TLocale } from "@mooduck/core";

const STORAGE_KEY = "mooduck.locale";

/**
 * Pure resolution order: a valid stored preference wins, otherwise the browser's
 * languages decide. Exported (and tested) separately from the hook so the order
 * is verifiable without a DOM.
 */
export function resolveStoredLocale(stored: string | null, languages: readonly string[]): TLocale {
  if (stored !== null && (LOCALES as readonly string[]).includes(stored)) {
    return stored as TLocale;
  }
  return resolveBrowserLocale(languages);
}

export interface UseLocaleResult {
  locale: TLocale;
  setLocale: (locale: TLocale) => void;
}

/**
 * Runtime locale for the app (it's behind auth, so no routing/SEO). The Login
 * Widget carries no `language_code`, so the locale comes only from localStorage
 * and the browser. Switching writes localStorage and sets `<html lang>` — no reload.
 */
export function useLocale(): UseLocaleResult {
  const [locale, setLocaleState] = useState<TLocale>(() =>
    resolveStoredLocale(readStored(), navigator.languages ?? []),
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: TLocale) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private mode); the choice still applies for the session.
    }
    setLocaleState(next);
  }, []);

  return { locale, setLocale };
}

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
