# Porting map — aloftly-analytics/docs → public docs

**Source:** `C:\Users\billy\Documents\GitHub\aloftly-analytics\docs\` (read-only; 21 files surveyed 2026-07-21)

> **Update 2026-07-23 — app repo docs reorganized** (PR #230 / issue #229):
>
> - `docs/integrations/` is now the **only public Mintlify source material** — docs written there are intended for porting to this site.
> - Internal references moved under `docs/internal-docs/` (subfolders: `architecture`, `engineering`, `functionality-documentation`, `operations`, `plans`, `strategy`).
> - Completed runbooks (BetterAuth cutover, integration rollout) moved to `docs/archived-ignore/`.
> - Every doc now carries lifecycle frontmatter (`audience`, `visibility`, `status`, `last_reviewed`, `implementation_state`). Check `visibility: public` before porting, and still rewrite at user altitude — public-flagged docs can carry engineering detail (implementation maps, env vars, internal endpoints) that stays out of this site.
> - Part 1 below reflects the pre-reorg paths; prefix old `functionality-documentation/`, `plans/`, etc. references with `internal-docs/` when locating them.
**Purpose:** the roadmap for building out this docs site. Any session adding pages starts here: pick a page from the target IA, use the listed source docs as *raw material*, rewrite for the user audience, add the page to `docs.json` navigation, and update the Status column below.

**Ground rules** (see AGENTS.md for full boundaries):

- Internal docs are engineering references — **never port verbatim**. Rewrite at user altitude.
- Security-sensitive content (RLS/tenant isolation, migrations, webhook tokens, cron internals, auth implementation) never appears in public pages.
- Don't document unshipped features (public MCP server, ClickHouse) as if they exist.
- Every new page needs frontmatter `title` + `description` (≤300 chars) — feeds the auto-generated llms.txt.

---

## Part 1 — Disposition of the 21 internal docs

### Stays internal (never port)

| Source doc | Why |
| --- | --- |
| `gotchas.md` | Engineering log of breaks and fixes. |
| `functionality-documentation/database-tenant-isolation.md` | Security-sensitive (RLS, roles, GUC policies). May inform a future high-level "Security" page — one paragraph, no architecture. |
| `functionality-documentation/transactional-email.md` | Internal wiring (Resend templates, escaping). |
| `betterauth-cutover-runbook.md` | Completed one-time ops runbook. |
| `intelligems-webhook-cutover-runbook.md` | Completed one-time ops runbook; contains webhook-token internals. |
| `integration-production-rollout.md` | Point-in-time migration checklist. |
| `shopify-compliance-runbook.md` | Internal ops. Could inform a future public "Data & privacy" page at high level only. |
| `cube-integration-spec.md` | Internal architecture handoff (partially self-superseded). |
| `cube-tremor-handoff.md` | Superseded handoff. |
| `widget-source-decoupling-handoff.md` | Internal architecture handoff. |
| `cro/airtable-mapping.md` | One-off import contract. |
| `plans/*` (all 6 briefs) | Internal proposals/plans. The MCP-server brief becomes source material for Developers pages **only when the MCP server ships**. |

### Source material for public pages

| Source doc | Feeds | Caveats |
| --- | --- | --- |
| `original-goal-docs/Aloftly-Vision-and-Goal.md` | `index` (done), feature-page framing | Vision language, not shipped-state claims. |
| `original-goal-docs/Aloftly-Analytics-Project-Overview.md` | `index` (done), integrations overview, features pages | Oldest doc — verify each claim against the app before using. |
| `functionality-documentation/experiment-os.md` | `features/experiments` | Drop DB/ICE-computation internals; keep the research → test ideas → experiments workflow and DRIP concepts at user level. |
| `functionality-documentation/ai-insights-engine.md` | `features/insights` | User-facing behavior only (severity badges, hypothesis box, "Get the evidence"). Omit the pipeline, detectors, prompts. Note: insights currently run manually, not on a schedule — keep copy honest. |
| `functionality-documentation/url-structure.md` | `account/organizations` | Only the user-visible facts: org in URL, store switching. No proxy/slug-registry internals. |
| App repo `PRODUCT.md` (root) | Voice/positioning source for every page | Brand personality, honest-positioning rule, audiences. |

### Cleanup recommendations for the app repo (William's cleanup pass, separate task)

- **Archive** (move to `docs/archive/` or delete): `cube-tremor-handoff.md` (superseded by widget-source-decoupling), `plans/6-11-2026-*`, `plans/6-12-2026-*` ×2 (superseded by the shipped `ai-insights-engine.md` functionality doc), `betterauth-cutover-runbook.md`, `intelligems-webhook-cutover-runbook.md`, `integration-production-rollout.md` (completed runbooks).
- **Update**: root `README.md` still says Supabase Auth + npm (now BetterAuth + pnpm); `cube-integration-spec.md` should fold §0 corrections into the body or be archived once the work completes.
- **Keep as-is**: `functionality-documentation/*` (canonical, current), `gotchas.md`, `original-goal-docs/*`, `shopify-compliance-runbook.md`, forward-looking `plans/2026-06-*` briefs.

---

## Part 2 — Target information architecture

Pages exist only in this map until written; only shipped pages go in `docs.json` navigation. Status: ✅ live · ⬜ not started.

### Tab: Documentation

**Get started**

| Status | Page | Scope |
| --- | --- | --- |
| ✅ | `index` | What Aloftly is, who it's for, capability overview. |
| ✅ | `quickstart` | Sign in → org → Shopify → stack → Overview. |

**Integrations**

| Status | Page | Scope |
| --- | --- | --- |
| ⬜ | `integrations/overview` | How connections work: connect flow, what syncing means, partial-stack behavior, disconnecting. No sync-engine internals. |
| ⬜ | `integrations/shopify` | Connect flow (OAuth install), what data syncs (orders, revenue), permissions requested and why. |
| ⬜ | `integrations/google-analytics-4` | Connect flow, property selection, what data syncs. |
| ⬜ | `integrations/microsoft-clarity` | Connect flow, what data syncs (heatmap/session signals). |
| ✅ | `integrations/intelligems` | Connect flow, synced metrics, Experiment OS linking, health states, troubleshooting. Source: `docs/integrations/intelligems.md` (2026-07-23). Lifecycle-webhook setup intentionally omitted — embargoed pending app-repo issue #227; revisit when resolved. |
| ⬜ | `integrations/knocommerce` | Connect flow, survey data. |
| ⬜ | `integrations/gorgias` | Connect flow, ticket sentiment. |
| ⬜ | `integrations/judgeme` | Connect flow, review data. |

**Features**

| Status | Page | Scope |
| --- | --- | --- |
| ⬜ | `features/overview` | The Overview briefing: insight cards, severity, hypothesis box, "Get the evidence". Honest about early-access cadence. |
| ⬜ | `features/experiments` | Experiment OS: research → ICE-scored test ideas → experiments; DRIP methodology at user level. |
| ⬜ | `features/dashboards` | Dashboard builder: creating dashboards, widgets, per-store scoping. |
| ⬜ | `features/reporting` | ROI/client reporting — **only when shipped**. |

**Account**

| Status | Page | Scope |
| --- | --- | --- |
| ⬜ | `account/organizations` | Orgs, workspaces, stores; switching stores; org URL. |
| ⬜ | `account/team` | Inviting members, roles. |
| ⬜ | `account/billing` | Plans, limits, managing billing. |

### Tab: Developers (create the tab only when the first page ships)

| Status | Page | Scope |
| --- | --- | --- |
| ⬜ | `developers/api` | Public API reference — **blocked until a public API ships**. |
| ⬜ | `developers/mcp-server` | Aloftly MCP server — **blocked until it ships** (see `plans/2026-06-25-aloftly-mcp-server-*.md` then). |

### Suggested writing order

1. `integrations/overview` + `integrations/shopify` (the first thing every new user does)
2. Remaining integration pages (one session can batch several — `integrations/intelligems` shipped 2026-07-23 and is the template)
3. `features/experiments` (strong source doc exists)
4. `features/overview`, `account/organizations`
5. `features/dashboards`, `account/team`, `account/billing`
6. `features/reporting`, Developers tab — as features ship

---

## Repo TODOs (not pages)

- [ ] Replace `logo/light.svg`, `logo/dark.svg`, `favicon.svg` with Aloftly brand assets (still Mintlify starter files).
- [ ] Confirm support email — `support@aloftly.com` is assumed in `docs.json`, `index.mdx`, `quickstart.mdx`.
- [ ] Rewrite `README.md` (still describes the Mintlify starter kit).
- [ ] Verify the Mintlify deployment's custom domain (docs.aloftly.com?) once decided.
- [ ] **Report stale edge cache on `docs.aloftly.com` to Mintlify support** — their edge serves 36–60h stale HTML from multiple builds, which breaks all sidebar navigation. Our DNS is correct; not fixable on our side. See [known-issues.md](known-issues.md).
