/**
 * Phase 7 P5 — County-level cross-walk bridge.
 *
 * Renders 4 sibling-portfolio links keyed on the SAME county slug that
 * propertytaxpeek uses, so a homeowner who reads the property-tax verdict
 * can pivot to the adjacent county-level reads (rent / safety / flood /
 * school) without re-typing the place name.
 *
 * Mitigates Trap T-P5-1 (link-uniform): each link uses a distinct anchor
 * phrase tied to the destination's specialty, not the destination's name.
 * Mitigates Trap T-P5-2 (link-404): destination sites use the same
 * county-name-state slug format and gracefully fall back to a county
 * listing when their own coverage doesn't include the entity.
 *
 * rel="external" signals to crawlers that the join is editorial cross-walk,
 * not a recommendation or affiliate ad. nofollow is intentionally omitted —
 * these are first-party portfolio joins, not paid links.
 */

type CountyCrossWalkBridgeProps = {
  countySlug: string;
  countyName: string;
  state: string;
};

const SIBLING_SITES = [
  {
    site: "fairrentwize.com",
    anchor: (county: string, state: string) =>
      `Rent affordability in ${county}, ${state}`,
    blurb: "Median rent ÷ household income burden band",
  },
  {
    site: "safecitypeek.com",
    anchor: (county: string, state: string) =>
      `Crime mix profile for ${county}, ${state}`,
    blurb: "Violent vs property crime composition tier",
  },
  {
    site: "floodriskpeek.com",
    anchor: (county: string, state: string) =>
      `Flood risk exposure in ${county}, ${state}`,
    blurb: "FEMA NFHL × NOAA SLR composed-risk band",
  },
  {
    site: "myschoolpeek.com",
    anchor: (county: string, state: string) =>
      `School equity outlook for ${county}, ${state}`,
    blurb: "District funding × outcome quintile",
  },
] as const;

export function CountyCrossWalkBridge({
  countySlug,
  countyName,
  state,
}: CountyCrossWalkBridgeProps) {
  return (
    <section className="mt-12 mb-8 border border-stone-200 bg-stone-50 rounded-xl p-5">
      <h2 className="text-lg font-bold text-stone-900 mb-1">
        Cross-walk: other county-level reads for {countyName}, {state}
      </h2>
      <p className="text-sm text-stone-600 mb-4">
        Property tax is one signal. These sibling reads use the same
        county slug so you can scan adjacent burden axes — rent, safety,
        flood, and school equity — at a glance.
      </p>
      <ul className="space-y-2.5">
        {SIBLING_SITES.map((s) => {
          const href = `https://${s.site}/county/${countySlug}/`;
          return (
            <li key={s.site}>
              <a
                href={href}
                rel="external"
                className="text-amber-800 hover:underline font-medium"
              >
                {s.anchor(countyName, state)}
              </a>
              <span className="text-sm text-stone-500"> — {s.blurb}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default CountyCrossWalkBridge;
