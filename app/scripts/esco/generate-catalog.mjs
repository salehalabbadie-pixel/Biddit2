// Generates catalog.js from the pre-ESCO catalog plus the ESCO review.
// Usage: node generate-catalog.mjs <source catalog.js> <occDir> <core-skills.json> <target catalog.js>
// - Skill labels follow the HSG fact sheets (LABELS); each skill gets `esco`:
//   "ESCO-konzipiert" with URI + German ESCO label when the ESCO concept fits exactly
//   or closely, otherwise "Kein eindeutiges ESCO-Konzept" (plus the nearest concept, if any).
// - ESCO-based roles take essential/optional from their ESCO occupation profile(s);
//   roles without ESCO equivalent keep their expert-defined skills.
// - ALWAYS_ESSENTIAL skills are essential in every role (project decision).
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { SKILL_MAP, ROLE_MAP, NEW_ROLES, ALWAYS_ESSENTIAL, LABELS } from "./mapping.mjs";

const [sourcePath, occDir, corePath, targetPath] = process.argv.slice(2);
const { SKILLS, ROLES } = await import(pathToFileURL(sourcePath).href);
const core = JSON.parse(fs.readFileSync(corePath, "utf8"));
const occ = (id) => JSON.parse(fs.readFileSync(`${occDir}/${id}.json`, "utf8"));
const q = JSON.stringify;
const key = (id) => (/^[a-z]+$/.test(id) ? id : q(id));

// --- skills ---------------------------------------------------------------
const skillLines = Object.entries(SKILLS).map(([id, s]) => {
  const c = core[id];
  let esco;
  if (c?.uri && (c.fit === "exact" || c.fit === "close")) {
    esco = `{ note: "ESCO-konzipiert", uri: ${q(c.uri)}, label: ${q(c.de)} }`;
  } else if (c?.uri) {
    esco = `{ note: "Kein eindeutiges ESCO-Konzept", nearest: { uri: ${q(c.uri)}, label: ${q(c.de)} } }`;
  } else {
    esco = `{ note: "Kein eindeutiges ESCO-Konzept" }`;
  }
  const label = LABELS[id] ?? s.label;
  return `  ${key(id)}: {\n    label: ${q(label)},\n    aiAutomation: ${s.aiAutomation},\n    esco: ${esco},\n  },`;
});

// --- roles ----------------------------------------------------------------
const derive = (occIds) => {
  const occs = occIds.map(occ);
  const ess = new Set(occs.flatMap((o) => o.essential.map((s) => s.title)));
  const opt = new Set(occs.flatMap((o) => o.optional.map((s) => s.title)));
  const essential = [], optional = [];
  for (const [id, m] of Object.entries(SKILL_MAP)) {
    if (!SKILLS[id]) continue;
    const titles = [m.core[0], ...m.variants].filter(Boolean);
    if (titles.some((t) => ess.has(t))) essential.push(id);
    else if (titles.some((t) => opt.has(t))) optional.push(id);
  }
  return { essential, optional, occs };
};

const withAlways = (essential, optional) => ({
  essential: [...new Set([...ALWAYS_ESSENTIAL, ...essential])],
  optional: optional.filter((id) => !ALWAYS_ESSENTIAL.includes(id)),
});

const list = (ids) => (ids.length ? `[\n${ids.map((i) => `      ${q(i)},`).join("\n")}\n    ]` : "[]");

const block = ({ id, label, esco, essential, optional }) =>
  `  {\n    id: ${q(id)},\n    label: ${q(label)},\n    esco: ${esco},\n    essential: ${list(essential)},\n    optional: ${list(optional)},\n  },`;

const escoBlock = (occs) =>
  `{\n      note: "ESCO-konzipiert",\n      occupations: [\n        ${occs
    .map((o) => `{ uri: ${q(o.uri)}, code: ${q(o.code)}, label: ${q(o.de)} }`)
    .join(",\n        ")},\n      ],\n    }`;

const roles = [
  ...ROLES.map((role) => ({ ...role, ...ROLE_MAP[role.id] })),
  ...NEW_ROLES.map((r) => ({ ...r, essential: [], optional: [] })),
].map((r) => {
  const id = r.rename?.id ?? r.id;
  const label = r.rename?.label ?? r.label;
  if (!r.occ.length) {
    return block({ id, label, esco: `{ note: "Kein eindeutiges ESCO-Konzept" }`, ...withAlways(r.essential, r.optional) });
  }
  const { essential, optional, occs } = derive(r.occ);
  return block({ id, label, esco: escoBlock(occs), ...withAlways(essential, optional) });
});

const out = `/**
 * Skill catalogue and target roles for the Skill-Master demo.
 *
 * Skill keys are the readable \`escoUri\` values used in the semester skill files.
 * Labels follow the terminology of the HSG course fact sheets. \`esco\` marks
 * whether the skill is "ESCO-konzipiert" (URI + German ESCO label of the matching
 * ESCO v1.2 concept) or has "Kein eindeutiges ESCO-Konzept" (nearest concept, if any).
 * \`aiAutomation\` is the share (0–100) of the skill that AI can automate today;
 * it is maintained here per skill, not re-estimated on every extraction run.
 */
export const SKILLS = {
${skillLines.join("\n")}
};

/**
 * Target roles. Labels follow Swiss usage. For "ESCO-konzipiert" roles,
 * essential/optional are taken from the referenced ESCO occupation profile(s):
 * a catalog skill counts when its ESCO concept or a closely related ESCO skill
 * is listed there. Roles with "Kein eindeutiges ESCO-Konzept" keep an
 * expert-defined skill set. By project decision, ${ALWAYS_ESSENTIAL.map((s) => `"${s}"`).join(", ")} is
 * essential in every role. Essential and optional become target levels 80 and 50.
 */
export const ROLES = [
${roles.join("\n")}
];
`;
fs.writeFileSync(targetPath, out);
console.log("written", Object.keys(SKILLS).length, "skills,", roles.length, "roles");
