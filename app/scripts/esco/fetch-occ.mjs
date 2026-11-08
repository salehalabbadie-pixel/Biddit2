// Usage: node fetch-occ.mjs <outDir> <id> [<id> ...]
// Saves each ESCO occupation (v1.2 API) as <outDir>/<id>.json with the fields we need.
import fs from "node:fs";

const [outDir, ...ids] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const API = "https://ec.europa.eu/esco/api/resource/occupation";

for (const id of ids) {
  const uri = `http://data.europa.eu/esco/occupation/${id}`;
  const res = await fetch(`${API}?uri=${encodeURIComponent(uri)}&language=en`);
  const o = await res.json();
  const pick = (list = []) => list.map((s) => ({ title: s.title, uri: s.uri }));
  const out = {
    id,
    uri,
    title: o.title,
    de: o.preferredLabel?.de,
    code: o.code,
    description: o.description?.en?.literal,
    essential: pick(o._links.hasEssentialSkill),
    optional: pick(o._links.hasOptionalSkill),
  };
  fs.writeFileSync(`${outDir}/${id}.json`, JSON.stringify(out, null, 2));
  console.log(`${out.title} (${out.code}) | de: ${out.de} | ess ${out.essential.length} / opt ${out.optional.length}`);
  console.log(`   ${(out.description || "").slice(0, 260).replace(/\s+/g, " ")}`);
}
