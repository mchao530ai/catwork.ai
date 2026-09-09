# Needs Owner Review

These fields could not be resolved without owner input. No visible content has been
changed for any item in this list.

---

## 1 — Weekday vs. weekend pricing tiers

**Question:** Are there separate weekday and weekend entry prices, or a single flat rate?

**What we found:**
- The static pricing card fallback (`pricing.ts` PRICING_PLANS) shows a single
  "Single Entry" rate of ¥1,500/hr with no weekday/weekend distinction.
- The FAQ answer in all three languages (en, ja, zh) explicitly states two tiers:
  - Weekday (Tue, Wed, Fri): ¥1,200 for the first hour · ¥2,500 for 3 hours
  - Weekend (Sat, Sun): ¥1,500 for the first hour · ¥3,000 for 3 hours
- The Pricing page header description (all three languages) also references
  low-season rates and a one-drink-order requirement.

**Action required:** Confirm which pricing structure is correct. Then either:
  - Update the PRICING_PLANS fallback data in `pricing.ts` to reflect the real tiers, or
  - Update the FAQ i18n answers to match the single flat-rate model.

---

## 2 — Last admission time

**Question:** Is there a last-admission cutoff earlier than the 18:00 close?

**What we found:** The opening hours are consistently listed as 11:00–18:00 across all
sources. No last-admission time was found anywhere in the codebase. Cat cafés in Japan
commonly enforce a last-admission cutoff (e.g. 17:30) to allow sufficient time before
close.

**Action required:** If a last-admission cutoff exists, add it to `businessConfig.ts`
under `hours.lastAdmission` and surface it on the Visit and Access pages.

---

## 3 — Age limit / minimum age policy

**Question:** Is there a minimum age for entry?

**What we found:** No minimum age policy was found anywhere in the codebase. The FAQ
states "Children are welcome" but gives no age limit. Many cat cafés have a minimum age
(e.g. under-4 not admitted). If a limit exists, it should appear in the FAQ rules section.

**Action required:** Confirm whether a minimum age limit applies and, if so, add it to the
FAQ rules and the businessConfig.

---

## 4 — Reservation URL

**Question:** Is there a dedicated online reservation URL (e.g. Tabelog, BookingTable)?

**What we found:** All booking is currently handled by the on-site booking form
(`/visit`) or by email. No external reservation URL was found in the codebase.

**Action required:** If an external reservation URL exists, add it to
`businessConfig.urls.reservationUrl` and link to it on the Visit and Pricing pages.

---

## 5 — Google Maps listing URL accuracy

**Question:** Is the Google Maps URL current?

**What we found:** The map URL in `siteConfig.ts` was written using coordinates and a
`/g/11y8wyn2ds` identifier. This should be verified against the live Google Maps listing
to ensure it resolves correctly and is not an outdated link.

**Action required:** Visit the URL and confirm it opens the correct pin. Update
`businessConfig.urls.mapUrl` if needed.
