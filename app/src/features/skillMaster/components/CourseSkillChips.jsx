import PropTypes from "prop-types";
import { SKILLS } from "../data/catalog";
import AiBadge from "./AiBadge";

/**
 * Dot colour and tooltip wording per relevance (see skillRelevance). Every chip
 * is highlighted in green; the dot alone tells whether the skill closes a gap.
 */
const RELEVANCE = {
  core: { dot: "bg-hsg-600", text: "Kernskill deiner Zieljobs, Lücke offen" },
  optional: { dot: "bg-orange-400", text: "Optionaler Skill deiner Zieljobs, Lücke offen" },
  none: { dot: "bg-gray-400", text: "Keine offene Lücke für deine Zieljobs" },
};

/**
 * One line under a course in the Skill Mapper: AI badge, then the course's
 * skills as matchFor ranked them (open gaps first). The line clips at the card
 * edge; every chip names its relevance in the tooltip.
 */
export default function CourseSkillChips({ skills }) {
  return (
    <div className="flex items-center gap-1.5 overflow-hidden" data-testid="course-skill-chips">
      <AiBadge skills={skills} className="px-2 py-0.5 text-[11px]" />
      {skills.map((skill) => {
        const style = RELEVANCE[skill.relevance] ?? RELEVANCE.none;
        const label = SKILLS[skill.escoUri]?.label ?? skill.escoUri;
        return (
          <span
            key={skill.escoUri}
            title={`${label}: ${style.text}`}
            className="inline-flex shrink-0 items-center gap-1 px-2 py-0.5 text-[11px] font-medium border rounded-full whitespace-nowrap border-hsg-600 bg-green-50 text-hsg-800"
          >
            <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
            {label}
          </span>
        );
      })}
    </div>
  );
}

CourseSkillChips.propTypes = {
  skills: PropTypes.array.isRequired,
};
