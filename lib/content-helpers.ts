// HCU 2026-04-29 portable helpers (copied from nameblooms/salarybycity
// pattern). Keeps domain-specific facts/commentary in their own files; this
// file holds only the pure utilities.

// FNV-1a-ish slug hash, deterministic. Used to pick a copy variant per slug
// so two different counties don't render the same intro paragraph (HCU
// duplicate-pattern defense).
export function slugHash(slug: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

export function pickVariant<T>(slug: string, slot: string, variants: T[]): T {
  if (variants.length === 0) {
    throw new Error(`pickVariant: empty variants for slot=${slot}`);
  }
  const h = slugHash(`${slug}::${slot}`);
  return variants[h % variants.length];
}

export function fmtUsd(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function fmtUsdMaybe(n: number | null | undefined, fallback = "—"): string {
  if (n == null || !Number.isFinite(n)) return fallback;
  return fmtUsd(n);
}

export function fmtPercent(n: number, digits = 2): string {
  return `${n.toFixed(digits)}%`;
}

export function fmtPercentMaybe(n: number | null | undefined, digits = 2, fallback = "—"): string {
  if (n == null || !Number.isFinite(n)) return fallback;
  return fmtPercent(n, digits);
}

export function fmtInt(n: number): string {
  return n.toLocaleString("en-US");
}

// "1 in every N" formatting for ratios near 0–1.
export function oneInEveryN(decimal: number): string {
  if (decimal <= 0) return "essentially zero";
  const n = 1 / decimal;
  if (n >= 100) return `1 in every ${Math.round(n / 10) * 10}`;
  return `1 in every ${Math.round(n)}`;
}

export function ratioPhrase(a: number, b: number): string {
  if (b === 0) return "—";
  const r = a / b;
  if (r >= 1.05) return `about ${r.toFixed(1)}× ${b < a ? "more" : "less"}`;
  if (r <= 0.95) return `about ${(1 / r).toFixed(1)}× less`;
  return "comparable";
}

export function aOrAn(word: string): string {
  return /^[aeiouAEIOU]/.test(word) ? "an" : "a";
}
