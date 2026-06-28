/**
 * IncomeBurdenBand — deterministic 5-band classifier for property tax
 * burden expressed as a share of median household income, not as a share
 * of home value.
 *
 * Phase 6 v6.4 PSU 1차 (2026-05-12): the 0차 EffectiveRateVsAssessmentDecoder
 * already reads the rate-side of the ledger (tax ÷ home value). This lever
 * reads the income-side (tax ÷ household income), which behaves very
 * differently — a 1.5 percent effective rate looks moderate in a $700k home
 * county with $120k median income (8.7 percent of income) and routine in a
 * $200k home county with $80k median income (3.75 percent of income).
 *
 * Honest framing:
 *   - Burden = Census ACS B25103 (median real estate taxes paid) ÷ B19013
 *     (median household income). Both are 5-Year estimates.
 *   - This is editorial. It is NOT endorsed by Census, IRS, or state DOR.
 *   - Census reports B25103 and B19013 separately; the ratio is computed
 *     here for editorial banding.
 *   - SALT $10,000 cap (Internal Revenue Code § 164(b)(6), enacted by
 *     Public Law 115-97 § 11042, the Tax Cuts and Jobs Act of 2017) is
 *     surfaced as a binding flag when the implied tax already exceeds the
 *     deduction cap — a meaningful signal for higher-income readers in
 *     Tier D/E.
 *   - Null / missing income → tier=null + confidence='no-data'.
 */

export type IncomeBurdenTier =
  | "BurdenA"
  | "BurdenB"
  | "BurdenC"
  | "BurdenD"
  | "BurdenE";

export interface IncomeBurdenBandResult {
  tier: IncomeBurdenTier | null;
  burdenPct: number | null;
  /** Implied annual property tax in dollars (passed through for surface text). */
  taxesAnnual: number | null;
  /** Median household income in dollars (passed through for surface text). */
  medianIncome: number | null;
  /** True when the implied tax exceeds the SALT $10,000 cap. */
  saltCapBinding: boolean;
  /** Reader-facing label, e.g. "Heavy (4.7% of income)". */
  label: string;
  /** Editorial caveats — YMYL HIGHEST always present. */
  caveats: string[];
  confidence: "census-acs" | "no-data";
}

// ─────────────────────────────────────────────────────────────────────
// Cutoffs (percent of median household income)
// ─────────────────────────────────────────────────────────────────────

// Cutoffs retuned 2026-05-19 against the live 2705-county cohort
// (Census ACS 2024 5-Year, after MOE filter) so that BurdenA-E
// quintile distribution is balanced. Empirical p20/p40/p60/p80
// boundaries: 1.64 / 2.22 / 2.87 / 3.75 percent of median household
// income. Rounded to clean numbers; Trap #111 (quintile spread)
// validated ≤25pp by scripts/audit-phase7.ts.
export const INCOME_BURDEN_CUTOFFS = {
  burdenA: 1.7, //  < 1.7%  → BurdenA  (Light)
  burdenB: 2.3, //  < 2.3%  → BurdenB  (Moderate)
  burdenC: 2.9, //  < 2.9%  → BurdenC  (Notable)
  burdenD: 3.8, //  < 3.8%  → BurdenD  (Heavy)
  // >= 3.8% → BurdenE  (Severe)
};

export const SALT_CAP_USD = 10_000;

function bandBurden(pct: number): IncomeBurdenTier {
  if (pct < INCOME_BURDEN_CUTOFFS.burdenA) return "BurdenA";
  if (pct < INCOME_BURDEN_CUTOFFS.burdenB) return "BurdenB";
  if (pct < INCOME_BURDEN_CUTOFFS.burdenC) return "BurdenC";
  if (pct < INCOME_BURDEN_CUTOFFS.burdenD) return "BurdenD";
  return "BurdenE";
}

const TIER_LABEL: Record<IncomeBurdenTier, string> = {
  BurdenA: "Light",
  BurdenB: "Moderate",
  BurdenC: "Notable",
  BurdenD: "Heavy",
  BurdenE: "Severe",
};

export function tierLabel(tier: IncomeBurdenTier | null): string {
  if (!tier) return "Unknown";
  return TIER_LABEL[tier];
}

export function tierToneColor(tier: IncomeBurdenTier | null): string {
  if (!tier) return "slate";
  if (tier === "BurdenA") return "emerald";
  if (tier === "BurdenB") return "emerald";
  if (tier === "BurdenC") return "amber";
  if (tier === "BurdenD") return "rose";
  return "rose";
}

export const INCOME_BURDEN_CUTOFF_SUMMARY: { tier: IncomeBurdenTier; range: string; label: string }[] = [
  { tier: "BurdenA", range: "< 1.7%", label: "Light — well under the national typical share" },
  { tier: "BurdenB", range: "1.7% – 2.3%", label: "Moderate — close to the national typical (~2.2%)" },
  { tier: "BurdenC", range: "2.3% – 2.9%", label: "Notable — meaningfully above the national typical" },
  { tier: "BurdenD", range: "2.9% – 3.8%", label: "Heavy — household-budget-shaping" },
  { tier: "BurdenE", range: "≥ 3.8%", label: "Severe — top quintile of US counties on property-tax burden" },
];

// ─────────────────────────────────────────────────────────────────────
// Tier-specific caveats — always shown, never optional on YMYL HIGHEST.
// ─────────────────────────────────────────────────────────────────────

const COMMON_CAVEATS: string[] = [
  "Burden uses Census ACS B25103 (median real estate taxes paid by homeowner) divided by B19013 (median household income). Both are 5-Year estimates with margins of error.",
  "Median household income includes renters; the burden ratio compares the homeowner tax bill against a county-wide income that mixes both groups.",
  "SALT deduction is capped at $10,000 per Internal Revenue Code § 164(b)(6) (enacted by the Tax Cuts and Jobs Act of 2017, Public Law 115-97 § 11042). The cap binds at the federal individual return level, not at the county.",
  "Income-share burden is editorial. It is not a Census, IRS, or state Department of Revenue product.",
];

function caveatsFor(tier: IncomeBurdenTier, saltBinding: boolean): string[] {
  const out = [...COMMON_CAVEATS];
  if (saltBinding) {
    out.push(
      "The implied annual tax bill already exceeds the SALT $10,000 cap. Itemizing filers receive no federal deduction beyond $10,000 for combined state + local taxes (property + state income + sales).",
    );
  }
  if (tier === "BurdenE") {
    out.push(
      "Severe burden often coexists with school-finance dependence on property tax. Counties in this band typically also score high on the EffectiveRateVsAssessmentDecoder lever.",
    );
  }
  if (tier === "BurdenD" || tier === "BurdenE") {
    out.push(
      "Higher tiers are over-represented in counties without an assessment-value cap (Prop 13 California, Save Our Homes Florida, Proposition 117 Arizona). HomesteadExemptionMatrix surfaces those caps.",
    );
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────
// Main classifier
// ─────────────────────────────────────────────────────────────────────

export interface IncomeBurdenInputs {
  taxesAnnual: number | null | undefined;
  medianIncome: number | null | undefined;
}

export function classifyIncomeBurden(
  inputs: IncomeBurdenInputs,
): IncomeBurdenBandResult {
  const t = inputs.taxesAnnual;
  const i = inputs.medianIncome;
  if (
    t == null ||
    i == null ||
    !Number.isFinite(t) ||
    !Number.isFinite(i) ||
    t <= 0 ||
    i <= 0
  ) {
    return {
      tier: null,
      burdenPct: null,
      taxesAnnual: t ?? null,
      medianIncome: i ?? null,
      saltCapBinding: false,
      label: "Unknown — household income or tax estimate not available for this county",
      caveats: [
        "Census ACS suppressed this county's data for the relevant 5-Year window or the income variable is missing. No burden tier is assigned.",
        ...COMMON_CAVEATS,
      ],
      confidence: "no-data",
    };
  }
  const burdenPct = (t / i) * 100;
  const tier = bandBurden(burdenPct);
  const saltBinding = t >= SALT_CAP_USD;
  const pctLabel = `${burdenPct.toFixed(1)}% of income`;
  return {
    tier,
    burdenPct,
    taxesAnnual: t,
    medianIncome: i,
    saltCapBinding: saltBinding,
    label: `${TIER_LABEL[tier]} (${pctLabel})`,
    caveats: caveatsFor(tier, saltBinding),
    confidence: "census-acs",
  };
}

export function tierBlurb(tier: IncomeBurdenTier | null): string {
  switch (tier) {
    case "BurdenA":
      return "Property tax claims a small share of median household income — typical of low-tax states or counties where home values trail the income base.";
    case "BurdenB":
      return "Property tax claims a moderate share of income — close to the cross-county national typical of roughly 2.5 to 3 percent.";
    case "BurdenC":
      return "Property tax claims a notable share of income — meaningfully above typical; budget-shaping for median households.";
    case "BurdenD":
      return "Property tax is a heavy share of income — at this level the bill often shapes the rent-or-own decision and frequently exceeds the SALT $10,000 deduction cap for higher-income filers.";
    case "BurdenE":
      return "Property tax is a severe share of income — counties in this band typically also exhibit high effective rates and rarely have an assessment-value cap that smooths year-over-year change.";
    default:
      return "Burden tier is not available because Census ACS estimates for this county were suppressed or incomplete for the 5-Year window.";
  }
}
