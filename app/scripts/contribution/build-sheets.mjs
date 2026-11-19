/**
 * Writes one coding sheet per coder.
 *
 * Usage (from app/):
 *   node scripts/contribution/build-sheets.mjs [--coders C1,C2] [--out <folder>]
 *   node scripts/contribution/build-sheets.mjs --coders KONSENS   # sheet for the agreed values
 * Default: coders C1 and C2, folder scripts/contribution/out/ (git-ignored).
 */
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSheet, codingUnits } from "./sheet.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};

const coders = opt("--coders", "C1,C2").split(",").map((c) => c.trim()).filter(Boolean);
const out = resolve(opt("--out", join(HERE, "out")));
mkdirSync(out, { recursive: true });

const units = codingUnits();
for (const code of coders) {
  const file = join(out, `Codierung_Beitrag_${units.semester}_${code}.xlsx`);
  await buildSheet({ units, code }).xlsx.writeFile(file);
  console.log(file);
}
console.log(`${units.courses.length} Kurse, ${units.pairs.length} Paare, Version ${units.version}`);
