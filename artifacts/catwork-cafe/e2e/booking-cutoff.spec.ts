import { test, expect } from "@playwright/test";

const BOOKING_TIME_SLOT = "13:00 – 14:00";

function getJstDateString(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

test.describe("booking advance notice", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("catwork_lang", "en");
      sessionStorage.setItem("cwc_skip_google_gate", "1");
    });
    await page.goto("/visit");
    await page.waitForLoadState("networkidle");
  });

  test("shows the advance-booking notice and disables today", async ({ page }) => {
    await expect(page.getByTestId("advance-booking-notice")).toHaveText(
      "Please book at least one day in advance. Same-day bookings are not available.",
    );

    const today = getJstDateString();
    await expect(page.getByRole("button", { name: today, exact: true })).toBeDisabled();
  });

  test("allows a future date while keeping same-day dates unavailable", async ({ page }) => {
    const tomorrow = await page.evaluate(() => {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const parts = formatter.formatToParts(new Date());
      const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
      const date = new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day) + 1));
      return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
    });

    const enabledFutureDate = await page.locator("button[aria-label^='20']").evaluateAll(
      (buttons, minimumDate) =>
        buttons
          .filter((button) => !button.hasAttribute("disabled"))
          .map((button) => button.getAttribute("aria-label") ?? "")
          .filter((date) => date >= minimumDate)
          .sort()[0],
      tomorrow,
    );

    expect(enabledFutureDate).toBeTruthy();
    await page.getByRole("button", { name: enabledFutureDate!, exact: true }).click();
    await expect(page.getByRole("button", { name: enabledFutureDate!, exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await expect(page.locator("#timeSlot")).toBeVisible();
    await expect(
      page.locator("#timeSlot option").filter({ hasText: BOOKING_TIME_SLOT }),
    ).toHaveCount(1);
  });

  test("rejects a same-day booking through the API", async ({ page }) => {
    const response = await page.request.post("http://localhost:8080/api/bookings", {
      data: {
        name: "E2E cutoff rejection",
        email: "e2e-cutoff@example.com",
        date: getJstDateString(),
        timeSlot: BOOKING_TIME_SLOT,
        partySize: 1,
        notes: "Should be rejected before persistence",
      },
    });

    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({
      code: "BOOKING_TOO_SOON",
      error: "Bookings must be made at least one day in advance",
    });
  });

  for (const [lang, notice] of [
    ["ja", "ご予約は1日前までにお願いいたします。当日のご予約は受け付けておりません。"],
    ["zh", "預約至少需提前一天，恕不接受當日預約。"],
  ] as const) {
    test(`shows the advance notice in ${lang}`, async ({ page }) => {
      await page.goto(`/visit?lang=${lang}`);
      await page.waitForLoadState("networkidle");
      await expect(page.getByTestId("advance-booking-notice")).toHaveText(notice);
    });
  }
});