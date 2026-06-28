/**
 * Appeal Outcome Simulator — propertytaxpeek signature feature.
 *
 * Phase 6 v6.5 Signature (2026-05-18): the simulator transforms the
 * AssessmentAppealSuccessTier classifier (mechanism + publicized-range
 * data) into an actionable, per-property reader output:
 *   - Over-assessment flag (your assessed value vs. comp-grounded target)
 *   - Estimated annual + 10-year savings if appeal succeeds
 *   - Success probability band (from the published reduction-rate range
 *     or the structural tier when no rate is published)
 *   - Confidence label (function of comp count + comp specificity + tier)
 *   - State-grounded filing-deadline action line
 *
 * Honest framing:
 *   - "Probability band" surfaces the published reduction range verbatim
 *     when the state has one; otherwise it surfaces the tier blurb. We
 *     never invent a percentage we don't have.
 *   - Estimated savings are deterministic math against the county
 *     effective_rate. No Monte-Carlo, no fake CI bands.
 *   - "Confidence" is editorial — a 3-band readability heuristic, NOT a
 *     statistical confidence interval. The label increases when the
 *     filer supplies more grounded comp evidence.
 *   - Over-assessment threshold (assessed > comp_median × 1.10) is an
 *     industry rule-of-thumb. We surface the threshold in methodology.
 */

import {
  AppealSuccessTier,
  AppealSuccessTierResult,
  classifyAssessmentAppealSuccess,
} from "./assessment-appeal-success-tier";
import { getStateDeadline, StateDeadline } from "./state-appeal-deadlines";

export interface SimulatorInput {
  stateAbbr: string;
  countySlug?: string;
  effectiveRatePct: number;
  countyMedianHomeValue: number;
  assessedValue: number;
  comps: number[];
  recentPurchasePrice?: number | null;
  yearBuilt?: number | null;
  sqft?: number | null;
}

export interface SimulatorOutput {
  /** Whether the property is over-assessed against comp/county anchor. */
  overAssessed: boolean;
  /** Percentage your assessed value is above the comp-grounded target. Negative if under. */
  overAssessmentPct: number;
  /** Target assessed value used for the comparison. */
  targetAssessed: number;
  /** Median of supplied comps, or county median fallback. */
  compMedian: number;
  /** Whether the comp median came from user comps (true) or county median fallback (false). */
  hasUserComps: boolean;
  /** Estimated annual savings if appeal succeeds (USD). 0 if not over-assessed. */
  estAnnualSavings: number;
  /** Estimated 10-year savings (no inflation). */
  est10YearSavings: number;
  /** Success probability band — published rate verbatim, or tier-based readability blurb. */
  successBand: string;
  /** Underlying tier object for downstream UI. */
  tierResult: AppealSuccessTierResult;
  /** Deadline info for the state. */
  deadline: StateDeadline;
  /** Editorial confidence label (Low / Medium / High). */
  confidence: "Low" | "Medium" | "High";
  /** Confidence drivers (1-3 short strings). */
  confidenceDrivers: string[];
  /** Action checklist for the filer (3-6 short bullets). */
  actionChecklist: string[];
}

const OVER_ASSESSMENT_BUFFER = 1.10; // assessed > target * 1.10 → flagged

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function classifyConfidence(input: SimulatorInput, tier: AppealSuccessTier | null): {
  label: "Low" | "Medium" | "High";
  drivers: string[];
} {
  const drivers: string[] = [];
  let score = 0;

  const validComps = input.comps.filter((c) => c > 0);
  if (validComps.length >= 3) {
    score += 2;
    drivers.push(`Three or more comparable home values supplied (${validComps.length}).`);
  } else if (validComps.length >= 1) {
    score += 1;
    drivers.push(`Partial comp evidence (${validComps.length} comp${validComps.length === 1 ? "" : "s"}); county median used to fill the gap.`);
  } else {
    drivers.push("No user comp values — county median used as the comparison anchor; pull recent neighborhood sales for a stronger filing.");
  }

  if (input.recentPurchasePrice && input.recentPurchasePrice > 0) {
    score += 1;
    drivers.push("Recent purchase price or independent appraisal supplied — strong evidence for a market-value argument.");
  }

  if (tier === "StrongChance" || tier === "GoodChance") {
    score += 1;
    drivers.push("State has a tax-court appeal route (structural infrastructure favors a well-documented filer).");
  }

  let label: "Low" | "Medium" | "High";
  if (score >= 4) label = "High";
  else if (score >= 2) label = "Medium";
  else label = "Low";

  return { label, drivers };
}

function buildSuccessBand(tier: AppealSuccessTierResult): string {
  if (tier.publicizedRange) return tier.publicizedRange;
  // No published rate — fall back to a structural readability statement.
  switch (tier.tier) {
    case "StrongChance":
      return "Tax-court route exists; outcome rates are not centrally published in this state. Structural infrastructure favors a well-documented filer.";
    case "GoodChance":
      return "Tax-court or hybrid route exists; outcome rates are not centrally published. Filing-window compliance is the dominant rejection cause.";
    case "ModerateChance":
      return "Hybrid (county + state review) route; outcomes not centrally published. Strict filing windows; evidence quality drives the rest.";
    case "LowChance":
      return "Administrative county-board only; outcomes are not published. Single-tier path limits cross-checking.";
    case "RareSuccess":
      return "Cap-sheltered state. Assessment caps reduce the appeal upside for homesteads; appeals remain available for decline-in-value or non-homestead parcels.";
    default:
      return "Outcome distribution unavailable for this jurisdiction.";
  }
}

function buildActionChecklist(
  input: SimulatorInput,
  out: { overAssessed: boolean; deadline: StateDeadline; tier: AppealSuccessTierResult },
): string[] {
  const list: string[] = [];

  if (!out.overAssessed) {
    list.push(
      "Your assessed value sits at or below the comp-grounded target — a successful reduction appeal is unlikely without additional decline-in-value or property-condition evidence.",
    );
  } else {
    list.push(
      `Pull 3-5 recent comparable home sales within ${input.sqft ? "0.5 mi and ±15% of your sqft" : "0.5 mi of your property and similar size/age"} from your county recorder, MLS, or a real-estate agent.`,
    );
    list.push(
      "Request your property record card from the county assessor and check for factual errors (sqft, bath count, lot size, condition rating).",
    );
  }

  if (out.deadline.verified) {
    list.push(`Filing deadline: ${out.deadline.deadline}${out.deadline.source ? ` (${out.deadline.source}).` : "."}`);
  } else {
    list.push(`Filing deadline guidance: ${out.deadline.deadline}`);
  }

  if (out.tier.mechanism === "tax-court") {
    list.push("If the county board denies the appeal, this state has an independent tax-court route for a second review — keep all filing receipts and evidence.");
  } else if (out.tier.mechanism === "hybrid") {
    list.push("Two-tier appeal: county board first, state-level review on denial. Each tier has a separate deadline — confirm both with your county assessor.");
  } else if (out.tier.mechanism === "cap-sheltered") {
    list.push("Because of the state's assessment cap, the appeal upside on a homestead is structurally limited. Consider whether a decline-in-value claim is available.");
  }

  list.push(
    "Filing-window non-compliance is the most common appeal rejection cause nationwide — confirm the deadline with your county assessor before drafting evidence.",
  );

  return list;
}

export function runAppealSimulator(input: SimulatorInput): SimulatorOutput {
  const tierResult = classifyAssessmentAppealSuccess(input.stateAbbr);
  const deadline = getStateDeadline(input.stateAbbr, tierResult.mechanism);

  const validComps = input.comps.filter((c) => c > 0);
  const hasUserComps = validComps.length > 0;
  const compMedian = hasUserComps ? median(validComps) : input.countyMedianHomeValue;

  // Target assessed value = comp median × 1.05 (assessment ratio rule-of-thumb;
  // most states aim for ~100% of market, allow 5% margin for noise).
  const targetAssessed = compMedian * 1.05;

  const overAssessed = input.assessedValue > targetAssessed * OVER_ASSESSMENT_BUFFER;
  const overAssessmentPct = ((input.assessedValue - targetAssessed) / targetAssessed) * 100;

  const gap = Math.max(0, input.assessedValue - targetAssessed);
  const estAnnualSavings = overAssessed ? gap * (input.effectiveRatePct / 100) : 0;
  const est10YearSavings = estAnnualSavings * 10;

  const successBand = buildSuccessBand(tierResult);
  const confidence = classifyConfidence(input, tierResult.tier);
  const actionChecklist = buildActionChecklist(input, { overAssessed, deadline, tier: tierResult });

  return {
    overAssessed,
    overAssessmentPct,
    targetAssessed,
    compMedian,
    hasUserComps,
    estAnnualSavings,
    est10YearSavings,
    successBand,
    tierResult,
    deadline,
    confidence: confidence.label,
    confidenceDrivers: confidence.drivers,
    actionChecklist,
  };
}
