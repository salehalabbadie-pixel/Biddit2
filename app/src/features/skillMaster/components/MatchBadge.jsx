import PropTypes from "prop-types";
import { MATCH_THRESHOLD } from "../domain/match";

/** Compact match pill for the course list row (row height stays 75 px). */
export default function MatchBadge({ match }) {
  if (match === null || match === undefined) return null;
  const strong = match >= 75;
  const good = match >= MATCH_THRESHOLD;
  return (
    <span
      data-testid="skill-match-badge"
      title={`Match zu deiner Zielrolle: ${match} %`}
      className={`flex-shrink-0 ml-auto px-1.5 py-0.5 rounded-full text-xs font-semibold ${
        strong
          ? "bg-hsg-800 text-white"
          : good
          ? "bg-green-100 text-hsg-800"
          : "bg-gray-100 text-gray-500"
      }`}
    >
      {match} %
    </span>
  );
}

MatchBadge.propTypes = {
  match: PropTypes.number,
};
