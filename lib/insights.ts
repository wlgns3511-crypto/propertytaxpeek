interface Insight {
  text: string;
  sentiment?: "positive" | "negative" | "neutral";
}

interface CountyData {
  county_name: string;
  state: string;
  effective_rate: number;
  median_tax: number;
  median_home_value: number;
  population: number;
}

interface StateData {
  state: string;
  effective_rate: number;
  median_tax: number;
  median_home_value: number;
}

interface NationalData {
  avg_rate: number;
  avg_median_tax: number;
  avg_home_value: number;
}

/**
 * Generate property tax insights for a county.
 */
export function getCountyInsights(
  county: CountyData,
  stateData: StateData | null,
  national: NationalData,
): Insight[] {
  const insights: Insight[] = [];

  // 1. Rate vs national average
  const diffNat = county.effective_rate - national.avg_rate;
  insights.push({
    text: `${county.county_name}'s effective property tax rate of ${county.effective_rate.toFixed(2)}% is ${Math.abs(diffNat).toFixed(2)} percentage points ${diffNat >= 0 ? "above" : "below"} the national average of ${national.avg_rate.toFixed(2)}%. ${diffNat > 0.5 ? "This is a high-tax county — factor it heavily into any home purchase decision." : diffNat < -0.5 ? "Property taxes here are notably lower than most of the US." : "This is near the national midpoint."}`,
    sentiment: diffNat > 0.3 ? "negative" : diffNat < -0.3 ? "positive" : "neutral",
  });

  // 2. Monthly cost equivalent
  const monthly = Math.round(county.median_tax / 12);
  insights.push({
    text: `The median annual property tax of $${county.median_tax.toLocaleString()} works out to about $${monthly.toLocaleString()}/month. On a typical mortgage, this gets rolled into your escrow payment alongside principal, interest, and insurance.`,
    sentiment: monthly > 500 ? "negative" : monthly < 200 ? "positive" : "neutral",
  });

  // 3. Rate vs state average
  if (stateData) {
    const diffState = county.effective_rate - stateData.effective_rate;
    insights.push({
      text: `Compared to the ${stateData.state} state average of ${stateData.effective_rate.toFixed(2)}%, ${county.county_name} is ${Math.abs(diffState).toFixed(2)} points ${diffState >= 0 ? "higher" : "lower"}. ${Math.abs(diffState) > 0.3 ? "Shopping across county lines within the same state could meaningfully change your tax bill." : "County-level variation within the state is modest."}`,
      sentiment: diffState > 0.2 ? "negative" : diffState < -0.2 ? "positive" : "neutral",
    });
  }

  // 4. Tax on hypothetical $400K home
  const hypotheticalHome = 400000;
  const annualOn400K = Math.round(hypotheticalHome * (county.effective_rate / 100));
  const decadeCost = annualOn400K * 10;
  insights.push({
    text: `On a $400,000 home, the annual property tax would be approximately $${annualOn400K.toLocaleString()} ($${Math.round(annualOn400K / 12).toLocaleString()}/mo). Over 10 years, that totals $${decadeCost.toLocaleString()} — a figure worth comparing against the SALT deduction cap of $10,000/yr.`,
    sentiment: annualOn400K > 6000 ? "negative" : annualOn400K < 3000 ? "positive" : "neutral",
  });

  // 5. Home value context
  const priceToTax = (county.median_tax / county.median_home_value * 100).toFixed(2);
  insights.push({
    text: `The median home in ${county.county_name} is valued at $${county.median_home_value.toLocaleString()}. At the current rate, taxes consume ${priceToTax}% of the home's value each year — ${Number(priceToTax) > 1.5 ? "a significant drag on home equity growth" : "a manageable annual carrying cost"}.`,
    sentiment: Number(priceToTax) > 1.5 ? "negative" : Number(priceToTax) < 0.8 ? "positive" : "neutral",
  });

  return insights;
}
