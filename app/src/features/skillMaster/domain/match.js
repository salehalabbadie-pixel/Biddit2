/**
 * Pure Skill-Master logic: target levels, gaps, course match and AI badge.
 * No React, no state, so every rule here is unit-tested in isolation.
 */
import { courseKey, courseRootKey } from "../../../domain/course";

export const TARGET_BY_IMPORTANCE = { essential: 80, optional: 50 };
export const LEVEL_BY_SELF_ASSESSMENT = { none: 0, basic: 40, solid: 70 };
export const MATCH_THRESHOLD = 50;
export const AI_BADGE = {
  resilient: { label: "KI-resilient", max: 35 },
  partial: { label: "Teilweise automatisierbar", max: 55 },
  strong: { label: "Stark automatisierbar", max: 100 },
};

/** Highest level any chosen role asks for, per skill id. */
export function targetLevels(roles, roleIds) {
  const targets = {};
  roles
    .filter((role) => roleIds.includes(role.id))
    .forEach((role) => {
      Object.entries(TARGET_BY_IMPORTANCE).forEach(([importance, level]) => {
        (role[importance] || []).forEach((skillId) => {
          targets[skillId] = Math.max(targets[skillId] || 0, level);
        });
      });
    });
  return targets;
}

/** Self-assessment ("none" | "basic" | "solid") as levels 0–100. */
export function currentLevels(selfAssessment) {
  const levels = {};
  Object.entries(selfAssessment || {}).forEach(([skillId, answer]) => {
    levels[skillId] = LEVEL_BY_SELF_ASSESSMENT[answer] ?? 0;
  });
  return levels;
}

/** Points missing to the target, never negative. */
export function gaps(targets, levels) {
  const result = {};
  Object.entries(targets).forEach(([skillId, target]) => {
    result[skillId] = Math.max(0, target - (levels[skillId] || 0));
  });
  return result;
}

/** Index the semester file by course number and by root key. */
export function indexSkillData(skillData) {
  const index = new Map();
  (skillData?.courses || []).forEach((entry) => {
    if (entry.courseNumber) index.set(entry.courseNumber, entry);
    if (entry.rootKey && !index.has(entry.rootKey)) {
      index.set(entry.rootKey, entry);
    }
  });
  return index;
}

/** Skills of one course, or null when the semester file has no entry. */
export function skillsForCourse(index, course) {
  if (!index || !course) return null;
  const entry =
    index.get(courseKey(course)) || index.get(courseRootKey(course));
  if (!entry) return null;
  return entry.skills.filter((skill) => skill.status !== "rejected");
}

/**
 * Share of a course's skill contribution that closes open gaps (0–100).
 * A course that only trains skills already at target scores low.
 */
export function roleFit(skills, gapMap) {
  if (!skills || skills.length === 0) return null;
  const total = skills.reduce((sum, s) => sum + s.contribution, 0);
  if (total === 0) return 0;
  const closing = skills.reduce(
    (sum, s) => sum + Math.min(s.contribution, gapMap[s.escoUri] || 0),
    0
  );
  return Math.round(100 * (0.65 * (closing / total) + 0.35 * Math.min(1, closing / 40)));
}

/** Match = 60 % role fit + 40 % interest fit; role fit alone without interests. */
export function matchScore(fit, interestFit = null) {
  if (fit === null) return null;
  if (interestFit === null) return fit;
  return Math.round(0.6 * fit + 0.4 * interestFit);
}

/** AI automation of a course, weighted by each skill's contribution. */
export function aiScore(skills) {
  if (!skills || skills.length === 0) return null;
  const total = skills.reduce((sum, s) => sum + s.contribution, 0);
  if (total === 0) return null;
  return Math.round(
    skills.reduce((sum, s) => sum + s.contribution * s.aiAutomation, 0) / total
  );
}

export function aiBadge(score) {
  if (score === null) return null;
  if (score <= AI_BADGE.resilient.max) return "resilient";
  if (score <= AI_BADGE.partial.max) return "partial";
  return "strong";
}

/** Levels after the planned courses, capped at 100. */
export function levelsWithPlan(levels, plannedSkillLists) {
  const result = { ...levels };
  plannedSkillLists.forEach((skills) => {
    (skills || []).forEach((s) => {
      result[s.escoUri] = Math.min(100, (result[s.escoUri] || 0) + s.contribution);
    });
  });
  return result;
}

/** Share of all open gap points that the plan closes (0–100). */
export function gapCoverage(targets, levels, planned) {
  const open = gaps(targets, levels);
  const totalGap = Object.values(open).reduce((sum, g) => sum + g, 0);
  if (totalGap === 0) return 100;
  const closed = Object.keys(open).reduce(
    (sum, id) =>
      sum + Math.min(open[id], Math.max(0, (planned[id] || 0) - (levels[id] || 0))),
    0
  );
  return Math.round((100 * closed) / totalGap);
}
