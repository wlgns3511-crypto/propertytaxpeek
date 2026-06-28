import type { Metadata } from "next";
import { getAllStates } from "@/lib/db";
import { PropertyTaxCalculator } from "@/components/PropertyTaxCalculator";
import { EmbedButton } from "@/components/EmbedButton";
import { AdSlot } from "@/components/AdSlot";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AuthorBox } from "@/components/AuthorBox";
import { COUNTY_VINTAGE } from "@/lib/authorship";

export const metadata: Metadata = {
  title: "Property Tax Calculator - Estimate Your Annual Property Tax",
  description:
    "Free property tax calculator. Enter your home value and location to estimate annual and monthly property taxes. Compare with state and national averages.",
  alternates: { canonical: "/calculator/" },
  openGraph: { url: "/calculator/" },
};

export default function CalculatorPage() {
  const states = getAllStates();
  const calcStates = states.map((s) => ({
    abbr: s.abbr,
    state: s.state,
    avg_rate: s.avg_rate,
  }));

  return (
    <>
      <Breadcrumb
        items={[{ label: "Home", href: "/" }, { label: "Property Tax Calculator" }]}
      />

      <h1 className="text-3xl font-bold text-stone-900 mb-4">
        Property Tax Calculator
      </h1>
      <p className="text-stone-600 mb-8">
        Estimate your annual property tax based on your home value, state, and
        assessment ratio. Results are compared to the national average of $2,690
        per year.
      </p>

      <PropertyTaxCalculator states={calcStates} />
      <EmbedButton />

      <AdSlot id="6789012345" />

      <section className="prose prose-slate max-w-none mt-12">
        <h2>How Property Taxes Are Calculated</h2>
        <p>
          Property taxes are calculated by multiplying your property&apos;s
          assessed value by the local tax rate (mill rate). The assessed value
          may differ from market value depending on your state&apos;s assessment
          ratio.
        </p>
        <h3>Key Factors</h3>
        <ul>
          <li>
            <strong>Market Value:</strong> What your property would sell for on
            the open market
          </li>
          <li>
            <strong>Assessment Ratio:</strong> The percentage of market value
            used for tax purposes (varies by state)
          </li>
          <li>
            <strong>Tax Rate (Mill Rate):</strong> Set by local authorities,
            expressed as a percentage of assessed value
          </li>
          <li>
            <strong>Exemptions:</strong> Such as <strong>homestead exemption</strong>,
            senior exemptions, and disability exemptions
          </li>
        </ul>
        <h3>Ways to Lower Your Property Tax</h3>
        <p>
          Consider a <strong>tax assessment appeal</strong> if you believe your
          property is over-assessed. Explore <strong>homestead exemption</strong>{" "}
          programs in your state. You may also benefit from{" "}
          <strong>mortgage refinancing rates</strong> to lower total housing
          costs, or compare <strong>homeowners insurance quotes</strong> for
          additional savings.
        </p>
      </section>

      <AuthorBox
        vintage={COUNTY_VINTAGE}
        source="Property tax calculator (state-rate based)"
        showDisclaimer
      />
    </>
  );
}
