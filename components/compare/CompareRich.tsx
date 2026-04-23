import type { State } from '@/lib/db';

interface Props {
  slug: string;
  a?: State;
  b?: State;
}

function fmtCurrency(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export function CompareRich({ slug, a, b }: Props) {
  if (!a || !b) return null;

  const lowerRate = a.effective_rate <= b.effective_rate ? a : b;
  const lowerMedianTax = a.median_tax <= b.median_tax ? a : b;
  const higherHomeValue = a.median_home_value >= b.median_home_value ? a : b;
  const rateGap = Math.abs(a.effective_rate - b.effective_rate);

  return (
    <section className="mt-10 rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-2xl font-bold text-slate-900">Property Tax Decision Framing</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
        {a.state} vs {b.state} is easiest to interpret when you separate tax rate from home value. A lower effective rate
        can still coexist with a higher median bill if home values are much larger.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Lower Effective Rate</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">{lowerRate.state}</div>
          <p className="mt-2 text-sm text-slate-600">
            {lowerRate.state} posts the lighter effective rate at {lowerRate.effective_rate.toFixed(2)}%, a {rateGap.toFixed(2)} point gap.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Lower Median Tax Bill</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">{lowerMedianTax.state}</div>
          <p className="mt-2 text-sm text-slate-600">
            {lowerMedianTax.state} has the lower statewide median bill at {fmtCurrency(lowerMedianTax.median_tax)}.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Higher Home Value Baseline</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">{higherHomeValue.state}</div>
          <p className="mt-2 text-sm text-slate-600">
            {higherHomeValue.state} carries the higher median home value at {fmtCurrency(higherHomeValue.median_home_value)},
            which often explains why tax bills do not move in lockstep with tax rates.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-900">How To Use This Compare</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Start with the effective rate if you want a cleaner tax-policy comparison. Start with the median annual bill if
          you care about actual homeowner burden. When the cheaper rate and cheaper bill point to different states, the
          home-value baseline is usually the reason.
        </p>
      </div>

      <p className="mt-4 text-xs text-slate-500">Compare slug: {slug}</p>
    </section>
  );
}
