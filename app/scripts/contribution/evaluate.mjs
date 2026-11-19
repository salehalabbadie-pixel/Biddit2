/**
 * Evaluates the returned coding sheets: inter-coder reliability per code
 * (Krippendorff's alpha), the cases the coders should discuss, and the final
 * contribution per course–skill pair.
 *
 * Final values come from a consensus sheet (coder code "KONSENS") when one is
 * in the folder; otherwise from the codes of all coders (mean share and
 * assessment weight, median Bloom level, median ECTS).
 *
 * Usage (from app/):
 *   node scripts/contribution/evaluate.mjs <folder> [--out <json>] [--report <md>]
 * Writes the results (no comments, no evidence) to scripts/contribution/data/
 * contributions.json and a local report with the evidence to <folder>/Auswertung.md.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { SKILLS } from "../../src/features/skillMaster/data/catalog.js";
import { alphaVerdict, krippendorffAlpha } from "./alpha.mjs";
import { BLOOM, PARAMS, contribution } from "./codebook.mjs";
import { codingUnits, readCodings } from "./sheet.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
export const RESULTS_FILE = join(HERE, "data", "contributions.json");
export const CONSENSUS_CODE = "KONSENS";

/** A case is discussed when the coders differ by at least this much. */
export const DISAGREEMENT = { contribution: 15, share: 20, bloom: 2, assessed: 20 };

const median = (values) => {
  const v = values.filter((x) => x !== null && x !== undefined).sort((a, b) => a - b);
  if (v.length === 0) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
};
const mean = (values) => {
  const v = values.filter((x) => x !== null && x !== undefined);
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
};
const spread = (values) => {
  const v = values.filter((x) => x !== null && x !== undefined);
  return v.length >= 2 ? Math.max(...v) - Math.min(...v) : 0;
};

/** Codes of one coder for one pair, with the contribution they imply. */
function coded(coding, pair) {
  const codes = coding.codes[`${pair.course}|${pair.skillId}`] ?? {};
  const ects = coding.ects[pair.title] ?? null;
  return { ...codes, ects, contribution: contribution({ ects, ...codes }) };
}

/**
 * { results, warnings, discuss } for the codings of one folder.
 * `results.pairs` is keyed by "course|skillId" of the first course number.
 */
export function evaluate(codings, units = codingUnits()) {
  const warnings = [];
  const seen = new Set();
  codings.forEach((c) => {
    if (!c.code) warnings.push(`${c.file}: ohne Codierer-Code`);
    else if (seen.has(c.code)) warnings.push(`${c.code} kommt mehrfach vor`);
    seen.add(c.code);
    if (c.version !== units.version)
      warnings.push(`${c.code ?? c.file}: Codierblatt-Version ${c.version}, aktuell ${units.version} (Paare geändert?)`);
    c.problems.forEach((p) => warnings.push(`${c.code ?? c.file}: ${p}`));
  });

  const consensus = codings.find((c) => c.code?.toUpperCase() === CONSENSUS_CODE);
  const coders = codings.filter((c) => c !== consensus);

  const per = (key) => units.pairs.map((pair) => coders.map((c) => coded(c, pair)[key]));
  const alpha = coders.length >= 2
    ? {
        share: krippendorffAlpha(per("share"), "interval"),
        bloom: krippendorffAlpha(per("bloom"), "ordinal"),
        assessed: krippendorffAlpha(per("assessed"), "interval"),
        contribution: krippendorffAlpha(per("contribution"), "interval"),
      }
    : null;
  if (!alpha) warnings.push("Weniger als zwei Codierer/innen: keine Übereinstimmung berechenbar.");

  const pairs = {};
  const discuss = [];
  units.pairs.forEach((pair) => {
    const codes = coders.map((c) => ({ code: c.code, ...coded(c, pair) }));
    const differs = Object.entries(DISAGREEMENT).filter(([key, limit]) => spread(codes.map((c) => c[key])) >= limit);
    if (differs.length) discuss.push({ pair, codes, differs: differs.map(([key]) => key) });

    let final;
    if (consensus) {
      final = coded(consensus, pair);
    } else {
      const bloom = median(codes.map((c) => c.bloom));
      final = {
        ects: median(codes.map((c) => c.ects)),
        share: mean(codes.map((c) => c.share)),
        bloom: bloom === null ? null : Math.round(bloom),
        assessed: mean(codes.map((c) => c.assessed)),
      };
      final.contribution = contribution(final);
    }
    pairs[`${pair.course}|${pair.skillId}`] = {
      numbers: pair.numbers,
      title: pair.title,
      skillId: pair.skillId,
      contribution: final.contribution,
      codes: {
        ects: final.ects,
        share: final.share === null ? null : Math.round(final.share),
        bloom: final.bloom,
        assessed: final.assessed === null ? null : Math.round(final.assessed),
      },
      coders: codes.filter((c) => c.contribution !== null).length,
    };
  });

  const missing = Object.values(pairs).filter((p) => p.contribution === null).length;
  if (missing) warnings.push(`${missing} Paare ohne vollständige Codes: kein Beitrag berechnet.`);

  return {
    results: {
      semester: units.semester,
      version: units.version,
      params: PARAMS,
      basis: consensus ? "Konsens" : `Mittel aus ${coders.length} Codierungen`,
      coders: coders.length,
      alpha,
      pairs,
    },
    warnings,
    discuss,
  };
}

/** Spearman rank correlation (ties get their mean rank); null below three pairs. */
export function spearman(xs, ys) {
  const rank = (v) => {
    const order = v.map((x, i) => [x, i]).sort((a, b) => a[0] - b[0]);
    const r = new Array(v.length);
    for (let i = 0; i < order.length; ) {
      let j = i;
      while (j + 1 < order.length && order[j + 1][0] === order[i][0]) j += 1;
      for (let k = i; k <= j; k += 1) r[order[k][1]] = (i + j) / 2 + 1;
      i = j + 1;
    }
    return r;
  };
  if (xs.length < 3) return null;
  const [rx, ry] = [rank(xs), rank(ys)];
  const m = (rx.length + 1) / 2;
  let num = 0;
  let dx = 0;
  let dy = 0;
  rx.forEach((x, i) => {
    num += (x - m) * (ry[i] - m);
    dx += (x - m) ** 2;
    dy += (ry[i] - m) ** 2;
  });
  return dx && dy ? num / Math.sqrt(dx * dy) : null;
}

/** Variants of the project parameters for the sensitivity check. */
export const VARIANTS = [
  { name: "fullHours 60", params: { ...PARAMS, fullHours: 60 } },
  { name: "fullHours 120", params: { ...PARAMS, fullHours: 120 } },
  { name: "ungeprüft 0.5", params: { ...PARAMS, unassessedFactor: 0.5 } },
  { name: "ungeprüft 1.0", params: { ...PARAMS, unassessedFactor: 1 } },
];

/**
 * How much the results depend on the project parameters: per variant the
 * Spearman correlation of all contributions with the chosen parameters, and the
 * mean absolute change in points.
 */
export function sensitivity(results) {
  const pairs = Object.values(results.pairs).filter((p) => p.contribution !== null);
  const base = pairs.map((p) => p.contribution);
  return VARIANTS.map(({ name, params }) => {
    const varied = pairs.map((p) => contribution(p.codes, params));
    const change = varied.reduce((s, v, i) => s + Math.abs(v - base[i]), 0) / (pairs.length || 1);
    return { name, rho: spearman(base, varied), meanChange: change };
  });
}

const fmt = (a) => (a === null || a === undefined ? "–" : a.toFixed(3));
const bloomName = (level) => BLOOM.find((b) => b.level === level)?.label ?? "–";

/** Local Markdown report, including evidence and comments (stays out of the repo). */
export function report({ results, warnings, discuss }) {
  const lines = [`# Auswertung Beitrag – ${results.semester}`, ""];
  lines.push(`Grundlage der Werte: ${results.basis}. Parameter: ${JSON.stringify(results.params)}.`, "");
  if (results.alpha) {
    lines.push("## Übereinstimmung (Krippendorffs Alpha)", "", "| Code | Metrik | Alpha | Urteil |", "|---|---|---|---|");
    [
      ["Zeitanteil", "intervall", results.alpha.share],
      ["Bloom-Stufe", "ordinal", results.alpha.bloom],
      ["Prüfungsgewicht", "intervall", results.alpha.assessed],
      ["Beitrag (berechnet)", "intervall", results.alpha.contribution],
    ].forEach(([name, metric, a]) => lines.push(`| ${name} | ${metric} | ${fmt(a)} | ${alphaVerdict(a)} |`));
    lines.push("", "Schwellen nach Krippendorff: ≥ 0.800 verlässlich, ≥ 0.667 nur vorläufige Schlüsse.", "");
  }
  const sens = sensitivity(results);
  lines.push(
    "## Sensitivität der Parameter",
    "",
    "Spearman-Korrelation aller Beiträge mit den gewählten Parametern und mittlere Änderung in Punkten.",
    "",
    "| Variante | Spearman rho | mittlere Änderung |",
    "|---|---|---|",
    ...sens.map((v) => `| ${v.name} | ${fmt(v.rho)} | ${v.meanChange.toFixed(1)} Pkt. |`),
    ""
  );
  if (warnings.length) lines.push("## Hinweise", "", ...warnings.map((w) => `- ${w}`), "");
  lines.push(`## Zu besprechen (${discuss.length})`, "");
  discuss.forEach(({ pair, codes, differs }) => {
    lines.push(`### ${pair.title} – ${SKILLS[pair.skillId]?.label ?? pair.skillId}`, `Abweichung bei: ${differs.join(", ")}`, "");
    lines.push("| Codierer/in | Zeitanteil | Bloom | Prüfung | ECTS | Beitrag | Belegstelle / Kommentar |", "|---|---|---|---|---|---|---|");
    codes.forEach((c) =>
      lines.push(
        `| ${c.code} | ${c.share ?? "–"} | ${c.bloom ?? "–"} ${bloomName(c.bloom)} | ${c.assessed ?? "–"} | ${c.ects ?? "–"} | ${
          c.contribution ?? "–"
        } | ${[c.evidence, c.comment].filter(Boolean).join(" · ").replace(/\|/g, "/")} |`
      )
    );
    lines.push("");
  });
  return lines.join("\n");
}

async function main() {
  const args = process.argv.slice(2);
  const dir = args.find((a) => !a.startsWith("--"));
  if (!dir) {
    console.error("Aufruf: node scripts/contribution/evaluate.mjs <Ordner> [--out <json>] [--report <md>]");
    process.exit(1);
  }
  const opt = (name, fallback) => {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] : fallback;
  };
  const evaluation = evaluate(await readCodings(resolve(dir)));
  const out = resolve(opt("--out", RESULTS_FILE));
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(evaluation.results, null, 2)}\n`);
  const reportFile = resolve(opt("--report", join(dir, "Auswertung.md")));
  writeFileSync(reportFile, report(evaluation));
  console.log(`Ergebnisse: ${out}`);
  console.log(`Bericht (lokal): ${reportFile}`);
  if (evaluation.results.alpha) {
    Object.entries(evaluation.results.alpha).forEach(([k, a]) => console.log(`  Alpha ${k}: ${fmt(a)} (${alphaVerdict(a)})`));
  }
  console.log(`  Zu besprechen: ${evaluation.discuss.length} Paare`);
  evaluation.warnings.forEach((w) => console.warn(`  Hinweis: ${w}`));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
