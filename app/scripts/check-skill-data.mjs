// Checks that the Skill-Master catalogue and the semester skill files fit together.
// Run from app/:  node scripts/check-skill-data.mjs            (all files)
//                 node scripts/check-skill-data.mjs HS26       (one semester)
// Exits 1 on errors; hints alone exit 0. Also runs in the test suite
// (scripts/__tests__/check-skill-data.test.js), so CI catches a mismatch.
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SKILLS, ROLES } from "../src/features/skillMaster/data/catalog.js";

// Plain paths, not URL objects: under the jsdom test environment `URL` is the
// browser class, which node:fs rejects.
const THIS_FILE = fileURLToPath(import.meta.url);
const DIR = join(dirname(THIS_FILE), "..", "public", "skill-master");
const STATUSES = new Set(["extracted", "confirmed", "rejected"]);
const COURSE_NUMBER = /^\d+,\d+,\d+\.\d+$/;

/** Reads every `<semester>.json` in public/skill-master (or just `only`). */
export function readSkillFiles(only) {
  return readdirSync(DIR)
    .filter((f) => f.endsWith(".json") && (!only || f === `${only}.json`))
    .map((name) => ({ name, text: readFileSync(join(DIR, name), "utf8") }));
}

/**
 * Pure check of a catalogue against skill files.
 * `files` is a list of { name, text } with the raw JSON text.
 * Returns { errors, warnings, summary } as lists of German messages.
 */
export function checkSkillData({ skills = SKILLS, roles = ROLES, files }) {
  const errors = [];
  const warnings = [];
  const summary = [];

  // Roles may only name skills that exist in the catalogue.
  const roleIds = new Set();
  for (const role of roles) {
    if (roleIds.has(role.id)) errors.push(`Rolle «${role.id}» kommt doppelt vor`);
    roleIds.add(role.id);
    for (const id of [...(role.essential || []), ...(role.optional || [])]) {
      if (!skills[id]) errors.push(`Rolle «${role.label}» nennt den Skill «${id}», der in SKILLS fehlt`);
    }
  }

  if (files.length === 0) errors.push("Keine Datei in public/skill-master gefunden");

  const usedSkills = new Set();
  for (const file of files) {
    let data;
    try {
      data = JSON.parse(file.text);
    } catch (e) {
      errors.push(`${file.name}: kein gültiges JSON (${e.message})`);
      continue;
    }
    if (data.schemaVersion !== "1.0") errors.push(`${file.name}: schemaVersion muss "1.0" sein`);

    const seen = new Set();
    const byTitle = new Map(); // title -> first course with that title
    for (const course of data.courses || []) {
      const name = `${file.name} › ${course.title || course.courseNumber}`;
      if (!COURSE_NUMBER.test(course.courseNumber || "")) {
        errors.push(`${name}: courseNumber «${course.courseNumber}» hat nicht die Form 7,123,1.00`);
      } else {
        const root = course.courseNumber.split(",").slice(0, 2).join(",");
        if (course.rootKey !== root) errors.push(`${name}: rootKey muss «${root}» sein`);
        if (seen.has(course.courseNumber)) errors.push(`${name}: courseNumber kommt doppelt vor`);
        seen.add(course.courseNumber);
      }
      if (!course.title) warnings.push(`${name}: kein Titel eingetragen`);

      // Cross-listed courses (e.g. 7,019 | 8,023) are stored under each number
      // with the same title; their skills must stay identical.
      if (course.title) {
        const twin = byTitle.get(course.title);
        if (!twin) byTitle.set(course.title, course);
        else if (JSON.stringify(twin.skills) !== JSON.stringify(course.skills)) {
          errors.push(
            `${name}: Skills weichen vom gleichnamigen Kurs ${twin.courseNumber} ab (Doppelnummer muss identisch sein)`
          );
        }
      }

      if (!Array.isArray(course.skills) || course.skills.length === 0) {
        warnings.push(`${name}: keine Skills eingetragen`);
        continue;
      }
      for (const s of course.skills) {
        usedSkills.add(s.escoUri);
        if (!skills[s.escoUri]) errors.push(`${name}: Skill «${s.escoUri}» fehlt in SKILLS (catalog.js)`);
        if (!(s.contribution >= 0 && s.contribution <= 100)) {
          errors.push(`${name}: contribution von «${s.escoUri}» muss 0 bis 100 sein`);
        }
        if (!(s.aiAutomation >= 0 && s.aiAutomation <= 100)) {
          errors.push(`${name}: aiAutomation von «${s.escoUri}» muss 0 bis 100 sein`);
        } else if (skills[s.escoUri] && skills[s.escoUri].aiAutomation !== s.aiAutomation) {
          // The gap view reads the catalogue, course cards read this file: both must agree.
          errors.push(
            `${name}: aiAutomation von «${s.escoUri}» ist ${s.aiAutomation}, im Katalog ${skills[s.escoUri].aiAutomation}`
          );
        }
        if (!STATUSES.has(s.status)) {
          errors.push(`${name}: status von «${s.escoUri}» muss extracted, confirmed oder rejected sein`);
        }
        if (!s.evidence) warnings.push(`${name}: «${s.escoUri}» hat keinen Beleg (evidence)`);
      }
    }
    summary.push(`${file.name}: ${(data.courses || []).length} Kurse geprüft`);
  }

  for (const id of Object.keys(skills)) {
    const inRole = roles.some((r) => [...(r.essential || []), ...(r.optional || [])].includes(id));
    if (!inRole && !usedSkills.has(id)) {
      warnings.push(`Skill «${id}» wird weder von einer Rolle noch von einem Kurs genutzt`);
    }
  }

  return { errors, warnings, summary };
}

// Command line: only when run directly, not when imported by the test.
if (process.argv[1] && resolve(process.argv[1]) === THIS_FILE) {
  const only = process.argv[2];
  const { errors, warnings, summary } = checkSkillData({ files: readSkillFiles(only) });
  summary.forEach((line) => console.log(line));
  warnings.forEach((w) => console.warn(`Hinweis: ${w}`));
  errors.forEach((e) => console.error(`Fehler:  ${e}`));
  console.log(
    errors.length
      ? `\n${errors.length} Fehler, ${warnings.length} Hinweise`
      : `\nAlles passt (${warnings.length} Hinweise)`
  );
  process.exit(errors.length ? 1 : 0);
}
