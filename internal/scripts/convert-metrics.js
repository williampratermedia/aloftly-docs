/* Regenerate the Metric library pages.
   Run from the repo root:  node internal/scripts/convert-metrics.js
   Then:                    npx mint@latest validate
   Rewrites metrics/ from scratch and refreshes internal/specs/metric-library-nav.json.
   Paste that nav block into docs.json when metrics are added or removed.

   Convert aloftly-analytics/docs/metrics/*.md -> aloftly-docs/metrics/*.mdx
   Implements internal/specs/2026-08-06-metric-library-port.md */
const fs = require('fs'), path = require('path');

const SRC = 'C:/Users/billy/Documents/GitHub/aloftly-analytics/docs/metrics';
const OUT = 'c:/Users/billy/Documents/GitHub/aloftly-docs/metrics';

const GROUPS = [
  ['shopify', 'Shopify'], ['ga4', 'Google Analytics 4'], ['clarity', 'Microsoft Clarity'],
  ['intelligems', 'Intelligems'], ['gorgias', 'Gorgias'], ['knocommerce', 'KnoCommerce'],
  ['judgeme', 'Judge.me'], ['experiment-os', 'Experiment OS'], ['application', 'Aloftly calculations'],
];

const SIDEBAR_OVERRIDES = {
  'ga4/page-views': 'Page views (by segment)',
  'ga4/page-engagement': 'Page views (per page)',
};

const warnings = [];

/* Escape MDX-hostile chars in prose, leaving inline-code spans untouched. */
function esc(text) {
  return text.split(/(`[^`]*`)/).map((seg, i) =>
    i % 2 === 1 ? seg : seg.replace(/</g, '&lt;').replace(/\{/g, '&#123;').replace(/\}/g, '&#125;')
  ).join('');
}

/* Escape a whole block, skipping fenced code. */
function escBlock(block) {
  let inFence = false;
  return block.split('\n').map(line => {
    if (/^\s*```/.test(line)) { inFence = !inFence; return line; }
    return inFence ? line : esc(line);
  }).join('\n');
}

function parse(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error('no frontmatter');
  const fm = {};
  for (const line of m[1].split('\n')) {
    const k = line.match(/^([a-z_]+):\s*(.*)$/);
    if (k) fm[k[1]] = k[2].replace(/^"(.*)"$/, '$1');
  }
  let body = m[2].replace(/<!--[\s\S]*?-->\n*/g, '').replace(/^#\s+.*\n+/m, '');
  return { fm, body };
}

/* Split body into { heading -> content }, preserving the pre-heading contract table. */
function sections(body) {
  const out = { _intro: '' };
  let cur = '_intro';
  for (const line of body.split('\n')) {
    const h = line.match(/^###?\s+(.*)$/);
    if (h) { cur = h[1].trim(); out[cur] = ''; }
    else out[cur] = (out[cur] || '') + line + '\n';
  }
  // Escape source-derived prose here, BEFORE it is wrapped in generated JSX,
  // so the component tags we emit are never escaped themselves.
  for (const k of Object.keys(out)) out[k] = escBlock(out[k].trim());
  return out;
}

function calcBlock(text) {
  // keep the fenced block, drop the Cube SQL line and the "Semantic formula:" label
  return text.split('\n')
    .filter(l => !/^Cube measure SQL:/.test(l.trim()))
    .map(l => l.replace(/^Semantic formula:\s*/, ''))
    .join('\n').trim();
}

function operands(text) {
  if (!text || /^none\.?$/i.test(text.trim())) return null;
  return text.split('\n').map(l => {
    const m = l.match(/^-\s+(.*)$/);
    return m ? `- \`${m[1].trim()}\`` : l;
  }).join('\n');
}

function versionTable(text) {
  const rows = text.split('\n').filter(l => l.trim().startsWith('|'));
  if (rows.length < 2) return null;
  const cells = r => r.split('|').slice(1, -1).map(c => c.trim());
  const head = cells(rows[0]);
  const iDate = head.indexOf('Date'), iChange = head.indexOf('Change');
  if (iDate < 0 || iChange < 0) return null;
  const body = rows.slice(2).map(r => { const c = cells(r); return `| ${c[iDate]} | ${c[iChange]} |`; });
  return ['| Date | Change |', '| --- | --- |', ...body].join('\n');
}

function accordion(title, icon, content) {
  // flush-left content: avoids 4-space-indent being read as a code block inside JSX
  return `<Accordion title="${title}" icon="${icon}">\n\n${content}\n\n</Accordion>`;
}

function convertMetric(dir, groupLabel, file) {
  const slug = file.replace(/\.md$/, '');
  const raw = fs.readFileSync(path.join(SRC, dir, file), 'utf8');
  const { fm, body } = parse(raw);
  const s = sections(body);

  // ---- frontmatter
  if ((fm.description || '').length > 300) warnings.push(`description >300 chars: ${dir}/${file}`);
  let sidebar = SIDEBAR_OVERRIDES[`${dir}/${slug}`];
  if (!sidebar && fm.title.toLowerCase().startsWith(groupLabel.toLowerCase() + ' ')) {
    const t = fm.title.slice(groupLabel.length + 1);
    sidebar = t.charAt(0).toUpperCase() + t.slice(1);
  }
  const fmOut = [`title: "${fm.title.replace(/"/g, '\\"')}"`];
  if (sidebar) fmOut.push(`sidebarTitle: "${sidebar}"`);
  fmOut.push(`description: "${(fm.description || '').replace(/"/g, '\\"')}"`);
  if (fm.status === 'supporting') fmOut.push(`tag: "Supporting"`);
  if (fm.status === 'planned') fmOut.push(`tag: "Planned"`);

  // ---- visible body
  const parts = [];
  parts.push(s._intro);                                   // contract table
  parts.push('## How it\'s calculated\n\n' + calcBlock(s['Exact calculation or transform'] || ''));
  const ops = operands(s['Provider fields and operands']);
  if (ops) parts.push('### Built from\n\n' + ops);
  if (s['Known caveats']) parts.push('## Known caveats\n\n' + s['Known caveats']);
  if (s['Where this appears']) parts.push('## Where this appears\n\n' + s['Where this appears']);

  // ---- accordions
  const acc = [];
  const join = s['Join and identity keys'];
  let grain = s['Grain and identity'] || '';
  if (join && !/^none\.?$/i.test(join.trim())) grain += `\n\n**Join and identity keys**\n\n${join}`;
  else grain += `\n\n**Join and identity keys:** none.`;
  acc.push(accordion('Grain and identity', 'ruler', grain.trim()));
  if (s['Filters and boundaries']) acc.push(accordion('Filters and boundaries', 'filter', s['Filters and boundaries']));
  const tcf = [];
  if (s['Timezone']) tcf.push(`**Timezone.** ${s['Timezone']}`);
  if (s['Currency']) tcf.push(`**Currency.** ${s['Currency']}`);
  if (s['Freshness and backfill']) tcf.push(`**Freshness.** ${s['Freshness and backfill']}`);
  if (tcf.length) acc.push(accordion('Timezone, currency, and freshness', 'clock', tcf.join('\n\n')));
  const vh = versionTable(s['Version history'] || '');
  if (vh) acc.push(accordion('Version history', 'clock-rotate-left', vh));
  parts.push('<AccordionGroup>\n\n' + acc.join('\n\n') + '\n\n</AccordionGroup>');

  const out = `---\n${fmOut.join('\n')}\n---\n\n{/* Generated file — do not edit by hand. */}\n\n`
    + parts.filter(Boolean).join('\n\n') + '\n';

  const dest = path.join(OUT, dir, slug + '.mdx');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, out);
  return { slug: `metrics/${dir}/${slug}`, title: fm.title };
}

function convertIndex() {
  const raw = fs.readFileSync(path.join(SRC, 'index.md'), 'utf8');
  const { fm, body } = parse(raw);
  let b = body
    .replace(/^The source of truth[\s\S]*?directly\.\s*$/m,
      'These definitions are generated from the same certified semantic catalog that Aloftly\'s query and AI layers use, so a metric means the same thing everywhere it appears.\n')
    .replace(/\]\(\.\/([a-z0-9-]+)\/([a-z0-9-]+)\)/g, '](/metrics/$1/$2)');
  const desc = 'Canonical definitions, formulas, grain, filters, and caveats for every metric Aloftly displays.';
  const out = `---\ntitle: "${fm.title}"\ndescription: "${desc}"\n---\n\n`
    + `{/* Generated file — do not edit by hand. */}\n\n` + escBlock(b.trim()) + '\n';
  fs.writeFileSync(path.join(OUT, 'index.mdx'), out);
}

// ---- run
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
convertIndex();
const nav = [{ group: 'Overview', pages: ['metrics/index'] }];
let total = 1;
for (const [dir, label] of GROUPS) {
  const rows = fs.readdirSync(path.join(SRC, dir)).filter(f => f.endsWith('.md'))
    .map(f => convertMetric(dir, label, f))
    .sort((a, b) => a.title.localeCompare(b.title));
  nav.push({ group: label, expanded: false, pages: rows.map(r => r.slug) });
  total += rows.length;
}
fs.writeFileSync('c:/Users/billy/Documents/GitHub/aloftly-docs/internal/specs/metric-library-nav.json',
  JSON.stringify({ tab: 'Metric library', groups: nav }, null, 2) + '\n');
console.log(`wrote ${total} pages`);
if (warnings.length) { console.log('WARNINGS:'); warnings.forEach(w => console.log('  ' + w)); }
