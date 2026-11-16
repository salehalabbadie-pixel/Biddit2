/**
 * The guided Skill-Master journey: create the profile, choose courses that fit,
 * hand them over to bidding. Pure, so the step logic is unit-tested.
 */
import { MATCH_THRESHOLD } from "./match";

export const JOURNEY_STEPS = [
  { id: "profile", label: "Profil anlegen" },
  { id: "courses", label: "Kurse wählen" },
  { id: "bidding", label: "Ins Bidding" },
];

/**
 * Where the student stands. `planned` are the overview's plan entries
 * ({ result, status: "enrolled" | "selected" | "planned" }), `waiting` the
 * number of courses planned here but not yet handed over to bidding.
 * - profile: at least one target job
 * - courses: a course with ≥ 50 % match is planned or in the selection
 * - bidding: such a course is in the selection and nothing waits for hand-over
 * Returns { done: { profile, courses, bidding }, current (first open step id or
 * null when complete), strongChosen, strongInBidding, waiting }.
 */
export function journeyState({ hasRole, planned, waiting }) {
  const strong = (entry) => (entry.result.match ?? 0) >= MATCH_THRESHOLD;
  const strongChosen = planned.filter((e) => e.status !== "enrolled" && strong(e)).length;
  const strongInBidding = planned.filter((e) => e.status === "selected" && strong(e)).length;
  const done = {
    profile: hasRole,
    courses: hasRole && strongChosen > 0,
    bidding: hasRole && strongInBidding > 0 && waiting === 0,
  };
  const current = JOURNEY_STEPS.find((step) => !done[step.id])?.id ?? null;
  return { done, current, strongChosen, strongInBidding, waiting };
}
