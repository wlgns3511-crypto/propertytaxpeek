// HCU 2026-04-29: State-level ACS view + county burden distribution helpers.

import stateDataAcs from "@/lib/generated/state-data-acs.json";
import countyDataAcs from "@/lib/generated/county-data-acs.json";
import { classifyBurden, type BurdenStatus } from "@/lib/county-facts";

type StateAcs = {
  fips: string;
  name: string;
  median_real_estate_taxes: number;
  median_home_value: number;
  effective_rate: number;
  median_household_income: number;
  median_income_age65_plus: number | null;
  senior_burden_pct: number | null;
};

const STATE_LOOKUP = stateDataAcs.states as Record<string, StateAcs>;
const COUNTY_LOOKUP = countyDataAcs.counties as Record<
  string,
  | {
      status: "kept";
      effective_rate: number;
      median_real_estate_taxes: number;
      median_home_value: number;
    }
  | { status: "suppressed" }
>;

export function getStateAcs(abbrUpper: string): StateAcs | null {
  return STATE_LOOKUP[abbrUpper] ?? null;
}

export type BurdenDistribution = {
  state: string;
  totalCounties: number;
  byStatus: Record<BurdenStatus | "suppressed", number>;
  median: number | null;
  highest: { slug: string; rate: number } | null;
  lowest: { slug: string; rate: number } | null;
};

// Compute burden histogram for a state from the *kept* counties only.
// Suppressed counts surface a separate bucket so the chart is honest about
// what we don't know.
export function getBurdenDistribution(
  stateAbbrUpper: string,
  stateCountySlugs: string[],
): BurdenDistribution {
  const init: BurdenDistribution["byStatus"] = {
    "extreme-high": 0,
    "high": 0,
    "above-avg": 0,
    "avg": 0,
    "below-avg": 0,
    "low": 0,
    "suppressed": 0,
  };
  const rates: { slug: string; rate: number }[] = [];
  for (const slug of stateCountySlugs) {
    const c = COUNTY_LOOKUP[slug];
    if (!c) {
      init.suppressed++;
      continue;
    }
    if (c.status === "suppressed") {
      init.suppressed++;
      continue;
    }
    init[classifyBurden(c.effective_rate)]++;
    rates.push({ slug, rate: c.effective_rate });
  }
  rates.sort((a, b) => a.rate - b.rate);
  const median =
    rates.length === 0
      ? null
      : rates.length % 2
      ? rates[(rates.length - 1) / 2].rate
      : (rates[rates.length / 2 - 1].rate + rates[rates.length / 2].rate) / 2;
  return {
    state: stateAbbrUpper,
    totalCounties: stateCountySlugs.length,
    byStatus: init,
    median: median == null ? null : Number(median.toFixed(3)),
    highest: rates.length ? rates[rates.length - 1] : null,
    lowest: rates.length ? rates[0] : null,
  };
}
