import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllInsightArticles, getInsightArticleBySlug } from '@/lib/insight-articles';

interface Props {
  params: Promise<{ slug: string }>;
}

// dynamicParams=false (2026-04-23): unknown insight slugs → real HTTP 404.
export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams() {
  return getAllInsightArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getInsightArticleBySlug(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.summary,
    alternates: { canonical: `/insights/${slug}/` },
    openGraph: {
      title: article.title,
      description: article.summary,
      url: `/insights/${slug}/`,
      type: 'article',
      publishedTime: article.date,
    },
  };
}

const SITE_URL = 'https://propertytaxpeek.com';
const SITE_NAME = 'PropertyTaxPeek';

export default async function InsightPage({ params }: Props) {
  const { slug } = await params;
  const article = getInsightArticleBySlug(slug);
  if (!article) notFound();

  const url = `${SITE_URL}/insights/${slug}/`;
  const others = getAllInsightArticles().filter((a) => a.slug !== slug);

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Insights', item: `${SITE_URL}/insights/` },
      { '@type': 'ListItem', position: 3, name: article.title, item: url },
    ],
  };

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.summary,
    url,
    datePublished: article.date,
    dateModified: article.date,
    articleSection: 'Insights',
    author: { '@type': 'Organization', name: `${SITE_NAME} Editorial Team`, url: `${SITE_URL}/about/` },
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: article.faqs.map((f) => ({
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

      <nav className="text-xs text-stone-500 mb-6">
        <Link href="/" className="hover:text-amber-700">Home</Link>
        <span className="mx-1">&rsaquo;</span>
        <Link href="/insights/" className="hover:text-amber-700">Insights</Link>
        <span className="mx-1">&rsaquo;</span>
        <span className="text-stone-700">{article.title}</span>
      </nav>

      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
            Insight
          </span>
          <span className="text-xs text-stone-400">
            Published <time dateTime={article.date}>{article.date}</time>
          </span>
        </div>
        <h1 className="text-3xl font-bold text-stone-900 leading-tight mb-4">{article.title}</h1>
        <p className="text-lg text-stone-600 leading-relaxed">{article.summary}</p>
      </header>

      <div
        className="prose prose-slate max-w-none mb-8
          prose-p:leading-relaxed prose-p:text-stone-700
          prose-a:text-amber-700 prose-a:no-underline hover:prose-a:underline
          prose-strong:text-stone-900"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      <div className="my-8 p-5 rounded-xl bg-amber-50 border border-amber-200">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-2">Key Takeaway</p>
        <p className="text-stone-800 leading-relaxed font-medium">{article.keyTakeaway}</p>
      </div>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-stone-900 mb-4">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {article.faqs.map((f, i) => (
            <details key={i} className="rounded-lg border border-stone-200 bg-white p-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="cursor-pointer font-semibold text-stone-900 flex items-center justify-between gap-2">
                <span>{f.question}</span>
                <span className="text-amber-700 text-sm">+</span>
              </summary>
              <p className="mt-2 text-sm text-stone-700 leading-relaxed">{f.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="mt-12 p-6 bg-amber-50 border border-amber-200 rounded-xl">
        <h2 className="text-lg font-bold text-stone-900 mb-2">Run the numbers for your situation</h2>
        <p className="text-stone-600 text-sm mb-4">
          These insights are based on aggregate data. Get the specific numbers for your state and county.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/calculator/" className="text-sm px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 font-medium">Tax Calculator</Link>
          <Link href="/compare/" className="text-sm px-4 py-2 bg-white border border-amber-300 text-amber-800 rounded-lg hover:bg-amber-50 font-medium">Compare States</Link>
        </div>
      </div>

      {others.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-stone-800 mb-4">More insights</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {others.map((a) => (
              <Link
                key={a.slug}
                href={`/insights/${a.slug}/`}
                className="block border border-stone-200 rounded-xl p-4 hover:border-amber-300 hover:shadow-sm transition-all group"
              >
                <span className="text-xs text-stone-400">{a.date}</span>
                <h3 className="text-sm font-semibold text-stone-900 group-hover:text-amber-800 mt-1 leading-snug">{a.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
