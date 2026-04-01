"use client";

import { useState, useEffect } from "react";

interface StateData {
  state: string;
  abbr: string;
  slug: string;
  avg_rate: number;
  median_tax: number;
  median_home_value: number;
  effective_rate: number;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export default function CompareClient() {
  const [states, setStates] = useState<StateData[]>([]);
  const [stateA, setStateA] = useState("");
  const [stateB, setStateB] = useState("");

  useEffect(() => {
    fetch("/api/states")
      .then((r) => r.json())
      .then((data) => setStates(data))
      .catch(() => {});
  }, []);

  const a = states.find((s) => s.abbr === stateA);
  const b = states.find((s) => s.abbr === stateB);

  return (
    <>
      <h1 className="text-3xl font-bold text-slate-900 mb-4">
        Compare Property Tax Rates
      </h1>
      <p className="text-slate-600 mb-8">
        Select two states to compare their property tax rates, median taxes, and
        home values side by side.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            State A
          </label>
          <select
            value={stateA}
            onChange={(e) => setStateA(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          >
            <option value="">Select a state</option>
            {states.map((s) => (
              <option key={s.abbr} value={s.abbr}>
                {s.state}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            State B
          </label>
          <select
            value={stateB}
            onChange={(e) => setStateB(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          >
            <option value="">Select a state</option>
            {states.map((s) => (
              <option key={s.abbr} value={s.abbr}>
                {s.state}
              </option>
            ))}
          </select>
        </div>
      </div>

      {a && b && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-4 py-3 font-medium text-slate-600">Metric</th>
                <th className="px-4 py-3 font-medium text-blue-700 text-right">
                  {a.state}
                </th>
                <th className="px-4 py-3 font-medium text-indigo-700 text-right">
                  {b.state}
                </th>
                <th className="px-4 py-3 font-medium text-slate-600 text-right">
                  Difference
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">Effective Tax Rate</td>
                <td className="px-4 py-3 text-right">
                  {a.effective_rate.toFixed(2)}%
                </td>
                <td className="px-4 py-3 text-right">
                  {b.effective_rate.toFixed(2)}%
                </td>
                <td
                  className={`px-4 py-3 text-right font-medium ${
                    a.effective_rate > b.effective_rate
                      ? "text-red-600"
                      : "text-emerald-600"
                  }`}
                >
                  {(a.effective_rate - b.effective_rate > 0 ? "+" : "")}
                  {(a.effective_rate - b.effective_rate).toFixed(2)}%
                </td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">Median Annual Tax</td>
                <td className="px-4 py-3 text-right">{fmt(a.median_tax)}</td>
                <td className="px-4 py-3 text-right">{fmt(b.median_tax)}</td>
                <td
                  className={`px-4 py-3 text-right font-medium ${
                    a.median_tax > b.median_tax
                      ? "text-red-600"
                      : "text-emerald-600"
                  }`}
                >
                  {a.median_tax > b.median_tax ? "+" : ""}
                  {fmt(a.median_tax - b.median_tax)}
                </td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">Median Home Value</td>
                <td className="px-4 py-3 text-right">
                  {fmt(a.median_home_value)}
                </td>
                <td className="px-4 py-3 text-right">
                  {fmt(b.median_home_value)}
                </td>
                <td className="px-4 py-3 text-right">
                  {fmt(a.median_home_value - b.median_home_value)}
                </td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">
                  Tax on $350K Home
                </td>
                <td className="px-4 py-3 text-right">
                  {fmt(350000 * (a.effective_rate / 100))}
                </td>
                <td className="px-4 py-3 text-right">
                  {fmt(350000 * (b.effective_rate / 100))}
                </td>
                <td
                  className={`px-4 py-3 text-right font-medium ${
                    a.effective_rate > b.effective_rate
                      ? "text-red-600"
                      : "text-emerald-600"
                  }`}
                >
                  {fmt(
                    350000 * ((a.effective_rate - b.effective_rate) / 100)
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {a && b && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href={`/state/${a.slug}/`}
            className="block p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 text-center"
          >
            View {a.state} Details &rarr;
          </a>
          <a
            href={`/state/${b.slug}/`}
            className="block p-4 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 text-center"
          >
            View {b.state} Details &rarr;
          </a>
        </div>
      )}

      {/* Popular comparisons */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          Popular Property Tax Comparisons
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {[
            ["texas", "california", "Texas", "California"],
            ["new-jersey", "florida", "New Jersey", "Florida"],
            ["illinois", "indiana", "Illinois", "Indiana"],
            ["new-york", "connecticut", "New York", "Connecticut"],
            ["ohio", "pennsylvania", "Ohio", "Pennsylvania"],
            ["washington", "oregon", "Washington", "Oregon"],
            ["texas", "florida", "Texas", "Florida"],
            ["california", "new-york", "California", "New York"],
            ["new-jersey", "new-york", "New Jersey", "New York"],
            ["georgia", "north-carolina", "Georgia", "North Carolina"],
            ["colorado", "arizona", "Colorado", "Arizona"],
            ["tennessee", "texas", "Tennessee", "Texas"],
          ].map(([slugA, slugB, nameA, nameB]) => (
            <a
              key={`${slugA}-${slugB}`}
              href={`/compare/${slugA}-vs-${slugB}/`}
              className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {nameA} vs {nameB} Property Taxes
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
