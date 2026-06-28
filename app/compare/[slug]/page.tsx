import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAllStates, getStateBySlug, getNationalAverage } from "@/lib/db";
import { AdSlot } from "@/components/AdSlot";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ComparisonBar } from "@/components/ComparisonBar";
import { FreshnessTag } from "@/components/FreshnessTag";
import { PropertyTaxCalculator } from "@/components/PropertyTaxCalculator";
import { DataFeedback } from "@/components/DataFeedback";
import { CompareRich } from '@/components/compare/CompareRich';

const STATIC_COMPARISON_SLUGS = (() => {
  const allStates = getAllStates().map(s => s.slug).sort();
  const slugs: string[] = [];
  const CAP = 100;
  for (let i = 0; i < allStates.length && slugs.length < CAP; i++) {
    for (let j = i + 1; j < allStates.length && slugs.length < CAP; j++) {
      slugs.push(`${allStates[i]}-vs-${allStates[j]}`);
    }
  }
  return slugs;
})();
const STATIC_COMPARISON_SET = new Set(STATIC_COMPARISON_SLUGS);

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams() {
  return STATIC_COMPARISON_SLUGS.flatMap((slug) => {
    const parsed = parseComparisonSlug(slug);
    if (!parsed) return [{ slug }];
    const reverse = `${parsed.slugB}-vs-${parsed.slugA}`;
    return reverse === slug ? [{ slug }] : [{ slug }, { slug: reverse }];
  });
}

function parseComparisonSlug(slug: string): { slugA: string; slugB: string } | null {
  const parts = slug.split("-vs-");
  if (parts.length !== 2) return null;
  return { slugA: parts[0], slugB: parts[1] };
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
  const parsed = parseComparisonSlug(slug);
  if (!parsed) return {};
  const canonical = [parsed.slugA, parsed.slugB].sort().join("-vs-");
  if (!STATIC_COMPARISON_SET.has(canonical)) return {};

  const stateA = getStateBySlug(parsed.slugA);
  const stateB = getStateBySlug(parsed.slugB);
  if (!stateA || !stateB) return {};

  const higher = stateA.effective_rate > stateB.effective_rate ? stateA : stateB;
  const lower = stateA.effective_rate > stateB.effective_rate ? stateB : stateA;
  const diff = Math.abs(stateA.effective_rate - stateB.effective_rate).toFixed(2);

  return {
    title: `${stateA.state} vs ${stateB.state} Property Tax Comparison`,
    description: `Compare property taxes: ${stateA.state} (${stateA.effective_rate.toFixed(2)}%) vs ${stateB.state} (${stateB.effective_rate.toFixed(2)}%). ${higher.state} has ${diff}% higher effective property tax rate than ${lower.state}.`,
    alternates: { canonical: `/compare/${canonical}/` },
    openGraph: { url: `/compare/${canonical}/` },
  };
}

export default async function ComparisonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const parsed = parseComparisonSlug(slug);
  if (!parsed) notFound();
  const canonical = [parsed.slugA, parsed.slugB].sort().join("-vs-");
  if (canonical !== slug) redirect(`/compare/${canonical}/`);
  if (!STATIC_COMPARISON_SET.has(canonical)) notFound();

  const stateA = getStateBySlug(parsed.slugA);
  const stateB = getStateBySlug(parsed.slugB);
  if (!stateA || !stateB) notFound();

  const national = getNationalAverage();
  const allStates = getAllStates();

  const diff = stateA.effective_rate - stateB.effective_rate;
  const higher = diff > 0 ? stateA : stateB;
  const lower = diff > 0 ? stateB : stateA;
  const absDiff = Math.abs(diff);
  const taxOn350kA = 350000 * (stateA.effective_rate / 100);
  const taxOn350kB = 350000 * (stateB.effective_rate / 100);
  const annualSavings = Math.abs(taxOn350kA - taxOn350kB);

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Compare", href: "/compare/" },
          { label: `${stateA.state} vs ${stateB.state}` },
        ]}
      />

      <h1 className="text-3xl font-bold text-stone-900 mb-2">
        {stateA.state} vs {stateB.state} Property Tax Comparison
      </h1>
      <p className="text-stone-600 mb-2">
        {higher.state} has a{" "}
        <span className="text-red-600 font-medium">{absDiff.toFixed(2)}% higher</span>{" "}
        effective property tax rate than {lower.state}. On a $350,000 home, you would
        pay <strong>{fmt(annualSavings)}/year more</strong> in {higher.state}.
      </p>
      <FreshnessTag />

      <AdSlot id="6789012345" />

      {/* Side-by-side comparison cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-8">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-amber-900 mb-4">
            <a href={`/state/${stateA.slug}/`} className="hover:underline">
              {stateA.state}
            </a>
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-stone-600">Tax Rate</span>
              <span className="font-bold text-amber-900">{stateA.effective_rate.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-600">Median Tax</span>
              <span className="font-bold">{fmt(stateA.median_tax)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-600">Median Home Value</span>
              <span className="font-bold">{fmt(stateA.median_home_value)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-600">Tax on $350K Home</span>
              <span className="font-bold">{fmt(taxOn350kA)}</span>
            </div>
          </div>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-indigo-900 mb-4">
            <a href={`/state/${stateB.slug}/`} className="hover:underline">
              {stateB.state}
            </a>
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-stone-600">Tax Rate</span>
              <span className="font-bold text-indigo-800">{stateB.effective_rate.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-600">Median Tax</span>
              <span className="font-bold">{fmt(stateB.median_tax)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-600">Median Home Value</span>
              <span className="font-bold">{fmt(stateB.median_home_value)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-600">Tax on $350K Home</span>
              <span className="font-bold">{fmt(taxOn350kB)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed comparison table */}
      <h2 className="text-xl font-bold text-stone-800 mb-4">
        Detailed Comparison
      </h2>
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-stone-50 text-left">
              <th className="px-4 py-3 font-medium text-stone-600">Metric</th>
              <th className="px-4 py-3 font-medium text-amber-800 text-right">
                {stateA.state}
              </th>
              <th className="px-4 py-3 font-medium text-indigo-700 text-right">
                {stateB.state}
              </th>
              <th className="px-4 py-3 font-medium text-stone-600 text-right">
                Difference
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-stone-100">
              <td className="px-4 py-3 font-medium">Effective Tax Rate</td>
              <td className="px-4 py-3 text-right">{stateA.effective_rate.toFixed(2)}%</td>
              <td className="px-4 py-3 text-right">{stateB.effective_rate.toFixed(2)}%</td>
              <td className={`px-4 py-3 text-right font-medium ${diff > 0 ? "text-red-600" : "text-emerald-600"}`}>
                {diff > 0 ? "+" : ""}{diff.toFixed(2)}%
              </td>
            </tr>
            <tr className="border-t border-stone-100">
              <td className="px-4 py-3 font-medium">Median Annual Tax</td>
              <td className="px-4 py-3 text-right">{fmt(stateA.median_tax)}</td>
              <td className="px-4 py-3 text-right">{fmt(stateB.median_tax)}</td>
              <td className={`px-4 py-3 text-right font-medium ${stateA.median_tax > stateB.median_tax ? "text-red-600" : "text-emerald-600"}`}>
                {stateA.median_tax > stateB.median_tax ? "+" : ""}
                {fmt(stateA.median_tax - stateB.median_tax)}
              </td>
            </tr>
            <tr className="border-t border-stone-100">
              <td className="px-4 py-3 font-medium">Median Home Value</td>
              <td className="px-4 py-3 text-right">{fmt(stateA.median_home_value)}</td>
              <td className="px-4 py-3 text-right">{fmt(stateB.median_home_value)}</td>
              <td className="px-4 py-3 text-right">
                {fmt(stateA.median_home_value - stateB.median_home_value)}
              </td>
            </tr>
            <tr className="border-t border-stone-100">
              <td className="px-4 py-3 font-medium">Tax on $250K Home</td>
              <td className="px-4 py-3 text-right">{fmt(250000 * (stateA.effective_rate / 100))}</td>
              <td className="px-4 py-3 text-right">{fmt(250000 * (stateB.effective_rate / 100))}</td>
              <td className={`px-4 py-3 text-right font-medium ${stateA.effective_rate > stateB.effective_rate ? "text-red-600" : "text-emerald-600"}`}>
                {fmt(250000 * ((stateA.effective_rate - stateB.effective_rate) / 100))}
              </td>
            </tr>
            <tr className="border-t border-stone-100">
              <td className="px-4 py-3 font-medium">Tax on $350K Home</td>
              <td className="px-4 py-3 text-right">{fmt(taxOn350kA)}</td>
              <td className="px-4 py-3 text-right">{fmt(taxOn350kB)}</td>
              <td className={`px-4 py-3 text-right font-medium ${taxOn350kA > taxOn350kB ? "text-red-600" : "text-emerald-600"}`}>
                {fmt(taxOn350kA - taxOn350kB)}
              </td>
            </tr>
            <tr className="border-t border-stone-100">
              <td className="px-4 py-3 font-medium">Tax on $500K Home</td>
              <td className="px-4 py-3 text-right">{fmt(500000 * (stateA.effective_rate / 100))}</td>
              <td className="px-4 py-3 text-right">{fmt(500000 * (stateB.effective_rate / 100))}</td>
              <td className={`px-4 py-3 text-right font-medium ${stateA.effective_rate > stateB.effective_rate ? "text-red-600" : "text-emerald-600"}`}>
                {fmt(500000 * ((stateA.effective_rate - stateB.effective_rate) / 100))}
              </td>
            </tr>
            <tr className="border-t border-stone-100">
              <td className="px-4 py-3 font-medium">vs National Average ({national.avg_rate.toFixed(2)}%)</td>
              <td className={`px-4 py-3 text-right font-medium ${stateA.effective_rate > national.avg_rate ? "text-red-600" : "text-emerald-600"}`}>
                {stateA.effective_rate > national.avg_rate ? "+" : ""}
                {(stateA.effective_rate - national.avg_rate).toFixed(2)}%
              </td>
              <td className={`px-4 py-3 text-right font-medium ${stateB.effective_rate > national.avg_rate ? "text-red-600" : "text-emerald-600"}`}>
                {stateB.effective_rate > national.avg_rate ? "+" : ""}
                {(stateB.effective_rate - national.avg_rate).toFixed(2)}%
              </td>
              <td className="px-4 py-3 text-right">-</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Visual comparison bars */}
      <div className="space-y-4 mb-8">
        <h2 className="text-xl font-bold text-stone-800 mb-2">Visual Comparison</h2>
        <div>
          <h3 className="text-sm font-medium text-stone-600 mb-2">Effective Tax Rate</h3>
          <ComparisonBar
            bars={[
              { label: stateA.state, value: stateA.effective_rate },
              { label: stateB.state, value: stateB.effective_rate },
              { label: "National avg", value: national.avg_rate },
            ]}
            format={(v) => v.toFixed(2) + "%"}
            referenceValue={national.avg_rate}
          />
        </div>
        <div>
          <h3 className="text-sm font-medium text-stone-600 mb-2">Tax on $350K Home</h3>
          <ComparisonBar
            bars={[
              { label: stateA.state, value: taxOn350kA },
              { label: stateB.state, value: taxOn350kB },
            ]}
            format={fmt}
          />
        </div>
        <div>
          <h3 className="text-sm font-medium text-stone-600 mb-2">Median Annual Tax</h3>
          <ComparisonBar
            bars={[
              { label: stateA.state, value: stateA.median_tax },
              { label: stateB.state, value: stateB.median_tax },
            ]}
            format={fmt}
          />
        </div>
      </div>

      <AdSlot id="7890123456" />

      <PropertyTaxCalculator
        defaultState={stateA.abbr}
        defaultRate={stateA.effective_rate}
        states={allStates.map((s) => ({
          abbr: s.abbr,
          state: s.state,
          avg_rate: s.avg_rate,
        }))}
      />

      {/* SEO analysis content */}
      <section className="prose prose-slate max-w-none mt-12">
        <h2>
          Why {higher.state} Has Higher Property Taxes Than {lower.state}
        </h2>
        <p>
          {higher.state} has an effective property tax rate of{" "}
          {higher.effective_rate.toFixed(2)}%, compared to{" "}
          {lower.effective_rate.toFixed(2)}% in {lower.state}. This means
          homeowners in {higher.state} pay approximately{" "}
          <strong>{fmt(annualSavings)} more per year</strong> on a $350,000 home
          than those in {lower.state}.
        </p>
        <p>
          Property tax rates vary based on each state&apos;s funding model for
          local services, including schools, infrastructure, and public safety.
          States with lower property taxes may compensate through higher{" "}
          <strong>state income tax</strong> or <strong>sales tax</strong>.
          Consider total tax burden when comparing states for relocation.
        </p>
        <p>
          If you&apos;re moving between states, factor in{" "}
          <strong>homeowners insurance costs</strong>,{" "}
          <strong>mortgage refinancing rates</strong>, and potential{" "}
          <strong>homestead exemption</strong> savings. A{" "}
          <strong>property tax appeal</strong> can also help reduce your
          assessment in either state.
        </p>
        <p>
          For more financial context, explore{" "}
          <a href="https://salarybycity.com">salary data</a>,{" "}
          <a href="https://costbycity.com">cost of living comparisons</a>, and{" "}
          <a href="https://zippeek.com">ZIP code details</a> for both states.
        </p>
      </section>

      {/* Related comparisons */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-stone-800 mb-4">
          Related Property Tax Comparisons
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {allStates
            .filter(
              (s) =>
                s.slug !== stateA.slug &&
                s.slug !== stateB.slug
            )
            .slice(0, 8)
            .map((s) => (
              <a
                key={s.slug}
                href={`/compare/${stateA.slug}-vs-${s.slug}/`}
                className="p-3 bg-stone-50 border border-stone-200 rounded-lg hover:bg-stone-100 transition-colors"
              >
                {stateA.state} vs {s.state} Property Taxes
              </a>
            ))}
        </div>
      </section>

      <AdSlot id="8901234567" />
      <DataFeedback />

      <CompareRich slug={canonical} a={stateA} b={stateB} />

    </>
  );
}
