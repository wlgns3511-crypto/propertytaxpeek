import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllCountyComparisonSlugs, getCountyComparisonBySlug, getNationalAverage, getCountiesByState, getAllCounties } from "@/lib/db";
import { AdSlot } from "@/components/AdSlot";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ComparisonBar } from "@/components/ComparisonBar";

export const dynamicParams = true;
export const revalidate = 86400;

export function generateStaticParams() {
  return getAllCountyComparisonSlugs(100).map((c) => ({ slug: c.slug }));
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
      <p className="text-slate-600 mb-8">Property Tax Rate Comparison 2025</p>

      <AdSlot id="county-compare-top" />

      <section className="mb-8">
        <div className="bg-blue-50 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Quick Answer</h2>
          <p className="text-slate-700">
            <strong>{a.county_name}, {a.state}</strong>: {a.effective_rate.toFixed(2)}% effective rate · {fmt(a.median_tax)}/yr median tax ·
            median home {fmt(a.median_home_value)}
          </p>
          <p className="text-slate-700 mt-2">
            <strong>{b.county_name}, {b.state}</strong>: {b.effective_rate.toFixed(2)}% effective rate · {fmt(b.median_tax)}/yr median tax ·
            median home {fmt(b.median_home_value)}
          </p>
        </div>

        <h2 className="text-xl font-bold mb-4">Side-by-Side Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-3 text-left border border-slate-200">Metric</th>
                <th className="p-3 text-left border border-slate-200 text-blue-700">{a.county_name}, {a.state}</th>
                <th className="p-3 text-left border border-slate-200 text-blue-700">{b.county_name}, {b.state}</th>
                <th className="p-3 text-left border border-slate-200 text-slate-500">National Avg</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  <td className="p-3 border border-slate-200 font-medium">{m.label}</td>
                  <td className="p-3 border border-slate-200">{m.aVal}</td>
                  <td className="p-3 border border-slate-200">{m.bVal}</td>
                  <td className="p-3 border border-slate-200 text-slate-500">{m.national}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Visual comparison bars */}
        <div className="mt-6 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-slate-600 mb-2">Effective Tax Rate</h3>
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
            <h3 className="text-sm font-medium text-slate-600 mb-2">Median Annual Tax</h3>
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
            <h3 className="text-sm font-medium text-slate-600 mb-2">Median Home Value</h3>
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
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-bold text-lg mb-3">{a.county_name}, {a.state}</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-600">Effective Rate</dt><dd className="font-semibold">{a.effective_rate.toFixed(2)}%</dd></div>
            <div className="flex justify-between"><dt className="text-slate-600">Median Annual Tax</dt><dd className="font-semibold">{fmt(a.median_tax)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-600">Median Home Value</dt><dd className="font-semibold">{fmt(a.median_home_value)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-600">Population</dt><dd className="font-semibold">{a.population.toLocaleString()}</dd></div>
          </dl>
          <a href={`/county/${a.slug}`} className="mt-4 block text-center text-sm text-blue-600 hover:underline">
            Full profile →
          </a>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-bold text-lg mb-3">{b.county_name}, {b.state}</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-600">Effective Rate</dt><dd className="font-semibold">{b.effective_rate.toFixed(2)}%</dd></div>
            <div className="flex justify-between"><dt className="text-slate-600">Median Annual Tax</dt><dd className="font-semibold">{fmt(b.median_tax)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-600">Median Home Value</dt><dd className="font-semibold">{fmt(b.median_home_value)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-600">Population</dt><dd className="font-semibold">{b.population.toLocaleString()}</dd></div>
          </dl>
          <a href={`/county/${b.slug}`} className="mt-4 block text-center text-sm text-blue-600 hover:underline">
            Full profile →
          </a>
        </div>
      </section>

      <AdSlot id="county-compare-mid" />

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">Frequently Asked Questions</h2>
        {faqs.map((faq, i) => (
          <details key={i} className="border border-slate-200 rounded-lg mb-2" open={i === 0}>
            <summary className="p-4 cursor-pointer font-medium">{faq.q}</summary>
            <div className="px-4 pb-4 text-slate-600 text-sm">{faq.a}</div>
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
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {a.county_name} vs {c.county_name}, {c.state}
                  </a>
                  <span className="text-slate-300">|</span>
                  <a
                    href={`/county-compare/${b.slug}-vs-${c.slug}/`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {b.county_name} vs {c.county_name}, {c.state}
                  </a>
                </div>
              ))}
            </div>
          </section>
        );
      })()}
    </div>
  );
}
