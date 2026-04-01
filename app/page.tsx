import type { Metadata } from "next";
import { getAllStates, getHighestTaxStates, getLowestTaxStates, getNationalAverage } from "@/lib/db";
import { getAllPosts } from "@/lib/blog";
import { PropertyTaxCalculator } from "@/components/PropertyTaxCalculator";
import { AdSlot } from "@/components/AdSlot";
import { FreshnessTag } from "@/components/FreshnessTag";

export const metadata: Metadata = {
  title: "US Property Tax Rates by State & County (2024 Data)",
  description:
    "Compare property tax rates across all 50 US states. See median property taxes, effective rates, and home values. Free property tax calculator included.",
  alternates: { canonical: "/" },
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

  const latestPosts = getAllPosts().slice(0, 3);
  const calcStates = states.map((s) => ({
    abbr: s.abbr,
    state: s.state,
    avg_rate: s.avg_rate,
  }));

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
            },
            temporalCoverage: "2024",
            spatialCoverage: {
              "@type": "Place",
              name: "United States",
            },
          }),
        }}
      />

      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        US Property Tax Rates by State &amp; County
      </h1>
      <p className="text-slate-600 mb-4">
        Compare property tax rates across all 50 states. The national average
        effective property tax rate is{" "}
        <strong>{national.avg_rate.toFixed(2)}%</strong>, with a median annual
        property tax of <strong>{fmt(national.avg_median_tax)}</strong>.
      </p>
      <FreshnessTag />

      <AdSlot id="7890123456" />

      {/* National Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            National Avg Rate
          </div>
          <div className="text-2xl font-bold text-blue-800">
            {national.avg_rate.toFixed(2)}%
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Avg Median Tax
          </div>
          <div className="text-2xl font-bold text-blue-800">
            {fmt(national.avg_median_tax)}
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Avg Home Value
          </div>
          <div className="text-2xl font-bold text-blue-800">
            {fmt(national.avg_home_value)}
          </div>
        </div>
      </div>

      {/* Highest & Lowest */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            Highest Property Tax States
          </h2>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-4 py-2 font-medium text-slate-600">State</th>
                  <th className="px-4 py-2 font-medium text-slate-600 text-right">Rate</th>
                  <th className="px-4 py-2 font-medium text-slate-600 text-right">Median Tax</th>
                </tr>
              </thead>
              <tbody>
                {highest.map((s) => (
                  <tr key={s.slug} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2">
                      <a href={`/state/${s.slug}/`} className="text-blue-600 hover:underline">
                        {s.state}
                      </a>
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-red-600">
                      {s.effective_rate.toFixed(2)}%
                    </td>
                    <td className="px-4 py-2 text-right">{fmt(s.median_tax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            Lowest Property Tax States
          </h2>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-4 py-2 font-medium text-slate-600">State</th>
                  <th className="px-4 py-2 font-medium text-slate-600 text-right">Rate</th>
                  <th className="px-4 py-2 font-medium text-slate-600 text-right">Median Tax</th>
                </tr>
              </thead>
              <tbody>
                {lowest.map((s) => (
                  <tr key={s.slug} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2">
                      <a href={`/state/${s.slug}/`} className="text-blue-600 hover:underline">
                        {s.state}
                      </a>
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-emerald-600">
                      {s.effective_rate.toFixed(2)}%
                    </td>
                    <td className="px-4 py-2 text-right">{fmt(s.median_tax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AdSlot id="8901234567" />

      {/* All States */}
      <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-4">
        All 50 States Property Tax Rates
      </h2>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left">
              <th className="px-4 py-2 font-medium text-slate-600">State</th>
              <th className="px-4 py-2 font-medium text-slate-600 text-right">Effective Rate</th>
              <th className="px-4 py-2 font-medium text-slate-600 text-right">Median Tax</th>
              <th className="px-4 py-2 font-medium text-slate-600 text-right hidden sm:table-cell">
                Median Home Value
              </th>
            </tr>
          </thead>
          <tbody>
            {states.map((s) => (
              <tr key={s.slug} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2">
                  <a href={`/state/${s.slug}/`} className="text-blue-600 hover:underline">
                    {s.state}
                  </a>
                </td>
                <td className="px-4 py-2 text-right font-medium">
                  {s.effective_rate.toFixed(2)}%
                </td>
                <td className="px-4 py-2 text-right">{fmt(s.median_tax)}</td>
                <td className="px-4 py-2 text-right hidden sm:table-cell">
                  {fmt(s.median_home_value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PropertyTaxCalculator states={calcStates} />

      <AdSlot id="9012345678" />

      {/* Latest Guides */}
      <section className="mt-12 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-800">Property Tax Guides</h2>
          <a href="/blog/" className="text-sm text-blue-600 hover:underline">
            All guides →
          </a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {latestPosts.map((post) => (
            <a
              key={post.slug}
              href={`/blog/${post.slug}/`}
              className="block border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
            >
              <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                {post.category}
              </span>
              <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 mt-2 leading-snug">
                {post.title}
              </h3>
              <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                {post.description}
              </p>
              <p className="text-xs text-slate-400 mt-2">{post.readingTime} min read</p>
            </a>
          ))}
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
    </>
  );
}
