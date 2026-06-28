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
import { AuthorBox } from "@/components/AuthorBox";
import { calculateProprietaryMetrics } from "@/lib/proprietary-metrics";
import { ProprietaryMetricsBlock } from "@/components/upgrades/ProprietaryMetricsBlock";
import { EDITORIAL_TEAM } from "@/lib/authorship";
import { COUNTY_VINTAGE, EXEMPTION_VINTAGE } from "@/lib/authorship";
import { datasetSchema } from "@/lib/schema";
import countyCompareKeep from "@/lib/generated/county-compare-keep.json";
import { getStateExemptionData } from "@/lib/state-exemption-data";
import {
  decodeEffectiveRate,
  tierLabel as rateTierLabel,
  tierBlurb as rateTierBlurb,
  tierToneColor as rateTierToneColor,
  RATE_TIER_CUTOFF_SUMMARY,
} from "@/lib/effective-rate-decoder";
import {
  classifyHomesteadExemptionMatrix,
  tierLabel as matrixTierLabel,
  tierToneColor as matrixTierToneColor,
  TIER_AXIS_SUMMARY,
} from "@/lib/homestead-exemption-matrix";
import {
  classifyIncomeBurden,
  tierLabel as burdenTierLabel,
  tierBlurb as burdenTierBlurb,
  tierToneColor as burdenTierToneColor,
  INCOME_BURDEN_CUTOFF_SUMMARY,
} from "@/lib/proptax-income-burden-band";
import {
  burdenTierLetter,
  effectiveRateTierLetter,
  BURDEN_AND_RATE_CROSSWALK_SOURCES,
} from "@/lib/crosswalk-burden-and-rate";
import {
  classifyAssessmentAppealSuccess,
  tierLabel as appealTierLabel,
  tierBlurb as appealTierBlurb,
  tierToneColor as appealTierToneColor,
  APPEAL_TIER_CUTOFF_SUMMARY,
} from "@/lib/assessment-appeal-success-tier";
import { interpretPropertyTax } from "@/lib/propertytax-interpretation";
import { PropertyTaxInterpretation } from "@/components/upgrades/PropertyTaxInterpretation";
import { CountyChoropleth } from "@/components/CountyChoropleth";
import { CountyCrossWalkBridge } from "@/components/CountyCrossWalkBridge";
import {
  getVaVehicleTax,
  classifyVaVehicleRate,
  VA_VEHICLE_TAX_DISTRIBUTION,
  VA_VEHICLE_TAX_SOURCE,
} from "@/lib/va-vehicle-tax";
import { VehicleTaxCard } from "@/components/upgrades/VehicleTaxCard";

// Verdict-card tone lookup — static so Tailwind JIT discovers all classes.
// Mirrors the AppealSimulator verdict palette for visual continuity between
// the per-state tier card and the per-property simulator output.
const VERDICT_TONE: Record<string, {
  panelBg: string; panelBorder: string; barBorder: string;
  badgeBg: string; badgeText: string; heading: string; body: string;
}> = {
  emerald: {
    panelBg: "bg-emerald-50", panelBorder: "border-emerald-200", barBorder: "border-emerald-700",
    badgeBg: "bg-emerald-700", badgeText: "text-emerald-50",
    heading: "text-emerald-900", body: "text-emerald-900",
  },
  amber: {
    panelBg: "bg-amber-50", panelBorder: "border-amber-200", barBorder: "border-amber-700",
    badgeBg: "bg-amber-700", badgeText: "text-amber-50",
    heading: "text-amber-900", body: "text-amber-900",
  },
  rose: {
    panelBg: "bg-rose-50", panelBorder: "border-rose-200", barBorder: "border-rose-700",
    badgeBg: "bg-rose-700", badgeText: "text-rose-50",
    heading: "text-rose-900", body: "text-rose-900",
  },
};

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
    // VA exception: the tangible personal property (vehicle) rate is sourced
    // from VA Dept of Taxation — NOT the held ACS estimate — so it's still
    // valid here. Lead with it (vehicle-solo, ≤60c: "Virginia Beach, VA:
    // $4.00/$100 Vehicle (Car) Tax 2025" = 53c) where we carry the rate.
    const vaVehicleSup = getVaVehicleTax(slug);
    if (vaVehicleSup) {
      const vbs = classifyVaVehicleRate(vaVehicleSup.personalPropertyRate);
      const titleAbs = `${county.county_name}, ${county.state}: $${vaVehicleSup.personalPropertyRate.toFixed(
        2,
      )}/$100 Vehicle (Car) Tax ${VA_VEHICLE_TAX_SOURCE.taxYear}`;
      const descSup = `${county.county_name}, ${county.state} personal property (vehicle / "car") tax: $${vaVehicleSup.personalPropertyRate.toFixed(
        2,
      )} per $100 of assessed value — ${vbs.label.charAt(0).toLowerCase()}${vbs.label.slice(
        1,
      )} (Virginia median $${VA_VEHICLE_TAX_DISTRIBUTION.median.toFixed(
        2,
      )}). Real estate estimate held this vintage. Source: VA Dept of Taxation TY ${VA_VEHICLE_TAX_SOURCE.taxYear}.`;
      return {
        title: { absolute: titleAbs },
        description: descSup,
        alternates: {
          canonical: `/county/${slug}/`,
          languages: { en: `/county/${slug}/`, "x-default": `/county/${slug}/` },
        },
        openGraph: { title: titleAbs, description: descSup, url: `/county/${slug}/` },
      };
    }
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

  // Phase 7 P1 v2 (2026-05-24) — concrete $/% verdict-in-title.
  // Prior pattern surfaced abstract "Tier C Notable Burden" — 0% CTR at
  // pos 1-5 in GSC (audit 2026-05-24 GONE-vs-KEPT breakdown showed the
  // /compare/ leak was deindex zombies; for /county/ the leak is title
  // abstraction). New pattern leads with median annual tax in dollars
  // (the search-intent answer) + effective rate as secondary verdict.
  //   Worst case across 2780-county cohort:
  //     "Prince of Wales-Hyder Census Area, AK: $13,502 Tax · 2.86%"  = 58c
  //   Typical:
  //     "Los Angeles, CA: $4,750 Tax · 0.77%"                          = 36c
  //   Uses title.absolute to bypass the " | PropertyTaxPeek" suffix
  //   (template would push worst case to 77c). Description still carries
  //   the burden-tier surface for AI/extraction layers.
  const titleBurden = classifyIncomeBurden({
    taxesAnnual: view.taxesAnnual,
    medianIncome: view.householdIncome,
  });
  const titleBurdenLetter = burdenTierLetter(titleBurden.tier);

  const titleAbsolute = `${county.county_name}, ${county.state}: ${fmt(view.taxesAnnual)} Tax · ${view.effectiveRatePct.toFixed(2)}%`;

  let description: string;
  if (titleBurden.tier && titleBurdenLetter) {
    const burdenLabel = burdenTierLabel(titleBurden.tier);
    const peerSuffix = peer
      ? ` Peer: ${peer.county_name} ${peer.effective_rate.toFixed(2)}%.`
      : '';
    description = `${county.county_name}, ${county.state}: ${burdenLabel.toLowerCase()} income-burden tier (${(titleBurden.burdenPct ?? 0).toFixed(1)}% of median household income), ${view.effectiveRatePct.toFixed(2)}% effective rate. Median tax ${fmt(view.taxesAnnual)} on ${fmt(view.homeValue)} home, pop ${county.population.toLocaleString()}.${peerSuffix} ${VINTAGE_SHORT}.`;
  } else if (peer) {
    const diff = peer.effective_rate - view.effectiveRatePct;
    const pct = Math.round((diff / Math.max(peer.effective_rate, 0.01)) * 100);
    const absPct = Math.abs(pct);
    const dir = pct > 0 ? "lower" : "higher";
    description = `${county.county_name}, ${county.state} effective property tax rate ${view.effectiveRatePct.toFixed(2)}% — ${absPct}% ${dir} than ${peer.county_name}. Median tax ${fmt(view.taxesAnnual)} on ${fmt(view.homeValue)} home, pop ${county.population.toLocaleString()}. ${VINTAGE_SHORT}.`;
  } else {
    description = `${county.county_name}, ${county.state}: effective property tax rate ${view.effectiveRatePct.toFixed(2)}%. Median annual tax ${fmt(view.taxesAnnual)} on ${fmt(view.homeValue)} home value. ${VINTAGE_SHORT}.`;
  }

  // Virginia "car tax" override. VA's dominant local property-tax search is the
  // tangible personal property (vehicle) rate — a tax DISTINCT from real estate
  // — so lead the title/description with it where we carry the VA Dept of
  // Taxation TY 2025 rate. Pre-flight title-cap math (Trap #112, ≤60c): the
  // worst-case VA locality is
  //   "Prince William County, VA: $4.15/$100 Vehicle · 0.94% Home" = 58c.
  const vaVehicle = getVaVehicleTax(slug);
  let titleOut = titleAbsolute;
  let descriptionOut = description;
  if (vaVehicle) {
    const vb = classifyVaVehicleRate(vaVehicle.personalPropertyRate);
    titleOut = `${county.county_name}, ${county.state}: $${vaVehicle.personalPropertyRate.toFixed(
      2,
    )}/$100 Vehicle · ${view.effectiveRatePct.toFixed(2)}% Home`;
    descriptionOut = `${county.county_name}, ${county.state} personal property (vehicle / "car") tax: $${vaVehicle.personalPropertyRate.toFixed(
      2,
    )} per $100 of assessed value — ${vb.label.charAt(0).toLowerCase()}${vb.label.slice(
      1,
    )}. Separate from the real estate tax (${view.effectiveRatePct.toFixed(
      2,
    )}% effective, median ${fmt(view.taxesAnnual)}). Source: VA Dept of Taxation TY ${VA_VEHICLE_TAX_SOURCE.taxYear} + Census ACS 2024.`;
  }

  const taxesAnnual = (view && view.kind === "kept") ? view.taxesAnnual : 0;
  const homeValue = (view && view.kind === "kept") ? view.homeValue : 0;
  const effectiveRatePct = (view && view.kind === "kept") ? view.effectiveRatePct : county.effective_rate;
  const householdIncome = (view && view.kind === "kept") ? view.householdIncome : 0;

  const metrics = calculateProprietaryMetrics(
    county.county_name,
    slug,
    taxesAnnual,
    homeValue,
    effectiveRatePct,
    householdIncome
  );
  const finalDescription = `[Property Tax Profile: Affordability Grade ${metrics.overallGrade}, Effective Rate Score ${metrics.rateScore}/100] ` + descriptionOut;

  return {
    title: { absolute: titleOut },
    description: finalDescription,
    alternates: {
      canonical: `/county/${slug}/`,
      languages: { en: `/county/${slug}/`, "x-default": `/county/${slug}/` },
    },
    openGraph: { title: titleOut, description: finalDescription, url: `/county/${slug}/` },
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
    // VA vehicle ("car") tax is sourced from VA Dept of Taxation, NOT the held
    // ACS estimate, so it's still valid on a suppressed page (e.g. Virginia
    // Beach). realEstateEffectivePct is null here — estimate held this vintage.
    const vaVehicleRecSup = getVaVehicleTax(slug);
    const vaVehicleVerdictSup = vaVehicleRecSup
      ? classifyVaVehicleRate(vaVehicleRecSup.personalPropertyRate)
      : null;
    const taxesAnnual = 0;
    const homeValue = 0;
    const effectiveRatePct = county.effective_rate;
    const householdIncome = 0;

    const metrics = calculateProprietaryMetrics(
      county.county_name,
      slug,
      taxesAnnual,
      homeValue,
      effectiveRatePct,
      householdIncome
    );

    return (
      <article data-toc-root>
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
        <TrustBlock
          sources={[
            { name: "US Census ACS 2024 5-Year", url: "https://www.census.gov/programs-surveys/acs/" },
            { name: "Census S&L Finances", url: "https://www.census.gov/programs-surveys/gov-finances.html" },
          ]}
          updated={VINTAGE_LABEL}
        />
        <ProprietaryMetricsBlock {...metrics} />
        <DataSuppressedNotice
          countyName={county.county_name}
          state={county.state}
          reason={reason}
        />
        {/* VA vehicle tax stays valid even when the ACS real-estate estimate is
            held (separately sourced from VA Dept of Taxation). */}
        {vaVehicleRecSup && vaVehicleVerdictSup && (
          <>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "Dataset",
                  name: `${county.county_name}, ${county.state} Vehicle (Personal Property) Tax Rate — TY ${VA_VEHICLE_TAX_SOURCE.taxYear}`,
                  description: `${county.county_name}, ${county.state} tangible personal property ("car") tax rate: $${vaVehicleRecSup.personalPropertyRate.toFixed(
                    2,
                  )} per $100 of assessed value (${vaVehicleVerdictSup.label}). Distinct from the real estate property tax. Gross nominal rate before any Personal Property Tax Relief Act subsidy.`,
                  url: `https://propertytaxpeek.com/county/${slug}/`,
                  license: "https://creativecommons.org/publicdomain/zero/1.0/",
                  creator: {
                    "@type": "GovernmentOrganization",
                    name: VA_VEHICLE_TAX_SOURCE.publisher,
                    url: VA_VEHICLE_TAX_SOURCE.url,
                  },
                  isBasedOn: [VA_VEHICLE_TAX_SOURCE.url],
                  spatialCoverage: `${county.county_name}, ${
                    stateData?.state ?? county.state
                  }, USA`,
                  temporalCoverage: String(VA_VEHICLE_TAX_SOURCE.taxYear),
                  dateModified: VA_VEHICLE_TAX_SOURCE.retrieved,
                  variableMeasured: [
                    {
                      "@type": "PropertyValue",
                      name: "tangible_personal_property_rate_per_100",
                      value: vaVehicleRecSup.personalPropertyRate,
                      unitText: "USD per $100 of assessed value",
                      description: `${vaVehicleVerdictSup.label} — Virginia median $${VA_VEHICLE_TAX_DISTRIBUTION.median.toFixed(
                        2,
                      )} across ${VA_VEHICLE_TAX_DISTRIBUTION.n} localities`,
                    },
                  ],
                }),
              }}
            />
            <VehicleTaxCard
              localityName={county.county_name}
              rate={vaVehicleRecSup.personalPropertyRate}
              band={vaVehicleVerdictSup.band}
              bandLabel={vaVehicleVerdictSup.label}
              median={VA_VEHICLE_TAX_DISTRIBUTION.median}
              n={VA_VEHICLE_TAX_DISTRIBUTION.n}
              realEstateEffectivePct={null}
              sourceUrl={VA_VEHICLE_TAX_SOURCE.url}
              taxYear={VA_VEHICLE_TAX_SOURCE.taxYear}
            />
          </>
        )}
        <AuthorBox
          vintage={COUNTY_VINTAGE}
          source={`${county.county_name}, ${county.state} (estimate held)`}
          showDisclaimer
        />
        {stateAcs && (
          <section className="my-8">
            <h2 className="text-xl font-bold text-stone-800 mb-3">
              {stateAcs.name} statewide property tax
            </h2>
            <p className="text-sm text-stone-600 mb-4">
              These state-level figures are reliable across {stateAcs.name} and a
              reasonable proxy while we hold the county estimate.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <div className="text-xs text-stone-500 uppercase tracking-wider mb-1">
                  Effective rate
                </div>
                <div className="text-xl font-bold text-amber-900">
                  {stateAcs.effective_rate.toFixed(2)}%
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <div className="text-xs text-stone-500 uppercase tracking-wider mb-1">
                  Median annual tax
                </div>
                <div className="text-xl font-bold text-amber-900">
                  {fmt(stateAcs.median_real_estate_taxes)}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <div className="text-xs text-stone-500 uppercase tracking-wider mb-1">
                  Median home value
                </div>
                <div className="text-xl font-bold text-amber-900">
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
      </article>
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

  // Phase 6 v6.4 PSU dual-lever readings — editorial layers.
  // Resolve the state's exemption record by slug (state-level), then
  // run both deterministic readers against the county-level effective
  // rate plus national + state means.
  const stateSlug = stateData?.slug;
  const countyStateExemption = stateSlug ? getStateExemptionData(stateSlug) : undefined;
  const countyRateDecoder = decodeEffectiveRate({
    effectiveRatePct,
    nationalAvgPct: national.avg_rate,
    stateAvgPct: stateRatePct || null,
    stateExemption: countyStateExemption,
  });
  const countyMatrixResult = classifyHomesteadExemptionMatrix(countyStateExemption);
  const countyBurdenResult = classifyIncomeBurden({
    taxesAnnual,
    medianIncome: view.householdIncome,
  });
  const countyAppealResult = classifyAssessmentAppealSuccess(county.state);
  const countyInterpretation = interpretPropertyTax({
    countyName: county.county_name,
    stateName: stateData?.state ?? county.state,
    rate: countyRateDecoder,
    burden: countyBurdenResult,
    matrix: countyMatrixResult,
    appeal: countyAppealResult,
  });
  const countyRateTone = rateTierToneColor(countyRateDecoder.tier);
  const countyMatrixTone = matrixTierToneColor(countyMatrixResult.tier);
  const countyBurdenTone = burdenTierToneColor(countyBurdenResult.tier);
  const countyAppealTone = appealTierToneColor(countyAppealResult.tier);
  const appealVerdictColors = VERDICT_TONE[countyAppealTone] ?? VERDICT_TONE.amber;

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

  // Virginia tangible personal property (vehicle / "car") tax — a tax DISTINCT
  // from the real estate rate above. Only VA localities carry a record (null
  // elsewhere). Source: VA Dept of Taxation TY 2025, transcribed row-for-row.
  const vaVehicleRec = getVaVehicleTax(slug);
  const vaVehicleVerdict = vaVehicleRec
    ? classifyVaVehicleRate(vaVehicleRec.personalPropertyRate)
    : null;

  // Append a VA car-tax FAQ so the on-page answer matches Virginia's dominant
  // local query ("{county} va personal property tax rate vehicles"). Honest:
  // gross nominal rate, separate from real estate, PPTRA relief flagged.
  if (vaVehicleRec && vaVehicleVerdict) {
    faqs.push({
      question: `What is the personal property (vehicle) tax rate in ${county.county_name}, ${county.state}?`,
      answer: `${county.county_name} levies a tangible personal property ("car") tax of $${vaVehicleRec.personalPropertyRate.toFixed(
        2,
      )} per $100 of assessed value for TY ${VA_VEHICLE_TAX_SOURCE.taxYear} — ${vaVehicleVerdict.label
        .charAt(0)
        .toLowerCase()}${vaVehicleVerdict.label.slice(
        1,
      )} (Virginia median $${VA_VEHICLE_TAX_DISTRIBUTION.median.toFixed(
        2,
      )} across ${VA_VEHICLE_TAX_DISTRIBUTION.n} localities). This is separate from the real estate property tax (${effectiveRatePct.toFixed(
        2,
      )}% effective). The figure is the gross nominal rate before any Personal Property Tax Relief Act subsidy on qualifying personal-use vehicles; confirm with your local Commissioner of the Revenue. Source: Virginia Department of Taxation, Tax Rates for County, City, Town, and Districts, TY ${VA_VEHICLE_TAX_SOURCE.taxYear}.`,
    });
  }

  const metrics = calculateProprietaryMetrics(
    county.county_name,
    slug,
    taxesAnnual,
    homeValue,
    effectiveRatePct,
    view.householdIncome
  );

  return (
    <article data-toc-root>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            datasetSchema(
              `${county.county_name}, ${county.state} Property Tax Rate`,
              `Effective property tax rate ${effectiveRatePct.toFixed(
                2,
              )}%, median annual tax ${fmt(taxesAnnual)} on a ${fmt(
                homeValue,
              )} median home value, for ${county.county_name}, ${county.state}.`,
              {
                url: `/county/${slug}/`,
                dateModified: COUNTY_VINTAGE,
                spatialCoverage: `${county.county_name}, ${
                  stateData?.state ?? county.state
                }, USA`,
                variableMeasured: [
                  "effective_property_tax_rate_pct",
                  "median_real_estate_taxes_usd",
                  "median_home_value_usd",
                  "population",
                ],
              },
            ),
          ),
        }}
      />
      {/* Phase 7 P4 — Cross-walk Dataset JSON-LD. Emits a 4-distinct-org
          creator array (Census + IRS + Lincoln Institute + Tax Foundation)
          and surfaces the IncomeBurdenTier × EffectiveRateTier composed
          verdict as PropertyValue entries. Mitigates Trap T-P4-1
          (creator-self) and T-P4-2 (variable-missing-verdict). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Dataset",
            name: `${county.county_name}, ${county.state} Property Tax Burden × Effective Rate Cross-Walk`,
            description: `Composed verdict for ${county.county_name}, ${county.state}: IncomeBurdenTier ${burdenTierLetter(countyBurdenResult.tier) ?? "suppressed"} (${countyBurdenResult.burdenPct != null ? `${countyBurdenResult.burdenPct.toFixed(1)}% of median household income` : "income suppressed"}) × EffectiveRateTier ${effectiveRateTierLetter(countyRateDecoder.tier) ?? "—"} (${effectiveRatePct.toFixed(2)}% of home value). Composed from Census ACS B25103/B25077/B19013, IRS §164(b)(6) SALT $10K cap, Lincoln Institute exemption mechanics, and Tax Foundation state rankings.`,
            url: `https://propertytaxpeek.com/county/${slug}/`,
            license: "https://creativecommons.org/publicdomain/zero/1.0/",
            creator: BURDEN_AND_RATE_CROSSWALK_SOURCES.map((s) => ({
              "@type": "Organization",
              name: s.name,
              url: s.url,
            })),
            isBasedOn: BURDEN_AND_RATE_CROSSWALK_SOURCES.map((s) => s.url),
            spatialCoverage: `${county.county_name}, ${stateData?.state ?? county.state}, USA`,
            temporalCoverage: "2020/2024",
            datePublished: "2026-05-19",
            dateModified: COUNTY_VINTAGE,
            variableMeasured: [
              {
                "@type": "PropertyValue",
                name: "IncomeBurdenTier",
                value: burdenTierLetter(countyBurdenResult.tier) ?? "suppressed",
                description: countyBurdenResult.tier
                  ? `${burdenTierLabel(countyBurdenResult.tier)} — tax ÷ median household income quintile band (BurdenA <1.7% / B <2.3% / C <2.9% / D <3.8% / E ≥3.8%)`
                  : "Burden tier suppressed (median household income unavailable)",
              },
              {
                "@type": "PropertyValue",
                name: "EffectiveRateTier",
                value: effectiveRateTierLetter(countyRateDecoder.tier) ?? "—",
                description: countyRateDecoder.tier
                  ? `${rateTierLabel(countyRateDecoder.tier)} — tax ÷ home value quintile band (A <0.5% / B <0.9% / C <1.5% / D <2% / E ≥2%)`
                  : "Rate tier suppressed (effective rate unavailable)",
              },
              {
                "@type": "PropertyValue",
                name: "effective_property_tax_rate_pct",
                value: Number(effectiveRatePct.toFixed(2)),
                unitText: "%",
              },
              {
                "@type": "PropertyValue",
                name: "median_real_estate_taxes_usd",
                value: taxesAnnual,
                unitText: "USD",
              },
              {
                "@type": "PropertyValue",
                name: "median_home_value_usd",
                value: homeValue,
                unitText: "USD",
              },
              {
                "@type": "PropertyValue",
                name: "median_household_income_usd",
                value: view.householdIncome ?? null,
                unitText: "USD",
              },
            ],
          }),
        }}
      />
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          ...(stateData
            ? [{ label: stateData.state, href: `/state/${stateData.slug}/` }]
            : []),
          { label: county.county_name },
        ]}
      />

      {/* Custom county hero — propertytaxpeek-specific (rate-focused with
          visual county-vs-US comparison bar). Replaces the shared AnswerHero
          template to break the generic-detail-page look. */}
      <div className="my-6">
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] uppercase tracking-widest text-stone-500">
          <span>Source · Census {VINTAGE_SHORT}</span>
          <span className="text-stone-300">|</span>
          <span>Population · {county.population.toLocaleString()}</span>
          {stateData && (
            <>
              <span className="text-stone-300">|</span>
              <a href={`/state/${stateData.slug}/`} className="text-amber-800 hover:underline normal-case tracking-normal">
                ↑ {stateData.state} state context
              </a>
            </>
          )}
        </div>

        <h1 className="text-3xl font-bold text-stone-900 leading-tight">
          {county.county_name}, {county.state}
          <span className="text-stone-500 font-normal text-xl ml-2 align-baseline">— property tax</span>
        </h1>

        <div className="mt-5 mb-5 max-w-md">
          <div className="flex items-baseline gap-3 mb-1">
            <span className="text-4xl font-bold text-amber-800 tabular-nums">{effectiveRatePct.toFixed(2)}%</span>
            <span className="text-sm text-stone-600">
              effective rate ·{" "}
              {diffFromNational > 0 ? (
                <span className="text-red-700 font-medium">{diffFromNational.toFixed(2)}% above US</span>
              ) : (
                <span className="text-emerald-700 font-medium">{Math.abs(diffFromNational).toFixed(2)}% below US</span>
              )}
            </span>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-3 text-xs text-stone-600">
              <span className="w-20 truncate">US average</span>
              <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-stone-400" style={{ width: `${Math.min(100, (national.avg_rate / Math.max(effectiveRatePct, national.avg_rate)) * 100)}%` }} />
              </div>
              <span className="w-12 tabular-nums text-right">{national.avg_rate.toFixed(2)}%</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-stone-800">
              <span className="w-20 font-medium truncate">{county.county_name.replace(" County", "")}</span>
              <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-700" style={{ width: `${Math.min(100, (effectiveRatePct / Math.max(effectiveRatePct, national.avg_rate)) * 100)}%` }} />
              </div>
              <span className="w-12 tabular-nums text-right font-medium">{effectiveRatePct.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        <p className="text-stone-700 max-w-2xl">
          Median annual property tax{" "}
          <strong className="tabular-nums">{fmt(taxesAnnual)}</strong> on a{" "}
          <strong className="tabular-nums">{fmt(homeValue)}</strong> home value.
        </p>

        {getCountiesByState(county.state).filter((c) => c.slug !== county.slug).length > 0 && (
          <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
            <span className="text-xs uppercase tracking-widest text-stone-500">
              Compare {county.state} counties:
            </span>
            {getCountiesByState(county.state)
              .filter((c) => c.slug !== county.slug)
              .slice(0, 3)
              .map((c) => (
                <a
                  key={c.slug}
                  href={`/county/${c.slug}/`}
                  className="text-amber-800 hover:underline"
                >
                  {c.county_name}{" "}
                  <span className="text-stone-500 tabular-nums">
                    ({c.effective_rate.toFixed(2)}%)
                  </span>
                </a>
              ))}
          </div>
        )}
      </div>

      <TrustBlock
        sources={[
          { name: "US Census ACS 2024 5-Year", url: "https://www.census.gov/programs-surveys/acs/" },
          { name: "Census S&L Finances", url: "https://www.census.gov/programs-surveys/gov-finances.html" },
        ]}
        updated={VINTAGE_LABEL}
      />

      <ProprietaryMetricsBlock {...metrics} />

      <CountyChoropleth
        counties={getAllCounties().map((c) => ({
          slug: c.slug,
          county_name: c.county_name,
          state: c.state,
          effective_rate: c.effective_rate,
          median_tax: c.median_tax,
          median_home_value: c.median_home_value,
          population: c.population,
        }))}
        currentSlug={slug}
        currentStateCode={county.state}
        variant="compact"
      />

      {/* PSU 1차 composite verdict — four-lever interpretation atop the
          rate / burden / matrix / appeal classifiers. */}
      <PropertyTaxInterpretation interpretation={countyInterpretation} />

      {/* Virginia tangible personal property ("car tax") — a tax DISTINCT from
          real estate. High-intent for VA, so rendered near the top. Card +
          a separately-attributed Dataset JSON-LD (creator = VA Dept of
          Taxation, NOT Census — avoids Trap #105 creator-misattribution). */}
      {vaVehicleRec && vaVehicleVerdict && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Dataset",
                name: `${county.county_name}, ${county.state} Vehicle (Personal Property) Tax Rate — TY ${VA_VEHICLE_TAX_SOURCE.taxYear}`,
                description: `${county.county_name}, ${county.state} tangible personal property ("car") tax rate: $${vaVehicleRec.personalPropertyRate.toFixed(
                  2,
                )} per $100 of assessed value (${vaVehicleVerdict.label}). Distinct from the real estate property tax. Gross nominal rate before any Personal Property Tax Relief Act subsidy.`,
                url: `https://propertytaxpeek.com/county/${slug}/`,
                license: "https://creativecommons.org/publicdomain/zero/1.0/",
                creator: {
                  "@type": "GovernmentOrganization",
                  name: VA_VEHICLE_TAX_SOURCE.publisher,
                  url: VA_VEHICLE_TAX_SOURCE.url,
                },
                isBasedOn: [VA_VEHICLE_TAX_SOURCE.url],
                spatialCoverage: `${county.county_name}, ${
                  stateData?.state ?? county.state
                }, USA`,
                temporalCoverage: String(VA_VEHICLE_TAX_SOURCE.taxYear),
                dateModified: VA_VEHICLE_TAX_SOURCE.retrieved,
                variableMeasured: [
                  {
                    "@type": "PropertyValue",
                    name: "tangible_personal_property_rate_per_100",
                    value: vaVehicleRec.personalPropertyRate,
                    unitText: "USD per $100 of assessed value",
                    description: `${vaVehicleVerdict.label} — Virginia median $${VA_VEHICLE_TAX_DISTRIBUTION.median.toFixed(
                      2,
                    )} across ${VA_VEHICLE_TAX_DISTRIBUTION.n} localities`,
                  },
                ],
              }),
            }}
          />
          <VehicleTaxCard
            localityName={county.county_name}
            rate={vaVehicleRec.personalPropertyRate}
            band={vaVehicleVerdict.band}
            bandLabel={vaVehicleVerdict.label}
            median={VA_VEHICLE_TAX_DISTRIBUTION.median}
            n={VA_VEHICLE_TAX_DISTRIBUTION.n}
            realEstateEffectivePct={effectiveRatePct}
            sourceUrl={VA_VEHICLE_TAX_SOURCE.url}
            taxYear={VA_VEHICLE_TAX_SOURCE.taxYear}
          />
        </>
      )}

      {/* EffectiveRateVsAssessmentDecoder — county-level editorial reading */}
      {countyRateDecoder.tier && (
        <section
          className={`my-8 rounded-xl border ${countyRateTone.border} ${countyRateTone.bg} p-6`}
          data-upgrade="effective-rate-decoder"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
            <h2 className={`text-lg font-bold ${countyRateTone.text}`}>
              {county.county_name} effective-rate band: {rateTierLabel(countyRateDecoder.tier)}
            </h2>
            <span className="text-xs text-stone-500">
              Editorial reading · Census {VINTAGE_SHORT}
            </span>
          </div>
          <p className={`text-sm leading-relaxed ${countyRateTone.text} mb-3`}>
            {rateTierBlurb(countyRateDecoder.tier)}
          </p>
          <div className="text-sm text-stone-700 grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <div className="bg-white/60 rounded-md px-3 py-2 border border-stone-200">
              <div className="text-xs uppercase tracking-wider text-stone-500">Effective rate</div>
              <div className="text-lg font-bold text-stone-900">
                {countyRateDecoder.effectiveRatePct?.toFixed(2)}%
              </div>
            </div>
            <div className="bg-white/60 rounded-md px-3 py-2 border border-stone-200">
              <div className="text-xs uppercase tracking-wider text-stone-500">vs US</div>
              <div className="text-lg font-bold text-stone-900">
                {countyRateDecoder.nationalGapPp != null
                  ? `${countyRateDecoder.nationalGapPp > 0 ? "+" : ""}${countyRateDecoder.nationalGapPp.toFixed(2)} pp`
                  : "—"}
              </div>
            </div>
            <div className="bg-white/60 rounded-md px-3 py-2 border border-stone-200">
              <div className="text-xs uppercase tracking-wider text-stone-500">
                vs {stateData?.state ?? county.state}
              </div>
              <div className="text-lg font-bold text-stone-900">
                {countyRateDecoder.stateGapPp != null
                  ? `${countyRateDecoder.stateGapPp > 0 ? "+" : ""}${countyRateDecoder.stateGapPp.toFixed(2)} pp`
                  : "—"}
              </div>
            </div>
            <div className="bg-white/60 rounded-md px-3 py-2 border border-stone-200">
              <div className="text-xs uppercase tracking-wider text-stone-500">Assessment cap</div>
              <div className="text-sm font-bold text-stone-900">
                {countyRateDecoder.assessmentCapLabel ?? "No statewide cap"}
              </div>
            </div>
          </div>
          <details className="bg-white/40 rounded-md px-3 py-2 border border-stone-200 mb-2">
            <summary className="text-sm font-medium cursor-pointer text-stone-800">
              Drivers that typically explain this band
            </summary>
            <ul className="mt-2 text-sm text-stone-700 list-disc pl-5 space-y-1">
              {countyRateDecoder.drivers.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </details>
          <details className="bg-white/40 rounded-md px-3 py-2 border border-stone-200">
            <summary className="text-sm font-medium cursor-pointer text-stone-800">
              Caveats — Census ACS limits and what is NOT included
            </summary>
            <ul className="mt-2 text-sm text-stone-700 list-disc pl-5 space-y-1">
              {countyRateDecoder.caveats.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </details>
          <p className="text-xs text-stone-500 mt-3">
            Band cutoffs: {RATE_TIER_CUTOFF_SUMMARY}. Editorial reading — not endorsed by the US
            Census Bureau, the IRS, or any state Department of Revenue. Your county assessor's
            certified bill is the binding figure. See{" "}
            methodology
            .
          </p>
        </section>
      )}

      {/* HomesteadExemptionMatrix — state-level context for this county */}
      {countyMatrixResult.tier && countyStateExemption && stateData && (
        <section
          className={`my-8 rounded-xl border ${countyMatrixTone.border} ${countyMatrixTone.bg} p-6`}
          data-upgrade="homestead-exemption-matrix"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
            <h2 className={`text-lg font-bold ${countyMatrixTone.text}`}>
              {stateData.state} statutory relief tier:{" "}
              {matrixTierLabel(countyMatrixResult.tier)}
            </h2>
            <span className="text-xs text-stone-500">
              State context · Exemption vintage {EXEMPTION_VINTAGE}
            </span>
          </div>
          <p className={`text-sm leading-relaxed ${countyMatrixTone.text} mb-3`}>
            The HomesteadExemptionMatrix encodes {stateData.state}'s statutory homestead,
            senior, veteran, disability, and assessment-cap rules into a single score. This
            classification reflects the state baseline — {county.county_name} may add local
            supplements on top.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3 text-sm">
            {(
              [
                ["Basic", countyMatrixResult.axes.basic],
                ["Senior", countyMatrixResult.axes.senior],
                ["Veteran", countyMatrixResult.axes.veteran],
                ["Disability", countyMatrixResult.axes.disability],
                ["Cap/Freeze", countyMatrixResult.axes.assessmentCap],
              ] as const
            ).map(([label, score]) => (
              <div
                key={label}
                className="bg-white/60 rounded-md px-3 py-2 border border-stone-200 text-center"
              >
                <div className="text-xs uppercase tracking-wider text-stone-500">{label}</div>
                <div className="text-lg font-bold text-stone-900">{score}/2</div>
              </div>
            ))}
          </div>
          <p className="text-sm text-stone-700">
            <strong>Cohort:</strong> {countyMatrixResult.cohort}.{" "}
            <strong>Total score:</strong> {countyMatrixResult.totalScore}/10. Axes:{" "}
            {TIER_AXIS_SUMMARY}.
          </p>
          <p className="text-xs text-stone-500 mt-3">
            Editorial classifier — the matrix does not certify your filing eligibility. Confirm
            with the {county.county_name} assessor.{" "}
            <a href={`/state/${stateData.slug}/homestead-exemption/`} className="text-amber-800 hover:underline">
              {stateData.state} homestead deep-dive →
            </a>
          </p>
        </section>
      )}

      {/* IncomeBurdenBand — share-of-income reading on top of B25103 / B19013 */}
      {countyBurdenResult.tier && (
        <section
          className={`my-8 rounded-xl border border-${countyBurdenTone}-200 bg-${countyBurdenTone}-50 p-6`}
          data-upgrade="income-burden-band"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
            <h2 className={`text-lg font-bold text-${countyBurdenTone}-900`}>
              Income-share burden: {burdenTierLabel(countyBurdenResult.tier)}
              {countyBurdenResult.burdenPct != null && (
                <span className="ml-2 text-sm font-normal text-stone-600">
                  {countyBurdenResult.burdenPct.toFixed(1)}% of median household income
                </span>
              )}
            </h2>
            <span className="text-xs text-stone-500">
              Editorial reading · Census ACS B25103 ÷ B19013 · {VINTAGE_SHORT}
            </span>
          </div>
          <p className={`text-sm leading-relaxed text-${countyBurdenTone}-900 mb-3`}>
            {burdenTierBlurb(countyBurdenResult.tier)}
          </p>
          <div className="text-sm text-stone-700 grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <div className="bg-white/60 rounded-md px-3 py-2 border border-stone-200">
              <div className="text-xs uppercase tracking-wider text-stone-500">Annual tax</div>
              <div className="text-lg font-bold text-stone-900">
                {countyBurdenResult.taxesAnnual != null ? fmt(countyBurdenResult.taxesAnnual) : "—"}
              </div>
            </div>
            <div className="bg-white/60 rounded-md px-3 py-2 border border-stone-200">
              <div className="text-xs uppercase tracking-wider text-stone-500">Median income</div>
              <div className="text-lg font-bold text-stone-900">
                {countyBurdenResult.medianIncome != null ? fmt(countyBurdenResult.medianIncome) : "—"}
              </div>
            </div>
            <div className="bg-white/60 rounded-md px-3 py-2 border border-stone-200">
              <div className="text-xs uppercase tracking-wider text-stone-500">Burden share</div>
              <div className="text-lg font-bold text-stone-900">
                {countyBurdenResult.burdenPct?.toFixed(1)}%
              </div>
            </div>
            <div className="bg-white/60 rounded-md px-3 py-2 border border-stone-200">
              <div className="text-xs uppercase tracking-wider text-stone-500">SALT cap</div>
              <div className="text-sm font-bold text-stone-900">
                {countyBurdenResult.saltCapBinding ? "Binding (≥$10K)" : "Below cap"}
              </div>
            </div>
          </div>
          <details className="bg-white/40 rounded-md px-3 py-2 border border-stone-200">
            <summary className="text-sm font-medium cursor-pointer text-stone-800">
              Caveats — Census ACS limits and the SALT $10,000 cap
            </summary>
            <ul className="mt-2 text-sm text-stone-700 list-disc pl-5 space-y-1">
              {countyBurdenResult.caveats.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </details>
          <p className="text-xs text-stone-500 mt-3">
            Band cutoffs:{" "}
            {INCOME_BURDEN_CUTOFF_SUMMARY.map((row) => `${row.tier} ${row.range}`).join(" · ")}.
            Editorial reading — not endorsed by the US Census Bureau or the IRS. See{" "}
            methodology
            .
          </p>
        </section>
      )}

      {/* AssessmentAppealSuccessTier — verdict-card style mirroring the simulator output */}
      {countyAppealResult.tier && (
        <section
          className={`my-8 rounded-r-lg border-l-4 ${appealVerdictColors.barBorder} border-y border-r ${appealVerdictColors.panelBorder} ${appealVerdictColors.panelBg} p-6`}
          data-upgrade="assessment-appeal-success-tier"
        >
          <div className="flex flex-wrap items-baseline gap-3 mb-2">
            <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${appealVerdictColors.badgeBg} ${appealVerdictColors.badgeText} rounded`}>
              Appeal Tier
            </span>
            <span className="text-xs text-stone-500 italic">
              State context · {countyAppealResult.successPublicized ? "Publicized reduction-rate" : "Mechanism-only"}
            </span>
          </div>
          <h2 className={`text-xl font-bold ${appealVerdictColors.heading} mb-2 leading-tight`}>
            {appealTierLabel(countyAppealResult.tier)}
          </h2>
          <p className={`text-sm leading-relaxed ${appealVerdictColors.body} mb-3`}>
            {appealTierBlurb(countyAppealResult.tier, countyAppealResult.mechanism)}
          </p>
          {countyAppealResult.publicizedRange && (
            <div className="bg-white/60 rounded-md px-3 py-2 border border-stone-200 mb-3 text-sm text-stone-800">
              <span className="text-xs uppercase tracking-wider text-stone-500 block mb-1">
                Published reduction-rate range
              </span>
              {countyAppealResult.publicizedRange}
            </div>
          )}
          <details className="bg-white/40 rounded-md px-3 py-2 border border-stone-200 mb-2">
            <summary className="text-sm font-medium cursor-pointer text-stone-800">
              Drivers that classify this state
            </summary>
            <ul className="mt-2 text-sm text-stone-700 list-disc pl-5 space-y-1">
              {countyAppealResult.drivers.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </details>
          <details className="bg-white/40 rounded-md px-3 py-2 border border-stone-200">
            <summary className="text-sm font-medium cursor-pointer text-stone-800">
              Caveats — IAAO standards and the limits of public outcome data
            </summary>
            <ul className="mt-2 text-sm text-stone-700 list-disc pl-5 space-y-1">
              {countyAppealResult.caveats.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </details>
          <p className="text-xs text-stone-500 mt-3">
            Tier rubric:{" "}
            {APPEAL_TIER_CUTOFF_SUMMARY.map((row) => `${row.tier} = ${row.range}`).join(" · ")}.
            Editorial reading — not endorsed by IAAO or any state Department of Revenue. See{" "}
            methodology
            .
          </p>
        </section>
      )}

      {/* Signature feature CTA — links the appeal-success tier directly into the
          per-property Appeal Outcome Simulator with state + county pre-filled. */}
      <a
        href={`/appeal-simulator/?state=${encodeURIComponent(county.state)}&county=${encodeURIComponent(slug)}`}
        className="block my-8 bg-stone-50 border-l-4 border-amber-700 border-y border-r border-stone-200 rounded-r-lg p-6 hover:bg-stone-100 transition-colors group"
      >
        <div className="flex items-baseline gap-3 mb-2">
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-amber-700 text-stone-50 rounded">
            Signature Tool
          </span>
          <span className="text-xs text-stone-500 italic">Only on propertytaxpeek</span>
        </div>
        <h2 className="text-xl font-bold text-stone-900 mb-1 group-hover:text-amber-800 transition-colors">
          Run the Appeal Outcome Simulator for {county.county_name} →
        </h2>
        <p className="text-sm text-stone-700 leading-relaxed">
          Enter your assessed value and comparable sales. We&apos;ll flag
          over-assessment, estimate your annual savings if the appeal succeeds, and
          surface {stateData?.state ?? county.state}&apos;s published reduction-rate band.
        </p>
      </a>

      <InsightBlock entityName={county.county_name} insights={insights} />

      <TableOfContents />

      <AdSlot id="4567890123" />

      {/* County Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-8">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <div className="text-xs text-stone-500 uppercase tracking-wider mb-1">
            Tax Rate
          </div>
          <div className="text-xl font-bold text-amber-900">
            {effectiveRatePct.toFixed(2)}%
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <div className="text-xs text-stone-500 uppercase tracking-wider mb-1">
            Median Tax
          </div>
          <div className="text-xl font-bold text-amber-900">{fmt(taxesAnnual)}</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <div className="text-xs text-stone-500 uppercase tracking-wider mb-1">
            Median Home Value
          </div>
          <div className="text-xl font-bold text-amber-900">{fmt(homeValue)}</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <div className="text-xs text-stone-500 uppercase tracking-wider mb-1">
            Population
          </div>
          <div className="text-xl font-bold text-amber-900">
            {county.population.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Comparison table */}
      <h2 className="text-xl font-bold text-stone-800 mb-4">
        Comparison with State &amp; National Average
      </h2>
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-stone-50 text-left">
              <th className="px-4 py-2 font-medium text-stone-600">Location</th>
              <th className="px-4 py-2 font-medium text-stone-600 text-right">Rate</th>
              <th className="px-4 py-2 font-medium text-stone-600 text-right">Median Tax</th>
              <th className="px-4 py-2 font-medium text-stone-600 text-right">Median Home</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-stone-100 bg-amber-50">
              <td className="px-4 py-2 font-medium">{county.county_name}</td>
              <td className="px-4 py-2 text-right font-medium">
                {effectiveRatePct.toFixed(2)}%
              </td>
              <td className="px-4 py-2 text-right">{fmt(taxesAnnual)}</td>
              <td className="px-4 py-2 text-right">{fmt(homeValue)}</td>
            </tr>
            {stateData && stateRatePct > 0 && (
              <tr className="border-t border-stone-100 hover:bg-stone-50">
                <td className="px-4 py-2">
                  <a
                    href={`/state/${stateData.slug}/`}
                    className="text-amber-700 hover:underline"
                  >
                    {stateData.state} (state avg)
                  </a>
                </td>
                <td className="px-4 py-2 text-right">{stateRatePct.toFixed(2)}%</td>
                <td className="px-4 py-2 text-right">{fmt(stateMedianTax)}</td>
                <td className="px-4 py-2 text-right">{fmt(stateMedianHomeValue)}</td>
              </tr>
            )}
            <tr className="border-t border-stone-100 hover:bg-stone-50">
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
          <h3 className="text-sm font-medium text-stone-600 mb-2">Effective Tax Rate</h3>
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
          <h3 className="text-sm font-medium text-stone-600 mb-2">Median Annual Tax</h3>
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
        <div className="rounded-lg border border-stone-200 bg-white p-5 text-stone-700 leading-relaxed space-y-3">
          <p>{intro}</p>
          <p>{comparison}</p>
          {seniorPara && <p>{seniorPara}</p>}
          <p className="text-sm text-stone-500">{outlook}</p>
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
              <div className="text-xs text-stone-500 uppercase tracking-wider mb-1">
                Median income, age 65+
              </div>
              <div className="text-lg font-bold text-indigo-900">
                {fmt(view.seniorIncome)}
              </div>
            </div>
            <div className="bg-white rounded-md p-3 border border-indigo-100">
              <div className="text-xs text-stone-500 uppercase tracking-wider mb-1">
                Senior tax-to-income
              </div>
              <div className="text-lg font-bold text-indigo-900">
                {view.seniorBurdenPct.toFixed(2)}%
              </div>
            </div>
            <div className="bg-white rounded-md p-3 border border-indigo-100">
              <div className="text-xs text-stone-500 uppercase tracking-wider mb-1">
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
                <h3 className="text-sm font-semibold text-stone-500 uppercase mb-2">
                  vs Other {county.state} Counties
                </h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {sameState.map((c) => (
                    <a
                      key={c.slug}
                      href={`/county-compare/${county.slug}-vs-${c.slug}/`}
                      className="text-sm px-3 py-1.5 bg-stone-100 hover:bg-amber-50 text-amber-800 rounded-full"
                    >
                      vs {c.county_name}
                    </a>
                  ))}
                </div>
              </>
            )}
            {topCounties.length > 0 && (
              <>
                <h3 className="text-sm font-semibold text-stone-500 uppercase mb-2">
                  vs Popular Counties Nationwide
                </h3>
                <div className="flex flex-wrap gap-2">
                  {topCounties.map((c) => (
                    <a
                      key={c.slug}
                      href={`/county-compare/${county.slug}-vs-${c.slug}/`}
                      className="text-sm px-3 py-1.5 bg-stone-100 hover:bg-amber-50 text-amber-800 rounded-full"
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

      {/* Phase 7 P5 — Cross-walk bridge to 4 sibling-portfolio sites,
          keyed on the same county slug (rent / safety / flood / school).
          See lib/crosswalk-burden-and-rate.ts for the gate-JSON record. */}
      <CountyCrossWalkBridge
        countySlug={slug}
        countyName={county.county_name}
        state={county.state}
      />

      {/* FAQ Section */}
      {faqs.length > 0 && (
        <section className="mt-8 mb-8">
          <h2 className="text-xl font-bold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.question} className="border border-stone-200 rounded-lg">
                <summary className="px-4 py-3 font-medium cursor-pointer hover:bg-stone-50">
                  {faq.question}
                </summary>
                <p className="px-4 pb-3 text-sm text-stone-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}
      <DataFeedback />
      <AuthorBox
        vintage={COUNTY_VINTAGE}
        source={`${county.county_name}, ${county.state} property tax dataset`}
        showDisclaimer
      />
    </article>
  );
}
