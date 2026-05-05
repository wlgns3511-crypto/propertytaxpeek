import type { Metadata } from "next";
import { Breadcrumb } from "@/components/Breadcrumb";
import { LEGAL_VINTAGES } from "@/lib/authorship";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "PropertyTaxPeek terms of service.",
  alternates: { canonical: "/terms/" },
  openGraph: { url: "/terms/" },
};

export default function TermsPage() {
  return (
    <>
      <Breadcrumb
        items={[{ label: "Home", href: "/" }, { label: "Terms of Service" }]}
      />
      <h1 className="text-3xl font-bold text-slate-900 mb-6">
        Terms of Service
      </h1>
      <div className="prose prose-slate max-w-none">
        <p>
          Last updated:{" "}
          <time dateTime={LEGAL_VINTAGES.terms}>{LEGAL_VINTAGES.terms}</time>
        </p>
        <h2>Acceptance of Terms</h2>
        <p>
          By accessing and using PropertyTaxPeek, you agree to be bound by these
          terms of service.
        </p>
        <h2>Use of Data</h2>
        <p>
          The property tax data provided on this site is for informational
          purposes only and should not be considered professional tax, legal, or
          financial advice. While we strive for accuracy, we make no guarantees
          about the completeness or currency of the data.
        </p>
        <h2>Disclaimer</h2>
        <p>
          Property tax rates and assessments vary by jurisdiction and change
          frequently. Always verify current rates with your local tax
          assessor&apos;s office before making financial decisions.
        </p>
        <h2>Intellectual Property</h2>
        <p>
          The content, design, and code of this website are protected by
          copyright. You may link to our pages but may not reproduce our content
          without permission.
        </p>
        <h2>Limitation of Liability</h2>
        <p>
          PropertyTaxPeek shall not be liable for any damages arising from the
          use of this website or reliance on the data provided.
        </p>
        <h2>Changes</h2>
        <p>
          We reserve the right to modify these terms at any time. Continued use
          of the site after changes constitutes acceptance of the new terms.
        </p>
      </div>
    </>
  );
}
