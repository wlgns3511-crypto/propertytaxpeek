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
import { DataFeedback } from "@/components/DataFeedback";
import { AnswerHero } from "@/components/upgrades/AnswerHero";
import { TrustBlock } from "@/components/upgrades/TrustBlock";
import { InsightBlock } from "@/components/upgrades/InsightBlock";
import { DecisionNext } from "@/components/upgrades/DecisionNext";
import { getCountyInsights } from "@/lib/insights";
import { RelatedEntities } from "@/components/upgrades/RelatedEntities";
import { TableOfContents } from "@/components/upgrades/TableOfContents";
import { DataSuppressedNotice } from "@/components/DataSuppressedNotice";
import { buildCountyView } from "@/lib/county-facts";
import { getStateAcs } from "@/lib/state-facts";
import {
  buildIntro,
  buildComparison,
  buildSeniorContext,
  buildOutlook,
  type TemplateCtx,
} from "@/lib/county-commentary";
import { VINTAGE_LABEL, VINTAGE_SHORT } from "@/lib/data-vintage";
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
  const view = buildCountyView(slug);

  // Suppressed → minimal metadata that doesn't claim a specific rate/tax.
  if (!view || view.kind === "suppressed") {
    const title = `${county.county_name}, ${county.state} Property Tax Overview`;
    const description = `Property tax overview for ${county.county_name}, ${county.state}. Population ${county.population.toLocaleString()}. ${VINTAGE_SHORT} estimate withheld this vintage; state-level context shown.`;
    return {
      title,
      description,
      alternates: {
        canonical: `/county/${slug}/`,
        languages: { en: `/county/${slug}/`, "x-default": `/county/${slug}/` },
      },
      openGraph: { title, description, url: `/county/${slug}/` },
    };
  }

  // Peer: same-state different county, prefer meaningfully different rate
  const sameState = getCountiesByState(county.state).filter((c) => c.slug !== slug);
  const peer = sameState.find((p) => {
    const d = Math.abs((p.effective_rate - view.effectiveRatePct) / Math.max(view.effectiveRatePct, 0.01));
    return d > 0.05 && d < 0.8;
  }) || sameState[0];

  let title: string;
  let description: string;
  if (peer) {
    const diff = peer.effective_rate - view.effectiveRatePct;
    const pct = Math.round((diff / Math.max(peer.effective_rate, 0.01)) * 100);
    const absPct = Math.abs(pct);
    const dir = pct > 0 ? "lower" : "higher";
    title = `${county.county_name}, ${county.state} Property Tax Rate: ${view.effectiveRatePct.toFixed(2)}% vs ${peer.county_name} ${peer.effective_rate.toFixed(2)}%`;
    description = `${county.county_name}, ${county.state} effective property tax rate ${view.effectiveRatePct.toFixed(2)}% — ${absPct}% ${dir} than ${peer.county_name}. Median tax ${fmt(view.taxesAnnual)} on ${fmt(view.homeValue)} home, pop ${county.population.toLocaleString()}. ${VINTAGE_SHORT}.`;
  } else {
    title = `${county.county_name}, ${county.state} Property Tax Rate: ${view.effectiveRatePct.toFixed(2)}%`;
    description = `${county.county_name}, ${county.state}: effective property tax rate ${view.effectiveRatePct.toFixed(2)}%. Median annual tax ${fmt(view.taxesAnnual)} on ${fmt(view.homeValue)} home value. ${VINTAGE_SHORT}.`;
  }

  return {
    title,
    description,
    alternates: {
      canonical: `/county/${slug}/`,
      languages: { en: `/county/${slug}/`, "x-default": `/county/${slug}/` },
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
  const stateAcs = getStateAcs(county.state.toUpperCase());
  const national = getNationalAverage();
  const allStates = getAllStates();
  const view = buildCountyView(slug);

  const trustSources = [
    {
      name: "US Census ACS 2024 5-Year",
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
  ];

  // ─────────────────────────────────────────────────────────────────────
  // Suppressed branch — no scaled-content county numbers shown. Page
  // renders state-level context + a held-data notice, keeps the URL alive
  // for GSC trust on the existing index entry.
  // ─────────────────────────────────────────────────────────────────────
  if (!view || view.kind === "suppressed") {
    const reason = view?.kind === "suppressed" ? view.reason : "Census ACS 2024 5-Year did not publish a usable estimate for this county";
    return (
      <>
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            ...(stateData ? [{ label: stateData.state, href: `/state/${stateData.slug}/` }] : []),
            { label: county.county_name },
          ]}
        />
        <AnswerHero
          title={`${county.county_name}, ${county.state}`}
          subtitle="Property tax overview"
          tagline={`Population ${county.population.toLocaleString()}. ${VINTAGE_SHORT} estimate held this vintage; ${stateData?.state ?? county.state} state-level numbers below.`}
          badges={[
            ...(stateData ? [{ label: `${stateData.state} state context`, tone: "indigo" as const }] : []),
            { label: "Estimate held", tone: "amber" as const },
          ]}
          alternatives={getCountiesByState(county.state)
            .filter((c) => c.slug !== county.slug)
            .slice(0, 3)
            .map((c) => ({ label: c.county_name, href: `/county/${c.slug}/` }))}
          alternativesLabel={`Other ${county.state} counties`}
        />
        <TrustBlock sources={trustSources} updated={VINTAGE_LABEL} />
        <DataSuppressedNotice
          countyName={county.county_name}
          state={county.state}
          reason={reason}
        />
        {stateAcs && (
          <section className="my-8">
            <h2 className="text-xl font-bold text-slate-800 mb-3">
              {stateAcs.name} statewide property tax
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              These state-level figures are reliable across {stateAcs.name} and a
              reasonable proxy while we hold the county estimate.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                  Effective rate
                </div>
                <div className="text-xl font-bold text-blue-800">
                  {stateAcs.effective_rate.toFixed(2)}%
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                  Median annual tax
                </div>
                <div className="text-xl font-bold text-blue-800">
                  {fmt(stateAcs.median_real_estate_taxes)}
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                  Median home value
                </div>
                <div className="text-xl font-bold text-blue-800">
                  {fmt(stateAcs.median_home_value)}
                </div>
              </div>
            </div>
          </section>
        )}
        <DecisionNext
          cards={[
            ...(stateData
              ? [
                  {
                    title: `${stateData.state} statewide view`,
                    blurb: `See how every ${stateData.state} county ranks on ACS 2024 5-Year property-tax data.`,
                    href: `/state/${stateData.slug}/`,
                    cta: `Open ${stateData.state} page`,
                    tone: "indigo" as const,
                  },
                ]
              : []),
            {
              title: `Run your own numbers`,
              blurb: `Use the calculator with state-level rate to estimate your bill while we hold this county figure.`,
              href: `/calculator/`,
              cta: `Open calculator`,
              tone: "emerald" as const,
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
        <DataFeedback />
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────────────
  // Kept branch — ACS 2024 5-Year passed the MOE filter. Real numbers.
  // ─────────────────────────────────────────────────────────────────────
  const taxesAnnual = view.taxesAnnual;
  const homeValue = view.homeValue;
  const effectiveRatePct = view.effectiveRatePct;

  const stateRatePct = stateAcs?.effective_rate ?? stateData?.effective_rate ?? 0;
  const stateMedianTax = stateAcs?.median_real_estate_taxes ?? stateData?.median_tax ?? 0;
  const stateMedianHomeValue = stateAcs?.median_home_value ?? stateData?.median_home_value ?? 0;

  const diffFromState = stateRatePct ? effectiveRatePct - stateRatePct : 0;
  const diffFromNational = effectiveRatePct - national.avg_rate;

  const ctx: TemplateCtx = {
    countyName: county.county_name,
    stateAbbr: county.state,
    stateName: stateData?.state ?? county.state,
    stateRatePct,
    stateMedianTax,
    nationalRatePct: national.avg_rate,
  };

  const intro = buildIntro(slug, view, ctx);
  const comparison = buildComparison(slug, view, ctx);
  const seniorPara = buildSeniorContext(slug, view, ctx);
  const outlook = buildOutlook(slug, view, ctx);

  // Augment the synthetic county FAQ generator with our ACS-derived
  // numbers — pass a synthesized object that shadows DB rate/tax/value.
  const acsCountyForFaqs = {
    ...county,
    effective_rate: effectiveRatePct,
    median_tax: taxesAnnual,
    median_home_value: homeValue,
  };
  const faqs = generateAutoFaqs(acsCountyForFaqs, stateData ?? null, national);
  const insights = getCountyInsights(acsCountyForFaqs, stateData ?? null, national);

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
        tagline={`Effective property tax rate ${effectiveRatePct.toFixed(2)}% — ${
          diffFromNational > 0
            ? `${diffFromNational.toFixed(2)}% above`
            : `${Math.abs(diffFromNational).toFixed(2)}% below`
        } the national average. Median annual tax ${fmt(taxesAnnual)} on a ${fmt(homeValue)} home.`}
        badges={[
          {
            label:
              diffFromNational > 0
                ? `${diffFromNational.toFixed(2)}% above US`
                : `${Math.abs(diffFromNational).toFixed(2)}% below US`,
            tone: diffFromNational > 0 ? "amber" : "emerald",
          },
          ...(stateData
            ? [{ label: `${stateData.state} state`, tone: "indigo" as const }]
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

      <TrustBlock sources={trustSources} updated={VINTAGE_LABEL} />

      <InsightBlock entityName={county.county_name} insights={insights} />

      <TableOfContents />

      <AdSlot id="4567890123" />

      {/* County Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-8">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Tax Rate
          </div>
          <div className="text-xl font-bold text-blue-800">
            {effectiveRatePct.toFixed(2)}%
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Median Tax
          </div>
          <div className="text-xl font-bold text-blue-800">{fmt(taxesAnnual)}</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Median Home Value
          </div>
          <div className="text-xl font-bold text-blue-800">{fmt(homeValue)}</div>
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
                {effectiveRatePct.toFixed(2)}%
              </td>
              <td className="px-4 py-2 text-right">{fmt(taxesAnnual)}</td>
              <td className="px-4 py-2 text-right">{fmt(homeValue)}</td>
            </tr>
            {stateData && stateRatePct > 0 && (
              <tr className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2">
                  <a
                    href={`/state/${stateData.slug}/`}
                    className="text-blue-600 hover:underline"
                  >
                    {stateData.state} (state avg)
                  </a>
                </td>
                <td className="px-4 py-2 text-right">{stateRatePct.toFixed(2)}%</td>
                <td className="px-4 py-2 text-right">{fmt(stateMedianTax)}</td>
                <td className="px-4 py-2 text-right">{fmt(stateMedianHomeValue)}</td>
              </tr>
            )}
            <tr className="border-t border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-2">National Average</td>
              <td className="px-4 py-2 text-right">{national.avg_rate.toFixed(2)}%</td>
              <td className="px-4 py-2 text-right">{fmt(national.avg_median_tax)}</td>
              <td className="px-4 py-2 text-right">{fmt(national.avg_home_value)}</td>
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
              { label: county.county_name, value: effectiveRatePct },
              ...(stateRatePct > 0
                ? [{ label: `${stateData?.state ?? county.state} avg`, value: stateRatePct }]
                : []),
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
              { label: county.county_name, value: taxesAnnual },
              ...(stateMedianTax > 0
                ? [{ label: `${stateData?.state ?? county.state} avg`, value: stateMedianTax }]
                : []),
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
        effectiveRate={effectiveRatePct}
        stateAvgRate={stateRatePct || null}
      />

      <PropertyTaxCalculator
        defaultState={county.state}
        defaultRate={effectiveRatePct}
        states={allStates.map((s) => ({
          abbr: s.abbr,
          state: s.state,
          avg_rate: s.avg_rate,
        }))}
      />

      {/* Why this matters — fact-bound commentary, slug-hash rotated */}
      <section className="mb-8 mt-10" data-upgrade="why-it-matters">
        <h2 className="text-xl font-bold mb-3">
          Why {county.county_name} property tax matters
        </h2>
        <div className="rounded-lg border border-slate-200 bg-white p-5 text-slate-700 leading-relaxed space-y-3">
          <p>{intro}</p>
          <p>{comparison}</p>
          {seniorPara && <p>{seniorPara}</p>}
          <p className="text-sm text-slate-500">{outlook}</p>
        </div>
      </section>

      {/* Senior household context — only when ACS reports B19049_005 */}
      {view.seniorBurdenStatus && view.seniorIncome != null && view.seniorBurdenPct != null && (
        <section
          className="mb-8 rounded-lg border-l-4 border-indigo-300 bg-indigo-50 p-5"
          data-upgrade="senior-context"
        >
          <h2 className="text-lg font-semibold text-indigo-900 mb-2">
            Senior household burden in {county.county_name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
            <div className="bg-white rounded-md p-3 border border-indigo-100">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                Median income, age 65+
              </div>
              <div className="text-lg font-bold text-indigo-900">
                {fmt(view.seniorIncome)}
              </div>
            </div>
            <div className="bg-white rounded-md p-3 border border-indigo-100">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                Senior tax-to-income
              </div>
              <div className="text-lg font-bold text-indigo-900">
                {view.seniorBurdenPct.toFixed(2)}%
              </div>
            </div>
            <div className="bg-white rounded-md p-3 border border-indigo-100">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                Burden status
              </div>
              <div className="text-lg font-bold text-indigo-900 capitalize">
                {view.seniorBurdenStatus}
              </div>
            </div>
          </div>
          <p className="text-xs text-indigo-700 mt-3">
            Median household income for owners age 65+ via Census ACS 2024 5-Year
            (table B19049). Senior tax-to-income is computed against the median
            property tax for the county.
          </p>
        </section>
      )}

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
        <h2>{county.county_name} Property Tax Information</h2>
        <p>
          Property owners in {county.county_name}, {county.state} pay a median
          annual property tax of {fmt(taxesAnnual)}. The effective tax rate of{" "}
          {effectiveRatePct.toFixed(2)}% is{" "}
          {diffFromState > 0 ? "higher" : "lower"} than the{" "}
          {stateData?.state || county.state} state average
          {stateRatePct > 0 ? ` of ${stateRatePct.toFixed(2)}%` : ""}.
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
          100-slug county-compare keep-set. */}
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
                <summary className="px-4 py-3 font-medium cursor-pointer hover:bg-slate-50">
                  {faq.question}
                </summary>
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
