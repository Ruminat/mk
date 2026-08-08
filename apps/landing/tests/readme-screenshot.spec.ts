import { expect, test } from "@playwright/test";
import path from "node:path";

/**
 * Generates the polished hero screenshot embedded in the README.
 *
 * The landing page is rendered inside an inline mock macOS browser window
 * (traffic-light dots + a URL bar) so the README image reads as a real
 * product shot rather than a bare page capture. Refresh it with:
 *
 *   pnpm --filter mooduck-landing run screenshot
 *
 * NOTE: no `import.meta` here — Playwright's loader can reject it, so paths
 * are resolved from `process.cwd()` (the `apps/landing` app directory).
 */

// A fixed, high-DPI viewport keeps the captured window a stable size across
// machines and gives a crisp 2× image.
test.use({ viewport: { width: 1360, height: 1000 }, deviceScaleFactor: 2 });

// The domain shown in the mock URL bar (see nginx/landing.config).
const SITE_DOMAIN = "mooduck.shrek-labs.dev";

// Wide enough to trigger the desktop two-column hero layout.
const FRAME_WIDTH = 1200;
const FRAME_HEIGHT = 660;

test("generate README hero screenshot", async ({ page, baseURL }) => {
  // The README screenshot stays English; the landing lives at /en now.
  const appUrl = new URL("/en", baseURL).href;
  const outputPath = path.resolve(process.cwd(), "docs/screenshot.png");

  await page.setContent(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html, body {
            height: 100%;
            background: #000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }
          .window {
            width: ${FRAME_WIDTH + 2}px;
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 14px;
            overflow: hidden;
            background: #fff;
            box-shadow: 0 40px 120px -20px rgba(0, 0, 0, 0.65);
          }
          .titlebar {
            position: relative;
            display: flex;
            align-items: center;
            height: 44px;
            padding: 0 16px;
            background: #f6f6f7;
            border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          }
          .dots { display: flex; gap: 8px; }
          .dot { width: 12px; height: 12px; border-radius: 50%; }
          .urlbar {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            align-items: center;
            gap: 7px;
            height: 26px;
            padding: 0 16px;
            min-width: 320px;
            border-radius: 13px;
            background: #ececed;
            color: #5f6368;
            font-size: 13px;
          }
          .urlbar svg { display: block; opacity: 0.7; }
          iframe {
            display: block;
            width: ${FRAME_WIDTH}px;
            height: ${FRAME_HEIGHT}px;
            border: 0;
          }
        </style>
      </head>
      <body>
        <div class="window">
          <div class="titlebar">
            <div class="dots">
              <span class="dot" style="background:#ff5f57"></span>
              <span class="dot" style="background:#febc2e"></span>
              <span class="dot" style="background:#28c840"></span>
            </div>
            <div class="urlbar">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              ${SITE_DOMAIN}
            </div>
          </div>
          <iframe src="${appUrl}"></iframe>
        </div>
      </body>
    </html>
  `);

  // Wait for the real app to render *inside* the iframe.
  const app = page.frameLocator("iframe");
  await expect(app.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    app.getByRole("img", { name: /scholarly duck holding a journal/i }),
  ).toBeVisible();

  // Hide the Next.js dev-tools indicator so the shot reads as production.
  const frame = await (await page.waitForSelector("iframe")).contentFrame();
  await frame?.addStyleTag({
    content:
      "nextjs-portal, [data-nextjs-dev-tools-button] { display: none !important; }",
  });

  // Let entrance animations and web fonts settle before capturing.
  await page.waitForTimeout(1500);

  await page.locator(".window").screenshot({ path: outputPath });
});
