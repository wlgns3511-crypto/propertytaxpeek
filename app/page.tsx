import type { Metadata } from "next";
import { getAllStates, getHighestTaxStates, getLowestTaxStates, getNationalAverage, getHighestTaxCounties, getAllCounties } from "@/lib/db";
import { getAllPosts } from "@/lib/blog";
import { PropertyTaxCalculator } from "@/components/PropertyTaxCalculator";
import { AdSlot } from "@/components/AdSlot";
import { FreshnessTag } from "@/components/FreshnessTag";
import { PopularEntities } from "@/components/upgrades/PopularEntities";
import { TrustBlock } from "@/components/upgrades/TrustBlock";
import { AuthorBox } from "@/components/AuthorBox";
import { CountyChoropleth } from "@/components/CountyChoropleth";
import { TRUST_BLOCK_SOURCES, COUNTY_VINTAGE } from "@/lib/authorship";

export const metadata: Metadata = {
  title: "US Property Tax Rates by State & County (2024 Data)",
  description:
    "Compare property tax rates across all 50 US states. See median property taxes, effective rates, and home values. Free property tax calculator included.",
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

function fmt(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export default function HomePage() {
  const states = getAllStates();
  const highest = getHighestTaxStates(10);
  const lowest = getLowestTaxStates(10);
  const national = getNationalAverage();
  const topCounties = getHighestTaxCounties(12);
  const allCounties = getAllCounties();

  const latestPosts = getAllPosts().slice(0, 3);
  const calcStates = states.map((s) => ({
    abbr: s.abbr,
    state: s.state,
    avg_rate: s.avg_rate,
  }));

  const maxHighRate = Math.max(...highest.map((s) => s.effective_rate));
  const maxLowRate = Math.max(...lowest.map((s) => s.effective_rate));
  const maxAllRate = Math.max(...states.map((s) => s.effective_rate));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Dataset",
            name: "US Property Tax Rates by State and County",
            description:
              "Comprehensive property tax rate data for all 50 US states and 500+ counties, including effective rates, median taxes, and home values.",
            url: "https://propertytaxpeek.com",
            license: "https://creativecommons.org/licenses/by/4.0/",
            creator: {
              "@type": "Organization",
              name: "PropertyTaxPeek",
              url: "https://propertytaxpeek.com",
            },
            temporalCoverage: "2024",
            spatialCoverage: {
              "@type": "Place",
              name: "United States",
            },
            distribution: {
              "@type": "DataDownload",
              encodingFormat: "text/html",
              contentUrl: "https://propertytaxpeek.com",
            },
          }),
        }}
      />

      {/* Data-sovereignty strip — replaces generic FreshnessTag-below-H1 pattern */}
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] uppercase tracking-widest text-stone-500">
        <span>Source · Census ACS 2024 + Tax Foundation</span>
        <span className="text-stone-300">|</span>
        <span>Coverage · 50 states · 2,705 counties</span>
        <span className="text-stone-300">|</span>
        <FreshnessTag />
      </div>

      <h1 className="text-3xl font-bold text-stone-900 mb-2 leading-tight">
        US Property Tax Rates — by State &amp; County
      </h1>
      <p className="text-stone-700 mb-6 max-w-2xl">
        National average effective rate is{" "}
        <strong className="text-amber-800 tabular-nums">{national.avg_rate.toFixed(2)}%</strong> on a
        median home of <strong className="tabular-nums">{fmt(national.avg_home_value)}</strong>, producing a median annual bill of{" "}
        <strong className="tabular-nums">{fmt(national.avg_median_tax)}</strong>. Drill down by state or county below, or run the{" "}
        <a href="/appeal-simulator/" className="text-amber-700 underline decoration-amber-300 underline-offset-2 hover:decoration-amber-700">
          Appeal Outcome Simulator
        </a>{" "}
        to estimate your reduction band.
      </p>

      {/* Quick rank preview — surfaces ranking dimension above the choropleth fold */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="bg-red-50/60 border border-red-100 rounded-lg p-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-red-700 mb-2">
            Highest property tax states
          </p>
          <ol className="space-y-1">
            {highest.slice(0, 5).map((s, i) => (
              <li key={s.slug} className="flex items-center justify-between">
                <a href={`/state/${s.slug}/`} className="text-amber-700 hover:underline">
                  <span className="text-stone-400 mr-2 tabular-nums">{i + 1}.</span>
                  {s.state}
                </a>
                <span className="font-medium text-red-600 tabular-nums">
                  {s.effective_rate.toFixed(2)}%
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div className="bg-emerald-50/60 border border-emerald-100 rounded-lg p-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-700 mb-2">
            Lowest property tax states
          </p>
          <ol className="space-y-1">
            {lowest.slice(0, 5).map((s, i) => (
              <li key={s.slug} className="flex items-center justify-between">
                <a href={`/state/${s.slug}/`} className="text-amber-700 hover:underline">
                  <span className="text-stone-400 mr-2 tabular-nums">{i + 1}.</span>
                  {s.state}
                </a>
                <span className="font-medium text-emerald-600 tabular-nums">
                  {s.effective_rate.toFixed(2)}%
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* 4-tile snapshot grid — surfaces 4 dimensions above-the-fold (AdSense reviewer gate) */}
      <section aria-label="National property tax snapshot" className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-amber-800 tabular-nums">{states.length}</div>
          <div className="text-xs text-stone-500 mt-1">States Covered</div>
        </div>
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-amber-800 tabular-nums">{allCounties.length.toLocaleString('en-US')}</div>
          <div className="text-xs text-stone-500 mt-1">Counties Tracked</div>
        </div>
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-amber-800 tabular-nums">{national.avg_rate.toFixed(2)}%</div>
          <div className="text-xs text-stone-500 mt-1">National Avg Rate</div>
        </div>
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-amber-800 tabular-nums">{fmt(national.avg_median_tax)}</div>
          <div className="text-xs text-stone-500 mt-1">Median Annual Tax</div>
        </div>
      </section>

      {/* Trust strip — consolidated source provenance + last refresh (AdSense E-E-A-T) */}
      <TrustBlock
        sources={[...TRUST_BLOCK_SOURCES]}
        updated={COUNTY_VINTAGE}
        label="Data provenance"
      />

      <CountyChoropleth
        counties={allCounties.map((c) => ({
          slug: c.slug,
          county_name: c.county_name,
          state: c.state,
          effective_rate: c.effective_rate,
          median_tax: c.median_tax,
          median_home_value: c.median_home_value,
          population: c.population,
        }))}
        variant="full"
      />

      <PopularEntities
        heading="Most Searched Counties"
        subheading="Counties with the highest property tax rates"
        items={topCounties.map(c => ({
          name: c.county_name,
          href: `/county/${c.slug}/`,
          stat: `${c.effective_rate.toFixed(2)}%`,
        }))}
        viewAllHref="/rankings"
        viewAllLabel="View all rankings →"
      />

      {/* Signature feature CTA — propertytaxpeek-only Appeal Outcome Simulator. */}
      <a
        href="/appeal-simulator/"
        className="block my-8 bg-stone-50 border-l-4 border-amber-700 border-y border-r border-stone-200 rounded-r-lg p-6 hover:bg-stone-100 transition-colors group"
      >
        <div className="flex items-baseline gap-3 mb-2">
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-amber-700 text-stone-50 rounded">
            Signature Tool
          </span>
          <span className="text-xs text-stone-500 italic">Only on propertytaxpeek</span>
        </div>
        <h2 className="text-xl font-bold text-stone-900 mb-1 group-hover:text-amber-800 transition-colors">
          Appeal Outcome Simulator →
        </h2>
        <p className="text-sm text-stone-700 leading-relaxed">
          Enter your county and assessed value. We flag over-assessment, estimate the
          annual savings if your appeal succeeds, and surface your state&apos;s published
          reduction-rate band — about 60 seconds.
        </p>
      </a>

      <PropertyTaxCalculator states={calcStates} />

      <AdSlot id="7890123456" />

      {/* National snapshot strip — asymmetric, no boxed cards */}
      <section className="my-8 border-l-4 border-amber-700 bg-stone-50 pl-5 pr-4 py-5 rounded-r-lg">
        <p className="text-[11px] uppercase tracking-widest text-stone-500 mb-2">
          The national snapshot · FY2024
        </p>
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-stone-900 tabular-nums">{national.avg_rate.toFixed(2)}%</span>
            <span className="text-sm text-stone-600">effective rate (US avg)</span>
          </div>
          <span className="text-stone-300">·</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-stone-900 tabular-nums">{fmt(national.avg_median_tax)}</span>
            <span className="text-sm text-stone-600">median annual tax</span>
          </div>
          <span className="text-stone-300">·</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-stone-900 tabular-nums">{fmt(national.avg_home_value)}</span>
            <span className="text-sm text-stone-600">median home value</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-stone-500">
          Sources: Census ACS 5-Year 2024, county-aggregated effective rates.
        </p>
      </section>

      {/* Highest & Lowest */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
        <div>
          <h2 className="text-xl font-bold text-stone-800 mb-4">
            Highest Property Tax States
          </h2>
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 text-left">
                  <th className="px-4 py-2 font-medium text-stone-600">State</th>
                  <th className="px-4 py-2 font-medium text-stone-600 text-right">Rate</th>
                  <th className="px-4 py-2 font-medium text-stone-600 text-right">Median Tax</th>
                </tr>
              </thead>
              <tbody>
                {highest.map((s) => (
                  <tr key={s.slug} className="border-t border-stone-100 hover:bg-stone-50">
                    <td className="px-4 py-2">
                      <a href={`/state/${s.slug}/`} className="text-amber-700 hover:underline">
                        {s.state}
                      </a>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500" style={{ width: `${Math.min(100, (s.effective_rate / maxHighRate) * 100).toFixed(0)}%` }} />
                        </div>
                        <span className="font-medium text-red-600 tabular-nums w-12 text-right">
                          {s.effective_rate.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmt(s.median_tax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-stone-800 mb-4">
            Lowest Property Tax States
          </h2>
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 text-left">
                  <th className="px-4 py-2 font-medium text-stone-600">State</th>
                  <th className="px-4 py-2 font-medium text-stone-600 text-right">Rate</th>
                  <th className="px-4 py-2 font-medium text-stone-600 text-right">Median Tax</th>
                </tr>
              </thead>
              <tbody>
                {lowest.map((s) => (
                  <tr key={s.slug} className="border-t border-stone-100 hover:bg-stone-50">
                    <td className="px-4 py-2">
                      <a href={`/state/${s.slug}/`} className="text-amber-700 hover:underline">
                        {s.state}
                      </a>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (s.effective_rate / maxLowRate) * 100).toFixed(0)}%` }} />
                        </div>
                        <span className="font-medium text-emerald-600 tabular-nums w-12 text-right">
                          {s.effective_rate.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmt(s.median_tax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AdSlot id="8901234567" />

      {/* All States */}
      <h2 className="text-2xl font-bold text-stone-800 mt-12 mb-4">
        All 50 States Property Tax Rates
      </h2>
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-stone-50 text-left">
              <th className="px-4 py-2 font-medium text-stone-600">State</th>
              <th className="px-4 py-2 font-medium text-stone-600 text-right">Effective Rate</th>
              <th className="px-4 py-2 font-medium text-stone-600 text-right">Median Tax</th>
              <th className="px-4 py-2 font-medium text-stone-600 text-right hidden sm:table-cell">
                Median Home Value
              </th>
            </tr>
          </thead>
          <tbody>
            {states.map((s) => (
              <tr key={s.slug} className="border-t border-stone-100 hover:bg-stone-50">
                <td className="px-4 py-2">
                  <a href={`/state/${s.slug}/`} className="text-amber-700 hover:underline">
                    {s.state}
                  </a>
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="inline-flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-600" style={{ width: `${Math.min(100, (s.effective_rate / maxAllRate) * 100).toFixed(0)}%` }} />
                    </div>
                    <span className="font-medium tabular-nums w-12 text-right">
                      {s.effective_rate.toFixed(2)}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2 text-right tabular-nums">{fmt(s.median_tax)}</td>
                <td className="px-4 py-2 text-right hidden sm:table-cell tabular-nums">
                  {fmt(s.median_home_value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdSlot id="9012345678" />

      {/* Latest Guides */}
      <section className="mt-12 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-stone-800">Property Tax Guides</h2>
          All guides →
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
        </div>
      </section>

      {/* SEO content */}
      <section className="prose prose-slate max-w-none mt-12">
        <h2>Understanding Property Taxes in the United States</h2>
        <p>
          Property taxes are a primary source of revenue for local governments,
          funding schools, infrastructure, and public services. The amount you pay
          depends on your home&apos;s assessed value and your local tax rate. Understanding
          your property tax obligation is essential when considering a{" "}
          <strong>property tax deduction</strong> on your federal income tax return.
        </p>
        <p>
          If you believe your property is over-assessed, you may benefit from a{" "}
          <strong>tax assessment appeal</strong>. Many homeowners save thousands
          by challenging their assessment. Additionally, check if you qualify for a{" "}
          <strong>homestead exemption</strong>, which can significantly reduce your
          taxable value.
        </p>
        <p>
          High property taxes can increase your total housing cost. Consider
          whether you can <strong>refinance to lower payments</strong> or explore
          other cost-saving strategies. For related financial data, check out{" "}
          <a href="https://salarybycity.com">salary data by city</a>,{" "}
          <a href="https://costbycity.com">cost of living comparisons</a>, and{" "}
          <a href="https://zippeek.com">ZIP code information</a>.
        </p>
      </section>

      <AuthorBox vintage={COUNTY_VINTAGE} />
    </>
  );
}
