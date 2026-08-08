import { z } from "zod";
import { fetchAvatar, type TFetchAvatarOptions, type TFetchAvatarResult } from "./fetchAvatar";

/**
 * Fetches a user's avatar through the Bot API rather than off Telegram's CDN.
 *
 * The URL the Login Widget hands back points at `cdn*.telesco.pe`, and there is
 * no promise that a given network can reach it — that's exactly the failure this
 * whole path exists to route around. `api.telegram.org` is the one Telegram host
 * this server is already known to reach: the bot would not be running otherwise.
 *
 * The download URL embeds the bot token, which is why this is server-only and
 * the bytes are relayed rather than the link.
 */

const API_ROOT = "https://api.telegram.org";

/** The header draws the avatar at 40px, so 160 covers 2x and then some. */
const WANTED_WIDTH = 160;

const PhotoSizeSchema = z.object({
  file_id: z.string().min(1),
  width: z.number().int().positive(),
});

const ProfilePhotosSchema = z.object({
  ok: z.literal(true),
  result: z.object({
    photos: z.array(z.array(PhotoSizeSchema)),
  }),
});

const FileSchema = z.object({
  ok: z.literal(true),
  result: z.object({
    file_path: z.string().min(1),
  }),
});

export async function fetchTelegramAvatar(
  telegramId: number,
  botToken: string,
  options: TFetchAvatarOptions = {},
): Promise<TFetchAvatarResult> {
  const fileId = await newestPhotoFileId(telegramId, botToken, options);
  if (fileId === null) {
    return { ok: false, reason: "unreachable" };
  }

  const filePath = await resolveFilePath(fileId, botToken, options);
  if (filePath === null) {
    return { ok: false, reason: "unreachable" };
  }

  return fetchAvatar(`${API_ROOT}/file/bot${botToken}/${filePath}`, options);
}

/** The `file_id` of the newest profile photo, at the smallest usable size. */
async function newestPhotoFileId(
  telegramId: number,
  botToken: string,
  options: TFetchAvatarOptions,
): Promise<string | null> {
  const parsed = await callApi(
    `${API_ROOT}/bot${botToken}/getUserProfilePhotos?user_id=${telegramId}&limit=1`,
    ProfilePhotosSchema,
    options,
  );
  const sizes = parsed?.result.photos[0];
  if (!sizes || sizes.length === 0) {
    // No photo, or none this bot is allowed to see — not an error, just nothing.
    return null;
  }

  // Sizes come ascending; take the first one big enough, else the biggest there
  // is. Downloading the 640px original to draw it at 40px would be silly.
  const ordered = [...sizes].sort((a, b) => a.width - b.width);
  const chosen = ordered.find((size) => size.width >= WANTED_WIDTH) ?? ordered[ordered.length - 1];
  return chosen?.file_id ?? null;
}

async function resolveFilePath(
  fileId: string,
  botToken: string,
  options: TFetchAvatarOptions,
): Promise<string | null> {
  const parsed = await callApi(
    `${API_ROOT}/bot${botToken}/getFile?file_id=${encodeURIComponent(fileId)}`,
    FileSchema,
    options,
  );
  return parsed?.result.file_path ?? null;
}

/** One Bot API call; any failure at all collapses to null for the caller. */
async function callApi<T>(
  url: string,
  schema: z.ZodType<T>,
  options: TFetchAvatarOptions,
): Promise<T | null> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 5000;

  try {
    const response = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!response.ok) {
      return null;
    }
    const parsed = schema.safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
