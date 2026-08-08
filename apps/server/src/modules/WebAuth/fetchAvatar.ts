/**
 * Fetches a Telegram avatar server-side, so the browser never has to.
 *
 * Telegram serves userpics from its own CDN (`t.me/i/userpic/…` redirects to
 * `cdn*.telesco.pe`), which plenty of networks can't reach even though Telegram
 * itself works — and a browser request that hangs shows nothing and reports
 * nothing. This machine can reach it: it talks to the Bot API constantly. As a
 * bonus, the reader's IP never reaches Telegram's CDN.
 *
 * Env-free and express-free so it can be tested without either.
 */

/** Long enough for a cold CDN, short enough that a blocked one fails fast. */
const TIMEOUT_MS = 5000;

/** Avatars are a few tens of KB; this is a ceiling, not a target. */
const MAX_BYTES = 1024 * 1024;

export type TFetchedAvatar = {
  body: Buffer;
  contentType: string;
};

export type TFetchAvatarResult =
  | { ok: true; avatar: TFetchedAvatar }
  | { ok: false; reason: "unreachable" | "not_an_image" | "too_large" };

export type TFetchAvatarOptions = {
  /** Injected by tests; defaults to the global `fetch`. */
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  maxBytes?: number;
};

export async function fetchAvatar(url: string, options: TFetchAvatarOptions = {}): Promise<TFetchAvatarResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? MAX_BYTES;

  let response: Response;
  try {
    response = await fetchImpl(url, { redirect: "follow", signal: AbortSignal.timeout(timeoutMs) });
  } catch {
    // Timeout, DNS failure, refused connection — all "we couldn't get it".
    return { ok: false, reason: "unreachable" };
  }

  if (!response.ok) {
    return { ok: false, reason: "unreachable" };
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    return { ok: false, reason: "not_an_image" };
  }

  // Believe a declared length before reading, so an oversized body is refused
  // rather than buffered first and refused after.
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    return { ok: false, reason: "too_large" };
  }

  let body: Buffer;
  try {
    body = Buffer.from(await response.arrayBuffer());
  } catch {
    return { ok: false, reason: "unreachable" };
  }

  if (body.byteLength > maxBytes) {
    return { ok: false, reason: "too_large" };
  }

  return { ok: true, avatar: { body, contentType } };
}
