import type { MetadataRoute } from "next";
import { getAllStates, getAllCounties } from "@/lib/db";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://propertytaxpeek.com";

// Top 20 states for pre-built comparison pages (must match compare/[slug]/page.tsx)
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

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1.0 },
    {
      url: `${SITE_URL}/calculator`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    { url: `${SITE_URL}/compare`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/about`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const statePages: MetadataRoute.Sitemap = states.map((s) => ({
    url: `${SITE_URL}/state/${s.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  const countyPages: MetadataRoute.Sitemap = counties.map((c) => ({
    url: `${SITE_URL}/county/${c.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const comparisonPages: MetadataRoute.Sitemap = comparisonSlugs.map((slug) => ({
    url: `${SITE_URL}/compare/${slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...statePages, ...countyPages, ...comparisonPages];
}
