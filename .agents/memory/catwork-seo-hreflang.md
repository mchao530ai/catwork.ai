---
name: Catwork Cafe SEO & hreflang
description: Query-param ?lang= strategy for multilingual URLs, prerender, canonical, hreflang conventions
---

# Catwork Cafe SEO & hreflang

## URL Strategy — Query-Param Throughout
The site uses `?lang=en/ja/zh` query params as the stable multilingual URL contract.
Path-based locale routing (`/ja/`, `/zh/`) is NOT part of the canonical URL structure.

## Canonical URLs
- EN: `https://catwork.ai/{route}` (bare, no lang param)
- JA: `https://catwork.ai/{route}?lang=ja`
- ZH: `https://catwork.ai/{route}?lang=zh`

**PageMeta.tsx** derives `langCode` from `i18n.language` at runtime and sets canonical accordingly.

## Hreflang Conventions
- `hreflang="en"` → `{route}?lang=en`
- `hreflang="ja"` → `{route}?lang=ja`
- `hreflang="zh-Hant"` → `{route}?lang=zh` (tag uses zh-Hant; URL param is `zh`)
- `hreflang="x-default"` → bare `{route}` (no lang param)

**Why:** Task explicitly requires stable ?lang= query-param URLs. Path-based routing (/ja/, /zh/) is out of scope.

## i18n Detection Order
`["querystring", "localStorage", "navigator"]` with `lookupQuerystring: "lang"`, localStorage key `catwork_lang`

## HTML lang Attribute
`applyLang()` in `src/i18n/index.ts` maps `zh` → `zh-Hant` for `<html lang>`.

## Prerender Script
`prerender.mjs` generates 27 files = 9 routes × 3 languages:
- EN: `dist/public/` and `dist/public/{route}/` (standard paths, bare canonical)
- JA: `dist/public/ja/` and `dist/public/ja/{route}/` (auxiliary snapshots, canonical = `?lang=ja`)
- ZH: `dist/public/zh/` and `dist/public/zh/{route}/` (auxiliary snapshots, canonical = `?lang=zh`)

JA/ZH files include inline script to set `localStorage.catwork_lang` and strip `/ja/` or `/zh/` prefix before SPA router mounts.

Hreflang inside ALL prerendered files uses `?lang=` params — never path-based.

## Page Meta Locale Keys
All 3 locale files (en/ja/zh) have `meta.{slug}.{title,desc}` for:
home, visit, pricing, cats, facilities, access, faq, contact, reels

## SEO Test Script
`scripts/test-seo.mjs` — 76 assertions; sections 1–6 always run; section 7 (build artifacts) activates when `dist/public/` exists.
Run: `pnpm --filter @workspace/catwork-cafe test:seo`
