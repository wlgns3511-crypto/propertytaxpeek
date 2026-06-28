/**
 * AssessmentAppealSuccessTier — deterministic 5-tier classifier for the
 * structural ease of contesting a county property tax assessment in a
 * given state.
 *
 * Phase 6 v6.4 PSU 1차 (2026-05-12): the classifier reads the published
 * appeal mechanism (independent tax court vs administrative-only vs
 * county-board), the assessment-cap regime, and — where the state DOR
 * or county assessor publishes them — the empirical reduction-rate
 * range. It outputs a single 5-tier "chance you successfully reduce
 * your assessment" reader heuristic.
 *
 * Honest framing:
 *   - "Chance" is a structural readability score, not a probability
 *     prediction. Outcomes depend on individual evidence quality,
 *     filing-window compliance, and assessor discretion.
 *   - The classifier blends two signal types:
 *       (a) the appeal infrastructure (IAAO Standard on Property Tax
 *           Policy Section 7; state-by-state inventory)
 *       (b) where published, empirical reduction rates from the state
 *           DOR, state tax court, or county assessor (e.g., Cook County
 *           Assessor, NJ Tax Court annual reports, MD State Department
 *           of Assessments and Taxation reports).
 *   - States without a published empirical rate are honestly flagged
 *     "successPublicized=false". The structural tier still classifies,
 *     but the result is marked confidence='mechanism-only'.
 *   - StrongChance ≠ "you will win". Filing-window mistakes alone
 *     reject the majority of appeals nationwide.
 *   - This is editorial. It is NOT endorsed by IAAO, Census, IRS, or
 *     any state Department of Revenue.
 */

export type AppealSuccessTier =
  | "StrongChance"
  | "GoodChance"
  | "ModerateChance"
  | "LowChance"
  | "RareSuccess";

export interface AppealSuccessTierResult {
  tier: AppealSuccessTier | null;
  /** Free-text label for the surface, e.g. "Strong Chance — independent tax court route". */
  label: string;
  /** The structural mechanism the state offers. */
  mechanism: AppealMechanism;
  /** Whether a state DOR / tax court / county assessor publishes a reduction-rate range. */
  successPublicized: boolean;
  /** Published reduction-rate range when known, else null. */
  publicizedRange: string | null;
  /** Reasons supporting the tier (1-3 short bullets). */
  drivers: string[];
  /** YMYL HIGHEST caveats — always present. */
  caveats: string[];
  confidence: "publicized-rate" | "mechanism-only" | "no-data";
}

export type AppealMechanism =
  | "tax-court" // independent quasi-judicial body
  | "hybrid" // county board + state-level review route
  | "administrative" // assessor → board of equalization only
  | "cap-sheltered" // assessment cap makes appeals low-value
  | "unknown";

// ─────────────────────────────────────────────────────────────────────
// Per-state classification table.
// Mechanism is sourced from each state's statutory framework as
// surveyed by IAAO and state property tax administrator publications.
// "successPublicized" + "publicizedRange" are set only where the state
// or major county publishes an empirical reduction rate.
// ─────────────────────────────────────────────────────────────────────

interface StateAppealRecord {
  abbr: string;
  mechanism: AppealMechanism;
  successPublicized: boolean;
  publicizedRange: string | null;
  drivers: string[];
}

const STATE_APPEAL: Record<string, StateAppealRecord> = {
  NJ: {
    abbr: "NJ",
    mechanism: "tax-court",
    successPublicized: true,
    publicizedRange: "30–45% of contested assessments are reduced (NJ Tax Court annual statistics)",
    drivers: [
      "Independent New Jersey Tax Court (N.J.S.A. 2B:13) handles assessment appeals.",
      "Two-tier appeal: county board → tax court, both with documented outcomes.",
      "Strict April 1 filing deadline (N.J.S.A. 54:3-21).",
    ],
  },
  IL: {
    abbr: "IL",
    mechanism: "tax-court",
    successPublicized: true,
    publicizedRange: "Cook County Assessor reports 30–60% reduction rate for residential appeals filed within window",
    drivers: [
      "Cook County maintains the largest county-level appeal volume in the US.",
      "State route: county board of review → Illinois Property Tax Appeal Board (PTAB).",
      "Filing windows vary by township; missing the window is the dominant rejection reason.",
    ],
  },
  MD: {
    abbr: "MD",
    mechanism: "tax-court",
    successPublicized: true,
    publicizedRange: "MD Tax Court reports outcomes annually; reduction rate roughly 25–40% on appealed parcels",
    drivers: [
      "Maryland Tax Court (Tax-Property Article § 14-512) is an independent quasi-judicial body.",
      "Three-tier: assessor → Property Tax Assessment Appeal Board → Tax Court.",
      "45-day filing deadline from notice of assessment.",
    ],
  },
  IN: {
    abbr: "IN",
    mechanism: "tax-court",
    successPublicized: false,
    publicizedRange: null,
    drivers: [
      "Indiana Board of Tax Review (IC 6-1.5) and Indiana Tax Court (IC 33-26).",
      "County PTABOA → IBTR → Tax Court chain.",
      "Outcome rates not published at the state level.",
    ],
  },
  GA: {
    abbr: "GA",
    mechanism: "tax-court",
    successPublicized: false,
    publicizedRange: null,
    drivers: [
      "Independent Board of Equalization (O.C.G.A. § 48-5-311) at the county level.",
      "Superior court appeal route preserved.",
      "Outcome rates not consistently published.",
    ],
  },
  MN: {
    abbr: "MN",
    mechanism: "tax-court",
    successPublicized: false,
    publicizedRange: null,
    drivers: [
      "Minnesota Tax Court (Minn. Stat. § 271) hears property tax cases.",
      "Two-tier: local board → Tax Court.",
      "Strict April 30 filing for prior year's assessment.",
    ],
  },
  OH: {
    abbr: "OH",
    mechanism: "tax-court",
    successPublicized: false,
    publicizedRange: null,
    drivers: [
      "Ohio Board of Tax Appeals (BTA) reviews county Board of Revision decisions.",
      "Two-tier path well documented in state law (ORC § 5717).",
      "March 31 filing deadline for prior tax year.",
    ],
  },
  CT: {
    abbr: "CT",
    mechanism: "tax-court",
    successPublicized: false,
    publicizedRange: null,
    drivers: [
      "Connecticut Superior Court route preserved for property tax appeals (C.G.S. § 12-117a).",
      "Two-tier: Board of Assessment Appeals → Superior Court.",
      "Outcome rates not published at the state level.",
    ],
  },
  PA: {
    abbr: "PA",
    mechanism: "hybrid",
    successPublicized: false,
    publicizedRange: null,
    drivers: [
      "County Board of Assessment Appeals → Common Pleas Court route (53 Pa.C.S. § 8801).",
      "Allegheny County and Philadelphia run distinct appeal regimes.",
      "Outcome rates not consistently published.",
    ],
  },
  NY: {
    abbr: "NY",
    mechanism: "hybrid",
    successPublicized: false,
    publicizedRange: null,
    drivers: [
      "Small Claims Assessment Review (SCAR) for residential under $250k assessment (RPTL § 730).",
      "Article 7 proceedings in Supreme Court for larger or commercial.",
      "Outcome rates not centrally published.",
    ],
  },
  MA: {
    abbr: "MA",
    mechanism: "hybrid",
    successPublicized: false,
    publicizedRange: null,
    drivers: [
      "Appellate Tax Board (M.G.L. ch. 58A) hears appeals after local board.",
      "ATB publishes case decisions but not aggregate reduction rates.",
      "February 1 filing deadline.",
    ],
  },
  TX: {
    abbr: "TX",
    mechanism: "hybrid",
    successPublicized: true,
    publicizedRange: "Travis Central Appraisal District reports residential reduction rate of roughly 40–50% on filed protests",
    drivers: [
      "Appraisal Review Board (ARB) is statutorily required in every county (Tex. Tax Code § 41).",
      "Several major counties (Travis, Harris, Bexar, Dallas) publish reduction-rate metrics.",
      "May 15 filing deadline.",
    ],
  },
  FL: {
    abbr: "FL",
    mechanism: "cap-sheltered",
    successPublicized: false,
    publicizedRange: null,
    drivers: [
      "Save Our Homes 3% annual cap (Florida Constitution Art. VII § 4(d)) shelters most homesteads from large assessment swings.",
      "Value Adjustment Board (Fla. Stat. § 194.011) is the appeal path.",
      "Cap reduces the rate-of-return on appeals for most homestead owners.",
    ],
  },
  CA: {
    abbr: "CA",
    mechanism: "cap-sheltered",
    successPublicized: false,
    publicizedRange: null,
    drivers: [
      "Proposition 13 (Cal. Const. Art. XIIIA) caps assessed-value growth at 2% per year.",
      "Assessment Appeals Board (R&T Code § 1601) hears protests, but the cap limits the gap to contest.",
      "Most successful appeals are tied to a decline-in-value scenario or new-construction triggers.",
    ],
  },
  AZ: {
    abbr: "AZ",
    mechanism: "cap-sheltered",
    successPublicized: false,
    publicizedRange: null,
    drivers: [
      "Proposition 117 (Ariz. Const. Art. IX § 18) caps limited property value growth at 5% per year.",
      "Two-tier appeal: county assessor → State Board of Equalization → Tax Court (A.R.S. § 42-16201).",
      "Cap limits the appeal upside for homesteads.",
    ],
  },
  OR: {
    abbr: "OR",
    mechanism: "cap-sheltered",
    successPublicized: false,
    publicizedRange: null,
    drivers: [
      "Measure 50 (Ore. Const. Art. XI § 11) freezes assessed value growth at 3% per year.",
      "Two-tier appeal: BOPTA → Magistrate Division → Regular Division of Oregon Tax Court (ORS 305.501).",
      "Cap limits the homesteader's appeal upside.",
    ],
  },
  OK: {
    abbr: "OK",
    mechanism: "cap-sheltered",
    successPublicized: false,
    publicizedRange: null,
    drivers: [
      "Oklahoma Constitution Art. X § 8B caps annual assessment growth (3% for homesteads, 5% other).",
      "County Board of Equalization → district court appeal route.",
      "Cap reduces homesteader appeal value.",
    ],
  },
};

// Catch-all administrative mechanism for states without an entry above.
function defaultRecord(abbr: string): StateAppealRecord {
  return {
    abbr,
    mechanism: "administrative",
    successPublicized: false,
    publicizedRange: null,
    drivers: [
      "Assessor → county Board of Equalization is the typical path; appeal volumes and outcomes are not centrally published.",
      "Filing windows are strict and vary by jurisdiction.",
      "State Department of Revenue may offer a secondary review.",
    ],
  };
}

// Map mechanism → tier (then nudge by successPublicized signal).
function tierFor(record: StateAppealRecord): AppealSuccessTier {
  if (record.mechanism === "tax-court" && record.successPublicized) return "StrongChance";
  if (record.mechanism === "tax-court") return "GoodChance";
  if (record.mechanism === "hybrid" && record.successPublicized) return "GoodChance";
  if (record.mechanism === "hybrid") return "ModerateChance";
  if (record.mechanism === "administrative") return "LowChance";
  // cap-sheltered → RareSuccess for homesteads
  return "RareSuccess";
}

const TIER_LABEL_BASE: Record<AppealSuccessTier, string> = {
  StrongChance: "Strong Chance",
  GoodChance: "Good Chance",
  ModerateChance: "Moderate Chance",
  LowChance: "Low Chance",
  RareSuccess: "Rare Success",
};

export function tierLabel(tier: AppealSuccessTier | null): string {
  if (!tier) return "Unknown";
  return TIER_LABEL_BASE[tier];
}

export function tierToneColor(tier: AppealSuccessTier | null): string {
  if (!tier) return "slate";
  if (tier === "StrongChance") return "emerald";
  if (tier === "GoodChance") return "emerald";
  if (tier === "ModerateChance") return "amber";
  if (tier === "LowChance") return "amber";
  return "rose";
}

const COMMON_CAVEATS: string[] = [
  "Appeal mechanisms are sourced from each state's statutory framework as surveyed by the International Association of Assessing Officers (IAAO) Standard on Property Tax Policy and from state Department of Revenue publications.",
  "Filing-window non-compliance is the most common appeal rejection cause nationwide. Reduction-rate data, where available, applies only to timely-filed appeals.",
  "Published reduction rates (NJ Tax Court, Cook County Assessor, MD Tax Court, Travis Central Appraisal District in Texas) are reported on residential appealed parcels — not on the full universe of assessed parcels.",
  "Cap-sheltered states (California, Florida, Arizona, Oregon, Oklahoma) limit assessment-value growth for homesteads; this shrinks the appeal upside but does not eliminate the right to contest.",
  "The tier is editorial. It is not a Census, IRS, or state Department of Revenue product, and it does not predict an individual case outcome.",
];

export const APPEAL_TIER_CUTOFF_SUMMARY: { tier: AppealSuccessTier; range: string; label: string }[] = [
  { tier: "StrongChance", range: "Independent tax court + published reduction-rate", label: "Strong Chance — tax court route with documented outcome data" },
  { tier: "GoodChance", range: "Tax court route (no published rate) OR hybrid + published rate", label: "Good Chance — structural infrastructure favors the filer" },
  { tier: "ModerateChance", range: "Hybrid (county + state review) route", label: "Moderate Chance — multi-step path with limited public data" },
  { tier: "LowChance", range: "Administrative-only (county board)", label: "Low Chance — single-tier path; outcomes not published" },
  { tier: "RareSuccess", range: "Cap-sheltered state", label: "Rare Success — assessment cap limits the appeal upside for homesteads" },
];

export function classifyAssessmentAppealSuccess(
  stateAbbr: string | null | undefined,
): AppealSuccessTierResult {
  if (!stateAbbr) {
    return {
      tier: null,
      label: "Unknown — state not identified",
      mechanism: "unknown",
      successPublicized: false,
      publicizedRange: null,
      drivers: [],
      caveats: COMMON_CAVEATS,
      confidence: "no-data",
    };
  }
  const upper = stateAbbr.toUpperCase();
  const record = STATE_APPEAL[upper] ?? defaultRecord(upper);
  const tier = tierFor(record);
  const baseLabel = TIER_LABEL_BASE[tier];
  const subTitle =
    record.mechanism === "tax-court"
      ? "independent tax court route"
      : record.mechanism === "hybrid"
        ? "county-board + state-review route"
        : record.mechanism === "administrative"
          ? "administrative county-board route"
          : record.mechanism === "cap-sheltered"
            ? "assessment-cap state"
            : "mechanism not classified";
  return {
    tier,
    label: `${baseLabel} — ${subTitle}`,
    mechanism: record.mechanism,
    successPublicized: record.successPublicized,
    publicizedRange: record.publicizedRange,
    drivers: record.drivers,
    caveats: COMMON_CAVEATS,
    confidence: record.successPublicized ? "publicized-rate" : "mechanism-only",
  };
}

export function tierBlurb(tier: AppealSuccessTier | null, mechanism: AppealMechanism): string {
  switch (tier) {
    case "StrongChance":
      return "States with an independent tax court route AND a published reduction-rate range. Appeals are not guaranteed to win, but the structural path and the public data both reward a well-documented, timely filing.";
    case "GoodChance":
      return mechanism === "tax-court"
        ? "Independent tax court route exists but the state does not centrally publish a reduction rate. Structural infrastructure favors the filer; outcome data is case-by-case."
        : "Hybrid (county + state) review route with at least one major jurisdiction publishing reduction-rate data. Filing-window compliance is the largest single rejection cause.";
    case "ModerateChance":
      return "Hybrid (county-board + state-level review) route. Outcomes are not centrally reported. Strict filing windows are the dominant rejection cause; evidence quality drives the rest.";
    case "LowChance":
      return "Administrative county-board path only. Appeals proceed but outcomes are not published, and the single-tier structure limits cross-checking. Filing windows are short and strictly enforced.";
    case "RareSuccess":
      return "Cap-sheltered state. Assessment-value caps (Proposition 13 California, Save Our Homes Florida, Proposition 117 Arizona, Measure 50 Oregon, Constitution Art. X § 8B Oklahoma) limit how much assessed value can move year-over-year, which limits the appeal upside for homesteads. Appeals still exist for decline-in-value, new-construction, or non-homestead parcels.";
    default:
      return "Appeal success tier is not available for this jurisdiction.";
  }
}
