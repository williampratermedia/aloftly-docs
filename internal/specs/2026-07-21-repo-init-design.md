# Aloftly docs repo initialization — design

**Date:** 2026-07-21
**Status:** Approved by William 2026-07-21

## Goal

Initialize `aloftly-docs` (the dedicated Mintlify repo) for long-term use with Claude and for a public Aloftly documentation site. Aloftly is the unified CRO intelligence layer for Shopify, built by Fifth Effect; the app repo is `C:\Users\billy\Documents\GitHub\aloftly-analytics` (read-only reference).

## Decisions

- **Audience:** public user-facing docs plus a future Developers section (public API / MCP server, not yet built). Internal engineering docs stay in the app repo.
- **Scope of this task:** initialize the repo AND write a porting map (`internal/porting-map.md`) triaging the 21 internal docs in `aloftly-analytics/docs/`. Actual content cleanup and page-writing happens in later sessions.
- **Approach:** lean init — no empty stub pages. Live nav shows only finished pages (index + quickstart at first); the full target information architecture lives in the porting map until each page is written. Rationale: pushes to `main` deploy the live site.
- **llms.txt / skill.md:** never created manually — Mintlify auto-generates both from the deployed site. Our levers: `docs.json` top-level `description` and mandatory frontmatter `description` (≤300 chars) on every page.

## Deliverables

1. `AGENTS.md` — rewritten as the single agent-context file: product context, terminology, voice, Mintlify component guidance (Accordions, Steps, Cards), content boundaries (no internal architecture, no unshipped features, no verbatim ports), workflow rules.
2. `CLAUDE.md` — one-line import of AGENTS.md.
3. `docs.json` — name Aloftly; colors `#2563EB` (Fifth Effect blue) / `#60A5FA` / `#1D4ED8`; top-level `description`; nav = Get started group (index, quickstart); navbar Support (`support@aloftly.com` — assumption, confirm) + Dashboard → `https://app.aloftly.com`; Mintlify starter anchors/socials removed; contextual AI options kept.
4. `index.mdx` — "What is Aloftly?" landing, grounded in PRODUCT.md / Vision doc, honest early-access framing.
5. `quickstart.mdx` — sign in → create org → connect Shopify → connect stack → open Overview.
6. `internal/porting-map.md` — disposition for all 21 internal docs (stays internal / source material / archive candidate) + full target IA with per-page scope notes.
7. `.mintignore` — add `internal/`.
8. Mintlify authoring skill installed via `npx skills add https://mintlify.com/docs`.

## Content boundaries (security)

Never publish: RLS/tenant-isolation architecture, migrations, webhook token/routing internals, cron/Inngest internals, auth implementation, unshipped plans (public MCP server, ClickHouse). Internal docs are source material to rewrite for users, never to copy.

## Known TODOs left for the user

- Replace `logo/light.svg`, `logo/dark.svg`, `favicon.svg` (still Mintlify starter assets).
- Confirm support email (`support@aloftly.com` assumed).
- README.md still describes the Mintlify starter kit.
