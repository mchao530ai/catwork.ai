# SEO Audit — Batch 2: Multilingual SEO & Crawlability

**Date:** 2026-07-16  
**Scope:** Task #91 — Multilingual SEO & crawlability improvements for catwork.ai

---

## 1. Query-Param Locale URLs (`?lang=`)

### What changed
- `src/i18n/index.ts`: Added `"querystring"` as the first detection method, with `lookupQuerystring: "lang"`. Detection order is now `["querystring", "localStorage", "navigator"]`.
- `src/components/layout/Navbar.tsx`: `changeLanguage()` now calls `window.history.replaceState` to write `?lang=<code>` to the URL whenever the user selects a language. Shareable, bookmarkable URLs like `https://catwork.ai/?lang=ja` now resolve to the Japanese site.
- `src/i18n/index.ts`: `applyLang()` now maps `zh` → `zh-Hant` for the `<html lang>` attribute (previously was setting bare `zh`).

### Before / After
| URL visited | Language loaded (before) | Language loaded (after) |
|---|---|---|
| `/?lang=ja` | Ignored (fallback to localStorage/browser) | ✅ Japanese |
| `/?lang=zh` | Ignored | ✅ Chinese |
| `/?lang=en` | Ignored | ✅ English |

---

## 2. Translated Page Titles & Descriptions

### What changed
- Added `meta` section to all three locale files (`en.ts`, `ja.ts`, `zh.ts`) with `title` and `desc` keys for all 9 public pages: `home`, `visit`, `pricing`, `cats`, `facilities`, `access`, `faq`, `contact`, `reels`.
- All 9 page components updated to use `t("meta.<page>.title")` and `t("meta.<page>.desc")` rather than hardcoded English strings.
- `PageMeta.tsx` simplified to use the full translated title directly (removed the `title === "Home"` special-case that would append the site tagline).

### Sample translated titles
| Page | EN | JA | ZH |
|---|---|---|---|
| Home | Catwork Cafe — Cat Café & Remote Workspace in Echigo Yuzawa, Niigata | キャットワークカフェ — 越後湯沢の猫カフェ・ワークカフェ \| 新潟 | CatWork Cafe — 新潟越後湯澤的貓咪咖啡廳與遠端工作空間 |
| Pricing | Pricing & Entry Fee \| Catwork Cafe | 料金 \| キャットワークカフェ | 價格與入場費 \| Catwork Cafe |
| Access | Access \| Catwork Cafe | アクセス \| キャットワークカフェ | 交通資訊 \| Catwork Cafe |

---

## 3. Hreflang Fixes

### What changed
- `PageMeta.tsx`: hreflang `<link>` tags now point to language-specific URLs:
  - `hreflang="en"` → `{canonical}?lang=en`
  - `hreflang="ja"` → `{canonical}?lang=ja`
  - `hreflang="zh-Hant"` → `{canonical}?lang=zh`
  - `hreflang="x-default"` → `{canonical}` (bare URL, no lang param)
- `public/sitemap.xml`: All 9 routes updated to use `?lang=` alternates. `hreflang="zh"` corrected to `hreflang="zh-Hant"`.
- `index.html`: Static hreflang `<link>` tags added for the home page so crawlers that don't execute JS can discover language alternates immediately.

### Before
```html
<!-- All languages pointed to the same URL — useless for Googlebot -->
<link rel="alternate" hreflang="en" href="https://catwork.ai/" />
<link rel="alternate" hreflang="ja" href="https://catwork.ai/" />
<link rel="alternate" hreflang="zh" href="https://catwork.ai/" />
```

### After
```html
<link rel="alternate" hreflang="en" href="https://catwork.ai/?lang=en" />
<link rel="alternate" hreflang="ja" href="https://catwork.ai/?lang=ja" />
<link rel="alternate" hreflang="zh-Hant" href="https://catwork.ai/?lang=zh" />
<link rel="alternate" hreflang="x-default" href="https://catwork.ai/" />
```

---

## 4. Pre-Rendering for Crawlability

### What changed
- Created `prerender.mjs` — a post-build Node.js script that:
  1. Reads `dist/public/index.html` (built by Vite)
  2. For each of the 9 public routes, generates a route-specific `index.html` in the corresponding directory (e.g., `dist/public/visit/index.html`)
  3. Injects the correct `<title>`, `<meta name="description">`, OG tags, canonical URL, and hreflang links for that route
- Updated `package.json` build script: `vite build --config vite.config.ts && node prerender.mjs`
- Result: A static HTTP server serving `catwork.ai/pricing` will deliver an HTML file with the correct pricing title and description, without requiring JS execution.

### Coverage
| Route | Static HTML generated |
|---|---|
| `/` | ✅ dist/public/index.html |
| `/visit` | ✅ dist/public/visit/index.html |
| `/pricing` | ✅ dist/public/pricing/index.html |
| `/cats` | ✅ dist/public/cats/index.html |
| `/facilities` | ✅ dist/public/facilities/index.html |
| `/access` | ✅ dist/public/access/index.html |
| `/faq` | ✅ dist/public/faq/index.html |
| `/contact` | ✅ dist/public/contact/index.html |
| `/reels` | ✅ dist/public/reels/index.html |

---

## 5. Structured Data (JSON-LD) Fixes

### What changed in `Home.tsx`

#### `openingHours` — incomplete schedule fixed
```js
// Before (only Saturday & Sunday)
openingHours: ["Sa 11:00-18:00", "Su 11:00-18:00"],

// After (full Tue/Wed/Fri/Sat/Sun schedule)
openingHours: ["Tu 11:00-18:00", "We 11:00-18:00", "Fr 11:00-18:00", "Sa 11:00-18:00", "Su 11:00-18:00"],
```

#### Fake `review` block removed
The `review` object with hardcoded `reviewBody` ("A wonderful hidden gem...") and author name "Google Reviewer" was a fabricated review. It has been **entirely removed** from the JSON-LD object. Schema.org guidelines prohibit embedding fake reviews in structured data.

#### `reviewCount` made dynamic
```js
// Before
reviewCount: "47",  // hardcoded, not based on real data

// After
reviewCount: String(activeTestimonials.length > 0 ? activeTestimonials.length : REVIEWS.length),
```

---

## 6. Technical SEO Files

### `public/robots.txt`
```
# Before
User-agent: *
Allow: /
Sitemap: https://catwork.ai/sitemap.xml

# After
User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /api/
Sitemap: https://catwork.ai/sitemap.xml
```
Admin and API routes are now blocked from crawlers.

### `public/sitemap.xml`
- All 9 routes updated: `hreflang="zh"` → `hreflang="zh-Hant"`, and `?lang=` params added to all language alternates.
- `x-default` alternates kept as plain canonical URLs.

### `public/manifest.json` (new)
A Web App Manifest was created with the cafe's name, theme colour (`#D4A373`), background colour (`#FDFBF7`), and icon references. This enables "Add to Home Screen" on mobile and improves Lighthouse scores.

---

## 7. Automated Tests

A lightweight Node.js test script (`scripts/test-seo.mjs`) was added. Run with:

```bash
pnpm --filter @workspace/catwork-cafe test:seo
```

### Tests covered
| # | Check |
|---|---|
| 1 | All 3 locale files (`en`, `ja`, `zh`) have `meta` keys for all 9 page slugs |
| 2 | `robots.txt` has `Disallow: /admin`, `Disallow: /api/`, and `Sitemap:` |
| 3 | `sitemap.xml` uses `?lang=en/ja/zh` alternates and `hreflang="zh-Hant"` |
| 4 | `Home.tsx` JSON-LD has no `reviewBody`, no hardcoded `"47"`, and includes Tue/Wed/Fri in `openingHours` |
| 5 | `PageMeta.tsx` hreflang uses `?lang=` params and `zh-Hant` |
| 6 | `i18n/index.ts` has `querystring` detector with `lookupQuerystring: "lang"` and `zh-Hant` mapping |

---

## Known Limitations & Follow-Up

- **Dynamic data not prerendered:** Cat names, testimonials, and FAQ content fetched from the API are not in the static HTML. Google's JS renderer will eventually index them, but they won't appear in initial HTML.
- **Language-specific prerender:** Currently the prerender generates English-language static HTML only. A future improvement could generate `/ja/` and `/zh/` path variants (path-based routing) for full multilingual static output.
- **`<html lang>` in initial HTML:** `index.html` has `lang="en"` statically. The JS sets the correct language (including `zh-Hant`) via `applyLang()` on first render, so JS-enabled crawlers get the right value.
