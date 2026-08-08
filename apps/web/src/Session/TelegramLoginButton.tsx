import { useEffect, useRef } from "react";
import {
  LOGIN_STATE_COOKIE_NAME,
  LOGIN_STATE_COOKIE_PATH,
  LOGIN_STATE_PARAM,
  LOGIN_STATE_TTL_SECONDS,
} from "@mooduck/contracts";

const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;
const CALLBACK_PATH = "/api/auth/telegram/callback";
/** 16 bytes of randomness as hex — comfortably inside the range the server accepts. */
const STATE_BYTES = 16;

interface TelegramLoginButtonProps {
  /** Called when the widget can't be set up (no bot configured). */
  onUnavailable: () => void;
}

function createLoginState(): string {
  const bytes = new Uint8Array(STATE_BYTES);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Store the nonce for the server to compare the callback against. `SameSite=Lax`
 * because the callback arrives as a top-level navigation; `Secure` only over
 * https, so plain http dev still works. It can't be `HttpOnly` — nothing set from
 * script can be — but that costs nothing here: what makes this work is that a
 * cross-site attacker can neither read nor write cookies on our origin.
 */
function rememberLoginState(state: string): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    `${LOGIN_STATE_COOKIE_NAME}=${state}; Path=${LOGIN_STATE_COOKIE_PATH}` +
    `; Max-Age=${LOGIN_STATE_TTL_SECONDS}; SameSite=Lax${secure}`;
}

/**
 * Injects Telegram's official Login Widget. The widget only renders on the domain
 * registered with BotFather (`/setdomain`) — it will NOT render on `localhost`,
 * which is why there is deliberately no dev bypass.
 *
 * Login finishes through `data-auth-url` rather than `data-onauth`: the callback
 * form is parsed with `eval` inside telegram-widget.js, so using it would mean
 * putting `'unsafe-eval'` into the app's CSP for the sake of one attribute. With
 * the redirect form the widget simply navigates to our endpoint with the signed
 * fields appended, and the CSP stays strict. The `state` nonce riding along is
 * what keeps that GET safe.
 */
export function TelegramLoginButton({ onUnavailable }: TelegramLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    if (!BOT_USERNAME) {
      onUnavailable();
      return;
    }

    const state = createLoginState();
    rememberLoginState(state);

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", BOT_USERNAME);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "12");
    // Relative on purpose: the widget resolves it against this document, so the
    // origin is always whichever one served the app.
    script.setAttribute("data-auth-url", `${CALLBACK_PATH}?${LOGIN_STATE_PARAM}=${state}`);
    script.setAttribute("data-request-access", "write");
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [onUnavailable]);

  return <div ref={containerRef} />;
}
