---
name: Catwork Cafe base path
description: How BASE_PATH is set and what the current deployment URL structure is.
---

The café SPA is deployed at **https://catwork.ai/** (root of the domain), NOT at `/cafe`.

**Why:** BASE_PATH is injected by Replit's artifact system based on the artifact's `previewPath`. The `catwork-cafe` artifact has previewPath `/`. The vite.config.ts reads `process.env.BASE_PATH` (throws if absent) and sets Vite's `base`. Changing the base path requires updating the artifact previewPath via the artifact system — not just setting a secret.

**How to apply:** If the user ever wants to move to `catwork.ai/cafe`, update the artifact's previewPath in the artifact system. Do NOT just set BASE_PATH as a secret — the platform injects it based on the artifact config. The wouter Router already reads `import.meta.env.BASE_URL` so routing will adjust automatically once BASE_PATH changes.

Admin panel is at `/admin` (served under whatever BASE_PATH is). It moves with the base path.
