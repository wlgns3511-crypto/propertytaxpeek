import {
  DB_UPDATED,
  EDITORIAL_TEAM,
  PUBLISHER,
  REVIEWER_DISCLAIMER,
  SOURCE_AUTHORITIES,
  SOURCE_VINTAGES,
} from "@/lib/authorship";

type AuthorBoxProps = {
  /** Per-page review date (ISO YYYY-MM-DD). Defaults to DB_UPDATED. */
  vintage?: string;
  /** Short label describing what this page is — shown after editorial team line. */
  source?: string;
  /** YMYL HIGH pages (financial decision impact) show the reviewer disclaimer. */
  showDisclaimer?: boolean;
};

export function AuthorBox({ vintage, source, showDisclaimer }: AuthorBoxProps = {}) {
  const reviewedAt = vintage ?? DB_UPDATED;
  const sourceVintageLine = Object.entries(SOURCE_VINTAGES)
    .map(([name, v]) => `${name} (${v})`)
    .join(" · ");

  return (
    <div className="mt-10 p-5 bg-stone-50 border border-stone-200 rounded-xl">
      <div className="flex items-start gap-3 mb-3">
        <div
          className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700"
          aria-hidden="true"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-stone-900 text-sm">
            Reviewed by {EDITORIAL_TEAM.name}
          </div>
          <div className="text-xs text-stone-500 mt-0.5">
            Part of the{" "}
            <a href={PUBLISHER.url} className="text-stone-700 hover:underline" rel="noopener">
              {PUBLISHER.name}
            </a>
            {source ? <> · {source}</> : null}
          </div>
        </div>
      </div>
      <p className="text-xs text-stone-600 leading-relaxed mb-3">
        Each county and state property tax record is cross-referenced against{" "}
        {SOURCE_AUTHORITIES.map((s, i) => (
          <span key={s.name}>
            {i > 0 &&
              (i === SOURCE_AUTHORITIES.length - 1 ? ", and " : ", ")}
            <a
              href={s.url}
              className="text-stone-700 underline underline-offset-2 hover:text-stone-900"
              rel="noopener"
              target="_blank"
            >
              {s.name}
            </a>
          </span>
        ))}{" "}
        before publication. Our editorial workflow audits effective tax rate
        calculations, MOE-filtered ACS estimates, assessment ratios, and per-source
        vintage on every release cycle.
      </p>
      <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 mb-2">
        <span>
          Last reviewed: <time dateTime={reviewedAt}>{reviewedAt}</time>
        </span>
        <span className="text-stone-300">·</span>
        <a
          href="https://datapeekfacts.com/editorial-policy/"
          className="underline underline-offset-2 hover:text-stone-900"
          rel="noopener"
        >
          Editorial policy
        </a>
        <span className="text-stone-300">·</span>
        <a href="/methodology/" className="underline underline-offset-2 hover:text-stone-900">
          Methodology
        </a>
        <span className="text-stone-300">·</span>
        <a href="/contact/" className="underline underline-offset-2 hover:text-stone-900">
          Send a correction
        </a>
      </div>
      <div className="text-xs text-stone-500">
        Source vintages: {sourceVintageLine}
      </div>
      {showDisclaimer ? (
        <div className="mt-3 pt-3 border-t border-stone-200 text-xs text-stone-600 leading-relaxed">
          <strong className="text-stone-700">Important.</strong> {REVIEWER_DISCLAIMER}
        </div>
      ) : null}
    </div>
  );
}
