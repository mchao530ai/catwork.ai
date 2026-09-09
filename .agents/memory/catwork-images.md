---
name: Catwork Cafe image assets
description: Image formats, sizes, and what exists in public/images/.
---

All images live in `artifacts/catwork-cafe/public/images/`.

**Current state (post-optimization):**
- Cat images: both `.png` (kept for DB-stored URLs) and `.webp` (48–96KB, 94% smaller)
- Café photos: `.jpg` only (PNG duplicates deleted: cafe-interior.png 1.9MB, cafe-exterior.png 1.7MB)
- WebP versions: cafe-interior.webp (420KB), cafe-exterior.webp (56KB)
- logo.jpg (8KB) — still JPG, not yet converted to SVG/PNG
- space-1/2/3.jpg — not yet converted to webp

**Why PNG cat files kept:** Cat image URLs are stored as strings in the DB by the admin panel. Deleting PNGs would break DB-stored cats. Static fallback data (cats.ts, events.ts, Facilities.tsx) references `.webp`. DB-stored URLs still use `.png`.

**Hero image:** Uses `<picture>` element with webp source + jpg fallback + fetchPriority="high".

**To convert space photos:** `magick space-N.jpg -quality 82 space-N.webp` then update any references.
