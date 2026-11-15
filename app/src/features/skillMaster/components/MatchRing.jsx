import PropTypes from "prop-types";
import { MATCH_THRESHOLD } from "../domain/match";

const RADIUS = 17;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Match of a course as a ring with the percentage inside and «MATCH» below.
 * `match` null shows a dash; `reason` then says why (no job, no skill data).
 */
export default function MatchRing({ match, reason, compact = false }) {
  const known = match !== null && match !== undefined;
  const colour = !known
    ? "text-gray-300"
    : match >= 75
    ? "text-hsg-800"
    : match >= MATCH_THRESHOLD
    ? "text-hsg-600"
    : "text-gray-400";
  const label = known ? `Match zu deinen Zieljobs: ${match} %` : reason;

  return (
    <div
      data-testid="skill-match-ring"
      role="img"
      aria-label={label}
      title={label}
      className="flex flex-col items-center justify-center flex-shrink-0 gap-0.5"
    >
      <span className={`relative inline-flex items-center justify-center ${compact ? "w-10 h-10" : "w-11 h-11"}`}>
        <svg viewBox="0 0 40 40" className="absolute inset-0 w-full h-full -rotate-90" aria-hidden="true">
          <circle cx="20" cy="20" r={RADIUS} fill="none" strokeWidth="4" className="stroke-gray-200" />
          {known && (
            <circle
              cx="20"
              cy="20"
              r={RADIUS}
              fill="none"
              strokeWidth="4"
              strokeLinecap="round"
              stroke="currentColor"
              className={colour}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - match / 100)}
            />
          )}
        </svg>
        <span className={`relative ${compact ? "text-[10px]" : "text-xs"} font-bold ${known ? "text-gray-900" : "text-gray-400"}`}>
          {known ? `${match}%` : "–"}
        </span>
      </span>
      {!compact && <span className="text-[10px] font-medium tracking-wide text-hsg-800">MATCH</span>}
    </div>
  );
}

MatchRing.propTypes = {
  match: PropTypes.number,
  reason: PropTypes.string,
  /** Smaller, without the «MATCH» caption (lists in the Skill-Gap tab). */
  compact: PropTypes.bool,
};
