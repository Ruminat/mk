import type { Request, Response } from "express";
import type { TSessionUser } from "@mooduck/contracts";
import { getTelegramUserIdSecureHash } from "../../common/telegram/telegramUserId";
import { sendApiError } from "../WebApi/apiError";
import type { AuthenticatedWebRequest } from "./requireSession";
import {
  mintSessionPayload,
  sealSession,
  serializeClearedSessionCookie,
  serializeSessionCookie,
  shouldRenewSession,
  type TSessionPayload,
} from "./session";
import { verifyTelegramLogin } from "./verifyTelegramLogin";

export type TWebAuthConfig = {
  botToken: string;
  sessionSecret: string;
  /** Set the `Secure` cookie flag (off for local http dev, on everywhere else). */
  secureCookies: boolean;
};


/**
 * The only code path that can mint a session: a Telegram Login Widget payload
 * whose HMAC verifies. There is deliberately no other way in — no password, no
 * magic link, no dev bypass route.
 */
export function createWebAuthController(config: TWebAuthConfig) {
  function setSessionCookie(res: Response, payload: TSessionPayload): void {
    res.setHeader("Set-Cookie", serializeSessionCookie(sealSession(payload, config.sessionSecret), config.secureCookies));
  }

  return {
    loginWithTelegram: (req: Request, res: Response): void => {
      const body: unknown = req.body;
      if (typeof body !== "object" || body === null) {
        sendApiError(res, 400, "invalid_input", "Expected a Telegram login payload");
        return;
      }

      const result = verifyTelegramLogin(body as Record<string, unknown>, config.botToken);
      if (!result.ok) {
        sendApiError(res, 401, "unauthorized", "Telegram login could not be verified");
        return;
      }

      logDroppedAvatarHost(body, result.user.photoUrl);

      // Same identity function the bot uses, so the person's web and bot data are
      // one dataset. The numeric id lives only in the sealed cookie from here on.
      const hash = getTelegramUserIdSecureHash(result.user.id);
      const payload = mintSessionPayload(
        {
          tgId: result.user.id,
          hash,
          name: result.user.firstName,
          ...(result.user.photoUrl ? { photo: result.user.photoUrl } : {}),
        },
        Date.now(),
      );

      setSessionCookie(res, payload);
      res.status(200).json({ user: toSessionUser(payload) });
    },

    getSession: (req: Request, res: Response): void => {
      const { session } = req as AuthenticatedWebRequest;
      const now = Date.now();

      if (shouldRenewSession(session, now)) {
        setSessionCookie(res, reissue(session, now));
      }

      res.status(200).json({ user: toSessionUser(session) });
    },

    logout: (_req: Request, res: Response): void => {
      res.setHeader("Set-Cookie", serializeClearedSessionCookie(config.secureCookies));
      res.status(204).end();
    },
  };
}

/**
 * Says so when a verified login carried an avatar URL that we then threw away.
 *
 * `ALLOWED_PHOTO_HOSTS` is a list of Telegram's hostnames, and Telegram is free
 * to serve userpics from a name that isn't on it — in which case the avatar
 * silently never appears and looks like a front-end bug. Only the host is
 * logged: it's all that's needed to extend the list, and the rest of the URL is
 * a per-user token that has no business in a log file.
 */
function logDroppedAvatarHost(body: unknown, keptPhotoUrl: string | undefined): void {
  if (keptPhotoUrl !== undefined) {
    return;
  }
  const raw = (body as { photo_url?: unknown }).photo_url;
  if (typeof raw !== "string" || raw.length === 0) {
    return;
  }
  let host: string;
  try {
    host = new URL(raw).host;
  } catch {
    host = "(unparseable)";
  }
  console.log(`⚠️ Dropped a Telegram avatar from an unexpected host: ${host}`);
}

function reissue(session: TSessionPayload, now: number): TSessionPayload {
  return mintSessionPayload(
    {
      tgId: session.tgId,
      hash: session.hash,
      name: session.name,
      ...(session.photo ? { photo: session.photo } : {}),
    },
    now,
  );
}

function toSessionUser(payload: TSessionPayload): TSessionUser {
  return payload.photo ? { name: payload.name, photo: payload.photo } : { name: payload.name };
}
