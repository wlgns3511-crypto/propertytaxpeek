import type { Metadata } from "next";
import { Breadcrumb } from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "PropertyTaxPeek privacy policy.",
  alternates: { canonical: "/privacy/" },
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
          serve ads and analyze traffic. You can opt out of personalized advertising by visiting{" "}
          <a href="https://www.google.com/settings/ads" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>{" "}
          or visit <a href="https://www.aboutads.info/choices/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">www.aboutads.info</a>.
          You can also manage cookie preferences in your browser settings.
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

      <div className="mt-8 pt-6 border-t border-slate-200">
        <h2 className="text-xl font-semibold mb-3">Part of DataPeek Facts Network</h2>
        <p>
          PropertyTaxPeek is part of the{" "}
          <a href="https://datapeekfacts.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
            DataPeek Facts
          </a>{" "}
          network of free US data tools. For general inquiries about our data network, privacy practices, or partnership
          opportunities, please contact the DataPeek Facts team at{" "}
          <a href="mailto:datapeekfacts@gmail.com" className="text-blue-600 hover:underline">
            datapeekfacts@gmail.com
          </a>
          . You can also visit the{" "}
          <a href="https://datapeekfacts.com/privacy/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
            DataPeek Facts Privacy Policy
          </a>{" "}
          for network-wide privacy information.
        </p>
      </div>
    </>
  );
}
