# Handoff prompt — emit Mintlify MDX from the metric library generator

Paste the block below into a Claude Code session opened in **`C:\Users\billy\Documents\GitHub\aloftly-analytics`**. It is self-contained; the full spec is referenced by absolute path so the session can read it.

---

Extend the metric library documentation generator so it emits Mintlify-ready MDX for our public docs site, in addition to the internal Markdown it already produces.

**Context**

- The generator is `src/lib/metrics/metric-library.ts`. It currently writes `docs/metrics/` — an `index.md` hub plus 109 metric pages across 9 source folders (`shopify`, `ga4`, `clarity`, `intelligems`, `gorgias`, `knocommerce`, `judgeme`, `experiment-os`, `application`). Every page carries the banner "Do not edit by hand."
- The public docs site is a separate Mintlify repo at `C:\Users\billy\Documents\GitHub\aloftly-docs`. Its pages are MDX with YAML frontmatter; site config is `docs.json`.
- The complete target specification is at `C:\Users\billy\Documents\GitHub\aloftly-docs\internal\specs\2026-08-06-metric-library-port.md`. **Read it first** — it contains the exact section-by-section transform table and a golden example (`shopify/aov.md` → `metrics/shopify/aov.mdx`). The generated navigation block is alongside it at `internal/specs/metric-library-nav.json`.

**What to build**

Add a public MDX emitter — a new output target, ideally behind a flag or a separate script (e.g. `pnpm docs:metrics:public`) — that writes to a configurable output directory so it can target the docs repo. Keep the existing internal Markdown output unchanged.

**Hard requirements**

1. **Strip internal implementation.** The public output must not contain: `src/lib/...` paths (the entire `## Lineage` section — every one of the 109 pages has them), the `Cube measure SQL:` line (10 pages), commit SHAs, `related_issues`, or `generated_from`. Keep the **semantic formula** — that is the user-facing contract and is explicitly in scope.
2. **MDX escaping, or the build fails.** `.mdx` parses a bare `<` as a JSX tag and a bare `{` as a JS expression. 50 pages currently emit `recorded_at >= start and recorded_at < end` as plain prose, and 4 pages contain a bare `{`. Emit any literal containing `<`, `>`, `{`, or `}` inside inline code or a fenced block.
3. **Frontmatter.** Emit only `title`, `description` (≤300 characters), plus `sidebarTitle` where the spec calls for it and `tag: "Supporting"` / `tag: "Planned"` for non-active metrics. Drop every other key. Use MDX comment syntax `{/* ... */}` for the do-not-edit banner, with no internal path in it.
4. **No `# H1` in the body** — Mintlify renders the frontmatter `title`.
5. **Accordions.** Wrap Grain and identity, Filters and boundaries, Timezone/currency/freshness, and Version history in an `<AccordionGroup>`. Keep the contract table, How it's calculated, Known caveats, and Where this appears visible. Exact shape is in the spec's golden example.
6. **Absolute links.** Rewrite `./shopify/aov` to `/metrics/shopify/aov` throughout the index hub.
7. **Emit the nav block.** Also generate the `docs.json` navigation JSON for the `Metric library` tab (9 groups, each `"expanded": false`, pages sorted by title) so the docs repo can be updated mechanically rather than by hand.

**Do not**

- Modify anything under `docs/metrics/` that the internal pipeline depends on.
- Hand-write MDX files as a one-off — the whole point is that regeneration stays the source of truth.

**Verify before finishing**

Write the output into the docs repo at `metrics/`, add the nav block to its `docs.json`, then from `C:\Users\billy\Documents\GitHub\aloftly-docs` run:

```bash
npx mint@latest broken-links   # all 110 pages must resolve
npx mint@latest dev            # must start clean — this is what catches unescaped < and {
```

Spot-check `metrics/shopify/aov.mdx` against the golden example in the spec, and confirm no output file matches `grep -rl 'src/lib\|Cube measure SQL' metrics/`.

---

## After the generator runs

In the docs repo:

1. Restructure `docs.json` from `navigation.groups` to `navigation.tabs`, moving the existing Get started and Integrations groups under a `Documentation` tab and adding the `Metric library` tab. The tab must not be added before the pages exist — empty groups break the Mintlify build.
2. Update `internal/porting-map.md` to mark the metric library shipped.
3. Note that `docs.aloftly.com` currently has a stale-cache defect that breaks sidebar navigation (see [known-issues.md](known-issues.md)); review on `aloftly.mintlify.app` until it is resolved.
