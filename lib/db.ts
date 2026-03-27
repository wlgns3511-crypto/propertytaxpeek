import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "taxes.db");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
  }
  return _db;
}

// --- Types ---

export interface State {
  id: number;
  state: string;
  abbr: string;
  slug: string;
  avg_rate: number;
  median_tax: number;
  median_home_value: number;
  effective_rate: number;
}

export interface County {
  id: number;
  county_name: string;
  state: string;
  slug: string;
  avg_rate: number;
  median_tax: number;
  median_home_value: number;
  population: number;
  effective_rate: number;
}

// --- State queries ---

export function getAllStates(): State[] {
  return getDb()
    .prepare("SELECT * FROM states ORDER BY state ASC")
    .all() as State[];
}

export function getStateBySlug(slug: string): State | undefined {
  return getDb()
    .prepare("SELECT * FROM states WHERE slug = ?")
    .get(slug) as State | undefined;
}

export function getHighestTaxStates(limit = 10): State[] {
  return getDb()
    .prepare("SELECT * FROM states ORDER BY effective_rate DESC LIMIT ?")
    .all(limit) as State[];
}

export function getLowestTaxStates(limit = 10): State[] {
  return getDb()
    .prepare("SELECT * FROM states ORDER BY effective_rate ASC LIMIT ?")
    .all(limit) as State[];
}

export function getStateByAbbr(abbr: string): State | undefined {
  return getDb()
    .prepare("SELECT * FROM states WHERE abbr = ?")
    .get(abbr) as State | undefined;
}

// --- County queries ---

export function getCountiesByState(stateAbbr: string): County[] {
  return getDb()
    .prepare(
      "SELECT * FROM counties WHERE state = ? ORDER BY population DESC"
    )
    .all(stateAbbr) as County[];
}

export function getCountyBySlug(slug: string): County | undefined {
  return getDb()
    .prepare("SELECT * FROM counties WHERE slug = ?")
    .get(slug) as County | undefined;
}

export function getAllCounties(): County[] {
  return getDb()
    .prepare("SELECT * FROM counties ORDER BY population DESC")
    .all() as County[];
}

export function getHighestTaxCounties(limit = 10): County[] {
  return getDb()
    .prepare("SELECT * FROM counties ORDER BY effective_rate DESC LIMIT ?")
    .all(limit) as County[];
}

export function getLowestTaxCounties(limit = 10): County[] {
  return getDb()
    .prepare("SELECT * FROM counties ORDER BY effective_rate ASC LIMIT ?")
    .all(limit) as County[];
}

// --- Search ---

export function searchLocations(
  query: string
): { states: State[]; counties: County[] } {
  const pattern = `%${query}%`;
  const states = getDb()
    .prepare("SELECT * FROM states WHERE state LIKE ? OR abbr LIKE ? LIMIT 10")
    .all(pattern, pattern) as State[];
  const counties = getDb()
    .prepare(
      "SELECT * FROM counties WHERE county_name LIKE ? OR state LIKE ? ORDER BY population DESC LIMIT 20"
    )
    .all(pattern, pattern) as County[];
  return { states, counties };
}

// --- Aggregate stats ---

export function getNationalAverage(): {
  avg_rate: number;
  avg_median_tax: number;
  avg_home_value: number;
} {
  const row = getDb()
    .prepare(
      "SELECT AVG(effective_rate) as avg_rate, AVG(median_tax) as avg_median_tax, AVG(median_home_value) as avg_home_value FROM states"
    )
    .get() as { avg_rate: number; avg_median_tax: number; avg_home_value: number };
  return row;
}

export function countStates(): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) as cnt FROM states")
    .get() as { cnt: number };
  return row.cnt;
}

export function countCounties(): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) as cnt FROM counties")
    .get() as { cnt: number };
  return row.cnt;
}

// --- County Comparison queries ---

export interface CountyComparison {
  id: number;
  slug: string;
  county_a_slug: string;
  county_b_slug: string;
}

export function getAllCountyComparisonSlugs(limit = 50000): CountyComparison[] {
  return getDb()
    .prepare('SELECT * FROM county_comparisons ORDER BY id LIMIT ?')
    .all(limit) as CountyComparison[];
}

export function getCountyComparisonBySlug(slug: string): { a: County; b: County } | undefined {
  const row = getDb()
    .prepare('SELECT county_a_slug, county_b_slug FROM county_comparisons WHERE slug = ?')
    .get(slug) as { county_a_slug: string; county_b_slug: string } | undefined;
  if (!row) return undefined;
  const a = getCountyBySlug(row.county_a_slug);
  const b = getCountyBySlug(row.county_b_slug);
  if (!a || !b) return undefined;
  return { a, b };
}

export function countCountyComparisons(): number {
  try {
    return (getDb().prepare('SELECT COUNT(*) as c FROM county_comparisons').get() as { c: number }).c;
  } catch { return 0; }
}
