import { useCallback, useEffect, useState } from "react";
import type { TSessionUser } from "@mooduck/contracts";
import { authApi } from "@/Api/AuthApi";

export type TSessionState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authenticated"; user: TSessionUser };

export interface UseSessionResult {
  state: TSessionState;
  setAnonymous: () => void;
}

/**
 * Probes `GET /api/auth/session` on mount: a valid cookie ⇒ authenticated, a 401
 * (or any failure) ⇒ anonymous.
 *
 * There is no `setAuthenticated`: logging in is a full navigation through the
 * Telegram auth callback, so the app remounts and this probe is what discovers
 * the new session. Logout and any mid-session 401 call `setAnonymous` to drop
 * back to the login screen.
 */
export function useSession(): UseSessionResult {
  const [state, setState] = useState<TSessionState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    authApi
      .getSession()
      .then((user) => {
        if (!cancelled) setState({ status: "authenticated", user });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "anonymous" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setAnonymous = useCallback(() => setState({ status: "anonymous" }), []);

  return { state, setAnonymous };
}
