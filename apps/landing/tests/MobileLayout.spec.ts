import { expect, test, type Page } from "@playwright/test";

/**
 * Layout regression tests for the landing page on mobile devices.
 *
 * The page must never scroll horizontally, no element may stick out past the
 * viewport, and text content must not be clipped by its container.
 */

interface Viewport {
  name: string;
  width: number;
  height: number;
}

const MOBILE_VIEWPORTS: Viewport[] = [
  { name: "small Android (320px)", width: 320, height: 568 },
  { name: "iPhone SE (375px)", width: 375, height: 667 },
  { name: "iPhone 14 (390px)", width: 390, height: 844 },
  { name: "large phone (430px)", width: 430, height: 932 },
  { name: "small tablet (768px)", width: 768, height: 1024 },
];

/** Allow sub-pixel rounding noise from the browser's layout engine. */
const TOLERANCE_PX = 1;

async function openPage(page: Page, viewport: Viewport) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto("/");
  // Web fonts change text metrics; wait for them so overflow checks are real.
  await page.evaluate(() => document.fonts.ready);
}

for (const viewport of MOBILE_VIEWPORTS) {
  test.describe(`${viewport.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await openPage(page, viewport);
    });

    test("page has no horizontal scroll", async ({ page }) => {
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(
        scrollWidth,
        `document is ${scrollWidth}px wide but the viewport is ${clientWidth}px`,
      ).toBeLessThanOrEqual(clientWidth + TOLERANCE_PX);
    });

    test("no element sticks out past the viewport", async ({ page }) => {
      const offenders = await page.evaluate((tolerance) => {
        const viewportWidth = document.documentElement.clientWidth;
        const results: string[] = [];

        const describe = (el: Element) => {
          const id = el.id ? `#${el.id}` : "";
          const cls = typeof el.className === "string" && el.className ? `.${el.className.split(" ")[0]}` : "";
          return `${el.tagName.toLowerCase()}${id}${cls} "${(el.textContent ?? "").trim().slice(0, 40)}"`;
        };

        // An element clipped by an overflow-hidden ancestor cannot cause
        // visible overflow, so skip those (decorative absolutely-positioned
        // waves rely on this).
        const isClipped = (el: Element): boolean => {
          for (let node = el.parentElement; node; node = node.parentElement) {
            const overflow = getComputedStyle(node).overflow;
            if (overflow.includes("hidden") || overflow.includes("clip")) return true;
          }
          return false;
        };

        for (const el of Array.from(document.body.querySelectorAll("*"))) {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) continue;
          const sticksOut = rect.right > viewportWidth + tolerance || rect.left < -tolerance;
          if (sticksOut && !isClipped(el)) results.push(describe(el));
        }
        return results;
      }, TOLERANCE_PX);

      expect(offenders, `elements wider than the viewport:\n${offenders.join("\n")}`).toEqual([]);
    });

    test("text content is not clipped horizontally", async ({ page }) => {
      const clipped = await page.evaluate((tolerance) => {
        const selector = "h1, h2, h3, h4, p, a, li, span";
        const results: string[] = [];
        for (const el of Array.from(document.querySelectorAll(selector))) {
          const style = getComputedStyle(el);
          // Ellipsis truncation (mood-history notes) is intentional.
          if (style.textOverflow === "ellipsis") continue;
          if (el.scrollWidth > el.clientWidth + tolerance && style.overflowX !== "visible") {
            results.push(
              `${el.tagName.toLowerCase()} "${(el.textContent ?? "").trim().slice(0, 40)}" ` +
                `(content ${el.scrollWidth}px in ${el.clientWidth}px box)`,
            );
          }
        }
        return results;
      }, TOLERANCE_PX);

      expect(clipped, `text clipped by its container:\n${clipped.join("\n")}`).toEqual([]);
    });

    test("key content is visible", async ({ page }) => {
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByRole("heading", { name: "How it works" })).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /your check-ins are private/i }),
      ).toBeVisible();

      // The header CTA must be reachable and fully inside the viewport.
      const headerCta = page.locator("header").first().getByRole("link", { name: /telegram/i });
      await expect(headerCta).toBeVisible();
      const box = await headerCta.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + TOLERANCE_PX);
    });
  });
}

test("desktop (1280px) has no horizontal scroll", async ({ page }) => {
  await openPage(page, { name: "desktop", width: 1280, height: 800 });
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + TOLERANCE_PX);
});
