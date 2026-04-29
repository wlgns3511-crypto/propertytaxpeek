// HCU 2026-04-29: rendered when a county's ACS 2024 5-Year estimate fails
// the relative-MOE threshold (>30%) or the local DB row doesn't match a
// Census row at all. We hold the page rather than 410 it (existing GSC
// trust on the URL is preserved) but we don't show synthesized numbers
// as if they were a real estimate.

import { VINTAGE_SHORT } from "@/lib/data-vintage";

export function DataSuppressedNotice({
  countyName,
  state,
  reason,
}: {
  countyName: string;
  state: string;
  reason: string;
}) {
  return (
    <section className="my-8 rounded-lg border-l-4 border-amber-400 bg-amber-50 p-5">
      <h2 className="text-lg font-semibold text-amber-900 mb-2">
        Property tax estimate held for the next vintage
      </h2>
      <p className="text-sm text-amber-900/90 leading-relaxed mb-3">
        The {VINTAGE_SHORT} estimate for {countyName}, {state} did not meet our
        publication threshold. {reason}.
      </p>
      <p className="text-xs text-amber-800 leading-relaxed">
        We publish median property tax, home value, and effective-rate figures
        only when their statistical margin of error is tight enough for a
        homeowner to act on. When a county estimate is too thin to pass that
        bar, we hold the figure until the next ACS vintage rather than print a
        number you shouldn't trust. State-level numbers below remain reliable.
      </p>
    </section>
  );
}
