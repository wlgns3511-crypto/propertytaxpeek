import type { Metadata } from "next";
import { Breadcrumb } from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with PropertyTaxPeek.",
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
          <strong>hello@propertytaxpeek.com</strong>.
        </p>
        <h2>Technical Issues</h2>
        <p>
          If you experience any technical issues with our website, please
          describe the problem and include your browser and device information.
        </p>
      </div>
    </>
  );
}
