import { useMemo } from "react";
import Select from "react-select";
import { useAtom } from "jotai";
import { useRecoilValue } from "recoil";
import { authTokenState } from "../../../components/recoil/authAtom";
import {
  selectedSemesterSelector,
  semesterCourseDataSelector,
} from "../../../components/recoil/unifiedCourseDataSelectors";
import { useCourseSelection } from "../../../components/helpers/useCourseSelection";
import { sameCourse } from "../../../domain/course";
import { ROLES, SKILLS } from "../data/catalog";
import {
  MATCH_THRESHOLD,
  aiBadge,
  aiScore,
  gapCoverage,
  levelsWithPlan,
} from "../domain/match";
import {
  MAX_ROLES,
  skillProfileAtom,
  useSkillMatch,
  useSkillProfile,
} from "../state/skillMasterState";

const ANSWERS = [
  ["none", "Keine"],
  ["basic", "Grundlagen"],
  ["solid", "Sicher"],
];

const ROLE_OPTIONS = ROLES.map((role) => ({
  value: role.id,
  label: role.label,
  note: role.esco?.note,
}));

/** In the open menu each role shows its ESCO note; chips show the label only. */
const formatRoleOption = (option, { context }) =>
  context === "menu" ? (
    <span className="flex items-baseline justify-between gap-3">
      <span>{option.label}</span>
      {option.note && <span className="text-xs text-gray-500">{option.note}</span>}
    </span>
  ) : (
    option.label
  );

const inList = (ids, course) => ids.some((id) => sameCourse(course, { id }));

/** Tab «Skill-Gap»: target role, self-assessment, gaps and course proposals. */
export default function SkillGapPanel() {
  const [profile, setProfile] = useAtom(skillProfileAtom);
  const { targets, levels } = useSkillProfile();
  const semester = useRecoilValue(selectedSemesterSelector);
  const semesterData = useRecoilValue(semesterCourseDataSelector(semester));
  const authToken = useRecoilValue(authTokenState);
  const { matchFor, status } = useSkillMatch(semester);
  const { addOrRemoveCourse } = useCourseSelection({
    selectedCourseIds: semesterData.selectedIds,
    selectedSemesterShortName: semester || "",
    authToken,
  });

  const { planned, proposals } = useMemo(() => {
    const ids = [...semesterData.selectedIds, ...semesterData.enrolledIds];
    const rated = semesterData.available
      .map((course) => ({ course, result: matchFor(course) }))
      .filter((entry) => entry.result);
    return {
      planned: rated.filter((entry) => inList(ids, entry.course)),
      proposals: rated
        .filter(
          (entry) =>
            !inList(ids, entry.course) &&
            (entry.result.match ?? 0) >= MATCH_THRESHOLD
        )
        .sort((a, b) => b.result.match - a.result.match)
        .slice(0, 5),
    };
  }, [semesterData, matchFor]);

  const withPlan = levelsWithPlan(
    levels,
    planned.map((entry) => entry.result.skills)
  );
  const targetIds = Object.keys(targets).sort(
    (a, b) => targets[b] - (levels[b] || 0) - (targets[a] - (levels[a] || 0))
  );

  // Only roles that still exist in the catalog count (a stored profile may hold renamed ones).
  const chosenRoles = profile.roleIds
    .slice(0, MAX_ROLES)
    .map((id) => ROLE_OPTIONS.find((option) => option.value === id))
    .filter(Boolean);
  const chooseRoles = (options) =>
    setProfile((prev) => ({
      ...prev,
      roleIds: (options ?? []).slice(0, MAX_ROLES).map((option) => option.value),
    }));
  // Clicking the already chosen answer again removes the self-assessment.
  const answer = (skillId, value) =>
    setProfile((prev) => {
      if (prev.selfAssessment[skillId] !== value) {
        return { ...prev, selfAssessment: { ...prev.selfAssessment, [skillId]: value } };
      }
      const { [skillId]: _removed, ...rest } = prev.selfAssessment; // eslint-disable-line no-unused-vars
      return { ...prev, selfAssessment: rest };
    });
  const coverage = gapCoverage(targets, levels, withPlan);

  return (
    <div className="p-4 space-y-6 text-sm" data-testid="skill-gap-panel">
      <section>
        <h2 className="mb-1 text-lg font-semibold">
          <label htmlFor="skill-gap-roles">Welche Rolle strebst du an?</label>
        </h2>
        <p className="mb-3 text-gray-600">
          Wähle bis zu {MAX_ROLES} Zielrollen. Die meisten beruhen auf ESCO-Berufsprofilen.
        </p>
        <Select
          inputId="skill-gap-roles"
          isMulti
          isSearchable
          closeMenuOnSelect={false}
          placeholder="Zielrolle wählen …"
          options={ROLE_OPTIONS}
          value={chosenRoles}
          onChange={chooseRoles}
          isOptionDisabled={() => chosenRoles.length >= MAX_ROLES}
          formatOptionLabel={formatRoleOption}
          noOptionsMessage={() => "Keine passende Rolle"}
        />
        <p className="mt-1 text-xs text-gray-500">
          {chosenRoles.length >= MAX_ROLES
            ? `Maximum erreicht: Entferne eine Rolle, um eine andere zu wählen.`
            : `${chosenRoles.length} von ${MAX_ROLES} gewählt`}
        </p>
      </section>

      {targetIds.length > 0 && (
        <section>
          <div className="mb-3">
            <h2 className="text-lg font-semibold">Deine Skill-Lücken</h2>
            {planned.length > 0 ? (
              <p className="mt-1 flex items-center gap-2 text-gray-700">
                <span
                  aria-hidden="true"
                  className="relative inline-block h-2 w-20 shrink-0 rounded-full bg-gray-200"
                >
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-green-300"
                    style={{ width: `${coverage}%` }}
                  />
                </span>
                <span>
                  Deine gemerkten Kurse schliessen <b>{coverage} %</b> deiner Lücken
                  zum Rollenziel.
                </span>
              </p>
            ) : (
              <p className="mt-1 text-gray-600">
                Merke dir Kurse, um zu sehen, wie viel deiner Lücken sie schliessen.
              </p>
            )}
          </div>
          <ul className="space-y-3">
            {targetIds.map((id) => (
              <li key={id} className="grid grid-cols-12 items-center gap-2">
                <span className="col-span-4 font-medium">
                  {SKILLS[id]?.label ?? id}
                  <span className="block text-xs font-normal text-gray-500">
                    KI {SKILLS[id]?.aiAutomation ?? "–"} %
                  </span>
                </span>
                <span className="col-span-5 relative h-3 rounded-full bg-gray-200">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-green-300"
                    style={{ width: `${withPlan[id] || 0}%` }}
                  />
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-gray-600"
                    style={{ width: `${levels[id] || 0}%` }}
                  />
                  <span
                    className="absolute -inset-y-1 w-0.5 bg-gray-900"
                    style={{ left: `${targets[id]}%` }}
                    title={`Ziel ${targets[id]}`}
                  />
                </span>
                <span className="col-span-3 flex gap-1 justify-end">
                  {ANSWERS.map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => answer(id, value)}
                      title={
                        profile.selfAssessment[id] === value
                          ? "Nochmals klicken hebt die Auswahl auf"
                          : undefined
                      }
                      aria-pressed={profile.selfAssessment[id] === value}
                      className={`px-1.5 py-0.5 rounded text-xs border ${
                        profile.selfAssessment[id] === value
                          ? "bg-hsg-800 text-white border-hsg-800"
                          : "bg-white text-gray-600"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </span>
              </li>
            ))}
          </ul>
          {/* Swatches reuse the exact classes of the bar above so legend and bar always match. */}
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-600">
            <li className="flex items-center gap-1.5">
              <span aria-hidden="true" className="inline-block h-3 w-6 rounded-full bg-gray-600" />
              Heute (Selbsteinschätzung)
            </li>
            <li className="flex items-center gap-1.5">
              <span aria-hidden="true" className="inline-block h-3 w-6 rounded-full bg-green-300" />
              Mit gemerkten Kursen
            </li>
            <li className="flex items-center gap-1.5">
              <span aria-hidden="true" className="relative inline-block h-3 w-6 rounded-full bg-gray-200">
                <span className="absolute -inset-y-1 left-1/2 w-0.5 bg-gray-900" />
              </span>
              Ziel der Rolle
            </li>
          </ul>
        </section>
      )}

      {targetIds.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">Kurse, die deine Lücken schliessen</h2>
          {status === "none" && (
            <p className="text-gray-600">Für dieses Semester gibt es noch keine Skill-Daten.</p>
          )}
          {status === "ready" && proposals.length === 0 && (
            <p className="text-gray-600">Keine weiteren Kurse ab {MATCH_THRESHOLD} % Match.</p>
          )}
          <ul className="space-y-2">
            {proposals.map(({ course, result }) => {
              const badge = aiBadge(aiScore(result.skills));
              return (
                <li
                  key={course.courseNumber || course.id}
                  className="flex items-center gap-3 p-2 bg-white rounded-lg shadow-sm"
                >
                  <span className="px-2 py-0.5 rounded-full bg-hsg-800 text-white text-xs font-semibold">
                    {result.match} %
                  </span>
                  <span className="flex-1 min-w-0 truncate">{course.shortName}</span>
                  {badge === "resilient" && (
                    <span className="text-xs text-hsg-800">KI-resilient</span>
                  )}
                  <button
                    type="button"
                    onClick={() => addOrRemoveCourse(course)}
                    className="px-2 py-1 text-xs border rounded border-main text-main"
                  >
                    + Merken
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
