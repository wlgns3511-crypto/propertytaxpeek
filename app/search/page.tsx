import Link from "next/link";
import { searchLocations } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Property Tax Rates - PropertyTaxPeek",
  description: "Search states and counties for property tax rates, median taxes, and home value data in the PropertyTaxPeek database.",
  alternates: { canonical: "https://propertytaxpeek.com/search/" },
  openGraph: { url: "/search/" },
};

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const results = query.length >= 2 ? searchLocations(query) : null;
  const totalResults = results ? results.states.length + results.counties.length : 0;

  function fmt(n: number) {
    return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Search Property Tax Rates</h1>
      <p className="text-gray-500 mb-6 text-sm">
        Search states and counties for property tax rates, median taxes, and home values.
      </p>

      <form method="GET" action="/search/" className="mb-8">
        <div className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="e.g. California, Cook County, Texas, New Jersey..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            autoFocus
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {query.length > 0 && query.length < 2 && (
        <p className="text-sm text-gray-500">Please enter at least 2 characters to search.</p>
      )}

      {results && totalResults === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium mb-1">No results found for &ldquo;{query}&rdquo;</p>
          <p className="text-sm">Try searching for a state name, abbreviation, or county name.</p>
        </div>
      )}

      {results && totalResults > 0 && (
        <div className="space-y-8">
          <p className="text-sm text-gray-500">
            Found {totalResults} result{totalResults !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
          </p>

          {results.states.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-blue-700 mb-3 uppercase tracking-wider">States</h2>
              <div className="grid sm:grid-cols-2 gap-2">
                {results.states.map((s) => (
                  <Link
                    key={s.abbr}
                    href={`/state/${s.slug}/`}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">
                      {s.abbr}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{s.state}</p>
                      <p className="text-xs text-gray-500">
                        {s.effective_rate.toFixed(2)}% rate &middot; {fmt(s.median_tax)}/yr median
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results.counties.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-blue-700 mb-3 uppercase tracking-wider">Counties</h2>
              <div className="grid sm:grid-cols-2 gap-2">
                {results.counties.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/county/${c.slug}/`}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">
                      {c.state}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{c.county_name}</p>
                      <p className="text-xs text-gray-500">
                        {c.state} &middot; {c.effective_rate.toFixed(2)}% rate &middot; {fmt(c.median_tax)}/yr
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {!query && (
        <div className="mt-4">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Popular Searches</h2>
          <div className="flex flex-wrap gap-2">
            {["New Jersey", "Illinois", "Texas", "California", "Florida", "Cook County", "Los Angeles", "New York"].map((term) => (
              <Link
                key={term}
                href={`/search/?q=${encodeURIComponent(term)}`}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors border border-blue-200"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
