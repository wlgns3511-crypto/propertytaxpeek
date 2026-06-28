"use client";

import { useMemo, useState } from "react";
import { runAppealSimulator, SimulatorOutput } from "@/lib/appeal-simulator";

interface StateOpt {
  abbr: string;
  state: string;
}

interface CountyOpt {
  slug: string;
  county_name: string;
  state: string;
  effective_rate: number;
  median_home_value: number;
}

interface Props {
  states: StateOpt[];
  counties: CountyOpt[];
  defaultStateAbbr?: string;
  defaultCountySlug?: string;
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const fmtSigned = (n: number) => (n >= 0 ? `+${fmt(n)}` : fmt(n));

function tierColor(tier: string | null): { bg: string; text: string; border: string } {
  if (!tier) return { bg: "bg-stone-100", text: "text-stone-700", border: "border-stone-300" };
  if (tier === "StrongChance" || tier === "GoodChance")
    return { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-300" };
  if (tier === "ModerateChance" || tier === "LowChance")
    return { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-300" };
  return { bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-300" };
}

export function AppealSimulator({ states, counties, defaultStateAbbr, defaultCountySlug }: Props) {
  const [stateAbbr, setStateAbbr] = useState<string>(defaultStateAbbr ?? "");
  const [countySlug, setCountySlug] = useState<string>(defaultCountySlug ?? "");
  const [assessedValue, setAssessedValue] = useState<number>(350000);
  const [comp1, setComp1] = useState<string>("");
  const [comp2, setComp2] = useState<string>("");
  const [comp3, setComp3] = useState<string>("");
  const [purchasePrice, setPurchasePrice] = useState<string>("");
  const [yearBuilt, setYearBuilt] = useState<string>("");
  const [sqft, setSqft] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);

  const stateCounties = useMemo(
    () => counties.filter((c) => c.state === stateAbbr).slice(0, 250),
    [counties, stateAbbr],
  );

  const selectedCounty = useMemo(
    () => counties.find((c) => c.slug === countySlug),
    [counties, countySlug],
  );

  const result: SimulatorOutput | null = useMemo(() => {
    if (!submitted || !stateAbbr || !selectedCounty || !assessedValue) return null;
    return runAppealSimulator({
      stateAbbr,
      countySlug: selectedCounty.slug,
      effectiveRatePct: selectedCounty.effective_rate,
      countyMedianHomeValue: selectedCounty.median_home_value,
      assessedValue,
      comps: [Number(comp1), Number(comp2), Number(comp3)].filter((n) => Number.isFinite(n) && n > 0),
      recentPurchasePrice: purchasePrice ? Number(purchasePrice) : null,
      yearBuilt: yearBuilt ? Number(yearBuilt) : null,
      sqft: sqft ? Number(sqft) : null,
    });
  }, [submitted, stateAbbr, selectedCounty, assessedValue, comp1, comp2, comp3, purchasePrice, yearBuilt, sqft]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const colors = result ? tierColor(result.tierResult.tier) : null;

  return (
    <div className="my-8">
      {/* Form */}
      <form
        onSubmit={onSubmit}
        className="bg-stone-50 border-l-4 border-amber-700 border-y border-r border-stone-200 rounded-r-lg p-6 shadow-sm"
      >
        <div className="flex items-baseline gap-3 mb-1">
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-700 text-stone-50 rounded">
            Signature Tool
          </span>
          <span className="text-xs text-stone-500">propertytaxpeek</span>
        </div>
        <h2 className="text-2xl font-bold text-stone-900 mb-1">Appeal Outcome Simulator</h2>
        <p className="text-sm text-stone-600 mb-6">
          Enter your county and assessed value. We&apos;ll flag over-assessment, estimate annual
          savings if you win, and surface the published reduction-rate band for your state.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              State
            </label>
            <select
              value={stateAbbr}
              onChange={(e) => {
                setStateAbbr(e.target.value);
                setCountySlug("");
                setSubmitted(false);
              }}
              required
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-500 outline-none bg-white"
            >
              <option value="">Select state…</option>
              {states.map((s) => (
                <option key={s.abbr} value={s.abbr}>
                  {s.state}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              County
            </label>
            <select
              value={countySlug}
              onChange={(e) => {
                setCountySlug(e.target.value);
                setSubmitted(false);
              }}
              required
              disabled={!stateAbbr}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-500 outline-none bg-white disabled:bg-stone-100"
            >
              <option value="">
                {stateAbbr ? "Select county…" : "Pick a state first"}
              </option>
              {stateCounties.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.county_name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Your Assessed Value (from your assessment notice)
            </label>
            <input
              type="number"
              value={assessedValue}
              onChange={(e) => {
                setAssessedValue(Number(e.target.value));
                setSubmitted(false);
              }}
              required
              min={0}
              step={1000}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-500 outline-none"
            />
          </div>
        </div>

        <details className="mb-4 group">
          <summary className="cursor-pointer text-xs font-semibold text-amber-800 hover:text-amber-900 uppercase tracking-wider [&::-webkit-details-marker]:hidden flex items-center gap-1">
            <span className="inline-block transition-transform group-open:rotate-90">▸</span>
            Add comparable homes & property details (raises confidence)
          </summary>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-stone-600 mb-1">Comp #1 (recent neighbor sale)</label>
              <input type="number" value={comp1} onChange={(e) => { setComp1(e.target.value); setSubmitted(false); }}
                placeholder="$310,000"
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-stone-600 mb-1">Comp #2</label>
              <input type="number" value={comp2} onChange={(e) => { setComp2(e.target.value); setSubmitted(false); }}
                placeholder="$295,000"
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-stone-600 mb-1">Comp #3</label>
              <input type="number" value={comp3} onChange={(e) => { setComp3(e.target.value); setSubmitted(false); }}
                placeholder="$320,000"
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-stone-600 mb-1">Recent purchase / appraisal</label>
              <input type="number" value={purchasePrice} onChange={(e) => { setPurchasePrice(e.target.value); setSubmitted(false); }}
                placeholder="$305,000"
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-stone-600 mb-1">Year built</label>
              <input type="number" value={yearBuilt} onChange={(e) => { setYearBuilt(e.target.value); setSubmitted(false); }}
                placeholder="1998"
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-stone-600 mb-1">Sqft</label>
              <input type="number" value={sqft} onChange={(e) => { setSqft(e.target.value); setSubmitted(false); }}
                placeholder="1850"
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
          </div>
        </details>

        <button
          type="submit"
          disabled={!stateAbbr || !countySlug || !assessedValue}
          className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 disabled:bg-stone-400 disabled:cursor-not-allowed text-stone-50 font-semibold rounded-md text-sm tracking-wide transition-colors"
        >
          Run Simulator →
        </button>
      </form>

      {/* Result panel */}
      {result && selectedCounty && colors && (
        <div className="mt-6 space-y-4">
          {/* Verdict card */}
          <div className={`${colors.bg} ${colors.border} border-l-4 border-y border-r rounded-r-lg p-6`}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">
              Verdict for {selectedCounty.county_name}, {selectedCounty.state}
            </p>
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-6 mb-3">
              <h3 className={`text-2xl font-bold ${colors.text}`}>
                {result.tierResult.label}
              </h3>
              <span className={`text-xs ${colors.text} opacity-70`}>
                Confidence: <strong>{result.confidence}</strong>
              </span>
            </div>
            <p className="text-sm text-stone-700 leading-relaxed">{result.successBand}</p>
          </div>

          {/* Numeric panel */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-stone-200 rounded-md p-4">
              <div className="text-[10px] uppercase tracking-widest text-stone-500 mb-1">Over-assessed?</div>
              <div className={`text-xl font-bold ${result.overAssessed ? "text-amber-800" : "text-emerald-700"}`}>
                {result.overAssessed ? `Yes, by ${result.overAssessmentPct.toFixed(1)}%` : "Not flagged"}
              </div>
              <div className="text-[11px] text-stone-500 mt-1">
                Target: {fmt(result.targetAssessed)} ({result.hasUserComps ? "your comps median × 1.05" : "county median × 1.05"})
              </div>
            </div>
            <div className="bg-white border border-stone-200 rounded-md p-4">
              <div className="text-[10px] uppercase tracking-widest text-stone-500 mb-1">Est. Annual Savings</div>
              <div className="text-xl font-bold text-stone-900">
                {fmtSigned(result.estAnnualSavings)}
              </div>
              <div className="text-[11px] text-stone-500 mt-1">
                If appeal succeeds at the comp-grounded target value.
              </div>
            </div>
            <div className="bg-white border border-stone-200 rounded-md p-4">
              <div className="text-[10px] uppercase tracking-widest text-stone-500 mb-1">10-Yr Cumulative</div>
              <div className="text-xl font-bold text-stone-900">
                {fmtSigned(result.est10YearSavings)}
              </div>
              <div className="text-[11px] text-stone-500 mt-1">
                Flat-line projection (no inflation, rate locked).
              </div>
            </div>
          </div>

          {/* Action checklist */}
          <div className="bg-white border border-stone-200 rounded-md p-5">
            <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-3">
              Action checklist
            </h4>
            <ol className="space-y-2 list-decimal list-inside text-sm text-stone-700 leading-relaxed">
              {result.actionChecklist.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ol>
          </div>

          {/* Confidence drivers */}
          <div className="bg-stone-50 border border-stone-200 rounded-md p-4 text-xs text-stone-600">
            <p className="font-bold uppercase tracking-wider text-stone-700 mb-2">
              Why confidence = {result.confidence}
            </p>
            <ul className="space-y-1 list-disc list-inside">
              {result.confidenceDrivers.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>

          {/* Disclaimer */}
          <p className="text-[11px] italic text-stone-500 leading-relaxed">
            Estimates only. The simulator is editorial and is not endorsed by IAAO, the US Census Bureau, or any state Department of Revenue. Filing-window non-compliance is the most common appeal rejection cause nationwide — confirm the deadline with your county assessor before drafting evidence. This is not legal advice.
          </p>
        </div>
      )}
    </div>
  );
}
