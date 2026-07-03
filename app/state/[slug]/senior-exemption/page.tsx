import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllStates, getStateBySlug } from "@/lib/db";
import { getStateExemptionData } from "@/lib/state-exemption-data";
import { Breadcrumb } from "@/components/Breadcrumb";
import { FreshnessTag } from "@/components/FreshnessTag";
import { AuthorBox } from "@/components/AuthorBox";
import { EXEMPTION_VINTAGE } from "@/lib/authorship";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { EditorNote } from "@/components/EditorNote";
import { AdSlot } from "@/components/AdSlot";

export const dynamicParams = false;
export const revalidate = false;

const SITE_URL = "https://propertytaxpeek.com";

const NEIGHBORS: Record<string, string[]> = {
  AL: ["FL", "GA", "MS", "TN"], AK: [], AZ: ["CA", "CO", "NV", "NM", "UT"],
  AR: ["LA", "MO", "MS", "OK", "TN", "TX"], CA: ["AZ", "NV", "OR"],
  CO: ["AZ", "KS", "NE", "NM", "OK", "UT", "WY"], CT: ["MA", "NY", "RI"],
  DE: ["MD", "NJ", "PA"], FL: ["AL", "GA"], GA: ["AL", "FL", "NC", "SC", "TN"],
  HI: [], ID: ["MT", "NV", "OR", "UT", "WA", "WY"],
  IL: ["IA", "IN", "KY", "MO", "WI"], IN: ["IL", "KY", "MI", "OH"],
  IA: ["IL", "MN", "MO", "NE", "SD", "WI"], KS: ["CO", "MO", "NE", "OK"],
  KY: ["IL", "IN", "MO", "OH", "TN", "VA", "WV"], LA: ["AR", "MS", "TX"],
  ME: ["NH"], MD: ["DE", "PA", "VA", "WV"],
  MA: ["CT", "NH", "NY", "RI", "VT"], MI: ["IN", "OH", "WI"],
  MN: ["IA", "ND", "SD", "WI"], MS: ["AL", "AR", "LA", "TN"],
  MO: ["AR", "IL", "IA", "KS", "KY", "NE", "OK", "TN"],
  MT: ["ID", "ND", "SD", "WY"], NE: ["CO", "IA", "KS", "MO", "SD", "WY"],
  NV: ["AZ", "CA", "ID", "OR", "UT"], NH: ["ME", "MA", "VT"],
  NJ: ["DE", "NY", "PA"], NM: ["AZ", "CO", "OK", "TX", "UT"],
  NY: ["CT", "MA", "NJ", "PA", "VT"], NC: ["GA", "SC", "TN", "VA"],
  ND: ["MN", "MT", "SD"], OH: ["IN", "KY", "MI", "PA", "WV"],
  OK: ["AR", "CO", "KS", "MO", "NM", "TX"], OR: ["CA", "ID", "NV", "WA"],
  PA: ["DE", "MD", "NJ", "NY", "OH", "WV"], RI: ["CT", "MA"],
  SC: ["GA", "NC"], SD: ["IA", "MN", "MT", "ND", "NE", "WY"],
  TN: ["AL", "AR", "GA", "KY", "MO", "MS", "NC", "VA"],
  TX: ["AR", "LA", "NM", "OK"], UT: ["AZ", "CO", "ID", "NV", "NM", "WY"],
  VT: ["MA", "NH", "NY"], VA: ["KY", "MD", "NC", "TN", "WV"],
  WA: ["ID", "OR"], WV: ["KY", "MD", "OH", "PA", "VA"],
  WI: ["IA", "IL", "MI", "MN"], WY: ["CO", "ID", "MT", "NE", "SD", "UT"],
  DC: ["MD", "VA"],
};

interface SeniorProfile {
  /** Age qualifying threshold (e.g., 65, 62, 60, 55) */
  ageThreshold: number;
  /** Additional dollar exemption amount (off assessed value), 0 if N/A */
  additionalExemption: number;
  /** Annual household income cap ($USD), null = no cap */
  incomeCapUsd: number | null;
  /** Assessment value freeze available */
  hasFreeze: boolean;
  /** Tax deferral (postpone payment) program available */
  hasDeferral: boolean;
  /** Refundable tax credit / rebate amount ($USD/yr, null = none or see notes) */
  creditUsd: number | null;
  /** Short program name */
  programName: string;
  /** Key differentiator / best-to-know point (1 sentence) */
  keyPoint: string;
}

// 51 states (50 + DC) — age/income/exemption from state Departments of Revenue
// and Lincoln Institute Property Tax database, 2026 tax year unless noted.
const SENIOR_PROFILES: Record<string, SeniorProfile> = {
  alabama: {
    ageThreshold: 65, additionalExemption: 40000, incomeCapUsd: 12000,
    hasFreeze: false, hasDeferral: false, creditUsd: null,
    programName: "State + County Senior Homestead",
    keyPoint: "Full state property tax exemption if AGI under $12,000 (lowest income cap in US).",
  },
  alaska: {
    ageThreshold: 65, additionalExemption: 150000, incomeCapUsd: null,
    hasFreeze: false, hasDeferral: false, creditUsd: null,
    programName: "Senior Citizen / Disabled Vet Exemption",
    keyPoint: "$150K mandatory exemption statewide — no income cap. Highest dollar exemption in US.",
  },
  arizona: {
    ageThreshold: 65, additionalExemption: 0, incomeCapUsd: 43733,
    hasFreeze: true, hasDeferral: false, creditUsd: null,
    programName: "Senior Property Valuation Protection (SPVP)",
    keyPoint: "Freezes Limited Property Value (LPV) at time of approval — no dollar exemption, but eliminates reassessment creep.",
  },
  arkansas: {
    ageThreshold: 65, additionalExemption: 0, incomeCapUsd: null,
    hasFreeze: true, hasDeferral: false, creditUsd: 375,
    programName: "Amendment 79 Senior Freeze + Tax Credit",
    keyPoint: "$375 Homestead Tax Credit + assessed value freeze at age 65 (no income test).",
  },
  california: {
    ageThreshold: 55, additionalExemption: 0, incomeCapUsd: 53574,
    hasFreeze: false, hasDeferral: true, creditUsd: null,
    programName: "Prop 19 Transfer + PTP Deferral",
    keyPoint: "Prop 19 lets 55+ transfer base-year value when downsizing. Separate 62+ Property Tax Postponement Program.",
  },
  colorado: {
    ageThreshold: 65, additionalExemption: 100000, incomeCapUsd: null,
    hasFreeze: false, hasDeferral: true, creditUsd: null,
    programName: "Senior Homestead Exemption (50% of first $200K)",
    keyPoint: "50% of first $200K of actual value exempt = up to $100K. Must have lived in home ≥10 years.",
  },
  connecticut: {
    ageThreshold: 65, additionalExemption: 0, incomeCapUsd: 47600,
    hasFreeze: true, hasDeferral: false, creditUsd: 1500,
    programName: "Elderly Homeowners' Tax Relief (Circuit Breaker)",
    keyPoint: "State + municipal tax credit up to $1,500. Local tax freeze option by town (most CT towns offer).",
  },
  delaware: {
    ageThreshold: 65, additionalExemption: 0, incomeCapUsd: null,
    hasFreeze: false, hasDeferral: false, creditUsd: 500,
    programName: "Senior School Property Tax Credit",
    keyPoint: "$500 school property tax credit for age 65+. County exemptions layered on top (e.g., Sussex $24K).",
  },
  florida: {
    ageThreshold: 65, additionalExemption: 50000, incomeCapUsd: 36614,
    hasFreeze: false, hasDeferral: true, creditUsd: null,
    programName: "Senior Homestead (local option) + Long-Term Residency",
    keyPoint: "Extra $50K county senior exemption widespread. 25+ year residents 65+ get FULL exemption in many counties.",
  },
  georgia: {
    ageThreshold: 62, additionalExemption: 10000, incomeCapUsd: 10000,
    hasFreeze: true, hasDeferral: false, creditUsd: null,
    programName: "Statewide School Tax Exemption (age 62+, income < $10K)",
    keyPoint: "Full school tax exemption age 62+ if net income < $10K. County additional exemptions vary widely.",
  },
  hawaii: {
    ageThreshold: 60, additionalExemption: 120000, incomeCapUsd: null,
    hasFreeze: false, hasDeferral: false, creditUsd: null,
    programName: "Tiered Home Exemption (60/65/70)",
    keyPoint: "Tiered: $120K age 60-69, $140K age 70+, $160K age 80+. Island county variations.",
  },
  idaho: {
    ageThreshold: 65, additionalExemption: 0, incomeCapUsd: 37000,
    hasFreeze: false, hasDeferral: true, creditUsd: 1500,
    programName: "Property Tax Reduction (Circuit Breaker)",
    keyPoint: "Up to $1,500 reduction based on income. Deferral program available for 65+ or widowed 65+.",
  },
  illinois: {
    ageThreshold: 65, additionalExemption: 8000, incomeCapUsd: 65000,
    hasFreeze: true, hasDeferral: true, creditUsd: null,
    programName: "Senior Homestead + Senior Freeze (SCAFHE)",
    keyPoint: "$8,000 Senior Homestead (automatic) + Senior Freeze if income < $65K. Cook County adds extra.",
  },
  indiana: {
    ageThreshold: 65, additionalExemption: 14000, incomeCapUsd: 30000,
    hasFreeze: false, hasDeferral: false, creditUsd: null,
    programName: "Over 65 Deduction + Circuit Breaker",
    keyPoint: "$14K deduction + 1% property tax cap (Circuit Breaker) for age 65+ with income under $30K.",
  },
  iowa: {
    ageThreshold: 65, additionalExemption: 3250, incomeCapUsd: null,
    hasFreeze: false, hasDeferral: false, creditUsd: null,
    programName: "Elderly/Disabled Homestead + Military",
    keyPoint: "$3,250 elderly homestead deduction layered on standard Homestead Credit ($4,850 exempt value).",
  },
  kansas: {
    ageThreshold: 65, additionalExemption: 0, incomeCapUsd: 22000,
    hasFreeze: false, hasDeferral: false, creditUsd: 700,
    programName: "Homestead Refund / SAFESR",
    keyPoint: "SAFESR refund up to 75% of taxes paid (income < $22K). Standard Homestead Claim up to $700 refund.",
  },
  kentucky: {
    ageThreshold: 65, additionalExemption: 46350, incomeCapUsd: null,
    hasFreeze: false, hasDeferral: false, creditUsd: null,
    programName: "Homestead Exemption (Disability/Senior)",
    keyPoint: "$46,350 exemption (2026, inflation-adjusted) for age 65+ OR totally disabled. No income cap.",
  },
  louisiana: {
    ageThreshold: 65, additionalExemption: 0, incomeCapUsd: 100000,
    hasFreeze: true, hasDeferral: false, creditUsd: null,
    programName: "Senior Freeze (Special Assessment Level)",
    keyPoint: "Freezes assessed value if income < $100K. Homestead Exemption ($7,500) stacks.",
  },
  maine: {
    ageThreshold: 62, additionalExemption: 0, incomeCapUsd: null,
    hasFreeze: false, hasDeferral: true, creditUsd: null,
    programName: "State Property Tax Deferral",
    keyPoint: "Property Tax Stabilization Act repealed 2023. Current: state-run Deferral Program for 65+ / disabled.",
  },
  maryland: {
    ageThreshold: 65, additionalExemption: 0, incomeCapUsd: null,
    hasFreeze: false, hasDeferral: false, creditUsd: 0,
    programName: "Senior Tax Credit (county + state)",
    keyPoint: "No statewide exemption — county-specific credits (e.g., Howard 25% credit age 65+/retired ≥10yr). Baltimore City $125 credit.",
  },
  massachusetts: {
    ageThreshold: 65, additionalExemption: 0, incomeCapUsd: 64000,
    hasFreeze: false, hasDeferral: true, creditUsd: 2590,
    programName: "Senior Circuit Breaker Credit",
    keyPoint: "Refundable credit up to $2,590 (2025, inflation-adjusted). Deferral via Clause 41A local option.",
  },
  michigan: {
    ageThreshold: 62, additionalExemption: 0, incomeCapUsd: 67300,
    hasFreeze: false, hasDeferral: true, creditUsd: 1800,
    programName: "Homestead Property Tax Credit (income-based)",
    keyPoint: "Refundable credit up to $1,800 — no age requirement but heavily weighted for 65+. Deferral for 62+ income ≤ $40K.",
  },
  minnesota: {
    ageThreshold: 65, additionalExemption: 0, incomeCapUsd: 128510,
    hasFreeze: false, hasDeferral: true, creditUsd: 2280,
    programName: "Senior Citizens Property Tax Deferral + Homestead Credit Refund",
    keyPoint: "Deferral caps tax at 3% of income for 65+. Homestead Credit Refund (PTR) up to $2,280.",
  },
  mississippi: {
    ageThreshold: 65, additionalExemption: 7500, incomeCapUsd: null,
    hasFreeze: false, hasDeferral: false, creditUsd: null,
    programName: "Senior Citizen Full Homestead Exemption",
    keyPoint: "Full exemption on first $7,500 of assessed value (~$75K market). No income cap. Auto-applied with homestead.",
  },
  missouri: {
    ageThreshold: 62, additionalExemption: 0, incomeCapUsd: 36490,
    hasFreeze: true, hasDeferral: false, creditUsd: 1100,
    programName: "Circuit Breaker + SB 190 Senior Freeze (2024)",
    keyPoint: "SB 190 senior freeze now statewide (counties must offer). Circuit Breaker tax credit up to $1,100.",
  },
  montana: {
    ageThreshold: 62, additionalExemption: 0, incomeCapUsd: 53638,
    hasFreeze: false, hasDeferral: false, creditUsd: 1150,
    programName: "Elderly Homeowner/Renter Credit",
    keyPoint: "Refundable credit up to $1,150 for 62+ with income < $53,638. Also Montana Disabled/Senior Property Tax Assistance.",
  },
  nebraska: {
    ageThreshold: 65, additionalExemption: 40000, incomeCapUsd: 41100,
    hasFreeze: false, hasDeferral: false, creditUsd: null,
    programName: "Homestead Exemption (income-tiered)",
    keyPoint: "Up to 100% exemption depending on income bracket. Tiered caps: full exempt < $32,100, partial up to $41,100.",
  },
  nevada: {
    ageThreshold: 62, additionalExemption: 0, incomeCapUsd: 30627,
    hasFreeze: false, hasDeferral: false, creditUsd: 500,
    programName: "Senior Citizens Property Tax Rebate",
    keyPoint: "Max $500 rebate for 62+ with income < $30,627. No blanket senior exemption beyond this.",
  },
  "new-hampshire": {
    ageThreshold: 65, additionalExemption: 50000, incomeCapUsd: 34800,
    hasFreeze: false, hasDeferral: false, creditUsd: null,
    programName: "Elderly Exemption (age-tiered, town-set)",
    keyPoint: "Tiered by age ($50K at 65-74, $75K at 75-79, $100K at 80+). Amount varies by town. Income cap single ~$34,800.",
  },
  "new-jersey": {
    ageThreshold: 65, additionalExemption: 0, incomeCapUsd: 168268,
    hasFreeze: true, hasDeferral: false, creditUsd: 1750,
    programName: "Senior Freeze (PTR) + ANCHOR Program",
    keyPoint: "Senior Freeze reimburses increases over base year. ANCHOR adds $1,750 for seniors 65+ (income < $250K).",
  },
  "new-mexico": {
    ageThreshold: 65, additionalExemption: 0, incomeCapUsd: 36667,
    hasFreeze: true, hasDeferral: false, creditUsd: 250,
    programName: "Property Tax Rebate + Valuation Freeze",
    keyPoint: "$250 rebate (income < $24K) + Valuation Freeze (income < $36,667). Freeze is most valuable benefit.",
  },
  "new-york": {
    ageThreshold: 65, additionalExemption: 0, incomeCapUsd: 107300,
    hasFreeze: false, hasDeferral: false, creditUsd: null,
    programName: "Enhanced STAR + Senior Citizen Exemption (SCHE)",
    keyPoint: "Enhanced STAR (income < $107,300) = ~$650 average savings. SCHE exempts 50% of assessed value (local income cap varies $37-50K).",
  },
  "north-carolina": {
    ageThreshold: 65, additionalExemption: 25000, incomeCapUsd: 37900,
    hasFreeze: false, hasDeferral: true, creditUsd: null,
    programName: "Elderly/Disabled Exclusion",
    keyPoint: "Excludes the greater of $25K OR 50% of assessed value. Income cap $37,900 (2025). Separate Circuit Breaker Deferral option.",
  },
  "north-dakota": {
    ageThreshold: 65, additionalExemption: 0, incomeCapUsd: 70000,
    hasFreeze: false, hasDeferral: false, creditUsd: null,
    programName: "Homestead Credit (age 65+)",
    keyPoint: "Up to 100% of property tax credited for 65+ with income < $40K. Partial up to income $70K.",
  },
  ohio: {
    ageThreshold: 65, additionalExemption: 26200, incomeCapUsd: 39800,
    hasFreeze: false, hasDeferral: false, creditUsd: null,
    programName: "Homestead Exemption (age 65+ or disabled)",
    keyPoint: "$26,200 exemption (2025, inflation-adjusted). Income cap $39,800 — grandfathered pre-2014 enrollees exempt from cap.",
  },
  oklahoma: {
    ageThreshold: 65, additionalExemption: 1000, incomeCapUsd: 85300,
    hasFreeze: true, hasDeferral: false, creditUsd: null,
    programName: "Senior Valuation Limitation (Freeze)",
    keyPoint: "Freezes fair cash value if income < $85,300 (2025, HUD county-median linked). $1,000 extra homestead too.",
  },
  oregon: {
    ageThreshold: 62, additionalExemption: 0, incomeCapUsd: 65000,
    hasFreeze: false, hasDeferral: true, creditUsd: null,
    programName: "Senior and Disabled Property Tax Deferral",
    keyPoint: "Deferral program: state pays tax, repaid with 6% interest upon sale/death. Income cap ~$65K, net worth < $500K.",
  },
  pennsylvania: {
    ageThreshold: 65, additionalExemption: 0, incomeCapUsd: 35000,
    hasFreeze: true, hasDeferral: false, creditUsd: 1000,
    programName: "Property Tax/Rent Rebate + Act 77 Freeze",
    keyPoint: "Rebate up to $1,000 (income cap raised to $45K for 2024+). Act 77 local freeze option — Allegheny/Philly widespread.",
  },
  "rhode-island": {
    ageThreshold: 65, additionalExemption: 12000, incomeCapUsd: null,
    hasFreeze: true, hasDeferral: false, creditUsd: null,
    programName: "Municipal Senior Exemption (town-set)",
    keyPoint: "No state exemption — Providence $12K, Warwick varies, etc. Most towns offer freeze for age 65+ with income limits.",
  },
  "south-carolina": {
    ageThreshold: 65, additionalExemption: 50000, incomeCapUsd: null,
    hasFreeze: false, hasDeferral: false, creditUsd: null,
    programName: "Homestead Exemption (age 65+ or disabled)",
    keyPoint: "$50K exemption on fair market value. No income cap. Applied automatically once enrolled (one-time filing).",
  },
  "south-dakota": {
    ageThreshold: 66, additionalExemption: 0, incomeCapUsd: 35000,
    hasFreeze: true, hasDeferral: true, creditUsd: 900,
    programName: "Assessment Freeze + Property Tax Refund",
    keyPoint: "Assessment freeze for 66+ with income < $42K. Refund program for 65+ renters/owners up to $900.",
  },
  tennessee: {
    ageThreshold: 65, additionalExemption: 0, incomeCapUsd: 34990,
    hasFreeze: true, hasDeferral: false, creditUsd: null,
    programName: "Property Tax Relief + Local Freeze",
    keyPoint: "State pays portion of tax (reimbursement). Local freeze (up to counties) for 65+ with income < $60K in most counties.",
  },
  texas: {
    ageThreshold: 65, additionalExemption: 10000, incomeCapUsd: null,
    hasFreeze: true, hasDeferral: true, creditUsd: null,
    programName: "Over-65 Exemption + School Tax Ceiling Freeze",
    keyPoint: "$10K additional (state) + local add-ons + SCHOOL TAX FREEZE (locked at 65 enrollment). Most valuable in Texas: the freeze.",
  },
  utah: {
    ageThreshold: 65, additionalExemption: 0, incomeCapUsd: 40840,
    hasFreeze: false, hasDeferral: true, creditUsd: 1259,
    programName: "Circuit Breaker + Abatement",
    keyPoint: "Refundable credit up to $1,259 (2025). County-level abatement and deferral options stack on top.",
  },
  vermont: {
    ageThreshold: 65, additionalExemption: 0, incomeCapUsd: 134000,
    hasFreeze: false, hasDeferral: false, creditUsd: 8000,
    programName: "Property Tax Credit (Income Sensitivity)",
    keyPoint: "Up to $8,000 credit — largest income-sensitivity program nationally. No age req but disproportionately benefits 65+.",
  },
  virginia: {
    ageThreshold: 65, additionalExemption: 0, incomeCapUsd: null,
    hasFreeze: true, hasDeferral: true, creditUsd: null,
    programName: "Senior Real Estate Tax Relief (county-set)",
    keyPoint: "County-specific. Fairfax full exemption if income < $60K. Prince William freezes at age 65. No statewide baseline.",
  },
  washington: {
    ageThreshold: 61, additionalExemption: 60000, incomeCapUsd: 58423,
    hasFreeze: true, hasDeferral: true, creditUsd: null,
    programName: "Senior Exemption + Value Freeze (tiered)",
    keyPoint: "Tiered by income: 35% off at $58K, 50% at $48K, 60% at $40K. Plus assessment freeze at enrollment value.",
  },
  "west-virginia": {
    ageThreshold: 65, additionalExemption: 20000, incomeCapUsd: null,
    hasFreeze: false, hasDeferral: false, creditUsd: null,
    programName: "Homestead Exemption (age 65+ or disabled)",
    keyPoint: "$20K exemption with NO income test. Automatic after one-time filing at age 65.",
  },
  wisconsin: {
    ageThreshold: 62, additionalExemption: 0, incomeCapUsd: 24680,
    hasFreeze: false, hasDeferral: true, creditUsd: 1168,
    programName: "Homestead Credit + Lottery Credit + WHEDA",
    keyPoint: "Refundable Homestead Credit up to $1,168. WHEDA Property Tax Deferral for 65+ low-income.",
  },
  wyoming: {
    ageThreshold: 65, additionalExemption: 0, incomeCapUsd: 46000,
    hasFreeze: false, hasDeferral: true, creditUsd: 900,
    programName: "Property Tax Refund Program",
    keyPoint: "Refund up to $900 (median property tax) for 65+ with income < 125% of county median. Deferral program in pilot.",
  },
  "district-of-columbia": {
    ageThreshold: 65, additionalExemption: 0, incomeCapUsd: 169800,
    hasFreeze: false, hasDeferral: false, creditUsd: null,
    programName: "Senior Citizen / Disabled Property Tax Relief (50%)",
    keyPoint: "50% reduction of property tax bill for 65+ with income < $169,800 (2026). Among nation's most generous income caps.",
  },
};

export function generateStaticParams() {
  return getAllStates().map((s) => ({ slug: s.slug }));
}

function fmtUSD(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const state = getStateBySlug(slug);
  const senior = SENIOR_PROFILES[slug];
  if (!state || !senior) return {};

  const benefit =
    senior.additionalExemption > 0
      ? `${fmtUSD(senior.additionalExemption)} Extra`
      : senior.hasFreeze
      ? "Value Freeze"
      : senior.creditUsd
      ? `${fmtUSD(senior.creditUsd)} Credit`
      : "Deferral Program";

  // 2026-07-03 Bing CTR fix: states whose official program is named
  // "Homestead Exemption" (NE, IL, CO…) get searched by that name —
  // «nebraska homestead exemption 2026» sat pos 7 with 0 clicks because
  // the title only said "Senior Property Tax Exemption". Surface the
  // official term for those states; others keep the generic phrasing.
  const usesHomestead = /homestead/i.test(senior.programName);
  return {
    title: usesHomestead
      ? `${state.state} Homestead Exemption for Seniors 2026 — ${benefit}`
      : `${state.state} Senior Property Tax Exemption 2026 — Age ${senior.ageThreshold}+ ${benefit}`,
    description: `${state.state} senior (${senior.ageThreshold}+) property tax benefits: ${senior.programName}. Income cap, exemption amount, freeze/deferral options, and filing process. 2026 values.`,
    alternates: { canonical: `/state/${slug}/senior-exemption/` },
    openGraph: { url: `/state/${slug}/senior-exemption/` },
  };
}

export default async function SeniorExemptionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const state = getStateBySlug(slug);
  const senior = SENIOR_PROFILES[slug];
  const exemption = getStateExemptionData(slug);
  if (!state || !senior) notFound();

  const allStates = getAllStates();
  const neighborAbbrs = NEIGHBORS[state.abbr] || [];
  const neighbors = allStates
    .filter((s) => neighborAbbrs.includes(s.abbr))
    .slice(0, 4);

  // Tax savings estimate: additional $ exemption × effective rate
  const rateDecimal = state.effective_rate / 100;
  const dollarSavings =
    senior.additionalExemption > 0
      ? Math.round(senior.additionalExemption * rateDecimal)
      : 0;

  // Compute rank positions (all 51 states)
  const allProfiles = Object.entries(SENIOR_PROFILES).map(([s, p]) => ({
    slug: s,
    state:
      allStates.find((ss) => ss.slug === s)?.state ?? s,
    abbr: allStates.find((ss) => ss.slug === s)?.abbr ?? "",
    ...p,
  }));
  const byExemption = [...allProfiles].sort(
    (a, b) => b.additionalExemption - a.additionalExemption,
  );
  const byIncomeCap = [...allProfiles]
    .filter((p) => p.incomeCapUsd !== null)
    .sort((a, b) => (b.incomeCapUsd ?? 0) - (a.incomeCapUsd ?? 0));
  const freezeStates = allProfiles.filter((p) => p.hasFreeze);
  const deferralStates = allProfiles.filter((p) => p.hasDeferral);

  const exemptionRank =
    byExemption.findIndex((p) => p.slug === slug) + 1;
  const sameAgeStates = allProfiles.filter(
    (p) => p.ageThreshold === senior.ageThreshold && p.slug !== slug,
  );

  const faqs: { q: string; a: string }[] = [
    {
      q: `At what age can I qualify for ${state.state}'s senior property tax exemption?`,
      a: `${state.state} uses an age threshold of ${senior.ageThreshold}${
        senior.ageThreshold === 62
          ? " (one of the earliest US age thresholds — 9 states including MI, OR, PA, MO use 62 or younger)"
          : senior.ageThreshold === 55
          ? " (lowest US age threshold via Prop 19 transfer)"
          : senior.ageThreshold === 60
          ? " (Hawaii's tiered program starts earliest)"
          : ""
      }. ${
        senior.incomeCapUsd
          ? `An income cap of ${fmtUSD(
              senior.incomeCapUsd,
            )} also applies (adjusted annually for inflation in most states).`
          : "There is no income cap — qualification is age-only."
      }`,
    },
    {
      q: `How much can I save under ${state.state}'s senior exemption program?`,
      a:
        senior.additionalExemption > 0
          ? `${state.state} offers an additional ${fmtUSD(
              senior.additionalExemption,
            )} exemption beyond the general homestead. At the state's effective rate of ${state.effective_rate.toFixed(
              2,
            )}%, that's approximately ${fmtUSD(
              dollarSavings,
            )}/year in tax savings.`
          : senior.creditUsd
          ? `${state.state}'s main senior benefit is a refundable tax credit of up to ${fmtUSD(
              senior.creditUsd,
            )} through ${senior.programName}. This is income-scaled — the full amount applies near the income cap floor.`
          : senior.hasFreeze
          ? `${state.state} doesn't offer a dollar exemption, but freezing your assessed value prevents future tax increases. If home values appreciate 5%/year, the freeze saves roughly 0.5 × ${state.effective_rate.toFixed(
              2,
            )}% × home value after 10 years.`
          : `${state.state}'s senior program is deferral-based — you postpone tax payment rather than eliminate it. Savings come from liquidity (no out-of-pocket) rather than net tax reduction.`,
    },
    {
      q: `Does ${state.state} offer an assessment freeze at age ${senior.ageThreshold}?`,
      a: senior.hasFreeze
        ? `Yes. ${state.state}'s ${senior.programName} locks your property's assessed value at the time of enrollment, so future reassessments don't increase your tax. This is often more valuable than a dollar exemption in appreciating markets. ${
            freezeStates.length
          } of 51 states offer some freeze mechanism — ${state.state} is one of them.`
        : `${state.state} does not currently offer a value freeze for seniors. The primary benefit is ${
            senior.additionalExemption > 0 ? "a dollar exemption" : senior.creditUsd ? "a tax credit" : "a deferral program"
          } (${senior.programName}). Of the ${freezeStates.length} states that do freeze values, neighboring options include: ${freezeStates
            .filter((f) => neighborAbbrs.includes(f.abbr))
            .map((f) => f.state)
            .join(", ") || "none directly adjacent"}.`,
    },
    {
      q: `What happens if my income exceeds ${state.state}'s senior exemption cap?`,
      a: senior.incomeCapUsd
        ? `If your household income exceeds ${fmtUSD(
            senior.incomeCapUsd,
          )}, you lose eligibility for ${senior.programName} that year. Most states recalculate annually — a one-time spike (capital gains, Roth conversion) can disqualify you for one year but not permanently. Strategies: time large distributions, use tax-free income (municipal bonds), defer retirement account withdrawals.`
        : `${state.state} has no income cap for its senior program, so you qualify regardless of income level (as long as you meet the age threshold of ${senior.ageThreshold} and own the home as your primary residence). This is one of ${
            allProfiles.filter((p) => p.incomeCapUsd === null).length
          } states without an income test.`,
    },
    {
      q: `Can I defer property taxes in ${state.state} instead of paying them?`,
      a: senior.hasDeferral
        ? `Yes. ${state.state} offers a property tax deferral program — the state pays your tax, and the amount (plus interest, typically 3-6%) is repaid when you sell the home or from your estate. This preserves cash flow at the cost of reducing heirs' equity. ${deferralStates.length} of 51 states offer deferral; most cap net worth and/or require the home to be mortgage-free.`
        : `${state.state} does not currently offer a standalone deferral program for seniors. Your benefit is structured as a reduction (exemption/credit/freeze) rather than a postponement. ${deferralStates.length} states do offer deferral — Oregon, Colorado, and California are among the largest programs nationally.`,
    },
    {
      q: `How do I apply for ${state.state}'s senior property tax exemption?`,
      a: `Contact your county assessor or tax collector for the application form specific to ${senior.programName}. Documentation typically required: (1) proof of age (driver's license or birth certificate), (2) proof of ownership (deed), (3) proof of primary residence (voter registration + utility bills), ${
        senior.incomeCapUsd ? "(4) income verification (prior-year tax return or Social Security 1099), " : ""
      }(${senior.incomeCapUsd ? "5" : "4"}) homestead exemption filed (typically a prerequisite). Deadlines vary by state — most counties require filing by March 1 or 31 for that tax year's benefit.`,
    },
    {
      q: `How does ${state.state}'s senior exemption compare to neighboring states?`,
      a: `${state.state} ranks #${exemptionRank} of 51 by additional dollar exemption amount. ${
        senior.additionalExemption > 0
          ? `Its ${fmtUSD(senior.additionalExemption)} additional exemption is`
          : `Its program is`
      } ${
        exemptionRank <= 10
          ? "among the most generous nationally"
          : exemptionRank <= 25
          ? "in the top half but not exceptional"
          : exemptionRank <= 40
          ? "below the national median"
          : "among the least generous by dollar exemption, though freezes or credits may compensate"
      }. Neighboring state comparison: ${
        neighbors.length > 0
          ? neighbors
              .map((n) => {
                const np = SENIOR_PROFILES[n.slug];
                return np
                  ? `${n.state} (${
                      np.additionalExemption
                        ? fmtUSD(np.additionalExemption) + " exempt"
                        : np.hasFreeze
                        ? "freeze"
                        : np.creditUsd
                        ? fmtUSD(np.creditUsd) + " credit"
                        : "deferral"
                    })`
                  : n.state;
              })
              .join(", ")
          : "no land-adjacent states"
      }.`,
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
              {
                "@type": "ListItem",
                position: 2,
                name: state.state,
                item: `${SITE_URL}/state/${slug}/`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: "Senior Property Tax Exemption",
                item: `${SITE_URL}/state/${slug}/senior-exemption/`,
              },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />

      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: state.state, href: `/state/${slug}/` },
          { label: "Senior Exemption" },
        ]}
      />

      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-3">
          {state.state} Senior Property Tax Exemption — 2026
        </h1>
        <p className="text-lg text-stone-600 leading-relaxed">
          <strong>{senior.programName}</strong> for homeowners age{" "}
          <strong>{senior.ageThreshold}+</strong>
          {senior.incomeCapUsd
            ? ` with income under ${fmtUSD(senior.incomeCapUsd)}`
            : " regardless of income"}
          .{" "}
          {senior.additionalExemption > 0 ? (
            <>
              Additional{" "}
              <strong>{fmtUSD(senior.additionalExemption)}</strong> exemption
              beyond the general homestead — approximately{" "}
              <strong>{fmtUSD(dollarSavings)}/year</strong> in tax savings at{" "}
              {state.state}&apos;s{" "}
              {state.effective_rate.toFixed(2)}% effective rate.
            </>
          ) : senior.hasFreeze ? (
            <>
              Assessed value freeze — locks property value for tax purposes at
              enrollment, protecting against future reassessments.
            </>
          ) : senior.creditUsd ? (
            <>
              Refundable tax credit up to{" "}
              <strong>{fmtUSD(senior.creditUsd)}/year</strong> — paid even if
              you have no state income tax liability.
            </>
          ) : (
            <>
              Tax deferral — postpones payment until sale or estate settlement.
              Preserves liquidity for fixed-income seniors.
            </>
          )}
        </p>
        <FreshnessTag
          source={`${state.state} Department of Revenue + Lincoln Institute property tax data`}
        />
      </header>

      {/* Three spotlight cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="text-xs text-amber-700 uppercase tracking-wider font-semibold mb-1">
            Age Threshold
          </div>
          <div className="text-3xl font-bold text-amber-900 mb-2">
            {senior.ageThreshold}+
          </div>
          <div className="text-xs text-amber-800 leading-snug">
            {senior.ageThreshold === 55
              ? "Prop 19 transfer only"
              : senior.ageThreshold === 60
              ? "Tiered benefits start"
              : senior.ageThreshold === 62
              ? "Earlier than national median"
              : senior.ageThreshold === 65
              ? "National standard threshold"
              : `Above median threshold`}
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="text-xs text-amber-800 uppercase tracking-wider font-semibold mb-1">
            Income Cap
          </div>
          <div className="text-3xl font-bold text-amber-900 mb-2">
            {senior.incomeCapUsd
              ? fmtUSD(senior.incomeCapUsd)
              : "No Cap"}
          </div>
          <div className="text-xs text-amber-900 leading-snug">
            {senior.incomeCapUsd
              ? `Household income ceiling for eligibility`
              : `Qualification is age-only — no income test`}
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
          <div className="text-xs text-purple-700 uppercase tracking-wider font-semibold mb-1">
            Primary Benefit
          </div>
          <div className="text-2xl font-bold text-purple-900 mb-2">
            {senior.additionalExemption > 0
              ? fmtUSD(senior.additionalExemption)
              : senior.hasFreeze
              ? "Value Freeze"
              : senior.creditUsd
              ? `${fmtUSD(senior.creditUsd)} credit`
              : "Deferral"}
          </div>
          <div className="text-xs text-purple-800 leading-snug">
            {senior.additionalExemption > 0
              ? `Additional $ exemption (off assessed value)`
              : senior.hasFreeze
              ? `Locks assessed value at enrollment`
              : senior.creditUsd
              ? `Refundable against state tax`
              : `Postpone payment until sale/estate`}
          </div>
        </div>
      </section>

      <EditorNote
        note={`Dollar amounts, income caps, and age thresholds reflect ${state.state}'s senior property tax framework as of tax year 2026. Several states index these figures to inflation or Social Security COLA — our numbers are point-in-time snapshots. For filing decisions, verify current values with your county assessor or a CPA licensed in ${state.state}.`}
      />

      <AdSlot id="7890123456" />

      {/* Detailed program explanation */}
      <section className="my-10">
        <h2 className="text-2xl font-bold text-stone-800 mb-4">
          {senior.programName} — How It Works
        </h2>
        <div className="bg-white border border-stone-200 rounded-xl p-5 mb-6">
          <p className="text-sm text-stone-700 leading-relaxed mb-3">
            <strong>Key point:</strong> {senior.keyPoint}
          </p>
          {exemption?.seniorExemption && (
            <p className="text-sm text-stone-700 leading-relaxed border-t border-stone-100 pt-3">
              <strong>State description:</strong> {exemption.seniorExemption}
            </p>
          )}
        </div>

        {/* Program features grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            className={`p-4 rounded-lg border ${
              senior.additionalExemption > 0
                ? "bg-emerald-50 border-emerald-200"
                : "bg-stone-50 border-stone-200 opacity-60"
            }`}
          >
            <div className="text-xs text-stone-500 uppercase tracking-wider mb-1">
              Dollar Exemption
            </div>
            <div className="text-lg font-bold text-stone-900">
              {senior.additionalExemption > 0
                ? fmtUSD(senior.additionalExemption)
                : "None"}
            </div>
          </div>
          <div
            className={`p-4 rounded-lg border ${
              senior.hasFreeze
                ? "bg-indigo-50 border-indigo-200"
                : "bg-stone-50 border-stone-200 opacity-60"
            }`}
          >
            <div className="text-xs text-stone-500 uppercase tracking-wider mb-1">
              Value Freeze
            </div>
            <div className="text-lg font-bold text-stone-900">
              {senior.hasFreeze ? "Available" : "Not offered"}
            </div>
          </div>
          <div
            className={`p-4 rounded-lg border ${
              senior.creditUsd
                ? "bg-amber-50 border-amber-200"
                : "bg-stone-50 border-stone-200 opacity-60"
            }`}
          >
            <div className="text-xs text-stone-500 uppercase tracking-wider mb-1">
              Tax Credit
            </div>
            <div className="text-lg font-bold text-stone-900">
              {senior.creditUsd ? `Up to ${fmtUSD(senior.creditUsd)}` : "None"}
            </div>
          </div>
          <div
            className={`p-4 rounded-lg border ${
              senior.hasDeferral
                ? "bg-rose-50 border-rose-200"
                : "bg-stone-50 border-stone-200 opacity-60"
            }`}
          >
            <div className="text-xs text-stone-500 uppercase tracking-wider mb-1">
              Deferral
            </div>
            <div className="text-lg font-bold text-stone-900">
              {senior.hasDeferral ? "Available" : "Not offered"}
            </div>
          </div>
        </div>
      </section>

      {/* National comparison table — top 15 + current state */}
      <section className="my-10">
        <h2 className="text-2xl font-bold text-stone-800 mb-4">
          National Ranking — Senior Property Tax Benefits (by dollar exemption)
        </h2>
        <p className="text-sm text-stone-600 mb-4">
          Top 15 states by additional senior exemption amount. {state.state}{" "}
          highlighted for reference. States without dollar exemptions may still
          offer freezes, credits, or deferrals.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-100 text-stone-800">
                <th className="text-left px-3 py-2">Rank</th>
                <th className="text-left px-3 py-2">State</th>
                <th className="text-right px-3 py-2">Age</th>
                <th className="text-right px-3 py-2">Additional Exemption</th>
                <th className="text-right px-3 py-2">Income Cap</th>
                <th className="text-center px-3 py-2">Freeze</th>
              </tr>
            </thead>
            <tbody>
              {byExemption
                .slice(0, 15)
                .concat(
                  byExemption.findIndex((p) => p.slug === slug) >= 15
                    ? [byExemption.find((p) => p.slug === slug)!]
                    : [],
                )
                .map((p, i) => {
                  const isCurrent = p.slug === slug;
                  const rank = byExemption.findIndex((b) => b.slug === p.slug) + 1;
                  return (
                    <tr
                      key={p.slug}
                      className={
                        isCurrent
                          ? "bg-amber-50 font-semibold"
                          : i % 2 === 0
                          ? "bg-white"
                          : "bg-stone-50"
                      }
                    >
                      <td className="px-3 py-2">#{rank}</td>
                      <td className="px-3 py-2">{p.state}</td>
                      <td className="px-3 py-2 text-right">{p.ageThreshold}+</td>
                      <td className="px-3 py-2 text-right font-mono">
                        {p.additionalExemption > 0
                          ? fmtUSD(p.additionalExemption)
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-right text-xs">
                        {p.incomeCapUsd ? fmtUSD(p.incomeCapUsd) : "None"}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {p.hasFreeze ? "✓" : "—"}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tax savings calculation */}
      <section className="my-10">
        <h2 className="text-2xl font-bold text-stone-800 mb-4">
          {state.state} Senior Tax Savings — 3 Home Value Scenarios
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-100 text-stone-800">
                <th className="text-left px-3 py-2">Home Value</th>
                <th className="text-right px-3 py-2">
                  Tax Before Senior Exemption
                </th>
                <th className="text-right px-3 py-2">
                  Senior Benefit (approx)
                </th>
                <th className="text-right px-3 py-2">
                  Tax After (approx)
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                Math.round(state.median_home_value * 0.75),
                state.median_home_value,
                Math.round(state.median_home_value * 1.5),
              ].map((hv, i) => {
                const beforeTax = Math.round(hv * rateDecimal);
                const seniorSaving =
                  senior.additionalExemption > 0
                    ? Math.min(
                        Math.round(senior.additionalExemption * rateDecimal),
                        beforeTax,
                      )
                    : senior.creditUsd ?? 0;
                const afterTax = Math.max(0, beforeTax - seniorSaving);
                const label = ["75% median", "median", "150% median"][i];
                return (
                  <tr
                    key={i}
                    className={i % 2 === 0 ? "bg-white" : "bg-stone-50"}
                  >
                    <td className="px-3 py-2">
                      {fmtUSD(hv)}{" "}
                      <span className="text-xs text-stone-500">({label})</span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {fmtUSD(beforeTax)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-emerald-700">
                      −{fmtUSD(seniorSaving)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-semibold">
                      {fmtUSD(afterTax)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-stone-500 mt-3 italic">
          Calculation: Home value × effective rate ({state.effective_rate.toFixed(
            2,
          )}%) = tax before. Senior benefit assumes dollar exemption applied to
          assessed value
          {senior.hasFreeze
            ? " (freezes savings grow over time as market value rises — not shown)"
            : senior.creditUsd
            ? " OR max credit, whichever is lower"
            : ""}
          . Actual savings depend on local assessment ratios and mill rates.
        </p>
      </section>

      {/* Same-age-threshold peer states */}
      {sameAgeStates.length > 0 && (
        <section className="my-10">
          <h2 className="text-xl font-bold text-stone-800 mb-4">
            Other States with Age {senior.ageThreshold}+ Threshold
          </h2>
          <p className="text-sm text-stone-600 mb-4">
            States using the same age threshold as {state.state} —{" "}
            {sameAgeStates.length} others. Benefit structures vary widely.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {sameAgeStates.slice(0, 8).map((p) => (
              <a
                key={p.slug}
                href={`/state/${p.slug}/senior-exemption/`}
                className="block p-3 bg-white border border-stone-200 rounded-lg hover:border-amber-400 hover:shadow-sm transition"
              >
                <div className="text-sm font-bold text-stone-900 mb-1">
                  {p.state}
                </div>
                <div className="text-xs text-stone-500">
                  {p.additionalExemption > 0
                    ? fmtUSD(p.additionalExemption)
                    : p.hasFreeze
                    ? "Freeze"
                    : p.creditUsd
                    ? `${fmtUSD(p.creditUsd)} credit`
                    : "Deferral"}
                </div>
                <div className="text-xs text-amber-600 mt-1">View →</div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Neighboring states */}
      {neighbors.length > 0 && (
        <section className="my-10">
          <h2 className="text-xl font-bold text-stone-800 mb-4">
            Compare {state.state} to Neighboring States
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {neighbors.map((n) => {
              const np = SENIOR_PROFILES[n.slug];
              return (
                <a
                  key={n.slug}
                  href={`/state/${n.slug}/senior-exemption/`}
                  className="block p-4 bg-white border border-stone-200 rounded-lg hover:border-amber-500 hover:shadow-sm transition"
                >
                  <div className="text-base font-bold text-stone-900 mb-1">
                    {n.state}
                  </div>
                  <div className="text-xs text-stone-500">
                    Age {np?.ageThreshold ?? 65}+ threshold
                  </div>
                  <div className="text-xs text-stone-500">
                    {np?.additionalExemption
                      ? fmtUSD(np.additionalExemption) + " exempt"
                      : np?.hasFreeze
                      ? "Value freeze"
                      : np?.creditUsd
                      ? fmtUSD(np.creditUsd) + " credit"
                      : "Deferral-based"}
                  </div>
                  <div className="text-xs text-amber-700 mt-1">
                    Senior exemption →
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* Parent + homestead sibling */}
      <section className="my-10 grid grid-cols-1 md:grid-cols-2 gap-4">
        <a
          href={`/state/${slug}/`}
          className="block p-5 bg-white border border-stone-200 rounded-xl hover:border-amber-500 hover:shadow-sm transition"
        >
          <div className="text-xs text-stone-500 uppercase tracking-wider mb-1">
            State Overview
          </div>
          <div className="text-base font-bold text-stone-900 mb-1">
            ← {state.state} property tax rates + full overview
          </div>
          <div className="text-sm text-stone-600">
            Effective rate, median tax, county breakdowns, calculator, and full
            property tax guide for {state.state}.
          </div>
        </a>
        <a
          href={`/state/${slug}/homestead-exemption/`}
          className="block p-5 bg-emerald-50 border border-emerald-200 rounded-xl hover:border-emerald-400 hover:shadow-sm transition"
        >
          <div className="text-xs text-emerald-700 uppercase tracking-wider mb-1">
            Sibling Deep Dive
          </div>
          <div className="text-base font-bold text-stone-900 mb-1">
            {state.state} general homestead exemption →
          </div>
          <div className="text-sm text-stone-600">
            Homestead base amount, assessment caps, disabled veteran rules, and
            filing process for {state.state}&apos;s primary-residence exemption.
          </div>
        </a>
      </section>

      {/* FAQ */}
      <section className="my-10">
        <h2 className="text-2xl font-bold text-stone-800 mb-4">
          Frequently Asked Questions: {state.state} Senior Property Tax Exemption
        </h2>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <details
              key={i}
              className="group bg-white border border-stone-200 rounded-xl p-4 open:border-amber-300"
            >
              <summary className="cursor-pointer font-semibold text-stone-900 text-sm list-none flex items-start gap-2">
                <span className="text-amber-500 group-open:rotate-90 transition-transform">
                  ▸
                </span>
                <span>{f.q}</span>
              </summary>
              <p className="mt-3 ml-5 text-sm text-stone-700 leading-relaxed">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      <div className="mt-10">
        <DataSourceBadge
          sources={[
            {
              name: `${state.state} Department of Revenue`,
              url: "https://www.taxadmin.org/state-tax-agencies",
            },
            {
              name: "Lincoln Institute Property Tax Database",
              url: "https://www.lincolninst.edu/research-data/data-toolkits/significant-features-property-tax",
            },
            {
              name: "Tax Foundation",
              url: "https://taxfoundation.org/data/all/state/property-taxes-by-state/",
            },
            {
              name: "AARP Senior Property Tax Relief Guide",
              url: "https://www.aarp.org/money/taxes/",
            },
          ]}
          updatedAt="2026-04"
        />
      </div>

      <AuthorBox
        vintage={EXEMPTION_VINTAGE}
        source={`${state.state} senior property tax exemption guide`}
        showDisclaimer
      />
    </>
  );
}
