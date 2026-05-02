import { getEnvironmentVariables } from "../../common/environment";

export function isAdminTelegramLogin(username: string | undefined): boolean {
  if (!username) {
    return false;
  }

  const admins = getEnvironmentVariables().telegramBot.adminTelegramLogins;
  return admins.includes(username.toLowerCase());
}
