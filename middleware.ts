// HCU 2026-04-24 crawl hygiene middleware for propertytaxpeek.
//
// Problem: site shipped /county-compare/[slug] with dynamicParams=true over
// a 124,750-row county_comparisons table. Google discovered ~34k of these
// and logged 28,221 "duplicate no canonical" + 5,588 "crawled not indexed"
// + 5,587 5xx (render failures for stale/unseeded slugs). Meanwhile the
// valuable surface — /county/* (2,780 pages, 40k GSC impressions) — kept
// earning clicks. Surgery:
//
//   1. 410 Gone for /county-compare/<slug>/ when slug is NOT in the
//      200-slug keep-set (100 canonical pairs + reverses, same-state,
//      both counties >= 100K pop, 5-per-state cap). Route is now
//      dynamicParams=false so unknown slugs already 404 route-side, but
//      410 at the edge is a stronger deindex signal and saves render.
//   2. 410 Gone for all /es/county/<slug>/  — 2,780 thin Spanish mirrors,
//      zero GSC signal, already dropped from sitemap 2026-04-23. /es/
//      landing stays (singleton).
//   3. 301 www.propertytaxpeek.com -> propertytaxpeek.com backup.
//      next.config.ts already does this via redirects(); middleware
//      doubles up at the edge to drain any residual pre-301 crawl queue.
//
// Keep-set is built at build time via scripts/build-keep-sets.ts and
// imported as plain JSON — Edge-runtime safe (no fs, no sqlite).
//
// 410 vs 404: 410 is a stronger deindex signal (permanent vs temporary).
// Same pattern used on tariffpeek + ingredipeek — confirmed deindex
// within 24h of IndexNow submission.

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import countyCompareKeep from '@/lib/generated/county-compare-keep.json';
import stateCompareKeep from '@/lib/generated/state-compare-keep.json';

const COUNTY_COMPARE_KEEP = new Set<string>(countyCompareKeep as string[]);
const STATE_COMPARE_KEEP = new Set<string>(stateCompareKeep as string[]);

// Strip optional trailing slash so keep-set lookups are slash-agnostic.
// (next.config trailingSlash=true but crawlers hit both forms.)
function stripSlash(p: string): string {
  return p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p;
}

function gone(): NextResponse {
  return new NextResponse(
    '<!doctype html><meta charset=utf-8><title>410 Gone</title><h1>410 Gone</h1><p>This page has been permanently removed.</p>',
    { status: 410, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=86400' } }
  );
}

export function middleware(request: NextRequest) {
  const { pathname, host } = request.nextUrl;

  // (1) www -> apex 301 backup. next.config.ts handles this but we double
  //     up at the edge to drain the residual www crawl queue.
  if (host === 'www.propertytaxpeek.com') {
    const url = request.nextUrl.clone();
    url.host = 'propertytaxpeek.com';
    return NextResponse.redirect(url, 301);
  }

  const clean = stripSlash(pathname);

  // (2) Kill /es/county/<slug>/ entirely. /es/ landing stays
  //     (clean === '/es'). Catches 2,780 thin Spanish county pages.
  if (clean.startsWith('/es/county/')) {
    return gone();
  }

  // (3) Non-keep /county-compare/<slug>/ → 410. Route-level
  //     dynamicParams=false would already 404 these, but 410 is a
  //     stronger deindex signal and avoids burning render budget on
  //     unknown slugs during the GSC reprocessing window.
  if (clean.startsWith('/county-compare/')) {
    const slug = clean.slice('/county-compare/'.length);
    // Only enforce for direct slug paths (no further nested segments).
    if (slug && !slug.includes('/') && !COUNTY_COMPARE_KEEP.has(slug)) {
      return gone();
    }
  }

  // (4) 2026-05-21 — Non-keep /compare/<slug>/ → 410. Same rationale as
  //     /county-compare/ block above. GSC was showing 34,602 "duplicate
  //     no canonical" for /compare/<slug>/ because app/compare/[slug]/
  //     page.tsx generates only 100 canonical state pairs (CAP-100,
  //     alphabetical) and notFound()s the rest → 404. Same as wagepeek/
  //     degreewize/nameblooms/myschoolpeek pattern, /compare/<slug>/ now
  //     returns 410 for unknown slugs so GSC reprocesses faster.
  //     Root /compare/ (state list page) and exact-keep slugs (forward
  //     and reverse — page.tsx redirects reverse → canonical) pass through.
  if (clean.startsWith('/compare/')) {
    const slug = clean.slice('/compare/'.length);
    if (slug && !slug.includes('/') && !STATE_COMPARE_KEEP.has(slug)) {
      return gone();
    }
  }

  // Preserve original x-pathname header for downstream route handlers.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.png|robots.txt|sitemap.xml|api).*)'],
};
