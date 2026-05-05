import type { Metadata } from "next";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AuthorBox } from "@/components/AuthorBox";
import { ABOUT_VINTAGE } from "@/lib/authorship";
import { getAllStates, getAllCounties } from "@/lib/db";
import { DATA_VINTAGE } from "@/lib/data-vintage";

export const metadata: Metadata = {
  title: "About PropertyTaxPeek",
  description:
    "PropertyTaxPeek indexes US property tax data — effective rates, median annual taxes, and median home values — for all 50 states and thousands of counties, anchored in Census ACS 2024 5-Year estimates.",
  alternates: { canonical: "/about/" },
  openGraph: { url: "/about/" },
};

export default function AboutPage() {
  const states = getAllStates();
  const counties = getAllCounties();

  return (
    <>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "About" }]} />
      <h1 className="text-3xl font-bold text-slate-900 mb-6">
        About PropertyTaxPeek
      </h1>
      <article className="prose prose-slate max-w-3xl">
        <p>
          PropertyTaxPeek is a free reference tool that indexes effective
          property tax rates, median annual property taxes, and median home
          values for {states.length} US states and {counties.length.toLocaleString()} counties.
          We exist so first-time homebuyers, retirees, and investors can compare
          tax burdens across jurisdictions without paying for a research
          subscription.
        </p>

        <div className="not-prose grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-4 text-center">
            <div className="text-2xl font-bold text-indigo-700">
              {counties.length.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1">Counties</div>
          </div>
          <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4 text-center">
            <div className="text-2xl font-bold text-emerald-700">{states.length}</div>
            <div className="text-xs text-slate-500 mt-1">States &amp; DC</div>
          </div>
          <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">{DATA_VINTAGE.source}</div>
            <div className="text-xs text-slate-500 mt-1">Data vintage</div>
          </div>
          <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-4 text-center">
            <div className="text-2xl font-bold text-amber-700">
              {DATA_VINTAGE.counties_kept.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1">Counties kept (MOE-filtered)</div>
          </div>
        </div>

        <h2>Our Mission</h2>
        <p>
          Property tax is one of the largest recurring costs of homeownership,
          but it&apos;s also one of the least transparent — rates vary by an
          order of magnitude between counties, exemptions are scattered across
          state statutes, and the figures the IRS uses for the SALT deduction
          come from a different schedule than the rate your assessor publishes.
          Our goal is to put the same numbers used by tax-policy researchers and
          the Census Bureau in front of homeowners, in a format that takes
          seconds to read.
        </p>

        <h2>Data Sources</h2>
        <p>
          PropertyTaxPeek is anchored in the US Census Bureau&apos;s American
          Community Survey (ACS) 2024 5-Year estimates. Specifically, we ingest
          table B25103 (median real estate taxes), B25077 (median home value),
          and B19013/B19049 (income context for senior burden). Of {DATA_VINTAGE.counties_total_local.toLocaleString()}{" "}
          counties in our base set, {DATA_VINTAGE.counties_covered_by_census.toLocaleString()} are covered by the
          Census release; {DATA_VINTAGE.counties_kept.toLocaleString()} pass our margin-of-error filter
          (relative MOE ≤ {DATA_VINTAGE.moe_threshold_relative_pct}%) and are published with full numbers,
          and {DATA_VINTAGE.counties_suppressed} are suppressed because the published estimate is too
          imprecise to publish honestly.
        </p>
        <ul>
          <li>
            <strong>US Census Bureau ACS 2024 5-Year</strong> — the legal
            authority for state- and county-level housing finance figures.
          </li>
          <li>
            <strong>US Census State &amp; Local Government Finances</strong> —
            cross-reference for total state-and-local property tax collections.
          </li>
        </ul>
        <p>
          We publish a detailed <a href="/methodology/">methodology page</a>{" "}
          explaining how we compute effective rates, why some counties are
          suppressed, and where our numbers should not be used as a substitute
          for an assessor&apos;s figure.
        </p>

        <h2>How We Compute Effective Rates</h2>
        <p>
          Effective property tax rate is the ratio of median real estate taxes
          to median home value — the same definition used by the Tax Foundation
          and the Lincoln Institute. We do not publish statutory mill rates,
          because mill rates without assessment ratios and exemptions are
          misleading.
        </p>

        <h2>Editorial Practice</h2>
        <p>
          PropertyTaxPeek publishes as an organization, not under individual
          bylines. Our editorial workflow audits each Census release, flags
          counties whose ACS estimate does not pass the MOE filter, and
          reconciles state-level totals against the Census Annual Survey of
          State and Local Government Finances. We disclose every dataset&apos;s
          vintage on the page where it appears.
        </p>

        <h2>Part of the DataPeek Network</h2>
        <p>
          PropertyTaxPeek is part of the{" "}
          <a href="https://datapeekfacts.com" rel="noopener" target="_blank">
            DataPeek Research Network
          </a>
          , a collection of public-data tools covering housing, healthcare,
          salary, ZIP code, and other civic datasets.
        </p>

        <h2>Contact</h2>
        <p>
          Have a correction, a Census-release date we missed, or a county you
          would like added? Visit our <a href="/contact/">contact page</a>.
        </p>
      </article>
      <AuthorBox vintage={ABOUT_VINTAGE} source="PropertyTaxPeek about page" />
    </>
  );
}
