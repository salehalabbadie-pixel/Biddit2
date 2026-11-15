import { useAtom, useSetAtom } from "jotai";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { selectedSemesterSelector } from "../../../components/recoil/unifiedCourseDataSelectors";
import { selectedTabAtom } from "../../../components/recoil/selectedTabAtom";
import { isLeftViewVisible } from "../../../components/recoil/isLeftViewVisible";
import { TAB } from "../../../constants/tabs";
import { MATCH_THRESHOLD } from "../domain/match";
import {
  MAX_ROLES,
  chosenRoles,
  onlyStrongMatchAtom,
  skillGapFocusAtom,
  skillWizardAtom,
  useSkillOverview,
} from "../state/skillMasterState";


const linkStyle = "text-xs font-semibold text-hsg-800 hover:underline whitespace-nowrap";

/**
 * Above the course list while «Skill Mapper» is active: the card «Dein
 * Skill-Profil» (roles, gap coverage, strong matches, verified skills) and the
 * sort line with the switch «Nur ≥ 50 % Match».
 */
export default function SkillMapperHeader() {
  const semester = useRecoilValue(selectedSemesterSelector);
  const { profile, status, hasRole, coverage, strongMatches, verifiedSkills } =
    useSkillOverview(semester);
  const [onlyStrong, setOnlyStrong] = useAtom(onlyStrongMatchAtom);
  const setFocus = useSetAtom(skillGapFocusAtom);
  const setTab = useSetRecoilState(selectedTabAtom);
  const setLeftViewVisible = useSetRecoilState(isLeftViewVisible);
  const setWizard = useSetAtom(skillWizardAtom);

  const roles = chosenRoles(profile);
  const openWizard = () => setWizard({ open: true, step: 0 });

  // On small screens the tab sits behind the list, so the list makes way.
  const openSkillGap = (section) => {
    setFocus(section);
    setTab(TAB.SKILL_GAP);
    setLeftViewVisible(false);
  };

  return (
    <div className="mb-2" data-testid="skill-mapper-header">
      <section className="p-3 mb-2 bg-white border border-gray-200 border-l-4 border-l-hsg-800 rounded-lg shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="text-sm font-semibold text-gray-900">Dein Skill-Profil</h3>
          <div className="flex gap-4">
            <button type="button" className={linkStyle} onClick={openWizard}>
              {hasRole ? "Nachschärfen" : "Profil anlegen"}
            </button>
            <button type="button" className={linkStyle} onClick={() => openSkillGap("roles")}>
              Skill-Gap →
            </button>
          </div>
        </div>

        {hasRole ? (
          <>
            <ul className="flex flex-wrap gap-1.5 mt-2" aria-label="Deine Zieljobs">
              {roles.map((role) => (
                <li
                  key={role.id}
                  className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-hsg-800"
                >
                  {role.label}
                </li>
              ))}
            </ul>
            {status === "none" ? (
              <p className="mt-2 text-xs text-gray-600">
                Für dieses Semester gibt es noch keine Skill-Daten.
              </p>
            ) : (
              <p className="flex flex-wrap mt-2 text-xs text-gray-600 gap-x-4 gap-y-0.5">
                <span title="Anteil deiner Skill-Lücken, den deine gemerkten und gebuchten Kurse schliessen">
                  Lücken gedeckt <b className="text-gray-900">{coverage} %</b>
                </span>
                <span title={`Kurse dieses Semesters mit mindestens ${MATCH_THRESHOLD} % Match`}>
                  <b className="text-gray-900">{strongMatches}</b> Kurse ≥ {MATCH_THRESHOLD} %
                </span>
                <span title="Skills deiner Zieljobs, die deine bisherigen oder gebuchten Kurse laut Merkblatt trainieren">
                  <b className="text-gray-900">{verifiedSkills}</b> verifizierte Skills
                </span>
              </p>
            )}
          </>
        ) : (
          <p className="mt-2 text-xs text-gray-600">
            Lege dein Profil an: bis zu {MAX_ROLES} Zieljobs, deine Erfahrung und Interessen.
            Dann zeigt die Liste deinen Match pro Kurs.
          </p>
        )}
      </section>

      <div className="flex items-center justify-between gap-2 px-1 text-xs text-gray-600">
        <span className="truncate">
          {hasRole
            ? `Sortiert nach Match zu ${roles.length} ${roles.length === 1 ? "Zieljob" : "Zieljobs"}`
            : "Noch kein Zieljob gewählt"}
        </span>
        <label
          className={`flex shrink-0 items-center gap-2 ${hasRole ? "cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
        >
          <button
            type="button"
            role="switch"
            aria-checked={onlyStrong && hasRole}
            disabled={!hasRole}
            onClick={() => setOnlyStrong((value) => !value)}
            className={`relative inline-flex items-center w-8 h-[18px] rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-hsg-600 focus-visible:ring-offset-1 ${
              onlyStrong && hasRole ? "bg-hsg-800" : "bg-gray-300"
            }`}
          >
            <span
              aria-hidden="true"
              className={`inline-block w-3.5 h-3.5 bg-white rounded-full shadow transition-transform ${
                onlyStrong && hasRole ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
          Nur ≥ {MATCH_THRESHOLD} % Match
        </label>
      </div>
    </div>
  );
}
