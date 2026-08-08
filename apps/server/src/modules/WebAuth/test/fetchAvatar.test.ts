import { describe, expect, it } from "vitest";
import { fetchAvatar } from "../fetchAvatar";

const URL_UNDER_TEST = "https://t.me/i/userpic/320/abc.jpg";

function imageResponse(body: Buffer, headers: Record<string, string> = {}): Response {
  return new Response(new Uint8Array(body), {
    status: 200,
    headers: { "content-type": "image/jpeg", ...headers },
  });
}

const stub = (response: Response | Error): typeof fetch =>
  (async () => {
    if (response instanceof Error) throw response;
    return response;
  }) as unknown as typeof fetch;

describe("fetchAvatar", () => {
  it("should hand back the bytes and the content type", async () => {
    const bytes = Buffer.from([1, 2, 3, 4]);
    const result = await fetchAvatar(URL_UNDER_TEST, { fetchImpl: stub(imageResponse(bytes)) });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.avatar.contentType).toBe("image/jpeg");
      expect(Buffer.compare(result.avatar.body, bytes)).toBe(0);
    }
  });

  it("should report a network failure rather than throwing", async () => {
    // What a blocked CDN looks like: the reason the proxy exists at all.
    const result = await fetchAvatar(URL_UNDER_TEST, { fetchImpl: stub(new Error("timed out")) });
    expect(result).toEqual({ ok: false, reason: "unreachable" });
  });

  it("should treat a non-2xx upstream as unreachable", async () => {
    const result = await fetchAvatar(URL_UNDER_TEST, {
      fetchImpl: stub(new Response("nope", { status: 404 })),
    });
    expect(result).toEqual({ ok: false, reason: "unreachable" });
  });

  it("should refuse anything that isn't an image", async () => {
    // Telegram serving an HTML error page must not be relayed as a picture.
    const result = await fetchAvatar(URL_UNDER_TEST, {
      fetchImpl: stub(new Response("<html>", { status: 200, headers: { "content-type": "text/html" } })),
    });
    expect(result).toEqual({ ok: false, reason: "not_an_image" });
  });

  it("should refuse an oversized body on its declared length, before reading it", async () => {
    const result = await fetchAvatar(URL_UNDER_TEST, {
      fetchImpl: stub(imageResponse(Buffer.from([1]), { "content-length": "999999999" })),
      maxBytes: 1024,
    });
    expect(result).toEqual({ ok: false, reason: "too_large" });
  });

  it("should refuse an oversized body that didn't declare its length", async () => {
    const result = await fetchAvatar(URL_UNDER_TEST, {
      fetchImpl: stub(imageResponse(Buffer.alloc(2048))),
      maxBytes: 1024,
    });
    expect(result).toEqual({ ok: false, reason: "too_large" });
  });
});
