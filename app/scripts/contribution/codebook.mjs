/**
 * Coding scheme and scoring rule for the skill contribution of a course
 * (CODEBOOK.md explains them for the coders). Pure data and functions.
 *
 * A course's contribution to a skill is derived from three codes taken from
 * its Merkblatt (constructive alignment, Biggs 1996): the share of the course
 * spent on the skill, the highest Bloom level its learning objectives demand,
 * and whether the exam assesses it.
 */

/**
 * Revised Bloom taxonomy (Anderson & Krathwohl 2001). `cap` is the highest
 * level on the 0–100 skill scale a course can reach at that cognitive level;
 * the caps anchor the scale the app uses (target 80 = essential skill).
 */
export const BLOOM = [
  { level: 1, label: "Erinnern", cap: 15, verbs: "nennen, aufzählen, wiedergeben · list, name, recall" },
  { level: 2, label: "Verstehen", cap: 25, verbs: "erklären, beschreiben, einordnen · explain, describe, classify" },
  { level: 3, label: "Anwenden", cap: 40, verbs: "anwenden, durchführen, berechnen · apply, use, implement" },
  { level: 4, label: "Analysieren", cap: 60, verbs: "analysieren, vergleichen, untersuchen · analyse, compare, examine" },
  { level: 5, label: "Bewerten", cap: 70, verbs: "beurteilen, begründen, kritisieren · evaluate, assess, justify" },
  { level: 6, label: "Erschaffen", cap: 80, verbs: "entwickeln, gestalten, konzipieren · design, create, develop" },
];

/** Dropdown text per level, e.g. "3 Anwenden"; parseBloom reads the number back. */
export const BLOOM_CHOICES = BLOOM.map((b) => `${b.level} ${b.label}`);

/**
 * Project decisions of the scoring rule (README «Projektentscheide»), kept in
 * one place so a change is one edit and is documented with the results.
 * - hoursPerEcts: workload per ECTS credit (ECTS Users' Guide: 25–30 h; 30 assumed,
 *   to be checked against the HSG study regulations)
 * - fullHours: hours on a skill after which a course reaches the Bloom cap
 * - unassessedFactor: share of the gain kept when the exam does not assess the skill
 * - step: contributions are rounded to this step, as in the semester files
 */
export const PARAMS = { hoursPerEcts: 30, fullHours: 90, unassessedFactor: 0.75, step: 5 };

/**
 * Contribution (0–80) of one course to one skill:
 *   hours  = ECTS × hoursPerEcts × share / 100
 *   gain   = cap(bloom) × min(1, hours / fullHours) × (assessed > 0 ? 1 : unassessedFactor)
 * rounded to `step`. Returns null when a code is missing or invalid; 0 when the
 * share is 0 (the skill is not part of the course).
 */
export function contribution({ ects, share, bloom, assessed }, params = PARAMS) {
  const valid = (v, max) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max;
  if (!valid(ects, 30) || !valid(share, 100) || !valid(assessed, 100)) return null;
  if (share === 0) return 0;
  const level = BLOOM.find((b) => b.level === bloom);
  if (!level) return null;
  const hours = (ects * params.hoursPerEcts * share) / 100;
  const time = Math.min(1, hours / params.fullHours);
  const factor = assessed > 0 ? 1 : params.unassessedFactor;
  return Math.round((level.cap * time * factor) / params.step) * params.step;
}

/** Bloom level from a cell: 3, "3" or "3 Anwenden"; null when empty, NaN when invalid. */
export function parseBloom(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const level = Number(String(value).trim().split(/\s+/)[0]);
  return BLOOM.some((b) => b.level === level) ? level : Number.NaN;
}
