export function TaxRateChart({ stateRate, nationalRate, stateName }: { stateRate: number; nationalRate: number; stateName: string }) {
  const max = Math.max(stateRate, nationalRate) * 1.3;
  return (
    <div className="my-4">
      <h3 className="text-sm font-semibold text-stone-600 mb-2">Property Tax Rate Comparison</h3>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-24 text-right text-stone-500 truncate">{stateName}</span>
          <div className="flex-1 bg-stone-100 rounded-full h-6 overflow-hidden">
            <div
              className="h-full rounded-full flex items-center justify-end pr-2 text-white font-medium"
              style={{
                width: `${(stateRate / max) * 100}%`,
                backgroundColor: stateRate > nationalRate ? "#ef4444" : "#22c55e",
                minWidth: "3rem",
              }}
            >
              {stateRate.toFixed(2)}%
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-24 text-right text-stone-500">US Average</span>
          <div className="flex-1 bg-stone-100 rounded-full h-6 overflow-hidden">
            <div
              className="h-full rounded-full flex items-center justify-end pr-2 text-white font-medium"
              style={{
                width: `${(nationalRate / max) * 100}%`,
                backgroundColor: "#64748b",
                minWidth: "3rem",
              }}
            >
              {nationalRate.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
