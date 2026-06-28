/**
 * EffectiveRateVsAssessmentDecoder — deterministic reader for the
 * Census ACS-derived effective rate, exposing the assessment-ratio
 * and assessment-cap dynamics that two counties with the same nominal
 * mill rate can wildly diverge on.
 *
 * Phase 6 v6.4 PSU (2026-05-11): the decoder bands the effective rate
 * into 5 magnitude tiers, then layers (a) the national-gap reading,
 * (b) the assessment-cap signal from state-exemption-data, and (c) the
 * driver-set the band typically reflects (school district vs special
 * district vs reassessment cycle vs assessment ratio).
 *
 * Honest framing:
 *   - Effective rate = Census ACS B25103 / B25077 (median real estate
 *     taxes / median home value). It is NOT the statutory mill rate.
 *   - The decoder is editorial. It is NOT endorsed by Census, IRS, or
 *     state DOR.
 *   - It does not substitute for an assessor's tax calculation.
 *   - Null / 0% effective rate → tier=null + confidence='no-data'.
 */
import type { StateExemptionData } from "@/lib/state-exemption-data";

export type EffectiveRateTier =
  | "very-low"
  | "low"
  | "moderate"
  | "high"
  | "very-high";

export interface EffectiveRateDecoderResult {
  tier: EffectiveRateTier | null;
  effectiveRatePct: number | null;
  /** pp difference vs national avg (positive = above national). */
  nationalGapPp: number | null;
  /** pp difference vs state avg (positive = above state). Null when not applicable. */
  stateGapPp: number | null;
  /** Whether the state has an assessment-value cap (e.g., Prop 13). */
  hasAssessmentCap: boolean;
  /** Free-text label of the state cap if present, else null. */
  assessmentCapLabel: string | null;
  /** Drivers that typically explain the band — editorial. */
  drivers: string[];
  /** YMYL HIGHEST caveats — always present. */
  caveats: string[];
  confidence: "census-acs" | "no-data";
}

// ─────────────────────────────────────────────────────────────────────
// Cutoffs (percent, not decimal)
// ─────────────────────────────────────────────────────────────────────

export const EFFECTIVE_RATE_TIER_CUTOFFS = {
  veryLow: 0.5, //  < 0.5%  → very-low
  low: 0.9, //      < 0.9%  → low
  moderate: 1.5, // < 1.5%  → moderate
  high: 2.0, //     < 2.0%  → high
  // >= 2.0% → very-high
};

function bandRate(pct: number): EffectiveRateTier {
  if (pct < EFFECTIVE_RATE_TIER_CUTOFFS.veryLow) return "very-low";
  if (pct < EFFECTIVE_RATE_TIER_CUTOFFS.low) return "low";
  if (pct < EFFECTIVE_RATE_TIER_CUTOFFS.moderate) return "moderate";
  if (pct < EFFECTIVE_RATE_TIER_CUTOFFS.high) return "high";
  return "very-high";
}

// ─────────────────────────────────────────────────────────────────────
// Driver-set descriptions — editorial heuristics, deterministic per band
// ─────────────────────────────────────────────────────────────────────

function driversFor(
  band: EffectiveRateTier,
  hasCap: boolean,
  hasGenerousHomestead: boolean,
): string[] {
  switch (band) {
    case "very-low":
      return [
        hasCap
          ? "Assessment cap holds long-term homeowners well below market — Census ACS median masks the wide spread between recent buyers and long-term owners."
          : "Statewide low rates — typically paired with revenue from sales or severance tax (resource-economy states).",
        hasGenerousHomestead
          ? "Statutory homestead is generous enough to subtract a meaningful share of the median home value before tax."
          : "Low millage at the county level — verify school and special-district shares.",
        "Mortgage escrow estimates may understate first-year taxes for new buyers if the prior owner held a frozen assessment.",
      ];
    case "low":
      return [
        "Moderate millage with average assessment ratios; Census ACS median sits below the national mean.",
        hasCap
          ? "Assessment cap blunts year-to-year increases, helping the long-term homeowner more than the recent buyer."
          : "No statewide cap on assessment growth — bills track market reassessments closely.",
        "School-district share usually dominates; check the school portion if comparing same-county neighborhoods.",
      ];
    case "moderate":
      return [
        "Census ACS median is near the US average — neither a bargain nor a burden.",
        hasCap
          ? "Cap-protected long-term owners diverge from recent buyers — newer mortgages will read higher than this median."
          : "Reassessment cycle (annual vs cyclical) is the main driver of bill-to-bill variation.",
        "Special-district levies (fire/library/sewer) often hide an additional 0.1–0.3 pp inside the headline rate.",
      ];
    case "high":
      return [
        "School-district funding model leans heavily on property tax — typical of states with no income tax or low sales tax.",
        hasGenerousHomestead
          ? "Generous statutory homestead exists but does not bring the unexempted Census ACS median below the high band."
          : "Statutory homestead is small relative to the median home value — most homeowners pay close to the unexempted bill.",
        "SALT cap (IRS Pub 530 / IRC §164(b)(6) $10K) typically binds for the median homeowner here.",
      ];
    case "very-high":
      return [
        "Census ACS median sits in the top quintile — driven by some combination of school-district funding, deep special-district levies, and full-market assessment ratios.",
        hasCap
          ? "Cap exists but did not prevent the headline rate from reaching this band — typically the cap is on assessment growth, not mill rate."
          : "No state-level cap on assessment growth — bills move with market reassessments without smoothing.",
        "Federal SALT $10K cap (IRS Pub 530) is binding for nearly every homeowner — confirm whether your county also has supplements on top of state exemptions.",
      ];
  }
}

// ─────────────────────────────────────────────────────────────────────
// Caveat set — universal for YMYL HIGHEST
// ─────────────────────────────────────────────────────────────────────

function baseCaveats(): string[] {
  return [
    "Census ACS median is a five-year smoothed figure; a single legislative change or reassessment year is not reflected until the next Census release.",
    "The effective rate is computed from Census ACS table B25103 (real estate taxes paid) over table B25077 (median home value). It is not the statutory mill rate.",
    "Special-district levies (school, fire, sewer, library) are rolled into the median; your bill may differ if your parcel sits inside a TIF or abatement district.",
    "Your county assessor's certified tax bill is the binding figure — the decoder is editorial guidance, not certification.",
  ];
}

// ─────────────────────────────────────────────────────────────────────
// Public entry point
// ─────────────────────────────────────────────────────────────────────

export function decodeEffectiveRate(opts: {
  effectiveRatePct: number | null | undefined;
  nationalAvgPct: number | null | undefined;
  stateAvgPct?: number | null | undefined;
  stateExemption?: StateExemptionData | undefined;
}): EffectiveRateDecoderResult {
  const { effectiveRatePct, nationalAvgPct, stateAvgPct, stateExemption } = opts;

  if (
    effectiveRatePct == null ||
    !Number.isFinite(effectiveRatePct) ||
    effectiveRatePct <= 0
  ) {
    return {
      tier: null,
      effectiveRatePct: null,
      nationalGapPp: null,
      stateGapPp: null,
      hasAssessmentCap: Boolean(stateExemption?.assessmentCap),
      assessmentCapLabel: stateExemption?.assessmentCap ?? null,
      drivers: [
        "Census ACS did not publish a usable rate for this entity at the current vintage; see methodology for the MOE suppression rule.",
      ],
      caveats: baseCaveats(),
      confidence: "no-data",
    };
  }

  const tier = bandRate(effectiveRatePct);
  const hasCap = Boolean(stateExemption?.assessmentCap);
  const hasGenerousHomestead =
    !!stateExemption && stateExemption.homesteadBase >= 30000;

  const nationalGap =
    nationalAvgPct != null && Number.isFinite(nationalAvgPct)
      ? Number((effectiveRatePct - nationalAvgPct).toFixed(2))
      : null;
  const stateGap =
    stateAvgPct != null && Number.isFinite(stateAvgPct)
      ? Number((effectiveRatePct - stateAvgPct).toFixed(2))
      : null;

  return {
    tier,
    effectiveRatePct,
    nationalGapPp: nationalGap,
    stateGapPp: stateGap,
    hasAssessmentCap: hasCap,
    assessmentCapLabel: stateExemption?.assessmentCap ?? null,
    drivers: driversFor(tier, hasCap, hasGenerousHomestead),
    caveats: baseCaveats(),
    confidence: "census-acs",
  };
}

// ─────────────────────────────────────────────────────────────────────
// Display helpers
// ─────────────────────────────────────────────────────────────────────

export function tierLabel(t: EffectiveRateTier): string {
  switch (t) {
    case "very-low":
      return "Very low";
    case "low":
      return "Low";
    case "moderate":
      return "Moderate";
    case "high":
      return "High";
    case "very-high":
      return "Very high";
  }
}

export function tierBlurb(t: EffectiveRateTier): string {
  switch (t) {
    case "very-low":
      return "Census ACS effective rate sits in the bottom quintile — long-term owners with assessment caps benefit most; recent buyers should expect partial catch-up.";
    case "low":
      return "Census ACS effective rate is below the national average. Affordable headline, but verify the school-district and special-district shares for your parcel.";
    case "moderate":
      return "Census ACS effective rate is near the national average. Bill-to-bill variation is usually driven by reassessment cycle and exemption status.";
    case "high":
      return "Census ACS effective rate is above the national average. SALT $10K cap (IRS Pub 530) typically binds for the median homeowner here.";
    case "very-high":
      return "Census ACS effective rate sits in the top quintile. Federal SALT $10K cap (IRS Pub 530) is binding for nearly every homeowner; verify state and county exemptions before relying on the headline rate.";
  }
}

export type ToneColor = {
  bg: string;
  border: string;
  text: string;
};

export function tierToneColor(t: EffectiveRateTier | null): ToneColor {
  switch (t) {
    case "very-low":
      return { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-900" };
    case "low":
      return { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-900" };
    case "moderate":
      return { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-900" };
    case "high":
      return { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-900" };
    case "very-high":
      return { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-900" };
    default:
      return { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700" };
  }
}

export const RATE_TIER_UNKNOWN_LABEL = "No-data";
export const RATE_TIER_CUTOFF_SUMMARY =
  "< 0.5% very-low · 0.5–0.9% low · 0.9–1.5% moderate · 1.5–2.0% high · ≥ 2.0% very-high";
