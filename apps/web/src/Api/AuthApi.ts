import { SessionResponseSchema, type TSessionUser } from "@mooduck/contracts";
import { apiRequest, apiRequestNoContent } from "./ApiClient";

/**
 * No login call here: the Telegram widget navigates the browser to
 * `/api/auth/telegram/callback`, which sets the cookie and redirects back, so the
 * app never posts credentials itself.
 */
export const authApi = {
  /** Current session, or a thrown `ApiError` (401) when there isn't one. */
  getSession: async (): Promise<TSessionUser> => {
    const { user } = await apiRequest("/api/auth/session", SessionResponseSchema);
    return user;
  },

  logout: (): Promise<void> => apiRequestNoContent("/api/auth/logout", { method: "POST" }),
};
