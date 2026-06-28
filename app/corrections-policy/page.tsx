import type { Metadata } from "next";
import { LEGAL_VINTAGES } from "@/lib/authorship";

export const metadata: Metadata = {
  title: "Corrections Policy",
  description: "How PropertyTaxPeek processes Census ACS corrections, state DOR exemption-rule updates, IRS Pub 530 changes, IAAO Standard rotations, and reader-flagged Census ACS discrepancies.",
  alternates: { canonical: "/corrections-policy/" },
  openGraph: { url: "/corrections-policy/" },
};

export default function CorrectionsPolicyPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12 prose prose-slate">
      <h1>Corrections Policy</h1>
      <p className="text-sm text-stone-500 mb-8">
        Last reviewed:{" "}
        <time dateTime={LEGAL_VINTAGES.correctionsPolicy}>{LEGAL_VINTAGES.correctionsPolicy}</time>
      </p>
      <p className="lead">
        This page documents how PropertyTaxPeek processes corrections,
        distinguishes a factual error from a Census ACS vintage refresh, and
        lays out the escalation path when a reader believes a Census ACS-derived
        figure disagrees with the authoritative Census release, the state DOR
        rule, the IRS Publication 530 guidance, or the IAAO Standard mechanism
        classification.
      </p>

      <h2>1. Two types of correction</h2>
      <p>
        PropertyTaxPeek treats <strong>factual errors</strong> and{" "}
        <strong>editorial methodology revisions</strong> as separate
        correction classes. A factual error is a transcription mistake, a
        stale Census ACS county figure, a state DOR statutory exemption that
        has been amended since our last ingest, a Census Bureau revision to a
        previously published Census ACS estimate, or an IAAO Standard
        Section 7 update that reclassifies a state&apos;s appeal mechanism.
        An editorial methodology revision is a change to how the
        EffectiveRateVsAssessmentDecoder is computed, how the
        HomesteadExemptionMatrix classifies a state, how the
        IncomeBurdenBand bands are cut against Census ACS B25103 ÷ Census
        ACS B19013, how the AssessmentAppealSuccessTier tiers map onto
        state DOR mechanism types, or how the PropertyTaxInterpretation
        composite verdict synthesizes those four lever readings. Factual
        errors are corrected as soon as verified; methodology revisions are
        documented on the editorial policy page before reaching production.
      </p>

      <h2>2. Census ACS release rotation (annual)</h2>
      <p>
        The Census Bureau publishes a new American Community Survey (Census
        ACS) 5-Year release every December. When the new Census ACS release
        becomes available, we ingest Census ACS tables B25103 (real estate
        taxes paid), B25077 (median home value), and B19013 (median household
        income) for every state and county, re-apply the relative Census ACS
        Margin-of-Error filter, and publish updated effective rates,
        IncomeBurdenBand bands, and Census ACS vintage labels. A Census ACS
        release rotation is a vintage refresh, not a correction — the
        previous Census ACS figure was accurate to its Census release, and
        the new Census ACS figure is accurate to the newer Census release.
      </p>

      <h2>3. Census Annual Survey of State and Local Government Finances rotation</h2>
      <p>
        The Census Bureau publishes the Annual Survey of State and Local
        Government Finances with a longer lag than the Census ACS. When the
        Census Government Finances aggregate disagrees materially with the
        sum of our county-level Census ACS B25103 values, the editorial team
        reviews the discrepancy and either (a) flags the affected county
        with a Census ACS suppression notice if the Census ACS values fail
        reconciliation, or (b) documents the reconciliation gap on the
        methodology page against the Lincoln Institute and Tax Foundation
        state burden cross-references.
      </p>

      <h2>4. IRS Publication 530 / SALT cap rotation</h2>
      <p>
        Federal treatment of property tax for Schedule A purposes is
        governed by IRS Publication 530 and IRC §164(b)(6) — the
        post-TCJA $10,000 SALT cap added by the Tax Cuts and Jobs Act of
        2017 (Public Law 115-97, §11042). When the IRS issues a revised
        Publication 530 or when Congress amends IRC §164(b)(6), we update
        any page that references the SALT treatment to match the
        IRS-published guidance, refresh the IncomeBurdenBand SALT-cap
        binding flag, and date-stamp the page review. The IRS guidance is
        not data we publish — it is the legal framework that frames the
        federal deductibility of the Census ACS-reported tax.
      </p>

      <h2>5. State DOR exemption rule rotation</h2>
      <p>
        State DOR homestead, senior, veteran, and disability exemption
        rules are amended in state legislative sessions. The
        HomesteadExemptionMatrix is reviewed whenever a state DOR issues a
        notice that an exemption amount, income test, or filing deadline
        has changed (FL DOR DR-501, CA BOE Proposition 13 Article XIIIA,
        NY ORPTS RP-425, TX Comptroller §11.13, FL Save Our Homes
        Constitutional Amendment 10, AZ Proposition 117, OR Measure 50,
        OK Article X §8B). The state DOR review is logged with the
        HomesteadExemptionMatrix vintage. Because the matrix encodes
        statutory state DOR rules (not Census ACS aggregates), a matrix
        update can occur between Census ACS releases.
      </p>

      <h2>6. IAAO Standard rotation</h2>
      <p>
        The IAAO Standard on Property Tax Policy is the structural
        authority for AssessmentAppealSuccessTier mechanism classification
        (independent tax court, hybrid, administrative, cap-sheltered,
        unknown). When IAAO issues a revised Standard — particularly to
        Section 7 (assessment appeals) or Section 5 (assessment ratio
        studies) — the AssessmentAppealSuccessTier mechanism table is
        reviewed against the new IAAO Standard text and against the
        relevant state DOR procedure publications. A reclassification of a
        state from one mechanism type to another (e.g., a hybrid state
        moving toward independent tax court after the state legislature
        creates one) is logged as a tier flip with an
        AssessmentAppealSuccessTier vintage label.
      </p>

      <h2>7. NJ Tax Court / Cook County / MD Tax Court / Travis CAD publicized-success-rate rotation</h2>
      <p>
        Where the AssessmentAppealSuccessTier attaches a publicized success
        range, that range is drawn from a state-level annual report (NJ
        Tax Court annual report under N.J.S.A. 2B:13, Cook County Assessor
        published appeal-outcome statistics, MD Tax Court annual report,
        Travis CAD informal-protest outcomes for Texas). When those
        publications issue a new annual report or quarterly update, the
        AssessmentAppealSuccessTier published range is refreshed against
        the new state DOR or county data; an outdated success-rate range
        without a corresponding state DOR or court publication update is
        not a correction — it is a publication-cadence lag.
      </p>

      <h2>8. PropertyTaxInterpretation composite rotation</h2>
      <p>
        The PropertyTaxInterpretation composite verdict (the verdict box
        atop each county and state page) is regenerated whenever any of
        its four feed levers — EffectiveRateVsAssessmentDecoder,
        HomesteadExemptionMatrix, IncomeBurdenBand, or
        AssessmentAppealSuccessTier — receives an upstream Census ACS
        refresh, a state DOR rule change, an IRS Publication 530
        revision, or an IAAO Standard rotation. The composite is also
        regenerated when the editorial team revises the branching logic
        (e.g., when the escape-route mapping is updated). A composite
        verdict shift that flows from a verified upstream Census ACS or
        state DOR change is a vintage refresh; a shift that flows from a
        composite branching error (e.g., an incorrect escape-route
        mapping for a cap-sheltered state) is a methodology correction.
      </p>

      <h2>9. What does NOT count as a correction</h2>
      <p>
        The following are <strong>vintage refreshes</strong> and not
        corrections:
      </p>
      <ul>
        <li>
          A new Census ACS 5-Year release replacing the prior Census ACS
          release (Census ACS B25103, B25077, B19013).
        </li>
        <li>
          A new Census Annual Survey of State and Local Government
          Finances release.
        </li>
        <li>
          A state DOR exemption amount adjusted for inflation under an
          existing statute.
        </li>
        <li>
          An IRS Publication 530 reissue that does not change the
          underlying IRC §164(b)(6) statutory SALT cap.
        </li>
        <li>
          An IAAO Standard reissue that does not change the mechanism
          taxonomy used by AssessmentAppealSuccessTier.
        </li>
        <li>
          An EffectiveRateVsAssessmentDecoder, HomesteadExemptionMatrix,
          IncomeBurdenBand, or AssessmentAppealSuccessTier recomputation
          triggered by a Census ACS release rotation or a state DOR
          rule rotation.
        </li>
        <li>
          A PropertyTaxInterpretation composite regeneration triggered by
          a Census ACS or state DOR upstream refresh.
        </li>
      </ul>

      <h2>10. What DOES count as a correction</h2>
      <ul>
        <li>
          A page displaying a Census ACS B25103, B25077, or B19013 value
          that disagrees with the Census ACS release for the same
          vintage.
        </li>
        <li>
          A HomesteadExemptionMatrix tier that misclassifies a state
          relative to the state DOR&apos;s published rules.
        </li>
        <li>
          An IncomeBurdenBand band that misreports the Census ACS B25103
          ÷ Census ACS B19013 ratio for the same Census ACS vintage.
        </li>
        <li>
          An AssessmentAppealSuccessTier mechanism that misclassifies a
          state relative to the state DOR procedure or the IAAO Standard
          Section 7 taxonomy.
        </li>
        <li>
          A PropertyTaxInterpretation composite verdict that misroutes
          an escape-route recommendation (e.g., recommending appeal-now
          for a cap-sheltered state like CA Proposition 13, FL Save Our
          Homes, AZ Proposition 117, OR Measure 50, or OK Article X
          §8B).
        </li>
        <li>
          A SALT cap reference that disagrees with the current IRS
          Publication 530 or IRC §164(b)(6).
        </li>
        <li>
          A statutory citation that points to a repealed or superseded
          section of state DOR law.
        </li>
        <li>
          A typographical or arithmetic error in any computed Census
          ACS-derived value on a county or state page.
        </li>
      </ul>

      <h2>11. Escalation path</h2>
      <p>
        If you find a county rate, source label, exemption amount,
        IncomeBurdenBand band, AssessmentAppealSuccessTier mechanism, or
        PropertyTaxInterpretation composite verdict that appears
        incorrect, send the page URL and source evidence (a link to the
        Census Bureau release at data.census.gov, a state DOR notice,
        IRS Publication 530, IAAO Standard text, NJ Tax Court annual
        report, Cook County Assessor publication, MD Tax Court annual
        report, Travis CAD outcome report, or equivalent) through the{" "}
        <a href="/contact/" className="text-amber-800 hover:underline">
          contact page
        </a>
        . Verified factual errors are corrected in the page copy and in
        the associated schema-level freshness label within two business
        days. Methodology disputes are routed to the editorial review
        queue and addressed in the editorial policy page before reaching
        production.
      </p>

      <h2>12. Audit log</h2>
      <p>
        Material corrections (changes to a published Census ACS B25103
        figure, a HomesteadExemptionMatrix tier flip, an
        EffectiveRateVsAssessmentDecoder reclassification, an
        IncomeBurdenBand band shift outside the Census ACS MOE window,
        an AssessmentAppealSuccessTier mechanism reclassification, or a
        PropertyTaxInterpretation composite verdict-tone flip) are
        labeled with a page-level <code>dateModified</code> on the
        affected page and reflected in the corresponding schema.org
        Dataset metadata. Cosmetic copy edits, link updates, and
        ad-slot adjustments are not logged because they do not change
        the underlying Census ACS-derived figure or state DOR
        classification.
      </p>

      <h2>13. Contact</h2>
      <p>
        Direct corrections inquiries go through the{" "}
        <a href="/contact/" className="text-amber-800 hover:underline">
          contact page
        </a>
        . Census ACS-related questions about the underlying Census
        release are best directed to the Census Bureau at
        data.census.gov. IRS questions about Schedule A treatment of
        property tax under IRC §164(b)(6) are best directed to IRS
        Publication 530 or a tax professional licensed in your state.
        State DOR exemption-rule questions are best directed to your
        state DOR. IAAO Standard questions are best directed to the
        IAAO directly.
      </p>

      <h2>14. Source Authority Reference</h2>
      <p>
        For full source-by-source attribution behind every correction
        category: the Census ACS B25103 median real estate taxes figure
        is published by the US Census Bureau; the Census ACS B25077
        median home value figure is published by the US Census Bureau;
        the Census ACS B19013 median household income figure is
        published by the US Census Bureau. Census ACS revision notices
        are issued by the Census Bureau when prior Census ACS releases
        are restated. The Census Annual Survey of State and Local
        Government Finances is published by the Census Bureau on a
        longer lag than the Census ACS. IRS Publication 530 is
        published by the IRS and governs Schedule A treatment of the
        Census ACS-reported property tax; the IRS also publishes
        Revenue Procedures and Revenue Rulings that interpret IRC
        §164(b)(6). State DOR exemption notices are published by each
        state DOR. The IAAO Standard on Property Tax Policy is
        published by the IAAO. Where a state tax court publishes
        annual appeal outcomes (NJ Tax Court, MD Tax Court) or a
        county assessor publishes informal protest outcomes (Cook
        County Assessor, Travis CAD), those publications are the
        authoritative source for AssessmentAppealSuccessTier
        publicized success ranges. Census ACS, IRS, state DOR, and
        IAAO publications collectively define the correction surface
        for PropertyTaxPeek.
      </p>
    </article>
  );
}
