import { useRef } from "react";
import { Dialog } from "@headlessui/react";
import { useAtom, useSetAtom } from "jotai";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { selectedSemesterSelector } from "../../../../components/recoil/unifiedCourseDataSelectors";
import { smartSearchState } from "../../../../components/recoil/smartSearchAtom";
import { selectionOptionsState } from "../../../../components/recoil/selectionOptionsAtom";
import { isLeftViewVisible } from "../../../../components/recoil/isLeftViewVisible";
import {
  EMPTY_PROFILE,
  chosenRoles,
  skillProfileAtom,
  skillWizardAtom,
  useSkillOverview,
} from "../../state/skillMasterState";
import { StepExperience, StepInterests, StepJobs, StepResult } from "./WizardSteps";

const STEPS = ["Zieljobs", "Erfahrung", "Interessen", "Ergebnis"];

const primaryButton =
  "px-5 py-2.5 text-sm font-semibold text-white rounded-lg bg-hsg-800 hover:bg-hsg-900 disabled:opacity-50 disabled:cursor-not-allowed";
const backButton =
  "px-5 py-2.5 text-sm font-semibold border-2 rounded-lg border-hsg-800 text-hsg-800 hover:bg-green-50";

/**
 * «Nachschärfen»: the four-step profile wizard (Zieljobs, Erfahrung, Interessen,
 * Ergebnis). Every change is saved to the profile right away, so closing it
 * midway keeps what the student entered. The last step leads to the course
 * list in Skill Mapper mode.
 */
export default function SkillProfileWizard() {
  const [{ open, step }, setWizard] = useAtom(skillWizardAtom);
  const setProfile = useSetAtom(skillProfileAtom);
  const semester = useRecoilValue(selectedSemesterSelector);
  const overview = useSkillOverview(semester);
  const setSearch = useSetRecoilState(smartSearchState);
  const setSelectionOptions = useSetRecoilState(selectionOptionsState);
  const setLeftViewVisible = useSetRecoilState(isLeftViewVisible);
  const closeRef = useRef(null);

  const { profile, targets, levels, past, planned } = overview;
  const roles = chosenRoles(profile);
  const update = (change) => setProfile((prev) => change({ ...EMPTY_PROFILE, ...prev }));
  const goTo = (next) => setWizard({ open: true, step: next });
  const close = () => setWizard({ open: false, step: 0 });

  // The course list in Skill Mapper mode, as SearchModeToggle switches it.
  const showCourses = () => {
    setSelectionOptions((prev) => ({ ...prev, searchTerm: "" }));
    setSearch((prev) => ({
      ...prev,
      mode: "skills",
      hasSearched: false,
      resultIds: [],
      distances: [],
      semesterQueried: null,
    }));
    setLeftViewVisible(true);
    close();
  };

  const courseSkillLists = [
    ...past.matched.map((course) => course.skills),
    ...planned.map((entry) => entry.result.skills),
  ];

  return (
    <Dialog open={open} onClose={close} initialFocus={closeRef} className="relative z-[60]">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex items-start justify-center min-h-full p-4 sm:items-center">
          <Dialog.Panel
            data-testid="skill-profile-wizard"
            className="flex flex-col w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-xl"
          >
            <div className="flex items-center justify-between gap-3 px-6 pt-5">
              <Dialog.Title className="sr-only">Skill-Profil nachschärfen</Dialog.Title>
              <ol className="flex flex-wrap items-center gap-2 text-sm" aria-label="Schritte">
                {STEPS.map((name, i) => {
                  const done = i < step;
                  const current = i === step;
                  return (
                    <li key={name} className="flex items-center gap-2">
                      {i > 0 && <span aria-hidden="true" className="hidden w-6 h-px bg-gray-300 sm:block" />}
                      <button
                        type="button"
                        onClick={() => goTo(i)}
                        disabled={i > 0 && roles.length === 0}
                        aria-current={current ? "step" : undefined}
                        className="flex items-center gap-2 disabled:cursor-not-allowed"
                      >
                        <span
                          className={`flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full ${
                            current
                              ? "bg-hsg-800 text-white"
                              : done
                              ? "bg-green-50 text-hsg-800 border border-green-200"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {done ? "✓" : i + 1}
                        </span>
                        <span className={current ? "font-semibold text-gray-900" : "text-gray-600"}>{name}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label="Schliessen"
                className="p-1 text-xl leading-none text-gray-500 rounded hover:text-gray-900"
              >
                ×
              </button>
            </div>

            <div className="flex-1 px-6 py-5 overflow-y-auto">
              {step === 0 && <StepJobs profile={profile} update={update} />}
              {step === 1 && <StepExperience profile={profile} update={update} past={past} />}
              {step === 2 && (
                <StepInterests profile={profile} update={update} courseSkillLists={courseSkillLists} />
              )}
              {step === 3 && (
                <StepResult profile={profile} roles={roles} targets={targets} levels={levels} past={past} />
              )}
            </div>

            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200">
              {step > 0 ? (
                <button type="button" className={backButton} onClick={() => goTo(step - 1)}>
                  Zurück
                </button>
              ) : (
                <span />
              )}
              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  className={primaryButton}
                  disabled={roles.length === 0}
                  title={roles.length === 0 ? "Wähle zuerst mindestens einen Zieljob" : undefined}
                  onClick={() => goTo(step + 1)}
                >
                  Weiter
                </button>
              ) : (
                <button type="button" className={primaryButton} onClick={showCourses}>
                  Zu meinen Kursvorschlägen
                </button>
              )}
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
}
