// HCU 2026-04-24 keep-set builder for propertytaxpeek.
//
// Problem context: site has 40k indexed pages earning real traffic on
// /county/* — this is the valuable surface. The programmatic bloat is
// /county-compare/[slug] with dynamicParams=true + 124,750 rows in
// county_comparisons. Google discovered ~34k of these (5,588 "crawled not
// indexed" + 28,221 "duplicate no canonical" + 5,587 5xx from on-demand
// render failures). We keep /county/* untouched and collapse /county-compare/
// down to a curated 100-slug keep-set.
//
// Also covers the /es/county/ mirror — 2,780 thin Spanish pages that were
// already dropped from sitemap but still render 200 (dead weight).
//
// Emits:
//   - lib/generated/county-compare-keep.json — array of ~100 slugs
//     (forward + reverse both included for middleware keep-check)
//
// Selection rules for county-compare:
//   - Same state only (realistic property-tax search intent — e.g.
//     "orange county vs los angeles county" within CA; cross-state
//     property tax comparisons are academic, not search-driven).
//   - Both counties population >= 100K (bigger = more query intent).
//   - Cap at 5 pairs per state → 20+ state coverage vs CA-dominated list.
//   - Rank within state by combined population DESC.

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'taxes.db');
const OUT_DIR = path.join(process.cwd(), 'lib', 'generated');

// HCU 2026-05-04 — Bing impressions auto-union (separate index from Google).
const BING_JSON_DIR = path.resolve(process.cwd(), '..', '_shared', 'data', 'bing_analyze');
const BING_DOMAIN = 'propertytaxpeek.com';
const BING_MIN_IMP = 1;

function loadBingSlugs(routeRe: RegExp): string[] {
  if (!fs.existsSync(BING_JSON_DIR)) return [];
  const files = fs.readdirSync(BING_JSON_DIR)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort();
  if (!files.length) return [];
  try {
    const json = JSON.parse(fs.readFileSync(path.join(BING_JSON_DIR, files[files.length - 1]), 'utf8'));
    const site = json[BING_DOMAIN];
    if (!site || !Array.isArray(site.pages)) return [];
    const out = new Map<string, number>();
    for (const pg of site.pages) {
      const url = String(pg.url || '');
      const pathOnly = url.replace(/^https?:\/\/[^/]+/, '');
      const m = routeRe.exec(pathOnly);
      if (!m) continue;
      const slug = decodeURIComponent(m[1]);
      const imp = Number(pg.impressions) || 0;
      out.set(slug, (out.get(slug) || 0) + imp);
    }
    return [...out.entries()].filter(([, i]) => i >= BING_MIN_IMP).map(([s]) => s);
  } catch {
    return [];
  }
}

const COMPARE_CAP = 100;
const PER_STATE_CAP = 5;
const MIN_POP = 100_000;

// GSC evidence override: /county-compare/ slugs that earned >= 1 click in
// the 28d window (2026-03-24 ~ 2026-04-21) per get_gsc_report MCP. These
// are unconditionally kept regardless of population/same-state rules —
// rule #1 is "don't kill pages Google is sending traffic to." First pass
// of the keep-set missed 4 of these (cross-state pairs + same-state
// pairs that lost the 5-per-state lottery). Refresh this list each time
// we re-cut the keep-set by pulling get_gsc_report.
const GSC_EVIDENCE_SLUGS = [
  'allegheny-county-pa-vs-washington-county-pa',
  'montgomery-county-al-vs-harris-county-tx',
  'lake-county-il-vs-sumter-county-fl',
  'st-louis-city-mo-vs-st-louis-county-mo',
];

function main() {
  const db = new Database(DB_PATH, { readonly: true, fileMustExist: true });

  type Row = { slug: string; state: string; combined_pop: number; county_a_slug: string; county_b_slug: string };
  const rows = db.prepare(`
    WITH ranked AS (
      SELECT
        cc.slug,
        cc.county_a_slug,
        cc.county_b_slug,
        ca.state,
        (ca.population + cb.population) AS combined_pop,
        ROW_NUMBER() OVER (
          PARTITION BY ca.state
          ORDER BY (ca.population + cb.population) DESC, cc.slug
        ) AS rn_in_state
      FROM county_comparisons cc
      JOIN counties ca ON cc.county_a_slug = ca.slug
      JOIN counties cb ON cc.county_b_slug = cb.slug
      WHERE ca.state = cb.state
        AND ca.population >= ?
        AND cb.population >= ?
    )
    SELECT slug, state, combined_pop, county_a_slug, county_b_slug
    FROM ranked
    WHERE rn_in_state <= ?
    ORDER BY combined_pop DESC, slug
    LIMIT ?
  `).all(MIN_POP, MIN_POP, PER_STATE_CAP, COMPARE_CAP) as Row[];

  // Include both forward and reverse for middleware keep-check. The route
  // page.tsx generateStaticParams does the same pattern.
  const keepSet = new Set<string>();
  for (const r of rows) {
    keepSet.add(r.slug);
    const reverse = `${r.county_b_slug}-vs-${r.county_a_slug}`;
    if (reverse !== r.slug) keepSet.add(reverse);
  }

  // Union in GSC-evidence slugs (+ reverses). These may not have been
  // selected by the algorithmic rules but are earning real clicks.
  let gscAdded = 0;
  for (const slug of GSC_EVIDENCE_SLUGS) {
    if (!keepSet.has(slug)) { keepSet.add(slug); gscAdded++; }
    const m = slug.match(/^(.+)-vs-(.+)$/);
    if (m) {
      const reverse = `${m[2]}-vs-${m[1]}`;
      if (!keepSet.has(reverse)) { keepSet.add(reverse); gscAdded++; }
    }
  }
  // Bing union — DB existence check on county_comparisons.slug.
  // NOTE: route is /county-compare/ (not /compare/ — that's the state-vs-state
  // page with its own inline STATIC_COMPARISON_SLUGS in app/compare/[slug]/page.tsx).
  const bingCompares = loadBingSlugs(/^\/county-compare\/([^/]+)\/?$/);
  let bingAdded = 0;
  for (const slug of bingCompares) {
    const exists = db.prepare(`SELECT 1 FROM county_comparisons WHERE slug = ?`).get(slug);
    if (!exists) continue;
    if (!keepSet.has(slug)) { keepSet.add(slug); bingAdded++; }
    const m = slug.match(/^(.+)-vs-(.+)$/);
    if (m) {
      const reverse = `${m[2]}-vs-${m[1]}`;
      if (!keepSet.has(reverse)) { keepSet.add(reverse); bingAdded++; }
    }
  }
  const keepSlugs = Array.from(keepSet).sort();

  if (rows.length < 50) {
    throw new Error(
      `county-compare keep-set only has ${rows.length} forward pairs (expected ~100). ` +
      `Aborting to avoid accidental mass-410.`
    );
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const out = path.join(OUT_DIR, 'county-compare-keep.json');
  fs.writeFileSync(out, JSON.stringify(keepSlugs, null, 0) + '\n');

  // Audit log
  console.log(`[keep-sets] county-compare-keep.json: ${keepSlugs.length} slugs (${rows.length} forward + reverses + ${gscAdded} GSC + ${bingAdded} Bing)`);
  const stateHist = new Map<string, number>();
  for (const r of rows) stateHist.set(r.state, (stateHist.get(r.state) ?? 0) + 1);
  console.log(`[keep-sets] state coverage: ${stateHist.size} states`);
  const topStates = Array.from(stateHist.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
  console.log(`[keep-sets] top states in keep-set:`);
  for (const [s, c] of topStates) console.log(`  ${c.toString().padStart(2)} ${s}`);

  db.close();
}

main();
