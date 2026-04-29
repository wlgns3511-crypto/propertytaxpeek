import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllGuides } from '@/lib/guides';

export const metadata: Metadata = {
  title: 'Property Tax Guides — Effective Rates, Exemptions, Appeals & Ownership Cost',
  description: 'In-depth guides on US property tax — how effective rates differ from headline rates, state-by-state burden comparisons, exemptions most homeowners miss, why neighbors pay 10x different bills, and the true cost of homeownership beyond the mortgage.',
  alternates: { canonical: '/guide/' },
  openGraph: { title: 'Property Tax Guides', description: 'Authoritative guides on US property tax mechanics, exemptions, and ownership cost.', url: '/guide/' },
};

export default function GuidesIndex() {
  const guides = getAllGuides();
  const listItems = guides.map((g, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: g.title,
    url: `https://propertytaxpeek.com/guide/${g.slug}/`,
  }));

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'PropertyTaxPeek Guides',
            url: 'https://propertytaxpeek.com/guide/',
            numberOfItems: guides.length,
            itemListElement: listItems,
          }),
        }}
      />

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Property Tax Guides</h1>
        <p className="text-slate-600 max-w-3xl">
          Long-form, evidence-based guides to US property tax. How rates really work, the
          exemptions most homeowners overlook, why two identical houses pay 10x different bills,
          and the true cost of homeownership beyond the mortgage payment. Every guide links back
          to live data on our state pages and calculator.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 gap-4">
        {guides.map((g) => (
          <Link
            key={g.slug}
            href={`/guide/${g.slug}/`}
            className="block rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 p-5 transition-colors"
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">{g.category}</div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">{g.title}</h2>
            <p className="text-sm text-slate-600">{g.description}</p>
          </Link>
        ))}
      </div>

      <section className="mt-12 p-6 rounded-xl bg-slate-50 border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-3">Apply what you read</h2>
        <p className="text-sm text-slate-600 mb-4">
          Use our tools to look up your state, run the numbers, and compare any two states.
        </p>
        <ul className="space-y-2 text-sm">
          <li>
            <Link href="/calculator/" className="text-blue-700 hover:underline font-medium">Property tax calculator →</Link>
            <span className="text-slate-500"> estimate your annual bill by state</span>
          </li>
          <li>
            <Link href="/compare/" className="text-blue-700 hover:underline font-medium">Compare any two states →</Link>
            <span className="text-slate-500"> side-by-side rates, exemptions, median bills</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
