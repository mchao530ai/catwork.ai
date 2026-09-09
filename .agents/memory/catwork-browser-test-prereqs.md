---
name: Browser test prerequisites
description: Environment prerequisite observed when running Catwork Cafe Playwright tests
---

Playwright's bundled Chromium cannot launch in the current environment until the system library `libgbm.so.1` is available.

**Why:** The browser exits before opening a page, so E2E failures caused by this prerequisite must not be mistaken for application or test failures.

**How to apply:** When validating the Catwork Cafe E2E suite, check the browser system dependencies first; if `libgbm.so.1` is absent, report the environment block rather than replacing the mocked flow with real database or email calls.