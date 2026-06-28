import type { Metadata } from "next";
import { LEGAL_VINTAGES } from "@/lib/authorship";

export const metadata: Metadata = {
  title: "Editorial Policy",
  description: "How PropertyTaxPeek sources, reviews, and labels its Census ACS-derived property tax data — and the explicit boundary between Census Bureau releases, IRS guidance, state DOR rules, and our editorial readings.",
  alternates: { canonical: "/editorial-policy/" },
  openGraph: { url: "/editorial-policy/" },
};

export default function EditorialPolicyPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12 prose prose-slate">
      <h1>Editorial Policy</h1>
      <p className="text-sm text-stone-500 mb-8">
        Last reviewed:{" "}
        <time dateTime={LEGAL_VINTAGES.editorialPolicy}>{LEGAL_VINTAGES.editorialPolicy}</time>
      </p>
      <p className="lead">
        PropertyTaxPeek publishes county and state property tax pages anchored in
        US Census Bureau releases (Census ACS 2024 5-Year and the Census Annual
        Survey of State and Local Government Finances). This page documents which
        Census releases we ingest, which state DOR and federal IRS authorities we
        treat as cross-references, where our editorial Census ACS readings begin,
        and where they end.
      </p>

      <h2>1. Editorial team scope</h2>
      <p>
        PropertyTaxPeek publishes through our PropertyTaxPeek Editorial Team
        byline, with named subject-matter editors anchoring each Census ACS
        release cycle and each state DOR exemption rotation. The editorial team
        is responsible for: (a) ingesting each new Census ACS release on its
        publication cadence and verifying Census ACS B25103, B25077, and B19013
        for every state and county; (b) reconciling state-level totals against
        the Census Annual Survey of State and Local Government Finances; (c)
        reviewing each homestead, senior, veteran, and disability exemption
        update issued by a state DOR; (d) refreshing the
        EffectiveRateVsAssessmentDecoder, HomesteadExemptionMatrix,
        IncomeBurdenBand, and AssessmentAppealSuccessTier editorial layers when
        Census ACS data or state DOR statutes shift; (e) maintaining the
        PropertyTaxInterpretation composite verdict synthesis; and (f) labeling
        per-entity Census ACS vintages so readers can see which Census release a
        page reflects.
      </p>

      <h2>2. Primary data sources (authoritative — backed by our database)</h2>
      <p>
        Two upstream Census Bureau authorities back every numeric value on the
        site. These are the only authorities we list as
        <code> sourceOrganization</code> in schema.org metadata, because every
        Census ACS number we publish can be traced to one of them:
      </p>
      <ul>
        <li>
          <strong>US Census Bureau — American Community Survey (ACS) 2024
          5-Year release.</strong> Census ACS table B25103 (real estate taxes
          paid by owner-occupied units), Census ACS table B25077 (median home
          value), and Census ACS table B19013 (median household income). This
          is the legal authority for our county- and state-level effective
          rate, IncomeBurdenBand, and AssessmentAppealSuccessTier calculations.
          The Census Bureau publishes Census ACS as five-year period estimates
          because single-year Census ACS data on smaller counties would be too
          volatile to publish reliably.
        </li>
        <li>
          <strong>US Census Bureau — Annual Survey of State and Local
          Government Finances.</strong> Census cross-reference for total
          state-and-local property tax collections, used to reconcile our
          Census ACS-derived county sums against the Census-published statewide
          aggregate. Discrepancies between Census ACS medians and the Census
          Government Finances total are flagged in our editorial review queue
          rather than quietly normalized.
        </li>
      </ul>

      <h2>3. Cross-reference resources (body text only — not schema-level providers)</h2>
      <p>
        Several authorities appear in body trust blocks across the site, but
        we do not list them as schema-level data providers because they do
        not back individual numbers on individual pages:
      </p>
      <ul>
        <li>
          <strong>Tax Foundation.</strong> Annual state property tax rankings.
          We cite the Tax Foundation as an independent peer of our Census ACS
          rate calculation when readers want a second-source check, but the
          Tax Foundation&apos;s state burden numbers are themselves derived
          from Census ACS B25103 and Census ACS B25077 — so we treat the Tax
          Foundation as a Census ACS verification path, not a separate
          authority.
        </li>
        <li>
          <strong>Lincoln Institute of Land Policy.</strong> The Significant
          Features of the Property Tax database, maintained jointly with
          George Washington University, is the academic standard for
          comparing property tax structures across states. Lincoln Institute
          provides formal definitions (assessment ratio, classified
          assessment, circuit breaker, effective rate, IncomeBurdenBand
          equivalents) that align our Census ACS reading layers with the
          academic literature.
        </li>
        <li>
          <strong>IRS Publication 530 and IRC §164(b)(6).</strong> Federal
          guidance on the SALT deduction (the post-TCJA $10,000 cap added by
          the Tax Cuts and Jobs Act of 2017, Public Law 115-97 §11042). We
          reference IRS Pub 530 whenever the page discusses Schedule A
          deductibility, because the IRS treatment is a separate
          determination from the state-level Census ACS B25103 tax we
          capture.
        </li>
        <li>
          <strong>IAAO — International Association of Assessing Officers.</strong>
          The IAAO Standard on Property Tax Policy (notably Section 7 on
          assessment appeals and Section 5 on assessment ratio studies)
          anchors the AssessmentAppealSuccessTier mechanism classification.
          The IAAO is a property tax commission peer body, not a Census ACS
          data provider, so it appears in body text and in the
          PropertyTaxInterpretation composite footer but not as
          schema-level sourceOrganization.
        </li>
        <li>
          <strong>State DOR publications and state tax court records.</strong>
          NJ Tax Court (N.J.S.A. 2B:13), MD Tax Court (Tax-Property Article
          §14-512), Cook County Assessor, IL PTAB, IN/MN/OH/CT state tax
          courts, NY SCAR, MA ATB, PA county boards, Travis CAD, CA BOE
          (Proposition 13 Article XIIIA), FL DOR (Save Our Homes
          Constitutional Amendment 10), AZ DOR (Proposition 117), OR DOR
          (Measure 50), OK Tax Commission (Article X §8B). These state DOR
          and state tax court bodies are the authoritative source for
          assessment appeal procedure and homestead rule, and we reference
          them inline whenever we describe the AssessmentAppealSuccessTier
          mechanism or the HomesteadExemptionMatrix tier.
        </li>
      </ul>

      <h2>4. EffectiveRate computation methodology</h2>
      <p>
        The effective property tax rate displayed on each county and state
        page is computed as the ratio of Census ACS B25103 (median real estate
        taxes paid) to Census ACS B25077 (median home value). This is the
        definition used by the Tax Foundation, the Lincoln Institute, and
        academic researchers — it captures what the typical homeowner
        actually pays relative to what their home is worth, not the statutory
        mill rate. Statutory mill rates without assessment ratio context are
        misleading and the editorial team does not publish them as a primary
        figure. The Census ACS B25103 and Census ACS B25077 inputs are
        subject to the Census ACS five-year smoothing window and the Census
        ACS Margin of Error filter; counties whose Census ACS estimate fails
        the relative-MOE threshold are suppressed rather than published with
        a misleading point estimate.
      </p>

      <h2>5. EffectiveRateVsAssessmentDecoder is an editorial reading layer</h2>
      <p>
        The EffectiveRateVsAssessmentDecoder badge displayed on each county
        and state page is an editorial heuristic. It compares the Census
        ACS-derived effective rate against the published state DOR
        assessment ratio to flag jurisdictions where high nominal mill rates
        are partially offset by low assessment ratios, and where low Census
        ACS effective rates may mask high statutory rates against deeply
        discounted assessment bases. The Decoder is a PropertyTaxPeek
        editorial framing tool — readers must treat it as a starting point
        for inquiry into the state DOR assessment-ratio rule, not as a
        certified rate. The Census Bureau, the IRS, the IAAO, and state
        DORs do not endorse this editorial layer.
      </p>

      <h2>6. HomesteadExemptionMatrix is an editorial classifier</h2>
      <p>
        The HomesteadExemptionMatrix tier shown for each state is built from
        the published statutory exemption rules in that state&apos;s state DOR
        materials and reconciled against the Census Annual Survey of State
        and Local Government Finances exemption-line aggregates. The matrix
        encodes (a) the basic homestead amount, (b) the senior/over-65
        supplement, (c) the disabled-veteran exemption, (d) the disability
        (non-veteran) exemption, (e) any assessment cap or freeze
        (Proposition 13, Save Our Homes, Proposition 117, Measure 50,
        Article X §8B), and (f) the filing pathway. The Matrix is updated
        when state legislative sessions amend any of these elements via
        state DOR notice. The HomesteadExemptionMatrix does not certify your
        filing eligibility — county assessors do that.
      </p>

      <h2>7. IncomeBurdenBand is a Census ACS-derived editorial classifier</h2>
      <p>
        The IncomeBurdenBand tier shown on each state and county page is a
        five-band classifier computed as Census ACS B25103 ÷ Census ACS
        B19013. Band cutoffs are: A under 2.0%, B 2.0–3.0%, C 3.0–4.5%, D
        4.5–6.0%, E 6.0% or greater. The IncomeBurdenBand is editorial in
        the sense that the cutoffs are PropertyTaxPeek-chosen against the
        Lincoln Institute property tax burden literature; the underlying
        Census ACS B25103 and Census ACS B19013 figures are authoritative.
        The IncomeBurdenBand also surfaces a SALT cap binding flag against
        the IRC §164(b)(6) $10,000 cap added by the Tax Cuts and Jobs Act
        of 2017 — the flag is informational and refers to IRS Publication
        530 as the authority for federal Schedule A treatment, not to
        certified tax advice. The IncomeBurdenBand band is published only
        when both Census ACS B25103 and Census ACS B19013 pass the relative
        Census ACS MOE filter for the entity; otherwise the band is
        suppressed.
      </p>

      <h2>8. AssessmentAppealSuccessTier is a structural state DOR classifier</h2>
      <p>
        The AssessmentAppealSuccessTier tier shown on each state page is a
        deterministic classification of the state DOR-published assessment
        appeal mechanism, anchored in the IAAO Standard on Property Tax
        Policy Section 7. The five mechanism types are: independent tax
        court (NJ Tax Court under N.J.S.A. 2B:13, MD Tax Court under
        Maryland Tax-Property Article §14-512, IL PTAB combined with Cook
        County Assessor pathways, IN/MN/OH/CT state tax courts), hybrid (PA
        county boards plus the state Tax Court, NY SCAR small-claims, MA
        ATB), administrative (state DOR-administered county boards in most
        other states), cap-sheltered (CA Proposition 13 Article XIIIA, FL
        Save Our Homes, AZ Proposition 117, OR Measure 50, OK Article X
        §8B), and unknown where the state DOR has not published a
        structural overview. Where a publicized appeal success range exists
        from a state DOR annual report (NJ Tax Court annual report, Cook
        County Assessor published appeal outcomes, MD Tax Court annual
        report, Travis CAD informal-protest outcomes), the
        AssessmentAppealSuccessTier attaches that range. The
        AssessmentAppealSuccessTier does not predict any individual
        appeal&apos;s outcome — it documents the structural mechanism the
        state DOR has published.
      </p>

      <h2>9. PropertyTaxInterpretation composite verdict synthesis</h2>
      <p>
        The PropertyTaxInterpretation composite verdict box at the top of
        each state and county page synthesizes four deterministic Census
        ACS- and state DOR-anchored lever readings —
        EffectiveRateVsAssessmentDecoder, HomesteadExemptionMatrix,
        IncomeBurdenBand, and AssessmentAppealSuccessTier — into one of
        five escape-route recommendations (appeal-now / max-exemption /
        cap-shelter / move-to-low / data-incomplete) and one of four
        verdict tones (emerald / amber / rose / slate). The composite cites
        five authorities in the verdict footer: Census ACS B25103, Census
        ACS B25077, Census ACS B19013, IRC §164(b)(6) under the Tax Cuts
        and Jobs Act, and the IAAO Standard on Property Tax Policy Section
        7. The composite verdict is editorial synthesis on top of those
        Census ACS figures, IRS guidance, and IAAO Standard mechanism
        classification; it does not constitute tax advice, legal advice,
        or a Schedule A SALT calculation, and it should not be relied on
        as a substitute for a county assessor&apos;s certified figure or
        state DOR rule.
      </p>

      <h2>10. Verification chain</h2>
      <p>
        Every numeric value on PropertyTaxPeek can be traced to a Census
        Bureau release. Readers who need to verify a county or state figure
        for a financial decision should: (a) start at data.census.gov,
        navigate to Census ACS table B25103, Census ACS table B25077, or
        Census ACS table B19013 for the state and county in question; (b)
        cross-check the Census Annual Survey of State and Local
        Government Finances total for the state; (c) review the relevant
        IRS Publication 530 guidance for federal Schedule A treatment
        under IRC §164(b)(6); (d) consult the state DOR for the statutory
        exemption schedule and assessment ratio; (e) reference IAAO
        Standard Section 7 for assessment appeal procedure; and (f)
        contact the county assessor for the actual statutory bill on a
        specific parcel.
      </p>

      <h2>11. Vintage labeling</h2>
      <p>
        We split source vintage from page review date on every entity page.
        The Census ACS 2024 5-Year release date is labeled as the Census
        ACS data vintage. The page review date is labeled separately and
        reflects when the editorial team last re-read the page copy. A
        page review that does not coincide with a new Census ACS release
        does not bump the Census vintage — that would imply newer Census
        ACS data than exists. State DOR exemption rule changes bump the
        HomesteadExemptionMatrix vintage independently of the Census ACS
        cycle.
      </p>

      <h2>12. Disclosure: operator location</h2>
      <p>
        PropertyTaxPeek is operated outside the United States. The Census
        ACS data we relay, the IRS guidance we cite (IRS Publication 530,
        IRC §164(b)(6)), the IAAO Standard we reference, and the state
        DOR exemption rules we encode are all US-issued. The site does
        not provide US tax advice, does not represent readers before the
        IRS, any state DOR, any state tax court, or any property tax
        commission, and operates as a Census ACS data-relay reference
        only.
      </p>
    </article>
  );
}
