/**
 * Virginia tangible personal property ("car tax" / vehicle) tax rates by locality.
 *
 * SOURCE (single authoritative publisher, transcribed row-for-row):
 *   Virginia Department of Taxation —
 *   "Tax Rates for County, City, Town, and Districts. TY 2025"
 *   Table 1 (county levies) + Table 2 (city levies),
 *   "Tangible Personal Property" column, dollars per $100 of assessed value.
 *   https://www.tax.virginia.gov/sites/default/files/inline-files/2025-local-tax-rates.pdf
 *   Retrieved 2026-05-29. 109 of Virginia's localities matched to our page set
 *   (95 counties + 38 independent cities published; we render the 109 we cover).
 *
 * WHY THIS LAYER EXISTS — honest scope:
 *   propertytaxpeek's primary data is REAL ESTATE property tax (Census ACS
 *   effective rate). Virginia is the one state where "personal property tax
 *   rate vehicles" is a dominant local query — Virginia levies a separate
 *   tangible-personal-property ("car") tax set by each county/city. This is a
 *   DISTINCT tax from the real-estate rate shown elsewhere on the page; the two
 *   are never blended.
 *
 * HONEST FRAMING (verbatim from the official TY 2025 Table 1 / Table 2 notes):
 *   - "Rates above are rounded general nominal rates. Certain items of property,
 *      including vehicles, may be considered separate classifications and may be
 *      taxed at a different tax rate." We surface the published general tangible-
 *      personal-property rate — the rate that applies to household vehicles in
 *      the large majority of Virginia localities. Where a locality sets a separate
 *      vehicle class rate, its own schedule governs.
 *   - "Published tax rates may not reflect all local programs; actual tax
 *      liability may vary." Notably the Personal Property Tax Relief Act (Va. Code
 *      § 58.1-3523 et seq.) subsidises part of the tax on qualifying personal-use
 *      vehicles — the rate below is the gross nominal rate, before that relief.
 *   - "The data in this table is reported by local Commissioners of the Revenue
 *      and Assessing Officials."
 *   - Towns levy separately (TY 2025 Table 3) and are NOT covered here.
 *   - Localities absent from the source return null — never synthesised.
 *
 * This is editorial surfacing of a primary-source rate. It is NOT tax advice and
 * is NOT endorsed by the Virginia Department of Taxation.
 */

export interface VaVehicleTaxRecord {
  /** Locality display name, e.g. "Bedford County". */
  localityName: string;
  localityType: "county" | "city";
  /** Tangible personal property rate — $ per $100 of assessed value (the vehicle "car tax" rate). */
  personalPropertyRate: number;
  /** Nominal statutory real-estate rate from the same table (DISTINCT from the ACS effective rate). */
  realEstateNominalRate: number;
  /** Machinery & tools rate — $ per $100 (transcribed for source fidelity; not surfaced). */
  machineryToolsRate: number;
}

export const VA_VEHICLE_TAX_SOURCE = {
  publisher: "Virginia Department of Taxation",
  title: "Tax Rates for County, City, Town, and Districts. TY 2025",
  url: "https://www.tax.virginia.gov/sites/default/files/inline-files/2025-local-tax-rates.pdf",
  taxYear: 2025,
  retrieved: "2026-05-29",
  unit: "dollars per $100 of assessed value",
  column: "Tangible Personal Property",
} as const;

/**
 * Distribution of the 109 surfaced Virginia tangible-personal-property rates,
 * used by classifyVaVehicleRate() for a peer-relative band. Computed once from
 * the source above (min/Q1/median/Q3/max = 0.55 / 2.85 / 3.60 / 4.14 / 9.00).
 */
export const VA_VEHICLE_TAX_DISTRIBUTION = {
  n: 109,
  min: 0.55,
  q1: 2.85,
  median: 3.6,
  q3: 4.14,
  max: 9.0,
} as const;

export type VaVehicleRateBand = "low" | "moderate" | "above-average" | "high";

export interface VaVehicleRateVerdict {
  band: VaVehicleRateBand;
  /** Short reader label, e.g. "Low for Virginia". */
  label: string;
}

/**
 * Peer-relative band of a locality's vehicle (TPP) rate against the Virginia
 * quartile distribution above. Deterministic; purely a within-Virginia ranking.
 */
export function classifyVaVehicleRate(rate: number): VaVehicleRateVerdict {
  const { q1, median, q3 } = VA_VEHICLE_TAX_DISTRIBUTION;
  if (rate < q1) return { band: "low", label: "Low for Virginia" };
  if (rate < median) return { band: "moderate", label: "Moderate for Virginia" };
  if (rate < q3) return { band: "above-average", label: "Above-average for Virginia" };
  return { band: "high", label: "High for Virginia" };
}

const VA_VEHICLE_TAX_RATES: Record<string, VaVehicleTaxRecord> = {
  "accomack-county-va": { localityName: "Accomack County", localityType: "county", personalPropertyRate: 3.72, realEstateNominalRate: 0.534, machineryToolsRate: 3.72 },
  "albemarle-county-va": { localityName: "Albemarle County", localityType: "county", personalPropertyRate: 4.28, realEstateNominalRate: 0.895, machineryToolsRate: 4.28 },
  "alexandria-city-va": { localityName: "Alexandria City", localityType: "city", personalPropertyRate: 5.33, realEstateNominalRate: 1.135, machineryToolsRate: 4.5 },
  "amherst-county-va": { localityName: "Amherst County", localityType: "county", personalPropertyRate: 3.45, realEstateNominalRate: 0.61, machineryToolsRate: 2.0 },
  "appomattox-county-va": { localityName: "Appomattox County", localityType: "county", personalPropertyRate: 3.35, realEstateNominalRate: 0.63, machineryToolsRate: 3.35 },
  "arlington-county-va": { localityName: "Arlington County", localityType: "county", personalPropertyRate: 5.0, realEstateNominalRate: 1.033, machineryToolsRate: 5.0 },
  "augusta-county-va": { localityName: "Augusta County", localityType: "county", personalPropertyRate: 2.6, realEstateNominalRate: 0.52, machineryToolsRate: 2.0 },
  "bath-county-va": { localityName: "Bath County", localityType: "county", personalPropertyRate: 0.55, realEstateNominalRate: 0.6, machineryToolsRate: 0.55 },
  "bedford-county-va": { localityName: "Bedford County", localityType: "county", personalPropertyRate: 2.35, realEstateNominalRate: 0.41, machineryToolsRate: 1.2 },
  "bland-county-va": { localityName: "Bland County", localityType: "county", personalPropertyRate: 2.29, realEstateNominalRate: 0.6, machineryToolsRate: 1.05 },
  "botetourt-county-va": { localityName: "Botetourt County", localityType: "county", personalPropertyRate: 2.94, realEstateNominalRate: 0.7, machineryToolsRate: 2.0 },
  "brunswick-county-va": { localityName: "Brunswick County", localityType: "county", personalPropertyRate: 3.75, realEstateNominalRate: 0.5, machineryToolsRate: 3.4 },
  "buchanan-county-va": { localityName: "Buchanan County", localityType: "county", personalPropertyRate: 1.95, realEstateNominalRate: 0.39, machineryToolsRate: 1.95 },
  "buckingham-county-va": { localityName: "Buckingham County", localityType: "county", personalPropertyRate: 4.05, realEstateNominalRate: 0.6, machineryToolsRate: 2.9 },
  "campbell-county-va": { localityName: "Campbell County", localityType: "county", personalPropertyRate: 3.95, realEstateNominalRate: 0.45, machineryToolsRate: 3.2 },
  "carroll-county-va": { localityName: "Carroll County", localityType: "county", personalPropertyRate: 2.3, realEstateNominalRate: 0.49, machineryToolsRate: 2.0 },
  "charles-city-county-va": { localityName: "Charles City County", localityType: "county", personalPropertyRate: 3.75, realEstateNominalRate: 0.69, machineryToolsRate: 3.0 },
  "charlotte-county-va": { localityName: "Charlotte County", localityType: "county", personalPropertyRate: 3.46, realEstateNominalRate: 0.62, machineryToolsRate: 3.0 },
  "charlottesville-city-va": { localityName: "Charlottesville City", localityType: "city", personalPropertyRate: 4.4, realEstateNominalRate: 0.98, machineryToolsRate: 4.4 },
  "chesapeake-city-va": { localityName: "Chesapeake City", localityType: "city", personalPropertyRate: 4.08, realEstateNominalRate: 1.01, machineryToolsRate: 3.2 },
  "chesterfield-county-va": { localityName: "Chesterfield County", localityType: "county", personalPropertyRate: 3.35, realEstateNominalRate: 0.89, machineryToolsRate: 1.0 },
  "clarke-county-va": { localityName: "Clarke County", localityType: "county", personalPropertyRate: 4.496, realEstateNominalRate: 0.451, machineryToolsRate: 2.0 },
  "craig-county-va": { localityName: "Craig County", localityType: "county", personalPropertyRate: 3.5, realEstateNominalRate: 0.52, machineryToolsRate: 3.5 },
  "culpeper-county-va": { localityName: "Culpeper County", localityType: "county", personalPropertyRate: 3.5, realEstateNominalRate: 0.43, machineryToolsRate: 2.0 },
  "cumberland-county-va": { localityName: "Cumberland County", localityType: "county", personalPropertyRate: 4.5, realEstateNominalRate: 0.6, machineryToolsRate: 3.75 },
  "danville-city-va": { localityName: "Danville City", localityType: "city", personalPropertyRate: 3.45, realEstateNominalRate: 0.83, machineryToolsRate: 1.5 },
  "dickenson-county-va": { localityName: "Dickenson County", localityType: "county", personalPropertyRate: 1.85, realEstateNominalRate: 0.52, machineryToolsRate: 1.85 },
  "dinwiddie-county-va": { localityName: "Dinwiddie County", localityType: "county", personalPropertyRate: 4.6, realEstateNominalRate: 0.64, machineryToolsRate: 3.3 },
  "essex-county-va": { localityName: "Essex County", localityType: "county", personalPropertyRate: 3.5, realEstateNominalRate: 0.55, machineryToolsRate: 1.2 },
  "fairfax-county-va": { localityName: "Fairfax County", localityType: "county", personalPropertyRate: 4.57, realEstateNominalRate: 1.123, machineryToolsRate: 2.0 },
  "fauquier-county-va": { localityName: "Fauquier County", localityType: "county", personalPropertyRate: 3.45, realEstateNominalRate: 0.967, machineryToolsRate: 3.45 },
  "floyd-county-va": { localityName: "Floyd County", localityType: "county", personalPropertyRate: 3.2, realEstateNominalRate: 0.44, machineryToolsRate: 1.55 },
  "fluvanna-county-va": { localityName: "Fluvanna County", localityType: "county", personalPropertyRate: 4.1, realEstateNominalRate: 0.75, machineryToolsRate: 1.9 },
  "franklin-county-va": { localityName: "Franklin County", localityType: "county", personalPropertyRate: 2.41, realEstateNominalRate: 0.43, machineryToolsRate: 0.7 },
  "frederick-county-va": { localityName: "Frederick County", localityType: "county", personalPropertyRate: 4.23, realEstateNominalRate: 0.48, machineryToolsRate: 2.0 },
  "fredericksburg-city-va": { localityName: "Fredericksburg City", localityType: "city", personalPropertyRate: 3.4, realEstateNominalRate: 0.77, machineryToolsRate: 0.8 },
  "giles-county-va": { localityName: "Giles County", localityType: "county", personalPropertyRate: 2.05, realEstateNominalRate: 0.68, machineryToolsRate: 2.05 },
  "gloucester-county-va": { localityName: "Gloucester County", localityType: "county", personalPropertyRate: 3.1, realEstateNominalRate: 0.614, machineryToolsRate: 3.1 },
  "grayson-county-va": { localityName: "Grayson County", localityType: "county", personalPropertyRate: 2.25, realEstateNominalRate: 0.58, machineryToolsRate: 1.75 },
  "greene-county-va": { localityName: "Greene County", localityType: "county", personalPropertyRate: 4.0, realEstateNominalRate: 0.69, machineryToolsRate: 2.5 },
  "greensville-county-va": { localityName: "Greensville County", localityType: "county", personalPropertyRate: 5.0, realEstateNominalRate: 0.67, machineryToolsRate: 4.0 },
  "halifax-county-va": { localityName: "Halifax County", localityType: "county", personalPropertyRate: 3.85, realEstateNominalRate: 0.5, machineryToolsRate: 1.26 },
  "hampton-city-va": { localityName: "Hampton City", localityType: "city", personalPropertyRate: 4.5, realEstateNominalRate: 1.15, machineryToolsRate: 3.5 },
  "hanover-county-va": { localityName: "Hanover County", localityType: "county", personalPropertyRate: 3.57, realEstateNominalRate: 0.81, machineryToolsRate: 3.57 },
  "harrisonburg-city-va": { localityName: "Harrisonburg City", localityType: "city", personalPropertyRate: 3.45, realEstateNominalRate: 1.01, machineryToolsRate: 2.12 },
  "henrico-county-va": { localityName: "Henrico County", localityType: "county", personalPropertyRate: 3.35, realEstateNominalRate: 0.83, machineryToolsRate: 0.3 },
  "henry-county-va": { localityName: "Henry County", localityType: "county", personalPropertyRate: 1.55, realEstateNominalRate: 0.555, machineryToolsRate: 1.55 },
  "highland-county-va": { localityName: "Highland County", localityType: "county", personalPropertyRate: 2.75, realEstateNominalRate: 0.51, machineryToolsRate: 1.0 },
  "isle-of-wight-county-va": { localityName: "Isle of Wight County", localityType: "county", personalPropertyRate: 4.5, realEstateNominalRate: 0.73, machineryToolsRate: 1.95 },
  "james-city-county-va": { localityName: "James City County", localityType: "county", personalPropertyRate: 4.0, realEstateNominalRate: 0.83, machineryToolsRate: 4.0 },
  "king-and-queen-county-va": { localityName: "King and Queen County", localityType: "county", personalPropertyRate: 3.94, realEstateNominalRate: 0.52, machineryToolsRate: 1.1 },
  "king-george-county-va": { localityName: "King George County", localityType: "county", personalPropertyRate: 3.25, realEstateNominalRate: 0.68, machineryToolsRate: 2.5 },
  "king-william-county-va": { localityName: "King William County", localityType: "county", personalPropertyRate: 3.65, realEstateNominalRate: 0.615, machineryToolsRate: 2.25 },
  "lancaster-county-va": { localityName: "Lancaster County", localityType: "county", personalPropertyRate: 2.04, realEstateNominalRate: 0.55, machineryToolsRate: 1.52 },
  "lee-county-va": { localityName: "Lee County", localityType: "county", personalPropertyRate: 1.95, realEstateNominalRate: 0.74, machineryToolsRate: 2.0 },
  "loudoun-county-va": { localityName: "Loudoun County", localityType: "county", personalPropertyRate: 4.15, realEstateNominalRate: 0.805, machineryToolsRate: 2.75 },
  "louisa-county-va": { localityName: "Louisa County", localityType: "county", personalPropertyRate: 2.43, realEstateNominalRate: 0.72, machineryToolsRate: 1.9 },
  "lunenburg-county-va": { localityName: "Lunenburg County", localityType: "county", personalPropertyRate: 3.8, realEstateNominalRate: 0.33, machineryToolsRate: 1.8 },
  "lynchburg-city-va": { localityName: "Lynchburg City", localityType: "city", personalPropertyRate: 3.8, realEstateNominalRate: 0.89, machineryToolsRate: 3.0 },
  "madison-county-va": { localityName: "Madison County", localityType: "county", personalPropertyRate: 3.1, realEstateNominalRate: 0.51, machineryToolsRate: 1.67 },
  "manassas-city-va": { localityName: "Manassas City", localityType: "city", personalPropertyRate: 3.6, realEstateNominalRate: 1.07, machineryToolsRate: 2.1 },
  "mathews-county-va": { localityName: "Mathews County", localityType: "county", personalPropertyRate: 3.7, realEstateNominalRate: 0.6, machineryToolsRate: 0.0 },
  "mecklenburg-county-va": { localityName: "Mecklenburg County", localityType: "county", personalPropertyRate: 3.36, realEstateNominalRate: 0.36, machineryToolsRate: 0.66 },
  "middlesex-county-va": { localityName: "Middlesex County", localityType: "county", personalPropertyRate: 2.6, realEstateNominalRate: 0.61, machineryToolsRate: 0.0 },
  "montgomery-county-va": { localityName: "Montgomery County", localityType: "county", personalPropertyRate: 2.55, realEstateNominalRate: 0.76, machineryToolsRate: 1.82 },
  "nelson-county-va": { localityName: "Nelson County", localityType: "county", personalPropertyRate: 2.79, realEstateNominalRate: 0.65, machineryToolsRate: 1.25 },
  "new-kent-county-va": { localityName: "New Kent County", localityType: "county", personalPropertyRate: 3.75, realEstateNominalRate: 0.6, machineryToolsRate: 0.75 },
  "newport-news-city-va": { localityName: "Newport News City", localityType: "city", personalPropertyRate: 4.5, realEstateNominalRate: 1.18, machineryToolsRate: 3.75 },
  "norfolk-city-va": { localityName: "Norfolk City", localityType: "city", personalPropertyRate: 4.33, realEstateNominalRate: 1.23, machineryToolsRate: 4.25 },
  "northampton-county-va": { localityName: "Northampton County", localityType: "county", personalPropertyRate: 3.9, realEstateNominalRate: 0.705, machineryToolsRate: 2.0 },
  "northumberland-county-va": { localityName: "Northumberland County", localityType: "county", personalPropertyRate: 3.6, realEstateNominalRate: 0.74, machineryToolsRate: 3.6 },
  "nottoway-county-va": { localityName: "Nottoway County", localityType: "county", personalPropertyRate: 4.12, realEstateNominalRate: 0.48, machineryToolsRate: 1.35 },
  "orange-county-va": { localityName: "Orange County", localityType: "county", personalPropertyRate: 3.6, realEstateNominalRate: 0.62, machineryToolsRate: 1.83 },
  "page-county-va": { localityName: "Page County", localityType: "county", personalPropertyRate: 4.3, realEstateNominalRate: 0.73, machineryToolsRate: 1.5 },
  "patrick-county-va": { localityName: "Patrick County", localityType: "county", personalPropertyRate: 1.71, realEstateNominalRate: 0.73, machineryToolsRate: 1.71 },
  "pittsylvania-county-va": { localityName: "Pittsylvania County", localityType: "county", personalPropertyRate: 9.0, realEstateNominalRate: 0.56, machineryToolsRate: 4.5 },
  "prince-edward-county-va": { localityName: "Prince Edward County", localityType: "county", personalPropertyRate: 4.5, realEstateNominalRate: 0.39, machineryToolsRate: 4.2 },
  "prince-george-county-va": { localityName: "Prince George County", localityType: "county", personalPropertyRate: 3.9, realEstateNominalRate: 0.82, machineryToolsRate: 1.5 },
  "prince-william-county-va": { localityName: "Prince William County", localityType: "county", personalPropertyRate: 4.15, realEstateNominalRate: 0.906, machineryToolsRate: 2.0 },
  "pulaski-county-va": { localityName: "Pulaski County", localityType: "county", personalPropertyRate: 2.35, realEstateNominalRate: 0.74, machineryToolsRate: 1.5 },
  "rappahannock-county-va": { localityName: "Rappahannock County", localityType: "county", personalPropertyRate: 3.8, realEstateNominalRate: 0.63, machineryToolsRate: 0.0 },
  "richmond-city-va": { localityName: "Richmond City", localityType: "city", personalPropertyRate: 3.7, realEstateNominalRate: 1.2, machineryToolsRate: 2.3 },
  "richmond-county-va": { localityName: "Richmond County", localityType: "county", personalPropertyRate: 3.5, realEstateNominalRate: 0.6, machineryToolsRate: 0.4 },
  "roanoke-city-va": { localityName: "Roanoke City", localityType: "city", personalPropertyRate: 3.45, realEstateNominalRate: 1.22, machineryToolsRate: 3.45 },
  "roanoke-county-va": { localityName: "Roanoke County", localityType: "county", personalPropertyRate: 3.4, realEstateNominalRate: 1.03, machineryToolsRate: 2.8 },
  "rockbridge-county-va": { localityName: "Rockbridge County", localityType: "county", personalPropertyRate: 4.25, realEstateNominalRate: 0.64, machineryToolsRate: 2.55 },
  "rockingham-county-va": { localityName: "Rockingham County", localityType: "county", personalPropertyRate: 3.0, realEstateNominalRate: 0.68, machineryToolsRate: 2.55 },
  "russell-county-va": { localityName: "Russell County", localityType: "county", personalPropertyRate: 1.95, realEstateNominalRate: 0.579, machineryToolsRate: 1.95 },
  "salem-city-va": { localityName: "Salem City", localityType: "city", personalPropertyRate: 3.4, realEstateNominalRate: 1.18, machineryToolsRate: 3.2 },
  "scott-county-va": { localityName: "Scott County", localityType: "county", personalPropertyRate: 1.65, realEstateNominalRate: 0.77, machineryToolsRate: 1.15 },
  "shenandoah-county-va": { localityName: "Shenandoah County", localityType: "county", personalPropertyRate: 4.11, realEstateNominalRate: 0.64, machineryToolsRate: 3.15 },
  "smyth-county-va": { localityName: "Smyth County", localityType: "county", personalPropertyRate: 2.3, realEstateNominalRate: 0.59, machineryToolsRate: 1.55 },
  "southampton-county-va": { localityName: "Southampton County", localityType: "county", personalPropertyRate: 5.0, realEstateNominalRate: 0.71, machineryToolsRate: 2.4 },
  "spotsylvania-county-va": { localityName: "Spotsylvania County", localityType: "county", personalPropertyRate: 5.37, realEstateNominalRate: 0.734, machineryToolsRate: 1.9 },
  "stafford-county-va": { localityName: "Stafford County", localityType: "county", personalPropertyRate: 5.72, realEstateNominalRate: 0.924, machineryToolsRate: 0.0 },
  "staunton-city-va": { localityName: "Staunton City", localityType: "city", personalPropertyRate: 2.9, realEstateNominalRate: 0.91, machineryToolsRate: 1.24 },
  "suffolk-city-va": { localityName: "Suffolk City", localityType: "city", personalPropertyRate: 4.25, realEstateNominalRate: 1.07, machineryToolsRate: 3.15 },
  "surry-county-va": { localityName: "Surry County", localityType: "county", personalPropertyRate: 3.75, realEstateNominalRate: 0.71, machineryToolsRate: 1.0 },
  "sussex-county-va": { localityName: "Sussex County", localityType: "county", personalPropertyRate: 4.85, realEstateNominalRate: 0.53, machineryToolsRate: 2.43 },
  "tazewell-county-va": { localityName: "Tazewell County", localityType: "county", personalPropertyRate: 2.0, realEstateNominalRate: 0.58, machineryToolsRate: 2.0 },
  "virginia-beach-va": { localityName: "Virginia Beach", localityType: "city", personalPropertyRate: 4.0, realEstateNominalRate: 0.97, machineryToolsRate: 0.0 },
  "warren-county-va": { localityName: "Warren County", localityType: "county", personalPropertyRate: 4.28, realEstateNominalRate: 0.479, machineryToolsRate: 2.17 },
  "washington-county-va": { localityName: "Washington County", localityType: "county", personalPropertyRate: 1.7, realEstateNominalRate: 0.43, machineryToolsRate: 1.55 },
  "waynesboro-city-va": { localityName: "Waynesboro City", localityType: "city", personalPropertyRate: 3.25, realEstateNominalRate: 0.82, machineryToolsRate: 3.25 },
  "westmoreland-county-va": { localityName: "Westmoreland County", localityType: "county", personalPropertyRate: 3.75, realEstateNominalRate: 0.68, machineryToolsRate: 1.0 },
  "williamsburg-city-va": { localityName: "Williamsburg City", localityType: "city", personalPropertyRate: 3.5, realEstateNominalRate: 0.62, machineryToolsRate: 3.5 },
  "winchester-city-va": { localityName: "Winchester City", localityType: "city", personalPropertyRate: 4.8, realEstateNominalRate: 0.795, machineryToolsRate: 1.3 },
  "wise-county-va": { localityName: "Wise County", localityType: "county", personalPropertyRate: 1.65, realEstateNominalRate: 0.69, machineryToolsRate: 1.41 },
  "wythe-county-va": { localityName: "Wythe County", localityType: "county", personalPropertyRate: 2.22, realEstateNominalRate: 0.51, machineryToolsRate: 1.5 },
};

/** Look up a locality's Virginia vehicle (tangible personal property) tax record. Null if not published. */
export function getVaVehicleTax(slug: string): VaVehicleTaxRecord | null {
  return VA_VEHICLE_TAX_RATES[slug] ?? null;
}

/** True when the slug is a Virginia locality we carry a published vehicle rate for. */
export function hasVaVehicleTax(slug: string): boolean {
  return slug in VA_VEHICLE_TAX_RATES;
}
