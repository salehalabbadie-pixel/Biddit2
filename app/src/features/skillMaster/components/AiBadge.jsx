import PropTypes from "prop-types";
import { AI_BADGE, aiBadge, aiScore } from "../domain/match";

const STYLE = {
  resilient: "bg-green-100 text-hsg-800",
  partial: "bg-yellow-100 text-yellow-800",
  strong: "bg-red-100 text-red-800",
};

/** AI exposure of a course as a pill («KI-resilient» …), optionally with the score. */
export default function AiBadge({ skills, showScore = false, className = "" }) {
  const score = aiScore(skills);
  const badge = aiBadge(score);
  if (!badge) return null;
  return (
    <span
      title={`KI-Automatisierbarkeit der Kursinhalte: ${score} %`}
      className={`shrink-0 rounded-full font-semibold whitespace-nowrap ${STYLE[badge]} ${className}`}
    >
      {AI_BADGE[badge].label}
      {showScore && ` · KI ${score} %`}
    </span>
  );
}

AiBadge.propTypes = {
  skills: PropTypes.array,
  showScore: PropTypes.bool,
  className: PropTypes.string,
};
