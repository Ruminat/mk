import type { Request, Response } from "express";
import type { TSessionUser } from "@mooduck/contracts";
import { getTelegramUserIdSecureHash } from "../../common/telegram/telegramUserId";
import { sendApiError } from "../WebApi/apiError";
import { fetchAvatar } from "./fetchAvatar";
import type { AuthenticatedWebRequest } from "./requireSession";
import { fetchTelegramAvatar } from "./telegramAvatar";
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

    /**
     * Serves the session's Telegram avatar from our own origin.
     *
     * The URL itself never leaves the server, so `img-src 'self'` is enough, the
     * browser never contacts Telegram's CDN (which some networks block, and
     * which would otherwise see the reader's IP on every page load), and a
     * failure is an immediate error the `<img>` can react to rather than a
     * request that hangs.
     */
    getAvatar: async (req: Request, res: Response): Promise<void> => {
      const { session } = req as AuthenticatedWebRequest;
      if (!session.photo) {
        sendAvatarError(res, 404, "No avatar for this session");
        return;
      }

      // Bot API first: `api.telegram.org` is a host this process is already
      // known to reach, whereas the CDN the login payload points at is only a
      // hope. The CDN is still worth a try if the API has nothing for us.
      const viaApi = await fetchTelegramAvatar(session.tgId, config.botToken);
      const result = viaApi.ok ? viaApi : await fetchAvatar(session.photo);
      if (!result.ok) {
        sendAvatarError(res, 502, `Could not fetch the avatar (${result.reason})`);
        return;
      }

      res.setHeader("Content-Type", result.avatar.contentType);
      // `private`: this is one person's picture behind their session cookie, so
      // it must never land in a shared cache.
      res.setHeader("Cache-Control", "private, max-age=86400");
      res.status(200).send(result.avatar.body);
    },

    logout: (_req: Request, res: Response): void => {
      res.setHeader("Set-Cookie", serializeClearedSessionCookie(config.secureCookies));
      res.status(204).end();
    },
  };
}

/**
 * A failed avatar must not be remembered: the CDN being unreachable now says
 * nothing about the next page load, and a cached 502 would keep the initials up
 * long after the network recovered.
 */
function sendAvatarError(res: Response, status: number, message: string): void {
  res.setHeader("Cache-Control", "no-store");
  sendApiError(res, status, "internal", message);
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

/** The client is told whether there's a picture, never where it lives. */
function toSessionUser(payload: TSessionPayload): TSessionUser {
  return { name: payload.name, hasPhoto: payload.photo !== undefined };
}
