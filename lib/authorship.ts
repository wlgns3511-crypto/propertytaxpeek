/**
 * Network-wide publisher and per-site editorial team. No individual bylines;
 * data-aggregator sites publish as an Organization.
 *
 * HCU Phase 6 v6.2 (2026-05-05): per-source vintages + honest reviewedBy.
 * SOURCE_AUTHORITIES lists ONLY authorities with actual DB backing
 * (Census ACS 2024 5-Year). Cross-reference resources (Tax Foundation,
 * Lincoln Institute, IRS Pub 530) appear in body trust blocks but
 * NOT as schema-level data providers — that would be a freshness lie.
 */

// Per-entity vintages — when each dataset/page family was last reviewed.
// Splitting these is honest freshness: counties refresh on the ACS cycle,
// state metadata refreshes on a different cadence, exemption rules move
// with state legislation.
export const COUNTY_VINTAGE = '2026-04-29';
export const STATE_VINTAGE = '2026-04-29';
export const EXEMPTION_VINTAGE = '2026-04-15';
export const COMPARE_VINTAGE = '2026-04-29';
export const METHODOLOGY_VINTAGE = '2026-04-08';
export const ABOUT_VINTAGE = '2026-04-12';
export const SITE_VINTAGE = '2026-03-15';
export const GUIDES_VINTAGE = '2026-04-15';
export const BLOG_VINTAGE = '2026-04-22';

export const LEGAL_VINTAGES = {
  privacy: '2026-04-22',
  terms: '2026-02-18',
  disclaimer: '2025-11-04',
};

// Per-source vintage — when each upstream authority last published.
// Display only (not a recognized schema.org field), used for UI freshness lines.
export const SOURCE_VINTAGES: Record<string, string> = {
  'US Census Bureau ACS 2024 5-Year': '2026-04-29',
  'US Census Bureau — State & Local Government Finances': '2025-12-15',
};

// Legacy alias kept for back-compat with existing schema callers.
// Maps to the most recently refreshed dataset.
export const DB_UPDATED = COUNTY_VINTAGE;

export const PUBLISHER = {
  name: 'DataPeek Research Network',
  url: 'https://datapeekfacts.com',
  description:
    'A public-data network aggregating government and public datasets across US housing, tax, healthcare, and other civic domains.',
};

export const EDITORIAL_TEAM = {
  name: 'PropertyTaxPeek Editorial Team',
  url: 'https://datapeekfacts.com/editorial-policy/',
  parentOrganization: PUBLISHER,
};

// Honest data providers only — each entry has matching data inside data/taxes.db
// or lib/generated/*.json. Adding nominal authorities here (e.g., Tax Foundation,
// IRS publications) without ingesting their data would be a freshness/authority lie.
export const SOURCE_AUTHORITIES = [
  {
    '@type': 'Organization',
    name: 'US Census Bureau — American Community Survey (ACS) 2024 5-Year',
    url: 'https://www.census.gov/programs-surveys/acs/',
  },
  {
    '@type': 'Organization',
    name: 'US Census Bureau — State & Local Government Finances',
    url: 'https://www.census.gov/programs-surveys/gov-finances.html',
  },
];

export const REVIEWER_DISCLAIMER =
  'Property tax data is informational. Final tax determinations are made by your local county assessor and tax authority. Rates, exemptions, and assessment methods vary by jurisdiction and change over time. Verify current figures with your county assessor or a licensed tax professional before making financial decisions.';
