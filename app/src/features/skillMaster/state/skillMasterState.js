/**
 * Skill-Master client state on Jotai (ADR 0013): new code starts on the
 * library the app is moving to, so the migration never has to touch it.
 * Provider-less atoms use Jotai's default store, so main.jsx stays unchanged.
 */
import { useEffect, useMemo, useState } from "react";
import { useAtomValue } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { ROLES } from "../data/catalog";
import {
  currentLevels,
  gaps,
  indexSkillData,
  matchScore,
  roleFit,
  skillsForCourse,
  targetLevels,
} from "../domain/match";

/** Chosen roles and self-assessment, kept in the browser for the demo. */
export const skillProfileAtom = atomWithStorage("skillMaster.profile", {
  roleIds: [],
  selfAssessment: {},
});

const SUPPORTED_SCHEMA = "1.0";
const cache = new Map();

/**
 * Loads `public/skill-master/<semester>.json` once per semester, the same way
 * the exam plans are loaded. A missing file means "no skill data", not an error.
 */
async function loadSkillData(semester) {
  if (!cache.has(semester)) {
    cache.set(
      semester,
      fetch(`/skill-master/${semester}.json`)
        .then(async (response) => {
          const type = response.headers.get("content-type") ?? "";
          if (!response.ok || !type.includes("application/json")) return null;
          const data = await response.json();
          return data?.schemaVersion === SUPPORTED_SCHEMA ? data : null;
        })
        .catch(() => null)
    );
  }
  return cache.get(semester);
}

/** Skill data of a semester as an index by course number and root key. */
export function useSkillData(semester) {
  const [state, setState] = useState({ status: "loading", index: null });
  useEffect(() => {
    let active = true;
    if (!semester) {
      setState({ status: "none", index: null });
      return undefined;
    }
    setState({ status: "loading", index: null });
    loadSkillData(semester).then((data) => {
      if (!active) return;
      setState(
        data
          ? { status: "ready", index: indexSkillData(data) }
          : { status: "none", index: null }
      );
    });
    return () => {
      active = false;
    };
  }, [semester]);
  return state;
}

/** Targets, current levels and gaps of the stored profile. */
export function useSkillProfile() {
  const profile = useAtomValue(skillProfileAtom);
  return useMemo(() => {
    const targets = targetLevels(ROLES, profile.roleIds);
    const levels = currentLevels(profile.selfAssessment);
    return { profile, targets, levels, gapMap: gaps(targets, levels) };
  }, [profile]);
}

/**
 * `matchFor(course)` returns { match, skills } for the semester, or null when
 * the course has no skill data or no role is chosen yet.
 */
export function useSkillMatch(semester) {
  const { index, status } = useSkillData(semester);
  const { profile, gapMap } = useSkillProfile();
  const hasRole = profile.roleIds.length > 0;
  const matchFor = useMemo(
    () => (course) => {
      const skills = skillsForCourse(index, course);
      if (!skills) return null;
      return { skills, match: hasRole ? matchScore(roleFit(skills, gapMap)) : null };
    },
    [index, gapMap, hasRole]
  );
  return { matchFor, status, hasRole };
}
