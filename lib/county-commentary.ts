// HCU 2026-04-29: Layer 2/3 commentary for county pages.
//
// Pattern: 6 burden status × 4 slot × 3 variant × slug-hash rotation.
// 4 slots cover the four narrative beats we need on a county page:
//   - intro:        opening framing of burden level
//   - comparison:   how this compares to the state/national signal
//   - senior:       senior-household impact (uses ACS B19049_005)
//   - outlook:      forward-looking action note
//
// Variants are chosen via FNV-1a slug hash so two counties with the same
// status get different strings — HCU duplicate-pattern defense.

import type { BurdenStatus, SeniorBurdenStatus, CountyView } from "@/lib/county-facts";
import { fmtPercent, fmtUsd, pickVariant } from "@/lib/content-helpers";

type Slot = "intro" | "comparison" | "senior" | "outlook";

type StatusVariants = Record<BurdenStatus, Record<Slot, string[]>>;

// Variants are written as templates that take `(view, ctx)` and produce a
// finished string. We keep them as functions (not raw strings) so they can
// reference live numbers without re-templating.
type TemplateCtx = {
  countyName: string;
  stateAbbr: string;
  stateName: string;
  stateRatePct: number;
  stateMedianTax: number;
  nationalRatePct: number;
};

type TemplateFn = (v: Extract<CountyView, { kind: "kept" }>, ctx: TemplateCtx) => string;

const COUNTY_VARIANTS: Record<BurdenStatus, Record<Slot, TemplateFn[]>> = {
  "extreme-high": {
    intro: [
      (v, c) =>
        `${c.countyName} sits in the heaviest band of US property-tax burdens. At an effective rate of ${fmtPercent(v.effectiveRatePct)}, the typical owner here pays ${fmtUsd(v.taxesAnnual)} a year on a ${fmtUsd(v.homeValue)} home — a meaningful share of household spending no matter the income bracket.`,
      (v, c) =>
        `Owners in ${c.countyName} face one of the steepest property-tax loads in the country. The ${fmtPercent(v.effectiveRatePct)} effective rate translates to roughly ${fmtUsd(v.taxesAnnual)} on the median ${fmtUsd(v.homeValue)} home — most homeowners here will run into the SALT deduction cap.`,
      (v, c) =>
        `${c.countyName}'s ${fmtPercent(v.effectiveRatePct)} effective rate puts it deep in the high-burden tier. A ${fmtUsd(v.homeValue)} home generates about ${fmtUsd(v.taxesAnnual)} in annual property tax — the single largest non-mortgage line on most owner budgets in this market.`,
    ],
    comparison: [
      (v, c) =>
        `That works out to about ${(v.effectiveRatePct / Math.max(c.stateRatePct, 0.01)).toFixed(1)}× the ${c.stateName} state average and ${(v.effectiveRatePct / Math.max(c.nationalRatePct, 0.01)).toFixed(1)}× the US national rate of ${fmtPercent(c.nationalRatePct)}.`,
      (v, c) =>
        `Compared with the ${fmtPercent(c.stateRatePct)} statewide average for ${c.stateName} and the ${fmtPercent(c.nationalRatePct)} US benchmark, ${c.countyName} runs notably hotter on both axes.`,
      (v, c) =>
        `The state-level rate for ${c.stateName} is ${fmtPercent(c.stateRatePct)}; nationally the average is ${fmtPercent(c.nationalRatePct)}. ${c.countyName} sits well above both.`,
    ],
    senior: [
      (v) =>
        `For households on a fixed senior income (median ${fmtUsd(v.seniorIncome ?? 0)} for owners 65+), that ${fmtUsd(v.taxesAnnual)} annual bill consumes about ${fmtPercent(v.seniorBurdenPct ?? 0)} of income — a level where states with senior-freeze or homestead programs usually see the highest enrollment.`,
      (v) =>
        `Senior households here (median 65+ income ${fmtUsd(v.seniorIncome ?? 0)}) lose roughly ${fmtPercent(v.seniorBurdenPct ?? 0)} of annual income to property tax alone. Reviewing the state's senior or veteran exemption is usually the highest-leverage step.`,
      (v) =>
        `On the senior side, the median property tax ${fmtUsd(v.taxesAnnual)} represents ${fmtPercent(v.seniorBurdenPct ?? 0)} of the typical household-65+ income (${fmtUsd(v.seniorIncome ?? 0)}). Counties with this profile often see active assessment-appeal calendars.`,
    ],
    outlook: [
      () =>
        `If you're shopping in this market, model the property tax line into your monthly housing math up front — escrowed mortgages will reflect it. Reassessment cycles can also move the bill more than mortgage principal in any given year.`,
      () =>
        `The high-burden profile usually softens through homestead, senior, or assessment-appeal mechanics rather than rate changes. State exemption rules below show what's available locally.`,
      () =>
        `Buyers and refinancers comparing payments across counties should watch this rate carefully — it'll outweigh small differences in mortgage rate over a typical hold period.`,
    ],
  },

  "high": {
    intro: [
      (v, c) =>
        `${c.countyName} carries an above-average property-tax load. The ${fmtPercent(v.effectiveRatePct)} effective rate produces about ${fmtUsd(v.taxesAnnual)} in annual tax on the median ${fmtUsd(v.homeValue)} home.`,
      (v, c) =>
        `A homeowner in ${c.countyName} pays roughly ${fmtUsd(v.taxesAnnual)} a year on a ${fmtUsd(v.homeValue)} home — the ${fmtPercent(v.effectiveRatePct)} effective rate sits in the upper third of US counties.`,
      (v, c) =>
        `${c.countyName}'s ${fmtPercent(v.effectiveRatePct)} effective rate maps to about ${fmtUsd(v.taxesAnnual)} on the median ${fmtUsd(v.homeValue)} home — meaningful, and a line item lenders will price into your debt-to-income calculation.`,
    ],
    comparison: [
      (v, c) =>
        `That's notably above the ${fmtPercent(c.stateRatePct)} ${c.stateName} state average and the ${fmtPercent(c.nationalRatePct)} US benchmark.`,
      (v, c) =>
        `For context, the ${c.stateName} state average is ${fmtPercent(c.stateRatePct)} and the US average is ${fmtPercent(c.nationalRatePct)}.`,
      (v, c) =>
        `Statewide ${c.stateName} averages ${fmtPercent(c.stateRatePct)}; nationally the figure is ${fmtPercent(c.nationalRatePct)}. ${c.countyName} runs above both.`,
    ],
    senior: [
      (v) =>
        `Senior owners (median 65+ income ${fmtUsd(v.seniorIncome ?? 0)}) face a property-tax burden of about ${fmtPercent(v.seniorBurdenPct ?? 0)} of income — high enough that the state's senior exemption can move the needle.`,
      (v) =>
        `For households age 65+ here (median income ${fmtUsd(v.seniorIncome ?? 0)}), the ${fmtUsd(v.taxesAnnual)} annual bill is ${fmtPercent(v.seniorBurdenPct ?? 0)} of income — worth a hard look at exemption eligibility.`,
      (v) =>
        `On a fixed senior income (${fmtUsd(v.seniorIncome ?? 0)} median), the property-tax burden of ${fmtPercent(v.seniorBurdenPct ?? 0)} is meaningful enough to justify reviewing assessment notices each year.`,
    ],
    outlook: [
      () => `Buyers should price the property-tax line as carefully as the mortgage rate. A 0.25% rate difference can move a monthly payment less than a single reassessment year.`,
      () => `If your assessed value looks high relative to recent comparable sales, an appeal is the highest-leverage tool. Most counties allow one annually.`,
      () => `Refinancing won't move this number, but bundling it into escrow smooths the cash-flow shock at year-end.`,
    ],
  },

  "above-avg": {
    intro: [
      (v, c) =>
        `${c.countyName}'s effective property-tax rate of ${fmtPercent(v.effectiveRatePct)} runs slightly above the US norm. That's about ${fmtUsd(v.taxesAnnual)} on a ${fmtUsd(v.homeValue)} home.`,
      (v, c) =>
        `At ${fmtPercent(v.effectiveRatePct)}, ${c.countyName} carries a property-tax rate above the national center. The median annual bill comes to ${fmtUsd(v.taxesAnnual)} on a ${fmtUsd(v.homeValue)} home.`,
      (v, c) =>
        `Owners in ${c.countyName} pay about ${fmtUsd(v.taxesAnnual)} per year on the median ${fmtUsd(v.homeValue)} home — the ${fmtPercent(v.effectiveRatePct)} effective rate is modestly above average for the country.`,
    ],
    comparison: [
      (_, c) =>
        `${c.stateName} averages ${fmtPercent(c.stateRatePct)} statewide; the US average is ${fmtPercent(c.nationalRatePct)}.`,
      (_, c) => `For comparison, ${c.stateName} runs ${fmtPercent(c.stateRatePct)} on average and the US benchmark is ${fmtPercent(c.nationalRatePct)}.`,
      (_, c) => `Across the US the average sits at ${fmtPercent(c.nationalRatePct)}; ${c.stateName} averages ${fmtPercent(c.stateRatePct)}.`,
    ],
    senior: [
      (v) => `Households age 65+ (median income ${fmtUsd(v.seniorIncome ?? 0)}) see property tax consume about ${fmtPercent(v.seniorBurdenPct ?? 0)} of income — moderate but not negligible.`,
      (v) => `On the senior side, ${fmtUsd(v.taxesAnnual)} represents about ${fmtPercent(v.seniorBurdenPct ?? 0)} of the median 65+ household income (${fmtUsd(v.seniorIncome ?? 0)}).`,
      (v) => `Median senior income here is ${fmtUsd(v.seniorIncome ?? 0)}, putting the property-tax line at ${fmtPercent(v.seniorBurdenPct ?? 0)} of household income.`,
    ],
    outlook: [
      () => `For buyers comparing markets, expect this line to track local levy decisions rather than your mortgage. Watch the school-district vote schedule.`,
      () => `Most homeowners get the largest single saving from a homestead or owner-occupier exemption — those rules are state-level, set out below.`,
      () => `Year-over-year reassessments tend to follow regional housing-price trends with a 1–2 year lag. Recent sales in your tract are the best comp.`,
    ],
  },

  "avg": {
    intro: [
      (v, c) =>
        `${c.countyName}'s effective property-tax rate of ${fmtPercent(v.effectiveRatePct)} sits near the US center. The typical owner pays ${fmtUsd(v.taxesAnnual)} a year on a ${fmtUsd(v.homeValue)} home.`,
      (v, c) =>
        `At ${fmtPercent(v.effectiveRatePct)}, ${c.countyName}'s property-tax rate is roughly average for the country. That works out to ${fmtUsd(v.taxesAnnual)} per year on a ${fmtUsd(v.homeValue)} home.`,
      (v, c) =>
        `${c.countyName} runs middle-of-the-pack on property tax: ${fmtPercent(v.effectiveRatePct)} effective rate, ${fmtUsd(v.taxesAnnual)} annual on a ${fmtUsd(v.homeValue)} home.`,
    ],
    comparison: [
      (_, c) => `${c.stateName} averages ${fmtPercent(c.stateRatePct)}; the US benchmark is ${fmtPercent(c.nationalRatePct)}.`,
      (_, c) => `Across the country the average is ${fmtPercent(c.nationalRatePct)}; ${c.stateName} averages ${fmtPercent(c.stateRatePct)}.`,
      (_, c) => `For context, ${c.stateName} runs ${fmtPercent(c.stateRatePct)} on average; the US figure is ${fmtPercent(c.nationalRatePct)}.`,
    ],
    senior: [
      (v) => `Senior households (median 65+ income ${fmtUsd(v.seniorIncome ?? 0)}) see property tax run about ${fmtPercent(v.seniorBurdenPct ?? 0)} of annual income — a manageable share for most retirees on a fixed budget.`,
      (v) => `Property tax consumes ${fmtPercent(v.seniorBurdenPct ?? 0)} of the median senior household income (${fmtUsd(v.seniorIncome ?? 0)}). Comfortable, but worth confirming exemption eligibility.`,
      (v) => `On a 65+ income (${fmtUsd(v.seniorIncome ?? 0)} median), the ${fmtUsd(v.taxesAnnual)} annual bill is about ${fmtPercent(v.seniorBurdenPct ?? 0)} of household income.`,
    ],
    outlook: [
      () => `Expect this line to move with regional housing prices on a 1–2 year lag. School-district levies are the most common driver of year-over-year change.`,
      () => `If you're refinancing, your monthly payment will reflect this through escrow. The line itself doesn't change.`,
      () => `Buyers comparing this county to neighbors should watch the assessment ratio (assessed-to-market) more than the headline rate.`,
    ],
  },

  "below-avg": {
    intro: [
      (v, c) =>
        `${c.countyName} has a relatively light property-tax load. The ${fmtPercent(v.effectiveRatePct)} effective rate yields about ${fmtUsd(v.taxesAnnual)} per year on the median ${fmtUsd(v.homeValue)} home.`,
      (v, c) =>
        `Owners in ${c.countyName} pay below the national average on property tax. The ${fmtPercent(v.effectiveRatePct)} effective rate translates to ${fmtUsd(v.taxesAnnual)} on a ${fmtUsd(v.homeValue)} home.`,
      (v, c) =>
        `At ${fmtPercent(v.effectiveRatePct)}, ${c.countyName}'s effective property-tax rate is on the easy side of the US distribution. The annual tax on a median ${fmtUsd(v.homeValue)} home runs ${fmtUsd(v.taxesAnnual)}.`,
    ],
    comparison: [
      (_, c) => `${c.stateName}'s state average is ${fmtPercent(c.stateRatePct)}; the US average is ${fmtPercent(c.nationalRatePct)}.`,
      (_, c) => `For reference, ${c.stateName} averages ${fmtPercent(c.stateRatePct)} statewide and the US benchmark is ${fmtPercent(c.nationalRatePct)}.`,
      (_, c) => `Statewide ${c.stateName} runs ${fmtPercent(c.stateRatePct)}; nationally the average is ${fmtPercent(c.nationalRatePct)}.`,
    ],
    senior: [
      (v) => `For households 65+ here (median income ${fmtUsd(v.seniorIncome ?? 0)}), property tax sits at about ${fmtPercent(v.seniorBurdenPct ?? 0)} of income — a comfortable share for most fixed-income budgets.`,
      (v) => `Senior owners with the median 65+ income (${fmtUsd(v.seniorIncome ?? 0)}) lose only ${fmtPercent(v.seniorBurdenPct ?? 0)} of income to property tax — among the easier markets for retirees.`,
      (v) => `On the senior side, ${fmtUsd(v.taxesAnnual)} works out to ${fmtPercent(v.seniorBurdenPct ?? 0)} of the median 65+ household income (${fmtUsd(v.seniorIncome ?? 0)}).`,
    ],
    outlook: [
      () => `Lower property-tax markets often shift the cost burden to other line items — sales tax, school fees, utilities. Check the full-stack number before locking in a relocation decision.`,
      () => `A modest property-tax rate makes assessment appeals less consequential, but it's still worth verifying your assessed value against recent comp sales annually.`,
      () => `If you're moving here from a high-tax state, the savings can offset a step-up in mortgage rate. Run the math on a 5- and 10-year horizon.`,
    ],
  },

  "low": {
    intro: [
      (v, c) =>
        `${c.countyName} is one of the lighter property-tax markets in the country. The ${fmtPercent(v.effectiveRatePct)} effective rate produces about ${fmtUsd(v.taxesAnnual)} a year on the median ${fmtUsd(v.homeValue)} home.`,
      (v, c) =>
        `At ${fmtPercent(v.effectiveRatePct)}, ${c.countyName}'s effective property-tax rate is well below the US norm. A ${fmtUsd(v.homeValue)} home generates about ${fmtUsd(v.taxesAnnual)} per year in tax.`,
      (v, c) =>
        `Owners in ${c.countyName} pay only about ${fmtUsd(v.taxesAnnual)} a year on the median ${fmtUsd(v.homeValue)} home — the ${fmtPercent(v.effectiveRatePct)} effective rate places it in the lowest tier nationally.`,
    ],
    comparison: [
      (_, c) => `Statewide ${c.stateName} runs ${fmtPercent(c.stateRatePct)}; nationally the average is ${fmtPercent(c.nationalRatePct)}.`,
      (_, c) => `For context, ${c.stateName} averages ${fmtPercent(c.stateRatePct)} and the US benchmark is ${fmtPercent(c.nationalRatePct)}.`,
      (_, c) => `${c.stateName}'s state-level average is ${fmtPercent(c.stateRatePct)} and the US figure is ${fmtPercent(c.nationalRatePct)}.`,
    ],
    senior: [
      (v) => `Senior households (median 65+ income ${fmtUsd(v.seniorIncome ?? 0)}) lose only about ${fmtPercent(v.seniorBurdenPct ?? 0)} of income to property tax — among the most retiree-friendly markets in the country.`,
      (v) => `For owners 65+ on the median (${fmtUsd(v.seniorIncome ?? 0)}), property tax runs ${fmtPercent(v.seniorBurdenPct ?? 0)} of income. Few other line items are this manageable for a fixed budget.`,
      (v) => `On the senior side, ${fmtUsd(v.taxesAnnual)} represents ${fmtPercent(v.seniorBurdenPct ?? 0)} of the median 65+ household income (${fmtUsd(v.seniorIncome ?? 0)}) — comfortable territory.`,
    ],
    outlook: [
      () => `Low-tax counties often rely on sales-tax or income-tax revenue, so the total household tax bill may not be as light as the property-tax line suggests.`,
      () => `Property-tax appeals are rare in low-rate markets — the dollar savings usually don't justify the filing time. Most owners just verify the assessed value annually.`,
      () => `If you're relocating from a high-tax market, the savings here often outweigh a modest step-up in mortgage rate over a 5–10 year hold.`,
    ],
  },
};

const SENIOR_DESCRIPTOR: Record<SeniorBurdenStatus, string> = {
  stretched: "stretched — among the heavier senior-burden markets",
  moderate: "moderate — in line with the national center for senior owners",
  comfortable: "comfortable — on the easier side for retired homeowners",
};

export function buildIntro(
  slug: string,
  view: Extract<CountyView, { kind: "kept" }>,
  ctx: TemplateCtx,
): string {
  const variant = pickVariant(slug, "intro", COUNTY_VARIANTS[view.burdenStatus].intro);
  return variant(view, ctx);
}

export function buildComparison(
  slug: string,
  view: Extract<CountyView, { kind: "kept" }>,
  ctx: TemplateCtx,
): string {
  const variant = pickVariant(slug, "comparison", COUNTY_VARIANTS[view.burdenStatus].comparison);
  return variant(view, ctx);
}

export function buildSeniorContext(
  slug: string,
  view: Extract<CountyView, { kind: "kept" }>,
  ctx: TemplateCtx,
): string | null {
  if (view.seniorBurdenPct == null || view.seniorIncome == null) return null;
  const variant = pickVariant(slug, "senior", COUNTY_VARIANTS[view.burdenStatus].senior);
  return variant(view, ctx);
}

export function buildOutlook(
  slug: string,
  view: Extract<CountyView, { kind: "kept" }>,
  ctx: TemplateCtx,
): string {
  const variant = pickVariant(slug, "outlook", COUNTY_VARIANTS[view.burdenStatus].outlook);
  return variant(view, ctx);
}

export function seniorDescriptor(status: SeniorBurdenStatus): string {
  return SENIOR_DESCRIPTOR[status];
}

export type { TemplateCtx };
