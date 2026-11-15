import PropTypes from "prop-types";
import { useSetAtom } from "jotai";
import { useSetRecoilState } from "recoil";
import { selectedTabAtom } from "../../../components/recoil/selectedTabAtom";
import { sameCourse } from "../../../domain/course";
import { TAB } from "../../../constants/tabs";
import { SKILLS } from "../data/catalog";
import { AI_BADGE, MATCH_THRESHOLD, aiBadge, aiScore } from "../domain/match";
import {
  skillPlanAtom,
  skillWizardAtom,
  useSkillOverview,
} from "../state/skillMasterState";

const RADIUS = 34;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Wording of the match, in the bands the course list colours by. */
function fitLabel(match) {
  if (match >= 75) return "Sehr gute Passung";
  if (match >= MATCH_THRESHOLD) return "Gute Passung";
  if (match >= 25) return "Teilweise Passung";
  return "Geringe Passung";
}

const AI_BOX = {
  resilient: "bg-green-50",
  partial: "bg-yellow-50",
  strong: "bg-red-50",
};

const label = (id) => SKILLS[id]?.label ?? id;
const list = (names) =>
  names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} und ${names.at(-1)}`;

function Bar({ name, value }) {
  return (
    <div className="grid items-center grid-cols-12 gap-3 text-sm">
      <span className="col-span-4">{name}</span>
      <span className="relative h-2.5 col-span-6 rounded-full bg-gray-200">
        {value !== null && (
          <span className="absolute inset-y-0 left-0 rounded-full bg-hsg-600" style={{ width: `${value}%` }} />
        )}
      </span>
      <span className="col-span-2 text-right font-semibold">{value === null ? "–" : `${value}%`}</span>
    </div>
  );
}

Bar.propTypes = { name: PropTypes.string.isRequired, value: PropTypes.number };

/**
 * Course details: how well the course fits the student's profile. Match ring,
 * the gaps it closes, job fit and interest fit, its AI exposure and the plan
 * status, with the way to the Skill-Gap tab.
 */
export default function CourseSkillFit({ course, semester }) {
  const { matchFor, hasRole, gapMap, planned, interests } = useSkillOverview(semester);
  const setPlan = useSetAtom(skillPlanAtom);
  const setWizard = useSetAtom(skillWizardAtom);
  const setTab = useSetRecoilState(selectedTabAtom);
  const result = matchFor(course);
  if (!result) return null;

  if (!hasRole) {
    return (
      <section data-testid="course-skill-fit" className="p-5 border border-green-200 rounded-xl bg-green-50">
        <h3 className="text-lg font-bold text-gray-900">Passt der Kurs zu dir?</h3>
        <p className="mt-1 mb-3 text-sm text-gray-600">
          Lege dein Skill-Profil an, dann siehst du hier, welche deiner Lücken dieser Kurs schliesst.
        </p>
        <button
          type="button"
          onClick={() => setWizard({ open: true, step: 0 })}
          className="px-4 py-2 text-sm font-semibold border-2 rounded-lg border-hsg-800 text-hsg-800 bg-white hover:bg-green-50"
        >
          Profil anlegen
        </button>
      </section>
    );
  }

  const { match, jobFit, interestFit: interest, skills } = result;
  const closing = skills
    .filter((s) => gapMap[s.escoUri] > 0)
    .map((s) => ({ id: s.escoUri, amount: Math.min(s.contribution, gapMap[s.escoUri]) }))
    .sort((a, b) => b.amount - a.amount);
  const score = aiScore(skills);
  const badge = aiBadge(score);
  const byContribution = [...skills].sort((a, b) => b.contribution - a.contribution);
  const hardToAutomate = byContribution.filter((s) => s.aiAutomation <= AI_BADGE.resilient.max).slice(0, 2);
  const automatable = byContribution.filter((s) => s.aiAutomation > AI_BADGE.partial.max).slice(0, 2);
  const status = planned.find((entry) => sameCourse(entry.course, course))?.status ?? null;
  const colour = match >= MATCH_THRESHOLD ? "text-hsg-600" : "text-gray-400";

  const plan = () =>
    setPlan((prev) => ({
      ...prev,
      [semester]: [...(prev[semester] || []), course.courseNumber || course.id],
    }));

  return (
    <section data-testid="course-skill-fit" className="p-5 border border-green-200 rounded-xl bg-green-50/40">
      <div className="flex items-center gap-4">
        <span
          role="img"
          aria-label={`Match zu deinen Zieljobs: ${match} %`}
          className="relative inline-flex items-center justify-center flex-shrink-0 w-24 h-24"
        >
          <svg viewBox="0 0 80 80" className="absolute inset-0 w-full h-full -rotate-90" aria-hidden="true">
            <circle cx="40" cy="40" r={RADIUS} fill="none" strokeWidth="7" className="stroke-gray-200" />
            <circle
              cx="40"
              cy="40"
              r={RADIUS}
              fill="none"
              strokeWidth="7"
              strokeLinecap="round"
              stroke="currentColor"
              className={colour}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - match / 100)}
            />
          </svg>
          <span className="relative text-xl font-bold text-gray-900">{match}%</span>
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-gray-900">{fitLabel(match)}</h3>
          <p className="text-sm text-gray-600">
            {closing.length === 0
              ? "Schliesst keine offene Lücke deiner Zieljobs."
              : `Schliesst ${closing.length} ${closing.length === 1 ? "Lücke" : "Lücken"} zu deinen Zieljobs, vor allem ${list(
                  closing.slice(0, 2).map((c) => label(c.id))
                )}.`}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Bar name="Zieljob-Fit" value={jobFit} />
        <Bar name="Interessen-Fit" value={interest} />
      </div>

      {badge && (
        <div className={`p-3 mt-4 text-sm rounded-lg ${AI_BOX[badge]}`}>
          <p className="font-bold text-gray-900">
            {AI_BADGE[badge].label} · KI-Automatisierbarkeit {score} %
          </p>
          <p className="mt-1 text-gray-700">
            {hardToAutomate.length > 0 &&
              `Kern-Skills wie ${list(hardToAutomate.map((s) => label(s.escoUri)))} lassen sich kaum an KI abgeben. `}
            {automatable.length > 0 &&
              `${list(automatable.map((s) => label(s.escoUri)))} ${automatable.length === 1 ? "ist" : "sind"} dagegen weitgehend automatisierbar.`}
            {hardToAutomate.length === 0 && automatable.length === 0 &&
              "Die Skills dieses Kurses sind teilweise automatisierbar."}
          </p>
        </div>
      )}

      <p className="pt-3 mt-4 text-xs text-gray-500 border-t border-dashed border-gray-300">
        {interests.size > 0
          ? "Match = 60 % Zieljob-Fit (deckt der Kurs deine Lücken?) + 40 % Interessen-Fit"
          : "Match = Zieljob-Fit (deckt der Kurs deine Lücken?). Mit Interessen im Profil zählen sie 40 %."}
      </p>
      <div className="flex flex-wrap gap-3 mt-3">
        {status ? (
          <button
            type="button"
            disabled
            className="px-4 py-2 text-sm font-semibold border-2 rounded-lg border-green-300 text-green-700/70 bg-white"
          >
            {status === "enrolled" ? "Gebucht" : status === "selected" ? "Im Bidding" : "Geplant"}
          </button>
        ) : (
          <button
            type="button"
            onClick={plan}
            className="px-4 py-2 text-sm font-semibold text-white rounded-lg bg-hsg-800 hover:bg-hsg-900"
          >
            + Planen
          </button>
        )}
        <button
          type="button"
          onClick={() => setTab(TAB.SKILL_GAP)}
          className="px-4 py-2 text-sm font-semibold border-2 rounded-lg border-hsg-800 text-hsg-800 bg-white hover:bg-green-50"
        >
          Zur Skill-Gap-Ansicht
        </button>
      </div>
    </section>
  );
}

CourseSkillFit.propTypes = {
  course: PropTypes.object,
  semester: PropTypes.string,
};
