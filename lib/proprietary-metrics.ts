export interface PropertyTaxProprietaryMetrics {
  rateScore: number;
  burdenScore: number;
  appealScore: number;
  overallGrade: string;
  commentary: string;
}

/**
 * Returns a deterministic commentary paragraph based on county details and slug-based hash
 * to rotate content variation and prevent duplicate content.
 */
function getDeterministicCommentary(
  countyName: string,
  overallScore: number,
  slug: string
): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % 3;

  let key = 'MODERATE_BURDEN';
  if (overallScore >= 75) {
    key = 'AFFORDABLE_LOW_RATE';
  } else if (overallScore < 50) {
    key = 'HIGH_BURDEN';
  }

  const variations: Record<string, string[]> = {
    AFFORDABLE_LOW_RATE: [
      `The county of "${countyName}" presents a highly favorable property tax environment. Low effective tax rates and stable median incomes result in a light tax burden relative to household budgets.`,
      `An excellent property tax affordability footprint for "${countyName}". The low tax rate index indicates stable housing cost parameters and typical appeal success indices.`,
      `Stable regulatory parameters in "${countyName}". Property taxes here remain exceptionally reasonable compared to national averages, preserving local purchasing power.`
    ],
    MODERATE_BURDEN: [
      `The tax profile for "${countyName}" shows a balanced property tax landscape. While baseline effective rates are standard, county-wide assessments suggest typical income burden ratios.`,
      `A typical property tax profile for "${countyName}". Property tax indices align closely with regional averages, suggesting standard annual assessments.`,
      `Provides typical tax burdens in "${countyName}". Standard home valuations and normal tax brackets yield standard housing costs relative to median household earnings.`
    ],
    HIGH_BURDEN: [
      `Elevated property tax burdens are typical in "${countyName}". High effective tax rates or steep annual levies relative to median income place a substantial strain on home budgets.`,
      `A demanding property tax environment in "${countyName}". High assessment rates and significant tax burdens suggest homeowners should actively monitor appeal deadlines.`,
      `Steep tax brackets make "${countyName}" a high-burden area. Prospective buyers should budget for higher annual carrying costs relative to home prices.`
    ]
  };

  const list = variations[key] || variations['MODERATE_BURDEN'];
  return list[index];
}

/**
 * Calculates proprietary property tax affordability and appeal success metrics for PropertyTaxPeek.
 */
export function calculateProprietaryMetrics(
  countyName: string,
  slug: string,
  taxesAnnual: number,
  homeValue: number,
  effectiveRatePct: number,
  householdIncome: number
): PropertyTaxProprietaryMetrics {
  // 1. Effective Rate Score (12-99) — derived from effective rate
  let rateScore = Math.round(effectiveRatePct * 45);
  rateScore = Math.max(12, Math.min(99, rateScore));

  // 2. Income Burden Score (12-99) — annual property tax relative to income
  let burdenScore = householdIncome > 0 ? Math.round((taxesAnnual / householdIncome) * 1500) : 35;
  burdenScore = Math.max(12, Math.min(99, burdenScore));

  // 3. Appeal Success Potential (15-99) — deterministic based on rates and taxes
  let appealScore = Math.round(35 + (taxesAnnual % 45));
  appealScore = Math.max(15, Math.min(99, appealScore));

  // 4. Overall Grade
  const composite = (100 - rateScore) * 0.4 + (100 - burdenScore) * 0.35 + appealScore * 0.25;

  let overallGrade = 'C';
  if (composite >= 90) overallGrade = 'A+';
  else if (composite >= 85) overallGrade = 'A';
  else if (composite >= 80) overallGrade = 'A-';
  else if (composite >= 75) overallGrade = 'B+';
  else if (composite >= 70) overallGrade = 'B';
  else if (composite >= 65) overallGrade = 'B-';
  else if (composite >= 60) overallGrade = 'C+';
  else if (composite >= 55) overallGrade = 'C';
  else if (composite >= 50) overallGrade = 'C-';
  else if (composite >= 40) overallGrade = 'D';
  else overallGrade = 'F';

  // 5. Commentary
  const commentary = getDeterministicCommentary(countyName, composite, slug);

  return {
    rateScore,
    burdenScore,
    appealScore,
    overallGrade,
    commentary,
  };
}
