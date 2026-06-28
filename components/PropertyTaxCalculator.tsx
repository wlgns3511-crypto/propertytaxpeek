"use client";

import { useState, useMemo } from "react";

interface Props {
  defaultState?: string;
  defaultRate?: number;
  states?: { abbr: string; state: string; avg_rate: number }[];
}

const NATIONAL_AVG_TAX = 2690;
const NATIONAL_AVG_RATE = 1.07;

export function PropertyTaxCalculator({ defaultState, defaultRate, states = [] }: Props) {
  const [homeValue, setHomeValue] = useState(350000);
  const [selectedState, setSelectedState] = useState(defaultState || "");
  const [assessmentRatio, setAssessmentRatio] = useState(100);
  const [customRate, setCustomRate] = useState(defaultRate || NATIONAL_AVG_RATE);

  const effectiveRate = useMemo(() => {
    if (selectedState && states.length > 0) {
      const found = states.find((s) => s.abbr === selectedState);
      if (found) return found.avg_rate;
    }
    return customRate;
  }, [selectedState, states, customRate]);

  const assessedValue = homeValue * (assessmentRatio / 100);
  const annualTax = assessedValue * (effectiveRate / 100);
  const monthlyTax = annualTax / 12;

  const diffFromNational = annualTax - NATIONAL_AVG_TAX;
  const diffPct = ((effectiveRate - NATIONAL_AVG_RATE) / NATIONAL_AVG_RATE) * 100;

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return (
    <div className="bg-gradient-to-br from-amber-50 to-stone-50 border border-amber-200 rounded-xl p-6 my-8">
      <h3 className="text-lg font-bold text-amber-900 mb-4">Property Tax Calculator</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Home Value</label>
          <input
            type="number"
            value={homeValue}
            onChange={(e) => setHomeValue(Number(e.target.value))}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-500 outline-none"
            min={0}
            step={10000}
          />
        </div>

        {states.length > 0 ? (
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">State</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-500 outline-none bg-white"
            >
              <option value="">Select a state</option>
              {states.map((s) => (
                <option key={s.abbr} value={s.abbr}>
                  {s.state} ({s.avg_rate}%)
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Tax Rate (%)
            </label>
            <input
              type="number"
              value={customRate}
              onChange={(e) => setCustomRate(Number(e.target.value))}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-500 outline-none"
              min={0}
              max={10}
              step={0.01}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Assessment Ratio (%)
          </label>
          <input
            type="number"
            value={assessmentRatio}
            onChange={(e) => setAssessmentRatio(Number(e.target.value))}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-500 outline-none"
            min={0}
            max={100}
            step={1}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Effective Rate
          </label>
          <div className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm font-semibold text-amber-800">
            {effectiveRate.toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-lg p-4 text-center border border-amber-100">
          <div className="text-xs text-stone-500 uppercase tracking-wider mb-1">Annual Tax</div>
          <div className="text-2xl font-bold text-amber-900">{fmt(annualTax)}</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center border border-amber-100">
          <div className="text-xs text-stone-500 uppercase tracking-wider mb-1">Monthly Tax</div>
          <div className="text-2xl font-bold text-amber-900">{fmt(monthlyTax)}</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center border border-amber-100">
          <div className="text-xs text-stone-500 uppercase tracking-wider mb-1">vs National Avg</div>
          <div className={`text-2xl font-bold ${diffFromNational > 0 ? "text-red-600" : "text-emerald-600"}`}>
            {diffFromNational > 0 ? "+" : ""}
            {fmt(diffFromNational)}
          </div>
          <div className="text-xs text-stone-500">
            ({diffPct > 0 ? "+" : ""}{diffPct.toFixed(1)}% rate difference)
          </div>
        </div>
      </div>

      <p className="text-xs text-stone-400 mt-4">
        Estimates only. Actual tax may vary based on local assessments, exemptions, and
        special districts. Consult a professional for exact figures.
      </p>
    </div>
  );
}
