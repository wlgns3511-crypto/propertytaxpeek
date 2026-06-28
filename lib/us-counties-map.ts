/**
 * Server-side US counties map projection helpers.
 *
 * Loads `us-atlas/counties-10m.json` (US Census Bureau via topojson-client),
 * projects every county polygon and every state polygon through
 * geoAlbersUsa() once at module init, and exposes `{fips, slug, d, name, usps}`
 * tuples for each county plus state outline paths.
 *
 * Used by CountyChoropleth to render 2,780 county polygons coloured by
 * effective property tax rate (Census ACS B25103÷B25077).
 *
 * Slug-matching strategy: the us-atlas counties topojson has `id`=FIPS and
 * `properties.name`=short county name (without "County"/"Parish"/etc).
 * We compute a normalized lookup key per county from name+state and let
 * downstream code match against propertytaxpeek's DB slug ("autauga-county-al",
 * "acadia-parish-la", "aleutians-east-borough-ak", "doña-ana-county-nm" →
 * "dona-ana-county-nm" with accent stripped).
 */
import { geoAlbersUsa, geoPath } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import countiesTopo from 'us-atlas/counties-10m.json';
import type { Feature, Geometry } from 'geojson';
import type { Topology, Objects, GeometryObject } from 'topojson-specification';

export const MAP_WIDTH = 960;
export const MAP_HEIGHT = 600;

// State FIPS prefix → USPS 2-letter (50 states + DC; PR/GU/AS/MP/VI excluded).
export const STATE_FIPS_TO_USPS: Record<string, string> = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA', '08': 'CO',
  '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL', '13': 'GA', '15': 'HI',
  '16': 'ID', '17': 'IL', '18': 'IN', '19': 'IA', '20': 'KS', '21': 'KY',
  '22': 'LA', '23': 'ME', '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN',
  '28': 'MS', '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
  '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND', '39': 'OH',
  '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI', '45': 'SC', '46': 'SD',
  '47': 'TN', '48': 'TX', '49': 'UT', '50': 'VT', '51': 'VA', '53': 'WA',
  '54': 'WV', '55': 'WI', '56': 'WY',
};

export const USPS_TO_NAME: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan',
  MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
  NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota',
  OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
  RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee',
  TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
  WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

export interface CountyPath {
  fips: string;       // 5-digit FIPS, padded
  slug: string;       // Best-guess DB slug match
  d: string;          // SVG path data
  name: string;       // Raw county name from topojson
  usps: string;       // State USPS code
  /** Normalized name+state key for cross-matching (lowercase, no accents, no suffix) */
  key: string;
}

export interface StatePath {
  fips: string;
  usps: string;
  name: string;
  d: string;
}

// Historical spelling variants where the DB and the us-atlas topojson disagree.
// Map: normalized-key-alias → canonical normalized-key.
// Only documented edge cases — add new entries here as we find them.
const SPELLING_ALIASES: Record<string, string> = {
  // Montana: DB has "Choteau County" (older spelling), topojson has "Chouteau".
  choteau_mt: 'chouteau_mt',
};

/** Normalize a county name + state into a stable lookup key. */
function normKey(rawName: string, usps: string): string {
  const k = rawName
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // strip accents (Doña → Dona)
    .toLowerCase()
    .replace(/\b(county|parish|borough|census area|municipality|city and borough|city)\b/g, '')
    .replace(/[^a-z0-9]+/g, '')
    + '_' + usps.toLowerCase();
  return SPELLING_ALIASES[k] ?? k;
}

/** Build the most-likely DB slug for a county. Multiple suffix attempts are
 *  emitted; downstream matcher tries them in order against actual DB slugs. */
function bestSlugGuess(rawName: string, usps: string): string {
  const base = rawName
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
  const suffix = usps === 'LA' ? 'parish'
    : usps === 'AK' ? 'borough'
    : 'county';
  return `${base}-${suffix}-${usps.toLowerCase()}`;
}

// ─────────────────────────────────────────────────────────────
// Module-level cache — projection runs once per server boot
// ─────────────────────────────────────────────────────────────
let _countyPaths: CountyPath[] | null = null;
let _statePaths: StatePath[] | null = null;
let _stateBorders: string | null = null;

function project() {
  // us-atlas TopoJSON has `counties`, `states`, `nation` GeometryCollections.
  // We cast through Topology<Objects> because topojson-specification's
  // GeometryCollection differs structurally from geojson's, and we don't
  // need the narrow generic for runtime correctness.
  const topo = countiesTopo as unknown as Topology<Objects>;

  // geoAlbersUsa scaled to fit MAP_WIDTH × MAP_HEIGHT.
  const projection = geoAlbersUsa().fitSize(
    [MAP_WIDTH, MAP_HEIGHT],
    feature(topo, topo.objects.nation as GeometryObject) as Feature<Geometry>,
  );
  const path = geoPath(projection);

  // Counties layer
  const countyFc = feature(topo, topo.objects.counties as GeometryObject) as unknown as { features: Feature<Geometry, { name: string }>[] };
  _countyPaths = [];
  for (const f of countyFc.features) {
    const fips = String(f.id).padStart(5, '0');
    const stateFips = fips.slice(0, 2);
    const usps = STATE_FIPS_TO_USPS[stateFips];
    if (!usps) continue;  // Filters PR/GU/AS/MP/VI territories
    const d = path(f);
    if (!d) continue;     // Outside Albers projection
    const name = f.properties?.name ?? '';
    _countyPaths.push({
      fips,
      slug: bestSlugGuess(name, usps),
      d,
      name,
      usps,
      key: normKey(name, usps),
    });
  }

  // States layer (outlines for context)
  const stateFc = feature(topo, topo.objects.states as GeometryObject) as unknown as { features: Feature<Geometry, { name: string }>[] };
  _statePaths = [];
  for (const f of stateFc.features) {
    const fips = String(f.id).padStart(2, '0');
    const usps = STATE_FIPS_TO_USPS[fips];
    if (!usps) continue;
    const d = path(f);
    if (!d) continue;
    _statePaths.push({
      fips,
      usps,
      name: f.properties?.name ?? USPS_TO_NAME[usps] ?? usps,
      d,
    });
  }

  // Inter-state borders mesh (cleaner than redrawing each state outline)
  const meshGeom = mesh(topo, topo.objects.states as GeometryObject, (a, b) => a !== b);
  _stateBorders = path(meshGeom);
}

export function getCountyPaths(): CountyPath[] {
  if (_countyPaths == null) project();
  return _countyPaths!;
}

export function getStatePaths(): StatePath[] {
  if (_statePaths == null) project();
  return _statePaths!;
}

export function getStateBordersPath(): string {
  if (_stateBorders == null) project();
  return _stateBorders ?? '';
}

/** Normalized key for matching topojson features to DB rows. */
export function countyMatchKey(countyName: string, state: string): string {
  return normKey(countyName, state);
}
