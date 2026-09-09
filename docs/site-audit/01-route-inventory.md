# Route Inventory — Catwork Cafe

Audited: 2026-07-16  
Router: wouter (client-side, no URL-based language prefixes)  
i18n: i18next + localStorage key `catwork_lang` (en / ja / zh)

## Public Routes

| Path | Component | Status |
|------|-----------|--------|
| `/` | `Home.tsx` | ✅ OK |
| `/visit` | `Visit.tsx` | ✅ OK |
| `/pricing` | `Pricing.tsx` | ✅ OK |
| `/cats` | `Cats.tsx` | ✅ OK |
| `/access` | `Access.tsx` | ✅ OK |
| `/faq` | `FAQ.tsx` | ✅ OK |
| `/contact` | `Contact.tsx` | ✅ OK |
| `/reels` | `Reels.tsx` | ✅ OK |
| `/facilities` | `Facilities.tsx` | ✅ OK |
| `*` (catch-all) | `not-found.tsx` | ✅ Fixed (was inline JSX) |

## Admin Routes

| Path | Component | Status |
|------|-----------|--------|
| `/admin` | `AdminLogin.tsx` | ✅ OK |
| `/admin/dashboard` | `AdminDashboard.tsx` | ✅ OK |
| `/admin/bookings` | `AdminBookings.tsx` | ✅ OK |
| `/admin/enquiries` | `AdminEnquiries.tsx` | ✅ OK |
| `/admin/cats` | `AdminCats.tsx` | ✅ OK |
| `/admin/photos` | `AdminPhotos.tsx` | ✅ OK |
| `/admin/hours` | `AdminHours.tsx` | ✅ OK |
| `/admin/pricing` | `AdminPricing.tsx` | ✅ OK |
| `/admin/faqs` | `AdminFaqs.tsx` | ✅ OK |
| `/admin/events` | `AdminEvents.tsx` | ✅ OK |
| `/admin/google` | `AdminGoogle.tsx` | ✅ OK |
| `/admin/instagram` | `AdminInstagram.tsx` | ✅ OK |
| `/admin/testimonials` | `AdminTestimonials.tsx` | ✅ OK |
| `/admin/accounts` | `AdminAccounts.tsx` | ✅ OK |

## Notes
- All public routes are wrapped in `<Layout>` (Navbar + Footer)
- Admin routes use `AdminGuard` (auth protection) + `AdminLayout`
- 404 catch-all is last in the public `<Switch>` — correct behaviour
