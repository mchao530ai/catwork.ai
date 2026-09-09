# Catwork Cafe — Website

A multi-page brand website for **Catwork Cafe**, a cat-friendly coworking café in Echigo Yuzawa, Niigata, Japan.

Built with React + Vite + TypeScript + Tailwind CSS v4 + Wouter routing + Framer Motion.

---

## Getting Started

```bash
# From the project root (monorepo)
pnpm --filter @workspace/catwork-cafe dev
```

The site runs on the port set by the `PORT` environment variable (handled automatically by the Replit platform).

---

## Pages

| Route      | Page               |
|------------|--------------------|
| `/`        | Home               |
| `/visit`   | Visit & Booking    |
| `/pricing` | Pricing            |
| `/cats`    | The Cats           |
| `/access`  | Access / Directions|
| `/faq`     | FAQ                |
| `/contact` | Contact            |

---

## Updating Content

All content is centralized in `src/data/`. Edit these files to update copy without touching components:

| File                     | Contains                                      |
|--------------------------|-----------------------------------------------|
| `src/data/siteConfig.ts` | Address, hours, phone, LINE URL, Instagram    |
| `src/data/cats.ts`       | Cat profiles (name, breed, bio, personality)  |
| `src/data/pricing.ts`    | Pricing plans and notes                       |
| `src/data/faqs.ts`       | FAQ items grouped by category                 |
| `src/data/reviews.ts`    | Customer reviews                              |
| `src/data/events.ts`     | News items and upcoming events                |

---

## Placeholder Values

The following values in `src/data/siteConfig.ts` are placeholders and need to be updated before going live:

| Constant               | Current Value                              | Action Required                         |
|------------------------|--------------------------------------------|-----------------------------------------|
| `LINE_URL`             | `https://line.me/R/ti/p/PLACEHOLDER_LINE_ID` | Replace with real LINE Add Friend URL   |
| `SITE_CONFIG.siteUrl`  | `https://catworkcafe.jp`                   | Update if domain is different           |
| `SITE_CONFIG.mapEmbedUrl` | `PLACEHOLDER_GOOGLE_MAPS_EMBED_URL`     | Add Google Maps embed URL               |

In `artifacts/catwork-cafe/public/`:
- **`robots.txt`** — update the `Sitemap:` URL once the domain is confirmed
- **`sitemap.xml`** — update all `<loc>` URLs to match the real domain

In `artifacts/catwork-cafe/public/images/`:
- All images are current brand assets. No placeholders.

In `src/pages/Access.tsx`:
- The Google Maps `<iframe>` is commented out with instructions. Uncomment and replace `SITE_CONFIG.mapEmbedUrl` with the real embed code once available.

---

## Forms (Phase 2 Wiring)

Both the **Booking Request** (`src/pages/Visit.tsx`) and **Contact** (`src/pages/Contact.tsx`) forms have a commented section marked `TODO: Wire to backend or email API in Phase 2`. The forms validate and show success messages locally. To wire them:

1. Set up an API route (e.g. `/api/bookings` and `/api/contact`) in the API server artifact.
2. Replace the `TODO` comment with a `fetch()` call to that route.
3. Add email sending via a transactional email service (Resend, SendGrid, etc.).

---

## Phase 2 Extension Guide

The codebase is structured to make Phase 2 additions straightforward:

### Individual Cat Pages
- Each cat in `src/data/cats.ts` already has a `slug` field.
- Add a route `/cats/:slug` in `src/App.tsx` and create `src/pages/CatDetail.tsx`.

### Memberships & Payments
- The `membership` plan in `src/data/pricing.ts` is already defined and shows a teaser card.
- Wire up Stripe or RevenueCat (see relevant skills) for payment processing.

### Real-time Availability
- Add a backend endpoint that returns available slots per date.
- Integrate with the booking form's date/time selection.

### Admin / CMS
- Headless CMS (e.g. Sanity, Contentful) can replace the static data files in `src/data/`.

### Email Subscription
- The footer email subscription input is client-side only. Wire to a mailing list API (Mailchimp, Resend Audiences, etc.) in Phase 2.

---

## Project Structure

```
artifacts/catwork-cafe/
├── public/
│   ├── images/          # Cat and café photos
│   ├── robots.txt
│   └── sitemap.xml
├── src/
│   ├── components/
│   │   ├── layout/      # Navbar, Footer, Layout
│   │   └── shared/      # PageMeta
│   ├── data/            # All content data files
│   ├── pages/           # Page components (one per route)
│   ├── App.tsx          # Wouter router
│   ├── main.tsx
│   └── index.css
├── vite.config.ts
└── package.json
```
