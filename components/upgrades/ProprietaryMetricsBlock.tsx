import { JSX } from "react";

interface ProprietaryMetricsBlockProps {
  rateScore: number;
  burdenScore: number;
  appealScore: number;
  overallGrade: string;
  commentary: string;
}

function getRateLevel(score: number): { label: string; color: string; ringColor: string; bg: string } {
  if (score >= 75) {
    return { label: "High property tax rate", color: "text-red-700", ringColor: "stroke-red-500", bg: "bg-red-50" };
  }
  if (score >= 45) {
    return { label: "Moderate property tax rate", color: "text-slate-600", ringColor: "stroke-slate-400", bg: "bg-slate-50" };
  }
  return { label: "Low property tax rate", color: "text-green-700", ringColor: "stroke-green-500", bg: "bg-green-50" };
}

function getBurdenLevel(score: number): { label: string; color: string; ringColor: string; bg: string } {
  if (score >= 70) {
    return { label: "High income-tax burden", color: "text-red-700", ringColor: "stroke-red-500", bg: "bg-red-50" };
  }
  if (score >= 40) {
    return { label: "Moderate income-tax burden", color: "text-slate-600", ringColor: "stroke-slate-400", bg: "bg-slate-50" };
  }
  return { label: "Low income-tax burden", color: "text-green-700", ringColor: "stroke-green-500", bg: "bg-green-50" };
}

function getAppealLevel(score: number): { label: string; color: string; ringColor: string; bg: string } {
  if (score >= 65) {
    return { label: "Favorable appeal outlook", color: "text-indigo-700", ringColor: "stroke-indigo-500", bg: "bg-indigo-50" };
  }
  if (score >= 40) {
    return { label: "Average appeal complexity", color: "text-slate-600", ringColor: "stroke-slate-400", bg: "bg-slate-50" };
  }
  return { label: "Unfavorable appeal outlook", color: "text-orange-700", ringColor: "stroke-orange-500", bg: "bg-orange-50" };
}

function getGradeStyles(grade: string): { badge: string; border: string; bg: string } {
  const cleanGrade = grade.charAt(0);
  switch (cleanGrade) {
    case "A":
      return { badge: "text-indigo-800 bg-indigo-100", border: "border-indigo-200", bg: "bg-indigo-50/30" };
    case "B":
      return { badge: "text-emerald-800 bg-emerald-100", border: "border-emerald-200", bg: "bg-emerald-50/30" };
    case "C":
      return { badge: "text-slate-700 bg-slate-100", border: "border-slate-200", bg: "bg-slate-50/20" };
    case "D":
    case "F":
    default:
      return { badge: "text-rose-800 bg-rose-100", border: "border-rose-200", bg: "bg-rose-50/30" };
  }
}

export function ProprietaryMetricsBlock({
  rateScore,
  burdenScore,
  appealScore,
  overallGrade,
  commentary,
}: ProprietaryMetricsBlockProps): JSX.Element {
  const rate = getRateLevel(rateScore);
  const burden = getBurdenLevel(burdenScore);
  const appeal = getAppealLevel(appealScore);
  const gradeStyles = getGradeStyles(overallGrade);

  // SVG Circle parameters for progress gauge
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const rateDashoffset = circumference - (rateScore / 100) * circumference;
  const burdenDashoffset = circumference - (burdenScore / 100) * circumference;
  const appealDashoffset = circumference - (appealScore / 100) * circumference;

  return (
    <section
      data-upgrade="proprietary-metrics"
      aria-label="PropertyTaxPeek Affordability and Appeal Ratings"
      className="not-prose my-8 rounded-xl border border-indigo-100 bg-white p-5 shadow-sm"
    >
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider font-sans">
        <svg
          aria-hidden="true"
          className="h-4.5 w-4.5 text-indigo-600"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.746 3.746 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
          />
        </svg>
        Property Tax Compliance & Burden Index
      </h3>

      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Metric Gauges Row */}
        <div className="flex flex-row items-center gap-6 flex-shrink-0">
          {/* Rate Risk Ring */}
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
                {/* Background Ring */}
                <circle
                  className="text-slate-100"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  r={radius}
                  cx="48"
                  cy="48"
                />
                {/* Active Ring */}
                <circle
                  className={`${rate.ringColor} transition-all duration-500`}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={rateDashoffset}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r={radius}
                  cx="48"
                  cy="48"
                />
              </svg>
              {/* Score Text */}
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-800">{rateScore}</span>
                <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider text-center max-w-[50px] leading-tight font-sans">Effective Rate</span>
              </div>
            </div>
            <span className={`text-xs font-bold mt-2 ${rate.color} font-sans`}>{rate.label}</span>
          </div>

          {/* Burden Ring */}
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
                {/* Background Ring */}
                <circle
                  className="text-slate-100"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  r={radius}
                  cx="48"
                  cy="48"
                />
                {/* Active Ring */}
                <circle
                  className={`${burden.ringColor} transition-all duration-500`}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={burdenDashoffset}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r={radius}
                  cx="48"
                  cy="48"
                />
              </svg>
              {/* Score Text */}
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-800">{burdenScore}</span>
                <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider text-center max-w-[50px] leading-tight font-sans">Income Burden</span>
              </div>
            </div>
            <span className={`text-xs font-bold mt-2 ${burden.color} font-sans`}>{burden.label}</span>
          </div>

          {/* Appeal Ring */}
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
                {/* Background Ring */}
                <circle
                  className="text-slate-100"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  r={radius}
                  cx="48"
                  cy="48"
                />
                {/* Active Ring */}
                <circle
                  className={`${appeal.ringColor} transition-all duration-500`}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={appealDashoffset}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r={radius}
                  cx="48"
                  cy="48"
                />
              </svg>
              {/* Score Text */}
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-800">{appealScore}</span>
                <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider text-center max-w-[50px] leading-tight font-sans">Appeal Index</span>
              </div>
            </div>
            <span className={`text-xs font-bold mt-2 ${appeal.color} font-sans`}>{appeal.label}</span>
          </div>
        </div>

        {/* Grade Badge and Commentary Section */}
        <div className="flex-1 flex flex-col sm:flex-row items-center sm:items-start gap-4 border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-6 w-full">
          {/* Grade Badge Card */}
          <div className={`flex flex-col items-center justify-center border ${gradeStyles.border} ${gradeStyles.bg} rounded-xl px-5 py-4 w-28 text-center flex-shrink-0`}>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1 font-sans">Affordability</span>
            <span className="text-4xl font-extrabold text-slate-800 tracking-tight leading-none my-1 font-sans">{overallGrade}</span>
            <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mt-2 ${gradeStyles.badge} font-sans`}>
              Calibrated
            </span>
          </div>

          {/* Expert Dynamic Commentary */}
          <div className="flex-1 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1 font-sans">Affordability Analysis</span>
            <p className="text-xs text-slate-600 leading-relaxed font-normal font-sans">
              {commentary}
            </p>
            <div className="flex items-center gap-1 mt-3">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span className="text-[9px] text-slate-400 font-medium font-sans">Affordability Indices Calibrated</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
