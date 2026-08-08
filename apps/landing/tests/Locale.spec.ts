import { expect, test } from "@playwright/test";

/**
 * Both locales render as their own static page with the right `<html lang>` and
 * a headline in that language. `/` itself is an nginx `Accept-Language` redirect
 * (see nginx/landing.config), not a Next route, so it isn't exercised here.
 */

test("English landing renders at /en with lang=en", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("listen to yourself");
});

test("Russian landing renders at /ru with lang=ru and translated copy", async ({ page }) => {
  await page.goto("/ru");
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("услышать себя");
});
