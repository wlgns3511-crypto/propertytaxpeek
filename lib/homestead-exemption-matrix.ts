/**
 * HomesteadExemptionMatrix — deterministic classifier on top of
 * lib/state-exemption-data.ts.
 *
 * Phase 6 v6.4 PSU (2026-05-11): the matrix reads the 5 statutory
 * dimensions PropertyTaxPeek encodes per state — basic homestead amount,
 * senior/over-65 supplement, disabled-veteran exemption, disability
 * (non-veteran) exemption, and assessment cap — and outputs a single
 * 5-band tier so readers can compare the *quality* of relief across
 * states, not just the dollar amount of one line item.
 *
 * Honest framing:
 *   - The matrix is editorial. It is NOT endorsed by Census, IRS, or
 *     state Departments of Revenue.
 *   - It does not certify filing eligibility. County assessors do that.
 *   - "Generous" does not mean "you will qualify" — most strong tiers
 *     are income- or age-tested.
 *   - Missing data → tier=null (no fabrication).
 */
import type { StateExemptionData } from "@/lib/state-exemption-data";

export type AxisScore = 0 | 1 | 2;
export type ExemptionTier =
  | "minimal"
  | "modest"
  | "moderate"
  | "generous"
  | "top-tier";

export interface HomesteadExemptionMatrixResult {
  tier: ExemptionTier | null;
  totalScore: number | null; // 0–10
  axes: {
    basic: AxisScore;
    senior: AxisScore;
    veteran: AxisScore;
    disability: AxisScore;
    assessmentCap: AxisScore;
  };
  cohort: string; // e.g., "Cap-first state", "Veteran-heavy", "Senior freeze + dollar mix"
  caveats: string[]; // county-supplement, filing-required, income-test, etc.
  confidence: "exemption-data-backed" | "consult-assessor";
}

// ─────────────────────────────────────────────────────────────────────
// Axis scorers — each returns 0/1/2 from the raw exemption record.
// ─────────────────────────────────────────────────────────────────────

function scoreBasic(d: StateExemptionData): AxisScore {
  const base = d.homesteadBase;
  if (base >= 30000) return 2;
  if (base >= 5000) return 1;
  // Some states use percentage-of-value or rate-exemption instead of a
  // dollar figure (Michigan PRE, Utah 55% ratio, Maryland 10% cap-as-credit).
  // Look at description for % language as a fallback for these.
  if (/(\d+\s?%|fifty percent|50%)/i.test(d.homesteadDescription)) return 2;
  // Modest exemption hints
  if (
    base > 0 ||
    /credit/i.test(d.homesteadDescription) ||
    /rebate/i.test(d.homesteadDescription)
  ) {
    return 1;
  }
  return 0;
}

function scoreSenior(d: StateExemptionData): AxisScore {
  const s = d.seniorExemption ?? "";
  if (!s) return 0;
  // Strongest: assessment freeze, full exemption, or large dollar amount
  if (
    /\bfreeze\b/i.test(s) ||
    /\bfull (state )?(property )?tax (relief|exemption)\b/i.test(s) ||
    /100%/i.test(s) ||
    /\b\$1[0-9]{2},\d{3}\b/.test(s) || // >= $100K
    /\b\$2[0-9]{2},\d{3}\b/.test(s) || // >= $200K
    /\b\$3[0-9]{2},\d{3}\b/.test(s) // >= $300K
  ) {
    return 2;
  }
  // Moderate: some additional dollar exemption, credit, or rebate
  if (
    /\b\$[0-9],?\d{3}\b/.test(s) ||
    /\bcredit\b/i.test(s) ||
    /\brebate\b/i.test(s) ||
    /\bdeferral\b/i.test(s)
  ) {
    return 1;
  }
  return 0;
}

function scoreVeteran(d: StateExemptionData): AxisScore {
  const v = d.veteranExemption ?? "";
  if (!v) return 0;
  if (
    /\bfull (property )?tax (exemption|relief)\b/i.test(v) ||
    /\b100%\b/i.test(v) ||
    /\b\$1[0-9]{2},\d{3}\b/.test(v) ||
    /\b\$2[0-9]{2},\d{3}\b/.test(v) ||
    /\b\$3[0-9]{2},\d{3}\b/.test(v) ||
    /\b\$4[0-9]{2},\d{3}\b/.test(v) ||
    /\b\$5[0-9]{2},\d{3}\b/.test(v)
  ) {
    return 2;
  }
  if (/\$[0-9],?\d{3}/.test(v) || /\bcredit\b/i.test(v)) return 1;
  return 0;
}

function scoreDisability(d: StateExemptionData): AxisScore {
  const x = d.disabilityExemption ?? "";
  if (!x) return 0;
  if (
    /\bfull (property )?tax (exemption|relief)\b/i.test(x) ||
    /\b100%\b/i.test(x) ||
    /\bsame as (senior|veteran)/i.test(x)
  ) {
    return 2;
  }
  if (/\$[0-9],?\d{3}/.test(x) || /\bcredit\b/i.test(x)) return 1;
  return 0;
}

function scoreAssessmentCap(d: StateExemptionData): AxisScore {
  const cap = d.assessmentCap;
  if (!cap) return 0;
  // Strongest caps: 3% or lower, or a freeze
  if (
    /\b(1|2|3)\s?%\s?\/?\s?(year|annual)/i.test(cap) ||
    /\bfreeze\b/i.test(cap) ||
    /\bProp 13\b/i.test(cap) ||
    /\bMeasure 50\b/i.test(cap) ||
    /\bProposal A\b/i.test(cap)
  ) {
    return 2;
  }
  // 5%–10% caps are moderate
  if (/\b(5|7|8|10)\s?%/i.test(cap)) return 1;
  return 0;
}

// ─────────────────────────────────────────────────────────────────────
// Tier and cohort
// ─────────────────────────────────────────────────────────────────────

function tierFromScore(total: number): ExemptionTier {
  if (total <= 2) return "minimal";
  if (total <= 4) return "modest";
  if (total <= 6) return "moderate";
  if (total <= 8) return "generous";
  return "top-tier";
}

function classifyCohort(
  axes: HomesteadExemptionMatrixResult["axes"],
): string {
  const { basic, senior, veteran, disability, assessmentCap } = axes;
  if (assessmentCap === 2 && basic <= 1) return "Cap-first state";
  if (basic === 2 && senior === 2) return "Dollar + senior stack";
  if (veteran === 2 && disability === 2 && basic <= 1) return "Veteran/disability-heavy";
  if (senior === 2 && assessmentCap === 2) return "Senior freeze + cap";
  if (basic === 2 && veteran === 2) return "Dollar + veteran stack";
  if (basic <= 1 && senior <= 1 && veteran <= 1) return "Means-tested credits only";
  if (basic === 2) return "Dollar-led";
  return "Mixed relief";
}

// ─────────────────────────────────────────────────────────────────────
// Caveats
// ─────────────────────────────────────────────────────────────────────

function deriveCaveats(d: StateExemptionData): string[] {
  const out: string[] = [];
  if (/county/i.test(d.homesteadDescription) || /counties may add/i.test(d.homesteadDescription)) {
    out.push("Counties may stack additional exemption on top of the state baseline.");
  }
  if (/income/i.test(d.seniorExemption ?? "")) {
    out.push("Senior benefit is income-tested.");
  }
  if (/income/i.test(d.disabilityExemption ?? "")) {
    out.push("Disability benefit is income-tested.");
  }
  if (/\bfile\b/i.test(d.filingProcess)) {
    out.push(`Filing is required (${d.filingProcess.split(".")[0].trim()}).`);
  }
  if (/town|municipal|local/i.test(d.notes)) {
    out.push("Exemption administration is municipal, not statewide — verify with your local assessor.");
  }
  // CBP-style "consult a professional" line — universal for YMYL HIGHEST
  out.push(
    "The matrix reflects statutory baseline; your county assessor's filing certificate is the binding determination.",
  );
  return out;
}

// ─────────────────────────────────────────────────────────────────────
// Public entry point
// ─────────────────────────────────────────────────────────────────────

export function classifyHomesteadExemptionMatrix(
  data: StateExemptionData | undefined,
): HomesteadExemptionMatrixResult {
  if (!data || !data.hasHomestead) {
    return {
      tier: null,
      totalScore: null,
      axes: { basic: 0, senior: 0, veteran: 0, disability: 0, assessmentCap: 0 },
      cohort: "No statutory state homestead",
      caveats: [
        "State publishes no statutory homestead exemption — relief is delegated to county/municipal level.",
        "Verify with your local assessor before relying on any matrix entry.",
      ],
      confidence: "consult-assessor",
    };
  }

  const axes = {
    basic: scoreBasic(data),
    senior: scoreSenior(data),
    veteran: scoreVeteran(data),
    disability: scoreDisability(data),
    assessmentCap: scoreAssessmentCap(data),
  };
  const totalScore =
    axes.basic + axes.senior + axes.veteran + axes.disability + axes.assessmentCap;
  return {
    tier: tierFromScore(totalScore),
    totalScore,
    axes,
    cohort: classifyCohort(axes),
    caveats: deriveCaveats(data),
    confidence: "exemption-data-backed",
  };
}

// ─────────────────────────────────────────────────────────────────────
// Tier display helpers
// ─────────────────────────────────────────────────────────────────────

export function tierLabel(t: ExemptionTier): string {
  switch (t) {
    case "minimal":
      return "Minimal";
    case "modest":
      return "Modest";
    case "moderate":
      return "Moderate";
    case "generous":
      return "Generous";
    case "top-tier":
      return "Top-tier";
  }
}

export function tierBlurb(t: ExemptionTier): string {
  switch (t) {
    case "minimal":
      return "Statutory relief is small relative to typical home values; most homeowners pay close to the unexempted bill.";
    case "modest":
      return "Some statutory relief exists, but it's narrow — either small dollar amounts or tightly income-tested.";
    case "moderate":
      return "A typical mix of dollar exemption + targeted senior/veteran relief — meaningful but not transformative.";
    case "generous":
      return "Multiple substantial axes — large dollar exemption, strong senior/veteran benefit, or material assessment cap.";
    case "top-tier":
      return "Multi-axis strong relief — qualified homeowners (seniors, veterans, or long-term residents) often pay a fraction of the unexempted bill.";
  }
}

export type ToneColor = {
  bg: string;
  border: string;
  text: string;
};

export function tierToneColor(t: ExemptionTier | null): ToneColor {
  switch (t) {
    case "minimal":
      return { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-900" };
    case "modest":
      return { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-900" };
    case "moderate":
      return { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-900" };
    case "generous":
      return { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-900" };
    case "top-tier":
      return { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-900" };
    default:
      return { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700" };
  }
}

export const TIER_UNKNOWN_LABEL = "Consult assessor";
export const TIER_AXIS_SUMMARY =
  "Basic homestead · Senior · Veteran · Disability · Assessment cap (each 0–2)";
export const TIER_CUTOFF_SUMMARY =
  "0–2 minimal · 3–4 modest · 5–6 moderate · 7–8 generous · 9–10 top-tier (max 10)";
