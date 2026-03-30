import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllCounties,
  getCountyBySlug,
  getCountiesByState,
  getStateByAbbr,
  getNationalAverage,
  getAllStates,
} from "@/lib/db";
import { ComparisonBar } from "@/components/ComparisonBar";
import { PropertyTaxCalculator } from "@/components/PropertyTaxCalculator";
import { AdSlot } from "@/components/AdSlot";
import { Breadcrumb } from "@/components/Breadcrumb";
import { FreshnessTag } from "@/components/FreshnessTag";
import { DataFeedback } from "@/components/DataFeedback";

export const dynamicParams = true;
export const revalidate = 86400;

export function generateStaticParams() {
  return getAllCounties().map((c) => ({ slug: c.slug }));
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
  const county = getCountyBySlug(slug);
  if (!county) return {};
  return {
    title: `${county.county_name}, ${county.state} Property Tax Rate - ${county.effective_rate.toFixed(2)}%`,
    description: `${county.county_name}, ${county.state} has an effective property tax rate of ${county.effective_rate.toFixed(2)}%. Median annual property tax is ${fmt(county.median_tax)} on a median home value of ${fmt(county.median_home_value)}.`,
    alternates: {
      canonical: `/county/${slug}/`,
      languages: { en: `/county/${slug}/`, es: `/es/county/${slug}/`, "x-default": `/county/${slug}/` },
    },
  };
}

export default async function CountyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const county = getCountyBySlug(slug);
  if (!county) notFound();

  const stateData = getStateByAbbr(county.state);
  const national = getNationalAverage();
  const allStates = getAllStates();

  const diffFromState = stateData
    ? county.effective_rate - stateData.effective_rate
    : 0;
  const diffFromNational = county.effective_rate - national.avg_rate;

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          ...(stateData
            ? [{ label: stateData.state, href: `/state/${stateData.slug}/` }]
            : []),
          { label: county.county_name },
        ]}
      />

      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        {county.county_name}, {county.state} Property Tax Rate
      </h1>
      <p className="text-slate-600 mb-2">
        {county.county_name} has an effective property tax rate of{" "}
        <strong>{county.effective_rate.toFixed(2)}%</strong>, which is{" "}
        {diffFromNational > 0 ? (
          <span className="text-red-600 font-medium">
            {diffFromNational.toFixed(2)}% above
          </span>
        ) : (
          <span className="text-emerald-600 font-medium">
            {Math.abs(diffFromNational).toFixed(2)}% below
          </span>
        )}{" "}
        the national average.
      </p>
      <FreshnessTag />

      <AdSlot id="4567890123" />

      {/* County Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-8">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Tax Rate
          </div>
          <div className="text-xl font-bold text-blue-800">
            {county.effective_rate.toFixed(2)}%
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Median Tax
          </div>
          <div className="text-xl font-bold text-blue-800">
            {fmt(county.median_tax)}
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Median Home Value
          </div>
          <div className="text-xl font-bold text-blue-800">
            {fmt(county.median_home_value)}
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Population
          </div>
          <div className="text-xl font-bold text-blue-800">
            {county.population.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Comparison table */}
      <h2 className="text-xl font-bold text-slate-800 mb-4">
        Comparison with State &amp; National Average
      </h2>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left">
              <th className="px-4 py-2 font-medium text-slate-600">Location</th>
              <th className="px-4 py-2 font-medium text-slate-600 text-right">Rate</th>
              <th className="px-4 py-2 font-medium text-slate-600 text-right">Median Tax</th>
              <th className="px-4 py-2 font-medium text-slate-600 text-right">Median Home</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-100 bg-blue-50">
              <td className="px-4 py-2 font-medium">{county.county_name}</td>
              <td className="px-4 py-2 text-right font-medium">
                {county.effective_rate.toFixed(2)}%
              </td>
              <td className="px-4 py-2 text-right">{fmt(county.median_tax)}</td>
              <td className="px-4 py-2 text-right">
                {fmt(county.median_home_value)}
              </td>
            </tr>
            {stateData && (
              <tr className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2">
                  <a
                    href={`/state/${stateData.slug}/`}
                    className="text-blue-600 hover:underline"
                  >
                    {stateData.state} (state avg)
                  </a>
                </td>
                <td className="px-4 py-2 text-right">
                  {stateData.effective_rate.toFixed(2)}%
                </td>
                <td className="px-4 py-2 text-right">
                  {fmt(stateData.median_tax)}
                </td>
                <td className="px-4 py-2 text-right">
                  {fmt(stateData.median_home_value)}
                </td>
              </tr>
            )}
            <tr className="border-t border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-2">National Average</td>
              <td className="px-4 py-2 text-right">
                {national.avg_rate.toFixed(2)}%
              </td>
              <td className="px-4 py-2 text-right">
                {fmt(national.avg_median_tax)}
              </td>
              <td className="px-4 py-2 text-right">
                {fmt(national.avg_home_value)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Visual comparison bars */}
      <div className="space-y-4 mb-8">
        <div>
          <h3 className="text-sm font-medium text-slate-600 mb-2">Effective Tax Rate</h3>
          <ComparisonBar
            bars={[
              { label: county.county_name, value: county.effective_rate },
              ...(stateData ? [{ label: `${stateData.state} avg`, value: stateData.effective_rate }] : []),
              { label: "National avg", value: national.avg_rate },
            ]}
            format={(v) => v.toFixed(2) + "%"}
            referenceValue={national.avg_rate}
          />
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-600 mb-2">Median Annual Tax</h3>
          <ComparisonBar
            bars={[
              { label: county.county_name, value: county.median_tax },
              ...(stateData ? [{ label: `${stateData.state} avg`, value: stateData.median_tax }] : []),
              { label: "National avg", value: national.avg_median_tax },
            ]}
            format={fmt}
            referenceValue={national.avg_median_tax}
          />
        </div>
      </div>

      <AdSlot id="5678901234" />

      <PropertyTaxCalculator
        defaultState={county.state}
        defaultRate={county.effective_rate}
        states={allStates.map((s) => ({
          abbr: s.abbr,
          state: s.state,
          avg_rate: s.avg_rate,
        }))}
      />

      {/* SEO content */}
      <section className="prose prose-slate max-w-none mt-12">
        <h2>
          {county.county_name} Property Tax Information
        </h2>
        <p>
          Property owners in {county.county_name}, {county.state} pay a median
          annual property tax of {fmt(county.median_tax)}. The effective tax rate
          of {county.effective_rate.toFixed(2)}% is{" "}
          {diffFromState > 0 ? "higher" : "lower"} than the{" "}
          {stateData?.state || county.state} state average
          {stateData ? ` of ${stateData.effective_rate.toFixed(2)}%` : ""}.
        </p>
        <p>
          If your property assessment seems high, consider{" "}
          <strong>property tax appeal services</strong> to review your valuation.
          Many homeowners also benefit from <strong>homestead exemption</strong>{" "}
          programs that reduce the taxable value of their primary residence.
        </p>
        <p>
          To understand total housing costs, factor in{" "}
          <strong>homeowners insurance quotes</strong> and current{" "}
          <strong>mortgage refinancing rates</strong>. See related data at{" "}
          <a href="https://salarybycity.com">SalaryByCity</a> and{" "}
          <a href="https://costbycity.com">CostByCity</a>.
        </p>
      </section>

      {/* Compare with other counties — internal links for crawling */}
      {(() => {
        const sameState = getCountiesByState(county.state)
          .filter((c) => c.slug !== county.slug)
          .slice(0, 8);
        const topCounties = getAllCounties()
          .filter((c) => c.state !== county.state)
          .slice(0, 8);
        return (
          <section className="mt-12 mb-8">
            <h2 className="text-xl font-bold mb-4">
              Compare {county.county_name} Property Taxes
            </h2>
            {sameState.length > 0 && (
              <>
                <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">
                  vs Other {county.state} Counties
                </h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {sameState.map((c) => (
                    <a
                      key={c.slug}
                      href={`/county-compare/${county.slug}-vs-${c.slug}/`}
                      className="text-sm px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-blue-700 rounded-full"
                    >
                      vs {c.county_name}
                    </a>
                  ))}
                </div>
              </>
            )}
            <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">
              vs Popular Counties Nationwide
            </h3>
            <div className="flex flex-wrap gap-2">
              {topCounties.map((c) => (
                <a
                  key={c.slug}
                  href={`/county-compare/${county.slug}-vs-${c.slug}/`}
                  className="text-sm px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-blue-700 rounded-full"
                >
                  vs {c.county_name}, {c.state}
                </a>
              ))}
            </div>
          </section>
        );
      })()}

      <DataFeedback />
    </>
  );
}
