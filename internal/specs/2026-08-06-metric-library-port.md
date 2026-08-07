# Metric Library → Mintlify port spec

**Date:** 2026-08-06
**Source:** `C:\Users\billy\Documents\GitHub\aloftly-analytics\docs\metrics\` — 109 metric pages + `index.md`, generated from `src/lib/metrics/metric-library.ts`
**Decisions (William, 2026-08-06):** strip internal implementation details but keep formulas; extend the generator to emit Mintlify MDX rather than hand-porting.

Companion files: [metric-library-nav.json](metric-library-nav.json) (complete generated nav block), [../handoff-metric-library-generator.md](../handoff-metric-library-generator.md) (pasteable prompt for the app repo).

## Layout decision

A **separate `Metric library` tab**, with one collapsed group per source. Not merged into fewer pages.

At rest the tab shows 10 rows (overview + 9 collapsed groups); the product-docs sidebar is untouched because it is a different tab. This is the same shape as an API reference, which is what this content is: 109 uniform, generated pages reached by search or by links from feature pages, not browsed linearly.

| Group | Pages |
| --- | --- |
| Overview (`metrics/index`) | 1 |
| Shopify | 23 |
| Google Analytics 4 | 7 |
| Microsoft Clarity | 9 |
| Intelligems | 15 |
| Gorgias | 4 |
| KnoCommerce | 3 |
| Judge.me | 8 |
| Experiment OS | 18 |
| Aloftly calculations | 22 |

Groups mirror the source folders and the `##` sections in `index.md`. Every group carries `"expanded": false`.

### Why not one page per source with accordions

Considered and rejected as the primary structure. The Shopify page would reach ~1,900 lines, and — more importantly — 109 separate pages means 109 separate frontmatter `description` values feeding the auto-generated `llms.txt`. Each metric becomes its own retrievable entry for AI agents and site search ("Average order value" rather than "Shopify metrics"). For a product positioned as the data layer other tools query, that discoverability outweighs a shorter sidebar.

Accordions are still used, but **inside** each metric page for the dense reference sections.

## Output shape

- Extension `.mdx` (not `.md`).
- Path `metrics/<group-folder>/<slug>.mdx`; the hub at `metrics/index.mdx` → URL `/metrics`.
- No `# H1` in the body — Mintlify renders the frontmatter `title` as the heading.

### Frontmatter

| Source key | Action |
| --- | --- |
| `title` | keep |
| `description` | keep (must stay ≤300 characters — feeds `llms.txt`) |
| `status` | drop the key; when not `active`, emit `tag: "Supporting"` or `tag: "Planned"` so the sidebar shows a badge |
| `audience`, `visibility`, `last_reviewed`, `implementation_state`, `metric_key`, `semantic_version`, `related_issues`, `implementation_commits`, `generated_from` | **drop** |

Add `sidebarTitle` only where needed (see collisions below).

### Section-by-section transform

| Source section | Action |
| --- | --- |
| `<!-- Generated from src/lib/... -->` | replace with `{/* Generated file — do not edit by hand. */}` — MDX comment syntax, and **no internal path** |
| `# <title>` | drop |
| Contract table | keep verbatim |
| `## Definition` | **drop** — identical to `description`, which Mintlify already renders under the title |
| `## Exact calculation or transform` | rename `## How it's calculated`; keep the semantic formula only; **drop the `Cube measure SQL:` line** (10 files) |
| `### Provider fields and operands` | rename `### Built from`; omit the section entirely when the value is `None.` |
| `## Lineage` | **drop entirely** — contains `src/lib/...` paths (all 109 files). The useful content is already in *Built from*. |
| `## Grain and identity` + `### Join and identity keys` | merge into accordion **Grain and identity** |
| `## Filters and boundaries` | accordion **Filters and boundaries** |
| `## Timezone`, `## Currency`, `## Freshness and backfill` | merge into accordion **Timezone, currency, and freshness** |
| `## Known caveats` | keep visible — most load-bearing content for correct use |
| `## Where this appears` | keep visible |
| `## Version history` | accordion **Version history**; keep Date and Change columns, **drop `Changed by`** (always "Aloftly Engineering") and **drop `Reference`** (commit SHAs) |

## MDX escaping — required, or the build fails

`.md` tolerates characters that `.mdx` does not.

1. **Bare `<` is parsed as a JSX tag.** 50 files contain `- Reads use a half-open interval: recorded_at >= start and recorded_at < end.` Wrap the expression in backticks: `` `recorded_at >= start` and `recorded_at < end` ``.
2. **Bare `{` is parsed as a JS expression.** 4 files affected. Wrap in backticks or escape as `&#123;`.

The safest generator rule: emit any literal containing `<`, `>`, `{`, or `}` inside inline code or a fenced block.

## Link rewriting

`index.md` uses relative links (`./shopify/aov`). Mintlify wants absolute, extensionless paths: `/metrics/shopify/aov`.

## Sidebar titles

Titles repeat their source name inside a group already named for that source ("Intelligems conversion rate" inside **Intelligems**). Emit `sidebarTitle` with the redundant prefix stripped.

One true collision needs disambiguation — both GA4 pages are titled "Page views" and sit in the same group:

| Page | `sidebarTitle` |
| --- | --- |
| `ga4/page-views` (`ga4.page_views`, by acquisition and device segment) | `Page views (by segment)` |
| `ga4/page-engagement` (`ga4.page_engagement`, per page and day) | `Page views (per page)` |

"Sessions" (Shopify / GA4 / Clarity) and "Page sessions" (GA4 / Clarity) repeat across *different* groups, which the sidebar already disambiguates. Leave them.

## Golden example

Source `shopify/aov.md` → target `metrics/shopify/aov.mdx`:

````mdx
---
title: "Average order value"
description: "Shopify-admin AOV from gross sales plus discounts divided by sales-report orders."
---

{/* Generated file — do not edit by hand. */}

| Contract | Value |
| --- | --- |
| Metric key | `shopify.aov` |
| Source | Shopify |
| Status | active |
| Type | derived |
| Semantic version | 1 |
| Catalog visibility | Picker-eligible |

## How it's calculated

```text
(sum(shopify.gross_sales) + sum(shopify.discounts)) / nullif(sum(shopify.sales_orders), 0)
```

### Built from

- `shopify.gross_sales`
- `shopify.discounts`
- `shopify.sales_orders`

## Known caveats

- Ratio of sums; never average daily AOV rows.

## Where this appears

- Overview KPI strip
- Dashboard builder

<AccordionGroup>
  <Accordion title="Grain and identity" icon="ruler">
    `derived_period`; entity: store; same-day fold: sum; additivity: `non_additive`.

    **Join and identity keys:** none.
  </Accordion>
  <Accordion title="Filters and boundaries" icon="filter">
    - Organization and store are resolved from the authenticated request.
    - Reads use a half-open interval: `recorded_at >= start` and `recorded_at < end`.
    - ShopifyQL sales values are used as reported; no extra paid-order filter is added by Aloftly.
  </Accordion>
  <Accordion title="Timezone, currency, and freshness" icon="clock">
    **Timezone.** ShopifyQL groups by the shop reporting date; Aloftly stores that date as a UTC-midnight label. Order lifecycle events retain their provider timestamp.

    **Currency.** Currency values use Shopify shop-money amounts. Aloftly does not perform foreign-exchange conversion; mixed-currency all-store totals must not be interpreted as converted currency.

    **Freshness.** Computed by Cube at read time.
  </Accordion>
  <Accordion title="Version history" icon="clock-rotate-left">
    | Date | Change |
    | --- | --- |
    | 2026-08-03 | Bound the metric to the executable certified semantic release. |
    | 2026-07-27 | Registered Shopify authority and metric contracts in the semantic catalog. |
  </Accordion>
</AccordionGroup>
````

Removed versus the source: the `src/lib` lineage list, the Cube measure SQL line, the duplicate Definition section, the H1, commit SHAs, and all non-Mintlify frontmatter.

## Overview page

`index.md` → `metrics/index.mdx`, keeping the Shared query rules and all nine tables (they are an effective scan-and-jump hub). Changes: drop the H1 and the internal frontmatter, rewrite links to absolute paths, and drop the "generated from `src/lib/...`" sentence in the intro — replace with wording that does not name an internal file.

## docs.json wiring

The site currently uses top-level `navigation.groups`. Adding a tab means moving to `navigation.tabs`, with the existing product docs as the first tab:

```json
"navigation": {
  "tabs": [
    { "tab": "Documentation", "groups": [ /* existing Get started + Integrations groups */ ] },
    { "tab": "Metric library", "groups": [ /* see metric-library-nav.json */ ] }
  ]
}
```

Do not add the tab until the pages exist — Mintlify groups cannot be empty and missing pages break the build.

## Verification

```bash
npx mint@latest broken-links     # all 110 pages resolve
npx mint@latest dev              # confirms MDX parses (catches the < and { issues)
```
