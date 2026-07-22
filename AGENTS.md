# Aloftly documentation — agent instructions

## About this project

- Public documentation site for **Aloftly** ([aloftly.com](https://aloftly.com)), built on [Mintlify](https://mintlify.com). The live app is at [app.aloftly.com](https://app.aloftly.com).
- Pages are MDX files with YAML frontmatter. Site configuration lives in `docs.json`.
- Pushing to `main` deploys the live site — treat `main` as production. Only finished pages go in the navigation; the target structure for unwritten pages lives in `internal/porting-map.md`.
- Use the Mintlify MCP server (`https://mcp.mintlify.com`) to edit content and settings via MCP. Use the Mintlify docs MCP server (`https://www.mintlify.com/docs/mcp`) to query how Mintlify itself works.
- `llms.txt` and `skill.md` are **auto-generated** by Mintlify from the deployed site — never create or edit them manually. They are fed by the `description` field in `docs.json` and each page's frontmatter `description`.

## About Aloftly (the product)

- Aloftly is the **unified CRO intelligence layer for Shopify**. It pulls data from every on-site optimization tool into one place, turns that data into ranked, evidence-backed A/B test hypotheses, and proves the ROI of optimization work in dollars.
- It is **not** marketing-attribution analytics (Triple Whale / Polar territory). It unifies *on-site CRO signals*: heatmaps, A/B tests, surveys, support sentiment, reviews.
- Supported integrations (exact names): **Shopify, Google Analytics 4, Microsoft Clarity, Intelligems, KnoCommerce, Gorgias, Judge.me**.
- Audiences in priority order: (1) **CRO freelancers and agencies** managing multiple client Shopify stores — write for this reader first; (2) Shopify store owners ($1M+ revenue); (3) enterprise/multi-brand operators.
- Source of truth for product behavior: the app repo at `C:\Users\billy\Documents\GitHub\aloftly-analytics` (**read-only** — never modify it). Its `/docs/` folder holds internal engineering docs; `internal/porting-map.md` in this repo says which of those may inform public pages.

## Terminology

| Use | Not | Notes |
| --- | --- | --- |
| organization (org) | team, account | Top-level tenant. Orgs contain workspaces and stores. |
| workspace | project | Groups stores within an org (agencies: one per client). |
| store | site, shop | A connected Shopify storefront. |
| integration | connector, plugin | One of the 7 supported tools. |
| insight | alert, notification | AI-generated, severity-badged finding on the Overview. |
| Experiment OS | experiments module | The research → test ideas → experiments workflow. |
| test idea | idea, ticket | ICE-scored backlog item in Experiment OS. |
| Overview | homepage, home dashboard | The proactive briefing page: what changed, what it means, what to do. |
| dashboard | report | A user-built dashboard from the dashboard builder. |

## Voice & style

- Voice: confident, precise, honest — an expert CRO operator. Institutional SaaS ("Bloomberg terminal meets Linear"). No hype, no filler.
- **Honest positioning is a hard rule.** Aloftly is early access; describe early-stage features as early-stage and never overstate what exists. Credibility is the product's core asset.
- Use active voice and second person ("you").
- Keep sentences concise — one idea per sentence.
- Use sentence case for headings.
- Bold for UI elements: Click **Settings**.
- Code formatting for file names, commands, paths, and code references.
- **Every page MUST have frontmatter `title` and `description` (≤300 characters).** Descriptions feed the auto-generated `llms.txt`, so make them specific and self-contained.
- Never link to a page that doesn't exist yet.

### Components

Prefer prose; use components where they genuinely aid scanning:

- `<Steps>` for sequential instructions.
- `<Accordion>` / `<AccordionGroup>` for progressive disclosure — FAQs, per-tool detail, optional depth. Give accordions an `icon` where it aids scanning; accordion opens update the URL hash, so titles should be stable and link-worthy.
- `<Card>` / `<CardGroup>` for navigation to other pages.
- `<Note>` / `<Warning>` / `<Tip>` for callouts — sparingly.

## Content boundaries

- **Never document internal architecture**: database schema, RLS/tenant isolation, migrations, Inngest/cron internals, webhook tokens or routing, auth implementation, infra topology.
- **Never document unshipped features** (public MCP server, ClickHouse migration, v2 proposals) as if they exist.
- **Never copy internal docs verbatim** — they are engineering references; rewrite for the user's task and altitude.
- Don't document internal admin tooling or pricing beyond what Aloftly publishes elsewhere.

## Workflow

- `internal/` is excluded from publishing via `.mintignore` — specs, the porting map, and planning notes live there.
- To add a page: consult `internal/porting-map.md` for the target IA and that page's scope note, write the MDX file, **and** add it to `docs.json` navigation. Update the map's status column when a page ships.
- Prefer editing locally with git. The Mintlify MCP `checkout`/`save` flow is an alternative that publishes via PR.
