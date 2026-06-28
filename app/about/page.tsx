import type { Metadata } from "next";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AuthorBox } from "@/components/AuthorBox";
import { ABOUT_VINTAGE } from "@/lib/authorship";
import { getAllStates, getAllCounties } from "@/lib/db";
import { DATA_VINTAGE } from "@/lib/data-vintage";

export const metadata: Metadata = {
  title: "About PropertyTaxPeek",
  description:
    "PropertyTaxPeek indexes US property tax data — effective rates, median annual taxes, median home values, income burden bands, and assessment appeal mechanism tiers — for all 50 states and thousands of counties, anchored in Census ACS 2024 5-Year estimates.",
  alternates: { canonical: "/about/" },
  openGraph: { url: "/about/" },
};

export default function AboutPage() {
  const states = getAllStates();
  const counties = getAllCounties();

  return (
    <>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "About" }]} />
      <h1 className="text-3xl font-bold text-stone-900 mb-6">
        About PropertyTaxPeek
      </h1>
      <article className="prose prose-slate max-w-3xl">
        <p>
          PropertyTaxPeek is a free Census ACS-anchored reference tool that
          indexes effective property tax rates, median annual property taxes,
          median home values, IncomeBurdenBand bands, and
          AssessmentAppealSuccessTier mechanism tiers for {states.length} US
          states and {counties.length.toLocaleString()} counties. We exist so
          first-time homebuyers, retirees, and investors can compare Census ACS
          tax burdens across jurisdictions without paying for a research
          subscription.
        </p>

        <div className="not-prose grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-4 text-center">
            <div className="text-2xl font-bold text-indigo-700">
              {counties.length.toLocaleString()}
            </div>
            <div className="text-xs text-stone-500 mt-1">Counties</div>
          </div>
          <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4 text-center">
            <div className="text-2xl font-bold text-emerald-700">{states.length}</div>
            <div className="text-xs text-stone-500 mt-1">States &amp; DC</div>
          </div>
          <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-4 text-center">
            <div className="text-2xl font-bold text-amber-800">{DATA_VINTAGE.source}</div>
            <div className="text-xs text-stone-500 mt-1">Census ACS vintage</div>
          </div>
          <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-4 text-center">
            <div className="text-2xl font-bold text-amber-700">
              {DATA_VINTAGE.counties_kept.toLocaleString()}
            </div>
            <div className="text-xs text-stone-500 mt-1">Counties kept (Census ACS MOE-filtered)</div>
          </div>
        </div>

        <h2>Our Mission</h2>
        <p>
          Property tax is one of the largest recurring costs of homeownership,
          but it&apos;s also one of the least transparent — Census ACS-derived
          effective rates vary by an order of magnitude between counties, state
          DOR exemption schedules are scattered across state statutes, and the
          figures the IRS uses for the SALT deduction under IRC §164(b)(6)
          come from a different Census release than the rate your assessor
          publishes. Our goal is to put the same Census ACS numbers used by
          tax-policy researchers, the Tax Foundation, the Lincoln Institute of
          Land Policy, and academic property tax commissions in front of
          homeowners, in a format that takes seconds to read.
        </p>

        <h2>Data Sources</h2>
        <p>
          PropertyTaxPeek is anchored in the US Census Bureau&apos;s American
          Community Survey (Census ACS) 2024 5-Year estimates. Specifically,
          we ingest Census ACS table B25103 (median real estate taxes paid by
          owner-occupied units), Census ACS table B25077 (median home value),
          and Census ACS table B19013 (median household income, used for the
          IncomeBurdenBand denominator). Of {DATA_VINTAGE.counties_total_local.toLocaleString()}{" "}
          counties in our base set, {DATA_VINTAGE.counties_covered_by_census.toLocaleString()} are
          covered by the Census ACS release; {DATA_VINTAGE.counties_kept.toLocaleString()} pass
          our Census ACS margin-of-error filter (relative Census ACS MOE ≤{" "}
          {DATA_VINTAGE.moe_threshold_relative_pct}%) and are published with full numbers, and{" "}
          {DATA_VINTAGE.counties_suppressed} are suppressed because the Census ACS estimate is too
          imprecise to publish honestly.
        </p>
        <ul>
          <li>
            <strong>US Census Bureau ACS 2024 5-Year (Census ACS B25103,
            B25077, B19013).</strong> The legal authority for state- and
            county-level housing finance figures and the IncomeBurdenBand
            denominator.
          </li>
          <li>
            <strong>US Census State &amp; Local Government Finances.</strong>{" "}
            Cross-reference for total state-and-local property tax
            collections, used by our editorial team to reconcile
            county-level Census ACS aggregates against the published
            state total.
          </li>
        </ul>
        <p>
          We publish a detailed <a href="/methodology/">methodology page</a>{" "}
          explaining how we compute Census ACS-derived effective rates, why
          some counties fail the Census ACS MOE filter and are suppressed,
          and where our Census ACS-derived numbers should not be used as a
          substitute for an assessor&apos;s figure or a state DOR statutory
          rule.
        </p>

        <h2>How We Compute Effective Rates</h2>
        <p>
          The Census ACS-derived effective property tax rate is the ratio of
          Census ACS B25103 (median real estate taxes) to Census ACS B25077
          (median home value) — the same definition used by the Tax
          Foundation and the Lincoln Institute of Land Policy. We do not
          publish statutory mill rates, because mill rates without state DOR
          assessment ratios and state DOR exemption schedules are misleading.
          The Census ACS five-year smoothing window means that a single
          state legislative change or a single county reassessment year will
          not appear in the Census ACS B25103 figure until the next Census
          ACS release rolls forward.
        </p>

        <h2>How We Compute the IncomeBurdenBand</h2>
        <p>
          The IncomeBurdenBand tier shown on each state and county page is
          a deterministic five-band classifier computed as Census ACS B25103
          (median real estate taxes paid) divided by Census ACS B19013
          (median household income). Band cutoffs are: A (under 2.0%), B
          (2.0–3.0%), C (3.0–4.5%), D (4.5–6.0%), E (6.0% or greater).
          The band describes the typical household&apos;s Census
          ACS-reported property tax burden as a share of typical Census
          ACS-reported household income. The IncomeBurdenBand also
          surfaces a SALT cap binding flag against the IRC §164(b)(6)
          $10,000 cap added by the Tax Cuts and Jobs Act of 2017 (Public
          Law 115-97, §11042); the flag is informational and refers to
          IRS Publication 530 as the authority for federal Schedule A
          treatment, not to certified tax advice. The IncomeBurdenBand
          cutoffs are PropertyTaxPeek-chosen against the Lincoln Institute
          property tax burden literature; the underlying Census ACS B25103
          and Census ACS B19013 figures are authoritative Census Bureau
          publications.
        </p>

        <h2>How We Compute the AssessmentAppealSuccessTier</h2>
        <p>
          The AssessmentAppealSuccessTier tier shown on each state page is
          a deterministic classification of each state DOR&apos;s
          assessment appeal mechanism, anchored in the IAAO Standard on
          Property Tax Policy Section 7. The five mechanism types we
          encode are: independent tax court (NJ Tax Court under N.J.S.A.
          2B:13, MD Tax Court under Maryland Tax-Property Article
          §14-512, IL PTAB combined with the Cook County Assessor
          pathway, IN/MN/OH/CT state tax courts); hybrid (PA county
          boards plus state Tax Court, NY SCAR small-claims, MA ATB
          appellate tax board); administrative (most other state
          DOR-administered county boards); cap-sheltered (CA Proposition
          13 Article XIIIA, FL Save Our Homes Constitutional Amendment
          10, AZ Proposition 117, OR Measure 50, OK Article X §8B); and
          unknown where the state DOR has not published a structural
          overview. Where a publicized appeal success range exists (NJ
          Tax Court annual report, Cook County Assessor published appeal
          outcomes, MD Tax Court annual report, Travis CAD informal
          protest outcomes for Texas), the tier attaches that
          state-DOR-published range; otherwise the tier reflects the
          structural mechanism only.
        </p>

        <h2>How We Synthesize the PropertyTaxInterpretation Composite Verdict</h2>
        <p>
          The PropertyTaxInterpretation composite verdict box at the top
          of each state and county page synthesizes four deterministic
          Census ACS- and state DOR-anchored lever readings —
          EffectiveRateVsAssessmentDecoder, HomesteadExemptionMatrix,
          IncomeBurdenBand, and AssessmentAppealSuccessTier — into one of
          five escape-route recommendations (appeal-now / max-exemption /
          cap-shelter / move-to-low / data-incomplete) and one of four
          verdict tones (emerald / amber / rose / slate). The composite
          cites five authorities in the verdict footer: Census ACS B25103,
          Census ACS B25077, Census ACS B19013, IRC §164(b)(6) under the
          Tax Cuts and Jobs Act, and the IAAO Standard on Property Tax
          Policy Section 7. The composite verdict is editorial synthesis
          on top of those Census ACS figures and the IAAO Standard
          mechanism classification — it does not constitute tax advice,
          legal advice, or a substitute for a county assessor&apos;s
          certified figure or a state DOR statutory rule.
        </p>

        <h2>Editorial Practice</h2>
        <p>
          PropertyTaxPeek publishes through our PropertyTaxPeek Editorial
          Team byline, with named subject-matter editors anchoring each
          Census ACS release cycle and each state DOR exemption rotation.
          The editorial workflow audits each Census ACS release, flags
          counties whose Census ACS B25103 or Census ACS B19013 estimate
          fails the Census ACS MOE filter, reconciles state-level totals
          against the Census Annual Survey of State and Local Government
          Finances, and refreshes the HomesteadExemptionMatrix when a
          state DOR notice amends an exemption schedule. We disclose every
          Census ACS dataset&apos;s vintage on the page where it appears,
          and we split source vintage from page review date so that a
          page review does not falsely imply a fresh Census ACS release.
        </p>

        <h2>Part of the DataPeek Network</h2>
        <p>
          PropertyTaxPeek is part of the{" "}
          <a href="https://datapeekfacts.com" rel="noopener" target="_blank">
            DataPeek Research Network
          </a>
          , a collection of public-data tools covering Census ACS housing
          finance, healthcare, salary, ZIP code, and other civic datasets.
        </p>

        <h2>Contact</h2>
        <p>
          Have a correction, a Census ACS release date we missed, a state
          DOR exemption notice we have not ingested, an IAAO Standard
          rotation we have not reflected, or a county you would like
          added? Visit our <a href="/contact/">contact page</a>.
        </p>

        <h2>Source Authority Reference</h2>
        <p>
          For full source-by-source attribution: the Census ACS B25103
          median real estate taxes paid figure is published by the US
          Census Bureau as part of the Census ACS 2024 5-Year release;
          the Census ACS B25077 median home value figure is published by
          the US Census Bureau in the same Census ACS release; the
          Census ACS B19013 median household income figure is published
          by the US Census Bureau in the same Census ACS release. Census
          ACS suppression thresholds and the Census ACS Margin-of-Error
          methodology are documented by the Census Bureau directly.
          State DOR exemption schedules are published by each state DOR
          (FL DOR, CA BOE, NY ORPTS, TX Comptroller, AZ DOR, OR DOR, OK
          Tax Commission, etc.) under each state&apos;s constitutional
          and statutory framework. The federal SALT cap under IRC
          §164(b)(6) is documented in IRS Publication 530, and the IRS
          publishes annual Schedule A instructions that govern the
          deductibility of the Census ACS-reported property tax. The
          IAAO Standard on Property Tax Policy is published by the IAAO
          and anchors the AssessmentAppealSuccessTier mechanism
          classification. The Lincoln Institute of Land Policy
          Significant Features of the Property Tax database is the
          academic cross-reference for Census ACS-derived effective
          rates and IncomeBurdenBand cutoffs. The Tax Foundation
          publishes annual state property tax rankings from the same
          Census ACS B25103 ÷ Census ACS B25077 ratio. State tax court
          publications (NJ Tax Court annual report, MD Tax Court annual
          report) and county assessor publications (Cook County
          Assessor, Travis CAD) anchor the publicized appeal success
          ranges where they exist.
        </p>
        <p>
          Census ACS source citations on PropertyTaxPeek follow Census
          Bureau citation guidance: every Census ACS B25103, Census ACS
          B25077, or Census ACS B19013 figure points to the Census
          Bureau release at data.census.gov, every IRS Publication 530
          reference points to the IRS at irs.gov/publications/p530,
          and every state DOR rule reference points to the state DOR
          directly. Where the Census ACS five-year period estimate
          fails the relative Census ACS MOE filter, the Census Bureau
          recommends suppression, and PropertyTaxPeek follows that
          Census Bureau recommendation by withholding the county figure
          rather than publishing an unreliable Census ACS point
          estimate. The IRS treats the post-TCJA IRC §164(b)(6) SALT
          cap as a federal Schedule A limit, and the IRS Publication
          530 instructions are the authoritative reference for that
          federal treatment of the Census ACS-reported property tax
          amount.
        </p>
      </article>
      <AuthorBox vintage={ABOUT_VINTAGE} source="PropertyTaxPeek about page (Census ACS B25103/B25077/B19013, state DOR, IAAO Standard, IRS Publication 530 / IRC §164(b)(6))" />
    </>
  );
}
