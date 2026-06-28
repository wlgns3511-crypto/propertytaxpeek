import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCountyComparisonBySlug, getNationalAverage, getCountiesByState, getAllCounties } from "@/lib/db";
import { AdSlot } from "@/components/AdSlot";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ComparisonBar } from "@/components/ComparisonBar";
import { AuthorBox } from "@/components/AuthorBox";
import { COMPARE_VINTAGE } from "@/lib/authorship";
import { datasetSchema } from "@/lib/schema";
import countyCompareKeep from "@/lib/generated/county-compare-keep.json";
import { getStateByAbbr } from "@/lib/db";
import { getStateExemptionData } from "@/lib/state-exemption-data";
import {
  decodeEffectiveRate,
  tierLabel as rateTierLabel,
  tierBlurb as rateTierBlurb,
  tierToneColor as rateTierToneColor,
  RATE_TIER_CUTOFF_SUMMARY,
} from "@/lib/effective-rate-decoder";

// HCU 2026-04-24: was `dynamicParams = true` over a 124,750-row compare
// table → Google discovered ~34k of these as thin/duplicate, producing the
// 28k "duplicate no canonical" + 5.5k "crawled not indexed" + 5.5k 5xx
// signals in GSC. Flipped to dynamicParams=false + a curated 100-pair
// keep-set (same-state, both counties >= 100K pop, 5-per-state cap).
// Middleware.ts 410s anything outside the keep-set for fast deindex.
export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams() {
  return (countyCompareKeep as string[]).map((slug) => ({ slug }));
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = getCountyComparisonBySlug(slug);
  if (!data) return {};
  const { a, b } = data;
  return {
    title: `${a.county_name}, ${a.state} vs ${b.county_name}, ${b.state} Property Tax Comparison`,
    description: `Compare property taxes: ${a.county_name}, ${a.state} (${a.effective_rate.toFixed(2)}% rate, ${fmt(a.median_tax)}/yr) vs ${b.county_name}, ${b.state} (${b.effective_rate.toFixed(2)}% rate, ${fmt(b.median_tax)}/yr).`,
    alternates: { canonical: `/county-compare/${slug}/` },
    openGraph: { url: `/county-compare/${slug}/` },
  };
}

export default async function CountyComparePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = getCountyComparisonBySlug(slug);
  if (!data) notFound();
  const { a, b } = data;
  const national = getNationalAverage();

  // Phase 6 v6.4 PSU — paired EffectiveRateVsAssessmentDecoder reads for A vs B.
  const aState = getStateByAbbr(a.state);
  const bState = getStateByAbbr(b.state);
  const aExemption = aState ? getStateExemptionData(aState.slug) : undefined;
  const bExemption = bState ? getStateExemptionData(bState.slug) : undefined;
  const aDecoder = decodeEffectiveRate({
    effectiveRatePct: a.effective_rate,
    nationalAvgPct: national.avg_rate,
    stateAvgPct: null,
    stateExemption: aExemption,
  });
  const bDecoder = decodeEffectiveRate({
    effectiveRatePct: b.effective_rate,
    nationalAvgPct: national.avg_rate,
    stateAvgPct: null,
    stateExemption: bExemption,
  });
  const aTone = rateTierToneColor(aDecoder.tier);
  const bTone = rateTierToneColor(bDecoder.tier);

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Compare Counties", href: "/county-compare/" },
    { label: `${a.county_name} vs ${b.county_name}`, href: `/county-compare/${slug}/` },
  ];

  const metrics = [
    { label: "Effective Tax Rate", aVal: `${a.effective_rate.toFixed(2)}%`, bVal: `${b.effective_rate.toFixed(2)}%`, national: `${national.avg_rate.toFixed(2)}%` },
    { label: "Median Annual Tax", aVal: fmt(a.median_tax), bVal: fmt(b.median_tax), national: fmt(national.avg_median_tax) },
    { label: "Median Home Value", aVal: fmt(a.median_home_value), bVal: fmt(b.median_home_value), national: fmt(national.avg_home_value) },
    { label: "Population", aVal: a.population.toLocaleString(), bVal: b.population.toLocaleString(), national: "—" },
  ];

  const faqs = [
    {
      q: `What is the property tax difference between ${a.county_name} and ${b.county_name}?`,
      a: `${a.county_name}, ${a.state} has an effective property tax rate of ${a.effective_rate.toFixed(2)}% with a median annual tax of ${fmt(a.median_tax)}. ${b.county_name}, ${b.state} has a rate of ${b.effective_rate.toFixed(2)}% with a median annual tax of ${fmt(b.median_tax)}. The difference is ${Math.abs(a.effective_rate - b.effective_rate).toFixed(2)} percentage points.`,
    },
    {
      q: `Which county has higher property taxes, ${a.county_name} or ${b.county_name}?`,
      a: `${a.effective_rate > b.effective_rate ? a.county_name + ', ' + a.state : b.county_name + ', ' + b.state} has the higher effective property tax rate at ${Math.max(a.effective_rate, b.effective_rate).toFixed(2)}% compared to ${Math.min(a.effective_rate, b.effective_rate).toFixed(2)}%.`,
    },
    {
      q: `How do ${a.county_name} and ${b.county_name} compare to the national average?`,
      a: `The national average effective property tax rate is ${national.avg_rate.toFixed(2)}%. ${a.county_name} is ${a.effective_rate > national.avg_rate ? 'above' : 'below'} average at ${a.effective_rate.toFixed(2)}%, and ${b.county_name} is ${b.effective_rate > national.avg_rate ? 'above' : 'below'} average at ${b.effective_rate.toFixed(2)}%.`,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <Breadcrumb items={breadcrumbs} />
      <h1 className="text-3xl font-bold mb-2 mt-4">
        {a.county_name}, {a.state} vs {b.county_name}, {b.state}
      </h1>
      <p className="text-stone-600 mb-8">Property Tax Rate Comparison 2025</p>

      <AdSlot id="county-compare-top" />

      <section className="mb-8">
        <div className="bg-amber-50 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Quick Answer</h2>
          <p className="text-stone-700">
            <strong>{a.county_name}, {a.state}</strong>: {a.effective_rate.toFixed(2)}% effective rate · {fmt(a.median_tax)}/yr median tax ·
            median home {fmt(a.median_home_value)}
          </p>
          <p className="text-stone-700 mt-2">
            <strong>{b.county_name}, {b.state}</strong>: {b.effective_rate.toFixed(2)}% effective rate · {fmt(b.median_tax)}/yr median tax ·
            median home {fmt(b.median_home_value)}
          </p>
        </div>

        <h2 className="text-xl font-bold mb-4">Side-by-Side Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-stone-100">
                <th className="p-3 text-left border border-stone-200">Metric</th>
                <th className="p-3 text-left border border-stone-200 text-amber-800">{a.county_name}, {a.state}</th>
                <th className="p-3 text-left border border-stone-200 text-amber-800">{b.county_name}, {b.state}</th>
                <th className="p-3 text-left border border-stone-200 text-stone-500">National Avg</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-stone-50"}>
                  <td className="p-3 border border-stone-200 font-medium">{m.label}</td>
                  <td className="p-3 border border-stone-200">{m.aVal}</td>
                  <td className="p-3 border border-stone-200">{m.bVal}</td>
                  <td className="p-3 border border-stone-200 text-stone-500">{m.national}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Visual comparison bars */}
        <div className="mt-6 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-stone-600 mb-2">Effective Tax Rate</h3>
            <ComparisonBar
              bars={[
                { label: a.county_name, value: a.effective_rate },
                { label: b.county_name, value: b.effective_rate },
                { label: "National Avg", value: national.avg_rate },
              ]}
              format={(v) => v.toFixed(2) + "%"}
              referenceValue={national.avg_rate}
            />
          </div>
          <div>
            <h3 className="text-sm font-medium text-stone-600 mb-2">Median Annual Tax</h3>
            <ComparisonBar
              bars={[
                { label: a.county_name, value: a.median_tax },
                { label: b.county_name, value: b.median_tax },
                { label: "National Avg", value: national.avg_median_tax },
              ]}
              format={fmt}
              referenceValue={national.avg_median_tax}
            />
          </div>
          <div>
            <h3 className="text-sm font-medium text-stone-600 mb-2">Median Home Value</h3>
            <ComparisonBar
              bars={[
                { label: a.county_name, value: a.median_home_value },
                { label: b.county_name, value: b.median_home_value },
                { label: "National Avg", value: national.avg_home_value },
              ]}
              format={fmt}
              referenceValue={national.avg_home_value}
            />
          </div>
        </div>
      </section>

      <section className="mb-8 grid md:grid-cols-2 gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <h3 className="font-bold text-lg mb-3">{a.county_name}, {a.state}</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-stone-600">Effective Rate</dt><dd className="font-semibold">{a.effective_rate.toFixed(2)}%</dd></div>
            <div className="flex justify-between"><dt className="text-stone-600">Median Annual Tax</dt><dd className="font-semibold">{fmt(a.median_tax)}</dd></div>
            <div className="flex justify-between"><dt className="text-stone-600">Median Home Value</dt><dd className="font-semibold">{fmt(a.median_home_value)}</dd></div>
            <div className="flex justify-between"><dt className="text-stone-600">Population</dt><dd className="font-semibold">{a.population.toLocaleString()}</dd></div>
          </dl>
          <a href={`/county/${a.slug}`} className="mt-4 block text-center text-sm text-amber-700 hover:underline">
            Full profile →
          </a>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <h3 className="font-bold text-lg mb-3">{b.county_name}, {b.state}</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-stone-600">Effective Rate</dt><dd className="font-semibold">{b.effective_rate.toFixed(2)}%</dd></div>
            <div className="flex justify-between"><dt className="text-stone-600">Median Annual Tax</dt><dd className="font-semibold">{fmt(b.median_tax)}</dd></div>
            <div className="flex justify-between"><dt className="text-stone-600">Median Home Value</dt><dd className="font-semibold">{fmt(b.median_home_value)}</dd></div>
            <div className="flex justify-between"><dt className="text-stone-600">Population</dt><dd className="font-semibold">{b.population.toLocaleString()}</dd></div>
          </dl>
          <a href={`/county/${b.slug}`} className="mt-4 block text-center text-sm text-amber-700 hover:underline">
            Full profile →
          </a>
        </div>
      </section>

      <AdSlot id="county-compare-mid" />

      {/* Paired EffectiveRateVsAssessmentDecoder — editorial reading per county */}
      {(aDecoder.tier || bDecoder.tier) && (
        <section className="mb-10" data-upgrade="effective-rate-decoder-compare">
          <h2 className="text-xl font-bold mb-4">
            Effective-rate decoder: side-by-side reading
          </h2>
          <p className="text-sm text-stone-600 mb-4">
            The Census ACS effective rate alone does not tell you why one county is more
            expensive than the other. The PropertyTaxPeek decoder bands each rate into
            five tiers and surfaces the drivers — assessment-cap dynamics, school-district
            funding model, and SALT cap pressure — that typically explain the gap.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {aDecoder.tier && (
              <div className={`rounded-xl border ${aTone.border} ${aTone.bg} p-5`}>
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <h3 className={`font-bold ${aTone.text}`}>
                    {a.county_name}: {rateTierLabel(aDecoder.tier)}
                  </h3>
                  <span className="text-xs text-stone-500">
                    {a.effective_rate.toFixed(2)}%
                  </span>
                </div>
                <p className={`text-sm ${aTone.text} mb-2`}>
                  {rateTierBlurb(aDecoder.tier)}
                </p>
                <p className="text-xs text-stone-600">
                  <strong>Assessment cap:</strong>{" "}
                  {aDecoder.assessmentCapLabel ?? "No statewide cap"} ·{" "}
                  <strong>vs US:</strong>{" "}
                  {aDecoder.nationalGapPp != null
                    ? `${aDecoder.nationalGapPp > 0 ? "+" : ""}${aDecoder.nationalGapPp.toFixed(2)} pp`
                    : "—"}
                </p>
                <details className="mt-2 bg-white/40 rounded-md px-3 py-2 border border-stone-200">
                  <summary className="text-sm font-medium cursor-pointer text-stone-800">
                    Drivers
                  </summary>
                  <ul className="mt-2 text-sm text-stone-700 list-disc pl-5 space-y-1">
                    {aDecoder.drivers.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </details>
              </div>
            )}
            {bDecoder.tier && (
              <div className={`rounded-xl border ${bTone.border} ${bTone.bg} p-5`}>
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <h3 className={`font-bold ${bTone.text}`}>
                    {b.county_name}: {rateTierLabel(bDecoder.tier)}
                  </h3>
                  <span className="text-xs text-stone-500">
                    {b.effective_rate.toFixed(2)}%
                  </span>
                </div>
                <p className={`text-sm ${bTone.text} mb-2`}>
                  {rateTierBlurb(bDecoder.tier)}
                </p>
                <p className="text-xs text-stone-600">
                  <strong>Assessment cap:</strong>{" "}
                  {bDecoder.assessmentCapLabel ?? "No statewide cap"} ·{" "}
                  <strong>vs US:</strong>{" "}
                  {bDecoder.nationalGapPp != null
                    ? `${bDecoder.nationalGapPp > 0 ? "+" : ""}${bDecoder.nationalGapPp.toFixed(2)} pp`
                    : "—"}
                </p>
                <details className="mt-2 bg-white/40 rounded-md px-3 py-2 border border-stone-200">
                  <summary className="text-sm font-medium cursor-pointer text-stone-800">
                    Drivers
                  </summary>
                  <ul className="mt-2 text-sm text-stone-700 list-disc pl-5 space-y-1">
                    {bDecoder.drivers.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </details>
              </div>
            )}
          </div>
          <p className="text-xs text-stone-500 mt-3">
            Band cutoffs: {RATE_TIER_CUTOFF_SUMMARY}. Editorial reading — not endorsed by
            the US Census Bureau, the IRS, or any state Department of Revenue.{" "}
            Full methodology →
          </p>
        </section>
      )}

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">Frequently Asked Questions</h2>
        {faqs.map((faq, i) => (
          <details key={i} className="border border-stone-200 rounded-lg mb-2" open={i === 0}>
            <summary className="p-4 cursor-pointer font-medium">{faq.q}</summary>
            <div className="px-4 pb-4 text-stone-600 text-sm">{faq.a}</div>
          </details>
        ))}
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } }))
      }) }} />

      {/* Related comparisons for internal linking */}
      {(() => {
        const related = getAllCounties()
          .filter((c) => c.slug !== a.slug && c.slug !== b.slug)
          .slice(0, 6);
        return (
          <section className="mt-8 mb-4">
            <h2 className="text-lg font-bold mb-3">Related Comparisons</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {related.map((c) => (
                <div key={c.slug} className="flex gap-2">
                  <a
                    href={`/county-compare/${a.slug}-vs-${c.slug}/`}
                    className="text-sm text-amber-700 hover:underline"
                  >
                    {a.county_name} vs {c.county_name}, {c.state}
                  </a>
                  <span className="text-stone-300">|</span>
                  <a
                    href={`/county-compare/${b.slug}-vs-${c.slug}/`}
                    className="text-sm text-amber-700 hover:underline"
                  >
                    {b.county_name} vs {c.county_name}, {c.state}
                  </a>
                </div>
              ))}
            </div>
          </section>
        );
      })()}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            datasetSchema(
              `${a.county_name}, ${a.state} vs ${b.county_name}, ${b.state} Property Tax Comparison`,
              `Side-by-side comparison of effective property tax rates, median annual tax, and median home value for ${a.county_name}, ${a.state} and ${b.county_name}, ${b.state}.`,
              {
                url: `/county-compare/${slug}/`,
                dateModified: COMPARE_VINTAGE,
                spatialCoverage: `${a.county_name}, ${a.state} & ${b.county_name}, ${b.state}, USA`,
                variableMeasured: [
                  "effective_property_tax_rate_pct",
                  "median_real_estate_taxes_usd",
                  "median_home_value_usd",
                ],
              },
            ),
          ),
        }}
      />
      <AuthorBox
        vintage={COMPARE_VINTAGE}
        source={`${a.county_name} vs ${b.county_name} property tax comparison`}
        showDisclaimer
      />
    </div>
  );
}
