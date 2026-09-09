---
name: Catwork Cafe i18n setup
description: Language support, detection, and font wiring for the trilingual SPA.
---

Languages: **en, ja, zh** only. Korean (ko) is mentioned by the owner but NOT in the i18n config (no locale file, no Google Fonts entry).

Detection order: localStorage (`catwork_lang` key) → browser navigator. Language is NOT URL-based — all language variants share the same URL paths.

**Why this matters for SEO:** hreflang alternates all point to the same canonical URL per page. This is correct given the architecture but not ideal for search engine language targeting.

**Font wiring:** `document.documentElement.lang` is set on language change via `i18n.on('languageChanged', ...)` in `src/i18n/index.ts`. CSS in `src/index.css` uses `html[lang="ja"]` and `html[lang="zh"]` selectors to switch to Noto Sans JP / Noto Serif JP and Noto Sans SC / Noto Serif SC respectively. English keeps Playfair Display + Inter.

CJK letter-spacing: `tracking-wider/widest` classes are neutralized to `letter-spacing: 0` under `html[lang="ja/zh"]` selectors.
