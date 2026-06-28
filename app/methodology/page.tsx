import type { Metadata } from "next";
import { AuthorBox } from "@/components/AuthorBox";
import { METHODOLOGY_VINTAGE } from "@/lib/authorship";

export const metadata: Metadata = {
  title: "Our Methodology — How PropertyTaxPeek Builds Its Census ACS Data",
  description:
    "Exactly how PropertyTaxPeek sources, computes, and presents US property tax rates — including the Census ACS B25103, B25077, and B19013 inputs we rely on, the IAAO Standard mechanism classification, the state DOR exemption rules we encode, and the limits of our county-level figures.",
  alternates: { canonical: "/methodology/" },
  openGraph: { url: "/methodology/" },
};

export default function MethodologyPage() {
  return (
    <article className="prose prose-slate max-w-3xl mx-auto">
      <h1>Our Methodology</h1>
      <p className="lead text-lg text-stone-600">
        Property tax is a money decision, so we think you deserve a clear,
        unflinching explanation of where our Census ACS numbers come from. This
        page documents our Census ACS sources, our state DOR cross-references,
        our IAAO Standard mechanism classification, our IRS Publication 530
        SALT-cap framing, our computation of each editorial lever, and —
        importantly — what our Census ACS-derived data is not.
      </p>

      <h2>Primary data source: US Census Bureau</h2>
      <p>
        Our state- and county-level figures are anchored in the{" "}
        <a
          href="https://www.census.gov/programs-surveys/acs/"
          target="_blank"
          rel="noopener noreferrer"
        >
          US Census Bureau American Community Survey (Census ACS)
        </a>{" "}
        five-year estimates, and the{" "}
        <a
          href="https://www.census.gov/programs-surveys/gov-finances.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          Census Annual Survey of State and Local Government Finances
        </a>
        . For each US state we publish the Census ACS-derived effective
        property tax rate, the Census ACS B25103 median annual property tax,
        and the Census ACS B25077 median owner-occupied home value for the
        most recent complete Census ACS release. We also publish the Census
        ACS B19013 median household income, which is the denominator of the
        IncomeBurdenBand. These are the same raw Census ACS inputs the Tax
        Foundation and the Lincoln Institute of Land Policy academic
        researchers use when they publish state burden rankings.
      </p>

      <h2>How we compute the effective rate</h2>
      <p>
        The Census ACS-derived effective property tax rate is a ratio, not a
        statutory rate. We compute it as:
      </p>
      <pre className="bg-stone-50 p-4 rounded text-sm overflow-x-auto">
        {`effective_rate = Census ACS B25103 (median annual property tax) / Census ACS B25077 (median owner-occupied home value)`}
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
        what their home is worth — and avoids headline statutory mill rates
        that vary with state DOR assessment ratios, state DOR exemption
        schedules, and district-level add-ons.
      </p>

      <h2>How we compute the IncomeBurdenBand</h2>
      <p>
        The IncomeBurdenBand tier displayed on each state and county page is
        a deterministic five-band classifier computed against Census ACS
        inputs:
      </p>
      <pre className="bg-stone-50 p-4 rounded text-sm overflow-x-auto">
        {`burden_ratio = Census ACS B25103 (median real estate taxes paid) / Census ACS B19013 (median household income)

band cutoffs:
  A  — under 2.0%
  B  — 2.0% to 3.0%
  C  — 3.0% to 4.5%
  D  — 4.5% to 6.0%
  E  — 6.0% or greater`}
      </pre>
      <p>
        Both inputs are sourced from the Census Bureau Census ACS 2024 5-Year
        release: Census ACS B25103 is the median real estate taxes paid by
        owner-occupied units, and Census ACS B19013 is the median household
        income across all households (owner and renter). The IncomeBurdenBand
        band cutoffs are PropertyTaxPeek-chosen against the Lincoln Institute
        of Land Policy property tax burden literature; the underlying Census
        ACS B25103 and Census ACS B19013 figures are authoritative Census
        Bureau publications. The IncomeBurdenBand surfaces a SALT cap binding
        flag against the IRC §164(b)(6) $10,000 cap added by the Tax Cuts
        and Jobs Act of 2017 (Public Law 115-97, §11042); the flag is
        informational and refers to IRS Publication 530 for federal Schedule
        A treatment. Where either Census ACS B25103 or Census ACS B19013
        fails the relative Census ACS MOE filter, the band is suppressed
        rather than published with a misleading figure.
      </p>

      <h2>How we compute the AssessmentAppealSuccessTier</h2>
      <p>
        The AssessmentAppealSuccessTier tier displayed on each state page is
        a deterministic classification of each state DOR&apos;s assessment
        appeal mechanism, anchored in the IAAO Standard on Property Tax
        Policy Section 7. The five mechanism types are:
      </p>
      <ul>
        <li>
          <strong>Independent tax court.</strong> NJ Tax Court under
          N.J.S.A. 2B:13; MD Tax Court under Maryland Tax-Property Article
          §14-512; IL PTAB combined with the Cook County Assessor
          pathway for Cook County appeals; IN/MN/OH/CT statutory state
          tax courts. The state DOR publishes the procedure; the IAAO
          Standard recognizes the structure as an independent tax court
          mechanism.
        </li>
        <li>
          <strong>Hybrid.</strong> PA county boards plus the state Tax
          Court; NY SCAR small-claims assessment review; MA ATB appellate
          tax board. State DOR rules document the path; IAAO Standard
          Section 7 categorizes the hybrid mechanism.
        </li>
        <li>
          <strong>Administrative.</strong> Most other state DOR-administered
          county boards of review and equalization. The IAAO Standard
          treats administrative review as the baseline mechanism when no
          independent tax court is available.
        </li>
        <li>
          <strong>Cap-sheltered.</strong> States whose constitutional or
          statutory caps materially reduce the value of assessment appeals
          for owner-occupied homesteads: CA Proposition 13 Article XIIIA;
          FL Save Our Homes Constitutional Amendment 10; AZ Proposition
          117; OR Measure 50; OK Article X §8B. The state DOR publishes
          the cap mechanism; the IAAO Standard recognizes cap-sheltered
          structures as a distinct category.
        </li>
        <li>
          <strong>Unknown.</strong> States where the state DOR has not
          published a clear structural overview of the appeal mechanism.
        </li>
      </ul>
      <p>
        Where a publicized appeal success range exists from a state DOR
        annual report (NJ Tax Court annual report, Cook County Assessor
        published appeal outcomes, MD Tax Court annual report, Travis CAD
        informal-protest outcomes for Texas), the
        AssessmentAppealSuccessTier attaches that state-DOR-published
        range; otherwise the tier reflects the structural mechanism only.
      </p>

      <h2>How we synthesize the PropertyTaxInterpretation composite verdict</h2>
      <p>
        The PropertyTaxInterpretation composite verdict box atop each
        state and county page synthesizes four deterministic Census ACS-
        and state DOR-anchored lever readings into a single verdict tone
        and an escape-route recommendation:
      </p>
      <ul>
        <li>
          <strong>EffectiveRateVsAssessmentDecoder</strong> — Census ACS
          B25103 ÷ Census ACS B25077 read against the state DOR-published
          assessment ratio.
        </li>
        <li>
          <strong>HomesteadExemptionMatrix</strong> — state DOR statutory
          homestead, senior, veteran, and disability exemption schedule
          plus any cap mechanism (Proposition 13, Save Our Homes,
          Proposition 117, Measure 50, Article X §8B).
        </li>
        <li>
          <strong>IncomeBurdenBand</strong> — Census ACS B25103 ÷ Census
          ACS B19013, cut into five bands against the Lincoln Institute
          burden literature, with a SALT cap binding flag against IRC
          §164(b)(6) under the Tax Cuts and Jobs Act.
        </li>
        <li>
          <strong>AssessmentAppealSuccessTier</strong> — state DOR
          assessment appeal mechanism anchored in IAAO Standard Section
          7, with publicized success ranges attached where state tax
          courts (NJ Tax Court, MD Tax Court) or county assessors (Cook
          County, Travis CAD) have published outcome data.
        </li>
      </ul>
      <p>
        The composite branches into one of five escape-route
        recommendations — appeal-now (where
        AssessmentAppealSuccessTier mechanism is favorable and Census
        ACS-derived effective rate is high), max-exemption (where
        HomesteadExemptionMatrix tier is high), cap-shelter (where the
        state is on the cap-sheltered list above), move-to-low (where
        Census ACS B25103 burden is extreme and no relief is locally
        available), or data-incomplete (where the Census ACS MOE filter
        suppressed one or more inputs). The five authorities cited in
        the verdict footer are: Census ACS B25103, Census ACS B25077,
        Census ACS B19013, IRC §164(b)(6) under the Tax Cuts and Jobs
        Act, and the IAAO Standard on Property Tax Policy Section 7.
      </p>

      <h2>Important: how county-level figures are produced</h2>
      <div className="not-prose border-l-4 border-amber-400 bg-amber-50 p-4 my-4 rounded-r">
        <p className="text-sm text-amber-900">
          <strong>Disclosure.</strong> Our county-level Census ACS B25103
          figures are <em>modeled</em>, not scraped from individual county
          assessors. We start from the state-level Census ACS effective rate
          and generate county variations within a bounded Census ACS MOE
          range so that users can get a neighborhood-scale starting point
          for comparison.
        </p>
      </div>
      <p>
        Here is exactly what that means:
      </p>
      <ul>
        <li>
          The <strong>state</strong> rate, Census ACS B25103 median tax, and
          Census ACS B25077 median home value are real published Census ACS
          figures.
        </li>
        <li>
          The <strong>county</strong> rates shown on our county pages are
          produced by varying the state Census ACS baseline within a limited
          Census ACS MOE range to reflect typical within-state dispersion,
          keyed deterministically to each county&apos;s identifier so that
          the same county always shows the same figure.
        </li>
        <li>
          The county numbers are intended as a <strong>rough Census
          ACS-derived comparison baseline</strong>, not as a replacement for
          your county assessor&apos;s published rate or your state DOR
          statutory rule or your individual tax bill.
        </li>
      </ul>
      <p>
        If you need the exact rate for a specific address, please consult
        your county assessor&apos;s office, your state DOR statutory
        schedule, or your most recent property tax bill. We link to state
        and Census resources so you can verify any Census ACS figure you
        see here.
      </p>

      <h2>Cross-reference and verification</h2>
      <p>
        Every state and county page on PropertyTaxPeek links out to the
        authoritative Census ACS, state DOR, IRS, IAAO, and Lincoln
        Institute sources behind our numbers. If you are using these
        Census ACS-derived figures for a decision (buying a home, moving
        states, disputing an assessment), please verify against at least
        one of these:
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
          — the official interface to Census ACS B25103, Census ACS
          B25077, and Census ACS B19013 tables.
        </li>
        <li>
          <a
            href="https://taxfoundation.org/data/all/state/property-taxes-by-state/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Tax Foundation
          </a>{" "}
          — independent tax policy research that publishes annual state
          property tax rankings derived from the same Census ACS B25103
          and Census ACS B25077 inputs.
        </li>
        <li>
          <a
            href="https://www.lincolninst.edu/research-data/data-toolkits/significant-features-property-tax"
            target="_blank"
            rel="noopener noreferrer"
          >
            Lincoln Institute of Land Policy &mdash; Significant Features of the Property Tax
          </a>{" "}
          — academic reference maintained jointly with George Washington
          University. The Lincoln Institute defines assessment ratio,
          classified assessment, circuit breaker, and effective rate in
          ways our editorial layers follow.
        </li>
        <li>
          <a
            href="https://www.irs.gov/publications/p530"
            target="_blank"
            rel="noopener noreferrer"
          >
            IRS Publication 530
          </a>{" "}
          — official federal guidance on the SALT deduction under IRC
          §164(b)(6), which governs how much of your Census ACS-reported
          property tax you can deduct on Schedule A.
        </li>
        <li>
          IAAO Standard on Property Tax Policy — the structural authority
          for AssessmentAppealSuccessTier mechanism classification and
          assessment ratio study methodology.
        </li>
        <li>
          Your state DOR — the statutory authority for exemption schedule,
          assessment ratio, appeal procedure, and any cap mechanism
          (Proposition 13, Save Our Homes, Proposition 117, Measure 50,
          Article X §8B).
        </li>
        <li>
          Your county assessor&apos;s office — the only fully authoritative
          source for a specific parcel.
        </li>
      </ul>

      <h2>Update frequency</h2>
      <p>
        Census ACS property tax data is annual: the Census Bureau publishes
        Census ACS 5-Year estimates and the Census Annual Survey of State
        and Local Government Finances each year, typically with a 12–18
        month lag. We refresh our Census ACS B25103, Census ACS B25077, and
        Census ACS B19013 datasets as soon as a new Census ACS release is
        available, and we label each page with the Census ACS vintage of
        the underlying data. The HomesteadExemptionMatrix is refreshed on
        state DOR notice cadence, which is independent of the Census ACS
        cycle.
      </p>

      <h2>Limitations you should know about</h2>
      <ul>
        <li>
          <strong>No individual-parcel resolution.</strong> We publish
          Census ACS medians, not your specific bill. Two houses on the
          same street can have very different state DOR assessed values
          and county-assessor exemptions.
        </li>
        <li>
          <strong>Exemptions not included in Census ACS medians.</strong>{" "}
          State DOR homestead exemptions, senior freezes, veterans&apos;
          exemptions, and agricultural exemptions can dramatically reduce
          your effective Census ACS-reported bill. Our numbers reflect
          the unexempted Census ACS B25103 median.
        </li>
        <li>
          <strong>Special district levies not broken out.</strong> School
          districts, fire districts, and other special assessments show
          up in your total Census ACS B25103 bill but are rolled into the
          Census ACS median rate we publish, not separated.
        </li>
        <li>
          <strong>Modeled county figures.</strong> As disclosed above,
          county-level Census ACS B25103-derived rates are produced from
          the state Census ACS baseline and should be treated as a
          comparison baseline rather than an assessor&apos;s figure.
        </li>
        <li>
          <strong>Not tax advice.</strong> Nothing on PropertyTaxPeek
          constitutes legal, tax, or financial advice. For decisions
          with money on the line, work with a licensed property tax
          professional in your state, your state DOR, or your county
          assessor.
        </li>
      </ul>

      <h2>Corrections and feedback</h2>
      <p>
        If you find a Census ACS-derived figure that disagrees with the
        authoritative Census Bureau release, a HomesteadExemptionMatrix
        tier that misclassifies a state relative to the state DOR
        statute, an AssessmentAppealSuccessTier that misclassifies a
        state relative to the IAAO Standard taxonomy, or a state whose
        published Census ACS numbers have been updated and ours have
        not, please <a href="/contact">contact us</a>. Corrections are
        the fastest way we improve the Census ACS dataset.
      </p>

      <p className="text-sm text-stone-500 border-t pt-4 mt-8">
        This methodology page was last reviewed on{" "}
        <time dateTime={METHODOLOGY_VINTAGE}>{METHODOLOGY_VINTAGE}</time>. Material
        changes to how we source or compute the Census ACS data — or how
        we classify state DOR rules in the HomesteadExemptionMatrix or
        the AssessmentAppealSuccessTier — will be reflected here before
        they reach production pages.
      </p>
      <AuthorBox vintage={METHODOLOGY_VINTAGE} source="PropertyTaxPeek editorial methodology (Census ACS B25103/B25077/B19013, state DOR, IAAO Standard Section 7, IRS Publication 530 / IRC §164(b)(6))" />
    </article>
  );
}
