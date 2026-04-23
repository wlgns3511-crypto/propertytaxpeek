import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllStates, getStateBySlug } from "@/lib/db";
import { getStateExemptionData } from "@/lib/state-exemption-data";
import { Breadcrumb } from "@/components/Breadcrumb";
import { FreshnessTag } from "@/components/FreshnessTag";
import { AuthorBox } from "@/components/AuthorBox";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { EditorNote } from "@/components/EditorNote";
import { AdSlot } from "@/components/AdSlot";
import { DB_UPDATED } from "@/lib/authorship";

export const dynamicParams = false;
export const revalidate = false;

const SITE_URL = "https://propertytaxpeek.com";

// Neighboring states (matches parent state page) — used for cross-link discovery
const NEIGHBORS: Record<string, string[]> = {
  AL: ["FL", "GA", "MS", "TN"], AK: [], AZ: ["CA", "CO", "NV", "NM", "UT"],
  AR: ["LA", "MO", "MS", "OK", "TN", "TX"], CA: ["AZ", "NV", "OR"],
  CO: ["AZ", "KS", "NE", "NM", "OK", "UT", "WY"], CT: ["MA", "NY", "RI"],
  DE: ["MD", "NJ", "PA"], FL: ["AL", "GA"], GA: ["AL", "FL", "NC", "SC", "TN"],
  HI: [], ID: ["MT", "NV", "OR", "UT", "WA", "WY"],
  IL: ["IA", "IN", "KY", "MO", "WI"], IN: ["IL", "KY", "MI", "OH"],
  IA: ["IL", "MN", "MO", "NE", "SD", "WI"], KS: ["CO", "MO", "NE", "OK"],
  KY: ["IL", "IN", "MO", "OH", "TN", "VA", "WV"], LA: ["AR", "MS", "TX"],
  ME: ["NH"], MD: ["DE", "PA", "VA", "WV"],
  MA: ["CT", "NH", "NY", "RI", "VT"], MI: ["IN", "OH", "WI"],
  MN: ["IA", "ND", "SD", "WI"], MS: ["AL", "AR", "LA", "TN"],
  MO: ["AR", "IL", "IA", "KS", "KY", "NE", "OK", "TN"],
  MT: ["ID", "ND", "SD", "WY"], NE: ["CO", "IA", "KS", "MO", "SD", "WY"],
  NV: ["AZ", "CA", "ID", "OR", "UT"], NH: ["ME", "MA", "VT"],
  NJ: ["DE", "NY", "PA"], NM: ["AZ", "CO", "OK", "TX", "UT"],
  NY: ["CT", "MA", "NJ", "PA", "VT"], NC: ["GA", "SC", "TN", "VA"],
  ND: ["MN", "MT", "SD"], OH: ["IN", "KY", "MI", "PA", "WV"],
  OK: ["AR", "CO", "KS", "MO", "NM", "TX"], OR: ["CA", "ID", "NV", "WA"],
  PA: ["DE", "MD", "NJ", "NY", "OH", "WV"], RI: ["CT", "MA"],
  SC: ["GA", "NC"], SD: ["IA", "MN", "MT", "ND", "NE", "WY"],
  TN: ["AL", "AR", "GA", "KY", "MO", "MS", "NC", "VA"],
  TX: ["AR", "LA", "NM", "OK"], UT: ["AZ", "CO", "ID", "NV", "NM", "WY"],
  VT: ["MA", "NH", "NY"], VA: ["KY", "MD", "NC", "TN", "WV"],
  WA: ["ID", "OR"], WV: ["KY", "MD", "OH", "PA", "VA"],
  WI: ["IA", "IL", "MI", "MN"], WY: ["CO", "ID", "MT", "NE", "SD", "UT"],
};

export function generateStaticParams() {
  return getAllStates().map((s) => ({ slug: s.slug }));
}

function fmtUSD(n: number): string {
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
  const state = getStateBySlug(slug);
  const exemption = getStateExemptionData(slug);
  if (!state || !exemption) return {};

  const hasDollar = exemption.homesteadBase > 0;
  const amount = hasDollar ? fmtUSD(exemption.homesteadBase) : "varies by program";

  return {
    title: `${state.state} Homestead Exemption 2026 — ${amount} Primary Residence Relief`,
    description: `${state.state} homestead exemption guide: ${amount} off assessed value${exemption.assessmentCap ? ", plus " + exemption.assessmentCap.toLowerCase() : ""}. Covers senior, disabled veteran, and filing steps. 2026 values.`,
    alternates: { canonical: `/state/${slug}/homestead-exemption/` },
    openGraph: { url: `/state/${slug}/homestead-exemption/` },
  };
}

export default async function HomesteadExemptionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const state = getStateBySlug(slug);
  const exemption = getStateExemptionData(slug);
  if (!state || !exemption) notFound();

  const allStates = getAllStates();
  const neighborAbbrs = NEIGHBORS[state.abbr] || [];
  const neighbors = allStates
    .filter((s) => neighborAbbrs.includes(s.abbr))
    .slice(0, 4);

  // Tax savings calculation: exemption × effective_rate
  // Note: many states tax a % of assessed value; this is a reasonable
  // public-facing approximation. Disclaimer appears inline.
  const rateDecimal = state.effective_rate / 100;
  const homesteadSavings = Math.round(exemption.homesteadBase * rateDecimal);
  const medianTaxWithExemption = Math.max(
    0,
    Math.round(state.median_tax - homesteadSavings)
  );

  // Three example home values: median ±25%
  const exampleHomes = [
    Math.round(state.median_home_value * 0.75),
    state.median_home_value,
    Math.round(state.median_home_value * 1.5),
  ];

  const faqs: { q: string; a: string }[] = [
    {
      q: `How much is the ${state.state} homestead exemption in 2026?`,
      a: exemption.homesteadBase > 0
        ? `${state.state}'s homestead exemption is ${fmtUSD(exemption.homesteadBase)} off assessed value for a primary residence. ${exemption.homesteadDescription}`
        : `${state.state} does not offer a general dollar-value homestead exemption for all homeowners. ${exemption.homesteadDescription}`,
    },
    {
      q: `How do I file for the ${state.state} homestead exemption?`,
      a: exemption.filingProcess,
    },
    {
      q: `Does ${state.state} offer a senior (over-65) property tax exemption?`,
      a: exemption.seniorExemption ?? `${state.state} does not offer a dedicated senior property tax exemption at the state level. Some counties or cities may offer local relief — check with your county assessor.`,
    },
    {
      q: `What is the ${state.state} disabled veteran property tax exemption?`,
      a: exemption.veteranExemption ?? `${state.state} does not list a separate disabled veteran property tax exemption in state statute. Federal 100% service-connected disability status may still qualify for local programs.`,
    },
    {
      q: `Does ${state.state} cap annual property tax assessment increases?`,
      a: exemption.assessmentCap ?? `${state.state} does not impose a statewide assessment-growth cap on residential property. Assessed value typically tracks market value at each reassessment cycle — a year-over-year increase of 10–25% is not unusual after a hot housing market.`,
    },
    {
      q: `How much will I actually save with the ${state.state} homestead exemption?`,
      a: exemption.homesteadBase > 0
        ? `At ${state.state}'s ${state.effective_rate.toFixed(2)}% effective property tax rate, the ${fmtUSD(exemption.homesteadBase)} exemption reduces the median tax bill by approximately ${fmtUSD(homesteadSavings)} per year. Actual savings depend on your county's tax rate and whether local exemptions stack on top.`
        : `Because ${state.state} does not use a dollar-value homestead exemption, savings depend on the specific relief program you qualify for (senior freeze, veteran exemption, assessment cap, etc.). Review the category summaries above for your household situation.`,
    },
    {
      q: `Do I need to reapply for the ${state.state} homestead exemption every year?`,
      a: `In most states, the standard homestead exemption is a one-time filing that stays in effect as long as the property remains your primary residence. Senior, veteran, and income-qualified enhancements often require annual re-certification of income or residency. ${state.state} specifics: ${exemption.notes}`,
    },
  ];

  return (
    <>
      {/* Structured data — WebPage + Breadcrumb + FAQ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: `${state.state} Homestead Exemption 2026`,
            url: `${SITE_URL}/state/${slug}/homestead-exemption/`,
            description: `${state.state} homestead exemption, senior relief, disabled veteran exemption, assessment cap, and filing process. 2026 values.`,
            dateModified: DB_UPDATED,
            isPartOf: {
              "@type": "WebSite",
              name: "PropertyTaxPeek",
              url: SITE_URL,
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
              { "@type": "ListItem", position: 2, name: state.state, item: `${SITE_URL}/state/${slug}/` },
              { "@type": "ListItem", position: 3, name: "Homestead Exemption", item: `${SITE_URL}/state/${slug}/homestead-exemption/` },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />

      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: state.state, href: `/state/${slug}/` },
          { label: "Homestead Exemption" },
        ]}
      />

      {/* Hero */}
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
          {state.state} Homestead Exemption 2026
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed">
          {exemption.homesteadBase > 0 ? (
            <>
              {state.state} homeowners can claim up to{" "}
              <strong>{fmtUSD(exemption.homesteadBase)}</strong> off assessed
              value on a primary residence
              {exemption.assessmentCap && (
                <>
                  , plus <strong>{exemption.assessmentCap}</strong>
                </>
              )}
              . The typical {state.state} home ({fmtUSD(state.median_home_value)})
              sees roughly <strong>{fmtUSD(homesteadSavings)}</strong> in annual
              property tax savings at the {state.effective_rate.toFixed(2)}% effective
              rate.
            </>
          ) : (
            <>
              {state.state} does not use a general dollar-value homestead
              exemption. Instead, relief targets seniors, disabled veterans, and
              income-qualified households through {exemption.assessmentCap ? "an assessment cap and " : ""}
              dedicated credit programs described below.
            </>
          )}
        </p>
        <FreshnessTag source="State Dept of Revenue / Tax Foundation" />
      </header>

      {/* Three spotlight cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <div className="text-xs text-emerald-700 uppercase tracking-wider font-semibold mb-1">
            Homestead Base
          </div>
          <div className="text-2xl font-bold text-emerald-900 mb-2">
            {exemption.homesteadBase > 0
              ? fmtUSD(exemption.homesteadBase)
              : "Program-based"}
          </div>
          <div className="text-xs text-emerald-800 leading-snug">
            Off assessed value for primary residence
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="text-xs text-amber-700 uppercase tracking-wider font-semibold mb-1">
            Est. Annual Savings
          </div>
          <div className="text-2xl font-bold text-amber-900 mb-2">
            {homesteadSavings > 0 ? fmtUSD(homesteadSavings) : "Varies"}
          </div>
          <div className="text-xs text-amber-800 leading-snug">
            At {state.effective_rate.toFixed(2)}% effective rate
          </div>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
          <div className="text-xs text-indigo-700 uppercase tracking-wider font-semibold mb-1">
            Assessment Cap
          </div>
          <div className="text-2xl font-bold text-indigo-900 mb-2">
            {exemption.assessmentCap ? "Yes" : "None"}
          </div>
          <div className="text-xs text-indigo-800 leading-snug">
            {exemption.assessmentCap
              ? exemption.assessmentCap.split(".")[0]
              : "No statewide cap on annual increases"}
          </div>
        </div>
      </section>

      <EditorNote
        note={`Homestead exemption amounts in ${state.state} are statutory baselines. Counties, cities, and school districts often layer additional exemptions or adjust eligibility — always confirm with your local assessor before budgeting expected savings.`}
      />

      <AdSlot id="4567890123" />

      {/* Tax savings examples — 3 home-value rows */}
      <section className="my-10">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">
          Estimated Savings at {state.state} Home Values
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          These estimates apply the {state.effective_rate.toFixed(2)}% {state.state} effective
          property tax rate to three home-value scenarios, then subtract the{" "}
          {exemption.homesteadBase > 0
            ? `${fmtUSD(exemption.homesteadBase)} homestead exemption`
            : "applicable primary-residence relief"}
          . County rates vary by 2–3× in some states — use this as a directional
          estimate, not a final bill.
        </p>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-4 py-2 font-medium text-slate-600">Home Value</th>
                <th className="px-4 py-2 font-medium text-slate-600 text-right">
                  Tax Before Exemption
                </th>
                <th className="px-4 py-2 font-medium text-slate-600 text-right">
                  Exemption
                </th>
                <th className="px-4 py-2 font-medium text-slate-600 text-right">
                  Estimated Tax After
                </th>
              </tr>
            </thead>
            <tbody>
              {exampleHomes.map((home, i) => {
                const taxBefore = Math.round(home * rateDecimal);
                const taxAfter = Math.max(
                  0,
                  Math.round((home - exemption.homesteadBase) * rateDecimal)
                );
                const label =
                  i === 0 ? "Below median" : i === 1 ? "Median" : "Above median";
                return (
                  <tr
                    key={i}
                    className={`border-t border-slate-100 ${
                      i === 1 ? "bg-blue-50" : ""
                    }`}
                  >
                    <td className="px-4 py-2">
                      <div className="font-medium">{fmtUSD(home)}</div>
                      <div className="text-xs text-slate-500">{label}</div>
                    </td>
                    <td className="px-4 py-2 text-right">{fmtUSD(taxBefore)}</td>
                    <td className="px-4 py-2 text-right text-emerald-700 font-medium">
                      {exemption.homesteadBase > 0
                        ? `−${fmtUSD(exemption.homesteadBase * rateDecimal)}`
                        : "Varies"}
                    </td>
                    <td className="px-4 py-2 text-right font-bold">
                      {fmtUSD(taxAfter)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Note: Some states (Louisiana, Mississippi, South Carolina, Utah, and
          others) assess homes at a percentage of market value before applying
          the tax rate. Those states' effective rates already account for that
          ratio — this estimate is a first-order approximation.
        </p>
      </section>

      {/* Exemption category detail cards */}
      <section className="my-10">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">
          {state.state} Property Tax Exemption Categories
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Homestead */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <h3 className="text-base font-bold text-slate-900">
                Homestead (Primary Residence)
              </h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              {exemption.homesteadDescription}
            </p>
          </div>

          {/* Senior */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
              <h3 className="text-base font-bold text-slate-900">
                Senior / Over-65
              </h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              {exemption.seniorExemption ??
                `${state.state} has no dedicated senior property tax exemption at the state level. Check county or municipal programs — many localities add age-based relief even when the state does not.`}
            </p>
          </div>

          {/* Disabled Veteran */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block w-2 h-2 rounded-full bg-purple-500"></span>
              <h3 className="text-base font-bold text-slate-900">
                Disabled Veteran
              </h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              {exemption.veteranExemption ??
                `${state.state} does not list a separate disabled veteran property tax exemption in state statute. 100% service-connected disability status often qualifies for county-level programs; verify with your assessor.`}
            </p>
          </div>

          {/* Disability */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block w-2 h-2 rounded-full bg-pink-500"></span>
              <h3 className="text-base font-bold text-slate-900">
                Permanent Disability
              </h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              {exemption.disabilityExemption ??
                `${state.state} does not maintain a distinct disability property tax exemption. Totally disabled homeowners are typically covered under the senior or veteran programs — confirm eligibility with the applicable program above.`}
            </p>
          </div>
        </div>
      </section>

      {/* Assessment cap callout — only render if present */}
      {exemption.assessmentCap && (
        <section className="my-10 p-6 bg-indigo-50 border-l-4 border-indigo-400 rounded-r-xl">
          <h2 className="text-lg font-bold text-indigo-900 mb-2">
            {state.state} Assessment Cap
          </h2>
          <p className="text-sm text-indigo-900 leading-relaxed">
            {exemption.assessmentCap} This is often more valuable than the
            upfront dollar exemption over long ownership periods — a 10-year
            owner in {state.state} can see taxable value diverge significantly
            from market value, locking in 2020-era tax bills on 2026-era
            property.
          </p>
        </section>
      )}

      {/* Filing process */}
      <section className="my-10">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">
          How to File for the {state.state} Homestead Exemption
        </h2>
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-sm">
              1
            </div>
            <div className="text-sm text-slate-700 leading-relaxed pt-0.5">
              <strong>Confirm primary-residence status.</strong> The homestead
              exemption applies only to the dwelling you occupy as your main
              home. Second homes, vacation properties, and most rentals do not
              qualify.
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-sm">
              2
            </div>
            <div className="text-sm text-slate-700 leading-relaxed pt-0.5">
              <strong>Gather documents.</strong> Typical requirements: driver's
              license or state ID matching the property address, deed or
              closing statement, most recent utility bill. Senior/veteran
              applications usually add a birth certificate, DD-214, or VA
              disability letter.
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-sm">
              3
            </div>
            <div className="text-sm text-slate-700 leading-relaxed pt-0.5">
              <strong>{state.state}-specific filing.</strong>{" "}
              {exemption.filingProcess}
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-sm">
              4
            </div>
            <div className="text-sm text-slate-700 leading-relaxed pt-0.5">
              <strong>Track the deadline.</strong> Most states use an early-year
              deadline (often March 1, April 1, or April 15). Missing the
              deadline usually pushes the exemption to the following tax year —
              double-check with your assessor if you are buying mid-year.
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-sm">
              5
            </div>
            <div className="text-sm text-slate-700 leading-relaxed pt-0.5">
              <strong>Verify on the next tax bill.</strong> Your next property
              tax statement should show the exemption line-itemed. If it does
              not, contact the assessor within the correction window (usually
              30–90 days).
            </div>
          </div>
        </div>
      </section>

      {/* State-specific context block */}
      <section className="my-10 p-6 bg-slate-50 rounded-xl border border-slate-200">
        <h2 className="text-lg font-bold text-slate-900 mb-3">
          What to Know About {state.state}&apos;s Exemption System
        </h2>
        <p className="text-sm text-slate-700 leading-relaxed mb-3">{exemption.notes}</p>
        <p className="text-xs text-slate-500">
          Baseline data sourced from the {state.state} Department of Revenue,
          Tax Foundation state-by-state property tax tables, and the Lincoln
          Institute Significant Features of the Property Tax database.
        </p>
      </section>

      <AdSlot id="5678901234" />

      {/* Dollar exemption vs assessment cap explainer */}
      <section className="my-10 prose prose-slate max-w-none">
        <h2>Dollar Exemption vs. Assessment Cap — Which Matters More?</h2>
        <p>
          Homeowners often focus on the headline dollar exemption and ignore the
          less-glamorous assessment cap. In practice, the cap usually wins over
          any horizon longer than five years.
        </p>
        <p>
          A {fmtUSD(exemption.homesteadBase || 25000)} dollar exemption saves you
          roughly {fmtUSD(Math.round((exemption.homesteadBase || 25000) * rateDecimal))}{" "}
          in the first year and stays flat forever. An assessment cap like
          California&apos;s Prop 13 (2%/year) or Florida&apos;s Save Our Homes
          (3%/year) compounds. Over 15 years of 5% market appreciation, a capped
          property&apos;s taxable value can sit 40–60% below market — on a
          typical home that translates to <em>thousands</em> of dollars saved
          every year.
        </p>
        <p>
          {exemption.assessmentCap ? (
            <>
              <strong>Good news:</strong> {state.state} has an assessment cap
              ({exemption.assessmentCap}). Long-term homeowners should expect
              their effective tax burden to decline relative to market value
              over time — assuming they do not sell or substantially remodel,
              which can trigger a reassessment.
            </>
          ) : (
            <>
              <strong>No cap in {state.state}.</strong> Your taxable value
              tracks market reassessments. In a hot housing market, annual tax
              increases of 10–20% are possible even without a local rate change
              — budget for this when underwriting long-term affordability.
            </>
          )}
        </p>
      </section>

      {/* Cross-link to parent state + take-home-adjacent sites */}
      <section className="my-10 grid grid-cols-1 md:grid-cols-2 gap-4">
        <a
          href={`/state/${slug}/`}
          className="block p-5 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-sm transition"
        >
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Full State Overview
          </div>
          <div className="text-base font-bold text-slate-900 mb-1">
            {state.state} property tax rates by county →
          </div>
          <div className="text-sm text-slate-600">
            Effective rate, median tax, and county-level breakdown for {state.state}.
          </div>
        </a>
        <a
          href="/calculator/"
          className="block p-5 bg-white border border-slate-200 rounded-xl hover:border-emerald-400 hover:shadow-sm transition"
        >
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Property Tax Calculator
          </div>
          <div className="text-base font-bold text-slate-900 mb-1">
            Run your own home value →
          </div>
          <div className="text-sm text-slate-600">
            Plug in your exact home value at the {state.state} effective rate to
            get a personalized annual bill.
          </div>
        </a>
      </section>

      {/* Neighboring states cross-link */}
      {neighbors.length > 0 && (
        <section className="my-10">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            Compare {state.state} to Neighboring States
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {neighbors.map((n) => (
              <a
                key={n.slug}
                href={`/state/${n.slug}/homestead-exemption/`}
                className="block p-4 bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:shadow-sm transition"
              >
                <div className="text-base font-bold text-slate-900 mb-1">
                  {n.state}
                </div>
                <div className="text-xs text-slate-500">
                  {n.effective_rate.toFixed(2)}% effective rate
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Homestead exemption →
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="my-10">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">
          Frequently Asked Questions: {state.state} Homestead Exemption
        </h2>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <details
              key={i}
              className="group bg-white border border-slate-200 rounded-xl p-4 open:border-blue-300"
            >
              <summary className="cursor-pointer font-semibold text-slate-900 text-sm list-none flex items-start gap-2">
                <span className="text-blue-500 group-open:rotate-90 transition-transform">
                  ▸
                </span>
                <span>{f.q}</span>
              </summary>
              <p className="mt-3 ml-5 text-sm text-slate-700 leading-relaxed">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Footer trust block */}
      <div className="mt-10">
        <DataSourceBadge
          sources={[
            {
              name: `${state.state} Department of Revenue`,
              url: "https://www.taxadmin.org/state-tax-agencies",
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
          updatedAt="2026-04"
        />
      </div>

      <AuthorBox />
    </>
  );
}
