/**
 * Server-component county-level choropleth for US property tax effective rates.
 *
 * Renders 2,780 US county polygons (us-atlas via topojson-client + d3-geo
 * geoAlbersUsa projection) coloured by 5-band EffectiveRateVsAssessmentDecoder
 * tier (<0.5% very-low → ≥2.0% very-high). State boundaries overlaid.
 *
 * Pure server-side SVG; zero client JS; deterministic.
 *
 * Data contract: callers pass {slug, effective_rate, county_name, state,
 * median_tax, median_home_value, population} per row. The component
 * cross-matches each topojson polygon to the DB row via a normalized
 * name+state key (handles Parish/Borough/Census Area suffixes and the
 * Doña Ana accent edge-case).
 *
 * Source: US Census Bureau ACS 2024 5-Year (B25103 ÷ B25077) for tax
 * rate; us-atlas (US Census TIGER/Line) for polygon geometry.
 */
import {
  getCountyPaths,
  getStateBordersPath,
  MAP_WIDTH,
  MAP_HEIGHT,
  countyMatchKey,
  USPS_TO_NAME,
} from '@/lib/us-counties-map';

interface CountyRow {
  slug: string;
  county_name: string;
  state: string;
  effective_rate: number;
  median_tax?: number;
  median_home_value?: number;
  population?: number;
}

interface Props {
  counties: CountyRow[];
  /** Slug of the currently-viewed county, drawn with a thick outline. */
  currentSlug?: string;
  /** State USPS to dim everything outside it. */
  currentStateCode?: string;
  /** Visual variant. 'compact' for state pages, 'full' for homepage. */
  variant?: 'compact' | 'full';
}

// EffectiveRateVsAssessmentDecoder bands (matches lib/effective-rate-decoder.ts):
//   < 0.5%  → very-low
//   < 0.9%  → low
//   < 1.5%  → moderate
//   < 2.0%  → high
//   ≥ 2.0%  → very-high
const TIER_FILL = {
  'very-low':  '#10b981',   // emerald-500
  'low':       '#84cc16',   // lime-500
  'moderate':  '#eab308',   // yellow-500
  'high':      '#f97316',   // orange-500
  'very-high': '#dc2626',   // red-600
} as const;
type Tier = keyof typeof TIER_FILL;

const TIER_ORDER: Tier[] = ['very-low', 'low', 'moderate', 'high', 'very-high'];
const TIER_LABEL: Record<Tier, string> = {
  'very-low': '< 0.5%',
  'low':       '0.5–0.9%',
  'moderate':  '0.9–1.5%',
  'high':      '1.5–2.0%',
  'very-high': '≥ 2.0%',
};

const NO_DATA_FILL = '#e2e8f0';   // stone-200

function bandRate(pct: number): Tier {
  if (pct < 0.5) return 'very-low';
  if (pct < 0.9) return 'low';
  if (pct < 1.5) return 'moderate';
  if (pct < 2.0) return 'high';
  return 'very-high';
}

export function CountyChoropleth({
  counties,
  currentSlug,
  currentStateCode,
  variant = 'full',
}: Props) {
  // Build the cross-match index: normalized key → row.
  const byKey = new Map<string, CountyRow>();
  for (const c of counties) {
    byKey.set(countyMatchKey(c.county_name, c.state), c);
  }

  const paths = getCountyPaths();
  const stateBorders = getStateBordersPath();

  // Bucket counts for the legend
  const tierCounts: Record<Tier, number> = {
    'very-low': 0, 'low': 0, 'moderate': 0, 'high': 0, 'very-high': 0,
  };
  let noDataCount = 0;
  let matchedCount = 0;
  for (const p of paths) {
    const row = byKey.get(p.key);
    if (!row) { noDataCount += 1; continue; }
    matchedCount += 1;
    tierCounts[bandRate(row.effective_rate)] += 1;
  }

  const focusUsps = currentStateCode?.toUpperCase();
  const headerLabel = focusUsps
    ? `${USPS_TO_NAME[focusUsps] ?? focusUsps} county property tax map`
    : 'US county property tax map';

  return (
    <figure className="my-6">
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        className="w-full h-auto block bg-stone-50 rounded-lg border border-stone-200"
        role="img"
        aria-label={`${headerLabel}: ${matchedCount.toLocaleString()} counties coloured by effective property tax rate (Census ACS B25103÷B25077, 5-band tier).`}
      >
        {/* County polygons */}
        {paths.map(p => {
          const row = byKey.get(p.key);
          const fill = row ? TIER_FILL[bandRate(row.effective_rate)] : NO_DATA_FILL;
          const isOutsideState = focusUsps != null && p.usps !== focusUsps;
          const isCurrent = currentSlug != null && row?.slug === currentSlug;
          return (
            <path
              key={p.fips}
              d={p.d}
              fill={fill}
              fillOpacity={isOutsideState ? 0.35 : (row ? 0.9 : 0.6)}
              stroke={isCurrent ? '#0c4a6e' : '#ffffff'}
              strokeWidth={isCurrent ? 1.8 : 0.2}
            >
              {row && (
                <title>
                  {row.county_name}, {row.state}
                  {' · '}{row.effective_rate.toFixed(2)}%
                  {row.median_tax ? ` · $${row.median_tax.toLocaleString()}/yr median tax` : ''}
                  {row.median_home_value ? ` · $${row.median_home_value.toLocaleString()} median home value` : ''}
                </title>
              )}
            </path>
          );
        })}

        {/* State borders overlay */}
        <path
          d={stateBorders}
          fill="none"
          stroke="#475569"
          strokeWidth={0.6}
          strokeLinejoin="round"
        />
      </svg>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        <span className="font-medium text-stone-700">Effective rate:</span>
        {TIER_ORDER.map(t => (
          <span
            key={t}
            className={`inline-flex items-center gap-1.5 ${tierCounts[t] > 0 ? '' : 'opacity-40'}`}
          >
            <span
              className="inline-block w-3 h-3 rounded-sm border border-white/60 ring-1 ring-stone-300"
              style={{ backgroundColor: TIER_FILL[t] }}
              aria-hidden="true"
            />
            <span className="text-stone-700">{TIER_LABEL[t]}</span>
            <span className="text-stone-400 font-mono">{tierCounts[t].toLocaleString()}</span>
          </span>
        ))}
        {noDataCount > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-sm border border-white/60 ring-1 ring-stone-300"
              style={{ backgroundColor: NO_DATA_FILL }}
              aria-hidden="true"
            />
            <span className="text-stone-700">No data</span>
            <span className="text-stone-400 font-mono">{noDataCount.toLocaleString()}</span>
          </span>
        )}
      </div>

      <figcaption className="text-xs text-stone-500 mt-2">
        {matchedCount.toLocaleString()} of {paths.length.toLocaleString()} US counties matched
        to propertytaxpeek effective-rate data.
        {' '}5-band tier matches{' '}
        <code className="px-1 mx-0.5 bg-stone-100 rounded text-[11px]">EffectiveRateVsAssessmentDecoder</code>
        {' '}cutoffs (lib/effective-rate-decoder.ts).
        {' '}Rate = Census ACS B25103 (median real estate taxes) ÷ B25077 (median home value).
        {' '}Boundaries: <a href="https://github.com/topojson/us-atlas" className="underline" rel="noreferrer">US Census TIGER/Line via us-atlas</a>.
        {variant === 'full' && (
          <>
            {' '}Hover any county for name, rate, median tax, and median home value.
          </>
        )}
      </figcaption>
    </figure>
  );
}
