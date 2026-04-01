"use client";

export function FreshnessTag() {
  const now = new Date();
  const label = `${now.toLocaleString("en-US", { month: "short" })} ${now.getFullYear()}`;

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <time dateTime={`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`}>{label}</time> Data
    </span>
  );
}
