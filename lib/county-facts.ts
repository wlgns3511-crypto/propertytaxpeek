// HCU 2026-04-29 Layer 1+ helpers for county-page ACS data.
//
// Branches county pages into three rendering modes:
//   - kept       → ACS 2024 5-Year passed the MOE filter; render real numbers
//   - suppressed → ACS estimate exceeded 30% relative MOE; render notice only
//   - missing    → defensive fallback (county not in ACS JSON at all)
//
// The legacy synthetic county.effective_rate / median_tax / median_home_value
// fields from data/taxes.db are *not* shown on suppressed pages — that's the
// HCU "scaled content" signal we're cutting. We surface population + name +
// state-level context instead.

import countyDataAcs from "@/lib/generated/county-data-acs.json";

type CountyKept = {
  status: "kept";
  median_real_estate_taxes: number;
  median_real_estate_taxes_moe: number;
  median_home_value: number;
  median_home_value_moe: number;
  effective_rate: number;
  median_household_income: number;
  median_income_age65_plus: number | null;
  senior_burden_pct: number | null;
  moe_rel_max_pct: number;
};

type CountySuppressed = {
  status: "suppressed";
  reason: string;
  moe_rel_max_pct: number | null;
};

export type CountyAcs = CountyKept | CountySuppressed;

const COUNTY_LOOKUP = countyDataAcs.counties as unknown as Record<string, CountyAcs>;

export function getCountyAcs(slug: string): CountyAcs | null {
  return COUNTY_LOOKUP[slug] ?? null;
}

export function isKept(acs: CountyAcs | null): acs is CountyKept {
  return acs?.status === "kept";
}

export type BurdenStatus =
  | "extreme-high"   // >= 2.0%
  | "high"           // 1.5–2.0%
  | "above-avg"      // 1.2–1.5%
  | "avg"            // 0.9–1.2%
  | "below-avg"      // 0.6–0.9%
  | "low";           // < 0.6%

export function classifyBurden(effectiveRatePct: number): BurdenStatus {
  if (effectiveRatePct >= 2.0) return "extreme-high";
  if (effectiveRatePct >= 1.5) return "high";
  if (effectiveRatePct >= 1.2) return "above-avg";
  if (effectiveRatePct >= 0.9) return "avg";
  if (effectiveRatePct >= 0.6) return "below-avg";
  return "low";
}

export type SeniorBurdenStatus = "stretched" | "moderate" | "comfortable";

// senior_burden_pct = annual property tax / median household income age 65+.
// Thresholds calibrated against ACS 2024 distribution: median ~7.5% across
// counties; >=10% lands the senior household in the bottom quartile of
// after-tax income (NJ/NY/IL urban counties), <=4% is comfortable territory.
export function classifySeniorBurden(seniorBurdenPct: number | null): SeniorBurdenStatus | null {
  if (seniorBurdenPct == null || !Number.isFinite(seniorBurdenPct)) return null;
  if (seniorBurdenPct >= 10) return "stretched";
  if (seniorBurdenPct >= 5) return "moderate";
  return "comfortable";
}

export type CountyView =
  | {
      kind: "kept";
      taxesAnnual: number;
      homeValue: number;
      effectiveRatePct: number;
      seniorIncome: number | null;
      seniorBurdenPct: number | null;
      seniorBurdenStatus: SeniorBurdenStatus | null;
      burdenStatus: BurdenStatus;
      moeRelMaxPct: number;
      householdIncome: number;
    }
  | {
      kind: "suppressed";
      reason: string;
    };

export function buildCountyView(slug: string): CountyView | null {
  const acs = getCountyAcs(slug);
  if (!acs) {
    return {
      kind: "suppressed",
      reason:
        "County name in local DB did not match any Census ACS 2024 row (possibly renamed or deprecated)",
    };
  }
  if (acs.status === "suppressed") {
    return { kind: "suppressed", reason: acs.reason };
  }
  return {
    kind: "kept",
    taxesAnnual: acs.median_real_estate_taxes,
    homeValue: acs.median_home_value,
    effectiveRatePct: acs.effective_rate,
    seniorIncome: acs.median_income_age65_plus,
    seniorBurdenPct: acs.senior_burden_pct,
    seniorBurdenStatus: classifySeniorBurden(acs.senior_burden_pct),
    burdenStatus: classifyBurden(acs.effective_rate),
    moeRelMaxPct: acs.moe_rel_max_pct,
    householdIncome: acs.median_household_income,
  };
}
