// Evaluates the returned questionnaires of one round.
// Run from app/:
//   node scripts/ai-exposure/evaluate.mjs <folder with returned .xlsx files>
// Writes
//   scripts/ai-exposure/data/results-r<round>.json   aggregated values only (may be committed)
//   <folder>/Auswertung-Runde<round>.md              report incl. comments (stays local)
// Options: --out <json>, --report <md>
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { SKILLS } from "../../src/features/skillMaster/data/catalog.js";
import { CONFIDENCE, catalogVersion, readResponses } from "./questionnaire.mjs";
import { MIN_RATINGS, consensus, describe, icc } from "./stats.mjs";

const THIS_FILE = fileURLToPath(import.meta.url);
const HERE = dirname(THIS_FILE);
const round2 = (x) => (x == null ? null : Math.round(x * 100) / 100);

/** Pure evaluation of parsed responses; returns { results, warnings, comments }. */
export function evaluate(responses, skills = SKILLS, version = catalogVersion(skills)) {
  const warnings = [];
  const rounds = new Set(responses.map((r) => r.round));
  if (rounds.size > 1) warnings.push(`Antworten aus verschiedenen Runden gemischt: ${[...rounds].join(", ")}`);
  const round = [...rounds][0] ?? 1;

  const seen = new Set();
  for (const r of responses) {
    const who = r.code ?? r.file;
    if (r.code && seen.has(r.code)) warnings.push(`Teilnehmer-Code ${r.code} kommt mehrfach vor`);
    if (r.code) seen.add(r.code);
    if (r.catalogVersion !== version) {
      warnings.push(`${who}: Fragebogen zu Katalog-Version ${r.catalogVersion}, aktuell ${version}`);
    }
    for (const p of r.problems) warnings.push(`${who}: ${p}`);
    for (const id of Object.keys(r.ratings)) if (!skills[id]) warnings.push(`${who}: Skill «${id}» nicht im Katalog`);
  }

  const skillResults = {};
  const comments = {};
  for (const [id, s] of Object.entries(skills)) {
    const given = responses.map((r) => r.ratings[id]).filter((x) => x?.value != null);
    const stats = describe(given.map((x) => x.value));
    skillResults[id] = {
      label: s.label,
      ...stats,
      consensus: consensus(stats.iqr),
      confidence: Object.fromEntries(CONFIDENCE.map((c) => [c, given.filter((x) => x.confidence === c).length])),
    };
    comments[id] = responses
      .map((r) => r.ratings[id])
      .filter((x) => x?.comment)
      .map((x) => (x.value != null ? `(${x.value}) ${x.comment}` : x.comment));
    if (stats.n < MIN_RATINGS) warnings.push(`${id}: nur ${stats.n} Bewertungen (mindestens ${MIN_RATINGS})`);
  }

  // Agreement over the skills every participant rated.
  const ids = Object.keys(skills).filter((id) => responses.every((r) => r.ratings[id]?.value != null));
  const agreement = icc(ids.map((id) => responses.map((r) => r.ratings[id].value)));

  const fields = {};
  for (const r of responses) fields[r.field ?? "keine Angabe"] = (fields[r.field ?? "keine Angabe"] ?? 0) + 1;

  const results = {
    method:
      "HSG-Expertenpanel (Delphi). Median der Bewertungen 0–100; Definition siehe scripts/ai-exposure/README.md.",
    round,
    created: new Date().toISOString().slice(0, 10),
    catalogVersion: version,
    minRatings: MIN_RATINGS,
    experts: {
      n: responses.length,
      fields,
      aiExperienceMedian: describe(responses.map((r) => r.aiExperience).filter((x) => x != null)).median ?? null,
    },
    agreement: agreement && {
      icc21: round2(agreement.single),
      icc2k: round2(agreement.average),
      skills: agreement.skills,
      experts: agreement.experts,
    },
    skills: skillResults,
  };
  return { results, warnings, comments };
}

/** Markdown report for the project team; contains comments, so it stays with the raw answers. */
export function report({ results, warnings, comments }) {
  const rows = Object.entries(results.skills).sort(([, a], [, b]) => (b.median ?? -1) - (a.median ?? -1));
  const a = results.agreement;
  const lines = [
    `# Auswertung KI-Exposition – Runde ${results.round}`,
    "",
    `Erstellt am ${results.created}, Katalog-Version ${results.catalogVersion}.`,
    `Antworten: ${results.experts.n} (${Object.entries(results.experts.fields).map(([f, n]) => `${f}: ${n}`).join(", ")}).`,
    a
      ? `Übereinstimmung (ICC, zweifach zufällig, absolute Übereinstimmung) über ${a.skills} vollständig bewertete Kompetenzen: ` +
        `einzelne Person ${a.icc21}, Mittel des Panels ${a.icc2k}.`
      : "Übereinstimmung (ICC): zu wenige vollständige Antworten.",
    "",
    "| Kompetenz | n | Median | Q1–Q3 | Min–Max | Konsens | Sicherheit (tief/mittel/hoch) |",
    "|---|---:|---:|---|---|---|---|",
    ...rows.map(
      ([, s]) =>
        `| ${s.label} | ${s.n} | ${s.median ?? "–"} | ${s.n ? `${s.q1}–${s.q3}` : "–"} | ${s.n ? `${s.min}–${s.max}` : "–"} | ` +
        `${s.consensus ?? "–"} | ${s.confidence.niedrig}/${s.confidence.mittel}/${s.confidence.hoch} |`
    ),
    "",
    "## Hinweise",
    "",
    ...(warnings.length ? warnings.map((w) => `- ${w}`) : ["- keine"]),
    "",
    "## Kommentare (ohne Teilnehmer-Code)",
    "",
  ];
  for (const [id, s] of rows) {
    if (!comments[id].length) continue;
    lines.push(`**${s.label}**`, "", ...comments[id].map((c) => `- ${c}`), "");
  }
  return lines.join("\n");
}

// Command line: only when run directly, not when imported by the test.
if (process.argv[1] && resolve(process.argv[1]) === THIS_FILE) {
  const { values: opt, positionals } = parseArgs({
    allowPositionals: true,
    options: { out: { type: "string" }, report: { type: "string" } },
  });
  const dir = positionals[0];
  if (!dir) {
    console.error("Aufruf: node scripts/ai-exposure/evaluate.mjs <Ordner mit den Antworten>");
    process.exit(1);
  }
  const responses = await readResponses(dir);
  if (responses.length === 0) {
    console.error(`Keine .xlsx-Dateien in ${dir}`);
    process.exit(1);
  }
  const evaluation = evaluate(responses);
  const { results, warnings } = evaluation;
  const out = opt.out ?? join(HERE, "data", `results-r${results.round}.json`);
  const md = opt.report ?? join(dir, `Auswertung-Runde${results.round}.md`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(results, null, 2)}\n`);
  writeFileSync(md, `${report(evaluation)}\n`);
  warnings.forEach((w) => console.warn(`Hinweis: ${w}`));
  const a = results.agreement;
  console.log(`${results.experts.n} Antworten, Runde ${results.round}`);
  console.log(a ? `ICC(2,1) ${a.icc21}, ICC(2,k) ${a.icc2k} über ${a.skills} Kompetenzen` : "ICC: zu wenige vollständige Antworten");
  console.log("geschrieben:", out);
  console.log("geschrieben:", md);
}
