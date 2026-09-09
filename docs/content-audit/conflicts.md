# Content Audit — Conflicts

Produced before any source file changes. Lists every factual discrepancy found across
`siteConfig.ts`, `pricing.ts`, `faqs.ts`, and the i18n locale files.

---

## Conflict 1 — Opening days

| Source | Value |
|--------|-------|
| `siteConfig.ts` `hours.days` | "Tuesday, Wednesday, Friday, Saturday & Sunday" |
| `siteConfig.ts` `hours.closedDays` | "Monday & Thursday" |
| `siteConfig.ts` `hours.display` | "Tue, Wed, Fri–Sun · 11:00–18:00" |
| `pricing.ts` `PRICING_NOTE` | "Open weekends only — Saturday & Sunday, 11:00 AM to 6:00 PM" |
| `faqs.ts` FAQ-15 answer | "We are open every Saturday and Sunday from 11:00 AM to 6:00 PM" |
| `en.ts` `home.cta.openHours` | "Open Tue, Wed & Fri–Sun · 11:00–18:00 · Echigo Yuzawa" |
| `en.ts` `cats.cta.hours` | "Open Tue, Wed, Fri, Sat & Sun · 11:00–18:00" |
| `en.ts` `footer.tagline` | "Open Tue, Wed & Fri–Sun." |
| `ja.ts` `home.cta.openHours` | "火・水・金・土・日営業 · 11:00〜18:00" |
| `zh.ts` `home.cta.openHours` | "週二、三、五至日營業 · 11:00–18:00" |

**Chosen source of truth:** `siteConfig.ts` — five open days (Tue, Wed, Fri, Sat, Sun).
The `pricing.ts` PRICING_NOTE and `faqs.ts` FAQ-15 were stale/incorrect.

**Note:** Neither `pricing.ts`'s PRICING_NOTE nor `faqs.ts`'s static FAQ answers are
rendered at runtime. Pricing.tsx falls back to `t("pricing.note")` (i18n, correct).
FAQ.tsx reads from `t("faq.items")` (i18n, correct with `{{days}}` template).

---

## Conflict 2 — Weekday vs. weekend pricing

| Source | Value |
|--------|-------|
| `pricing.ts` `PRICING_PLANS` (id: "single") | ¥1,500 per person · per hour (no weekday/weekend split) |
| `pricing.ts` `PRICING_PLANS` (id: "work-session") | ¥3,000 per person · 3 hours |
| `pricing.ts` `PRICING_PLANS` (id: "daypass") | ¥4,500 per person · full day |
| `faqs.ts` FAQ-16 answer | "approximately ¥1,500 per person per hour" (no split) |
| `en.ts` `faq.items[14].answer` | Weekday (Tue/Wed/Fri): ¥1,200/hr, ¥2,500/3hrs; Weekend (Sat/Sun): ¥1,500/hr, ¥3,000/3hrs |
| `ja.ts` `faq.items[14].answer` | Same weekday/weekend split |
| `zh.ts` `faq.items[14].answer` | Same weekday/weekend split |
| `en.ts` `pricing.header.desc` | "Low season rates — after Golden Week through mid-December. Weekday/weekend pricing applies." |

**Conflict:** `pricing.ts` plans present a single flat rate; the i18n FAQ descriptions
state distinct weekday and weekend tiers.

**Resolution:** Flagged in `needs-owner-review.md`. The displayed pricing cards come from
the API (`useListPricingPlans()`). The i18n FAQ text is visible to users and reflects
the tiered model. The PRICING_PLANS static fallback is kept as-is; the owner should
confirm which is authoritative and update the admin pricing configuration.

---

## Conflict 3 — PRICING_NOTE origin

| Source | Value |
|--------|-------|
| `siteConfig.ts` `pricingNote` | `""` (empty — intentional fallback) |
| `pricing.ts` `PRICING_NOTE` (exported) | "Open weekends only — Saturday & Sunday, 11:00 AM to 6:00 PM. Walk-ins welcome for single entry. No reservations required." |

**Chosen source of truth:** `siteConfig.ts` empty value (causes i18n fallback), because
`pricing.ts` PRICING_NOTE is not imported anywhere and its "weekends only" text conflicts
with the authoritative 5-day schedule. Resolved by removing the stale export.

---

## Conflict 4 — Wi-Fi speed display location

| Source | Value |
|--------|-------|
| `siteConfig.ts` `wifiSpeed` | "200 Mbps" |
| `en.ts` `home.whyWork.wifi.statLabel` | "verified download speed" (label only, no number) |

**No conflict** — the speed value is in `siteConfig.ts`; the i18n file holds only the
label. These are complementary, not conflicting. Speed number is injected at render time.

---

## Summary table

| # | Field | Conflict | Resolution |
|---|-------|----------|------------|
| 1 | Opening days | pricing.ts + faqs.ts say weekends only | siteConfig.ts (5 days) wins |
| 2 | Pricing tiers | pricing.ts flat vs i18n FAQ tiered | Owner review required |
| 3 | PRICING_NOTE | pricing.ts stale export | Removed (not rendered) |
| 4 | Wi-Fi speed | none | No action needed |
