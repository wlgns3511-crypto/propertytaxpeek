/**
 * JSON-LD helpers for PropertyTaxPeek.
 * Phase 6 v6.4 (2026-05-11): honest creator/publisher/reviewer split (Trap #105).
 *
 * schema.org Dataset role split:
 *   - creator           = upstream data origin (US Census Bureau ACS)
 *   - publisher         = the platform that publishes the relay (DataPeek Network)
 *   - sourceOrganization = all upstream data origins (Census ACS + Census Govt Finances)
 *   - reviewedBy        = the editorial team that reviews freshness and copy
 *
 * `temporalCoverage` reflects the ACS 2020/2024 5-year range for housing data.
 * `dateModified` accepts a per-entity vintage (state/county/etc) so each family
 * of pages signals its own review cycle, not a single sitewide NOW.
 */

import {
  PUBLISHER,
  SOURCE_AUTHORITIES,
  EDITORIAL_TEAM,
  STATE_VINTAGE,
} from "@/lib/authorship";

const SITE_URL = "https://propertytaxpeek.com";

const PUBLISHER_NODE = {
  "@type": "Organization",
  name: PUBLISHER.name,
  url: PUBLISHER.url,
};

const EDITORIAL_NODE = {
  "@type": "Organization",
  name: EDITORIAL_TEAM.name,
  url: EDITORIAL_TEAM.url,
  parentOrganization: PUBLISHER_NODE,
};

export type DatasetSchemaOpts = {
  url?: string;
  /** ISO YYYY-MM-DD — per-entity vintage. Defaults to STATE_VINTAGE. */
  dateModified?: string;
  /** Free-text spatial coverage, e.g. "Texas, USA" or "Travis County, TX, USA". */
  spatialCoverage?: string;
  /** Variable measured by the dataset (e.g., "effective_property_tax_rate"). */
  variableMeasured?: string | string[];
};

export function datasetSchema(
  name: string,
  description: string,
  opts: DatasetSchemaOpts = {},
) {
  const { url, dateModified = STATE_VINTAGE, spatialCoverage, variableMeasured } = opts;
  const fullUrl = url ? (url.startsWith("http") ? url : `${SITE_URL}${url}`) : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name,
    description,
    ...(fullUrl ? { url: fullUrl } : {}),
    license: "https://creativecommons.org/publicdomain/zero/1.0/",
    creator: SOURCE_AUTHORITIES[0],
    publisher: PUBLISHER_NODE,
    sourceOrganization: SOURCE_AUTHORITIES,
    isBasedOn: SOURCE_AUTHORITIES.map((a) => a.url),
    reviewedBy: EDITORIAL_NODE,
    temporalCoverage: "2020/2024",
    datePublished: "2026-03-15",
    dateModified,
    ...(spatialCoverage ? { spatialCoverage } : {}),
    ...(variableMeasured
      ? {
          variableMeasured: Array.isArray(variableMeasured)
            ? variableMeasured
            : [variableMeasured],
        }
      : {}),
    ...(fullUrl
      ? {
          distribution: {
            "@type": "DataDownload",
            encodingFormat: "text/html",
            contentUrl: fullUrl,
          },
        }
      : {}),
  };
}

export type BreadcrumbItem = { name: string; url: string };

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

export type FaqEntry = { question: string; answer: string };

export function faqSchema(faqs: FaqEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}
