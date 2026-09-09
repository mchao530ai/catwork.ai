import { test, expect } from "@playwright/test";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

test.describe("Homepage conversion", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE + "/");
  });

  test("has exactly one H1", async ({ page }) => {
    const h1s = page.locator("h1");
    await expect(h1s).toHaveCount(1);
  });

  test("H1 contains expected en copy", async ({ page }) => {
    const h1 = page.locator("h1").first();
    await expect(h1).toContainText("Echigo Yuzawa");
  });

  test("primary CTA links to /visit", async ({ page }) => {
    const primaryCta = page.locator("a[href*='/visit'], a[href='/visit']").first();
    await expect(primaryCta).toBeVisible();
    const href = await primaryCta.getAttribute("href");
    expect(href).toMatch(/\/visit/);
  });

  test("secondary CTA links to Google Maps", async ({ page }) => {
    const directionsCta = page.locator(`a[href*="google.com/maps"]`).first();
    await expect(directionsCta).toBeVisible();
    const href = await directionsCta.getAttribute("href");
    expect(href).toContain("google.com/maps");
  });

  test("no horizontal overflow on desktop (1280x720)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(BASE + "/");
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
  });

  test("no horizontal overflow on mobile (390x844)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE + "/");
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
  });

  test("desktop layout: hero section visible at 1280x720", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(BASE + "/");
    const hero = page.locator("section[aria-label='Hero']");
    await expect(hero).toBeVisible();
  });

  test("mobile layout: hero section visible at 390x844", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE + "/");
    const hero = page.locator("section[aria-label='Hero']");
    await expect(hero).toBeVisible();
  });

  test("language switch to ja changes H1 text", async ({ page }) => {
    const enH1 = await page.locator("h1").first().textContent();

    await page.evaluate(() => {
      localStorage.setItem("catwork_lang", "ja");
    });
    await page.reload();
    await page.waitForTimeout(500);

    const jaH1 = await page.locator("h1").first().textContent();
    expect(jaH1).not.toBe(enH1);
    expect(jaH1).toContain("越後湯沢");
  });

  test("language switch to zh changes H1 text", async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem("catwork_lang", "zh");
    });
    await page.reload();
    await page.waitForTimeout(500);

    const zhH1 = await page.locator("h1").first().textContent();
    expect(zhH1).toContain("越後湯澤");
  });

  test("language switch back to en restores English H1", async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem("catwork_lang", "en");
    });
    await page.reload();
    await page.waitForTimeout(500);

    const h1 = await page.locator("h1").first().textContent();
    expect(h1).toContain("Echigo Yuzawa");
  });

  test("opening status indicator is present in hero", async ({ page }) => {
    const statusIndicator = page.locator("section[aria-label='Hero']").locator("[class*='rounded-full']").first();
    await expect(statusIndicator).toBeVisible();
  });

  test("location label is visible in hero", async ({ page }) => {
    const hero = page.locator("section[aria-label='Hero']");
    await expect(hero).toContainText("Echigo Yuzawa");
  });
});
