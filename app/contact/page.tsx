import type { Metadata } from "next";
import { Breadcrumb } from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with PropertyTaxPeek.",
  alternates: { canonical: "/contact/" },
  openGraph: { url: "/contact/" },
};

export default function ContactPage() {
  return (
    <>
      <Breadcrumb
        items={[{ label: "Home", href: "/" }, { label: "Contact" }]}
      />
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Contact Us</h1>
      <div className="prose prose-slate max-w-none">
        <p>
          We welcome your feedback, questions, and suggestions about
          PropertyTaxPeek.
        </p>
        <h2>Report Data Issues</h2>
        <p>
          If you find inaccurate data, please let us know the specific location
          and the correct information, along with a source if possible.
        </p>
        <h2>General Inquiries</h2>
        <p>
          For general questions, partnership opportunities, or press inquiries,
          please email us at{" "}
          <strong>datapeekfacts@gmail.com</strong>.
        </p>
        <h2>Technical Issues</h2>
        <p>
          If you experience any technical issues with our website, please
          describe the problem and include your browser and device information.
        </p>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-200">
        <h2 className="text-xl font-semibold mb-3">DataPeek Facts Network</h2>
        <p>
          PropertyTaxPeek is part of the{" "}
          <a href="https://datapeekfacts.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
            DataPeek Facts
          </a>{" "}
          network of free US data tools. For general inquiries about the network, partnerships, or cross-platform
          questions, contact the DataPeek Facts team at{" "}
          <a href="mailto:datapeekfacts@gmail.com" className="text-blue-600 hover:underline">
            datapeekfacts@gmail.com
          </a>.
        </p>
      </div>
    </>
  );
}
