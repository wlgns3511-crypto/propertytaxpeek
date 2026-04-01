import type { Metadata } from "next";
import { Breadcrumb } from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "About PropertyTaxPeek",
  description:
    "Learn about PropertyTaxPeek, your source for US property tax data by state and county.",
  alternates: { canonical: "/about/" },
  openGraph: { url: "/about/" },
};

export default function AboutPage() {
  return (
    <>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "About" }]} />
      <h1 className="text-3xl font-bold text-slate-900 mb-6">
        About PropertyTaxPeek
      </h1>
      <div className="prose prose-slate max-w-none">
        <p>
          PropertyTaxPeek provides comprehensive property tax data for all 50 US
          states and hundreds of counties. Our mission is to make property tax
          information accessible, transparent, and easy to understand.
        </p>
        <h2>Our Data Sources</h2>
        <p>
          Our data comes from the U.S. Census Bureau&apos;s American Community
          Survey (ACS), the Tax Foundation, and other publicly available government
          datasets. We update our data annually to reflect the most current
          information available.
        </p>
        <h2>How We Calculate Rates</h2>
        <p>
          Effective property tax rates are calculated by dividing the median real
          estate taxes paid by the median home value in each area. This provides
          a standardized comparison across different jurisdictions.
        </p>
        <h2>Part of the DataPeek Insights Network</h2>
        <p>
          PropertyTaxPeek is part of the DataPeek Insights Network, a collection
          of data-driven websites covering salaries, cost of living, ZIP codes,
          and more.
        </p>
        <h2>Contact</h2>
        <p>
          Have questions or feedback? Visit our{" "}
          <a href="/contact">contact page</a>.
        </p>
      </div>
    </>
  );
}
