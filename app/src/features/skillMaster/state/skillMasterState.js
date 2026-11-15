/**
 * Skill-Master client state on Jotai (ADR 0013): new code starts on the
 * library the app is moving to, so the migration never has to touch it.
 * Provider-less atoms use Jotai's default store, so main.jsx stays unchanged.
 */
import { useEffect, useMemo, useState } from "react";
import { atom, useAtomValue } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { useRecoilValue } from "recoil";
import { semesterCourseDataSelector } from "../../../components/recoil/unifiedCourseDataSelectors";
import { unifiedAcademicDataState } from "../../../components/recoil/unifiedAcademicDataAtom";
import { sameCourse } from "../../../domain/course";
import { toEcts } from "../../../domain/credits";
import { ROLES } from "../data/catalog";
import {
  LEVEL_BY_SELF_ASSESSMENT,
  MATCH_THRESHOLD,
  aiBadge,
  aiScore,
  currentLevels,
  gapCoverage,
  gaps,
  indexSkillData,
  levelsWithPlan,
  matchScore,
  rankSkills,
  roleFit,
  skillsForCourse,
  targetLevels,
} from "../domain/match";
import { interestFit, interestSkillSet, matchPastCourses } from "../domain/profile";

/** At most this many target jobs can be chosen at once. */
export const MAX_ROLES = 3;

/**
 * The student's profile, kept in this browser only:
 * - roleIds: chosen target jobs (catalogue roles or own jobs), at most MAX_ROLES
 * - customRoles: own jobs derived from a pasted job ad [{ id, label, essential, optional }]
 * - selfAssessment: { skillId: "none" | "basic" | "solid" } from the Skill-Gap tab
 * - cvSkills / cvFile: skill ids the student kept from the CV analysis (never the CV text)
 * - interestAreas / interestSkills: chosen interest areas and typed interests
 */
export const EMPTY_PROFILE = {
  roleIds: [],
  customRoles: [],
  selfAssessment: {},
  cvSkills: [],
  cvFile: null,
  interestAreas: [],
  interestSkills: [],
};
export const skillProfileAtom = atomWithStorage("skillMaster.profile", EMPTY_PROFILE);

/** Level a skill found in the CV counts for: the same as «Grundlagen». */
export const CV_LEVEL = LEVEL_BY_SELF_ASSESSMENT.basic;

/** Whether the profile wizard is open, and at which step (0–3) it starts. */
export const skillWizardAtom = atom({ open: false, step: 0 });

/**
 * Courses planned in the Skill-Gap tab («+ Planen»), per semester, until
 * «Plan ins Bidding übernehmen» moves them to the course selection.
 */
export const skillPlanAtom = atomWithStorage("skillMaster.plan", {});

/** «Nur ≥ 50 % Match» in the Skill Mapper list. Not stored: each visit starts with all courses. */
export const onlyStrongMatchAtom = atom(false);

/**
 * Section the Skill-Gap tab scrolls to when another view opens it
 * ("roles" | "gaps"), reset by the tab once it has scrolled.
 */
export const skillGapFocusAtom = atom(null);

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

/** Skill data of a semester: the file and an index by course number and root key. */
export function useSkillData(semester) {
  const [state, setState] = useState({ status: "loading", index: null, data: null });
  useEffect(() => {
    let active = true;
    if (!semester) {
      setState({ status: "none", index: null, data: null });
      return undefined;
    }
    setState({ status: "loading", index: null, data: null });
    loadSkillData(semester).then((data) => {
      if (!active) return;
      setState(
        data
          ? { status: "ready", index: indexSkillData(data), data }
          : { status: "none", index: null, data: null }
      );
    });
    return () => {
      active = false;
    };
  }, [semester]);
  return state;
}

/** Profile with defaults for the fields a profile stored by an older version lacks. */
function withDefaults(profile) {
  return { ...EMPTY_PROFILE, ...(profile || {}) };
}

/** Catalogue roles plus the student's own jobs. */
export function allRoles(profile) {
  return [...ROLES, ...(profile.customRoles || [])];
}

/** The chosen jobs that still exist (a stored profile may hold renamed ones). */
export function chosenRoles(profile) {
  const roles = allRoles(profile);
  return (profile.roleIds || [])
    .slice(0, MAX_ROLES)
    .map((id) => roles.find((role) => role.id === id))
    .filter(Boolean);
}

/** Targets and the levels the stored profile gives on its own (self-assessment, CV). */
export function useSkillProfile() {
  const stored = useAtomValue(skillProfileAtom);
  return useMemo(() => {
    const profile = withDefaults(stored);
    const targets = targetLevels(allRoles(profile), profile.roleIds.slice(0, MAX_ROLES));
    const levels = currentLevels(profile.selfAssessment);
    profile.cvSkills.forEach((id) => {
      levels[id] = Math.max(levels[id] || 0, CV_LEVEL);
    });
    return { profile, targets, levels, gapMap: gaps(targets, levels) };
  }, [stored]);
}

/** Graded courses of every program in the transcript. */
function transcriptCourses(academicData) {
  const courses = [];
  Object.values(academicData?.programs || {}).forEach((program) => {
    Object.values(program?.studyPlan?.semesterMap || {}).forEach((semester) => {
      const list = Array.isArray(semester) ? semester : semester?.completed || [];
      list
        .filter((course) => course?.grade !== null && course?.grade !== undefined)
        .forEach((course) => courses.push(course));
    });
  });
  return courses;
}

/**
 * The full Skill-Master picture for a semester: profile, past HSG courses with
 * skill data, levels (self-assessment, CV and past courses), gaps, interests and
 * `matchFor(course)`, which returns { match, jobFit, interestFit, skills } with the
 * skills ranked by relevance, or null when the course has no skill data. Match and
 * job fit are null without a job; interest fit is null without interests.
 */
export function useSkillContext(semester) {
  const { index, data, status } = useSkillData(semester);
  const { profile, targets, levels: ownLevels } = useSkillProfile();
  const semesterData = useRecoilValue(semesterCourseDataSelector(semester));
  const academicData = useRecoilValue(unifiedAcademicDataState);

  return useMemo(() => {
    const skillsOf = (course) => skillsForCourse(index, course);
    const past = matchPastCourses(
      transcriptCourses(academicData),
      data,
      semesterData.available || [],
      skillsOf
    );
    const levels = levelsWithPlan(
      ownLevels,
      past.matched.map((course) => course.skills)
    );
    const gapMap = gaps(targets, levels);
    const hasRole = chosenRoles(profile).length > 0;
    const interests = interestSkillSet(profile.interestAreas, profile.interestSkills);
    const matchFor = (course) => {
      const skills = skillsOf(course);
      if (!skills) return null;
      const jobFit = hasRole ? roleFit(skills, gapMap) : null;
      const interest = interestFit(skills, interests);
      return {
        skills: rankSkills(skills, targets, gapMap),
        match: hasRole ? matchScore(jobFit, interest) : null,
        jobFit,
        interestFit: interest,
      };
    };
    return { status, data, profile, targets, levels, gapMap, hasRole, interests, past, matchFor };
  }, [index, data, status, profile, targets, ownLevels, semesterData.available, academicData]);
}

/** `matchFor`, load status and whether a job is chosen; see useSkillContext. */
export function useSkillMatch(semester) {
  const { matchFor, status, hasRole } = useSkillContext(semester);
  return { matchFor, status, hasRole };
}

const inList = (ids, course) => ids.some((id) => sameCourse(course, { id }));

/** Status of a course in «Gebucht und geplant». */
export const PLAN_STATUS = { enrolled: "gebucht", selected: "Gebot läuft", planned: "geplant" };

/**
 * Everything the Skill-Gap tab, the Skill-Profil card and the wizard summarise
 * for a semester: rated courses; the plan (enrolled, selected for bidding and
 * planned here) with a status per course; gap coverage of that plan; strong
 * matches; verified skills (target skills that past or enrolled courses train,
 * as their Merkblätter state); ECTS and the KI-resilient share of the plan.
 */
export function useSkillOverview(semester) {
  const context = useSkillContext(semester);
  const semesterData = useRecoilValue(semesterCourseDataSelector(semester));
  const planBySemester = useAtomValue(skillPlanAtom);
  return useMemo(() => {
    const { matchFor, targets, levels, past } = context;
    // A semester entry may lack a list (partly loaded data); treat it as empty.
    const enrolledIds = semesterData.enrolledIds || [];
    const selectedIds = semesterData.selectedIds || [];
    const available = semesterData.available || [];
    const planIds = planBySemester[semester] || [];
    const statusOf = (course) =>
      inList(enrolledIds, course)
        ? "enrolled"
        : inList(selectedIds, course)
        ? "selected"
        : inList(planIds, course)
        ? "planned"
        : null;
    const rated = available
      .map((course) => ({ course, result: matchFor(course) }))
      .filter((entry) => entry.result);
    const planned = rated
      .map((entry) => ({ ...entry, status: statusOf(entry.course) }))
      .filter((entry) => entry.status)
      .sort((a, b) => (b.result.match ?? -1) - (a.result.match ?? -1));
    const withPlan = levelsWithPlan(
      levels,
      planned.map((entry) => entry.result.skills)
    );
    const verified = new Set();
    [
      ...past.matched.map((c) => c.skills),
      ...planned.filter((e) => e.status === "enrolled").map((e) => e.result.skills),
    ].forEach((skills) =>
      skills.forEach((s) => {
        if (targets[s.escoUri]) verified.add(s.escoUri);
      })
    );
    const resilient = planned.filter(
      (entry) => aiBadge(aiScore(entry.result.skills)) === "resilient"
    ).length;
    return {
      ...context,
      rated,
      planned,
      plannedIds: [...enrolledIds, ...selectedIds, ...planIds],
      selectedIds,
      newlyPlanned: planned.filter((entry) => entry.status === "planned"),
      withPlan,
      coverage: gapCoverage(targets, levels, withPlan),
      strongMatches: rated.filter((entry) => (entry.result.match ?? 0) >= MATCH_THRESHOLD)
        .length,
      verified,
      verifiedSkills: verified.size,
      ects: planned.reduce((sum, entry) => sum + (toEcts(entry.course.credits) || 0), 0),
      resilientShare: planned.length ? Math.round((100 * resilient) / planned.length) : null,
    };
  }, [context, semesterData, planBySemester, semester]);
}
