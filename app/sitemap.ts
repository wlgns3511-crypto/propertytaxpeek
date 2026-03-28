import type { MetadataRoute } from "next";
import {
  getAllStates,
  getAllCounties,
  getCountyComparisonCount,
  getCountyComparisonSlugsPage,
} from "@/lib/db";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://propertytaxpeek.com";

const URLS_PER_SITEMAP = 40000;

// Top 20 states for pre-built comparison pages
const TOP_STATES = [
  "california", "texas", "florida", "new-york", "pennsylvania",
  "illinois", "ohio", "georgia", "north-carolina", "michigan",
  "new-jersey", "virginia", "washington", "arizona", "massachusetts",
  "tennessee", "indiana", "maryland", "colorado", "minnesota",
];

function generateComparisonSlugs(): string[] {
  const slugs: string[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < TOP_STATES.length; i++) {
    for (let j = i + 1; j < TOP_STATES.length; j++) {
      const slug = `${TOP_STATES[i]}-vs-${TOP_STATES[j]}`;
      if (!seen.has(slug)) {
        seen.add(slug);
        slugs.push(slug);
      }
    }
  }
  return slugs;
}

/**
 * Sitemap index: id 0 = static + states + counties + state comparisons
 * id 1..N = county comparison pages (paginated, 124K+ URLs)
 */
export async function generateSitemaps() {
  const totalComparisons = getCountyComparisonCount();
  const compSitemapCount = Math.ceil(totalComparisons / URLS_PER_SITEMAP);
  const ids = [{ id: 0 }];
  for (let i = 1; i <= compSitemapCount; i++) {
    ids.push({ id: i });
  }
  return ids;
}

export default function sitemap({ id: rawId }: { id: number }): MetadataRoute.Sitemap {
  const id = Number(rawId);
  if (id === 0) {
    const states = getAllStates();
    const counties = getAllCounties();
    const comparisonSlugs = generateComparisonSlugs();

    return [
      { url: SITE_URL, changeFrequency: "monthly", priority: 1.0 },
      { url: `${SITE_URL}/calculator`, changeFrequency: "monthly", priority: 0.9 },
      { url: `${SITE_URL}/compare`, changeFrequency: "monthly", priority: 0.8 },
      { url: `${SITE_URL}/about`, changeFrequency: "yearly", priority: 0.3 },
      { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
      { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
      { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.3 },
      ...states.map((s) => ({
        url: `${SITE_URL}/state/${s.slug}`,
        changeFrequency: "monthly" as const,
        priority: 0.9,
      })),
      ...counties.map((c) => ({
        url: `${SITE_URL}/county/${c.slug}`,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
      ...comparisonSlugs.map((slug) => ({
        url: `${SITE_URL}/compare/${slug}`,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    ];
  }

  // County comparison pages: paginated
  const offset = (id - 1) * URLS_PER_SITEMAP;
  const comparisons = getCountyComparisonSlugsPage(offset, URLS_PER_SITEMAP);

  return comparisons.map((c) => ({
    url: `${SITE_URL}/county-compare/${c.slug}/`,
    changeFrequency: "yearly" as const,
    priority: 0.5,
  }));
}
