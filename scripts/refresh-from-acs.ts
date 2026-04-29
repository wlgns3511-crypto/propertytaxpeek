// HCU 2026-04-29: Layer 0 ACS 2024 5-Year refresh.
//
// Background: existing data/taxes.db county rates were synthesized via
// scripts/collect-data.py — md5(county+state)-derived ±30% perturbation
// around state-level ACS 2022 averages. That's the HCU "scaled content"
// signal we need to drop. This script fetches real Census ACS 2024 5-Year
// county-level estimates, applies a relative MOE filter (>30% → mark
// suppressed), and emits two JSON artifacts for the build.
//
// Variables fetched:
//   B25103_001E  median real estate taxes paid (owner-occupied)
//   B25077_001E  median home value (owner-occupied)
//   B19013_001E  median household income (all households)
//   B19049_005E  median household income, age 65+
//
// Output:
//   lib/generated/county-data-acs.json — per-slug payload (kept | suppressed)
//   lib/generated/state-data-acs.json  — per-slug state payload
//   lib/generated/data-vintage.json    — provenance + audit counts
//
// Why JSON, not DB UPSERT: data/taxes.db has NOT NULL on effective_rate.
// JSON keeps the legacy DB intact as a fallback while letting page code
// branch on status === 'suppressed' to render <DataSuppressedNotice>.
// Edge-runtime safe (no fs at request time).
//
// MOE relative threshold = 30%. If either taxes-MOE or home-value-MOE
// exceeds that, the county is suppressed (R3-lite natural prune).
//
// Run:
//   tsx scripts/refresh-from-acs.ts
// Adds itself to npm run build chain via package.json (build:acs).

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'taxes.db');
const OUT_DIR = path.join(process.cwd(), 'lib', 'generated');
const ENV_PATH = '/Users/jihoon/projects/_shared/.env';

const VINTAGE = 'ACS 2024 5-Year';
const FETCH_DATE = new Date().toISOString().slice(0, 10);
const MOE_REL_THRESHOLD = 30; // percent

// State abbreviation → Census FIPS code (50 + DC).
const STATE_FIPS: Record<string, string> = {
  AL: '01', AK: '02', AZ: '04', AR: '05', CA: '06', CO: '08', CT: '09',
  DE: '10', DC: '11', FL: '12', GA: '13', HI: '15', ID: '16', IL: '17',
  IN: '18', IA: '19', KS: '20', KY: '21', LA: '22', ME: '23', MD: '24',
  MA: '25', MI: '26', MN: '27', MS: '28', MO: '29', MT: '30', NE: '31',
  NV: '32', NH: '33', NJ: '34', NM: '35', NY: '36', NC: '37', ND: '38',
  OH: '39', OK: '40', OR: '41', PA: '42', RI: '44', SC: '45', SD: '46',
  TN: '47', TX: '48', UT: '49', VT: '50', VA: '51', WA: '53', WV: '54',
  WI: '55', WY: '56',
};

function loadEnvKey(): string {
  const raw = fs.readFileSync(ENV_PATH, 'utf-8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^CENSUS_API_KEY=(.+)$/);
    if (m) return m[1].trim();
  }
  throw new Error(`CENSUS_API_KEY not found in ${ENV_PATH}`);
}

// Census returns NAME like "Los Angeles County, California". Strip suffix
// + lowercase + dash → matches our slug builder pattern.
function censusNameToSlugPart(censusName: string): string {
  const countyPart = censusName.split(',')[0].trim();
  return countyPart
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function relMoePct(estimate: number, moe: number): number {
  if (!estimate || estimate <= 0) return Infinity;
  return (Math.abs(moe) / estimate) * 100;
}

type CountyKept = {
  status: 'kept';
  median_real_estate_taxes: number;
  median_real_estate_taxes_moe: number;
  median_home_value: number;
  median_home_value_moe: number;
  effective_rate: number; // % (taxes / home_value * 100)
  median_household_income: number;
  median_income_age65_plus: number | null;
  senior_burden_pct: number | null; // taxes / age65_income * 100
  moe_rel_max_pct: number;
};
type CountySuppressed = {
  status: 'suppressed';
  reason: string;
  moe_rel_max_pct: number;
};
type CountyEntry = CountyKept | CountySuppressed;

type StateEntry = {
  median_real_estate_taxes: number;
  median_home_value: number;
  effective_rate: number;
  median_household_income: number;
  median_income_age65_plus: number | null;
  senior_burden_pct: number | null;
};

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Census API ${res.status} for ${url}`);
  return res.json();
}

const VARIABLES = [
  'NAME',
  'B25103_001E', 'B25103_001M',
  'B25077_001E', 'B25077_001M',
  'B19013_001E', 'B19013_001M',
  'B19049_005E', 'B19049_005M',
].join(',');

function parseValue(s: string | null | undefined): number | null {
  if (s == null) return null;
  const n = Number(s);
  // Census uses negative sentinels (-666666666 etc.) for null-ish.
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

async function fetchStateCounties(stateAbbr: string, stateFips: string, key: string) {
  const url = `https://api.census.gov/data/2024/acs/acs5?get=${VARIABLES}&for=county:*&in=state:${stateFips}&key=${key}`;
  const data = (await fetchJson(url)) as string[][];
  const [header, ...rows] = data;
  const idx = (col: string) => header.indexOf(col);
  const I = {
    name: idx('NAME'),
    tax: idx('B25103_001E'),
    taxMoe: idx('B25103_001M'),
    val: idx('B25077_001E'),
    valMoe: idx('B25077_001M'),
    inc: idx('B19013_001E'),
    incMoe: idx('B19013_001M'),
    sen: idx('B19049_005E'),
    senMoe: idx('B19049_005M'),
  };
  const out: { slugPart: string; raw: Record<string, number | null>; moeRelMax: number; censusName: string }[] = [];
  for (const r of rows) {
    const tax = parseValue(r[I.tax]);
    const taxMoe = parseValue(r[I.taxMoe]) ?? 0;
    const val = parseValue(r[I.val]);
    const valMoe = parseValue(r[I.valMoe]) ?? 0;
    const inc = parseValue(r[I.inc]);
    const sen = parseValue(r[I.sen]);
    const taxRel = tax != null ? relMoePct(tax, taxMoe) : Infinity;
    const valRel = val != null ? relMoePct(val, valMoe) : Infinity;
    const moeRelMax = Math.max(taxRel, valRel);
    out.push({
      slugPart: censusNameToSlugPart(r[I.name]),
      censusName: r[I.name],
      raw: { tax, taxMoe, val, valMoe, inc, sen, senMoe: parseValue(r[I.senMoe]) ?? 0, incMoe: parseValue(r[I.incMoe]) ?? 0 },
      moeRelMax,
    });
  }
  return out;
}

async function fetchAllStates(key: string) {
  const url = `https://api.census.gov/data/2024/acs/acs5?get=${VARIABLES}&for=state:*&key=${key}`;
  const data = (await fetchJson(url)) as string[][];
  const [header, ...rows] = data;
  const idx = (col: string) => header.indexOf(col);
  const I = {
    name: idx('NAME'),
    tax: idx('B25103_001E'),
    val: idx('B25077_001E'),
    inc: idx('B19013_001E'),
    sen: idx('B19049_005E'),
    stateFips: idx('state'),
  };
  const map: Record<string, StateEntry & { fips: string; name: string }> = {};
  const fipsToAbbr: Record<string, string> = {};
  for (const [abbr, fips] of Object.entries(STATE_FIPS)) fipsToAbbr[fips] = abbr;
  for (const r of rows) {
    const fips = r[I.stateFips];
    const abbr = fipsToAbbr[fips];
    if (!abbr) continue; // territories — skip
    const tax = parseValue(r[I.tax]);
    const val = parseValue(r[I.val]);
    const inc = parseValue(r[I.inc]);
    const sen = parseValue(r[I.sen]);
    if (tax == null || val == null) continue;
    const eff = (tax / val) * 100;
    const senBurden = sen ? (tax / sen) * 100 : null;
    map[abbr] = {
      fips,
      name: r[I.name],
      median_real_estate_taxes: Math.round(tax),
      median_home_value: Math.round(val),
      effective_rate: Number(eff.toFixed(3)),
      median_household_income: inc != null ? Math.round(inc) : 0,
      median_income_age65_plus: sen != null ? Math.round(sen) : null,
      senior_burden_pct: senBurden != null ? Number(senBurden.toFixed(2)) : null,
    };
  }
  return map;
}

async function main() {
  console.log(`[refresh-from-acs] vintage=${VINTAGE} fetched_at=${FETCH_DATE}`);
  const key = loadEnvKey();
  console.log(`[refresh-from-acs] CENSUS_API_KEY loaded (length ${key.length})`);

  const db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
  type LocalCounty = { slug: string; state: string; county_name: string; population: number };
  const localCounties = db.prepare(
    `SELECT slug, state, county_name, population FROM counties ORDER BY state, county_name`
  ).all() as LocalCounty[];
  db.close();
  console.log(`[refresh-from-acs] local counties: ${localCounties.length}`);

  // Build (state, slugPart) → slug lookup.
  const slugLookup = new Map<string, string>();
  for (const c of localCounties) {
    const slugPart = c.county_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    slugLookup.set(`${c.state.toLowerCase()}|${slugPart}`, c.slug);
  }

  // Fetch state-by-state. Polite 200ms between calls.
  const counties: Record<string, CountyEntry> = {};
  const auditPerState: Record<string, { kept: number; suppressed: number; unmatched: number }> = {};
  const unmatched: { state: string; censusName: string }[] = [];

  const states = Object.keys(STATE_FIPS).sort();
  for (const abbr of states) {
    const fips = STATE_FIPS[abbr];
    process.stdout.write(`[${abbr}] `);
    let rows;
    try {
      rows = await fetchStateCounties(abbr, fips, key);
    } catch (e) {
      console.error(`\n  fetch error: ${(e as Error).message}`);
      await new Promise((r) => setTimeout(r, 1500));
      rows = await fetchStateCounties(abbr, fips, key);
    }
    auditPerState[abbr] = { kept: 0, suppressed: 0, unmatched: 0 };
    for (const r of rows) {
      const slug = slugLookup.get(`${abbr.toLowerCase()}|${r.slugPart}`);
      if (!slug) {
        auditPerState[abbr].unmatched++;
        unmatched.push({ state: abbr, censusName: r.censusName });
        continue;
      }
      const { tax, val, inc, sen } = r.raw;
      const moeRel = r.moeRelMax;
      if (tax == null || val == null || moeRel > MOE_REL_THRESHOLD) {
        counties[slug] = {
          status: 'suppressed',
          reason: tax == null || val == null
            ? 'Census ACS 2024 5-Year did not publish a median estimate for this county'
            : `ACS 2024 5-Year relative MOE ${moeRel.toFixed(1)}% exceeds ${MOE_REL_THRESHOLD}% threshold`,
          moe_rel_max_pct: Number(moeRel.toFixed(1)),
        };
        auditPerState[abbr].suppressed++;
        continue;
      }
      const eff = (tax / val) * 100;
      const senBurden = sen ? (tax / sen) * 100 : null;
      counties[slug] = {
        status: 'kept',
        median_real_estate_taxes: Math.round(tax),
        median_real_estate_taxes_moe: Math.round(r.raw.taxMoe ?? 0),
        median_home_value: Math.round(val),
        median_home_value_moe: Math.round(r.raw.valMoe ?? 0),
        effective_rate: Number(eff.toFixed(3)),
        median_household_income: inc != null ? Math.round(inc) : 0,
        median_income_age65_plus: sen != null ? Math.round(sen) : null,
        senior_burden_pct: senBurden != null ? Number(senBurden.toFixed(2)) : null,
        moe_rel_max_pct: Number(moeRel.toFixed(1)),
      };
      auditPerState[abbr].kept++;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  console.log('');

  // States.
  console.log(`[refresh-from-acs] fetching state-level data...`);
  const states_map = await fetchAllStates(key);

  // Audit + write.
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const totalKept = Object.values(counties).filter((c) => c.status === 'kept').length;
  const totalSuppressed = Object.values(counties).filter((c) => c.status === 'suppressed').length;
  const totalLocal = localCounties.length;
  const totalCovered = Object.keys(counties).length;
  const totalMissing = totalLocal - totalCovered;

  // Suppress local counties not in Census response (rare — usually county
  // boundary churn or recently-renamed). Mark suppressed with reason.
  for (const c of localCounties) {
    if (!counties[c.slug]) {
      counties[c.slug] = {
        status: 'suppressed',
        reason: 'County name in local DB did not match any Census ACS 2024 row (possibly renamed or deprecated)',
        moe_rel_max_pct: -1,
      };
    }
  }

  const vintage = {
    source: VINTAGE,
    variables: ['B25103_001E (median real estate taxes)', 'B25077_001E (median home value)', 'B19013_001E (median household income)', 'B19049_005E (median household income, age 65+)'],
    fetched_at: FETCH_DATE,
    counties_total_local: totalLocal,
    counties_covered_by_census: totalCovered,
    counties_kept: totalKept,
    counties_suppressed: totalSuppressed + totalMissing,
    counties_unmatched_in_census: totalMissing,
    moe_threshold_relative_pct: MOE_REL_THRESHOLD,
    states_count: Object.keys(states_map).length,
  };

  fs.writeFileSync(
    path.join(OUT_DIR, 'county-data-acs.json'),
    JSON.stringify({ vintage: VINTAGE, fetched_at: FETCH_DATE, counties }, null, 0) + '\n'
  );
  fs.writeFileSync(
    path.join(OUT_DIR, 'state-data-acs.json'),
    JSON.stringify({ vintage: VINTAGE, fetched_at: FETCH_DATE, states: states_map }, null, 0) + '\n'
  );
  fs.writeFileSync(
    path.join(OUT_DIR, 'data-vintage.json'),
    JSON.stringify(vintage, null, 2) + '\n'
  );

  // Console audit.
  console.log(`[refresh-from-acs] county summary:`);
  console.log(`  total local:          ${totalLocal}`);
  console.log(`  covered by Census:    ${totalCovered}`);
  console.log(`  kept (MOE ≤ ${MOE_REL_THRESHOLD}%):     ${totalKept}`);
  console.log(`  suppressed (MOE >):   ${totalSuppressed}`);
  console.log(`  unmatched in Census:  ${totalMissing}`);
  console.log(`[refresh-from-acs] state summary: ${Object.keys(states_map).length} states fetched`);
  console.log(`[refresh-from-acs] artifacts:`);
  console.log(`  ${path.join(OUT_DIR, 'county-data-acs.json')}`);
  console.log(`  ${path.join(OUT_DIR, 'state-data-acs.json')}`);
  console.log(`  ${path.join(OUT_DIR, 'data-vintage.json')}`);

  if (unmatched.length > 0 && unmatched.length <= 30) {
    console.log(`[refresh-from-acs] unmatched Census counties (≤30 sample):`);
    for (const u of unmatched.slice(0, 30)) console.log(`  ${u.state}: ${u.censusName}`);
  } else if (unmatched.length > 30) {
    console.log(`[refresh-from-acs] ${unmatched.length} unmatched Census rows; first 10:`);
    for (const u of unmatched.slice(0, 10)) console.log(`  ${u.state}: ${u.censusName}`);
  }

  // Top-state suppression histogram.
  const stateRows = Object.entries(auditPerState)
    .map(([s, v]) => ({ s, ...v, total: v.kept + v.suppressed }))
    .sort((a, b) => (b.suppressed / Math.max(b.total, 1)) - (a.suppressed / Math.max(a.total, 1)));
  console.log(`[refresh-from-acs] top-10 states by suppression rate:`);
  for (const r of stateRows.slice(0, 10)) {
    const pct = r.total ? ((r.suppressed / r.total) * 100).toFixed(1) : '0';
    console.log(`  ${r.s}: ${r.suppressed}/${r.total} suppressed (${pct}%)`);
  }
}

main().catch((e) => {
  console.error('[refresh-from-acs] fatal:', e);
  process.exit(1);
});
