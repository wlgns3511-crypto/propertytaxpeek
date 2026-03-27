import type { Metadata } from "next";
import { Breadcrumb } from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "PropertyTaxPeek privacy policy.",
};

export default function PrivacyPage() {
  return (
    <>
      <Breadcrumb
        items={[{ label: "Home", href: "/" }, { label: "Privacy Policy" }]}
      />
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Privacy Policy</h1>
      <div className="prose prose-slate max-w-none">
        <p>Last updated: March 2026</p>
        <h2>Information We Collect</h2>
        <p>
          PropertyTaxPeek does not collect personally identifiable information
          unless you voluntarily provide it (e.g., through our contact form). We
          use standard web analytics and advertising services that may collect
          anonymous usage data.
        </p>
        <h2>Cookies and Advertising</h2>
        <p>
          We use Google AdSense and Google Analytics, which may use cookies to
          serve ads and analyze traffic. You can manage cookie preferences in your
          browser settings.
        </p>
        <h2>Third-Party Services</h2>
        <p>
          Our site may contain links to third-party websites. We are not
          responsible for the privacy practices of these external sites.
        </p>
        <h2>Data Security</h2>
        <p>
          We implement reasonable security measures to protect any data we
          collect. However, no method of transmission over the internet is 100%
          secure.
        </p>
        <h2>Changes to This Policy</h2>
        <p>
          We may update this privacy policy from time to time. Changes will be
          posted on this page with an updated revision date.
        </p>
        <h2>Contact</h2>
        <p>
          If you have questions about this policy, please visit our{" "}
          <a href="/contact">contact page</a>.
        </p>
      </div>
    </>
  );
}
