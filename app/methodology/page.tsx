import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Methodology — How PropertyTaxPeek Builds Its Data",
  description:
    "Exactly how PropertyTaxPeek sources, computes, and presents US property tax rates — including the raw Census inputs we rely on and the limits of our county-level figures.",
  alternates: { canonical: "/methodology/" },
  openGraph: { url: "/methodology/" },
};

export default function MethodologyPage() {
  return (
    <article className="prose prose-slate max-w-3xl mx-auto">
      <h1>Our Methodology</h1>
      <p className="lead text-lg text-slate-600">
        Property tax is a money decision, so we think you deserve a clear,
        unflinching explanation of where our numbers come from. This page
        documents our sources, our computation, and — importantly —
        what our data is not.
      </p>

      <h2>Primary data source: US Census Bureau</h2>
      <p>
        Our state-level figures are anchored in the{" "}
        <a
          href="https://www.census.gov/programs-surveys/acs/"
          target="_blank"
          rel="noopener noreferrer"
        >
          US Census Bureau American Community Survey (ACS)
        </a>{" "}
        five-year estimates, and the{" "}
        <a
          href="https://www.census.gov/programs-surveys/gov-finances.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          Annual Survey of State and Local Government Finances
        </a>
        . For each US state we publish the effective property tax rate, the
        median annual property tax, and the median owner-occupied home value
        for the most recent complete survey year (currently 2022). These are
        the same raw inputs the Tax Foundation and academic researchers use
        when they publish state rankings.
      </p>

      <h2>How we compute the effective rate</h2>
      <p>
        Effective property tax rate is a ratio, not a statutory rate. We
        compute it as:
      </p>
      <pre className="bg-slate-50 p-4 rounded text-sm overflow-x-auto">
        {`effective_rate = median_annual_property_tax / median_owner_occupied_home_value`}
      </pre>
      <p>
        This is the widely accepted definition used by the{" "}
        <a
          href="https://taxfoundation.org/data/all/state/property-taxes-by-state/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Tax Foundation
        </a>{" "}
        and the{" "}
        <a
          href="https://www.lincolninst.edu/research-data/data-toolkits/significant-features-property-tax"
          target="_blank"
          rel="noopener noreferrer"
        >
          Lincoln Institute of Land Policy
        </a>
        . It captures what the average homeowner actually pays relative to
        what their home is worth — and ignores headline statutory rates
        that vary with exemptions, assessment ratios, and district-level
        add-ons.
      </p>

      <h2>Important: how county-level figures are produced</h2>
      <div className="not-prose border-l-4 border-amber-400 bg-amber-50 p-4 my-4 rounded-r">
        <p className="text-sm text-amber-900">
          <strong>Disclosure.</strong> Our county-level figures are{" "}
          <em>modeled</em>, not scraped from individual county assessors. We
          start from the state-level ACS effective rate and generate county
          variations within a bounded range so that users can get a
          neighborhood-scale starting point for comparison.
        </p>
      </div>
      <p>
        Here is exactly what that means:
      </p>
      <ul>
        <li>
          The <strong>state</strong> rate, median tax, and median home value
          are real published Census figures.
        </li>
        <li>
          The <strong>county</strong> rates shown on our county pages are
          produced by varying the state baseline within a limited range to
          reflect typical within-state dispersion, keyed deterministically to
          each county&apos;s identifier so that the same county always shows
          the same figure.
        </li>
        <li>
          The county numbers are intended as a <strong>rough comparison
          baseline</strong>, not as a replacement for your actual county
          assessor&apos;s published rate or your individual tax bill.
        </li>
      </ul>
      <p>
        If you need the exact rate for a specific address, please consult
        your county assessor&apos;s office or your most recent property tax
        bill. We link to state and Census resources so you can verify any
        figure you see here.
      </p>

      <h2>Cross-reference and verification</h2>
      <p>
        Every state and county page on PropertyTaxPeek links out to the
        authoritative sources behind our numbers. If you are using these
        figures for a decision (buying a home, moving states, disputing an
        assessment), please verify against at least one of these:
      </p>
      <ul>
        <li>
          <a
            href="https://data.census.gov/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Census Data Explorer
          </a>{" "}
          &mdash; the official interface to ACS and survey tables.
        </li>
        <li>
          <a
            href="https://taxfoundation.org/data/all/state/property-taxes-by-state/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Tax Foundation
          </a>{" "}
          &mdash; independent tax policy research, publishes annual state
          rankings.
        </li>
        <li>
          <a
            href="https://www.lincolninst.edu/research-data/data-toolkits/significant-features-property-tax"
            target="_blank"
            rel="noopener noreferrer"
          >
            Lincoln Institute &ndash; Significant Features of the Property Tax
          </a>{" "}
          &mdash; academic reference maintained jointly with George
          Washington University.
        </li>
        <li>
          <a
            href="https://www.irs.gov/publications/p530"
            target="_blank"
            rel="noopener noreferrer"
          >
            IRS Publication 530
          </a>{" "}
          &mdash; official federal guidance on the SALT deduction, which
          governs how much of your property tax you can deduct.
        </li>
        <li>
          Your county assessor&apos;s office website — the only fully
          authoritative source for a specific parcel.
        </li>
      </ul>

      <h2>Update frequency</h2>
      <p>
        Property tax data is annual: the Census publishes ACS five-year
        estimates and the Annual Survey of State and Local Government
        Finances each year, typically with a 12\u201318 month lag. We refresh
        our dataset as soon as a new ACS release is available, and we label
        each page with the vintage of the underlying data.
      </p>

      <h2>Limitations you should know about</h2>
      <ul>
        <li>
          <strong>No individual-parcel resolution.</strong> We publish
          medians, not your specific bill. Two houses on the same street can
          have very different assessed values and exemptions.
        </li>
        <li>
          <strong>Exemptions not included.</strong> Homestead exemptions,
          senior freezes, veterans&apos; exemptions, and agricultural
          exemptions can dramatically reduce your effective bill. Our
          numbers reflect the unexempted median.
        </li>
        <li>
          <strong>Special district levies not broken out.</strong> School
          districts, fire districts, and other special assessments show up
          in your total bill but are rolled into the median rate we publish,
          not separated.
        </li>
        <li>
          <strong>Modeled county figures.</strong> As disclosed above,
          county-level rates are derived from the state baseline and should
          be treated as a comparison baseline rather than an assessor&apos;s
          figure.
        </li>
        <li>
          <strong>Not tax advice.</strong> Nothing on PropertyTaxPeek
          constitutes legal, tax, or financial advice. For decisions with
          money on the line, work with a licensed professional in your
          state.
        </li>
      </ul>

      <h2>Corrections and feedback</h2>
      <p>
        If you find a figure that disagrees with the authoritative source,
        or a state whose published numbers have been updated and ours have
        not, please <a href="/contact">contact us</a>. Corrections are the
        fastest way we improve the dataset.
      </p>

      <p className="text-sm text-slate-500 border-t pt-4 mt-8">
        This methodology page was last reviewed in March 2026. Material
        changes to how we source or compute the data will be reflected here
        before they reach production pages.
      </p>
    </article>
  );
}
