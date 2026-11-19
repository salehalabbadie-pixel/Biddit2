/**
 * Krippendorff's alpha for reliability data (Krippendorff 2011, «Computing
 * Krippendorff's Alpha-Reliability»; Content Analysis, 4th ed. 2018).
 *
 * `units` is an array of units, each an array of the values the coders gave
 * (null or undefined for a missing value). Units with fewer than two values are
 * not pairable and are ignored. `metric` is "nominal", "ordinal" or "interval".
 * Returns alpha, or null when fewer than two pairable values exist or all
 * values are identical (no variation, alpha undefined).
 */
export function krippendorffAlpha(units, metric = "interval") {
  const pairable = units
    .map((unit) => unit.filter((v) => v !== null && v !== undefined && !Number.isNaN(v)))
    .filter((unit) => unit.length >= 2);
  if (pairable.length === 0) return null;

  const values = [...new Set(pairable.flat())].sort((a, b) => a - b);
  const index = new Map(values.map((v, i) => [v, i]));
  const size = values.length;
  if (size < 2) return null;

  // Coincidence matrix: each ordered pair within a unit counts 1 / (m − 1).
  const o = Array.from({ length: size }, () => new Array(size).fill(0));
  pairable.forEach((unit) => {
    const weight = 1 / (unit.length - 1);
    unit.forEach((a, i) =>
      unit.forEach((b, j) => {
        if (i !== j) o[index.get(a)][index.get(b)] += weight;
      })
    );
  });
  const marginal = o.map((row) => row.reduce((s, x) => s + x, 0));
  const n = marginal.reduce((s, x) => s + x, 0);

  const delta = (c, k) => {
    if (metric === "nominal") return c === k ? 0 : 1;
    if (metric === "interval") return (values[c] - values[k]) ** 2;
    if (metric === "ordinal") {
      const [lo, hi] = c < k ? [c, k] : [k, c];
      let sum = 0;
      for (let g = lo; g <= hi; g += 1) sum += marginal[g];
      return (sum - (marginal[c] + marginal[k]) / 2) ** 2;
    }
    throw new Error(`Unbekannte Metrik: ${metric}`);
  };

  let observed = 0;
  let expected = 0;
  for (let c = 0; c < size; c += 1) {
    for (let k = 0; k < size; k += 1) {
      const d = delta(c, k);
      observed += o[c][k] * d;
      expected += marginal[c] * marginal[k] * d;
    }
  }
  if (expected === 0) return null;
  return 1 - ((n - 1) * observed) / expected;
}

/** Krippendorff's thresholds: ≥ 0.800 reliable, ≥ 0.667 tentative conclusions only. */
export function alphaVerdict(alpha) {
  if (alpha === null) return "nicht berechenbar";
  if (alpha >= 0.8) return "verlässlich";
  if (alpha >= 0.667) return "vorläufig";
  return "ungenügend";
}
