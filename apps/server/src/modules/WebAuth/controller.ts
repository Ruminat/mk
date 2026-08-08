import type { Request, Response } from "express";
import { LOGIN_STATE_COOKIE_NAME, LOGIN_STATE_PARAM, type TSessionUser } from "@mooduck/contracts";
import { getTelegramUserIdSecureHash } from "../../common/telegram/telegramUserId";
import { sendApiError } from "../WebApi/apiError";
import { readCookie } from "./cookies";
import { loginStateMatches, serializeClearedLoginStateCookie } from "./loginState";
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
 * Where the callback drops the browser afterwards. Relative on purpose: it
 * resolves against whatever origin served the request, so dev (Vite at
 * `/app/`) and production (nginx at `/app/`) need no configuration, and there
 * is no way for a request to influence the target.
 */
const APP_PATH = "/app/";
const APP_PATH_LOGIN_FAILED = "/app/?login=failed";

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

    /**
     * The browser flow. The Login Widget navigates here with the signed fields in
     * the query string, which avoids `data-onauth` — telegram-widget.js parses
     * that attribute with `eval`, so using it would force `'unsafe-eval'` into
     * the app's CSP for the sake of one attribute.
     *
     * Being a GET that mints a session, it needs the one-shot nonce as well as
     * the HMAC; see `./loginState`. Failures redirect rather than return JSON,
     * because the user is looking at a navigating browser tab, not a fetch.
     */
    loginWithTelegramCallback: (req: Request, res: Response): void => {
      const query = req.query as Record<string, unknown>;
      const cleared = serializeClearedLoginStateCookie(config.secureCookies);

      // The nonce is single-use: burn it on every outcome, so a failed or
      // replayed callback can't be retried against the same cookie.
      const fail = (): void => {
        res.setHeader("Set-Cookie", cleared);
        res.redirect(302, APP_PATH_LOGIN_FAILED);
      };

      if (!loginStateMatches(query[LOGIN_STATE_PARAM], readCookie(req.headers.cookie, LOGIN_STATE_COOKIE_NAME))) {
        fail();
        return;
      }

      // `state` is ours, not Telegram's — it was never part of what they signed,
      // so it must not be part of the data-check-string either.
      const { [LOGIN_STATE_PARAM]: _state, ...signed } = query;

      const result = verifyTelegramLogin(signed, config.botToken);
      if (!result.ok) {
        fail();
        return;
      }

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

      res.setHeader("Set-Cookie", [
        serializeSessionCookie(sealSession(payload, config.sessionSecret), config.secureCookies),
        cleared,
      ]);
      res.redirect(302, APP_PATH);
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
