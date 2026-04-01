import type { MetadataRoute } from "next";
import { getAllStates, getAllCounties, getCountyComparisonCount, getCountyComparisonSlugsPage } from "@/lib/db";
import { getAllPosts } from "@/lib/blog";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://propertytaxpeek.com";
const MAX_PER_SITEMAP = 45000;

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

export async function generateSitemaps() {
  const totalCountyComparisons = getCountyComparisonCount();
  const sitemapCount = Math.ceil(totalCountyComparisons / MAX_PER_SITEMAP) + 1;
  return Array.from({ length: sitemapCount }, (_, i) => ({ id: i }));
}

export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const id = Number(await props.id);

  if (id === 0) {
    // Static + states + counties + state comparisons + blog
    const states = getAllStates();
    const counties = getAllCounties();
    const comparisonSlugs = generateComparisonSlugs();
    const posts = getAllPosts();

    return [
      { url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 1.0 },
      { url: `${SITE_URL}/calculator/`, changeFrequency: "monthly", priority: 0.9 },
      { url: `${SITE_URL}/compare/`, changeFrequency: "monthly", priority: 0.8 },
      { url: `${SITE_URL}/blog/`, changeFrequency: "weekly", priority: 0.8 },
      { url: `${SITE_URL}/about/`, changeFrequency: "yearly", priority: 0.3 },
      { url: `${SITE_URL}/privacy/`, changeFrequency: "yearly", priority: 0.2 },
      { url: `${SITE_URL}/terms/`, changeFrequency: "yearly", priority: 0.2 },
      { url: `${SITE_URL}/contact/`, changeFrequency: "yearly", priority: 0.3 },
      ...posts.map((p) => ({
        url: `${SITE_URL}/blog/${p.slug}/`,
        changeFrequency: "monthly" as const,
        priority: 0.7,
        lastModified: p.updatedAt ?? p.publishedAt,
      })),
      ...states.map((s) => ({
        url: `${SITE_URL}/state/${s.slug}/`,
        changeFrequency: "monthly" as const,
        priority: 0.9,
      })),
      ...counties.map((c) => ({
        url: `${SITE_URL}/county/${c.slug}/`,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
      ...comparisonSlugs.map((slug) => ({
        url: `${SITE_URL}/compare/${slug}/`,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    ];
  }

  // Sitemap 1+: county comparison pages
  const offset = (id - 1) * MAX_PER_SITEMAP;
  const countyComparisons = getCountyComparisonSlugsPage(offset, MAX_PER_SITEMAP);
  return countyComparisons.map((c) => ({
    url: `${SITE_URL}/county-compare/${c.slug}/`,
    changeFrequency: "yearly" as const,
    priority: 0.5,
  }));
}
