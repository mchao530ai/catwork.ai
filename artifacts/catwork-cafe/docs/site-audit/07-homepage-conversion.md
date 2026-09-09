# Homepage Conversion Audit
**Task:** Batch 3 — Homepage conversion improvements  
**Date:** 2026-07-16

---

## Before State

### Desktop (1280×720) first viewport — original elements
| Goal item | Present before? | Notes |
|---|---|---|
| Business name | ✓ | In navbar logo |
| "Cat café" category label | ✗ | Missing — only location text was shown |
| Echigo-Yuzawa location | ✓ | `SITE_CONFIG.location` shown above H1 |
| Hero image | ✓ | cafe-interior.webp full-bleed background |
| Live opening status | ✗ | Missing entirely |
| Primary CTA (reservation) | ✓ | "Book a Visit" → /visit |
| Secondary CTA (directions) | ✗ | Was "Email Us" → mailto — not Google Maps |
| Language selector | ✓ | In sticky nav |

### Issues identified
- Hero H1 used the key `home.hero.tagline` ("Your Mountain Workspace") — descriptive but not a proper business headline; lacked "cat café" category signal or location.
- Secondary CTA led to an email link instead of Google Maps directions.
- No live open/closed indicator anywhere on the page.
- No "cat café" category label visible above the fold.
- Hero had two buttons of equal visual weight (Book a Visit, Email Us); pricing and Instagram were not accessible from hero.
- Section order: Cats Preview appeared **after** Space Photos — reversed from target order (cats first, then space photos).

---

## Changes Made

### 1. New `HeroSection` component (`src/components/home/HeroSection.tsx`)
- **Extracted** the hero `<section>` from `Home.tsx` into a dedicated `<HeroSection>` component.
- **Added category label** "Cat Café · Workspace" above the H1 (in `[#D4A373]` gold, uppercase tracking).
- **Changed H1** to use new key `home.hero.headline` — "Cat Café & Workspace in Echigo Yuzawa" (en) — which names the business type, category, and location explicitly.
- **Added location row** below H1: `<MapPin>` icon + `SITE_CONFIG.location`.
- **Added live opening status** computed client-side in JST (UTC+9): green pulsing dot + "Open Now" / "Closed Today" using keys `home.hero.status.open` / `home.hero.status.closed`. When open, shows last-admission time via `home.hero.status.lastAdmission`.
- **Changed primary CTA** to use `home.hero.cta.reservation` ("Plan Your Visit") → `/visit`.
- **Changed secondary CTA** from "Email Us" (mailto) to `home.hero.cta.directions` ("Get Directions") → `SITE_CONFIG.mapUrl` (Google Maps). Reason: Google Maps is a higher-value conversion action for a first-time visitor than email.
- **Added operational row** (below the two main buttons, smaller text): See Pricing → /pricing link, station-access summary, Japanese name. These remain discoverable but de-prioritised.
- **Hero scroll observer**: `IntersectionObserver` tracks hero visibility and passes it up via `onHeroVisibilityChange` prop — used to trigger the mobile sticky bar.

### 2. New `MobileStickyBar` component (`src/components/home/MobileStickyBar.tsx`)
- Appears on **mobile only** (`md:hidden`) after the hero scrolls out of view.
- Contains two thumb-friendly full-width buttons: "Plan Your Visit" and "Get Directions".
- Uses `framer-motion` `AnimatePresence` for a smooth slide-up/slide-down.
- `z-index: 40` — above page content and footer, below any cookie consent (z-50+).

### 3. New i18n keys added to `en.ts`, `ja.ts`, `zh.ts`
Keys added under `home.hero`:
- `headline` — full headline with category + location
- `description` — short descriptive paragraph (used in HeroSection)
- `cta.reservation` — primary CTA label
- `cta.directions` — secondary CTA label (Google Maps)
- `cta.prices` — tertiary pricing link label
- `status.open` — open-now indicator label
- `status.closed` — closed indicator label
- `status.lastAdmission` — last-admission notice with `{{time}}` interpolation
- `access.stationSummary` — station access summary with `{{minutes}}` interpolation

All existing keys under `home.hero` (tagline, desc, scroll, bookVisit, etc.) were **preserved** — not removed — to avoid breaking any other references.

### 4. New config fields in `siteConfig.ts`
- `lastAdmission: "17:30"` — placeholder; admin-editable via site config API.
- `stationWalkMinutes: 2` — placeholder; admin-editable.

Both are wired through `useSiteConfig.ts` to be overridable from the API.

### 5. Section reordering in `Home.tsx`
**Before order:**
1. Hero
2. In the Café Today
3. Brand Intro (Our Story)
4. Why Work Here / Pricing
5. Features
6. Facilities
7. **Space Photos**
8. **Cats Preview**
9. Reviews
10. FAQ Preview
11. News & Events
12. Email Subscription
13. Instagram Reels
14. Final CTA

**After order:**
1. Hero ← unchanged
2. In the Café Today ← unchanged
3. Brand Intro / Cat Café Experience (Our Story) ← unchanged
4. Pricing Summary (Why Work Here) ← unchanged
5. Features ← unchanged
6. Facilities ← unchanged
7. **Meet the Cats** ← moved up (was position 8)
8. **Interior / Experience Photos** ← moved down (was position 7)
9. Reviews ← deviation noted below
10. FAQ Preview ← unchanged
11. News & Events ← deviation noted below
12. Email Subscription ← unchanged
13. Instagram Reels ← unchanged
14. Final CTA ← unchanged

**Target vs actual deviations:**
| Target position | Target section | Actual | Reason |
|---|---|---|---|
| 7 | Access | Not added | Access is a full page (`/access`); reproducing it on the homepage without a live map embed would add weight without value. Linked from hero operational row and nav. |
| 8 | Visitor rules | Not added | Visitor rules are on the `/cats` page. Homepage space photos and cats section link to that page. Adding rules here would be redundant for first-time visitors. |
| After position 8 | Reviews | Kept (position 9) | Reviews are a high-conversion trust signal; kept before FAQ for credibility flow. |
| After position 10 | News & Events | Kept (position 11) | Existing section with dynamic data; kept rather than removed; noted as lower-priority. |

### 6. Playwright tests (`e2e/homepage-conversion.spec.ts`)
Tests cover:
- Single H1 presence
- H1 contains English location text ("Echigo Yuzawa")
- Primary CTA links to `/visit`
- Secondary CTA links to Google Maps
- No horizontal overflow — desktop (1280×720)
- No horizontal overflow — mobile (390×844)
- Hero section visible on desktop
- Hero section visible on mobile
- Language switch to `ja` changes H1 text (contains "越後湯沢")
- Language switch to `zh` changes H1 text (contains "越後湯澤")
- Language switch back to `en` restores English H1
- Opening status indicator present in hero
- Location label visible in hero

---

## After State (expected)

### Desktop (1280×720) first viewport
| Goal item | Present? | How |
|---|---|---|
| Business name | ✓ | H1: "Cat Café & Workspace in Echigo Yuzawa" |
| "Cat café" category label | ✓ | "Cat Café · Workspace" label above H1 |
| Echigo-Yuzawa location | ✓ | MapPin icon + location in H1 + in location row |
| Hero image | ✓ | cafe-interior.webp full-bleed |
| Live opening status | ✓ | Green/red dot with "Open Now" / "Closed Today" |
| Primary CTA | ✓ | "Plan Your Visit" → /visit |
| Secondary CTA (directions) | ✓ | "Get Directions" → Google Maps |
| Language selector | ✓ | Sticky nav |

### Mobile (390×844)
- Two thumb-friendly hero buttons (full-width, stacked)
- Mobile sticky bar appears when hero leaves viewport
- No text overflow or horizontal scroll
