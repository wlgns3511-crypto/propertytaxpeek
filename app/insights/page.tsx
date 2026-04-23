import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllInsightArticles } from '@/lib/insight-articles';

const SITE_URL = 'https://propertytaxpeek.com';

export const metadata: Metadata = {
  title: 'Property Tax Insights — Data-Driven Trend Analysis',
  description: 'Expert analysis of US property tax trends, state-by-state comparisons, and data-driven insights for homeowners. Based on real assessment data from all 50 states.',
  alternates: { canonical: '/insights/' },
  openGraph: { title: 'Property Tax Insights', description: 'Data-driven property tax trend analysis for all 50 US states.', url: '/insights/' },
};

export default function InsightsIndex() {
  const articles = getAllInsightArticles();

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'PropertyTaxPeek Insights',
            url: `${SITE_URL}/insights/`,
            numberOfItems: articles.length,
            itemListElement: articles.map((a, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: a.title,
              url: `${SITE_URL}/insights/${a.slug}/`,
            })),
          }),
        }}
      />

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Property Tax Insights</h1>
        <p className="text-slate-600 max-w-3xl">
          Data-driven analysis of property tax trends across the United States.
          Each article uses real assessment data to surface patterns, compare states,
          and provide actionable takeaways for homeowners and prospective buyers.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 gap-4">
        {articles.map((a) => (
          <Link
            key={a.slug}
            href={`/insights/${a.slug}/`}
            className="block rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 p-5 transition-colors"
          >
            <div className="text-xs text-slate-400 mb-1">
              <time dateTime={a.date}>{a.date}</time>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">{a.title}</h2>
            <p className="text-sm text-slate-600">{a.summary}</p>
          </Link>
        ))}
      </div>

      <section className="mt-12 p-6 rounded-xl bg-slate-50 border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-3">Run the numbers yourself</h2>
        <p className="text-sm text-slate-600 mb-4">
          These insights are based on aggregate data. Get the specific numbers for your situation.
        </p>
        <ul className="space-y-2 text-sm">
          <li>
            <Link href="/calculator/" className="text-blue-700 hover:underline font-medium">Property tax calculator</Link>
            <span className="text-slate-500"> — estimate your annual bill by state</span>
          </li>
          <li>
            <Link href="/compare/" className="text-blue-700 hover:underline font-medium">Compare any two states</Link>
            <span className="text-slate-500"> — side-by-side rates and median bills</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
