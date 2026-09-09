# After-State Audit — Post Fixes

**Date:** 2026-07-16  
**Method:** Code-review audit against WCAG 2.1 AA and Lighthouse criteria

## Changes Applied

### Accessibility Fixes (all critical/serious violations resolved)

| Fixed | File(s) | Change |
|-------|---------|--------|
| ✅ User zoom re-enabled | `index.html` | Removed `maximum-scale=1` from viewport meta |
| ✅ Global focus-visible ring | `index.css` | Added `:focus-visible` selector with `2px solid #D4A373` outline; `:focus:not(:focus-visible)` removes outline for mouse users only |
| ✅ Email inputs labelled | `Footer.tsx`, `Home.tsx`, `Cats.tsx` | Each email `<input>` now has an associated `<label>` (visually hidden via `.sr-only` where needed) |
| ✅ Footer subscribe button | `Footer.tsx` | Icon-only submit button now has `aria-label="Subscribe"` |
| ✅ Language switcher semantics | `Navbar.tsx` | Globe button has `aria-expanded`, `aria-haspopup="listbox"`; dropdown has `role="listbox"`; options have `role="option"` + `aria-selected` |
| ✅ Language dropdown keyboard close | `Navbar.tsx` | `Escape` key closes dropdown and returns focus to trigger button |
| ✅ Hamburger button | `Navbar.tsx` | Added `aria-expanded` + `aria-controls="mobile-menu"` |
| ✅ Mobile menu dialog | `Navbar.tsx` | Full-screen overlay is now `role="dialog"` `aria-modal="true"` with focus trapping (Tab/Shift+Tab cycles within overlay, Escape closes) |
| ✅ Active nav link | `Navbar.tsx` | `aria-current="page"` added to both desktop and mobile nav links |
| ✅ Logo alt text | `Navbar.tsx`, `Footer.tsx` | Logo `<img>` uses `alt=""` aria-hidden since the wrapping link has a proper `aria-label` |
| ✅ Lightbox dialog | `Facilities.tsx` | Lightbox has `role="dialog"`, `aria-modal="true"`, `aria-label`, close button has `autoFocus`, counter has `aria-live="polite"` |
| ✅ Language group in mobile | `Navbar.tsx` | Language button group has `role="group"` + `aria-label`; buttons use `aria-pressed` |
| ✅ i18n keys added | `en.ts`, `ja.ts`, `zh.ts` | Added `nav.selectLanguage`, `nav.mobileMenuLabel`, `footer.subscribeBtn` |

### Performance Fixes

| Fixed | File(s) | Change |
|-------|---------|--------|
| ✅ Hero image preloaded | `index.html` | `<link rel="preload" as="image" href="/images/cafe-interior.webp">` |
| ✅ Logo explicit dimensions | `Navbar.tsx`, `Footer.tsx` | Added `width="48" height="48"` / `width="64" height="64"` to prevent CLS |
| ✅ Below-fold images lazy-loaded | `CatImageCarousel.tsx`, `Cats.tsx`, `Facilities.tsx`, `Footer.tsx` | `loading="lazy"` applied; first visible cat image remains `loading="eager"` |
| ✅ Overflow guard on html/body | `index.css` | `overflow-x: hidden; max-width: 100vw` on both `html` and `body` |

### Mobile / Touch Target Fixes

| Fixed | File(s) | Change |
|-------|---------|--------|
| ✅ Carousel dot touch targets | `Pricing.tsx`, `Facilities.tsx`, `CatImageCarousel.tsx` | Dots wrapped in `w-7 h-7` buttons (28×28px hit area visible, visual dot unchanged) |
| ✅ Carousel prev/next buttons | `Pricing.tsx`, `Facilities.tsx` | Increased from `w-8/w-9` to `w-10` (40px) |
| ✅ Lang switcher min tap area | `Navbar.tsx` | `min-w-[44px] min-h-[44px]` on globe button |
| ✅ Hamburger min tap area | `Navbar.tsx` | `min-w-[44px] min-h-[44px]` on hamburger button |
| ✅ Mobile lang buttons min tap | `Navbar.tsx` | `min-w-[44px] min-h-[44px]` on language toggle buttons |

---

## Remaining / Out-of-Scope Issues

- Pre-existing TypeScript errors in `@workspace/api-client-react` imports (missing exported members) — these are pre-existing and tracked under a separate task.
- Actual Lighthouse CI scores require a running browser environment — scores below are estimates.

---

## Estimated Lighthouse Scores (After)

| Page | Performance | Accessibility | Best Practices | SEO |
|------|------------|---------------|----------------|-----|
| `/` | ~80 | ~93 | ~92 | ~95 |
| `/visit` | ~82 | ~95 | ~92 | ~95 |
| `/pricing` | ~80 | ~93 | ~92 | ~95 |
| `/cats` | ~79 | ~95 | ~92 | ~95 |
| `/access` | ~82 | ~97 | ~92 | ~95 |
| `/faq` | ~84 | ~97 | ~92 | ~95 |
| `/contact` | ~82 | ~95 | ~92 | ~95 |
| `/facilities` | ~77 | ~93 | ~92 | ~95 |

*(Estimates based on resolved violation count; actual scores require headless Chrome Lighthouse run.)*
