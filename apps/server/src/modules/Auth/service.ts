import bcrypt from "bcrypt";
import { createHash, createHmac } from "crypto";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { getEnvironmentVariables } from "../../common/environment";
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

interface EmailAuthData {
  email: string;
  password: string;
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

/**
 * Generates a JWT token for a user
 */
function generateToken(userId: string): string {
  return jwt.sign({ userId }, auth.jwtSecret, { expiresIn: "7d" });
}

/**
 * Verifies a JWT token and returns the user ID
 */
function verifyToken(token: string): string {
  try {
    const decoded = jwt.verify(token, auth.jwtSecret) as { userId: string };
    return decoded.userId;
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

    const telegramId = authData.id.toString();
    const userId = `telegram_${telegramId}`;

    // Check if user exists
    const existingUser = await db.select().from(UserTable).where(eq(UserTable.telegramId, telegramId)).limit(1);

    let user: TSelectUser;

    if (existingUser.length > 0) {
      user = existingUser[0];
    } else {
      // Create new user
      const newUser: TInsertUser = {
        id: userId,
        telegramId,
        name: `${authData.first_name}${authData.last_name ? ` ${authData.last_name}` : ""}`,
        avatarUrl: authData.photo_url,
        authProvider: "telegram",
      };

      const result = await db.insert(UserTable).values(newUser).returning();
      if (result.length !== 1) {
        throw new ServiceError("Failed to create user");
      }
      user = result[0];
    }

    const token = generateToken(user.id);

    return { user, token };
  },

  /**
   * Signs up a new user with email and password
   */
  signUpWithEmail: async (authData: EmailAuthData) => {
    const { email, password } = authData;

    // Check if user already exists
    const existingUser = await db.select().from(UserTable).where(eq(UserTable.email, email)).limit(1);

    if (existingUser.length > 0) {
      throw new ServiceError("User with this email already exists");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    const userId = `email_${email}`;

    const newUser: TInsertUser = {
      id: userId,
      email,
      passwordHash,
      authProvider: "email",
    };

    const result = await db.insert(UserTable).values(newUser).returning();
    if (result.length !== 1) {
      throw new ServiceError("Failed to create user");
    }

    const user = result[0];
    const token = generateToken(user.id);

    return { user, token };
  },

  /**
   * Signs in an existing user with email and password
   */
  signInWithEmail: async (authData: EmailAuthData) => {
    const { email, password } = authData;

    const users = await db.select().from(UserTable).where(eq(UserTable.email, email)).limit(1);

    if (users.length === 0) {
      throw new ServiceError("Invalid email or password");
    }

    const user = users[0];

    if (!user.passwordHash) {
      throw new ServiceError("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new ServiceError("Invalid email or password");
    }

    const token = generateToken(user.id);

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
   * Verifies a JWT token and returns the user
   */
  verifyTokenAndGetUser: async (token: string): Promise<TSelectUser> => {
    const userId = verifyToken(token);
    const user = await authService.getUserById(userId);

    if (!user) {
      throw new ServiceError("User not found");
    }

    return user;
  },
};
