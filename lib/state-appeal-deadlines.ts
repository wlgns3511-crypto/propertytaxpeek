/**
 * State-level property tax appeal filing windows.
 *
 * Phase 6 v6.5 Signature Feature (2026-05-18): the Appeal Outcome Simulator
 * needs a deadline anchor to produce an action-checklist line. We commit to
 * deadlines that are statutorily fixed or that appear in the existing
 * assessment-appeal-success-tier driver text — i.e., grounded sources. Other
 * states get a structural-guidance string rather than a fabricated date.
 *
 * Honest framing:
 *   - Verified deadlines below are statutory (N.J.S.A. 54:3-21, Tex. Tax
 *     Code § 41, etc.) or come from the state DOR.
 *   - "Window varies — check your county assessor" is the honest default
 *     for states without a single statewide statutory date. Counties in
 *     such states (NY, PA, IN, GA, MO, etc.) set their own windows.
 *   - The simulator surfaces both the verified deadline AND the state's
 *     structural-mechanism context, then directs filers to their county
 *     assessor for confirmation.
 */

export interface StateDeadline {
  abbr: string;
  /** Honest deadline statement. Either a calendar date or a structural-guidance phrase. */
  deadline: string;
  /** Whether the deadline is statutorily fixed (or specific enough to act on). */
  verified: boolean;
  /** Source citation when verified. */
  source: string | null;
}

const VERIFIED: Record<string, StateDeadline> = {
  NJ: {
    abbr: "NJ",
    deadline: "April 1 (statewide statutory deadline)",
    verified: true,
    source: "N.J.S.A. 54:3-21",
  },
  TX: {
    abbr: "TX",
    deadline: "May 15 (or 30 days after notice of appraised value, whichever is later)",
    verified: true,
    source: "Tex. Tax Code § 41.44",
  },
  MN: {
    abbr: "MN",
    deadline: "April 30 (for prior year's assessment, to MN Tax Court)",
    verified: true,
    source: "Minn. Stat. § 271.06",
  },
  OH: {
    abbr: "OH",
    deadline: "March 31 (for prior tax year, to county Board of Revision)",
    verified: true,
    source: "Ohio Rev. Code § 5715.19",
  },
  MA: {
    abbr: "MA",
    deadline: "February 1 (for prior fiscal year, to local Board of Assessors)",
    verified: true,
    source: "M.G.L. ch. 59 § 59",
  },
  MD: {
    abbr: "MD",
    deadline: "45 days from date of assessment notice",
    verified: true,
    source: "Md. Code, Tax-Property § 14-509",
  },
  IL: {
    abbr: "IL",
    deadline:
      "Township-by-township — Cook County publishes per-township windows; downstate counties typically open windows after assessor publication",
    verified: true,
    source: "Cook County Assessor + Illinois Property Tax Code (35 ILCS 200)",
  },
};

const TIER_GENERAL: Record<string, string> = {
  "tax-court":
    "Tax-court state. Filing windows are typically 30-60 days from the date of the assessment notice. Check your state Department of Revenue or county assessor for the exact deadline in your jurisdiction.",
  hybrid:
    "Hybrid (county-board + state review) state. Filing windows are typically 30-45 days from notice in county-level appeals. Check your county assessor for the exact deadline; the state-level review tier has its own subsequent deadline.",
  administrative:
    "Administrative county-board state. Filing windows are typically 14-45 days from notice and strictly enforced. Check your county assessor immediately upon receiving any assessment notice.",
  "cap-sheltered":
    "Cap-sheltered state. Assessment-value caps (constitutional or statutory) limit how much value can grow year-over-year, which reduces the appeal upside for homesteads. Filing windows still exist — confirm with your county assessor. Decline-in-value appeals follow separate procedures.",
  unknown:
    "Filing window varies by jurisdiction. Check your county assessor immediately upon receiving any assessment notice.",
};

export function getStateDeadline(
  stateAbbr: string | null | undefined,
  mechanism: "tax-court" | "hybrid" | "administrative" | "cap-sheltered" | "unknown",
): StateDeadline {
  if (!stateAbbr) {
    return {
      abbr: "",
      deadline: TIER_GENERAL.unknown,
      verified: false,
      source: null,
    };
  }
  const upper = stateAbbr.toUpperCase();
  const verified = VERIFIED[upper];
  if (verified) return verified;
  return {
    abbr: upper,
    deadline: TIER_GENERAL[mechanism] ?? TIER_GENERAL.unknown,
    verified: false,
    source: null,
  };
}

export function getAllVerifiedDeadlines(): StateDeadline[] {
  return Object.values(VERIFIED);
}
