// Fetches reuse level, skill type and German label of every core ESCO concept.
// Usage: node reuse.mjs <occDir> <out.json>
import fs from "node:fs";
import { SKILL_MAP } from "./mapping.mjs";

const [occDir, outPath] = process.argv.slice(2);

// Resolve core URIs that the search did not return (e.g. "computer programming")
// from the skill lists of the downloaded occupations.
const byTitle = new Map();
for (const f of fs.readdirSync(occDir)) {
  const o = JSON.parse(fs.readFileSync(`${occDir}/${f}`, "utf8"));
  for (const s of [...o.essential, ...o.optional]) byTitle.set(s.title, s.uri);
}

const out = {};
for (const [id, m] of Object.entries(SKILL_MAP)) {
  const [title, uuid] = m.core;
  if (!title) { out[id] = { fit: m.fit }; continue; }
  const uri = uuid ? `http://data.europa.eu/esco/skill/${uuid}` : byTitle.get(title);
  const res = await fetch(`https://ec.europa.eu/esco/api/resource/skill?uri=${encodeURIComponent(uri)}&language=en`);
  const s = await res.json();
  out[id] = {
    fit: m.fit,
    title: s.title,
    uri: s.uri,
    de: s.preferredLabel?.de,
    type: s._links.hasSkillType?.[0]?.title,
    reuse: s._links.hasReuseLevel?.[0]?.title,
    group: s._links.broaderHierarchyConcept?.[0]?.title,
  };
  const r = out[id];
  console.log(`${id.padEnd(26)} ${String(r.reuse).padEnd(38)} ${String(r.type).padEnd(10)} ${r.title} | de: ${r.de}`);
}
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
