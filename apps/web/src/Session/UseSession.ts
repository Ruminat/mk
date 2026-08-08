import { useCallback, useEffect, useState } from "react";
import type { TSessionUser } from "@mooduck/contracts";
import { authApi } from "@/Api/AuthApi";

export type TSessionState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authenticated"; user: TSessionUser };

export interface UseSessionResult {
  state: TSessionState;
  setAuthenticated: (user: TSessionUser) => void;
  setAnonymous: () => void;
}

/**
 * Probes `GET /api/auth/session` on mount: a valid cookie ⇒ authenticated, a 401
 * (or any failure) ⇒ anonymous. Login and logout flip the state directly, and a
 * mid-session 401 elsewhere calls `setAnonymous` to drop back to the login screen.
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

  const setAuthenticated = useCallback((user: TSessionUser) => setState({ status: "authenticated", user }), []);
  const setAnonymous = useCallback(() => setState({ status: "anonymous" }), []);

  return { state, setAuthenticated, setAnonymous };
}
