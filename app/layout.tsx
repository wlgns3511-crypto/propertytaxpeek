import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { UpgradeAnalytics } from "@/components/upgrades/UpgradeAnalytics";
import RelatedSites from "@/components/RelatedSites";

// 2026-04-23 structural fix — do NOT reintroduce `headers()` in this layout.
// Any dynamic API (headers, cookies, draftMode, searchParams) in the root
// layout forces EVERY route in the tree to render dynamically (ƒ). That
// silently:
//   1. Disables SSG — no prerendered HTML for any dynamic route
//   2. Emits `cache-control: private,no-cache,no-store` → CF edge cache 0.86%
//   3. Bypasses `dynamicParams=false` validation → Next.js 16 returns
//      HTTP 200 + 404 HTML body (soft-404) for unknown slugs
// costbycity fix (35d1dde) restored SSG portfolio-wide. Keep `<html lang>`
// static — /es/ subtree loses dynamic lang attribute; acceptable because
// hreflang alternates still signal the Spanish URL to Google.

const inter = Inter({ subsets: ["latin"], display: "swap" });

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
  alternates: {
    languages: {
      en: `${SITE_URL}/`,
      "x-default": `${SITE_URL}/`,
    },
  },
  // robots metadata intentionally omitted at root (2026-04-23 portfolio fix).
  // Default behavior (index, follow) is already Google's assumption — making
  // it explicit at root caused a DUPLICATE `<meta name="robots">` tag on
  // notFound() pages: Next.js 16 adds `content="noindex"` for 404 responses
  // but fails to override the root's `content="index, follow"`, leaving BOTH
  // in the HTML. Google picks the first → pruned/404 URLs stay indexable.
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image" },
  other: { "google-adsense-account": "ca-pub-5724806562146685" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const schemaGraph = [
    {
      "@type": "WebSite",
      name: "PropertyTaxPeek",
      url: SITE_URL,
      description: "Explore property tax rates for all 50 US states and 500+ counties. Compare effective tax rates, median property taxes, and home values. Free property tax calculator.",
      inLanguage: "en-US",
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/search/?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      name: "PropertyTaxPeek",
      url: SITE_URL,
      description: "Property tax data and methodology for U.S. states and counties.",
              "parentOrganization": {
                "@type": "Organization",
                "name": "DataPeek Research Network",
                "url": "https://datapeekfacts.com"
              }
            },
  ];

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-GJJ3SJJQ7G" />
        <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","G-GJJ3SJJQ7G")` }} />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5724806562146685"
          crossOrigin="anonymous"
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": schemaGraph,
        }) }} />
      </head>
      <body
        className={`${inter.className} antialiased bg-white text-stone-900 min-h-screen flex flex-col`}
      >
        <UpgradeAnalytics />
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-amber-700 focus:border focus:rounded">Skip to content</a>
        <header className="border-b border-stone-200">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <a href="/" className="text-xl font-bold text-amber-800">
              {SITE_NAME}
            </a>
            <nav className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
              <a href="/appeal-simulator/" className="font-semibold text-amber-800 hover:text-amber-900">
                Appeal Simulator
              </a>
              <a href="/calculator/" className="hover:text-amber-700">
                Calculator
              </a>
              <a href="/compare/" className="hover:text-amber-700">
                Compare
              </a>
              <a href="/insights/" className="hover:text-amber-700">
                Insights
              </a>
              
              
            </nav>
          </div>
        </header>
        <main id="main-content" className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
          {children}
        </main>
        <footer className="border-t border-stone-200 mt-16">
          <div className="max-w-5xl mx-auto px-4 py-6 text-sm text-stone-500">
            <p>
              Built with public data from the U.S. Census Bureau, American Community Survey (ACS)
              and Tax Foundation.
            </p>
            <p className="mt-2">
              <a href="/about/" className="hover:text-amber-700">
                About
              </a>
              {" | "}
              <a href="/methodology/" className="hover:text-amber-700">
                Methodology
              </a>
              {" | "}
              <a href="/privacy/" className="hover:text-amber-700">
                Privacy
              </a>
              {" | "}
              <a href="/terms/" className="hover:text-amber-700">
                Terms
              </a>
              {" | "}
              <a href="/disclaimer/" className="hover:text-amber-700">
                Disclaimer
              </a>
              {" | "}
              <a href="/editorial-policy/" className="hover:text-amber-700">
                Editorial Policy
              </a>
              {" | "}
              <a href="/corrections-policy/" className="hover:text-amber-700">
                Corrections
              </a>
              {" | "}
              <a href="/contact/" className="hover:text-amber-700">
                Contact
              </a>
            </p>
            <RelatedSites currentSite="PropertyTaxPeek" accentClass="hover:text-amber-700" label="Explore More Tools" />
            <p className="mt-3 text-xs italic text-stone-400">Helping homeowners understand property tax burden with source-labeled county and ACS data.</p>
            <p className="mt-1">
              &copy; {new Date().getFullYear()} {SITE_NAME}. Independent reference for Census ACS property tax data; sources cited inline on every page.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
