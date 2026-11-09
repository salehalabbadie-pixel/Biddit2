// Pure statistics for the expert ratings. No I/O, so it is easy to test.

/** A skill gets the panel value only with at least this many ratings (project decision, README). */
export const MIN_RATINGS = 6;

/** Quantile of an ascending array with linear interpolation (Hyndman & Fan type 7, as in Excel QUARTILE.INC). */
export function quantile(sorted, p) {
  if (sorted.length === 0) return null;
  const h = (sorted.length - 1) * p;
  const lo = Math.floor(h);
  const hi = Math.ceil(h);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (h - lo);
}

const round1 = (x) => (x == null ? null : Math.round(x * 10) / 10);

/** n, median, quartiles, IQR, range and mean of the finite values. */
export function describe(values) {
  const v = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (v.length === 0) return { n: 0 };
  const q1 = quantile(v, 0.25);
  const q3 = quantile(v, 0.75);
  return {
    n: v.length,
    median: round1(quantile(v, 0.5)),
    q1: round1(q1),
    q3: round1(q3),
    iqr: round1(q3 - q1),
    min: v[0],
    max: v[v.length - 1],
    mean: round1(v.reduce((s, x) => s + x, 0) / v.length),
  };
}

/**
 * Agreement of the panel, by the interquartile range on the 0–100 scale.
 * The thresholds are a project decision (README), not a fixed standard.
 */
export const CONSENSUS = { high: 20, medium: 30 };
export function consensus(iqr) {
  if (iqr == null) return null;
  if (iqr <= CONSENSUS.high) return "hoch";
  if (iqr <= CONSENSUS.medium) return "mittel";
  return "tief";
}

/**
 * Intraclass correlation, two-way random effects, absolute agreement
 * (Shrout & Fleiss 1979: ICC(2,1) for a single rater, ICC(2,k) for the mean of k raters).
 * `rows` is a complete matrix: one row per skill, one column per expert.
 */
export function icc(rows) {
  const n = rows.length;
  const k = rows[0]?.length ?? 0;
  if (n < 2 || k < 2) return null;
  const all = rows.flat();
  const grand = all.reduce((s, x) => s + x, 0) / all.length;
  const rowMeans = rows.map((r) => r.reduce((s, x) => s + x, 0) / k);
  const colMeans = Array.from({ length: k }, (_, j) => rows.reduce((s, r) => s + r[j], 0) / n);
  const ssRows = k * rowMeans.reduce((s, m) => s + (m - grand) ** 2, 0);
  const ssCols = n * colMeans.reduce((s, m) => s + (m - grand) ** 2, 0);
  const ssTotal = all.reduce((s, x) => s + (x - grand) ** 2, 0);
  const msRows = ssRows / (n - 1);
  const msCols = ssCols / (k - 1);
  const msError = (ssTotal - ssRows - ssCols) / ((n - 1) * (k - 1));
  const single = (msRows - msError) / (msRows + (k - 1) * msError + (k * (msCols - msError)) / n);
  const average = (msRows - msError) / (msRows + (msCols - msError) / n);
  return { single, average, skills: n, experts: k };
}
