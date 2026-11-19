/**
 * Writes the evaluated contributions into the semester skill file. Only the
 * "contribution" numbers change (and "status" becomes "rejected" where the
 * coding found the skill not to be part of the course); formatting and line
 * endings stay as they are.
 *
 * Usage (from app/):
 *   node scripts/contribution/sync-semester-file.mjs [--results <json>] [--dry-run]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { RESULTS_FILE } from "./evaluate.mjs";
import { SEMESTER_FILE } from "./sheet.mjs";

/** Contribution per course number and skill, for every number of a cross-listed course. */
function lookup(results) {
  const map = new Map();
  Object.values(results.pairs).forEach((p) => {
    if (p.contribution === null) return;
    p.numbers.forEach((number) => map.set(`${number}|${p.skillId}`, p.contribution));
  });
  return map;
}

/** { text, changes } with the contributions of `results` applied to the semester file text. */
export function syncText(text, results) {
  const values = lookup(results);
  let changes = 0;
  // Each course block runs from its "courseNumber" to the next one.
  const starts = [...text.matchAll(/"courseNumber":\s*"([^"]+)"/g)];
  let out = text.slice(0, starts[0]?.index ?? text.length);
  starts.forEach((match, i) => {
    const end = i + 1 < starts.length ? starts[i + 1].index : text.length;
    const block = text.slice(match.index, end).replace(/\{[^{}]*?"escoUri":\s*"([^"]+)"[^{}]*\}/g, (skill, id) => {
      const value = values.get(`${match[1]}|${id}`);
      if (value === undefined) return skill;
      let next = skill.replace(/("contribution":\s*)\d+/, `$1${value}`);
      if (value === 0) next = next.replace(/("status":\s*)"[^"]*"/, `$1"rejected"`);
      if (next !== skill) changes += 1;
      return next;
    });
    out += block;
  });
  return { text: out, changes };
}

function main() {
  const args = process.argv.slice(2);
  const i = args.indexOf("--results");
  const results = JSON.parse(readFileSync(resolve(i >= 0 ? args[i + 1] : RESULTS_FILE), "utf8"));
  const original = readFileSync(SEMESTER_FILE, "utf8");
  const { text, changes } = syncText(original, results);
  if (args.includes("--dry-run")) {
    console.log(`${changes} Skills würden geändert (Trockenlauf, nichts geschrieben).`);
    return;
  }
  writeFileSync(SEMESTER_FILE, text);
  console.log(`${changes} Skills in ${SEMESTER_FILE} aktualisiert. Danach: node scripts/check-skill-data.mjs`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
