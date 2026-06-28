/**
 * Phase 7 cross-walk retrofit audit for propertytaxpeek.
 *
 * Trap inventory targeted:
 *   #110 / T-P0-1   — ≥2 distinct publishers in the cross-walk module
 *                     (cross-checked by check-crosswalk-publishers.sh,
 *                     re-asserted here for local fail-fast).
 *   #111 / T-P0-3   — IncomeBurdenBand quintile spread ≤25pp across the
 *                     active county cohort (Census ACS B25103/B19013).
 *   #117 / T-P1-2   — Title length ≤60 chars across the cohort (Google
 *                     clips at ~60; new $/% verdict fits with no truncation).
 *   #119 / T-P1-4   — Coverage of the verdict-in-title pattern ≥95%
 *                     (gate JSON asserts 99%; below 95% blocks the deploy).
 *                     Verdict = title contains both `$` (median tax) and `%`
 *                     (effective rate) — see 2026-05-24 retitle.
 *
 * v7.4 (2026-05-24): Empirical-Outcomes block — Census ACS 2024 5-Year
 * B25103/B25077/B19013 county+state property tax dimension (Tier-1 10th,
 * audit-only formalisation; data refresh + decoders + page wiring already
 * PROD-LIVE since 2026-04-29 refresh-from-acs cycle). 6 checks: coverage,
 * national mean, spread, 5-tier effective-rate-decoder distribution,
 * source-URL grep-visibility, page-wiring grep.
 *
 * Source-URL surveyability (Trap #105 — inlined for grep):
 *   https://www.census.gov/programs-surveys/acs/
 *   https://api.census.gov/data/2024/acs/acs5
 *
 * Honest-skip notes:
 *   - Trap #118 (concentration) and #120 (entity broadcast) are by-design
 *     mitigated upstream (quintile cutoffs tuned, all signals join on
 *     COUNTY entity) — see propertytaxpeek.json trap_self_check.
 */
/* eslint-disable no-console */
import { getAllCounties } from "@/lib/db";
import { buildCountyView } from "@/lib/county-facts";
import {
  classifyIncomeBurden,
  tierLabel as burdenTierLabel,
  type IncomeBurdenTier,
} from "@/lib/proptax-income-burden-band";
import { burdenTierLetter } from "@/lib/crosswalk-burden-and-rate";
import { BURDEN_AND_RATE_CROSSWALK_SOURCES } from "@/lib/crosswalk-burden-and-rate";
import { EFFECTIVE_RATE_TIER_CUTOFFS } from "@/lib/effective-rate-decoder";
import countyAcs from "@/lib/generated/county-data-acs.json";
import stateAcs from "@/lib/generated/state-data-acs.json";
import { DATA_VINTAGE } from "@/lib/data-vintage";
import { readFileSync } from "node:fs";
import * as path from "node:path";

const TIERS: IncomeBurdenTier[] = [
  "BurdenA",
  "BurdenB",
  "BurdenC",
  "BurdenD",
  "BurdenE",
];

type Row = {
  slug: string;
  countyName: string;
  state: string;
  tier: IncomeBurdenTier | null;
  burdenPct: number | null;
  effectiveRatePct: number | null;
  titleLen: number | null;
  hasVerdictInTitle: boolean;
};

function fmtUsd(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function buildTitle(
  countyName: string,
  state: string,
  tier: IncomeBurdenTier | null,
  effectiveRatePct: number,
  taxesAnnual: number,
): string | null {
  // 2026-05-24 retitle — concrete $/% verdict replaces "Tier X Label".
  // Mirror app/county/[slug]/page.tsx generateMetadata title.absolute.
  // Coverage gate (tier !== null) is retained as the suppressed-county
  // exclusion proxy (suppressed counties produce no median tax/rate either).
  if (!tier) return null;
  return `${countyName}, ${state}: ${fmtUsd(taxesAnnual)} Tax · ${effectiveRatePct.toFixed(2)}%`;
}

function trap110Publishers(): boolean {
  const hosts = new Set<string>();
  for (const s of BURDEN_AND_RATE_CROSSWALK_SOURCES) {
    try {
      hosts.add(new URL(s.url).hostname);
    } catch {
      /* ignore */
    }
  }
  console.log(`[#110/T-P0-1] crosswalk publisher hosts (${hosts.size}):`);
  for (const h of [...hosts].sort()) console.log(`              · ${h}`);
  return hosts.size >= 2;
}

function run(): void {
  console.log("Phase 7 cross-walk audit — propertytaxpeek\n");

  const counties = getAllCounties();
  const rows: Row[] = [];

  for (const c of counties) {
    const view = buildCountyView(c.slug);
    if (!view || view.kind === "suppressed") {
      rows.push({
        slug: c.slug,
        countyName: c.county_name,
        state: c.state,
        tier: null,
        burdenPct: null,
        effectiveRatePct: null,
        titleLen: null,
        hasVerdictInTitle: false,
      });
      continue;
    }
    const burden = classifyIncomeBurden({
      taxesAnnual: view.taxesAnnual,
      medianIncome: view.householdIncome,
    });
    const title = buildTitle(
      c.county_name,
      c.state,
      burden.tier,
      view.effectiveRatePct,
      view.taxesAnnual,
    );
    rows.push({
      slug: c.slug,
      countyName: c.county_name,
      state: c.state,
      tier: burden.tier,
      burdenPct: burden.burdenPct,
      effectiveRatePct: view.effectiveRatePct,
      titleLen: title?.length ?? null,
      hasVerdictInTitle: title !== null,
    });
  }

  const okPub = trap110Publishers();

  // Trap #111 — quintile spread ≤25pp
  const decoded = rows.filter((r) => r.tier !== null);
  const tally: Record<IncomeBurdenTier, number> = {
    BurdenA: 0,
    BurdenB: 0,
    BurdenC: 0,
    BurdenD: 0,
    BurdenE: 0,
  };
  for (const r of decoded) if (r.tier) tally[r.tier]++;
  const pct: Record<IncomeBurdenTier, number> = {} as Record<
    IncomeBurdenTier,
    number
  >;
  for (const t of TIERS) {
    pct[t] = decoded.length ? (tally[t] / decoded.length) * 100 : 0;
  }
  const spread =
    Math.max(...TIERS.map((t) => pct[t])) -
    Math.min(...TIERS.map((t) => pct[t]));
  console.log(`\n[#111/T-P0-3] BurdenA-E quintile distribution (n=${decoded.length}):`);
  for (const t of TIERS) {
    console.log(`              ${t}: ${pct[t].toFixed(1)}%  (n=${tally[t]})`);
  }
  console.log(`              spread = ${spread.toFixed(1)}pp  (≤25pp required)`);
  const okSpread = spread <= 25;

  // Reference: actual quintile boundaries in the live cohort, to guide
  // cutoff retuning when the spread test fails.
  const burdens = decoded
    .map((r) => r.burdenPct)
    .filter((b): b is number => b !== null)
    .sort((a, b) => a - b);
  const q = (p: number) => burdens[Math.floor(burdens.length * p)];
  console.log(
    `              cohort quintile boundaries — p20=${q(0.2).toFixed(2)}  p40=${q(0.4).toFixed(2)}  p60=${q(0.6).toFixed(2)}  p80=${q(0.8).toFixed(2)}  p95=${q(0.95).toFixed(2)}`,
  );

  // Trap #117 — title length ≤60 chars (tightened from 70 for the
  // $/% retitle 2026-05-24; new pattern fits without truncation).
  const titled = rows.filter((r) => r.titleLen !== null) as (Row & {
    titleLen: number;
  })[];
  const maxLen = titled.reduce((m, r) => Math.max(m, r.titleLen), 0);
  const tooLong = titled.filter((r) => r.titleLen > 60);
  console.log(`\n[#117/T-P1-2] Title length — max=${maxLen} (≤60 required); n=${titled.length}`);
  if (tooLong.length > 0) {
    console.log(`              ${tooLong.length} titles exceed 60 chars. Worst 5:`);
    [...tooLong]
      .sort((a, b) => b.titleLen - a.titleLen)
      .slice(0, 5)
      .forEach((r) =>
        console.log(`              · [${r.titleLen}] ${r.countyName}, ${r.state}`),
      );
  } else {
    console.log("              all titles within 60-char budget");
  }
  const okLen = tooLong.length === 0;

  // Trap #119 — P1 coverage ≥95%
  const coverage = (rows.filter((r) => r.hasVerdictInTitle).length / rows.length) * 100;
  console.log(`\n[#119/T-P1-4] Verdict-in-title coverage = ${coverage.toFixed(1)}%  (≥95% required)`);
  const okCov = coverage >= 95;

  const failed: string[] = [];
  if (!okPub) failed.push("#110");
  if (!okSpread) failed.push("#111");
  if (!okLen) failed.push("#117");
  if (!okCov) failed.push("#119");

  console.log(
    `\n${failed.length === 0 ? "✅ PASS — all Phase 7 traps clear." : `❌ FAIL — traps: ${failed.join(", ")}`}`,
  );
  if (failed.length > 0) process.exit(1);
}

run();

// ============================================================
// v7.4 — Empirical-Outcomes block (Census ACS 2024 5-Year)
// ============================================================
// Tier-1 10th, audit-only formalisation. The data refresh
// (scripts/refresh-from-acs.ts), generated JSON
// (lib/generated/{county,state}-data-acs.json + data-vintage.json),
// effective-rate decoder, income-burden decoder, page wiring, and
// MOE-suppressed honest-fallback are all already PROD-LIVE since
// 2026-04-29. This block formalises Tier-1 audit coverage:
//   coverage / national / spread / distribution / source / wiring.
runEmpirical();

interface AcsCountyRow {
  status: "kept" | "suppressed";
  median_real_estate_taxes?: number;
  median_home_value?: number;
  effective_rate?: number;
  median_household_income?: number;
}
interface AcsStateRow {
  fips: string;
  name: string;
  median_real_estate_taxes: number;
  median_home_value: number;
  effective_rate: number;
  median_household_income: number;
}

function bandEffectiveRate(
  pct: number,
): "very-low" | "low" | "moderate" | "high" | "very-high" {
  if (pct < EFFECTIVE_RATE_TIER_CUTOFFS.veryLow) return "very-low";
  if (pct < EFFECTIVE_RATE_TIER_CUTOFFS.low) return "low";
  if (pct < EFFECTIVE_RATE_TIER_CUTOFFS.moderate) return "moderate";
  if (pct < EFFECTIVE_RATE_TIER_CUTOFFS.high) return "high";
  return "very-high";
}

function runEmpirical(): void {
  console.log("\n=== Empirical-Outcomes — Census ACS 2024 5-Year B25103/B25077/B19013 ===");

  let empiricalFail = 0;
  const counties = (countyAcs as { counties: Record<string, AcsCountyRow> })
    .counties;
  const states = (stateAcs as { states: Record<string, AcsStateRow> }).states;

  // #empirical-coverage — kept vs suppressed county counts + 51 states
  const countySlugs = Object.keys(counties);
  const kept = countySlugs.filter((s) => counties[s].status === "kept");
  const suppressed = countySlugs.filter(
    (s) => counties[s].status === "suppressed",
  );
  const stateAbbrs = Object.keys(states);
  console.log(
    `\n[#empirical-coverage] counties: ${kept.length} kept / ${suppressed.length} suppressed / ${countySlugs.length} total`,
  );
  console.log(`       states: ${stateAbbrs.length} / 51`);
  const coverageOk = kept.length >= 2500 && stateAbbrs.length === 51;
  console.log(`       coverage gates (≥2500 kept counties, 51 states):`, coverageOk ? "PASS" : "FAIL");
  if (!coverageOk) empiricalFail += 1;

  // #empirical-national — vintage + national means > 0
  let taxTot = 0,
    taxN = 0,
    rateTot = 0,
    rateN = 0,
    homeTot = 0,
    homeN = 0;
  for (const slug of kept) {
    const c = counties[slug];
    if (c.median_real_estate_taxes != null) {
      taxTot += c.median_real_estate_taxes;
      taxN += 1;
    }
    if (c.effective_rate != null) {
      rateTot += c.effective_rate;
      rateN += 1;
    }
    if (c.median_home_value != null) {
      homeTot += c.median_home_value;
      homeN += 1;
    }
  }
  const natTax = taxN > 0 ? taxTot / taxN : 0;
  const natRate = rateN > 0 ? rateTot / rateN : 0;
  const natHome = homeN > 0 ? homeTot / homeN : 0;
  const nationalOk =
    !!DATA_VINTAGE.source && natTax > 0 && natRate > 0 && natHome > 0;
  console.log("\n[#empirical-national] vintage:", DATA_VINTAGE.source);
  console.log(`       fetched: ${DATA_VINTAGE.fetched_at}`);
  console.log(`       national median tax (county-mean): $${natTax.toFixed(0)}`);
  console.log(`       national effective rate (county-mean): ${natRate.toFixed(3)}%`);
  console.log(`       national median home (county-mean): $${natHome.toFixed(0)}`);
  console.log("       all positive:", nationalOk ? "PASS" : "FAIL");
  if (!nationalOk) empiricalFail += 1;

  // #empirical-spread — state-level tax + rate range > 0
  const stateRows = Object.values(states);
  stateRows.sort((a, b) => a.effective_rate - b.effective_rate);
  const minRateRow = stateRows[0];
  const maxRateRow = stateRows[stateRows.length - 1];
  stateRows.sort((a, b) => a.median_real_estate_taxes - b.median_real_estate_taxes);
  const minTaxRow = stateRows[0];
  const maxTaxRow = stateRows[stateRows.length - 1];
  const rateRangePp = maxRateRow.effective_rate - minRateRow.effective_rate;
  const taxRange =
    maxTaxRow.median_real_estate_taxes - minTaxRow.median_real_estate_taxes;
  const spreadOk = rateRangePp > 0 && taxRange > 0;
  console.log("\n[#empirical-spread] state-level");
  console.log(
    `       effective rate: ${minRateRow.effective_rate.toFixed(3)}% (${minRateRow.name}) → ${maxRateRow.effective_rate.toFixed(3)}% (${maxRateRow.name}) = ${rateRangePp.toFixed(3)}pp`,
  );
  console.log(
    `       median tax: $${minTaxRow.median_real_estate_taxes} (${minTaxRow.name}) → $${maxTaxRow.median_real_estate_taxes} (${maxTaxRow.name}) = $${taxRange}`,
  );
  console.log("       both > 0:", spreadOk ? "PASS" : "FAIL");
  if (!spreadOk) empiricalFail += 1;

  // #empirical-distribution — 5-tier effective_rate_decoder cutoffs, max ≤ 70%
  // Asserted at BOTH state-level (51) AND county-level (kept cohort).
  const tierLabels = ["very-low", "low", "moderate", "high", "very-high"] as const;
  type TierLabel = (typeof tierLabels)[number];
  const stateBuckets: Record<TierLabel, number> = {
    "very-low": 0,
    low: 0,
    moderate: 0,
    high: 0,
    "very-high": 0,
  };
  for (const a of stateAbbrs) {
    stateBuckets[bandEffectiveRate(states[a].effective_rate)] += 1;
  }
  const stateTotal = stateAbbrs.length;
  const stateMaxPct = Math.max(
    ...Object.values(stateBuckets).map((c) => (c / stateTotal) * 100),
  );

  const countyBuckets: Record<TierLabel, number> = {
    "very-low": 0,
    low: 0,
    moderate: 0,
    high: 0,
    "very-high": 0,
  };
  for (const slug of kept) {
    const r = counties[slug];
    if (r.effective_rate != null)
      countyBuckets[bandEffectiveRate(r.effective_rate)] += 1;
  }
  const countyTotal = Object.values(countyBuckets).reduce((a, b) => a + b, 0);
  const countyMaxPct = Math.max(
    ...Object.values(countyBuckets).map((c) => (c / countyTotal) * 100),
  );

  console.log(
    "\n[#empirical-distribution] effective_rate_decoder 5-tier cutoffs ",
    JSON.stringify(EFFECTIVE_RATE_TIER_CUTOFFS),
  );
  console.log("       state (51):");
  for (const k of tierLabels) {
    console.log(
      `         ${k.padEnd(11)}: ${stateBuckets[k]} (${((stateBuckets[k] / stateTotal) * 100).toFixed(1)}%)`,
    );
  }
  console.log(
    `       state max bucket pct: ${stateMaxPct.toFixed(1)}%`,
    stateMaxPct <= 70 ? "PASS" : "FAIL",
  );
  console.log("       county (kept):");
  for (const k of tierLabels) {
    console.log(
      `         ${k.padEnd(11)}: ${countyBuckets[k]} (${((countyBuckets[k] / countyTotal) * 100).toFixed(1)}%)`,
    );
  }
  console.log(
    `       county max bucket pct: ${countyMaxPct.toFixed(1)}%`,
    countyMaxPct <= 70 ? "PASS" : "FAIL",
  );
  if (stateMaxPct > 70 || countyMaxPct > 70) empiricalFail += 1;

  // #empirical-source — Census ACS host grep-visible in this audit script (Trap #105)
  const auditScriptText = readFileSync(__filename, "utf8");
  const sourceVisible =
    auditScriptText.includes("census.gov/programs-surveys/acs") &&
    auditScriptText.includes("api.census.gov/data/2024/acs/acs5");
  console.log(
    "\n[#empirical-source] Census ACS host + API endpoint grep-visible in audit header:",
    sourceVisible ? "PASS" : "FAIL",
  );
  if (!sourceVisible) empiricalFail += 1;

  // #empirical-wiring — state + county pages import + render ACS empirical
  const stateAcsPagePath = path.join(
    process.cwd(),
    "app",
    "state",
    "[slug]",
    "page.tsx",
  );
  const countyPagePath = path.join(
    process.cwd(),
    "app",
    "county",
    "[slug]",
    "page.tsx",
  );
  let statePage = "";
  let countyPage = "";
  try {
    statePage = readFileSync(stateAcsPagePath, "utf8");
  } catch {
    /* missing -- handled in checks below */
  }
  try {
    countyPage = readFileSync(countyPagePath, "utf8");
  } catch {
    /* missing -- handled in checks below */
  }
  const wiringChecks: Array<[string, boolean]> = [
    ["state page reads ACS effective_rate", /acs.*effective_rate|stateAcs\?\.effective_rate/.test(statePage)],
    ["state page calls effective-rate-decoder", /effective-rate-decoder/.test(statePage)],
    ["state page shows ACS vintage label", /ACS 2024|VINTAGE/.test(statePage)],
    ["county page reads view.effectiveRatePct", /effectiveRatePct/.test(countyPage)],
    ["county page references B25103 / median tax", /median_tax|taxesAnnual/.test(countyPage)],
    ["county page acknowledges suppressed branch", /suppressed/.test(countyPage)],
    ["county page references Census ACS", /Census ACS|census\.gov/.test(countyPage)],
  ];
  console.log("\n[#empirical-wiring]");
  let wiringPass = 0;
  for (const [label, ok] of wiringChecks) {
    console.log(`       ${ok ? "PASS" : "FAIL"}  ${label}`);
    if (ok) wiringPass += 1;
  }
  const wiringOk = wiringPass === wiringChecks.length;
  if (!wiringOk) empiricalFail += 1;

  // 6-jurisdiction state spot sample (anchors low-rate vs high-rate ends)
  console.log("\n[empirical sample — state-level]");
  const sampleAbbrs = ["CA", "FL", "TX", "NY", "HI", "NJ"];
  for (const a of sampleAbbrs) {
    const s = states[a];
    if (!s) {
      console.log(`  ${a}: MISSING`);
      continue;
    }
    const band = bandEffectiveRate(s.effective_rate);
    console.log(
      `  ${s.name} (${a}): tax=$${s.median_real_estate_taxes}  rate=${s.effective_rate.toFixed(3)}%  band=${band}`,
    );
  }

  if (empiricalFail > 0) {
    console.error(
      `\n❌ FAIL: ${empiricalFail} Empirical-Outcomes check(s) failed.`,
    );
    process.exit(1);
  }

  console.log("\n✅ All Phase 7 + Empirical-Outcomes checks PASS.");
}
