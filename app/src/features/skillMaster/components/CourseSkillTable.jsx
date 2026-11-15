import PropTypes from "prop-types";
import { SKILLS } from "../data/catalog";
import { AI_BADGE } from "../domain/match";
import { useSkillContext } from "../state/skillMasterState";

/** Bar colour of a skill's AI automation, in the bands of the AI badge. */
const aiColour = (value) =>
  value <= AI_BADGE.resilient.max
    ? "bg-hsg-600"
    : value <= AI_BADGE.partial.max
    ? "bg-yellow-500"
    : "bg-red-600";

/**
 * Course details: the skills the Merkblatt assigns to the course, what each
 * contributes, which of the student's gaps it closes and how far AI can
 * automate it.
 */
export default function CourseSkillTable({ course, semester }) {
  const { matchFor, gapMap, targets } = useSkillContext(semester);
  const result = matchFor(course);
  if (!result) return null;
  const unconfirmed = result.skills.some((s) => s.status !== "confirmed");

  return (
    <section className="pb-6" data-testid="course-skill-table">
      <h2 className="text-lg font-bold text-gray-700">Skills aus dem Merkblatt</h2>
      <p className="mb-3 text-sm text-gray-600">
        Aus Lernzielen und Inhalten extrahiert und auf ESCO gemappt. Pro Skill siehst du, ob er eine
        deiner Lücken schliesst und wie stark er durch KI automatisierbar ist.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="text-xs text-left text-gray-500 border-b border-gray-200">
              <th className="py-2 font-semibold">Skill</th>
              <th className="py-2 font-semibold">Beitrag</th>
              <th className="py-2 font-semibold">Deine Lücke</th>
              <th className="py-2 font-semibold">KI-Automatisierbarkeit</th>
            </tr>
          </thead>
          <tbody>
            {result.skills.map((s) => {
              const skill = SKILLS[s.escoUri];
              const gap = gapMap[s.escoUri] || 0;
              return (
                <tr key={s.escoUri} className="border-b border-gray-100" title={s.evidence}>
                  <td className="py-2.5 pr-3">
                    <p className="font-semibold text-gray-900">{skill?.label ?? s.escoUri}</p>
                    <p className="text-xs text-gray-500">
                      {skill?.esco?.uri ? `ESCO · ${skill.esco.label}` : "Kein eindeutiges ESCO-Konzept"}
                    </p>
                  </td>
                  <td className="py-2.5 pr-3 whitespace-nowrap">+{s.contribution} Pkt.</td>
                  <td className="py-2.5 pr-3 text-xs font-semibold">
                    {gap > 0 ? (
                      <span className="text-hsg-800">
                        schliesst {Math.min(s.contribution, gap)} von {gap} Pkt.
                      </span>
                    ) : targets[s.escoUri] ? (
                      <span className="text-gray-500">Ziel schon erreicht</span>
                    ) : (
                      <span className="font-normal text-gray-400">nicht in deinen Zieljobs</span>
                    )}
                  </td>
                  <td className="py-2.5">
                    <span className="flex items-center gap-2">
                      <span className="relative w-24 h-2 rounded-full bg-gray-200">
                        <span
                          className={`absolute inset-y-0 left-0 rounded-full ${aiColour(s.aiAutomation)}`}
                          style={{ width: `${s.aiAutomation}%` }}
                        />
                      </span>
                      {s.aiAutomation} %
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {unconfirmed && (
        <p className="mt-2 text-xs text-gray-500">
          Automatisch aus dem Merkblatt extrahiert, von den Dozierenden noch nicht bestätigt. Fahre über
          eine Zeile, um die Belegstelle zu sehen.
        </p>
      )}
    </section>
  );
}

CourseSkillTable.propTypes = {
  course: PropTypes.object,
  semester: PropTypes.string,
};
