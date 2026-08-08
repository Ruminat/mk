import { describe, expect, it } from "vitest";
import { fetchTelegramAvatar } from "../telegramAvatar";

const TG_ID = 777000;
const TOKEN = "123456:FAKE";
const BYTES = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);

type TRoute = (url: string) => Response;

/** A stand-in Bot API: routes by the method in the URL, and records every call. */
function botApi(overrides: Partial<Record<"photos" | "file" | "download", Response>> = {}) {
  const calls: string[] = [];
  const route: TRoute = (url) => {
    calls.push(url);
    if (url.includes("getUserProfilePhotos")) {
      return (
        overrides.photos ??
        Response.json({
          ok: true,
          result: {
            photos: [
              [
                { file_id: "small", file_unique_id: "a", width: 80, height: 80 },
                { file_id: "medium", file_unique_id: "b", width: 160, height: 160 },
                { file_id: "large", file_unique_id: "c", width: 640, height: 640 },
              ],
            ],
          },
        })
      );
    }
    if (url.includes("getFile")) {
      return overrides.file ?? Response.json({ ok: true, result: { file_path: "photos/file_1.jpg" } });
    }
    return (
      overrides.download ??
      new Response(new Uint8Array(BYTES), { status: 200, headers: { "content-type": "image/jpeg" } })
    );
  };
  const fetchImpl = (async (url: string) => route(String(url))) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

describe("fetchTelegramAvatar", () => {
  it("should download the newest photo through the Bot API", async () => {
    const { fetchImpl, calls } = botApi();
    const result = await fetchTelegramAvatar(TG_ID, TOKEN, { fetchImpl });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Buffer.compare(result.avatar.body, BYTES)).toBe(0);
      expect(result.avatar.contentType).toBe("image/jpeg");
    }
    expect(calls[0]).toContain(`getUserProfilePhotos?user_id=${TG_ID}`);
    expect(calls[2]).toBe(`https://api.telegram.org/file/bot${TOKEN}/photos/file_1.jpg`);
  });

  it("should ask for the smallest size that still covers the header, not the 640px original", async () => {
    const { fetchImpl, calls } = botApi();
    await fetchTelegramAvatar(TG_ID, TOKEN, { fetchImpl });

    expect(calls[1]).toContain("file_id=medium");
  });

  it("should fall back to the largest size when none reaches the wanted width", async () => {
    const { fetchImpl, calls } = botApi({
      photos: Response.json({
        ok: true,
        result: { photos: [[{ file_id: "tiny", file_unique_id: "a", width: 60, height: 60 }]] },
      }),
    });
    await fetchTelegramAvatar(TG_ID, TOKEN, { fetchImpl });

    expect(calls[1]).toContain("file_id=tiny");
  });

  it("should give up quietly when the bot can't see a photo", async () => {
    const { fetchImpl, calls } = botApi({
      photos: Response.json({ ok: true, result: { photos: [] } }),
    });
    const result = await fetchTelegramAvatar(TG_ID, TOKEN, { fetchImpl });

    expect(result).toEqual({ ok: false, reason: "unreachable" });
    // Stopped at the first call rather than asking for a file that isn't there.
    expect(calls).toHaveLength(1);
  });

  it("should not treat a Bot API error body as a photo", async () => {
    const { fetchImpl } = botApi({
      photos: Response.json({ ok: false, error_code: 400, description: "user not found" }, { status: 400 }),
    });
    const result = await fetchTelegramAvatar(TG_ID, TOKEN, { fetchImpl });

    expect(result).toEqual({ ok: false, reason: "unreachable" });
  });

  it("should survive the network being down", async () => {
    const fetchImpl = (async () => {
      throw new Error("ENOTFOUND");
    }) as unknown as typeof fetch;
    const result = await fetchTelegramAvatar(TG_ID, TOKEN, { fetchImpl });

    expect(result).toEqual({ ok: false, reason: "unreachable" });
  });
});
