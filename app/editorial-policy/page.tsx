import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Editorial Policy",
  description: "Editorial standards and source-labeling policy for PropertyTaxPeek.",
  alternates: { canonical: "/editorial-policy/" },
  openGraph: { url: "/editorial-policy/" },
};

export default function EditorialPolicyPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12 prose prose-slate">
      <h1>Editorial Policy</h1>
      <p>
        PropertyTaxPeek publishes county and state tax pages from Census, assessor, and tax-policy
        sources. We label source vintage and review date separately so refreshed pages do not imply
        newer source data than exists.
      </p>
    </article>
  );
}
