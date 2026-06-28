/**
 * PropertyTaxInterpretation — composite verdict box.
 *
 * Phase 6 v6.4 PSU 1차 (2026-05-12): rendered atop /county/[slug] and
 * /state/[slug] hero sections. The component receives a pre-computed
 * PropertyTaxInterpretation from lib/propertytax-interpretation.ts and
 * renders a tone-coloured verdict + four-paragraph explainer + cited
 * authorities footer. It does not compute anything itself; the
 * deterministic classifier work happens in the lib layer so the
 * AdSense-readable surface stays presentational and inspectable.
 */
import type { PropertyTaxInterpretation } from "@/lib/propertytax-interpretation";

const TONE_BG: Record<PropertyTaxInterpretation["verdictTone"], string> = {
  emerald: "bg-emerald-50 border-emerald-200",
  amber: "bg-amber-50 border-amber-200",
  rose: "bg-rose-50 border-rose-200",
  slate: "bg-stone-50 border-stone-200",
};

const TONE_BADGE: Record<PropertyTaxInterpretation["verdictTone"], string> = {
  emerald: "bg-emerald-100 text-emerald-900",
  amber: "bg-amber-100 text-amber-900",
  rose: "bg-rose-100 text-rose-900",
  slate: "bg-stone-100 text-stone-900",
};

export interface PropertyTaxInterpretationProps {
  interpretation: PropertyTaxInterpretation;
}

export function PropertyTaxInterpretation({ interpretation }: PropertyTaxInterpretationProps) {
  const tone = interpretation.verdictTone;
  return (
    <section
      className={`mb-8 mt-6 rounded-2xl border p-6 ${TONE_BG[tone]}`}
      data-upgrade="composite-verdict"
      data-escape-route={interpretation.escapeRoute}
    >
      <header className="mb-4 flex flex-wrap items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${TONE_BADGE[tone]}`}>
          Verdict
        </span>
        <span className="text-xs font-medium uppercase tracking-wider text-stone-500">
          {interpretation.recommendation}
        </span>
      </header>
      <p className="mb-5 text-base font-medium leading-relaxed text-stone-900">
        {interpretation.verdict}
      </p>
      <div className="grid gap-4 text-sm leading-relaxed text-stone-700 md:grid-cols-2" data-upgrade="four-paragraph">
        <p data-pgraph="rate-context">{interpretation.paragraphs.rateContext}</p>
        <p data-pgraph="burden-context">{interpretation.paragraphs.burdenContext}</p>
        <p data-pgraph="relief-context">{interpretation.paragraphs.reliefContext}</p>
        <p data-pgraph="next-step">{interpretation.paragraphs.nextStep}</p>
      </div>
      <footer className="mt-5 border-t border-stone-200 pt-4 text-xs text-stone-500">
        <p className="mb-1 font-semibold uppercase tracking-wider text-stone-600">
          Authorities cited
        </p>
        <ul className="list-disc pl-4">
          {interpretation.authorities.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </footer>
    </section>
  );
}
