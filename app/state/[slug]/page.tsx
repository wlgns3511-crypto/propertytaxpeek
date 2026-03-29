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
  return {
    title: `${state.state} Property Tax Rates - ${state.effective_rate.toFixed(2)}% Average Rate`,
    description: `${state.state} has an effective property tax rate of ${state.effective_rate.toFixed(2)}%. Median annual property tax is ${fmt(state.median_tax)} on a median home value of ${fmt(state.median_home_value)}. See county-level breakdown.`,
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

  const diffRate = state.effective_rate - national.avg_rate;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Dataset",
            "name": `${state.state} Property Tax Rates`,
            "description": `Property tax rates, median annual tax, and county-level breakdown for ${state.state}. Effective rate: ${state.effective_rate.toFixed(2)}%.`,
            "url": `https://propertytaxpeek.com/state/${slug}`,
            "license": "https://creativecommons.org/publicdomain/zero/1.0/",
            "creator": { "@type": "Organization", "name": "DataPeek Facts", "url": "https://datapeekfacts.com" },
            "temporalCoverage": "2024/2026",
            "distribution": { "@type": "DataDownload", "encodingFormat": "text/html" }
          })
        }}
      />
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: state.state },
        ]}
      />

      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        {state.state} Property Tax Rates
      </h1>
      <p className="text-slate-600 mb-2">
        {state.state} ({state.abbr}) has an effective property tax rate of{" "}
        <strong>{state.effective_rate.toFixed(2)}%</strong>, which is{" "}
        {diffRate > 0 ? (
          <span className="text-red-600 font-medium">
            {diffRate.toFixed(2)}% above
          </span>
        ) : (
          <span className="text-emerald-600 font-medium">
            {Math.abs(diffRate).toFixed(2)}% below
          </span>
        )}{" "}
        the national average of {national.avg_rate.toFixed(2)}%.
      </p>
      <FreshnessTag />

      <AdSlot id="1234567890" />

      <TaxRateChart stateRate={state.effective_rate} nationalRate={national.avg_rate} stateName={state.state} />

      {/* State Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Effective Rate
          </div>
          <div className="text-2xl font-bold text-blue-800">
            {state.effective_rate.toFixed(2)}%
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Median Annual Tax
          </div>
          <div className="text-2xl font-bold text-blue-800">
            {fmt(state.median_tax)}
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Median Home Value
          </div>
          <div className="text-2xl font-bold text-blue-800">
            {fmt(state.median_home_value)}
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
                    Population
                  </th>
                </tr>
              </thead>
              <tbody>
                {counties.map((c) => (
                  <tr key={c.slug} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2">
                      <a href={`/county/${c.slug}/`} className="text-blue-600 hover:underline">
                        {c.county_name}
                      </a>
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      {c.effective_rate.toFixed(2)}%
                    </td>
                    <td className="px-4 py-2 text-right">{fmt(c.median_tax)}</td>
                    <td className="px-4 py-2 text-right hidden sm:table-cell">
                      {fmt(c.median_home_value)}
                    </td>
                    <td className="px-4 py-2 text-right hidden md:table-cell">
                      {c.population.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <AdSlot id="2345678901" />

      <PropertyTaxCalculator
        defaultState={state.abbr}
        defaultRate={state.effective_rate}
        states={allStates.map((s) => ({
          abbr: s.abbr,
          state: s.state,
          avg_rate: s.avg_rate,
        }))}
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
                  <td className="px-4 py-2 text-right font-medium">{state.effective_rate.toFixed(2)}%</td>
                  <td className="px-4 py-2 text-right">{fmt(state.median_tax)}</td>
                  <td className="px-4 py-2 text-right">-</td>
                </tr>
                {neighbors.map((n) => {
                  const diff = n.effective_rate - state.effective_rate;
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
                { label: state.state, value: state.effective_rate },
                ...neighbors.map((n) => ({ label: n.state, value: n.effective_rate })),
              ]}
              format={(v) => v.toFixed(2) + "%"}
              referenceValue={state.effective_rate}
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
          {state.effective_rate.toFixed(2)}%, meaning a homeowner with a property
          valued at {fmt(state.median_home_value)} would pay approximately{" "}
          {fmt(state.median_tax)} annually. Understanding your{" "}
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
    </>
  );
}
