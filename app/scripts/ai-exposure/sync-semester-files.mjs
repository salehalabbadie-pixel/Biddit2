// Copies `aiAutomation` from catalog.js into every semester skill file
// (public/skill-master/*.json), so course cards and the gap view show the same value.
// Only the numbers change; formatting and line endings of the files stay as they are.
// Run from app/ after regenerating the catalogue:
//   node scripts/ai-exposure/sync-semester-files.mjs
//   node scripts/check-skill-data.mjs
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SKILLS } from "../../src/features/skillMaster/data/catalog.js";

const THIS_FILE = fileURLToPath(import.meta.url);
const DIR = join(dirname(THIS_FILE), "..", "..", "public", "skill-master");

/** Returns the file text with each skill's aiAutomation set from `skills`, and the number of changes. */
export function syncText(text, skills = SKILLS) {
  let changes = 0;
  const out = text.replace(/("escoUri":\s*"([^"]+)"[^{}]*?"aiAutomation":\s*)(\d+)/g, (match, head, id, value) => {
    const target = skills[id]?.aiAutomation;
    if (target == null || Number(value) === target) return match;
    changes += 1;
    return `${head}${target}`;
  });
  return { text: out, changes };
}

if (process.argv[1] && resolve(process.argv[1]) === THIS_FILE) {
  for (const name of readdirSync(DIR).filter((f) => f.endsWith(".json"))) {
    const path = join(DIR, name);
    const { text, changes } = syncText(readFileSync(path, "utf8"));
    if (changes) writeFileSync(path, text);
    console.log(`${name}: ${changes} Werte angepasst`);
  }
}
