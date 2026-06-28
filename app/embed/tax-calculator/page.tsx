import type { Metadata } from "next";
import { PropertyTaxCalculator } from "@/components/PropertyTaxCalculator";
import { getAllStates } from "@/lib/db";

export const metadata: Metadata = {
  title: "Property Tax Calculator - Embeddable Widget",
  robots: { index: false, follow: false },
  openGraph: { url: "/embed/tax-calculator/" },
};

export default function EmbedCalculatorPage() {
  const states = getAllStates();
  const calcStates = states.map((s) => ({
    abbr: s.abbr,
    state: s.state,
    avg_rate: s.avg_rate,
  }));

  return (
    <div className="p-4">
      <PropertyTaxCalculator states={calcStates} />
      <p className="text-xs text-center text-stone-400 mt-2">
        Powered by{" "}
        <a
          href="https://propertytaxpeek.com"
          target="_blank"
          rel="noopener"
          className="text-amber-600 hover:underline"
        >
          PropertyTaxPeek
        </a>
      </p>
    </div>
  );
}
