import {
  getCountiesByState,
  getHighestTaxStates,
  getLowestTaxStates,
  getNationalAverage,
  getStateBySlug,
  type State,
} from '@/lib/db';

interface Props {
  slug: string;
  state?: State;
}

function fmtCurrency(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export function StateRich({ slug, state: initialState }: Props) {
  const state = initialState ?? getStateBySlug(slug);
  if (!state) return null;

  const counties = getCountiesByState(state.abbr)
    .sort((left, right) => right.effective_rate - left.effective_rate)
    .slice(0, 5);
  const national = getNationalAverage();
  const highestStates = getHighestTaxStates(5);
  const lowestStates = getLowestTaxStates(5);
  const highState = highestStates.some((row) => row.slug === state.slug);
  const lowState = lowestStates.some((row) => row.slug === state.slug);

  return (
    <section className="mt-10 rounded-xl border border-stone-200 bg-white p-6">
      <h2 className="text-2xl font-bold text-stone-900">State Tax Context</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
        {state.state} sits at {state.effective_rate.toFixed(2)}% effective tax versus a national average of{' '}
        {national.avg_rate.toFixed(2)}%. That statewide figure matters, but homeowners usually feel property tax through
        county-level dispersion, not just the state average.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-stone-200 p-4">
          <h3 className="text-sm font-semibold text-stone-900">Highest-Tax Counties</h3>
          <div className="mt-4 space-y-3">
            {counties.map((county) => (
              <div key={county.slug} className="rounded-lg bg-stone-50 p-3">
                <div className="font-medium text-stone-900">{county.county_name}</div>
                <div className="text-xs text-stone-500">
                  {county.effective_rate.toFixed(2)}% effective • {fmtCurrency(county.median_tax)} median tax
                </div>
                <div className="mt-1 text-xs text-stone-500">
                  {fmtCurrency(county.median_home_value)} median home • {county.population.toLocaleString()} population
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-stone-200 p-4">
          <h3 className="text-sm font-semibold text-stone-900">Where The State Sits</h3>
          <div className="mt-4 space-y-3">
            <div className="rounded-lg bg-stone-50 p-3">
              <div className="font-medium text-stone-900">Median tax bill</div>
              <div className="text-xs text-stone-500">{fmtCurrency(state.median_tax)} on a {fmtCurrency(state.median_home_value)} home</div>
            </div>
            <div className="rounded-lg bg-stone-50 p-3">
              <div className="font-medium text-stone-900">National positioning</div>
              <div className="text-xs text-stone-500">
                {highState
                  ? 'This state sits in the highest-tax cohort on this site.'
                  : lowState
                    ? 'This state sits in the lowest-tax cohort on this site.'
                    : 'This state falls between the highest- and lowest-tax state cohorts.'}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-stone-200 p-4">
          <h3 className="text-sm font-semibold text-stone-900">Edge States To Compare</h3>
          <div className="mt-4 space-y-3">
            {[...highestStates.slice(0, 2), ...lowestStates.slice(0, 2)].map((peer) => (
              <div key={peer.slug} className="rounded-lg bg-stone-50 p-3">
                <div className="font-medium text-stone-900">{peer.state}</div>
                <div className="text-xs text-stone-500">
                  {peer.effective_rate.toFixed(2)}% effective • {fmtCurrency(peer.median_tax)} median tax
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
