import type { Metadata } from "next";
import CompareClient from "./CompareClient";

export const metadata: Metadata = {
  title: "Compare Property Tax Rates by State",
  description: "Compare property tax rates, median taxes, and home values between US states side by side.",
  alternates: { canonical: "/compare/" },
  openGraph: { url: "/compare/" },
};

export default function ComparePage() {
  return <CompareClient />;
}
