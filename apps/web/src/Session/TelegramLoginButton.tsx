import { useEffect, useRef } from "react";

const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;

interface TelegramLoginButtonProps {
  onAuth: (payload: Record<string, unknown>) => void;
  /** Called when the widget can't be set up (no bot configured). */
  onUnavailable: () => void;
}

declare global {
  interface Window {
    onMooDuckTelegramAuth?: (user: Record<string, unknown>) => void;
  }
}

/**
 * Injects Telegram's official Login Widget script. The widget only renders on the
 * domain registered with BotFather (`/setdomain`) — it will NOT render on
 * `localhost`, which is why there is deliberately no dev bypass. On success the
 * widget calls our global callback with the signed payload.
 */
export function TelegramLoginButton({ onAuth, onUnavailable }: TelegramLoginButtonProps) {
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

    window.onMooDuckTelegramAuth = (user) => onAuth(user);

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", BOT_USERNAME);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "12");
    script.setAttribute("data-onauth", "onMooDuckTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
      delete window.onMooDuckTelegramAuth;
    };
  }, [onAuth, onUnavailable]);

  return <div ref={containerRef} />;
}
