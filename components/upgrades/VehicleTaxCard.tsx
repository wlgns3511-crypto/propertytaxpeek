import type { VaVehicleRateBand } from "@/lib/va-vehicle-tax";

// Band → tone. Static class strings so Tailwind JIT discovers them.
const BAND_TONE: Record<
  VaVehicleRateBand,
  { bg: string; border: string; text: string; badgeBg: string; badgeText: string }
> = {
  low: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-900",
    badgeBg: "bg-emerald-700",
    badgeText: "text-emerald-50",
  },
  moderate: {
    bg: "bg-sky-50",
    border: "border-sky-200",
    text: "text-sky-900",
    badgeBg: "bg-sky-700",
    badgeText: "text-sky-50",
  },
  "above-average": {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-900",
    badgeBg: "bg-amber-700",
    badgeText: "text-amber-50",
  },
  high: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-900",
    badgeBg: "bg-rose-700",
    badgeText: "text-rose-50",
  },
};

export interface VehicleTaxCardProps {
  localityName: string;
  rate: number;
  band: VaVehicleRateBand;
  bandLabel: string;
  median: number;
  n: number;
  /**
   * ACS real-estate effective rate (%), shown only to clarify the two taxes are
   * distinct. Null when the locality's real-estate estimate is held this vintage
   * (suppressed branch) — the vehicle rate is independently sourced and valid.
   */
  realEstateEffectivePct: number | null;
  sourceUrl: string;
  taxYear: number;
}

/**
 * Virginia tangible personal property ("car tax") rate card. Surfaces the
 * locality's published vehicle tax rate — a tax DISTINCT from the real-estate
 * rate the rest of the page covers — with a peer-relative band, a worked
 * example, the statutory relief caveat, and primary-source attribution.
 *
 * Honest framing is mandatory here: the rate is the gross nominal tangible-
 * personal-property rate (vehicles are the dominant household class), shown
 * before any Personal Property Tax Relief Act subsidy, and some localities set
 * a separate vehicle classification rate.
 */
export function VehicleTaxCard({
  localityName,
  rate,
  band,
  bandLabel,
  median,
  n,
  realEstateEffectivePct,
  sourceUrl,
  taxYear,
}: VehicleTaxCardProps) {
  const tone = BAND_TONE[band];
  // Worked example on a $20,000 assessed vehicle: assessed/100 × rate.
  const exampleAssessed = 20000;
  const exampleGross = Math.round((exampleAssessed / 100) * rate);

  return (
    <section
      className={`my-8 rounded-xl border ${tone.border} ${tone.bg} p-6`}
      data-upgrade="va-vehicle-tax"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
        <span className="text-xs uppercase tracking-widest text-stone-500">
          Virginia personal property (vehicle) tax · TY {taxYear}
        </span>
        <span
          className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${tone.badgeBg} ${tone.badgeText}`}
        >
          {bandLabel}
        </span>
      </div>

      <h2 className={`text-xl font-bold ${tone.text} leading-tight`}>
        {localityName} vehicle tax rate:{" "}
        <span className="tabular-nums">${rate.toFixed(2)} per $100</span>
      </h2>

      <p className={`mt-2 text-sm leading-relaxed ${tone.text}`}>
        Virginia levies an annual <strong>tangible personal property tax</strong>{" "}
        on vehicles (the &ldquo;car tax&rdquo;), set by each county and city. In{" "}
        {localityName} the rate is{" "}
        <strong className="tabular-nums">${rate.toFixed(2)} per $100</strong> of
        assessed value — <strong>{bandLabel.toLowerCase()}</strong>, against a
        Virginia median of{" "}
        <span className="tabular-nums">${median.toFixed(2)}</span> across the {n}{" "}
        localities tracked here.
      </p>

      <p className={`mt-2 text-sm leading-relaxed ${tone.text}`}>
        Worked example: a vehicle assessed at{" "}
        <span className="tabular-nums">
          ${exampleAssessed.toLocaleString("en-US")}
        </span>{" "}
        would owe about{" "}
        <strong className="tabular-nums">
          ${exampleGross.toLocaleString("en-US")}/yr
        </strong>{" "}
        in {localityName} — gross, before any Personal Property Tax Relief Act
        (PPTRA) subsidy on qualifying personal-use vehicles.
      </p>

      <p className="mt-3 text-xs leading-relaxed text-stone-600">
        This tax is <strong>separate</strong> from {localityName}&rsquo;s real
        estate property tax
        {realEstateEffectivePct != null
          ? ` (${realEstateEffectivePct.toFixed(2)}% effective)`
          : ""}
        . Published rates are rounded general nominal rates; certain vehicles may be
        a separate classification taxed at a different rate, and rates may not
        reflect all local relief programs. Confirm with your local Commissioner of
        the Revenue.{" "}
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="underline hover:text-stone-800"
        >
          Source: Virginia Department of Taxation — Tax Rates for County, City,
          Town, and Districts, TY {taxYear}
        </a>
        .
      </p>
    </section>
  );
}
