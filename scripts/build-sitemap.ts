#!/usr/bin/env tsx
/**
 * build-sitemap.ts — propertytaxpeek static sitemap generator.
 *
 * PRUNING HISTORY (HCU March 2026 Tier E — 2026-04-23):
 *   Pre-prune: ~5,765 URLs. Bloat source:
 *     /es/county/ × 2,781 — thin translation mirror over identical USDA data.
 *   Post-prune: ~2,985 URLs. Kept /county/ (2,780 — the matrix), /state/,
 *     /state/[slug]/homestead-exemption/, /state/[slug]/senior-exemption/.
 *   Route stays live via dynamicParams; just not announced to Google.
 *
 * State-compare pairs (C(51,2)=1275) already excluded from sitemap (2026-04-17).
 */
import * as fs from 'fs';
import * as path from 'path';

const SITE_URL = 'https://propertytaxpeek.com';
const NOW = new Date().toISOString().split('T')[0];
const SHARD_SIZE = 40000;
const OUT_DIR = path.resolve(__dirname, '..', 'public');

interface Entry { url: string; lastmod?: string; priority?: string; changefreq?: string; }

function urlTag(e: Entry): string {
  return `  <url><loc>${e.url}</loc><lastmod>${e.lastmod ?? NOW}</lastmod><changefreq>${e.changefreq ?? 'monthly'}</changefreq><priority>${e.priority ?? '0.6'}</priority></url>`;
}

function writeShard(id: number, entries: Entry[]) {
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + entries.map(urlTag).join('\n') + '\n</urlset>\n';
  fs.writeFileSync(path.join(OUT_DIR, `sitemap-${id}.xml`), xml);
}

const seen = new Set<string>();
const entries: Entry[] = [];
function add(e: Entry) { if (!seen.has(e.url)) { seen.add(e.url); entries.push(e); } }

// ── Load DB ──────────────────────────────────────────────────────────────────
import Database from 'better-sqlite3';
const db = new Database(path.resolve(__dirname, '..', 'data', 'taxes.db'), { readonly: true });

const counties = (db.prepare('SELECT slug FROM counties').all() as { slug: string }[]).map(r => r.slug);

db.close();

// HCU 2026-04-24: county-compare keep-set is the ONLY compare tree we
// announce. Everything else in county_comparisons (124,550 slugs) is
// 410'd via middleware — announcing it would be self-defeating.
import countyCompareKeep from '../lib/generated/county-compare-keep.json';

// ── States (51 entries — from lib/states-data.ts) ────────────────────────────
const states = [
  'alabama','alaska','arizona','arkansas','california','colorado','connecticut',
  'delaware','district-of-columbia','florida','georgia','hawaii','idaho',
  'illinois','indiana','iowa','kansas','kentucky','louisiana','maine','maryland',
  'massachusetts','michigan','minnesota','mississippi','missouri','montana',
  'nebraska','nevada','new-hampshire','new-jersey','new-mexico','new-york',
  'north-carolina','north-dakota','ohio','oklahoma','oregon','pennsylvania',
  'rhode-island','south-carolina','south-dakota','tennessee','texas','utah',
  'vermont','virginia','washington','west-virginia','wisconsin','wyoming',
];
// NOTE: state-compare pairs (C(51,2)=1275) excluded from sitemap (2026-04-17).
// Thin synthetic matrix is doorway-prone per Google scaled-content policy.
// Pages still render via /compare/[slug]/ generateStaticParams; just not announced in sitemap.

// ── Guides (matches lib/guides.ts — 5 items) ─────────────────────────────────
const guideSlugs = [
  'effective-vs-nominal-property-tax-rates',
  'state-by-state-property-tax-burden',
  'property-tax-exemptions-most-homeowners-miss',
  'why-property-taxes-vary-10x',
  'true-cost-of-owning-a-home',
];

// ── Insight articles (matches lib/insight-articles.ts — 3+2 items) ───────────
const insightSlugs = [
  'property-tax-trends-2026',
  'cheapest-states-homeowners',
  'property-tax-vs-income-tax',
];

// ── Blog (unique slugs from lib/blog.ts — 31 unique posts) ───────────────────
const blogSlugs = [
  'how-to-appeal-property-tax-assessment',
  'homestead-exemption-complete-guide',
  'how-property-tax-is-calculated',
  'senior-property-tax-exemptions-guide',
  'states-with-lowest-property-taxes',
  'property-tax-deduction-irs-guide',
  'new-jersey-highest-property-taxes-explained',
  'first-time-homebuyer-property-tax-guide',
  'texas-property-tax-complete-guide',
  'california-property-tax-proposition-13-guide',
  'how-to-appeal-property-tax-assessment-2026',
  'property-tax-exemptions-seniors-2026',
  'homestead-exemption-guide-by-state',
  'property-tax-when-buying-home',
  'commercial-vs-residential-property-tax',
  'property-tax-deduction-limits-salt',
  'lowest-property-tax-states-retirees',
  'property-tax-escrow-explained',
  'how-property-assessments-work',
  'property-tax-lien-investing-guide',
  'tax-abatement-programs-homeowners',
  'property-tax-impact-home-value',
  'challenging-property-tax-increase',
  'property-tax-relief-programs-veterans',
  'new-construction-property-tax-guide',
  'property-tax-appeal-step-by-step-guide',
  'states-with-lowest-property-taxes-2025',
  'property-tax-deduction-rules-2025',
  'tax-lien-investing-explained',
  'senior-property-tax-exemptions-by-state',
  'property-tax-vs-income-tax-comparison',
];

// ── Static pages ─────────────────────────────────────────────────────────────
add({ url: `${SITE_URL}/`, priority: '1.0', changefreq: 'monthly' });
add({ url: `${SITE_URL}/es/`, priority: '0.7', changefreq: 'monthly' });
add({ url: `${SITE_URL}/calculator/`, priority: '0.9', changefreq: 'monthly' });
add({ url: `${SITE_URL}/compare/`, priority: '0.8', changefreq: 'monthly' });
add({ url: `${SITE_URL}/guide/`, priority: '0.8', changefreq: 'weekly' });
add({ url: `${SITE_URL}/blog/`, priority: '0.8', changefreq: 'weekly' });
add({ url: `${SITE_URL}/insights/`, priority: '0.8', changefreq: 'weekly' });
add({ url: `${SITE_URL}/about/`, priority: '0.3', changefreq: 'yearly' });
add({ url: `${SITE_URL}/privacy/`, priority: '0.2', changefreq: 'yearly' });
add({ url: `${SITE_URL}/terms/`, priority: '0.2', changefreq: 'yearly' });
add({ url: `${SITE_URL}/contact/`, priority: '0.3', changefreq: 'yearly' });
add({ url: `${SITE_URL}/editorial-policy/`, priority: '0.3', changefreq: 'yearly' });
add({ url: `${SITE_URL}/corrections-policy/`, priority: '0.3', changefreq: 'yearly' });

// ── Guides ───────────────────────────────────────────────────────────────────
for (const g of guideSlugs) add({ url: `${SITE_URL}/guide/${g}/`, priority: '0.7', changefreq: 'monthly' });

// ── Insights ─────────────────────────────────────────────────────────────────
for (const s of insightSlugs) add({ url: `${SITE_URL}/insights/${s}/`, priority: '0.8', changefreq: 'monthly' });

// ── Blog ─────────────────────────────────────────────────────────────────────
for (const s of blogSlugs) add({ url: `${SITE_URL}/blog/${s}/`, priority: '0.7', changefreq: 'monthly' });

// ── State pages (dynamicParams=true → ISR, all states safe to include) ───────
for (const s of states) add({ url: `${SITE_URL}/state/${s}/`, priority: '0.9', changefreq: 'monthly' });

// ── State homestead-exemption pages (51, generateStaticParams dynamicParams=false) ─
for (const s of states) add({ url: `${SITE_URL}/state/${s}/homestead-exemption/`, priority: '0.8', changefreq: 'monthly' });

// ── State senior-exemption pages (51, Tier S HCU Batch 8 2026-04-21) ──────────
for (const s of states) add({ url: `${SITE_URL}/state/${s}/senior-exemption/`, priority: '0.8', changefreq: 'monthly' });

// ── County pages (dynamicParams=true → ISR, all 2780 counties) ───────────────
// EN matrix = the product. Keep all.
for (const c of counties) add({ url: `${SITE_URL}/county/${c}/`, priority: '0.7', changefreq: 'monthly' });

// ── /es/county/ mirror DROPPED (Tier E 2026-04-23) ───────────────────────────
// 2,781 thin translations over identical USDA county tax data, zero GSC signal.
// Route stays live via dynamicParams; just not announced to Google.

// ── State/County compare pages excluded from sitemap (2026-04-17) ────────────
// Thin synthetic matrix removed — see top-of-file NOTE.
// Pages still render; just not announced to Google to prevent doorway flag.

// ── County-compare keep-set (HCU 2026-04-24) ─────────────────────────────────
// 100 canonical same-state pairs (both counties >=100K pop, 5-per-state cap).
// Only canonical direction (a < b lexicographically) to avoid duplicate
// submissions — reverses render but aren't announced.
const countyCompareSet = countyCompareKeep as string[];
const canonicalPairs = countyCompareSet.filter((slug) => {
  const m = slug.match(/^(.+)-vs-(.+)$/);
  return m && m[1] < m[2];
});
for (const s of canonicalPairs) add({ url: `${SITE_URL}/county-compare/${s}/`, priority: '0.6', changefreq: 'monthly' });

// ─── Cardinality guard ────────────────────────────────────────────────────
if (entries.length > 4000 && !process.env.SITEMAP_LARGE_OK) {
  throw new Error(
    `propertytaxpeek sitemap has ${entries.length.toLocaleString()} URLs — Tier E budget is ~3,000.\n` +
      `Did /es/county/ (2.8K) get re-added?\n` +
      `That's exactly the loop that caused the original cardinality collapse.\n` +
      `Run with SITEMAP_LARGE_OK=1 if you genuinely meant to expand the tier.`,
  );
}

// ── Cleanup old sitemap files ────────────────────────────────────────────────
for (const f of fs.readdirSync(OUT_DIR)) {
  if (/^sitemap(-\d+)?\.xml$/.test(f)) fs.unlinkSync(path.join(OUT_DIR, f));
}
const oldDir = path.join(OUT_DIR, 'sitemap');
if (fs.existsSync(oldDir)) fs.rmSync(oldDir, { recursive: true, force: true });

// ── Write shards ─────────────────────────────────────────────────────────────
const shardCount = Math.ceil(entries.length / SHARD_SIZE);
if (shardCount <= 1) {
  writeShard(0, entries);
  fs.renameSync(path.join(OUT_DIR, 'sitemap-0.xml'), path.join(OUT_DIR, 'sitemap.xml'));
} else {
  for (let i = 0; i < shardCount; i++) writeShard(i, entries.slice(i * SHARD_SIZE, (i + 1) * SHARD_SIZE));
  const idx = '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    Array.from({ length: shardCount }, (_, i) => `  <sitemap><loc>${SITE_URL}/sitemap-${i}.xml</loc><lastmod>${NOW}</lastmod></sitemap>`).join('\n') + '\n</sitemapindex>\n';
  fs.writeFileSync(path.join(OUT_DIR, 'sitemap.xml'), idx);
}
console.log(`propertytaxpeek: ${entries.length} URLs, ${shardCount || 1} shard(s)`);
