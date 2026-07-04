import { getEnvironmentVariables } from "../config/environment";

/**
 * Is `username` one of the configured admins (ADMIN_TELEGRAM_LOGINS)?
 *
 * Telegram usernames are case-insensitive and stored without the leading `@`;
 * the configured list is already lowercased (see parseAdminTelegramLogins).
 */
export function isAdminLogin(username: string | undefined | null): boolean {
  if (!username) {
    return false;
  }
  const adminLogins = getEnvironmentVariables().telegramBot.adminTelegramLogins;
  return adminLogins.includes(username.toLowerCase());
}
