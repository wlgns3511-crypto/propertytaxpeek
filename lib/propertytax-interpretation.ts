/**
 * propertytax-interpretation — composite reader that synthesises the
 * four PropertyTaxPeek levers into a one-line verdict plus a four-
 * paragraph explainer with one of five "escape route" recommendations.
 *
 * Phase 6 v6.4 PSU 1차 (2026-05-12). Composes:
 *   1. EffectiveRateVsAssessmentDecoder (rate-side, 5 bands)
 *   2. IncomeBurdenBand (income-side, 5 bands)
 *   3. HomesteadExemptionMatrix (statutory relief, 5 tiers)
 *   4. AssessmentAppealSuccessTier (contest infrastructure, 5 tiers)
 *
 * The interpretation layer is the PSU AdSense readability lever. It does
 * not invent new numbers; every claim it surfaces is grounded in one of
 * the four backing classifiers, which are themselves grounded in Census
 * ACS 2024 5-Year (B25103 / B25077 / B19013), state-exemption statutes,
 * and state appeal-mechanism statutes.
 *
 * Honest framing:
 *   - The "verdict" is editorial. It is NOT endorsed by Census, IRS,
 *     IAAO, or any state Department of Revenue.
 *   - "Escape route" branches are heuristics. None of them substitute
 *     for a county assessor consultation or a licensed tax professional.
 *   - DataIncomplete branch fires when too few levers resolve. We
 *     surface the limitation rather than fabricating a verdict.
 */
import type { EffectiveRateDecoderResult, EffectiveRateTier } from "@/lib/effective-rate-decoder";
import type { HomesteadExemptionMatrixResult, ExemptionTier } from "@/lib/homestead-exemption-matrix";
import type { IncomeBurdenBandResult, IncomeBurdenTier } from "@/lib/proptax-income-burden-band";
import type { AppealSuccessTierResult, AppealSuccessTier } from "@/lib/assessment-appeal-success-tier";

export type EscapeRoute =
  | "move-to-low"
  | "max-exemption"
  | "appeal-now"
  | "cap-shelter"
  | "data-incomplete";

export interface PropertyTaxInterpretation {
  verdict: string;
  /** One of five escape-route branches that the four-paragraph framing follows. */
  escapeRoute: EscapeRoute;
  /** A friendly recommendation phrase ("Consider appealing this cycle"). */
  recommendation: string;
  /** Four paragraphs of reader-help. */
  paragraphs: {
    rateContext: string;
    burdenContext: string;
    reliefContext: string;
    nextStep: string;
  };
  /** Authorities cited in the surface (also drives the AuthorBox source string). */
  authorities: string[];
  /** Always present caveats for YMYL HIGHEST. */
  caveats: string[];
  /** One of emerald / amber / rose / slate for the verdict box tone. */
  verdictTone: "emerald" | "amber" | "rose" | "slate";
}

export interface InterpretInputs {
  countyName: string;
  stateName: string;
  rate: EffectiveRateDecoderResult;
  burden: IncomeBurdenBandResult;
  matrix: HomesteadExemptionMatrixResult;
  appeal: AppealSuccessTierResult;
}

// ─────────────────────────────────────────────────────────────────────
// Escape-route decision logic — deterministic over the 4 tuple cells.
// ─────────────────────────────────────────────────────────────────────

const HIGH_RATE_TIERS: EffectiveRateTier[] = ["high", "very-high"];
const LOW_RATE_TIERS: EffectiveRateTier[] = ["very-low", "low"];
const HIGH_BURDEN_TIERS: IncomeBurdenTier[] = ["BurdenD", "BurdenE"];
const STRONG_RELIEF_TIERS: ExemptionTier[] = ["generous", "top-tier"];
const STRONG_APPEAL_TIERS: AppealSuccessTier[] = ["StrongChance", "GoodChance"];
const CAP_SHELTER_TIERS: AppealSuccessTier[] = ["RareSuccess"];

function escapeRouteFor(inputs: InterpretInputs): EscapeRoute {
  const rateTier = inputs.rate.tier;
  const burdenTier = inputs.burden.tier;
  const matrixTier = inputs.matrix.tier;
  const appealTier = inputs.appeal.tier;
  const resolved = [rateTier, burdenTier, matrixTier, appealTier].filter((t) => t != null).length;
  if (resolved < 2) return "data-incomplete";
  // Cap-sheltered states: most homesteaders have a structural reduction in
  // year-over-year tax growth, so emphasising appeal would be misleading.
  if (appealTier && CAP_SHELTER_TIERS.includes(appealTier)) return "cap-shelter";
  // Severe burden + strong appeal infrastructure → contest the assessment.
  if (burdenTier && HIGH_BURDEN_TIERS.includes(burdenTier) && appealTier && STRONG_APPEAL_TIERS.includes(appealTier)) {
    return "appeal-now";
  }
  if (rateTier && HIGH_RATE_TIERS.includes(rateTier) && appealTier && STRONG_APPEAL_TIERS.includes(appealTier)) {
    return "appeal-now";
  }
  // High burden, weak exemption → exemption stacking is the practical first move.
  if (burdenTier && HIGH_BURDEN_TIERS.includes(burdenTier) && matrixTier && !STRONG_RELIEF_TIERS.includes(matrixTier)) {
    return "max-exemption";
  }
  if (matrixTier && STRONG_RELIEF_TIERS.includes(matrixTier)) {
    return "max-exemption";
  }
  // Severe burden with no exemption upside + weak appeal infrastructure → cross-state comparison is the honest framing.
  if (burdenTier === "BurdenE") return "move-to-low";
  // Light to moderate burden + low rate → contextualised "you're already on the good side".
  if (
    burdenTier &&
    rateTier &&
    !HIGH_BURDEN_TIERS.includes(burdenTier) &&
    LOW_RATE_TIERS.includes(rateTier)
  ) {
    return "max-exemption";
  }
  return "max-exemption";
}

// ─────────────────────────────────────────────────────────────────────
// Verdict + paragraph composition
// ─────────────────────────────────────────────────────────────────────

function verdictToneFor(route: EscapeRoute, inputs: InterpretInputs): "emerald" | "amber" | "rose" | "slate" {
  if (route === "data-incomplete") return "slate";
  if (route === "cap-shelter") return "emerald";
  if (route === "move-to-low") return "rose";
  if (route === "appeal-now") return "amber";
  // max-exemption falls back on burden tone
  const b = inputs.burden.tier;
  if (b && HIGH_BURDEN_TIERS.includes(b)) return "amber";
  return "emerald";
}

function verdictSentence(inputs: InterpretInputs, route: EscapeRoute): string {
  const pieces: string[] = [];
  if (inputs.rate.tier) {
    pieces.push(`${inputs.rate.effectiveRatePct?.toFixed(2)}% effective rate`);
  }
  if (inputs.burden.tier) {
    pieces.push(`${inputs.burden.label.replace("%", "%")}`);
  }
  if (inputs.matrix.tier) {
    pieces.push(`Homestead ${inputs.matrix.tier}`);
  }
  if (inputs.appeal.tier) {
    pieces.push(`Appeal ${inputs.appeal.tier.replace("Chance", " Chance").replace("Success", " Success").trim()}`);
  }
  const head = `${inputs.countyName}, ${inputs.stateName}: ${pieces.length ? pieces.join(" · ") : "limited data"}.`;
  const tail: Record<EscapeRoute, string> = {
    "move-to-low": "Severe income-share burden with limited contest upside — consider whether the location decision itself is the lever.",
    "max-exemption": "Maximise statutory relief before any other lever — file or refile the homestead, senior, veteran, or disability paths your state offers.",
    "appeal-now": "Contesting this cycle's assessment is the highest-leverage move available.",
    "cap-shelter": "An assessment cap is doing structural work in your favor — focus reading on the cap rules, not on appeal mechanics.",
    "data-incomplete": "Insufficient Census ACS or statutory data resolved for a full reading on this county.",
  };
  return `${head} ${tail[route]}`;
}

function rateContext(inputs: InterpretInputs): string {
  const r = inputs.rate;
  if (!r.tier) {
    return "Census ACS did not resolve an effective rate for this county in the 2024 5-Year window, so the rate-side context paragraph is blank. Counties get suppressed when the relative margin of error on median taxes paid or median home value exceeds 30 percent.";
  }
  const cap = r.hasAssessmentCap ? ` The state operates an assessment-value cap (${r.assessmentCapLabel ?? "see state exemption summary"}), which limits how fast the assessed value can climb year-over-year.` : "";
  return `Effective rate is ${r.effectiveRatePct?.toFixed(2)} percent of home value, classified ${r.tier} by the EffectiveRateVsAssessmentDecoder. National-gap is ${r.nationalGapPp == null ? "not computed" : `${r.nationalGapPp > 0 ? "+" : ""}${r.nationalGapPp.toFixed(2)} percentage points versus the cross-state average`}.${cap}`;
}

function burdenContext(inputs: InterpretInputs): string {
  const b = inputs.burden;
  if (!b.tier) {
    return "Income-share burden is not available because either the median household income (Census ACS B19013) or the median real estate taxes paid (B25103) was suppressed for this county.";
  }
  const salt = b.saltCapBinding
    ? " The implied bill already exceeds the $10,000 SALT deduction cap (Internal Revenue Code § 164(b)(6), enacted by the Tax Cuts and Jobs Act of 2017), so additional itemised state and local tax above the cap returns no federal deduction for typical filers."
    : "";
  return `Income-share burden is ${b.burdenPct?.toFixed(1)} percent of the county's median household income — banded ${b.tier} (${b.label}). This is the IncomeBurdenBand reading.${salt}`;
}

function reliefContext(inputs: InterpretInputs): string {
  const m = inputs.matrix;
  if (!m.tier) {
    return "Statutory relief data is incomplete for this state in the HomesteadExemptionMatrix dataset; consult the state Department of Revenue directly for homestead, senior, veteran, and disability exemption details.";
  }
  return `Statutory relief score is ${m.tier} (HomesteadExemptionMatrix total ${m.totalScore} of 10 across basic / senior / veteran / disability / cap axes). Cohort framing: ${m.cohort}. Most states require an active filing — exemptions rarely apply by default, and the filing-process line in our state pages summarises that.`;
}

function nextStep(inputs: InterpretInputs, route: EscapeRoute): string {
  switch (route) {
    case "appeal-now":
      return `Appeal infrastructure is classified ${inputs.appeal.label}. ${inputs.appeal.publicizedRange ? `Published reduction-rate context: ${inputs.appeal.publicizedRange}.` : ""} The single most common rejection cause nationwide is missing the filing window — verify your county's deadline with the assessor before assembling evidence.`;
    case "max-exemption":
      return `Verify your filing status against every exemption axis the HomesteadExemptionMatrix tracks (basic, senior, veteran, disability, assessment cap). Most counties also surface county-supplement exemptions on top of the state baseline; that is the lever to confirm with the assessor.`;
    case "cap-shelter":
      return `Read the cap rules carefully — Save Our Homes (Florida), Proposition 13 (California), Proposition 117 (Arizona), Measure 50 (Oregon), and the Oklahoma Article X § 8B cap each have their own portability, decline-in-value, and new-construction reset rules. Appeals still apply for decline-in-value and non-homestead parcels.`;
    case "move-to-low":
      return `When income-share burden lands in the BurdenE band and statutory relief plus appeal infrastructure both fall short, the location decision itself is the lever the data points at. Cross-county and cross-state comparison pages on this site surface the same Census ACS series for that decision.`;
    case "data-incomplete":
      return `With fewer than two levers resolved, the honest reader-help is to consult the state Department of Revenue page for current exemption forms and to ask the county assessor directly for the current effective rate and assessed value on your specific parcel.`;
  }
}

const COMMON_CAVEATS: string[] = [
  "Property tax interpretation on PropertyTaxPeek is editorial. It is not endorsed by the Census Bureau, the Internal Revenue Service, IAAO, or any state Department of Revenue.",
  "All four backing levers ground out in published data: Census ACS 2024 5-Year (B25103, B25077, B19013), each state's exemption statutes, and each state's appeal-mechanism statutes.",
  "Final tax determinations are made by your local county assessor and tax authority. Verify current rates, exemptions, and filing windows with the assessor or a licensed tax professional before acting.",
];

const AUTHORITIES_ALWAYS: string[] = [
  "US Census Bureau — American Community Survey 2024 5-Year (B25103 median real estate taxes paid)",
  "US Census Bureau — American Community Survey 2024 5-Year (B25077 median home value)",
  "US Census Bureau — American Community Survey 2024 5-Year (B19013 median household income)",
  "Internal Revenue Code § 164(b)(6) — SALT cap (Tax Cuts and Jobs Act of 2017, Public Law 115-97 § 11042)",
  "IAAO Standard on Property Tax Policy — Section 7 on appeals",
];

const RECOMMENDATION: Record<EscapeRoute, string> = {
  "appeal-now": "Contest this assessment cycle",
  "max-exemption": "Maximise statutory relief",
  "cap-shelter": "Lean on the assessment cap",
  "move-to-low": "Reconsider location",
  "data-incomplete": "Consult assessor for current figures",
};

export function interpretPropertyTax(inputs: InterpretInputs): PropertyTaxInterpretation {
  const route = escapeRouteFor(inputs);
  const tone = verdictToneFor(route, inputs);
  return {
    verdict: verdictSentence(inputs, route),
    escapeRoute: route,
    recommendation: RECOMMENDATION[route],
    paragraphs: {
      rateContext: rateContext(inputs),
      burdenContext: burdenContext(inputs),
      reliefContext: reliefContext(inputs),
      nextStep: nextStep(inputs, route),
    },
    authorities: AUTHORITIES_ALWAYS,
    caveats: COMMON_CAVEATS,
    verdictTone: tone,
  };
}
