import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useAtom, useSetAtom } from "jotai";
import { useRecoilValue } from "recoil";
import { authTokenState } from "../../../components/recoil/authAtom";
import { selectedSemesterSelector } from "../../../components/recoil/unifiedCourseDataSelectors";
import { useCourseSelection } from "../../../components/helpers/useCourseSelection";
import { sameCourse } from "../../../domain/course";
import { formatEcts, toEcts } from "../../../domain/credits";
import { SKILLS } from "../data/catalog";
import { MATCH_THRESHOLD, gaps } from "../domain/match";
import {
  PLAN_STATUS,
  chosenRoles,
  skillGapFocusAtom,
  skillPlanAtom,
  skillProfileAtom,
  skillWizardAtom,
  useSkillOverview,
} from "../state/skillMasterState";
import AiBadge from "./AiBadge";
import MatchRing from "./MatchRing";
import SkillJourney from "./SkillJourney";

const outlineButton =
  "px-4 py-2 text-sm font-semibold border-2 rounded-lg border-hsg-800 text-hsg-800 hover:bg-green-50";
const smallOutline =
  "shrink-0 px-3 py-1.5 text-xs font-semibold border-2 rounded-lg border-hsg-800 text-hsg-800 hover:bg-green-50";
const smallPrimary =
  "shrink-0 px-3 py-1.5 text-xs font-semibold text-white rounded-lg bg-hsg-800 hover:bg-hsg-900";

// Self-assessment per skill; «Grundlagen» counts 40, «Sicher» 70 (LEVEL_BY_SELF_ASSESSMENT).
const ANSWERS = [
  ["none", "Keine"],
  ["basic", "Grundlagen"],
  ["solid", "Sicher"],
];

const ects = (course) => `${formatEcts(toEcts(course.credits))} ECTS`;

function Figure({ value, text, highlight = false }) {
  return (
    <div
      className={`p-4 border rounded-xl ${
        highlight ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
      }`}
    >
      <p className={`text-2xl font-bold ${highlight ? "text-hsg-800" : "text-gray-900"}`}>{value}</p>
      <p className="mt-1 text-xs text-gray-600">{text}</p>
    </div>
  );
}

Figure.propTypes = {
  value: PropTypes.node.isRequired,
  text: PropTypes.string.isRequired,
  highlight: PropTypes.bool,
};

/** One course line in the two lists: ring, name, ECTS, KI badge and a note. */
function CourseLine({ entry, note, action }) {
  return (
    <li className="flex items-center gap-3 py-2.5 border-t border-gray-100 first:border-t-0">
      <MatchRing match={entry.result.match} reason="Wähle einen Zieljob" compact />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{entry.course.shortName}</p>
        <p className="flex flex-wrap items-center gap-1 mt-0.5 text-xs text-gray-600">
          {ects(entry.course)} ·
          <AiBadge skills={entry.result.skills} className="px-1.5 py-0.5 text-[11px]" />
          · {note}
        </p>
      </div>
      {action}
    </li>
  );
}

CourseLine.propTypes = {
  entry: PropTypes.object.isRequired,
  note: PropTypes.string.isRequired,
  action: PropTypes.node,
};

/**
 * Tab «Skill-Gap»: the profile against the chosen jobs. Key figures, one bar per
 * skill (today from courses and experience, with the plan, target of the jobs),
 * the enrolled and planned courses, recommendations to plan, and the hand-over
 * of the newly planned courses to bidding.
 */
export default function SkillGapPanel() {
  const semester = useRecoilValue(selectedSemesterSelector);
  const authToken = useRecoilValue(authTokenState);
  const {
    profile,
    targets,
    levels,
    status,
    rated,
    planned,
    plannedIds,
    selectedIds,
    newlyPlanned,
    withPlan,
    coverage,
    verified,
    ects: plannedEcts,
    resilientShare,
    journey,
  } = useSkillOverview(semester);
  const setWizard = useSetAtom(skillWizardAtom);
  const setPlan = useSetAtom(skillPlanAtom);
  const setProfile = useSetAtom(skillProfileAtom);
  // Clicking the chosen answer again removes the self-assessment.
  const answer = (skillId, value) =>
    setProfile((prev) => {
      const own = prev.selfAssessment || {};
      if (own[skillId] !== value) {
        return { ...prev, selfAssessment: { ...own, [skillId]: value } };
      }
      const { [skillId]: _removed, ...rest } = own; // eslint-disable-line no-unused-vars
      return { ...prev, selfAssessment: rest };
    });
  const [focus, setFocus] = useAtom(skillGapFocusAtom);
  const [handedOver, setHandedOver] = useState(null);
  const [handingOver, setHandingOver] = useState(false);
  const { addOrRemoveCourse } = useCourseSelection({
    selectedCourseIds: selectedIds,
    selectedSemesterShortName: semester || "",
    authToken,
  });

  // The course list opens this tab at a section: its top («Skill-Gap →»), the
  // recommendations or the bidding banner (the journey's next step).
  const topRef = useRef(null);
  const recommendationsRef = useRef(null);
  const biddingRef = useRef(null);
  const scrollTo = (section) => {
    const target =
      (section === "recommendations" && recommendationsRef.current) ||
      (section === "bidding" && biddingRef.current) ||
      topRef.current;
    target?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  };
  useEffect(() => {
    if (!focus) return;
    scrollTo(focus);
    setFocus(null);
  }, [focus, setFocus]);

  const roles = chosenRoles(profile);
  const openWizard = () => setWizard({ open: true, step: 0 });

  // Gaps the plan still leaves open decide what a recommendation closes.
  const openAfterPlan = useMemo(() => gaps(targets, withPlan), [targets, withPlan]);
  const recommendations = useMemo(
    () =>
      rated
        .filter(
          (entry) =>
            !plannedIds.some((id) => sameCourse(entry.course, { id })) &&
            (entry.result.match ?? 0) >= MATCH_THRESHOLD
        )
        .map((entry) => ({
          ...entry,
          closes: entry.result.skills.filter((s) => openAfterPlan[s.escoUri] > 0).length,
        }))
        .sort((a, b) => b.result.match - a.result.match)
        .slice(0, 5),
    [rated, plannedIds, openAfterPlan]
  );

  const courseId = (course) => course.courseNumber || course.id;
  const planCourse = (course) => {
    setHandedOver(null);
    setPlan((prev) => ({
      ...prev,
      [semester]: [...(prev[semester] || []), courseId(course)],
    }));
  };
  const unplanCourse = (course) =>
    setPlan((prev) => ({
      ...prev,
      [semester]: (prev[semester] || []).filter((id) => !sameCourse(course, { id })),
    }));

  // The newly planned courses go into the course selection, the list Biddit bids from.
  const handOver = async () => {
    // Without a login the selection cannot be saved; keep the plan instead of losing it.
    if (!authToken) {
      setHandedOver([]);
      return;
    }
    setHandingOver(true);
    const names = [];
    for (const { course } of newlyPlanned) {
      if (!selectedIds.some((id) => sameCourse(course, { id }))) {
        await addOrRemoveCourse(course);
      }
      names.push(course.shortName);
    }
    setPlan((prev) => ({ ...prev, [semester]: [] }));
    setHandedOver(names);
    setHandingOver(false);
  };

  // Open gaps first (largest remaining gap after the plan), reached targets last.
  const skillIds = Object.keys(targets).sort(
    (a, b) => targets[b] - (withPlan[b] || 0) - (targets[a] - (withPlan[a] || 0))
  );

  if (roles.length === 0) {
    return (
      <div className="p-4" data-testid="skill-gap-panel" ref={topRef}>
        <h2 className="text-2xl font-bold text-gray-900">Skill-Gap</h2>
        <p className="mt-2 mb-4 text-sm text-gray-600">
          Hier siehst du, welche Skills dir für deine Zieljobs noch fehlen und welche Kurse sie schliessen.
        </p>
        <div className="p-4 border-2 rounded-xl border-hsg-600 bg-green-50">
          <SkillJourney journey={journey} onAction={openWizard} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6" data-testid="skill-gap-panel" ref={topRef}>
      <header>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-2xl font-bold text-gray-900">Skill-Gap</h2>
          <button type="button" className={outlineButton} onClick={openWizard}>
            Profil nachschärfen
          </button>
        </div>
        <p className="mt-2 text-gray-800">
          Abgleich deines Profils mit {roles.length} {roles.length === 1 ? "Zieljob" : "Zieljobs"}
        </p>
        <ul className="flex flex-wrap gap-1.5 mt-2" aria-label="Deine Zieljobs">
          {roles.map((role) => (
            <li key={role.id} className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-hsg-800">
              {role.label}
            </li>
          ))}
        </ul>
      </header>

      {journey.current && (
        <div className="p-4 border-2 rounded-xl border-hsg-600 bg-green-50">
          <SkillJourney
            journey={journey}
            onAction={(step) => (step === "profile" ? openWizard() : scrollTo(step === "courses" ? "recommendations" : "bidding"))}
          />
        </div>
      )}

      {status === "none" && (
        <p className="text-sm text-gray-600">Für dieses Semester gibt es noch keine Skill-Daten.</p>
      )}

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Kennzahlen">
        <Figure value={`${coverage} %`} text="deiner Lücken deckt der Plan ab" highlight />
        <Figure
          value={resilientShare === null ? "–" : `${resilientShare} %`}
          text="der geplanten Kurse sind KI-resilient"
        />
        <Figure value={formatEcts(plannedEcts)} text="ECTS gebucht und geplant" />
        <Figure value={verified.size} text="Skills durch Kurse verifiziert" />
      </section>

      <section aria-label="Skills">
        <ul className="flex flex-wrap mb-3 text-xs text-gray-600 gap-x-5 gap-y-1">
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block w-5 h-2.5 rounded-sm bg-gray-600" />
            Heute (Kurse, Erfahrung, Selbsteinschätzung)
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block w-5 h-2.5 rounded-sm bg-green-300" />
            Mit geplanten Kursen
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block w-0.5 h-3 bg-gray-900" />
            Ziel laut Zieljob
          </li>
        </ul>
        <ul>
          {skillIds.map((id) => {
            const skill = SKILLS[id];
            const today = Math.round(levels[id] || 0);
            const plan = Math.round(withPlan[id] || 0);
            const target = targets[id];
            return (
              <li
                key={id}
                className="grid items-center grid-cols-12 py-3 border-b border-gray-100 gap-x-4 gap-y-2"
              >
                <div className="col-span-12 md:col-span-4">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-900">
                    {skill?.label ?? id}
                    {verified.has(id) && (
                      <span className="px-1.5 py-0.5 text-[11px] font-semibold text-white rounded-full bg-hsg-800">
                        ✓ verifiziert
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {skill?.esco?.uri ? `ESCO · ${skill.esco.label}` : "Kein eindeutiges ESCO-Konzept"} · KI{" "}
                    {skill?.aiAutomation ?? "–"} %
                  </p>
                </div>
                <div className="relative h-3 col-span-8 rounded-full md:col-span-5 bg-gray-200">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-green-300"
                    style={{ width: `${Math.min(100, plan)}%` }}
                  />
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-gray-600"
                    style={{ width: `${Math.min(100, today)}%` }}
                  />
                  <span
                    className="absolute -inset-y-1 w-0.5 bg-gray-900"
                    style={{ left: `${target}%` }}
                    title={`Ziel ${target}`}
                  />
                </div>
                <div className="flex flex-col items-end col-span-4 gap-1.5 md:col-span-3">
                  <p className="text-xs text-right text-gray-600 whitespace-nowrap">
                    heute <b className="text-gray-900">{today}</b> · Plan <b className="text-gray-900">{plan}</b> · Ziel{" "}
                    <b className="text-gray-900">{target}</b>
                    {plan >= target && <span aria-label="Ziel erreicht"> ✓</span>}
                  </p>
                  <div className="flex gap-1" role="group" aria-label={`Selbsteinschätzung ${skill?.label ?? id}`}>
                    {ANSWERS.map(([value, text]) => {
                      const on = profile.selfAssessment?.[id] === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => answer(id, value)}
                          aria-pressed={on}
                          title={on ? "Nochmals klicken hebt die Auswahl auf" : "Selbsteinschätzung"}
                          className={`px-1.5 py-0.5 rounded text-[11px] border ${
                            on ? "bg-hsg-800 text-white border-hsg-800" : "bg-white text-gray-600 border-gray-300"
                          }`}
                        >
                          {text}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="p-5 border border-gray-200 rounded-xl">
          <h3 className="text-lg font-bold text-gray-900">Gebucht und geplant</h3>
          <p className="mb-2 text-sm text-gray-600">Grundlage für die Balken «mit geplanten Kursen»</p>
          {planned.length === 0 ? (
            <p className="text-sm text-gray-600">Noch keine Kurse gebucht oder geplant.</p>
          ) : (
            <ul>
              {planned.map((entry) => (
                <CourseLine
                  key={courseId(entry.course)}
                  entry={entry}
                  note={PLAN_STATUS[entry.status]}
                  action={
                    entry.status === "planned" ? (
                      <button type="button" className={smallOutline} onClick={() => unplanCourse(entry.course)}>
                        Entfernen
                      </button>
                    ) : null
                  }
                />
              ))}
            </ul>
          )}
        </section>

        <section ref={recommendationsRef} className="p-5 border border-gray-200 rounded-xl">
          <h3 className="text-lg font-bold text-gray-900">Empfohlen, um Lücken zu schliessen</h3>
          <p className="mb-2 text-sm text-gray-600">Noch nicht geplant, Match ≥ {MATCH_THRESHOLD} %</p>
          {recommendations.length === 0 ? (
            <p className="text-sm text-gray-600">
              {status === "ready" ? "Alle passenden Kurse sind eingeplant." : "Noch keine Skill-Daten."}
            </p>
          ) : (
            <ul>
              {recommendations.map((entry) => (
                <CourseLine
                  key={courseId(entry.course)}
                  entry={entry}
                  note={`schliesst ${entry.closes} ${entry.closes === 1 ? "Lücke" : "Lücken"}`}
                  action={
                    <button type="button" className={smallPrimary} onClick={() => planCourse(entry.course)}>
                      + Planen
                    </button>
                  }
                />
              ))}
            </ul>
          )}
        </section>
      </div>

      <section
        ref={biddingRef}
        className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 text-white rounded-xl bg-hsg-800"
        aria-live="polite"
      >
        <div className="min-w-0">
          {newlyPlanned.length > 0 && handedOver?.length === 0 ? (
            <>
              <p className="font-bold">Bitte melde dich an</p>
              <p className="text-sm text-green-50">Ohne Login kann Biddit deine Auswahl nicht speichern.</p>
            </>
          ) : newlyPlanned.length > 0 ? (
            <>
              <p className="font-bold">
                {newlyPlanned.length} geplante {newlyPlanned.length === 1 ? "Kurs" : "Kurse"} bereit fürs Bidding
              </p>
              <p className="text-sm text-green-50">{newlyPlanned.map((e) => e.course.shortName).join(", ")}</p>
            </>
          ) : handedOver ? (
            <>
              <p className="font-bold">Ins Bidding übernommen</p>
              <p className="text-sm text-green-50">{handedOver.join(", ")}</p>
            </>
          ) : (
            <>
              <p className="font-bold">Keine neuen Kurse in der Planung</p>
              <p className="text-sm text-green-50">Füge Kurse mit + hinzu, um deine Lücken zu schliessen.</p>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={handOver}
          disabled={newlyPlanned.length === 0 || handingOver}
          className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-white text-hsg-800 hover:bg-green-50 disabled:bg-white/40 disabled:text-white/80 disabled:cursor-not-allowed"
        >
          {handingOver ? "Wird übernommen …" : "Plan ins Bidding übernehmen"}
        </button>
      </section>
    </div>
  );
}
