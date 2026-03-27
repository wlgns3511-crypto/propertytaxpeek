import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const SITE_NAME = "PropertyTaxPeek";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://propertytaxpeek.com";

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} - US Property Tax Rates by State & County`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Explore property tax rates for all 50 US states and 500+ counties. Compare effective tax rates, median property taxes, and home values. Free property tax calculator.",
  metadataBase: new URL(SITE_URL),
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5724806562146685"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${inter.className} antialiased bg-white text-slate-900 min-h-screen flex flex-col`}
      >
        <header className="border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <a href="/" className="text-xl font-bold text-blue-700">
              {SITE_NAME}
            </a>
            <nav className="flex gap-6 text-sm">
              <a href="/calculator" className="hover:text-blue-600">
                Calculator
              </a>
              <a href="/compare" className="hover:text-blue-600">
                Compare
              </a>
            </nav>
          </div>
        </header>
        <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
          {children}
        </main>
        <footer className="border-t border-slate-200 mt-16">
          <div className="max-w-5xl mx-auto px-4 py-6 text-sm text-slate-500">
            <p>
              Data from the U.S. Census Bureau, American Community Survey (ACS)
              and Tax Foundation.
            </p>
            <p className="mt-2">
              <a href="/about" className="hover:text-blue-600">
                About
              </a>
              {" | "}
              <a href="/privacy" className="hover:text-blue-600">
                Privacy
              </a>
              {" | "}
              <a href="/terms" className="hover:text-blue-600">
                Terms
              </a>
              {" | "}
              <a href="/contact" className="hover:text-blue-600">
                Contact
              </a>
            </p>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                DataPeek Insights Network
              </p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                <a href="https://salarybycity.com" className="hover:text-blue-600">Salaries</a>
                <a href="https://costbycity.com" className="hover:text-blue-600">Cost of Living</a>
                <a href="https://zippeek.com" className="hover:text-blue-600">ZIP Codes</a>
                <a href="https://guidebycity.com" className="hover:text-blue-600">City Guides</a>
                <a href="https://degreewize.com" className="hover:text-blue-600">Colleges</a>
                <a href="https://caloriewize.com" className="hover:text-blue-600">Nutrition</a>
                <a href="https://nameblooms.com" className="hover:text-blue-600">Baby Names</a>
                <a href="https://vocabwize.com" className="hover:text-blue-600">Vocabulary</a>
                <a href="https://calcpeek.com" className="hover:text-blue-600">Calculators</a>
                <a href="https://tariffpeek.com" className="hover:text-blue-600">HS Codes &amp; Tariffs</a>
                <a href="https://ingredipeek.com" className="hover:text-blue-600">Food Allergens</a>
                <a href="https://propertytaxpeek.com" className="hover:text-blue-600">Property Taxes</a>
              </div>
            </div>
            <p className="mt-1">
              &copy; {new Date().getFullYear()} {SITE_NAME}. All rights
              reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
