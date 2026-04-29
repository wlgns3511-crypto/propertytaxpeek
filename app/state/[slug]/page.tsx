import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllStates,
  getStateBySlug,
  getCountiesByState,
  getNationalAverage,
} from "@/lib/db";
import { PropertyTaxCalculator } from "@/components/PropertyTaxCalculator";
import { AdSlot } from "@/components/AdSlot";
import { Breadcrumb } from "@/components/Breadcrumb";
import { FreshnessTag } from "@/components/FreshnessTag";
import { DataFeedback } from "@/components/DataFeedback";
import { TaxRateChart } from "@/components/TaxRateChart";
import { ComparisonBar } from "@/components/ComparisonBar";
import { CiteButton } from "@/components/CiteButton";
import { AuthorBox } from "@/components/AuthorBox";
import { EditorNote } from "@/components/EditorNote";
import { DidYouKnow } from "@/components/DidYouKnow";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { CrossSiteLinks } from "@/components/CrossSiteLinks";
import { FeedbackButton } from "@/components/FeedbackButton";
import { DownloadReport } from "@/components/DownloadReport";
import { generateStateInsights } from "@/lib/state-insights";
import { AnswerHero } from "@/components/upgrades/AnswerHero";
import { TrustBlock } from "@/components/upgrades/TrustBlock";
import { DecisionNext } from "@/components/upgrades/DecisionNext";
import { StateRich } from '@/components/state/StateRich';
import { DB_UPDATED } from "@/lib/authorship";
import { getStateAcs, getBurdenDistribution } from "@/lib/state-facts";
import { getCountyAcs } from "@/lib/county-facts";
import { VINTAGE_LABEL, VINTAGE_SHORT } from "@/lib/data-vintage";

// dynamicParams=false (2026-04-23): unknown state slugs → real HTTP 404.
export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams() {
  return getAllStates().map((s) => ({ slug: s.slug }));
}

function fmt(n: number) {
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
  if (!state) return {};
  // Prefer ACS 2024 5-Year values when available; fall back to legacy DB row.
  const acs = getStateAcs(state.abbr.toUpperCase());
  const rate = acs?.effective_rate ?? state.effective_rate;
  const tax = acs?.median_real_estate_taxes ?? state.median_tax;
  const home = acs?.median_home_value ?? state.median_home_value;
  return {
    title: `${state.state} Property Tax Rates - ${rate.toFixed(2)}% Average Rate`,
    description: `${state.state} has an effective property tax rate of ${rate.toFixed(2)}%. Median annual property tax is ${fmt(tax)} on a median home value of ${fmt(home)}. See county-level breakdown.`,
    alternates: { canonical: `/state/${slug}/` },
    openGraph: { url: `/state/${slug}/` },
  };
}

// Neighboring states mapping for "how it compares" section
const NEIGHBORS: Record<string, string[]> = {
  AL: ["FL", "GA", "MS", "TN"],
  AK: [],
  AZ: ["CA", "CO", "NV", "NM", "UT"],
  AR: ["LA", "MO", "MS", "OK", "TN", "TX"],
  CA: ["AZ", "NV", "OR"],
  CO: ["AZ", "KS", "NE", "NM", "OK", "UT", "WY"],
  CT: ["MA", "NY", "RI"],
  DE: ["MD", "NJ", "PA"],
  FL: ["AL", "GA"],
  GA: ["AL", "FL", "NC", "SC", "TN"],
  HI: [],
  ID: ["MT", "NV", "OR", "UT", "WA", "WY"],
  IL: ["IA", "IN", "KY", "MO", "WI"],
  IN: ["IL", "KY", "MI", "OH"],
  IA: ["IL", "MN", "MO", "NE", "SD", "WI"],
  KS: ["CO", "MO", "NE", "OK"],
  KY: ["IL", "IN", "MO", "OH", "TN", "VA", "WV"],
  LA: ["AR", "MS", "TX"],
  ME: ["NH"],
  MD: ["DE", "PA", "VA", "WV"],
  MA: ["CT", "NH", "NY", "RI", "VT"],
  MI: ["IN", "OH", "WI"],
  MN: ["IA", "ND", "SD", "WI"],
  MS: ["AL", "AR", "LA", "TN"],
  MO: ["AR", "IL", "IA", "KS", "KY", "NE", "OK", "TN"],
  MT: ["ID", "ND", "SD", "WY"],
  NE: ["CO", "IA", "KS", "MO", "SD", "WY"],
  NV: ["AZ", "CA", "ID", "OR", "UT"],
  NH: ["ME", "MA", "VT"],
  NJ: ["DE", "NY", "PA"],
  NM: ["AZ", "CO", "OK", "TX", "UT"],
  NY: ["CT", "MA", "NJ", "PA", "VT"],
  NC: ["GA", "SC", "TN", "VA"],
  ND: ["MN", "MT", "SD"],
  OH: ["IN", "KY", "MI", "PA", "WV"],
  OK: ["AR", "CO", "KS", "MO", "NM", "TX"],
  OR: ["CA", "ID", "NV", "WA"],
  PA: ["DE", "MD", "NJ", "NY", "OH", "WV"],
  RI: ["CT", "MA"],
  SC: ["GA", "NC"],
  SD: ["IA", "MN", "MT", "ND", "NE", "WY"],
  TN: ["AL", "AR", "GA", "KY", "MO", "MS", "NC", "VA"],
  TX: ["AR", "LA", "NM", "OK"],
  UT: ["AZ", "CO", "ID", "NV", "NM", "WY"],
  VT: ["MA", "NH", "NY"],
  VA: ["KY", "MD", "NC", "TN", "WV"],
  WA: ["ID", "OR"],
  WV: ["KY", "MD", "OH", "PA", "VA"],
  WI: ["IA", "IL", "MI", "MN"],
  WY: ["CO", "ID", "MT", "NE", "SD", "UT"],
};

export default async function StatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const state = getStateBySlug(slug);
  if (!state) notFound();

  const counties = getCountiesByState(state.abbr);
  const national = getNationalAverage();
  const allStates = getAllStates();
  const neighborAbbrs = NEIGHBORS[state.abbr] || [];
  const neighbors = allStates.filter((s) => neighborAbbrs.includes(s.abbr));

  // ACS 2024 5-Year state-level data (replaces synthetic ACS 2022 estimates).
  const stateAcs = getStateAcs(state.abbr.toUpperCase());
  const effectiveRate = stateAcs?.effective_rate ?? state.effective_rate;
  const medianTax = stateAcs?.median_real_estate_taxes ?? state.median_tax;
  const medianHomeValue = stateAcs?.median_home_value ?? state.median_home_value;
  const seniorIncome = stateAcs?.median_income_age65_plus ?? null;
  const seniorBurdenPct = stateAcs?.senior_burden_pct ?? null;

  // County-level burden distribution histogram for this state.
  const burdenDist = getBurdenDistribution(
    state.abbr.toUpperCase(),
    counties.map((c) => c.slug),
  );
  const burdenHigh =
    burdenDist.byStatus["extreme-high"] + burdenDist.byStatus["high"];
  const burdenAboveAvg = burdenDist.byStatus["above-avg"];
  const burdenAvg = burdenDist.byStatus["avg"] + burdenDist.byStatus["below-avg"];
  const burdenLow = burdenDist.byStatus["low"];
  const burdenSuppressed = burdenDist.byStatus["suppressed"];
  const countyNameBySlug = new Map(counties.map((c) => [c.slug, c.county_name]));
  const highestCounty = burdenDist.highest
    ? {
        ...burdenDist.highest,
        name: countyNameBySlug.get(burdenDist.highest.slug) ?? burdenDist.highest.slug,
      }
    : null;
  const lowestCounty = burdenDist.lowest
    ? {
        ...burdenDist.lowest,
        name: countyNameBySlug.get(burdenDist.lowest.slug) ?? burdenDist.lowest.slug,
      }
    : null;

  const diffRate = effectiveRate - national.avg_rate;
  const insights = generateStateInsights(state, allStates);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Dataset",
            "name": `${state.state} Property Tax Rates`,
            "description": `Property tax rates, median annual tax, and county-level breakdown for ${state.state}. Effective rate: ${effectiveRate.toFixed(2)}%.`,
            "url": `https://propertytaxpeek.com/state/${slug}`,
            "license": "https://creativecommons.org/publicdomain/zero/1.0/",
            "creator": { "@type": "Organization", "name": "DataPeek Facts", "url": "https://datapeekfacts.com" },
            "dateModified": DB_UPDATED,
            "author": { "@type": "Organization", "name": "DataPeek" },
            "temporalCoverage": "2020/2024",
            "distribution": { "@type": "DataDownload", "encodingFormat": "text/html", "contentUrl": `https://propertytaxpeek.com/state/${slug}/` }
          })
        }}
      />
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: state.state },
        ]}
      />

      <AnswerHero
        title={`${state.state} property tax`}
        subtitle={state.abbr}
        tagline={`${state.state} has a ${effectiveRate.toFixed(
          2
        )}% effective property tax rate \u2014 ${
          diffRate > 0
            ? `${diffRate.toFixed(2)}% above`
            : `${Math.abs(diffRate).toFixed(2)}% below`
        } the US average. Median annual bill: ${fmt(medianTax)} on a ${fmt(
          medianHomeValue
        )} home across ${counties.length} counties.`}
        badges={[
          {
            label:
              diffRate > 0
                ? `${diffRate.toFixed(2)}% above US`
                : `${Math.abs(diffRate).toFixed(2)}% below US`,
            tone: diffRate > 0 ? "amber" : "emerald",
          },
          { label: `${counties.length} counties`, tone: "slate" },
        ]}
        alternatives={neighbors.slice(0, 3).map((n) => ({
          label: n.state,
          href: `/state/${n.slug}/`,
          sublabel: `${n.effective_rate.toFixed(2)}%`,
        }))}
        alternativesLabel="Neighboring states"
      />

      <div className="mb-4">
        <DownloadReport />
      </div>

      <TrustBlock
        sources={[
          {
            name: "US Census ACS",
            url: "https://www.census.gov/programs-surveys/acs/",
          },
          {
            name: "Census S&L Finances",
            url: "https://www.census.gov/programs-surveys/gov-finances.html",
          },
          {
            name: "Tax Foundation",
            url: "https://taxfoundation.org/data/all/state/property-taxes-by-state/",
          },
          {
            name: "Lincoln Institute",
            url: "https://www.lincolninst.edu/research-data/data-toolkits/significant-features-property-tax",
          },
          {
            name: "IRS Publication 530",
            url: "https://www.irs.gov/publications/p530",
          },
        ]}
        updated={`${VINTAGE_LABEL}, reviewed April 2026`}
      />

      <EditorNote note={`Property tax rates vary significantly across ${state.state}'s ${counties.length} counties. Your actual bill depends on local assessments, exemptions, and special district levies — not just the statewide average.`} />

      {/* Deep-dive cross-links — added as part of Tier S HCU expansion 2026-04-21 */}
      <section className="my-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <a
          href={`/state/${slug}/homestead-exemption/`}
          className="block p-5 bg-emerald-50 border border-emerald-200 rounded-xl hover:border-emerald-400 hover:shadow-sm transition"
        >
          <div className="text-xs text-emerald-700 uppercase tracking-wider font-semibold mb-1">
            Deep Dive · Exemptions
          </div>
          <div className="text-base font-bold text-slate-900 mb-1">
            {state.state} homestead exemption 2026 →
          </div>
          <div className="text-sm text-slate-600">
            Dollar amounts, senior / disabled veteran relief, assessment caps,
            and step-by-step filing instructions.
          </div>
        </a>
        <a
          href={`/state/${slug}/senior-exemption/`}
          className="block p-5 bg-gradient-to-br from-amber-50 to-rose-50 border border-amber-200 rounded-xl hover:border-amber-400 hover:shadow-sm transition"
        >
          <div className="text-xs text-amber-700 uppercase tracking-wider font-semibold mb-1">
            Deep Dive · Age 65+
          </div>
          <div className="text-base font-bold text-slate-900 mb-1">
            {state.state} senior property tax exemption →
          </div>
          <div className="text-sm text-slate-600">
            Age thresholds, income caps, assessment freezes, deferral programs,
            and tax credits for homeowners 65 and older.
          </div>
        </a>
        <a
          href="/calculator/"
          className="block p-5 bg-indigo-50 border border-indigo-200 rounded-xl hover:border-indigo-400 hover:shadow-sm transition"
        >
          <div className="text-xs text-indigo-700 uppercase tracking-wider font-semibold mb-1">
            Tool · Calculator
          </div>
          <div className="text-base font-bold text-slate-900 mb-1">
            Run your {state.state} home value →
          </div>
          <div className="text-sm text-slate-600">
            Plug in your exact home value at the {effectiveRate.toFixed(2)}%
            effective rate to see the annual bill.
          </div>
        </a>
      </section>

      <section className="my-8 p-6 bg-gradient-to-r from-blue-50 to-slate-50 rounded-xl border border-blue-100">
        <h2 className="text-lg font-bold text-slate-900 mb-3">Key Insights for {state.state}</h2>
        <ul className="space-y-2">
          {insights.map((insight, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-700">
              <span className="text-blue-500 font-bold shrink-0">&bull;</span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* County burden distribution — ACS 2024 5-Year MOE-filtered */}
      {burdenDist.totalCounties > 0 && (
        <section className="my-8">
          <h2 className="text-lg font-bold text-slate-900 mb-2">
            County burden distribution across {state.state}
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            Across {burdenDist.totalCounties} counties in {state.state}, here is
            how the {VINTAGE_SHORT} effective property tax rates sort.
            {burdenSuppressed > 0
              ? ` ${burdenSuppressed} ${
                  burdenSuppressed === 1 ? "county had its estimate" : "counties had estimates"
                } too wide to publish a county-level rate; ${
                  burdenSuppressed === 1 ? "its page shows" : "their pages show"
                } state-level context only.`
              : ""}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
              <div className="text-xs uppercase tracking-wider text-rose-700 font-semibold">
                High burden
              </div>
              <div className="text-xs text-rose-700/80 mb-1">≥ 1.5%</div>
              <div className="text-2xl font-bold text-rose-900">
                {burdenHigh}
              </div>
              <div className="text-xs text-rose-800/80">counties</div>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="text-xs uppercase tracking-wider text-amber-700 font-semibold">
                Above average
              </div>
              <div className="text-xs text-amber-700/80 mb-1">1.2 – 1.5%</div>
              <div className="text-2xl font-bold text-amber-900">
                {burdenAboveAvg}
              </div>
              <div className="text-xs text-amber-800/80">counties</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-wider text-slate-600 font-semibold">
                Average
              </div>
              <div className="text-xs text-slate-600/80 mb-1">0.6 – 1.2%</div>
              <div className="text-2xl font-bold text-slate-900">
                {burdenAvg}
              </div>
              <div className="text-xs text-slate-700/80">counties</div>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="text-xs uppercase tracking-wider text-emerald-700 font-semibold">
                Low burden
              </div>
              <div className="text-xs text-emerald-700/80 mb-1">&lt; 0.6%</div>
              <div className="text-2xl font-bold text-emerald-900">
                {burdenLow}
              </div>
              <div className="text-xs text-emerald-800/80">counties</div>
            </div>
          </div>
          {(highestCounty || lowestCounty) && (
            <p className="text-sm text-slate-600 mt-4">
              {highestCounty && (
                <>
                  Highest:{" "}
                  <a
                    href={`/county/${highestCounty.slug}/`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {highestCounty.name}
                  </a>{" "}
                  at {highestCounty.rate.toFixed(2)}%
                </>
              )}
              {highestCounty && lowestCounty && " · "}
              {lowestCounty && (
                <>
                  Lowest:{" "}
                  <a
                    href={`/county/${lowestCounty.slug}/`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {lowestCounty.name}
                  </a>{" "}
                  at {lowestCounty.rate.toFixed(2)}%
                </>
              )}
              {burdenDist.median != null && (
                <>
                  {" "}· Median: <strong>{burdenDist.median.toFixed(2)}%</strong>
                </>
              )}
            </p>
          )}
        </section>
      )}

      {/* Senior tax context — ACS B19049_005E (median household income age 65+) */}
      {seniorIncome != null && seniorBurdenPct != null && (
        <section className="my-8 rounded-xl border border-amber-200 bg-amber-50/60 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-2">
            Senior homeowner context for {state.state}
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            The median household income for residents age 65 and older in{" "}
            {state.state} is {fmt(seniorIncome)}. At the state's effective property
            tax rate of {effectiveRate.toFixed(2)}%, the median annual bill of{" "}
            {fmt(medianTax)} represents about{" "}
            <strong>{seniorBurdenPct.toFixed(1)}%</strong> of senior household
            income.
            {seniorBurdenPct >= 10
              ? " That is a meaningful share — confirm whether your county's senior or homestead exemption can reduce the assessed value before budgeting at the headline rate."
              : seniorBurdenPct >= 5
              ? " That is a moderate share for a fixed-income household — a senior or homestead exemption can still trim it noticeably in many counties."
              : " That is a manageable share for most fixed-income households, though your specific county may run higher."}
          </p>
          <p className="text-xs text-slate-500 mt-3">
            Senior income figure: ACS Table B19049, age-of-householder 65+, median
            household income, {VINTAGE_SHORT}.
          </p>
        </section>
      )}

      <AdSlot id="1234567890" />

      <TaxRateChart stateRate={effectiveRate} nationalRate={national.avg_rate} stateName={state.state} />

      {/* State Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Effective Rate
          </div>
          <div className="text-2xl font-bold text-blue-800">
            {effectiveRate.toFixed(2)}%
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Median Annual Tax
          </div>
          <div className="text-2xl font-bold text-blue-800">
            {fmt(medianTax)}
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Median Home Value
          </div>
          <div className="text-2xl font-bold text-blue-800">
            {fmt(medianHomeValue)}
          </div>
        </div>
      </div>

      {/* County breakdown */}
      {counties.length > 0 && (
        <>
          <h2 className="text-2xl font-bold text-slate-800 mt-8 mb-4">
            {state.state} Counties Property Tax Rates
          </h2>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-4 py-2 font-medium text-slate-600">County</th>
                  <th className="px-4 py-2 font-medium text-slate-600 text-right">Rate</th>
                  <th className="px-4 py-2 font-medium text-slate-600 text-right">Median Tax</th>
                  <th className="px-4 py-2 font-medium text-slate-600 text-right hidden sm:table-cell">
                    Median Home Value
                  </th>
                  <th className="px-4 py-2 font-medium text-slate-600 text-right hidden md:table-cell">
                    Senior Median Income
                  </th>
                  <th className="px-4 py-2 font-medium text-slate-600 text-right hidden md:table-cell">
                    Population
                  </th>
                </tr>
              </thead>
              <tbody>
                {counties.map((c) => {
                  const acs = getCountyAcs(c.slug);
                  const kept = acs?.status === "kept";
                  const rate = kept ? acs.effective_rate : null;
                  const tax = kept ? acs.median_real_estate_taxes : null;
                  const home = kept ? acs.median_home_value : null;
                  const seniorInc = kept ? acs.median_income_age65_plus : null;
                  return (
                    <tr key={c.slug} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-2">
                        <a href={`/county/${c.slug}/`} className="text-blue-600 hover:underline">
                          {c.county_name}
                        </a>
                        {!kept && (
                          <span className="ml-2 text-xs text-amber-700">
                            (estimate held)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right font-medium">
                        {rate != null ? `${rate.toFixed(2)}%` : "—"}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {tax != null ? fmt(tax) : "—"}
                      </td>
                      <td className="px-4 py-2 text-right hidden sm:table-cell">
                        {home != null ? fmt(home) : "—"}
                      </td>
                      <td className="px-4 py-2 text-right hidden md:table-cell">
                        {seniorInc != null ? fmt(seniorInc) : "—"}
                      </td>
                      <td className="px-4 py-2 text-right hidden md:table-cell">
                        {c.population.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <AdSlot id="2345678901" />

      <PropertyTaxCalculator
        defaultState={state.abbr}
        defaultRate={effectiveRate}
        states={allStates.map((s) => ({
          abbr: s.abbr,
          state: s.state,
          avg_rate: s.avg_rate,
        }))}
      />

      <DidYouKnow fact={`In ${state.state}, the median homeowner pays ${fmt(medianTax)} per year in property taxes — that's about ${fmt(Math.round(medianTax / 12))} per month added to housing costs.`} />

      {/* Why this matters — US homeowner context */}
      <section className="mb-8 mt-10" data-upgrade="why-it-matters">
        <h2 className="text-xl font-bold mb-3">
          Why {state.state} property tax matters
        </h2>
        <div className="rounded-lg border border-slate-200 bg-white p-5 text-slate-700 leading-relaxed space-y-3">
          {(() => {
            const rate = effectiveRate;
            const annual = medianTax;
            const monthly = Math.round(annual / 12);
            const highTax = rate >= 1.5;
            const midTax = rate >= 0.8 && rate < 1.5;

            const primary = highTax
              ? `${state.state} is among the higher-tax states for property owners. At an effective rate of ${rate.toFixed(
                  2
                )}%, the median bill here (${fmt(
                  annual
                )}/year, about ${fmt(
                  monthly
                )}/month) is more than many mortgage escrow accounts budget by default. If you are moving from a low-tax state, expect a real monthly cost shock.`
              : midTax
              ? `${state.state} sits in the mid-range of US property tax. The ${rate.toFixed(
                  2
                )}% effective rate yields a median annual bill of ${fmt(
                  annual
                )} \u2014 roughly ${fmt(
                  monthly
                )}/month for the typical homeowner. Predictable, neither a bargain nor a burden.`
              : `${state.state} is on the low-tax side for US property owners. The ${rate.toFixed(
                  2
                )}% effective rate keeps the median annual bill to around ${fmt(
                  annual
                )} (${fmt(
                  monthly
                )}/month). Low rates often come paired with other revenue models \u2014 check sales and income tax for the full picture.`;

            const countyNote = `Rates vary significantly across ${state.state}'s ${counties.length} counties. The state average is a starting point, not a prediction for your specific address \u2014 always check county-level data before making a decision.`;

            const saltNote = `State and local property taxes are deductible on your federal return as part of the SALT deduction, capped at $10,000 per return (IRS Publication 530). In higher-tax ${state.state} counties, most homeowners hit this cap quickly.`;

            const exemptionNote = `Every state offers some form of homestead exemption for primary residences. ${state.state} homeowners should confirm eligibility with their county assessor \u2014 the application often needs to be filed once and stays active.`;

            return (
              <>
                <p>{primary}</p>
                <p>{countyNote}</p>
                <p>{exemptionNote}</p>
                <p className="text-sm text-slate-500">{saltNote}</p>
              </>
            );
          })()}
        </div>
      </section>

      {/* DecisionNext — 3 opinionated next steps */}
      <DecisionNext
        cards={[
          {
            title: `Drill into ${state.state} counties`,
            blurb: `County rates vary a lot within a state. Pick your county to see the actual bill, not just the state average.`,
            href: counties[0] ? `/county/${counties[0].slug}/` : `/state/${slug}/`,
            cta: `See county breakdown`,
            tone: "indigo" as const,
          },
          {
            title: `Run your home value`,
            blurb: `Plug in your actual home value at the ${state.state} effective rate to get your expected annual bill.`,
            href: `/calculator/`,
            cta: `Open calculator`,
            tone: "emerald" as const,
          },
          ...(neighbors.length > 0
            ? [
                {
                  title: `vs ${neighbors[0].state}`,
                  blurb: `See how ${state.state} stacks up against ${neighbors[0].state} \u2014 useful if you're weighing a cross-border move.`,
                  href: `/state/${neighbors[0].slug}/`,
                  cta: `Compare states`,
                  tone: "amber" as const,
                },
              ]
            : [
                {
                  title: `Federal SALT cap`,
                  blurb: `Learn how the $10,000 SALT deduction limit interacts with your ${state.state} property tax bill.`,
                  href: `https://www.irs.gov/publications/p530`,
                  cta: `Read IRS Pub 530`,
                  tone: "amber" as const,
                },
              ]),
        ].slice(0, 3)}
      />

      {/* Neighboring states comparison */}
      {neighbors.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            How {state.state} Compares to Neighboring States
          </h2>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-4 py-2 font-medium text-slate-600">State</th>
                  <th className="px-4 py-2 font-medium text-slate-600 text-right">Rate</th>
                  <th className="px-4 py-2 font-medium text-slate-600 text-right">Median Tax</th>
                  <th className="px-4 py-2 font-medium text-slate-600 text-right">Difference</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-100 bg-blue-50">
                  <td className="px-4 py-2 font-medium">{state.state}</td>
                  <td className="px-4 py-2 text-right font-medium">{effectiveRate.toFixed(2)}%</td>
                  <td className="px-4 py-2 text-right">{fmt(medianTax)}</td>
                  <td className="px-4 py-2 text-right">-</td>
                </tr>
                {neighbors.map((n) => {
                  const diff = n.effective_rate - effectiveRate;
                  return (
                    <tr key={n.slug} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-2">
                        <a href={`/state/${n.slug}/`} className="text-blue-600 hover:underline">
                          {n.state}
                        </a>
                      </td>
                      <td className="px-4 py-2 text-right font-medium">
                        {n.effective_rate.toFixed(2)}%
                      </td>
                      <td className="px-4 py-2 text-right">{fmt(n.median_tax)}</td>
                      <td className={`px-4 py-2 text-right font-medium ${diff > 0 ? "text-red-600" : "text-emerald-600"}`}>
                        {diff > 0 ? "+" : ""}{diff.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Visual rate comparison */}
          <div className="mt-4">
            <ComparisonBar
              bars={[
                { label: state.state, value: effectiveRate },
                ...neighbors.map((n) => ({ label: n.state, value: n.effective_rate })),
              ]}
              format={(v) => v.toFixed(2) + "%"}
              referenceValue={effectiveRate}
            />
          </div>
        </section>
      )}

      <AdSlot id="3456789012" />

      {/* SEO content */}
      <section className="prose prose-slate max-w-none mt-12">
        <h2>{state.state} Property Tax Overview</h2>
        <p>
          The effective property tax rate in {state.state} is{" "}
          {effectiveRate.toFixed(2)}%, meaning a homeowner with a property
          valued at {fmt(medianHomeValue)} would pay approximately{" "}
          {fmt(medianTax)} annually. Understanding your{" "}
          <strong>property tax deduction</strong> eligibility can help offset this
          cost on your federal return.
        </p>
        <p>
          {state.state} homeowners may qualify for a{" "}
          <strong>homestead exemption</strong> that reduces the taxable value of
          their primary residence. If your property assessment seems too high,
          consider a <strong>tax assessment appeal</strong> to potentially lower
          your bill.
        </p>
        <p>
          For more financial context, explore{" "}
          <a href="https://salarybycity.com">salary data</a>,{" "}
          <a href="https://costbycity.com">cost of living</a>, and{" "}
          <a href="https://zippeek.com">ZIP code details</a> for {state.state}.
        </p>
      </section>

      {/* Related Data Resources */}
      <section className="mt-8 p-4 bg-slate-50 rounded-lg">
        <h3 className="text-sm font-semibold text-slate-500 mb-2">Related Data Resources</h3>
        <div className="flex flex-wrap gap-3 text-sm">
          <a href="https://fairrentwize.com" className="text-blue-600 hover:underline">FairRentWize - Fair market rents &rarr;</a>
          <a href="https://costbycity.com" className="text-blue-600 hover:underline">CostByCity - Cost of living &rarr;</a>
          <a href="https://zippeek.com" className="text-blue-600 hover:underline">ZipPeek - ZIP demographics &rarr;</a>
        </div>
      </section>

      <div className="flex items-center gap-4 mt-4">
        <CiteButton title={`${state.state} Property Tax Rates`} url={`https://propertytaxpeek.com/state/${slug}`} source="PropertyTaxPeek" />
      </div>

      <DataFeedback />

      <FeedbackButton pageId={slug} />

      <DataSourceBadge sources={[
        { name: "US Census ACS 2024 5-Year", url: "https://www.census.gov/programs-surveys/acs/" },
        { name: "Census S&L Finances", url: "https://www.census.gov/programs-surveys/gov-finances.html" },
        { name: "Tax Foundation", url: "https://taxfoundation.org/data/all/state/property-taxes-by-state/" },
        { name: "Lincoln Institute", url: "https://www.lincolninst.edu/research-data/data-toolkits/significant-features-property-tax" },
        { name: "IRS Publication 530", url: "https://www.irs.gov/publications/p530" },
      ]} />

      <CrossSiteLinks current="PropertyTaxPeek" />


      <StateRich slug={slug} state={state} />

      <AuthorBox />
    </>
  );
}
