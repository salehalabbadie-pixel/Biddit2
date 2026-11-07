import PropTypes from "prop-types";
import { SKILLS } from "../data/catalog";
import { AI_BADGE, aiBadge, aiScore } from "../domain/match";
import { useSkillMatch, useSkillProfile } from "../state/skillMasterState";

const BADGE_STYLE = {
  resilient: "bg-green-100 text-hsg-800",
  partial: "bg-yellow-100 text-yellow-800",
  strong: "bg-red-100 text-red-800",
};

/** Match, AI badge and skill table for the course detail view. */
export default function SkillMatchCard({ course, semester }) {
  const { matchFor, hasRole } = useSkillMatch(semester);
  const { gapMap } = useSkillProfile();
  const result = matchFor(course);
  if (!result) return null;

  const score = aiScore(result.skills);
  const badge = aiBadge(score);

  return (
    <section
      data-testid="skill-match-card"
      className="p-4 mb-4 border rounded-lg border-green-200 bg-green-50"
    >
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <h3 className="font-semibold text-gray-900">Skill-Master</h3>
        {result.match !== null && (
          <span className="px-2 py-0.5 rounded-full bg-hsg-800 text-white text-sm font-semibold">
            Match {result.match} %
          </span>
        )}
        {badge && (
          <span className={`px-2 py-0.5 rounded-full text-sm ${BADGE_STYLE[badge]}`}>
            {AI_BADGE[badge].label} · KI {score} %
          </span>
        )}
      </div>
      {!hasRole && (
        <p className="mb-3 text-sm text-gray-600">
          Wähle im Tab «Skill-Gap» eine Zielrolle, um deinen Match zu sehen.
        </p>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500">
            <th className="font-medium pb-1">Skill (ESCO)</th>
            <th className="font-medium pb-1">Beitrag</th>
            <th className="font-medium pb-1">Deine Lücke</th>
            <th className="font-medium pb-1">KI</th>
          </tr>
        </thead>
        <tbody>
          {result.skills.map((s) => (
            <tr key={s.escoUri} className="border-t border-green-100" title={s.evidence}>
              <td className="py-1">{SKILLS[s.escoUri]?.label ?? s.escoUri}</td>
              <td className="py-1">+{s.contribution}</td>
              <td className="py-1">
                {gapMap[s.escoUri] ? `schliesst ${Math.min(s.contribution, gapMap[s.escoUri])}` : "–"}
              </td>
              <td className="py-1">{s.aiAutomation} %</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

SkillMatchCard.propTypes = {
  course: PropTypes.object,
  semester: PropTypes.string,
};
