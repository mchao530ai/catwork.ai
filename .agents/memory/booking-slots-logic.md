---
name: Booking slots generation logic
description: Rule for how lastAdmission relates to hoursClose, and how slots auto-generate.
---

## Rule
`lastAdmission` must always equal `hoursClose − 1 hour` (the slot duration).

The last booking slot is `lastAdmission – hoursClose`, so a visitor arriving at the last slot leaves exactly when the cafe closes.

**Example:** hoursOpen=13:00, hoursClose=18:00 → lastAdmission=17:00 → slots 13:00–14:00 … 17:00–18:00.

**Why:** Setting lastAdmission=hoursClose would create a slot that ends one hour after closing, which is wrong. The user explicitly confirmed this in July 2026.

## How to apply
- Whenever hoursOpen or hoursClose are changed (in DB or static config), update lastAdmission = hoursClose − 60 min.
- `generateSlotsFromHours(hoursOpen, lastAdmission)` in `useSiteConfig.ts` auto-builds the dropdown from these two values; no need to manually edit `bookingTimeSlots` in DB unless custom slots are wanted.
- Static defaults live in `artifacts/catwork-cafe/src/data/siteConfig.ts` (bookingTimeSlots array) and `businessConfig.ts` (hours.open / hours.close). Keep them in sync with DB values.
