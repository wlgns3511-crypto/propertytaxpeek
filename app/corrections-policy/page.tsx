import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Corrections Policy",
  description: "How PropertyTaxPeek reviews and applies corrections.",
  alternates: { canonical: "/corrections-policy/" },
  openGraph: { url: "/corrections-policy/" },
};

export default function CorrectionsPolicyPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12 prose prose-slate">
      <h1>Corrections Policy</h1>
      <p>
        If you find a county rate, source label, or methodology note that appears incorrect, send
        the page URL and source evidence through the contact page. Verified issues are corrected in
        the page copy and associated freshness labels.
      </p>
    </article>
  );
}
