import { SessionResponseSchema, type TSessionUser } from "@mooduck/contracts";
import { apiRequest, apiRequestNoContent } from "./ApiClient";

export const authApi = {
  /** Exchange a verified Telegram Login Widget payload for a session cookie. */
  loginWithTelegram: async (payload: Record<string, unknown>): Promise<TSessionUser> => {
    const { user } = await apiRequest("/api/auth/telegram", SessionResponseSchema, { method: "POST", body: payload });
    return user;
  },

  /** Current session, or a thrown `ApiError` (401) when there isn't one. */
  getSession: async (): Promise<TSessionUser> => {
    const { user } = await apiRequest("/api/auth/session", SessionResponseSchema);
    return user;
  },

  logout: (): Promise<void> => apiRequestNoContent("/api/auth/logout", { method: "POST" }),
};
