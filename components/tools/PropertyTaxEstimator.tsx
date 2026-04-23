"use client";

import { useState } from "react";

interface Props {
  countyName: string;
  state: string;
  effectiveRate: number;
  stateAvgRate: number | null;
}

const NATIONAL_AVG_TAX = 2795;
const NATIONAL_AVG_RATE = 1.07;

function fmt(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function PropertyTaxEstimator({
  countyName,
  state,
  effectiveRate,
  stateAvgRate,
}: Props) {
  const [homeValue, setHomeValue] = useState(350000);
  const [homestead, setHomestead] = useState(false);

  const HOMESTEAD_EXEMPTION = 50000;
  const taxableValue = homestead
    ? Math.max(homeValue - HOMESTEAD_EXEMPTION, 0)
    : homeValue;

  const annualTax = Math.round(taxableValue * (effectiveRate / 100));
  const monthlyTax = Math.round(annualTax / 12);

  const stateAnnualTax = stateAvgRate
    ? Math.round(taxableValue * (stateAvgRate / 100))
    : null;
  const nationalAnnualTax = Math.round(taxableValue * (NATIONAL_AVG_RATE / 100));

  // For bar widths
  const maxTax = Math.max(
    annualTax,
    stateAnnualTax ?? 0,
    nationalAnnualTax,
    1
  );

  const bars = [
    { label: countyName, tax: annualTax, rate: effectiveRate, color: "bg-blue-600" },
    ...(stateAvgRate !== null
      ? [{ label: `${state} avg`, tax: stateAnnualTax!, rate: stateAvgRate, color: "bg-amber-500" }]
      : []),
    { label: "National avg", tax: nationalAnnualTax, rate: NATIONAL_AVG_RATE, color: "bg-slate-400" },
  ];

  const diffFromNational = annualTax - nationalAnnualTax;

  return (
    <section className="bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-200 rounded-xl p-6 my-8">
      <h2 className="text-xl font-bold text-blue-900 mb-1">
        Property Tax Estimator
      </h2>
      <p className="text-sm text-slate-600 mb-5">
        Enter your home value to estimate annual property tax in {countyName} at
        the {effectiveRate.toFixed(2)}% effective rate.
      </p>

      {/* Controls */}
      <div className="mb-6">
        <label className="flex justify-between text-sm font-medium text-slate-700 mb-2">
          <span>Home Value</span>
          <span className="text-blue-700 font-bold text-base">{fmt(homeValue)}</span>
        </label>
        <input
          type="range"
          min={50000}
          max={2000000}
          step={10000}
          value={homeValue}
          onChange={(e) => setHomeValue(Number(e.target.value))}
          className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>$50K</span>
          <span>$2M</span>
        </div>
      </div>

      {/* Homestead toggle */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          role="switch"
          aria-checked={homestead}
          onClick={() => setHomestead(!homestead)}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            homestead ? "bg-blue-600" : "bg-slate-300"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              homestead ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        <span className="text-sm text-slate-700">
          Apply homestead exemption (-{fmt(HOMESTEAD_EXEMPTION)})
        </span>
      </div>

      {/* Result cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 text-center border border-blue-100">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Annual Tax
          </div>
          <div className="text-2xl font-bold text-blue-800">{fmt(annualTax)}</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center border border-blue-100">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Monthly (Escrow)
          </div>
          <div className="text-2xl font-bold text-blue-800">{fmt(monthlyTax)}</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center border border-blue-100">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            vs National Avg
          </div>
          <div
            className={`text-2xl font-bold ${
              diffFromNational > 0 ? "text-red-600" : "text-emerald-600"
            }`}
          >
            {diffFromNational > 0 ? "+" : ""}
            {fmt(diffFromNational)}
          </div>
        </div>
      </div>

      {/* Comparison bars */}
      <h3 className="text-sm font-semibold text-slate-600 mb-3">
        Annual Tax Comparison on a {fmt(homeValue)} Home
      </h3>
      <div className="space-y-3 mb-6">
        {bars.map((bar) => (
          <div key={bar.label}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-medium text-slate-700">{bar.label}</span>
              <span className="text-slate-600">
                {fmt(bar.tax)}/yr ({bar.rate.toFixed(2)}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-5">
              <div
                className={`${bar.color} h-5 rounded-full transition-all duration-300`}
                style={{
                  width: `${Math.max((bar.tax / maxTax) * 100, 2).toFixed(1)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Summary sentence */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 text-sm text-slate-700 leading-relaxed">
        <p>
          A <strong>{fmt(homeValue)}</strong> home in <strong>{countyName}</strong>{" "}
          pays approximately <strong>{fmt(annualTax)}/year</strong> (
          <strong>{fmt(monthlyTax)}/month</strong>) in property tax
          {homestead && (
            <> after a {fmt(HOMESTEAD_EXEMPTION)} homestead exemption</>
          )}
          . That is{" "}
          <span
            className={
              diffFromNational > 0
                ? "text-red-600 font-semibold"
                : "text-emerald-600 font-semibold"
            }
          >
            {fmt(Math.abs(diffFromNational))}{" "}
            {diffFromNational > 0 ? "more" : "less"}
          </span>{" "}
          than the national average of {fmt(nationalAnnualTax)}/year at the same
          home value.
        </p>
      </div>

      <p className="text-xs text-slate-400 mt-4">
        Based on the {countyName} effective tax rate of {effectiveRate.toFixed(2)}%.
        National average rate: {NATIONAL_AVG_RATE}%. Actual tax may vary based on
        local assessment practices and exemptions.
      </p>
    </section>
  );
}
