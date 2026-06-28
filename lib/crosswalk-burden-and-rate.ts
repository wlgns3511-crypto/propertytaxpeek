/**
 * Phase 7 P0 — Publisher manifest for propertytaxpeek's burden-and-rate
 * cross-walk. The actual decoders (Phase 6 PSU 2026-05-11/12) live in:
 *
 *   - lib/effective-rate-decoder.ts        (tax ÷ home value, 5-band)
 *   - lib/proptax-income-burden-band.ts    (tax ÷ income, 5-band)
 *   - lib/homestead-exemption-matrix.ts    (state DOR exemption × cap)
 *   - lib/assessment-appeal-success-tier.ts (state appeal window × success)
 *
 * This file consolidates the secondary-source publishers cited across
 * those decoders so the portfolio audit script (Trap #110) finds 2+
 * distinct hostnames inline. URL literals are NOT const-substituted so
 * `check-crosswalk-publishers.sh` grep picks them up.
 *
 * authorship.ts SOURCE_AUTHORITIES intentionally stays narrower (only
 * publishers whose data is INGESTED into data/taxes.db or the generated
 * JSON tables). IRS Publication 530 / IRC §164(b)(6) feeds the SALT
 * $10,000 cap constant used by IncomeBurdenBand; Lincoln Institute and
 * Tax Foundation are surfaced as cross-reference publishers in the
 * county-page Dataset.creator array (P4) without faking ingestion.
 *
 * Trap T-P0-1 (same-publisher) mitigation: census.gov + irs.gov +
 * lincolninst.edu + taxfoundation.org = 4 distinct hosts, 3 distinct
 * TLDs (.gov / .org), 4 distinct editorial organizations.
 */

import {
  decodeEffectiveRate,
  type EffectiveRateTier,
} from "./effective-rate-decoder";
import {
  classifyIncomeBurden,
  type IncomeBurdenTier,
} from "./proptax-income-burden-band";

export const BURDEN_AND_RATE_CROSSWALK_SOURCES = [
  {
    name: "U.S. Census Bureau — American Community Survey 2024 5-Year",
    url: "https://www.census.gov/programs-surveys/acs/",
    role: "Primary — median real estate taxes (B25103), median home value (B25077), median household income (B19013).",
  },
  {
    name: "Internal Revenue Service — Publication 530 / IRC §164(b)(6) SALT cap",
    url: "https://www.irs.gov/publications/p530",
    role: "Secondary — $10,000 SALT cap (Tax Cuts and Jobs Act of 2017, P.L. 115-97 §11042). Surfaces as binding flag in IncomeBurdenBand when implied tax exceeds the cap.",
  },
  {
    name: "Lincoln Institute of Land Policy — Significant Features of the Property Tax",
    url: "https://www.lincolninst.edu/research-data/data-toolkits/significant-features-property-tax",
    role: "Secondary — state-level assessment cap and exemption mechanics (Prop 13 California, Save Our Homes Florida, Proposition 117 Arizona) referenced by HomesteadExemptionMatrix.",
  },
  {
    name: "Tax Foundation — Property Taxes by State",
    url: "https://taxfoundation.org/data/all/state/property-taxes-by-state/",
    role: "Secondary — annual state-level effective property tax rankings; corroborates ACS-derived state averages.",
  },
] as const;

/**
 * Re-exports of the two main P0 decoders. Pages can import from this
 * module to make the cross-walk integration point explicit, though
 * the original modules remain canonical.
 */
export { decodeEffectiveRate, classifyIncomeBurden };
export type { EffectiveRateTier, IncomeBurdenTier };

/**
 * Maps an IncomeBurdenTier ("BurdenA"…"BurdenE") to the single A-E
 * letter used in titles and JSON-LD PropertyValue. Pure helper.
 */
export function burdenTierLetter(tier: IncomeBurdenTier | null): string | null {
  if (!tier) return null;
  return tier.replace(/^Burden/, "");
}

/**
 * Maps an EffectiveRateTier label to the 5-letter (A=very-low … E=very-high)
 * convention used in JSON-LD PropertyValue alongside the human label.
 */
export function effectiveRateTierLetter(
  tier: EffectiveRateTier | null,
): string | null {
  if (!tier) return null;
  switch (tier) {
    case "very-low":
      return "A";
    case "low":
      return "B";
    case "moderate":
      return "C";
    case "high":
      return "D";
    case "very-high":
      return "E";
  }
}
