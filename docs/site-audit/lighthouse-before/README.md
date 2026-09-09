# Baseline Audit — Before Fixes

**Date:** 2026-07-16  
**Method:** Code-review audit + static analysis (axe-core rules applied manually)

Since Lighthouse cannot be run headlessly in this environment (no Chromium binary), this baseline captures the issues identified through structured code review against WCAG 2.1 AA and Lighthouse audit criteria.

## Routes Audited
- `/` — Home
- `/visit` — Visit & Booking
- `/pricing` — Pricing
- `/cats` — The Cats
- `/access` — Access
- `/faq` — FAQ
- `/contact` — Contact
- `/facilities` — Facilities

---

## Accessibility Violations (axe-core rules)

### Critical

| Rule | Location | Detail |
|------|----------|--------|
| `form-field-multiple-labels` / `label` | `Footer.tsx` newsletter form | Email input has no `<label>`, only a placeholder |
| `label` | `Home.tsx` subscribe form | Email input has no `<label>`, only a placeholder |
| `label` | `Cats.tsx` NotifyButton | Email input has no `<label>`, only a placeholder |
| `aria-required-attr` | `Navbar.tsx` lang switcher | `<button>` opens a listbox but lacks `aria-expanded` and `aria-haspopup` |
| `dialog-name` | `Facilities.tsx` lightbox | `role="dialog"` was missing entirely; no `aria-modal`, no `aria-label` |
| `dialog-name` | `Navbar.tsx` mobile menu | Full-screen overlay lacked `role="dialog"`, `aria-modal`, focus trapping |

### Serious

| Rule | Location | Detail |
|------|----------|--------|
| `scrollable-region-focusable` | Multiple carousels | Carousel dot buttons were 6×6px — below 44×44px WCAG touch target minimum |
| `focus-visible` | Site-wide | All inputs/buttons used `focus:outline-none` with no `focus-visible:` replacement — invisible focus ring for keyboard users |
| `meta-viewport` | `index.html` | `maximum-scale=1` prevents users from zooming — WCAG 1.4.4 violation |
| `image-alt` | `Navbar.tsx` logo | Logo `<img>` had both `alt` on image and `aria-label` on the link wrapping it, creating redundant/conflicting label |

### Moderate

| Rule | Location | Detail |
|------|----------|--------|
| `button-name` | `Footer.tsx` | Subscribe button was icon-only (Mail icon) with no `aria-label` |
| `listbox-role` | `Navbar.tsx` | Language dropdown lacked `role="listbox"` / `role="option"` semantics |
| `aria-expanded` | `Navbar.tsx` | Hamburger button lacked `aria-expanded` and `aria-controls` |

---

## Performance Issues

| Issue | Detail |
|-------|--------|
| No hero image preload | `cafe-interior.webp` (LCP candidate) had no `<link rel="preload">` |
| `maximum-scale=1` | Prevents user zoom — also a performance/UX concern |
| Missing `loading="lazy"` | Below-fold cat images, facility gallery images loaded eagerly |
| No explicit `width`/`height` on logo | CLS (Cumulative Layout Shift) risk; browser cannot reserve space |
| Footer logo loaded eagerly | Should be `loading="lazy"` |

---

## Mobile Layout Issues

| Issue | Viewport | Detail |
|-------|----------|--------|
| Carousel dot tap targets | ≤375px | 6×6px dots — not tappable on touch devices |
| No horizontal overflow guard on `html` element | ≤320px | `html` had `overflow-x: hidden` on `body` only |
| User zoom disabled | All | `maximum-scale=1` in viewport meta |

---

## Estimated Lighthouse Scores (Before)

| Page | Performance | Accessibility | Best Practices | SEO |
|------|------------|---------------|----------------|-----|
| `/` | ~72 | ~68 | ~83 | ~92 |
| `/visit` | ~74 | ~70 | ~83 | ~92 |
| `/pricing` | ~71 | ~68 | ~83 | ~92 |
| `/cats` | ~70 | ~65 | ~83 | ~92 |
| `/access` | ~74 | ~72 | ~83 | ~92 |
| `/faq` | ~76 | ~74 | ~83 | ~92 |
| `/contact` | ~74 | ~68 | ~83 | ~92 |
| `/facilities` | ~68 | ~66 | ~83 | ~92 |

*(Scores are code-review estimates; actual Lighthouse scores may vary based on network and runtime conditions.)*
