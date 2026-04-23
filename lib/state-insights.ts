import type { State } from './db';

const NEIGHBORS: Record<string, string[]> = {
  AL: ['FL', 'GA', 'MS', 'TN'], AK: [], AZ: ['CA', 'CO', 'NV', 'NM', 'UT'],
  AR: ['LA', 'MO', 'MS', 'OK', 'TN', 'TX'], CA: ['AZ', 'NV', 'OR'],
  CO: ['AZ', 'KS', 'NE', 'NM', 'OK', 'UT', 'WY'], CT: ['MA', 'NY', 'RI'],
  DE: ['MD', 'NJ', 'PA'], FL: ['AL', 'GA'], GA: ['AL', 'FL', 'NC', 'SC', 'TN'],
  HI: [], ID: ['MT', 'NV', 'OR', 'UT', 'WA', 'WY'],
  IL: ['IA', 'IN', 'KY', 'MO', 'WI'], IN: ['IL', 'KY', 'MI', 'OH'],
  IA: ['IL', 'MN', 'MO', 'NE', 'SD', 'WI'], KS: ['CO', 'MO', 'NE', 'OK'],
  KY: ['IL', 'IN', 'MO', 'OH', 'TN', 'VA', 'WV'], LA: ['AR', 'MS', 'TX'],
  ME: ['NH'], MD: ['DE', 'PA', 'VA', 'WV'], MA: ['CT', 'NH', 'NY', 'RI', 'VT'],
  MI: ['IN', 'OH', 'WI'], MN: ['IA', 'ND', 'SD', 'WI'],
  MS: ['AL', 'AR', 'LA', 'TN'], MO: ['AR', 'IL', 'IA', 'KS', 'KY', 'NE', 'OK', 'TN'],
  MT: ['ID', 'ND', 'SD', 'WY'], NE: ['CO', 'IA', 'KS', 'MO', 'SD', 'WY'],
  NV: ['AZ', 'CA', 'ID', 'OR', 'UT'], NH: ['ME', 'MA', 'VT'],
  NJ: ['DE', 'NY', 'PA'], NM: ['AZ', 'CO', 'OK', 'TX', 'UT'],
  NY: ['CT', 'MA', 'NJ', 'PA', 'VT'], NC: ['GA', 'SC', 'TN', 'VA'],
  ND: ['MN', 'MT', 'SD'], OH: ['IN', 'KY', 'MI', 'PA', 'WV'],
  OK: ['AR', 'CO', 'KS', 'MO', 'NM', 'TX'], OR: ['CA', 'ID', 'NV', 'WA'],
  PA: ['DE', 'MD', 'NJ', 'NY', 'OH', 'WV'], RI: ['CT', 'MA'],
  SC: ['GA', 'NC'], SD: ['IA', 'MN', 'MT', 'ND', 'NE', 'WY'],
  TN: ['AL', 'AR', 'GA', 'KY', 'MO', 'MS', 'NC', 'VA'],
  TX: ['AR', 'LA', 'NM', 'OK'], UT: ['AZ', 'CO', 'ID', 'NV', 'NM', 'WY'],
  VT: ['MA', 'NH', 'NY'], VA: ['KY', 'MD', 'NC', 'TN', 'WV'],
  WA: ['ID', 'OR'], WV: ['KY', 'MD', 'OH', 'PA', 'VA'],
  WI: ['IA', 'IL', 'MI', 'MN'], WY: ['CO', 'ID', 'MT', 'NE', 'SD', 'UT'],
};

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export function generateStateInsights(state: State, allStates: State[]): string[] {
  const insights: string[] = [];
  const sorted = [...allStates].sort((a, b) => b.effective_rate - a.effective_rate);
  const rank = sorted.findIndex(s => s.slug === state.slug) + 1;
  const total = sorted.length;

  const avgRate = allStates.reduce((s, st) => s + st.effective_rate, 0) / allStates.length;
  const avgTax = allStates.reduce((s, st) => s + st.median_tax, 0) / allStates.length;
  const avgHome = allStates.reduce((s, st) => s + st.median_home_value, 0) / allStates.length;

  // 1. Rank insight
  const pctile = Math.round((1 - rank / total) * 100);
  if (rank <= 5) {
    insights.push(`${state.state} ranks #${rank} out of ${total} states for the highest effective property tax rate at ${state.effective_rate.toFixed(2)}%, placing it among the top 5 most heavily taxed states.`);
  } else if (rank > total - 5) {
    insights.push(`${state.state} ranks #${rank} out of ${total} states by effective property tax rate (${state.effective_rate.toFixed(2)}%), making it one of the lowest-taxed states for homeowners.`);
  } else {
    insights.push(`${state.state} ranks #${rank} out of ${total} states by effective property tax rate at ${state.effective_rate.toFixed(2)}%, placing it in the ${pctile >= 60 ? 'upper' : pctile >= 40 ? 'middle' : 'lower'} tier nationally.`);
  }

  // 2. National average comparison
  const diffPct = ((state.effective_rate - avgRate) / avgRate) * 100;
  if (Math.abs(diffPct) > 3) {
    insights.push(`At ${state.effective_rate.toFixed(2)}%, ${state.state}'s effective rate is ${Math.abs(diffPct).toFixed(0)}% ${diffPct > 0 ? 'above' : 'below'} the national average of ${avgRate.toFixed(2)}%.`);
  } else {
    insights.push(`${state.state}'s effective rate of ${state.effective_rate.toFixed(2)}% is nearly identical to the national average of ${avgRate.toFixed(2)}%.`);
  }

  // 3. Dollar impact
  const monthly = Math.round(state.median_tax / 12);
  insights.push(`For a median-priced home of ${fmt(state.median_home_value)}, ${state.state} homeowners pay approximately ${fmt(state.median_tax)} annually in property taxes — roughly ${fmt(monthly)} per month added to housing costs.`);

  // 4. Neighbor comparison
  const neighborAbbrs = NEIGHBORS[state.abbr] || [];
  const neighborStates = allStates.filter(s => neighborAbbrs.includes(s.abbr));
  if (neighborStates.length > 0) {
    const higher = neighborStates.filter(n => n.effective_rate > state.effective_rate);
    const lower = neighborStates.filter(n => n.effective_rate < state.effective_rate);
    if (higher.length > 0 && lower.length > 0) {
      const highestNeighbor = higher.sort((a, b) => b.effective_rate - a.effective_rate)[0];
      const lowestNeighbor = lower.sort((a, b) => a.effective_rate - b.effective_rate)[0];
      insights.push(`Among neighboring states, ${state.state}'s rate is lower than ${highestNeighbor.state} (${highestNeighbor.effective_rate.toFixed(2)}%) but higher than ${lowestNeighbor.state} (${lowestNeighbor.effective_rate.toFixed(2)}%).`);
    } else if (higher.length > 0) {
      insights.push(`${state.state} has the lowest property tax rate among its neighbors, with all bordering states charging higher rates.`);
    } else if (lower.length > 0) {
      insights.push(`${state.state} has the highest property tax rate among its neighbors, exceeding all bordering states.`);
    }
  }

  // 5. Rate vs home value paradox or dollar burden
  const dollarRank = [...allStates].sort((a, b) => b.median_tax - a.median_tax).findIndex(s => s.slug === state.slug) + 1;
  if (Math.abs(rank - dollarRank) >= 10) {
    if (dollarRank < rank) {
      insights.push(`Despite having a moderate rate, ${state.state}'s high median home values push the actual dollar tax burden to #${dollarRank} nationally — homeowners here pay ${fmt(state.median_tax)} versus the national average of ${fmt(Math.round(avgTax))}.`);
    } else {
      insights.push(`While ${state.state}'s rate appears high, the relatively low median home value of ${fmt(state.median_home_value)} keeps the actual annual bill to ${fmt(state.median_tax)} — well ${state.median_tax < avgTax ? 'below' : 'above'} the ${fmt(Math.round(avgTax))} national average.`);
    }
  } else {
    const homeComp = state.median_home_value > avgHome ? 'above' : 'below';
    insights.push(`${state.state}'s median home value of ${fmt(state.median_home_value)} is ${Math.abs(((state.median_home_value - avgHome) / avgHome) * 100).toFixed(0)}% ${homeComp} the national average of ${fmt(Math.round(avgHome))}, directly impacting the total tax bill.`);
  }

  // 6. Tier classification
  const tierLabel = state.effective_rate >= 1.5 ? 'high' : state.effective_rate >= 0.8 ? 'moderate' : 'low';
  const sameT = sorted.filter(s => {
    const t = s.effective_rate >= 1.5 ? 'high' : s.effective_rate >= 0.8 ? 'moderate' : 'low';
    return t === tierLabel && s.slug !== state.slug;
  });
  const peers = sameT.sort((a, b) => Math.abs(a.effective_rate - state.effective_rate) - Math.abs(b.effective_rate - state.effective_rate)).slice(0, 2);
  if (peers.length >= 2) {
    insights.push(`This places ${state.state} in the "${tierLabel}" property tax tier alongside ${peers[0].state} (${peers[0].effective_rate.toFixed(2)}%) and ${peers[1].state} (${peers[1].effective_rate.toFixed(2)}%).`);
  }

  return insights;
}
