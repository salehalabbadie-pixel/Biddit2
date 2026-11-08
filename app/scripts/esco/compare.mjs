// Usage: node compare.mjs <catalog.js> <occDir> <out.json>
// Derives essential/optional per role from ESCO occupation profiles and compares
// with the current catalog. Writes the full result as JSON and prints a summary.
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { SKILL_MAP, ROLE_MAP } from "./mapping.mjs";

const [catalogPath, occDir, outPath] = process.argv.slice(2);
const { SKILLS, ROLES } = await import(pathToFileURL(catalogPath).href);

// Sanity: every catalog skill mapped, no ESCO title used twice.
const owner = new Map();
for (const [id, m] of Object.entries(SKILL_MAP)) {
  for (const t of [m.core[0], ...m.variants].filter(Boolean)) {
    if (owner.has(t)) throw new Error(`"${t}" used by ${owner.get(t)} and ${id}`);
    owner.set(t, id);
  }
}
const missing = Object.keys(SKILLS).filter((id) => !SKILL_MAP[id]);
if (missing.length) throw new Error(`unmapped skills: ${missing}`);

const occ = (id) => JSON.parse(fs.readFileSync(`${occDir}/${id}.json`, "utf8"));

const result = [];
for (const role of ROLES) {
  const rm = ROLE_MAP[role.id];
  const occs = rm.occ.map(occ);
  const ess = new Set(occs.flatMap((o) => o.essential.map((s) => s.title)));
  const opt = new Set(occs.flatMap((o) => o.optional.map((s) => s.title)));

  const esco = {}; // skillId -> { level, evidence[] }
  for (const [id, m] of Object.entries(SKILL_MAP)) {
    const titles = [m.core[0], ...m.variants].filter(Boolean);
    const e = titles.filter((t) => ess.has(t));
    const o = titles.filter((t) => opt.has(t));
    if (e.length) esco[id] = { level: "essential", evidence: e };
    else if (o.length) esco[id] = { level: "optional", evidence: o };
  }

  const current = {};
  role.essential.forEach((id) => (current[id] = "essential"));
  role.optional.forEach((id) => (current[id] = "optional"));

  const ids = [...new Set([...Object.keys(current), ...Object.keys(esco)])];
  const rows = ids.map((id) => ({
    skill: id,
    current: current[id] ?? "-",
    esco: esco[id]?.level ?? "-",
    evidence: esco[id]?.evidence ?? [],
  }));
  const agree = rows.filter((r) => r.current === r.esco).length;
  result.push({
    role: role.id,
    label: role.label,
    occupations: occs.map((o) => ({ title: o.title, code: o.code, uri: o.uri, de: o.de })),
    fit: rm.fit,
    note: rm.note,
    rows,
    agree,
    total: rows.length,
  });
}

fs.writeFileSync(outPath, JSON.stringify({ skills: SKILL_MAP, roles: result }, null, 2));

for (const r of result) {
  console.log(`\n## ${r.label}  ->  ${r.occupations.map((o) => o.title).join(" + ") || "(kein ESCO-Beruf)"}  [${r.fit}]  Übereinstimmung ${r.agree}/${r.total}`);
  for (const row of r.rows.sort((a, b) => a.skill.localeCompare(b.skill))) {
    const flag = row.current === row.esco ? "  " : "≠ ";
    console.log(`  ${flag}${row.skill.padEnd(26)} heute: ${row.current.padEnd(9)} ESCO: ${row.esco.padEnd(9)} ${row.evidence.join("; ")}`);
  }
}
