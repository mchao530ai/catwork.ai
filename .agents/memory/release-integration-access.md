---
name: Release integration access
description: External access prerequisites for publishing Catwork Cafe release documents.
---

The GitHub connection used by this workspace may authenticate as a different account than the repository owner. Before creating a release, verify the connection identity has `push` permission on `mchao530ai/catwork.ai`; public read access is not enough. The Notion release parent must also be explicitly shared with the Replit integration, not merely accessible to the user's own Notion account.

**Why:** A public GitHub repository can return successful reads while rejecting Git object writes, and Notion returns a misleading-looking 404 when the connected integration lacks page access.

**How to apply:** Re-check both permissions immediately before release writes. If GitHub reports `push: false`, grant the connected account access or reconnect the intended GitHub account. If Notion returns `object_not_found`, share the page through Notion's connection controls or reconnect with that page selected.