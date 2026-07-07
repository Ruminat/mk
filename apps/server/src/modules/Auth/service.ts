import { createHash, createHmac } from "crypto";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { getEnvironmentVariables } from "../../common/config/environment";
import { isAdminLogin } from "../../common/telegram/isAdminLogin";
import { getTelegramUserIdSecureHash } from "../../common/telegram/telegramUserId";
import { db } from "../../db/client";
import { ServiceError } from "../../services/errors/ServiceError";
import { TInsertUser, TSelectUser, UserTable } from "./model";

const { auth } = getEnvironmentVariables();

interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

/**
 * Verifies Telegram authentication data
 * Based on: https://core.telegram.org/widgets/login#checking-authorization
 */
function verifyTelegramAuth(data: TelegramAuthData): boolean {
  const { hash, ...userData } = data;
  const dataCheckString = Object.keys(userData)
    .sort()
    .map((key) => `${key}=${userData[key as keyof typeof userData]}`)
    .join("\n");

  if (!auth.telegramBotToken) return false;

  const secretKey = createHash("sha256").update(auth.telegramBotToken).digest();

  const calculatedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  // Check if hash matches and auth_date is not too old (24 hours)
  const isHashValid = calculatedHash === hash;
  const isRecent = Date.now() / 1000 - data.auth_date < 86400; // 24 hours

  return isHashValid && isRecent;
}

type TTokenClaims = { userId: string; isAdmin: boolean };

/**
 * Generates a JWT token for a user. `isAdmin` is derived once at sign-in from the
 * telegram username (available only in transit) and carried as a signed claim, so
 * the username itself is never persisted.
 */
function generateToken(claims: TTokenClaims): string {
  return jwt.sign(claims, auth.jwtSecret, { expiresIn: "7d" });
}

/**
 * Verifies a JWT token and returns its claims (user id + admin flag).
 */
function verifyToken(token: string): TTokenClaims {
  try {
    const decoded = jwt.verify(token, auth.jwtSecret) as { userId: string; isAdmin?: unknown };
    return { userId: decoded.userId, isAdmin: decoded.isAdmin === true };
  } catch (error) {
    throw new ServiceError("Invalid or expired token");
  }
}

export const authService = {
  /**
   * Authenticates a user with Telegram
   * Creates a new user if they don't exist, or returns existing user
   */
  signInWithTelegram: async (authData: TelegramAuthData) => {
    if (!verifyTelegramAuth(authData)) {
      throw new ServiceError("Invalid Telegram authentication data");
    }

    // The user id IS the secure hash of the numeric telegram id — the same key
    // the bot stores mood entries and chat history under. We look up and create
    // by this hash only; the raw numeric id is never persisted (plans.md §2/§3).
    const userId = getTelegramUserIdSecureHash(authData.id);

    // Check if user exists
    const existingUser = await db.select().from(UserTable).where(eq(UserTable.id, userId)).limit(1);

    let user: TSelectUser;

    if (existingUser.length > 0) {
      user = existingUser[0];
    } else {
      // Create new user
      const newUser: TInsertUser = {
        id: userId,
        name: `${authData.first_name}${authData.last_name ? ` ${authData.last_name}` : ""}`,
        avatarUrl: authData.photo_url,
      };

      const result = await db.insert(UserTable).values(newUser).returning();
      if (result.length !== 1) {
        throw new ServiceError("Failed to create user");
      }
      user = result[0];
    }

    // Admin status is decided here, from the in-transit telegram username, and
    // baked into the signed token — the username is never persisted.
    const isAdmin = isAdminLogin(authData.username);
    const token = generateToken({ userId: user.id, isAdmin });

    return { user, token };
  },

  /**
   * Gets a user by ID
   */
  getUserById: async (userId: string): Promise<TSelectUser | null> => {
    const users = await db.select().from(UserTable).where(eq(UserTable.id, userId)).limit(1);

    return users.length > 0 ? users[0] : null;
  },

  /**
   * Verifies a JWT token and returns the user together with the admin flag
   * carried in the token claims.
   */
  verifyTokenAndGetUser: async (token: string): Promise<{ user: TSelectUser; isAdmin: boolean }> => {
    const { userId, isAdmin } = verifyToken(token);
    const user = await authService.getUserById(userId);

    if (!user) {
      throw new ServiceError("User not found");
    }

    return { user, isAdmin };
  },
};
