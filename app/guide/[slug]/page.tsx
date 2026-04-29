import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllGuides, getGuideBySlug } from '@/lib/guides';
import { AuthorBox } from '@/components/AuthorBox';
import { AdSlot } from '@/components/AdSlot';
import { TrustBlock } from '@/components/upgrades/TrustBlock';

interface Props {
  params: Promise<{ slug: string }>;
}

// dynamicParams=false (2026-04-23): unknown guide slugs → real HTTP 404.
export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams() {
  return getAllGuides().map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return {};
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `/guide/${slug}/` },
    openGraph: {
      title: guide.title,
      description: guide.description,
      url: `/guide/${slug}/`,
      type: 'article',
      modifiedTime: guide.updatedAt,
    },
    other: { 'article:modified_time': guide.updatedAt },
  };
}

const SITE_URL = 'https://propertytaxpeek.com';
const SITE_NAME = 'PropertyTaxPeek';

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const url = `${SITE_URL}/guide/${slug}/`;
  const others = getAllGuides().filter((g) => g.slug !== slug).slice(0, 4);

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Guides', item: `${SITE_URL}/guide/` },
      { '@type': 'ListItem', position: 3, name: guide.title, item: url },
    ],
  };

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.description,
    url,
    datePublished: guide.updatedAt,
    dateModified: guide.updatedAt,
    articleSection: guide.category,
    author: {
      '@type': 'Organization',
      name: `${SITE_NAME} Editorial Team`,
      url: `${SITE_URL}/about/`,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: guide.faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <nav className="text-xs text-slate-500 mb-6">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <span className="mx-1">›</span>
        <Link href="/guide/" className="hover:text-blue-600">Guides</Link>
        <span className="mx-1">›</span>
        <span className="text-slate-700">{guide.title}</span>
      </nav>

      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-full">
            {guide.category}
          </span>
          <span className="text-xs text-slate-400">
            Updated <time dateTime={guide.updatedAt}>{guide.updatedAt}</time>
          </span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 leading-tight mb-4">{guide.title}</h1>
        <p className="text-lg text-slate-600 leading-relaxed mb-2">{guide.description}</p>
      </header>

      <div
        className="prose prose-slate max-w-none mb-8
          prose-p:leading-relaxed prose-p:text-slate-700
          prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline"
        dangerouslySetInnerHTML={{ __html: guide.intro }}
      />

      <TrustBlock sources={[{name:"Census ACS",url:"https://www.census.gov/programs-surveys/acs"},{name:"Tax Foundation",url:"https://taxfoundation.org/data/all/state/property-taxes-by-state-county/"},{name:"State Gov Finances",url:"https://www.census.gov/programs-surveys/gov-finances.html"}]} updated="ACS 2022 data vintage, reviewed April 2026" />

      {/* Table of contents */}
      <nav aria-label="Table of contents" className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">On this page</p>
        <ol className="space-y-1.5 text-sm">
          {guide.sections.map((s, i) => (
            <li key={i}>
              <a href={`#section-${i}`} className="text-blue-700 hover:underline">{s.heading}</a>
            </li>
          ))}
          <li><a href="#faq" className="text-blue-700 hover:underline">Frequently Asked Questions</a></li>
        </ol>
      </nav>

      <div
        className="prose prose-slate max-w-none
          prose-h2:text-xl prose-h2:font-bold prose-h2:mt-10 prose-h2:mb-4
          prose-p:leading-relaxed prose-p:text-slate-700
          prose-ul:my-3 prose-ol:my-3 prose-li:my-1
          prose-table:text-sm prose-th:bg-slate-50
          prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline"
      >
        {guide.sections.map((s, i) => (
          <section key={i} id={`section-${i}`}>
            <h2>{s.heading}</h2>
            <div dangerouslySetInnerHTML={{ __html: s.html }} />
          </section>
        ))}

        <section id="faq">
          <h2>Frequently Asked Questions</h2>
          <div className="not-prose space-y-3">
            {guide.faqs.map((f, i) => (
              <details key={i} className="rounded-lg border border-slate-200 bg-white p-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="cursor-pointer font-semibold text-slate-900 flex items-center justify-between gap-2">
                  <span>{f.question}</span>
                  <span className="text-blue-600 text-sm">+</span>
                </summary>
                <p className="mt-2 text-sm text-slate-700 leading-relaxed">{f.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>

      <AdSlot id="5678901234" />

      <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-xl">
        <h2 className="text-lg font-bold text-slate-900 mb-2">Run the numbers for your situation</h2>
        <p className="text-slate-600 text-sm mb-4">
          These guides are theory. Get the actual property tax for your address and home value.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/calculator/" className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Tax Calculator</Link>
          <Link href="/compare/" className="text-sm px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 font-medium">Compare States</Link>
          <Link href="/state/" className="text-sm px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium">All 50 States</Link>
        </div>
      </div>

      <AuthorBox />

      {others.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Continue reading</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {others.map((g) => (
              <Link
                key={g.slug}
                href={`/guide/${g.slug}/`}
                className="block border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all group"
              >
                <span className="text-xs text-blue-600">{g.category}</span>
                <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 mt-1 leading-snug">{g.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
