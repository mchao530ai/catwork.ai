import { test, expect, type Page } from "@playwright/test";

const BASE = "";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function setLang(page: Page, lang: "en" | "ja" | "zh") {
  await page.evaluate((l) => {
    localStorage.setItem("catwork_lang", l);
  }, lang);
}

async function getLang(page: Page): Promise<string> {
  return page.evaluate(() => localStorage.getItem("catwork_lang") ?? "");
}

async function getHtmlLang(page: Page): Promise<string> {
  return page.evaluate(() => document.documentElement.getAttribute("lang") ?? "");
}

// ── Route loading ─────────────────────────────────────────────────────────────

const PUBLIC_ROUTES = [
  { path: "/", name: "home" },
  { path: "/visit", name: "visit" },
  { path: "/pricing", name: "pricing" },
  { path: "/cats", name: "cats" },
  { path: "/access", name: "access" },
  { path: "/faq", name: "faq" },
  { path: "/contact", name: "contact" },
  { path: "/reels", name: "reels" },
  { path: "/facilities", name: "facilities" },
];

for (const route of PUBLIC_ROUTES) {
  test(`route: ${route.name} (${route.path}) loads without error`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto(BASE + route.path);
    await page.waitForLoadState("networkidle");
    expect(errors, `console errors on ${route.path}`).toHaveLength(0);
    await expect(page.locator("body")).not.toBeEmpty();
  });
}

// ── Direct URL loading (fresh navigation) ────────────────────────────────────

test("direct URL: /pricing loads without blank screen", async ({ page }) => {
  await page.goto(BASE + "/pricing");
  await page.waitForLoadState("domcontentloaded");
  const body = await page.locator("body").textContent();
  expect(body?.length).toBeGreaterThan(10);
});

test("direct URL: /cats loads without blank screen", async ({ page }) => {
  await page.goto(BASE + "/cats");
  await page.waitForLoadState("domcontentloaded");
  const body = await page.locator("body").textContent();
  expect(body?.length).toBeGreaterThan(10);
});

// ── 404 page ─────────────────────────────────────────────────────────────────

test("404: unknown route renders not-found page", async ({ page }) => {
  await page.goto(BASE + "/this-page-does-not-exist");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("body")).not.toBeEmpty();
  const body = await page.locator("body").textContent();
  expect(body).toContain("404");
});

test("404: rendered text matches active language (en)", async ({ page }) => {
  await page.goto(BASE + "/");
  await setLang(page, "en");
  await page.goto(BASE + "/nonexistent-page");
  await page.waitForLoadState("networkidle");
  const body = await page.locator("body").textContent();
  expect(body).toContain("Page Not Found");
});

test("404: rendered text matches active language (ja)", async ({ page }) => {
  await page.goto(BASE + "/");
  await setLang(page, "ja");
  await page.reload();
  await page.goto(BASE + "/nonexistent-page");
  await page.waitForLoadState("networkidle");
  const body = await page.locator("body").textContent();
  expect(body).toContain("ページが見つかりません");
});

test("404: rendered text matches active language (zh)", async ({ page }) => {
  await page.goto(BASE + "/");
  await setLang(page, "zh");
  await page.reload();
  await page.goto(BASE + "/nonexistent-page");
  await page.waitForLoadState("networkidle");
  const body = await page.locator("body").textContent();
  expect(body).toContain("找不到此頁面");
});

test("404: return home link navigates to /", async ({ page }) => {
  await page.goto(BASE + "/unknown-route");
  await page.waitForLoadState("networkidle");
  const returnLink = page.locator("a").filter({ hasText: /return home|ホームに戻る|返回首頁/i }).first();
  await expect(returnLink).toBeVisible();
  await returnLink.click();
  await page.waitForLoadState("networkidle");
  expect(page.url()).toMatch(/\/$/);
});

// ── Desktop header navigation ─────────────────────────────────────────────────

test("desktop header: logo navigates to /", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(BASE + "/pricing");
  await page.waitForLoadState("networkidle");
  const logo = page.locator("nav a[aria-label]").first();
  await logo.click();
  await page.waitForLoadState("networkidle");
  expect(page.url()).toMatch(/\/$/);
});

test("desktop header: visit link navigates to /visit", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(BASE + "/");
  await page.waitForLoadState("networkidle");
  const link = page.locator("nav a[href='/visit']").first();
  await expect(link).toBeVisible();
  await link.click();
  await page.waitForLoadState("networkidle");
  expect(page.url()).toContain("/visit");
});

test("desktop header: pricing link navigates to /pricing", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(BASE + "/");
  await page.waitForLoadState("networkidle");
  const link = page.locator("nav a[href='/pricing']").first();
  await expect(link).toBeVisible();
  await link.click();
  await page.waitForLoadState("networkidle");
  expect(page.url()).toContain("/pricing");
});

// ── Mobile menu ───────────────────────────────────────────────────────────────

test("mobile menu: opens and closes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE + "/");
  await page.waitForLoadState("networkidle");

  const hamburger = page.locator("button[aria-label]").filter({ hasText: "" }).first();
  const openBtn = page.locator("nav button").last();
  await openBtn.click();

  const overlay = page.locator(".fixed.inset-0").first();
  await expect(overlay).toBeVisible();

  const closeBtn = page.locator("button[aria-label*='lose']").first();
  await closeBtn.click();
  await expect(overlay).not.toBeVisible();
});

test("mobile menu: tapping a link closes the menu", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE + "/");
  await page.waitForLoadState("networkidle");

  const openBtn = page.locator("nav button").last();
  await openBtn.click();

  const overlay = page.locator(".fixed.inset-0").first();
  await expect(overlay).toBeVisible();

  await page.locator(".fixed.inset-0 a[href='/pricing']").click();
  await page.waitForLoadState("networkidle");
  await expect(overlay).not.toBeVisible();
  expect(page.url()).toContain("/pricing");
});

// ── Footer links ──────────────────────────────────────────────────────────────

test("footer: home link navigates to /", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(BASE + "/pricing");
  await page.waitForLoadState("networkidle");
  const footerHomeLink = page.locator("footer a[href='/']").first();
  await expect(footerHomeLink).toBeVisible();
  await footerHomeLink.click();
  await page.waitForLoadState("networkidle");
  expect(page.url()).toMatch(/\/$/);
});

test("footer: external instagram link has https and rel=noopener", async ({ page }) => {
  await page.goto(BASE + "/");
  await page.waitForLoadState("networkidle");
  const instaLinks = page.locator("footer a[target='_blank']");
  const count = await instaLinks.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const href = await instaLinks.nth(i).getAttribute("href");
    const rel = await instaLinks.nth(i).getAttribute("rel");
    expect(href).toMatch(/^https:\/\//);
    expect(rel).toContain("noopener");
  }
});

// ── Language switcher ─────────────────────────────────────────────────────────

test("language switcher: switches to Japanese and html[lang] updates", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(BASE + "/");
  await page.waitForLoadState("networkidle");

  await page.locator("button[aria-label='Select language']").click();
  await page.locator("text=日本語").click();
  await page.waitForTimeout(300);

  const htmlLang = await getHtmlLang(page);
  expect(htmlLang).toBe("ja");

  const stored = await getLang(page);
  expect(stored).toBe("ja");
});

test("language switcher: switches to Chinese and html[lang] updates", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(BASE + "/");
  await page.waitForLoadState("networkidle");

  await page.locator("button[aria-label='Select language']").click();
  await page.locator("text=繁體中文").click();
  await page.waitForTimeout(300);

  const htmlLang = await getHtmlLang(page);
  expect(htmlLang).toBe("zh");

  const stored = await getLang(page);
  expect(stored).toBe("zh");
});

test("language switcher: switches back to English", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(BASE + "/");
  await setLang(page, "ja");
  await page.reload();
  await page.waitForLoadState("networkidle");

  await page.locator("button[aria-label='Select language']").click();
  await page.locator("text=English").click();
  await page.waitForTimeout(300);

  const stored = await getLang(page);
  expect(stored).toBe("en");
});

// ── Language persistence ──────────────────────────────────────────────────────

test("language persistence: refresh preserves selected language", async ({ page }) => {
  await page.goto(BASE + "/");
  await setLang(page, "ja");
  await page.reload();
  await page.waitForLoadState("networkidle");

  const htmlLang = await getHtmlLang(page);
  expect(htmlLang).toBe("ja");
});

test("language persistence: direct URL open restores saved language", async ({ page }) => {
  await page.goto(BASE + "/");
  await setLang(page, "zh");
  await page.goto(BASE + "/pricing");
  await page.waitForLoadState("networkidle");

  const htmlLang = await getHtmlLang(page);
  expect(htmlLang).toBe("zh");
});

// ── Browser back / forward ────────────────────────────────────────────────────

test("browser back/forward: navigating between pages works correctly", async ({ page }) => {
  await page.goto(BASE + "/");
  await page.waitForLoadState("networkidle");
  await page.goto(BASE + "/pricing");
  await page.waitForLoadState("networkidle");
  await page.goto(BASE + "/cats");
  await page.waitForLoadState("networkidle");

  await page.goBack();
  await page.waitForLoadState("networkidle");
  expect(page.url()).toContain("/pricing");

  await page.goForward();
  await page.waitForLoadState("networkidle");
  expect(page.url()).toContain("/cats");

  await page.goBack();
  await page.goBack();
  await page.waitForLoadState("networkidle");
  expect(page.url()).toMatch(/\/$/);
});

// ── Primary CTAs ──────────────────────────────────────────────────────────────

test("home hero CTA: 'Book a Visit' navigates to /visit", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(BASE + "/");
  await page.waitForLoadState("networkidle");
  const cta = page.locator("a[href='/visit']").first();
  await expect(cta).toBeVisible();
  await cta.click();
  await page.waitForLoadState("networkidle");
  expect(page.url()).toContain("/visit");
});

test("home CTA: 'See Pricing' navigates to /pricing", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(BASE + "/");
  await page.waitForLoadState("networkidle");
  const cta = page.locator("a[href='/pricing']").first();
  await expect(cta).toBeVisible();
  await cta.click();
  await page.waitForLoadState("networkidle");
  expect(page.url()).toContain("/pricing");
});

test("cats page CTA: 'Plan Your Visit' navigates to /visit", async ({ page }) => {
  await page.goto(BASE + "/cats");
  await page.waitForLoadState("networkidle");
  const cta = page.locator("a[href='/visit']").first();
  await expect(cta).toBeVisible();
  await cta.click();
  await page.waitForLoadState("networkidle");
  expect(page.url()).toContain("/visit");
});

test("pricing page CTA: 'Book a Visit' navigates to /visit", async ({ page }) => {
  await page.goto(BASE + "/pricing");
  await page.waitForLoadState("networkidle");
  const cta = page.locator("a[href='/visit']").first();
  await expect(cta).toBeVisible();
  await cta.click();
  await page.waitForLoadState("networkidle");
  expect(page.url()).toContain("/visit");
});

test("Japanese booking: submits the selected language and shows Japanese success copy", async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("cwc_skip_google_gate", "1");
  });

  let bookingPayload: Record<string, unknown> | undefined;
  await page.route("**/api/bookings", async (route) => {
    if (route.request().method() === "POST") {
      bookingPayload = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ success: true, id: 1 }),
      });
      return;
    }
    await route.continue();
  });

  await page.goto(BASE + "/visit?lang=ja");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await page.locator("#name").fill("Aiko Tanaka");
  await page.locator("#email").fill("guest@example.com");
  await page.locator('button[aria-label^="20"]:not([disabled])').first().click();
  await page.locator("#timeSlot").selectOption({ index: 1 });
  await page.getByRole("button", { name: "予約リクエストを送信" }).click();

  await expect.poll(() => bookingPayload).toMatchObject({ language: "ja" });
  await expect(page.locator("body")).toContainText("ありがとうございます");
  await expect(page.locator("body")).toContainText("24時間以内にメールにて確認いたします");
});

// ── External link validation ──────────────────────────────────────────────────

test("external links: all start with https and have rel containing noopener", async ({ page }) => {
  for (const route of PUBLIC_ROUTES) {
    await page.goto(BASE + route.path);
    await page.waitForLoadState("networkidle");

    const externalLinks = page.locator("a[target='_blank']");
    const count = await externalLinks.count();

    for (let i = 0; i < count; i++) {
      const href = await externalLinks.nth(i).getAttribute("href");
      const rel = await externalLinks.nth(i).getAttribute("rel");
      expect(href, `link on ${route.path} should start with https`).toMatch(/^https:\/\//);
      expect(rel, `link on ${route.path} should have noopener`).toContain("noopener");
    }
  }
});
