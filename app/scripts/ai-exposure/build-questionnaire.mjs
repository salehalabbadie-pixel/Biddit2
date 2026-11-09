// Writes the expert questionnaire(s) as Excel files.
// Run from app/:
//   node scripts/ai-exposure/build-questionnaire.mjs --experts 12
//       round 1, one file per participant code P01 … P12 (own random skill order)
//   node scripts/ai-exposure/build-questionnaire.mjs
//       round 1, one empty template
//   node scripts/ai-exposure/build-questionnaire.mjs --round 2 \
//       --results scripts/ai-exposure/data/results-r1.json --responses <folder with round-1 answers>
//       round 2 (Delphi): one file per round-1 participant, with the panel median, the
//       middle 50 % and the participant's own round-1 value already filled in
// Options: --out <folder> (default scripts/ai-exposure/out), --codes P01,P02,
//          --contact "Name, E-Mail", --deadline "30. November 2026"
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { buildWorkbook, catalogVersion, questionnaireItems, readResponses } from "./questionnaire.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const { values: opt } = parseArgs({
  options: {
    out: { type: "string", default: join(HERE, "out") },
    experts: { type: "string" },
    codes: { type: "string" },
    round: { type: "string", default: "1" },
    results: { type: "string" },
    responses: { type: "string" },
    contact: { type: "string" },
    deadline: { type: "string" },
  },
});

const round = Number(opt.round);
const items = questionnaireItems();
const version = catalogVersion();
mkdirSync(opt.out, { recursive: true });

const write = async (code, prior) => {
  const wb = await buildWorkbook({ items, round, code, prior, version, contact: opt.contact, deadline: opt.deadline });
  const file = join(opt.out, `KI-Exposition_Runde${round}_${code ?? "Vorlage"}.xlsx`);
  await wb.xlsx.writeFile(file);
  console.log("geschrieben:", file);
};

if (round === 1) {
  const codes = opt.codes
    ? opt.codes.split(",").map((c) => c.trim()).filter(Boolean)
    : opt.experts
      ? Array.from({ length: Number(opt.experts) }, (_, i) => `P${String(i + 1).padStart(2, "0")}`)
      : [undefined];
  for (const code of codes) await write(code);
} else {
  if (!opt.results || !opt.responses) {
    console.error("Runde 2 braucht --results (Auswertung Runde 1) und --responses (Antworten Runde 1).");
    process.exit(1);
  }
  const results = JSON.parse(readFileSync(opt.results, "utf8"));
  if (results.catalogVersion !== version) {
    console.error(`Der Katalog hat sich seit Runde 1 geändert (${results.catalogVersion} → ${version}). Runde 2 abgebrochen.`);
    process.exit(1);
  }
  const responses = (await readResponses(opt.responses)).filter((r) => r.code);
  for (const r of responses) {
    const prior = new Map(
      Object.entries(results.skills).map(([id, s]) => [
        id,
        { median: s.median, q1: s.q1, q3: s.q3, own: r.ratings[id]?.value ?? null },
      ])
    );
    await write(r.code, prior);
  }
  if (responses.length === 0) console.warn("Keine Antworten mit Teilnehmer-Code gefunden.");
}
console.log(`${items.length} Kompetenzen, Katalog-Version ${version}`);
