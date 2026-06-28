import type { Metadata } from "next";
import { getAllStates, getAllCounties } from "@/lib/db";
import { AppealSimulator } from "@/components/AppealSimulator";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AuthorBox } from "@/components/AuthorBox";
import { AdSlot } from "@/components/AdSlot";
import { breadcrumbSchema, faqSchema } from "@/lib/schema";
import { getAllVerifiedDeadlines } from "@/lib/state-appeal-deadlines";
import { APPEAL_TIER_CUTOFF_SUMMARY } from "@/lib/assessment-appeal-success-tier";
import {
  COUNTY_VINTAGE,
  EXEMPTION_VINTAGE,
  PUBLISHER,
  EDITORIAL_TEAM,
  SOURCE_AUTHORITIES,
} from "@/lib/authorship";

const SITE_URL = "https://propertytaxpeek.com";
const PAGE_URL = "/appeal-simulator/";

export const metadata: Metadata = {
  title: "Property Tax Appeal Outcome Simulator — Estimate Your Chance & Savings",
  description:
    "Enter your county, assessed value, and comparable home sales. The Appeal Outcome Simulator flags over-assessment, estimates annual savings if your appeal succeeds, and surfaces your state's published reduction-rate range.",
  alternates: { canonical: PAGE_URL },
  openGraph: { url: PAGE_URL, type: "website" },
};

const FAQS = [
  {
    question: "What does the Appeal Outcome Simulator do?",
    answer:
      "It takes your county, your assessed value (from your assessment notice), and up to three comparable home sale prices, then outputs four signals: (1) whether your property is over-assessed against a comp-grounded target, (2) your estimated annual and 10-year savings if an appeal succeeds, (3) the success probability band for your state — either the published reduction rate (NJ Tax Court, Cook County Assessor, Travis CAD in Texas, MD Tax Court) or the structural readability tier, and (4) a state-specific action checklist with filing-deadline guidance.",
  },
  {
    question: "How do you calculate the 'over-assessed' flag?",
    answer:
      "We compute the median of your supplied comparable home values (or fall back to the county median home value when comps are absent), multiply by 1.05 to set a target assessment, then flag your property as over-assessed if your assessed value exceeds that target by more than 10 percent. The 5 percent and 10 percent thresholds are industry rules-of-thumb — not statutory limits. The simulator surfaces the threshold transparently.",
  },
  {
    question: "Is the success probability a prediction of my individual appeal outcome?",
    answer:
      "No. For states with a centrally published reduction-rate range (New Jersey, Maryland, Illinois Cook County, Texas Travis County), we surface that range verbatim — it applies to timely-filed appeals on residential parcels, not to your specific case. For all other states, we surface a structural readability tier based on the appeal mechanism (tax-court, hybrid, administrative, or cap-sheltered). Individual outcomes depend on evidence quality, filing-window compliance, and assessor discretion.",
  },
  {
    question: "Where do the filing deadlines come from?",
    answer:
      "Verified deadlines (New Jersey April 1, Texas May 15, Minnesota April 30, Ohio March 31, Massachusetts February 1, Maryland 45 days from notice) are sourced from the cited state statute. States without a single statewide statutory date (most administrative-only and many hybrid states) receive a structural-guidance string and a directive to confirm with the county assessor. The simulator never invents a calendar date.",
  },
  {
    question: "Is this legal advice?",
    answer:
      "No. The Appeal Outcome Simulator is editorial. It is not endorsed by the International Association of Assessing Officers (IAAO), the US Census Bureau, the Internal Revenue Service, or any state Department of Revenue. Property tax appeal procedures vary by state and county. Filing-window non-compliance is the most common appeal rejection cause nationwide. Confirm all deadlines and procedural rules with your county assessor or a licensed tax professional before filing.",
  },
  {
    question: "Why do some states show 'Rare Success'?",
    answer:
      "Five states are classified as cap-sheltered because constitutional or statutory caps limit how much an assessed value can grow year-over-year: California (Proposition 13, 2% cap), Florida (Save Our Homes, 3% cap on homesteads), Arizona (Proposition 117, 5% cap), Oregon (Measure 50, 3% cap), and Oklahoma (Constitution Art. X § 8B, 3% homestead cap). The cap structurally reduces the appeal upside on homesteads. Appeals remain available for decline-in-value scenarios and non-homestead parcels — the simulator surfaces this in the action checklist.",
  },
  {
    question: "What is the 'confidence' label based on?",
    answer:
      "Confidence is an editorial three-band readability heuristic, NOT a statistical confidence interval. It rises when the filer supplies three or more comparable home values, when a recent purchase price or independent appraisal is added, and when the state has a tax-court appeal route (structural infrastructure that documents outcomes). The label is intended to remind the filer that the simulator's output is only as strong as the evidence the filer brings to the appeal.",
  },
];

export default async function AppealSimulatorPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; county?: string }>;
}) {
  const { state: stateParam, county: countyParam } = await searchParams;
  const states = getAllStates().map((s) => ({ abbr: s.abbr, state: s.state }));
  const counties = getAllCounties().map((c) => ({
    slug: c.slug,
    county_name: c.county_name,
    state: c.state,
    effective_rate: c.effective_rate,
    median_home_value: c.median_home_value,
  }));

  const defaultStateAbbr = stateParam && states.some((s) => s.abbr === stateParam.toUpperCase())
    ? stateParam.toUpperCase()
    : undefined;
  const defaultCountySlug = countyParam && counties.some((c) => c.slug === countyParam)
    ? countyParam
    : undefined;

  const verifiedDeadlines = getAllVerifiedDeadlines();

  const breadcrumbs = breadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Appeal Outcome Simulator", url: PAGE_URL },
  ]);

  const faqLd = faqSchema(FAQS);

  const howToLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to file a property tax appeal — using the Appeal Outcome Simulator",
    description:
      "Five-step process for documenting a property tax appeal using the propertytaxpeek Appeal Outcome Simulator, county comps, and your state's filing deadline.",
    totalTime: "PT60M",
    estimatedCost: {
      "@type": "MonetaryAmount",
      currency: "USD",
      value: "0",
    },
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Pull your assessment notice",
        text: "Locate the most recent assessment notice from your county assessor. Note the assessed value, the assessment date, and the appeal-window expiration.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Gather comparable home sales",
        text: "Pull 3-5 recent comparable sales within 0.5 miles, similar square footage (±15%), similar age (±15 years), and similar condition. Use county recorder data, MLS, or a real-estate agent.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Run the simulator",
        text: "Enter your state, county, assessed value, and the comp values into the Appeal Outcome Simulator. Note the over-assessment percentage, estimated savings, and the published reduction-rate band for your state.",
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Request the property record card",
        text: "Ask your county assessor for your property record card and check for factual errors (incorrect square footage, bath count, lot size, or condition rating). Errors are the strongest single argument for a reduction.",
      },
      {
        "@type": "HowToStep",
        position: 5,
        name: "File before the deadline",
        text: "Submit the appeal with comps and any record-card corrections before your state's filing deadline. Filing-window non-compliance is the most common rejection cause nationwide.",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />

      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Appeal Outcome Simulator" },
        ]}
      />

      {/* Signature hero — visually distinct from other PSU site headers */}
      <div className="bg-stone-100 border-l-4 border-amber-700 border-y border-r border-stone-200 rounded-r-lg px-6 py-5 mb-8">
        <div className="flex items-baseline gap-3 mb-2">
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-amber-700 text-stone-50 rounded">
            Signature Tool
          </span>
          <span className="text-xs text-stone-500 italic">Only on propertytaxpeek</span>
        </div>
        <h1 className="text-3xl font-bold text-stone-900 mb-2 leading-tight">
          Property Tax Appeal Outcome Simulator
        </h1>
        <p className="text-base text-stone-700 leading-relaxed max-w-3xl">
          Enter your county and assessed value. We flag over-assessment against the
          comp-grounded target, estimate the annual and 10-year savings if your appeal
          succeeds, and surface the published reduction-rate band for your state.
          Outputs are editorial — they are <strong>not</strong> a prediction of your
          individual outcome.
        </p>
      </div>

      <AppealSimulator
        states={states}
        counties={counties}
        defaultStateAbbr={defaultStateAbbr}
        defaultCountySlug={defaultCountySlug}
      />

      <AdSlot id="6789012345" />

      {/* Tier reference table */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-stone-900 mb-4">
          State appeal-mechanism reference
        </h2>
        <p className="text-sm text-stone-600 mb-4 leading-relaxed">
          The simulator maps your state to one of five structural readability tiers
          based on the appeal mechanism the state offers and whether a state DOR,
          county assessor, or state tax court publishes an empirical reduction-rate
          range.
        </p>
        <div className="border border-stone-200 rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-100">
              <tr className="text-left">
                <th className="px-4 py-2 font-bold text-stone-700 uppercase tracking-wider text-xs">Tier</th>
                <th className="px-4 py-2 font-bold text-stone-700 uppercase tracking-wider text-xs">Criteria</th>
                <th className="px-4 py-2 font-bold text-stone-700 uppercase tracking-wider text-xs">Editorial label</th>
              </tr>
            </thead>
            <tbody>
              {APPEAL_TIER_CUTOFF_SUMMARY.map((row) => (
                <tr key={row.tier} className="border-t border-stone-200">
                  <td className="px-4 py-2 font-semibold text-stone-800">{row.tier.replace(/([A-Z])/g, " $1").trim()}</td>
                  <td className="px-4 py-2 text-stone-700">{row.range}</td>
                  <td className="px-4 py-2 text-stone-600 text-xs italic">{row.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Verified deadlines */}
      <section className="mt-10">
        <h2 className="text-2xl font-bold text-stone-900 mb-2">
          Statutorily-verified filing deadlines
        </h2>
        <p className="text-sm text-stone-600 mb-4 leading-relaxed">
          The simulator commits to these calendar deadlines because each is grounded in a
          named statute or a state-level Department of Revenue publication. Every other
          state receives a structural-guidance string instead of a fabricated date — confirm
          the exact filing window with your county assessor.
        </p>
        <div className="border border-stone-200 rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-100">
              <tr className="text-left">
                <th className="px-4 py-2 font-bold text-stone-700 uppercase tracking-wider text-xs">State</th>
                <th className="px-4 py-2 font-bold text-stone-700 uppercase tracking-wider text-xs">Deadline</th>
                <th className="px-4 py-2 font-bold text-stone-700 uppercase tracking-wider text-xs">Statute / source</th>
              </tr>
            </thead>
            <tbody>
              {verifiedDeadlines.map((d) => (
                <tr key={d.abbr} className="border-t border-stone-200">
                  <td className="px-4 py-2 font-semibold text-stone-800">{d.abbr}</td>
                  <td className="px-4 py-2 text-stone-700">{d.deadline}</td>
                  <td className="px-4 py-2 text-stone-600 text-xs italic">{d.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <AdSlot id="7890123456" />

      {/* Methodology */}
      <section className="prose prose-stone max-w-none mt-12">
        <h2>Methodology</h2>
        <h3>Comp-grounded target assessment</h3>
        <p>
          The simulator computes a target assessed value as the median of supplied
          comparable home values multiplied by 1.05 (industry rule-of-thumb that assessors
          aim for roughly 100 percent of market value with a small noise margin). When no
          comps are supplied, the county median home value substitutes — the output is
          honestly labeled as relying on the county fallback rather than user comps.
        </p>
        <h3>Over-assessment threshold</h3>
        <p>
          A property is flagged as over-assessed when its assessed value exceeds the
          comp-grounded target by more than 10 percent. The buffer prevents trivial
          differences from triggering a flag and reflects the rough noise floor of county
          mass appraisal models. The threshold is editorial, not statutory.
        </p>
        <h3>Estimated savings</h3>
        <p>
          Estimated annual savings = (your assessed value − target) × county effective tax
          rate. The 10-year cumulative figure is a flat-line projection with no inflation
          adjustment and assumes the rate is locked at its current level — a simplifying
          assumption. Real outcomes depend on rate changes, future reassessments, and
          successful appeal closure.
        </p>
        <h3>Success probability band</h3>
        <p>
          For states with a centrally published reduction rate, the simulator surfaces the
          range verbatim. These four states/jurisdictions are the only ones in our table
          where the rate is centrally published on residential appealed parcels: New
          Jersey (NJ Tax Court annual reports), Illinois (Cook County Assessor), Maryland
          (MD Tax Court), and Texas (Travis Central Appraisal District). For the remaining
          states, the simulator returns a structural readability tier derived from the
          appeal mechanism — independent tax court, hybrid (county + state review),
          administrative county-board only, or cap-sheltered.
        </p>
        <h3>Confidence label</h3>
        <p>
          The confidence label (Low / Medium / High) is an editorial three-band heuristic.
          It is NOT a statistical confidence interval. The label rises when the filer
          supplies three or more comparable home sale prices, when a recent purchase price
          or independent appraisal is supplied, and when the state offers a tax-court
          appeal route. The label is intended to remind the filer that the simulator&apos;s
          output is only as strong as the evidence brought to the appeal.
        </p>
        <h3>What the simulator is NOT</h3>
        <ul>
          <li>It is not a prediction of an individual appeal outcome.</li>
          <li>It is not legal advice and is not a substitute for a licensed property tax consultant or attorney.</li>
          <li>It is not endorsed by IAAO, the US Census Bureau, the Internal Revenue Service, or any state Department of Revenue.</li>
          <li>It cannot anticipate filing-window changes that occur between data refreshes.</li>
        </ul>
      </section>

      {/* FAQ */}
      <section className="mt-10">
        <h2 className="text-2xl font-bold text-stone-900 mb-4">
          Frequently asked questions
        </h2>
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <details
              key={i}
              className="rounded-md border border-stone-200 bg-white p-4 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="cursor-pointer font-semibold text-stone-900 flex items-center justify-between gap-2">
                <span>{f.question}</span>
                <span className="text-amber-700 text-sm">+</span>
              </summary>
              <p className="mt-2 text-sm text-stone-700 leading-relaxed">{f.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <AuthorBox
        vintage={EXEMPTION_VINTAGE}
        source={`Appeal Outcome Simulator (deterministic, editorial heuristics). County effective rates from US Census ACS 2024 5-Year, refreshed ${COUNTY_VINTAGE}. State appeal mechanisms surveyed from IAAO Standard on Property Tax Policy Section 7 and state Department of Revenue publications. Reviewed by ${EDITORIAL_TEAM.name} on behalf of ${PUBLISHER.name}; data providers: ${SOURCE_AUTHORITIES.map((a) => a.name).join(", ")}.`}
        showDisclaimer
      />
    </>
  );
}
