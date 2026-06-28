import type { Metadata } from "next";
import { LEGAL_VINTAGES } from "@/lib/authorship";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "Disclaimer and limitations of liability for PropertyTaxPeek — Census ACS-derived property tax data is informational, not a substitute for your county assessor or a licensed tax professional.",
  alternates: { canonical: "/disclaimer/" },
  openGraph: { url: "/disclaimer/" },
};

export default function DisclaimerPage() {
  return (
    <article className="prose prose-slate max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-amber-800 mb-6">Disclaimer</h1>
      <p className="text-sm text-stone-500 mb-8">
        Last updated:{" "}
        <time dateTime={LEGAL_VINTAGES.disclaimer}>{LEGAL_VINTAGES.disclaimer}</time>
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">1. PropertyTaxPeek is an informational Census ACS-derived reference, not a tax-filing or assessment tool</h2>
      <p>
        PropertyTaxPeek publishes effective property tax rates, median annual property tax,
        median home value, statutory homestead exemption metadata, income burden ratios,
        and assessment appeal structural classifications for US states and counties.
        Every page is built on publicly available data from the US Census Bureau —
        primarily the Census American Community Survey (ACS) 2024 5-Year release (table
        B25103, real estate taxes paid; table B25077, median home value; table B19013,
        median household income) and the Census Annual Survey of State and Local
        Government Finances. The information on this site is for general
        informational and educational purposes only. While we strive to keep each
        Census ACS-derived figure accurate and tied to the most recent Census release,
        we make no representations or warranties of any kind, express or implied, about
        the completeness, accuracy, reliability, or suitability of the Census ACS
        information for any specific parcel, household, or tax-year decision. Readers
        making a money decision must verify each Census ACS figure against the Census
        Bureau release at data.census.gov and against their county assessor or state DOR.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">2. Property tax data ≠ legal classification</h2>
      <p>
        Every property tax bill you actually pay is the product of a chain of decisions
        made by your county assessor, your state Department of Revenue (state DOR),
        your school district, and the special-purpose taxing districts (fire, library,
        sewer, water, community college, MUD) that share your parcel. The Census ACS
        figures we publish are aggregate medians at the county and state level — they
        describe the typical homeowner&apos;s burden, not your statutory liability.
        Final tax determinations are made by your local county assessor and tax
        authority. Rates, assessment ratios, and exemption amounts vary by jurisdiction
        and change every state legislative session. The IRS treatment of the property
        tax you pay — specifically the SALT deduction cap under IRC §164(b)(6) added
        by the Tax Cuts and Jobs Act of 2017 (Public Law 115-97, §11042) — is its own
        separate determination and is documented in IRS Publication 530. The Census
        ACS-reported tax we display and the IRS Schedule A deductible amount are
        related but distinct figures.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">3. EffectiveRateVsAssessmentDecoder is a reading aid, not a binding rate</h2>
      <p>
        EffectiveRateVsAssessmentDecoder is the editorial reading layer that compares
        the Census ACS-derived effective rate (Census ACS B25103 ÷ Census ACS B25077)
        against the assessment ratio reported by the state DOR. It exists to help
        readers understand why two counties with similar nominal mill rates can produce
        very different annual tax bills. It is <strong>not</strong> a substitute for
        an assessor&apos;s certified tax calculation. The following are <em>not</em>
        included in our effective-rate figure and can materially change your actual
        bill:
      </p>
      <ul>
        <li>
          <strong>County-specific reassessment cycles.</strong> The Census ACS B25103
          tax figure is a five-year smoothed median; your assessor may have just
          completed a cyclical reassessment that raised your taxable basis well above
          the Census ACS median.
        </li>
        <li>
          <strong>Homestead, senior, and veteran exemption variation.</strong> Census
          ACS B25103 reports tax actually paid, but the median masks the wide spread
          between homesteaded and non-homesteaded parcels in the same county, which
          the state DOR exemption rules govern separately.
        </li>
        <li>
          <strong>TIF and abatement districts.</strong> Properties inside a Tax
          Increment Financing district often carry a frozen base — not reflected in
          Census ACS B25103 medians.
        </li>
        <li>
          <strong>School district add-ons.</strong> Census ACS B25103 aggregates total
          tax; the school portion can shift more than 1% year to year independent of
          the state-level rate change reported by the state DOR.
        </li>
        <li>
          <strong>Special assessment levies.</strong> Sidewalk, drainage, library
          improvement, and similar one-time levies do not appear in the recurring
          Census ACS B25103 median.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">4. HomesteadExemptionMatrix ≠ filing certification</h2>
      <p>
        The HomesteadExemptionMatrix tier we display for each state is a deterministic
        classification of the statutory homestead, senior, veteran, and disability
        exemption rules as they existed at the matrix vintage. It is built from
        published state DOR rules and cross-checked against the Census Annual Survey
        of State and Local Government Finances aggregate collections, but it does
        <strong> not</strong> certify your filing eligibility, does not substitute for
        the homestead application your county assessor requires, and does not capture
        county-level supplements. Filing deadlines, income tests, and residency
        requirements are set by state law and revised by state legislatures — verify
        with your county assessor or a licensed tax professional before relying on any
        matrix entry for a filing decision. The Matrix references published state DOR
        rules (FL DOR DR-501, CA BOE Prop 13 Article XIIIA, NY ORPTS RP-425, TX
        Comptroller §11.13 et seq.), and where a state DOR has issued a notice
        amending the exemption schedule after our Matrix vintage, the assessor&apos;s
        published rule governs.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">5. IncomeBurdenBand is a Census ACS reading aid, not a certified ability-to-pay determination</h2>
      <p>
        The IncomeBurdenBand tier displayed on each state and county page is computed
        as the ratio of Census ACS B25103 (median real estate taxes paid by
        owner-occupied units) to Census ACS B19013 (median household income),
        bucketed into five bands: A (under 2%), B (2.0–3.0%), C (3.0–4.5%), D
        (4.5–6.0%), E (6.0% or greater). The IncomeBurdenBand is a Census ACS reading
        layer — it describes the typical household&apos;s property tax burden as a
        share of typical household income at the county or state level, and it does
        <strong> not</strong> certify any specific household&apos;s ability to pay
        the assessed tax. The Census ACS B19013 median household income figure
        captures all owner and renter households, not only owner-occupied homeowners,
        so the IncomeBurdenBand can be understood as an aggregate civic indicator,
        not a per-parcel underwriting input. The SALT cap binding flag on the
        IncomeBurdenBand is computed against the IRC §164(b)(6) $10,000 statutory
        cap added by the Tax Cuts and Jobs Act of 2017 and is informational only —
        IRS Publication 530 governs the actual federal Schedule A deductible amount,
        and Schedule A is itself only available to itemizing filers, which the
        Census ACS B19013 figure does not enumerate. Lincoln Institute of Land
        Policy Significant Features of the Property Tax is the academic
        cross-reference for IncomeBurdenBand definitions of effective burden;
        Tax Foundation publishes the annual state burden ranking that uses a
        similar but not identical Census ACS-derived ratio.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">6. AssessmentAppealSuccessTier is a structural classification, not an appeal outcome prediction</h2>
      <p>
        The AssessmentAppealSuccessTier tier displayed on each state page is a
        deterministic classification of each state&apos;s assessment appeal
        mechanism, drawn from state DOR publications and the IAAO Standard on
        Property Tax Policy (International Association of Assessing Officers).
        The five mechanism types we encode are: independent tax court (NJ Tax
        Court under N.J.S.A. 2B:13, MD Tax Court under Maryland Tax-Property
        Article §14-512, IL PTAB plus Cook County Assessor for Cook County
        appeals, IN/MN/OH/CT statutory tax courts); hybrid (PA county boards
        plus state Tax Court, NY SCAR small-claims, MA ATB appellate tax
        board); administrative (most other state DOR-administered county
        boards); cap-sheltered (CA Proposition 13 Article XIIIA, FL Save Our
        Homes Constitutional Amendment 10, AZ Proposition 117, OR Measure 50,
        OK Article X §8B); and unknown where the state DOR has not published
        a structural overview. Where a publicized appeal success range exists
        (NJ Tax Court annual reports, Cook County Assessor published appeal
        outcomes, MD Tax Court annual reports, Travis CAD published informal
        appeal outcomes for Texas), the tier attaches that range; otherwise
        the tier reflects the structural mechanism only. The
        AssessmentAppealSuccessTier <strong>does not predict your individual
        appeal outcome</strong>, does not constitute legal advice for filing
        an assessment appeal, and does not capture the appeal-filing fee,
        evidence requirements, or statutory deadline that your state DOR and
        county assessor will require. Engage a property tax attorney or a
        state DOR-certified consultant before filing.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">7. PropertyTaxInterpretation composite is an editorial reading, not a certified recommendation</h2>
      <p>
        The PropertyTaxInterpretation composite verdict (the &quot;reader-help&quot;
        box at the top of each state and county page) synthesizes four
        deterministic lever readings — EffectiveRateVsAssessmentDecoder (built on
        Census ACS B25103 ÷ Census ACS B25077), HomesteadExemptionMatrix (built
        on state DOR statutory rules), IncomeBurdenBand (built on Census ACS
        B25103 ÷ Census ACS B19013), and AssessmentAppealSuccessTier (built on
        state DOR mechanism plus IAAO Standard) — into a single verdict tone
        (emerald / amber / rose / slate) and one of five escape-route
        recommendations (appeal-now / max-exemption / cap-shelter / move-to-low /
        data-incomplete). The composite verdict is an editorial reading layer,
        not a certified recommendation, and does not constitute tax advice,
        legal advice, financial planning, or fiduciary guidance. The
        authorities cited in the composite footer (Census ACS B25103, Census
        ACS B25077, Census ACS B19013, IRC §164(b)(6) under the Tax Cuts and
        Jobs Act, IAAO Standard on Property Tax Policy Section 7) are the
        upstream factual anchors; the composite branching is editorial
        synthesis on top of those Census ACS figures and state DOR rules.
        Readers acting on the composite must verify each underlying Census
        ACS-derived figure against the Census release and consult a licensed
        tax professional, a property tax attorney, or their county assessor
        before filing an appeal, claiming an exemption, or relying on a
        Schedule A SALT calculation.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">8. Census ACS data has known limitations</h2>
      <p>
        The Census Bureau publishes the American Community Survey as five-year period
        estimates because annual Census ACS data on small counties would be too
        volatile to publish. Every Census ACS figure carries a Margin of Error (MOE),
        and small counties can have Census ACS MOEs large enough that the Census
        Bureau itself suppresses the estimate. PropertyTaxPeek applies a
        relative-MOE filter on Census ACS B25103 and Census ACS B19013 and
        suppresses county pages whose Census ACS estimate exceeds the MOE filter
        threshold rather than publishing an unreliable number. Counties that pass
        the Census ACS MOE filter are still smoothed over five years, so a single
        state legislative change or a single reassessment year published by the
        county assessor will not appear in the Census ACS-derived figure until the
        next Census ACS release rolls forward. Lincoln Institute of Land Policy and
        the Tax Foundation use the same Census ACS B25103 and B25077 inputs and
        face the same five-year smoothing window.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">9. Not Professional Advice</h2>
      <p>
        Nothing on PropertyTaxPeek constitutes professional advice of any kind,
        including but not limited to tax, legal, financial, or career advice. Any
        reliance you place on the Census ACS-derived numbers, the
        EffectiveRateVsAssessmentDecoder reading, the HomesteadExemptionMatrix
        classification, the IncomeBurdenBand band, the AssessmentAppealSuccessTier
        tier, or the PropertyTaxInterpretation composite verdict is strictly at
        your own risk. Before relying on any Census ACS figure for a purchase,
        sale, refinance, assessment appeal, or IRS Schedule A filing under IRC
        §164(b)(6), consult a qualified tax professional licensed in your state,
        your county assessor, your state DOR, or the IRS directly (see IRS
        Publication 530 for federal treatment of property tax under the SALT cap).
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">10. Data Accuracy &amp; Vintage</h2>
      <p>
        Data displayed on PropertyTaxPeek is sourced from publicly available US
        Census Bureau releases (Census ACS 2024 5-Year and the Census Annual
        Survey of State and Local Government Finances). While we make reasonable
        efforts to refresh on each Census ACS publication cycle and to apply our
        Census ACS MOE filter consistently, the data may contain transcription
        errors, be outdated relative to a state legislative change made after the
        Census ACS release date, or have known Census-side limitations. Users
        should independently verify critical Census ACS information against the
        authoritative Census Bureau release (data.census.gov), their county
        assessor&apos;s office, their state DOR, the IAAO Standard, or the IRS
        before making any decision with money on the line.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">11. External Links</h2>
      <p>
        This website contains links to external websites, including the US Census
        Bureau, the IRS, state Departments of Revenue (state DORs), the Tax
        Foundation, the Lincoln Institute of Land Policy, the IAAO, NJ Tax Court,
        MD Tax Court, Cook County Assessor, Travis CAD, and assorted state
        property tax commissions, that are not under our control. We provide
        these links so readers can verify the underlying Census ACS data, the
        statutory exemption rule cited from the state DOR, the appeal mechanism
        cited from IAAO Standard, or the federal SALT cap cited from IRS
        Publication 530, but we have no responsibility for the content, privacy
        policies, or practices of any third-party site.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">12. Advertising</h2>
      <p>
        PropertyTaxPeek displays third-party advertisements through Google AdSense
        and other ad networks. These advertisements are provided by third parties
        and do not imply endorsement by PropertyTaxPeek. We are not responsible
        for the content or accuracy of any advertisements displayed on this
        website, nor do advertisers influence how Census ACS data is presented or
        how the EffectiveRateVsAssessmentDecoder, HomesteadExemptionMatrix,
        IncomeBurdenBand, AssessmentAppealSuccessTier, or PropertyTaxInterpretation
        composite editorial layers are computed.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">13. Limitation of Liability</h2>
      <p>
        In no event shall PropertyTaxPeek, its owners, operators, or contributors
        be liable for any direct, indirect, incidental, consequential, or punitive
        damages arising from the use of this website or the Census ACS data,
        Census ACS-derived editorial readings, HomesteadExemptionMatrix
        classifications, IncomeBurdenBand bands, AssessmentAppealSuccessTier
        tiers, or PropertyTaxInterpretation composite verdicts contained herein.
        This includes, without limitation, losses arising from over- or
        under-payment of property tax, missed homestead filing deadlines, IRS
        Schedule A miscalculations under IRC §164(b)(6), mortgage escrow
        shortages, assessment appeal filings that fail at the state tax court or
        county assessment board, or any other money-related decision made in
        reliance on this site. Tax determinations are between you, your county
        assessor, your state DOR, and the IRS.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">14. Contact</h2>
      <p>
        If you have concerns about any content on this website, or if you have
        identified a discrepancy between our Census ACS-derived figure and the
        Census Bureau&apos;s authoritative release, please visit our{" "}
        <a href="/contact" className="text-amber-800 hover:underline">contact page</a>{" "}
        and we will route the question to the editorial team. Questions about the
        underlying Census ACS release are best directed to the Census Bureau at
        data.census.gov; questions about state DOR exemption rules are best
        directed to your state DOR; questions about the SALT cap are best
        directed to IRS Publication 530.
      </p>
    </article>
  );
}
