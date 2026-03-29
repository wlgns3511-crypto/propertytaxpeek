import type { MetadataRoute } from "next";
import { getAllStates, getAllCounties, getAllCountyComparisonSlugs } from "@/lib/db";
import { getAllPosts } from "@/lib/blog";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://propertytaxpeek.com";

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

export default function sitemap(): MetadataRoute.Sitemap {
  const states = getAllStates();
  const counties = getAllCounties();
  const comparisonSlugs = generateComparisonSlugs();

  const posts = getAllPosts();
  // 50K URL 제한 — states + counties 먼저, 나머지 county comparisons으로 채움
  const baseCount = 7 + posts.length + states.length + counties.length + comparisonSlugs.length;
  const countyCompLimit = Math.min(45000 - baseCount, 42000);
  const countyComparisons = getAllCountyComparisonSlugs(countyCompLimit);

  return [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1.0 },
    { url: `${SITE_URL}/calculator`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/compare`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/blog/`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/about`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.3 },
    ...posts.map((p) => ({
      url: `${SITE_URL}/blog/${p.slug}/`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
      lastModified: p.updatedAt ?? p.publishedAt,
    })),
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
    ...countyComparisons.map((c) => ({
      url: `${SITE_URL}/county-compare/${c.slug}/`,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
  ];
}
