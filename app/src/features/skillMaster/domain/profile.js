/**
 * Pure profile logic the whole app needs: past HSG courses, interest areas and
 * interest fit. The text analysis (CV, job ads, typed input) lives in
 * textAnalysis.js, which only the wizard loads.
 */
import { INTEREST_AREAS } from "../data/interests";

/** Lower case, umlauts folded, punctuation as spaces (keeps & / + for "s&op", "c++"). */
export function normalize(text) {
  return ` ${String(text ?? "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9&/+\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `;
}

/** Title without course-type prefixes ("FPV:", "Methods:" …), for name matching. */
function titleKey(title) {
  return normalize(String(title ?? "").replace(/^\s*[A-Za-zÄÖÜäöü]{2,10}:\s*/, "")).trim();
}

/**
 * Past HSG courses with skill data. A transcript course is matched by name to
 * an entry of the semester's skill file (German title) or to a catalogue course
 * whose German or English name is the same; courses repeat every year, so the
 * current Merkblatt stands in for the one the student attended.
 * Returns { matched: [{ name, semester, skills }], unmatched: number }.
 */
export function matchPastCourses(pastCourses, skillData, catalogCourses, skillsForCourse) {
  const byTitle = new Map();
  (skillData?.courses || []).forEach((entry) => {
    if (entry.title) byTitle.set(titleKey(entry.title), entry.skills);
  });
  (catalogCourses || []).forEach((course) => {
    const skills = skillsForCourse(course);
    if (!skills) return;
    [course.shortName, course.title, course.classification].forEach((name) => {
      if (name && !byTitle.has(titleKey(name))) byTitle.set(titleKey(name), skills);
    });
  });

  const matched = [];
  let unmatched = 0;
  const seen = new Set();
  (pastCourses || []).forEach((course) => {
    const name = course.name || course.shortName || course.description;
    const key = titleKey(name);
    if (!name || seen.has(key)) return;
    seen.add(key);
    const skills = byTitle.get(key);
    if (skills) {
      matched.push({
        name,
        semester: course.semester ?? null,
        skills: skills.filter((s) => s.status !== "rejected"),
      });
    } else {
      unmatched += 1;
    }
  });
  return { matched, unmatched };
}

/**
 * Interest areas ranked by how much the given courses train them, most first.
 * Only areas with some contribution are returned: the suggestions in step 3.
 */
export function areasFromCourses(skillLists) {
  const weight = {};
  skillLists.forEach((skills) =>
    (skills || []).forEach((s) => {
      weight[s.escoUri] = (weight[s.escoUri] || 0) + s.contribution;
    })
  );
  return INTEREST_AREAS.map((area) => ({
    area,
    weight: area.skills.reduce((sum, id) => sum + (weight[id] || 0), 0),
  }))
    .filter((entry) => entry.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .map((entry) => entry.area);
}

/** All skill ids behind the chosen areas and the typed interests. */
export function interestSkillSet(areaIds, typedSkillIds) {
  const set = new Set(typedSkillIds || []);
  INTEREST_AREAS.filter((area) => (areaIds || []).includes(area.id)).forEach((area) =>
    area.skills.forEach((id) => set.add(id))
  );
  return set;
}

/** Share (0–100) of a course's skill contribution on the student's interests; null without interests. */
export function interestFit(skills, interestSet) {
  if (!interestSet || interestSet.size === 0 || !skills || skills.length === 0) return null;
  const total = skills.reduce((sum, s) => sum + s.contribution, 0);
  if (total === 0) return 0;
  const hit = skills
    .filter((s) => interestSet.has(s.escoUri))
    .reduce((sum, s) => sum + s.contribution, 0);
  return Math.round((100 * hit) / total);
}
