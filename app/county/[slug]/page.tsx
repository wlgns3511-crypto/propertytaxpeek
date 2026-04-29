import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllCounties,
  getCountyBySlug,
  getCountiesByState,
  getRelatedCounties,
  getStateByAbbr,
  getNationalAverage,
  getAllStates,
} from "@/lib/db";
import { generateAutoFaqs } from "@/lib/auto-faqs";
import { ComparisonBar } from "@/components/ComparisonBar";
import { PropertyTaxCalculator } from "@/components/PropertyTaxCalculator";
import { PropertyTaxEstimator } from "@/components/tools/PropertyTaxEstimator";
import { AdSlot } from "@/components/AdSlot";
import { Breadcrumb } from "@/components/Breadcrumb";
import { FreshnessTag } from "@/components/FreshnessTag";
import { DataFeedback } from "@/components/DataFeedback";
import { AnswerHero } from "@/components/upgrades/AnswerHero";
import { TrustBlock } from "@/components/upgrades/TrustBlock";
import { InsightBlock } from "@/components/upgrades/InsightBlock";
import { DecisionNext } from "@/components/upgrades/DecisionNext";
import { getCountyInsights } from "@/lib/insights";
import { RelatedEntities } from "@/components/upgrades/RelatedEntities";
import { TableOfContents } from '@/components/upgrades/TableOfContents';
import countyCompareKeep from "@/lib/generated/county-compare-keep.json";

// HCU 2026-04-24: gate internal "Compare with other counties" links so we
// only emit anchors that resolve to a page in the 100-slug county-compare
// keep-set. Before this gate, each /county/* page emitted up to 16 compare
// links, which seeded Google's crawl of ~34k non-keep slugs (now 410'd).
const COUNTY_COMPARE_KEEP_SET = new Set<string>(countyCompareKeep as string[]);

// dynamicParams=false (2026-04-23): unknown county slugs → real HTTP 404.
export const dynamicParams = false;
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

  // Peer: same-state different county, prefer meaningfully different rate
  const sameState = getCountiesByState(county.state).filter((c) => c.slug !== slug);
  const peer = sameState.find((p) => {
    const d = Math.abs((p.effective_rate - county.effective_rate) / Math.max(county.effective_rate, 0.01));
    return d > 0.05 && d < 0.8;
  }) || sameState[0];

  let title: string;
  let description: string;
  const dataVintage = "2022 ACS";
  if (peer) {
    const diff = peer.effective_rate - county.effective_rate;
    const pct = Math.round((diff / Math.max(peer.effective_rate, 0.01)) * 100);
    const absPct = Math.abs(pct);
    const dir = pct > 0 ? 'lower' : 'higher';
    title = `${county.county_name}, ${county.state} Property Tax Rate: ${county.effective_rate.toFixed(2)}% vs ${peer.county_name} ${peer.effective_rate.toFixed(2)}%`;
    description = `${county.county_name}, ${county.state} effective property tax rate ${county.effective_rate.toFixed(2)}% — ${absPct}% ${dir} than ${peer.county_name}. Median tax ${fmt(county.median_tax)} on ${fmt(county.median_home_value)} home, pop ${county.population.toLocaleString()}. ${dataVintage} source data.`;
  } else {
    title = `${county.county_name}, ${county.state} Property Tax Rate: ${county.effective_rate.toFixed(2)}%`;
    description = `${county.county_name}, ${county.state}: effective property tax rate ${county.effective_rate.toFixed(2)}%. Median annual tax ${fmt(county.median_tax)} on ${fmt(county.median_home_value)} home value. ${dataVintage} source data.`;
  }

  return {
    title,
    description,
    alternates: {
      canonical: `/county/${slug}/`,
      languages: { en: `/county/${slug}/`, es: `/es/county/${slug}/`, "x-default": `/county/${slug}/` },
    },
    openGraph: { title, description, url: `/county/${slug}/` },
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
  const faqs = generateAutoFaqs(county, stateData ?? null, national);

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

      <AnswerHero
        title={`${county.county_name}, ${county.state}`}
        subtitle="Property tax"
        tagline={`Effective property tax rate ${county.effective_rate.toFixed(2)}% \u2014 ${
          diffFromNational > 0
            ? `${diffFromNational.toFixed(2)}% above`
            : `${Math.abs(diffFromNational).toFixed(2)}% below`
        } the national average. Median annual tax ${fmt(county.median_tax)} on a ${fmt(
          county.median_home_value
        )} home.`}
        badges={[
          {
            label:
              diffFromNational > 0
                ? `${diffFromNational.toFixed(2)}% above US`
                : `${Math.abs(diffFromNational).toFixed(2)}% below US`,
            tone: diffFromNational > 0 ? "amber" : "emerald",
          },
          ...(stateData
            ? [
                {
                  label: `${stateData.state} state`,
                  tone: "indigo" as const,
                },
              ]
            : []),
        ]}
        alternatives={getCountiesByState(county.state)
          .filter((c) => c.slug !== county.slug)
          .slice(0, 3)
          .map((c) => ({
            label: c.county_name,
            href: `/county/${c.slug}/`,
            sublabel: `${c.effective_rate.toFixed(2)}%`,
          }))}
        alternativesLabel={`Other ${county.state} counties`}
      />

      <TrustBlock
        sources={[
          {
            name: "US Census ACS",
            url: "https://www.census.gov/programs-surveys/acs/",
          },
          {
            name: "Census S&L Finances",
            url: "https://www.census.gov/programs-surveys/gov-finances.html",
          },
          {
            name: "Tax Foundation",
            url: "https://taxfoundation.org/data/all/state/property-taxes-by-state/",
          },
          {
            name: "Lincoln Institute",
            url: "https://www.lincolninst.edu/research-data/data-toolkits/significant-features-property-tax",
          },
          {
            name: "IRS Publication 530",
            url: "https://www.irs.gov/publications/p530",
          },
        ]}
        updated="2022 ACS data, reviewed April 2026"
      />

      <InsightBlock entityName={county.county_name} insights={getCountyInsights(county, stateData ?? null, national)} />

      <TableOfContents />

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

      <PropertyTaxEstimator
        countyName={county.county_name}
        state={county.state}
        effectiveRate={county.effective_rate}
        stateAvgRate={stateData?.effective_rate ?? null}
      />

      <PropertyTaxCalculator
        defaultState={county.state}
        defaultRate={county.effective_rate}
        states={allStates.map((s) => ({
          abbr: s.abbr,
          state: s.state,
          avg_rate: s.avg_rate,
        }))}
      />

      {/* Why this matters — US homeowner context */}
      <section className="mb-8 mt-10" data-upgrade="why-it-matters">
        <h2 className="text-xl font-bold mb-3">
          Why {county.county_name} property tax matters
        </h2>
        <div className="rounded-lg border border-slate-200 bg-white p-5 text-slate-700 leading-relaxed space-y-3">
          {(() => {
            const rate = county.effective_rate;
            const annual = county.median_tax;
            const monthly = Math.round(annual / 12);
            const decade = annual * 10;
            const highTax = rate >= 1.5;
            const midTax = rate >= 0.8 && rate < 1.5;
            const lowTax = rate < 0.8;

            const primary = highTax
              ? `${county.county_name} sits in the higher band of US property taxes. At ${rate.toFixed(
                  2
                )}%, a homeowner here pays roughly ${fmt(
                  monthly
                )}/month on a ${fmt(
                  county.median_home_value
                )} home \u2014 about ${fmt(
                  decade
                )} across a decade. If you are shopping for a home or relocating, this is a line item that deserves the same weight as mortgage principal and interest.`
              : midTax
              ? `${county.county_name}'s effective rate of ${rate.toFixed(
                  2
                )}% is close to the US middle \u2014 not a bargain, not punitive. On a ${fmt(
                  county.median_home_value
                )} home that works out to about ${fmt(
                  monthly
                )}/month, or ${fmt(
                  annual
                )}/year. Mortgage lenders will typically roll this into your escrow, so your monthly payment will reflect it.`
              : `${county.county_name} is on the lower end of US property taxes at ${rate.toFixed(
                  2
                )}%. A ${fmt(
                  county.median_home_value
                )} home runs about ${fmt(
                  monthly
                )}/month in property tax \u2014 meaningful, but likely smaller than your insurance or HOA line. Lower rates also mean smaller fluctuation when the county reassesses values.`;

            const escrowNote = `If your mortgage is escrowed, the servicer collects one-twelfth of your annual property tax each month along with your payment. A shift in the county rate shows up on your monthly bill one or two months later.`;

            const actionableNote = `Homeowners who believe their assessed value is too high can file an assessment appeal with the county assessor's office. Every state also offers some form of homestead exemption or senior exemption \u2014 checking eligibility can trim your bill materially.`;

            const irsNote = `For federal income tax, state and local property taxes are deductible as part of the SALT deduction, capped at $10,000 per return (IRS Publication 530). High-tax counties hit this cap faster.`;

            return (
              <>
                <p>{primary}</p>
                <p>{escrowNote}</p>
                <p>{actionableNote}</p>
                <p className="text-sm text-slate-500">{irsNote}</p>
              </>
            );
          })()}
        </div>
      </section>

      {/* DecisionNext — 3 opinionated next steps */}
      <DecisionNext
        cards={[
          ...(stateData
            ? [
                {
                  title: `${stateData.state} statewide view`,
                  blurb: `Step back and see how ${county.county_name} compares to every other county in ${stateData.state}.`,
                  href: `/state/${stateData.slug}/`,
                  cta: `See ${stateData.state} rankings`,
                  tone: "indigo" as const,
                },
              ]
            : []),
          {
            title: `Run your own numbers`,
            blurb: `Plug in your home value to see the exact annual and monthly property tax you'd owe at the ${county.county_name} rate.`,
            href: `/calculator/`,
            cta: `Open calculator`,
            tone: "emerald" as const,
          },
          {
            title: `Salary-to-tax sanity check`,
            blurb: `Is your income high enough for this county's housing and tax load? Compare against local wage data.`,
            href: `https://salarybycity.com`,
            cta: `Check salary data`,
            tone: "amber" as const,
          },
        ].slice(0, 3)}
        heading="Next, check…"
      />

      <RelatedEntities
        entityName={county.county_name}
        heading={`Other ${county.state} counties`}
        statLabel="Tax rate"
        items={getRelatedCounties(county.state, slug, 8).map((r) => ({
          name: r.county_name,
          href: `/county/${r.slug}/`,
          stat: `${r.effective_rate.toFixed(2)}%`,
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

      {/* Compare with other counties — HCU 2026-04-24: filtered to the
          100-slug county-compare keep-set. Most /county/* pages will have 0
          links here (keep-set only covers ~27 states × 5 pairs). That's
          correct — linking to a 410 page would waste Google's crawl and
          dilute the /county/* signal we're protecting. */}
      {(() => {
        const inKeep = (otherSlug: string) =>
          COUNTY_COMPARE_KEEP_SET.has(`${county.slug}-vs-${otherSlug}`) ||
          COUNTY_COMPARE_KEEP_SET.has(`${otherSlug}-vs-${county.slug}`);
        const sameState = getCountiesByState(county.state)
          .filter((c) => c.slug !== county.slug && inKeep(c.slug))
          .slice(0, 8);
        const topCounties = getAllCounties()
          .filter((c) => c.state !== county.state && inKeep(c.slug))
          .slice(0, 8);
        if (sameState.length === 0 && topCounties.length === 0) return null;
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
            {topCounties.length > 0 && (
              <>
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
              </>
            )}
          </section>
        );
      })()}

      {/* FAQ Section */}
      {faqs.length > 0 && (
        <section className="mt-8 mb-8">
          <h2 className="text-xl font-bold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.question} className="border border-slate-200 rounded-lg">
                <summary className="px-4 py-3 font-medium cursor-pointer hover:bg-slate-50">{faq.question}</summary>
                <p className="px-4 pb-3 text-sm text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}
      <DataFeedback />
    </>
  );
}
