# Language Parity Audit — Catwork Cafe

Audited: 2026-07-16  
Languages: en / ja / zh  
Detection order: localStorage (`catwork_lang`) → navigator  
Fallback: `en`

## Top-level key sections

| Key section | en | ja | zh | Status |
|------------|----|----|-----|--------|
| `nav` | ✅ | ✅ | ✅ | Parity |
| `footer` | ✅ | ✅ | ✅ | Parity |
| `home` | ✅ | ✅ | ✅ | Parity |
| `visit` | ✅ | ✅ | ✅ | Parity |
| `pricing` | ✅ | ✅ | ✅ | Parity |
| `cats` | ✅ | ✅ | ✅ | Parity |
| `access` | ✅ | ✅ | ✅ | Parity |
| `faq` | ✅ | ✅ | ✅ | Parity |
| `contact` | ✅ | ✅ | ✅ | Parity |
| `facilities` | ✅ | ✅ | ✅ | Parity |
| `reels` | ✅ | ✅ | ✅ | Parity |
| `lang` | ✅ | ✅ | ✅ | Parity |
| `notFound` | ✅ | ✅ | ✅ | Fixed (was missing in all three locales) |

## i18n configuration

| Concern | Status | Notes |
|---------|--------|-------|
| `html lang` attribute update on switch | ✅ OK | `applyLang()` hooked to `languageChanged` event in `i18n/index.ts` |
| `html lang` set on initial load | ✅ OK | `applyLang(i18n.language)` called at init |
| localStorage persistence | ✅ OK | LanguageDetector `caches: ['localStorage']` + manual `localStorage.setItem` in Navbar |
| Detection order | ✅ OK | `order: ['localStorage', 'navigator']` |
| localStorage key | ✅ OK | `lookupLocalStorage: 'catwork_lang'` |
| Fallback language | ✅ OK | `fallbackLng: 'en'` |
| Language kept on route change | ✅ OK | No URL-based language prefixes; state persists in localStorage |

## Notes
- No silent fallback gaps found — all keys used in JSX exist in all three locales
- `faq.items` and `cats.rules.items` are arrays that are fully translated in all three locales
- The `notFound` key group was added as part of this audit to support the translated 404 page
