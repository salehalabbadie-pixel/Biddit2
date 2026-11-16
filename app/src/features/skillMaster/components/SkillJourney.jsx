import PropTypes from "prop-types";
import { JOURNEY_STEPS } from "../domain/journey";
import { MATCH_THRESHOLD } from "../domain/match";

/** What to tell and offer for the step the student is on. */
function nextStep(journey) {
  switch (journey.current) {
    case "profile":
      return {
        title: "Starte hier: Lege dein Skill-Profil an",
        text: "Zieljobs, Erfahrung und Interessen, in etwa zwei Minuten. Danach zeigt die Liste deinen Match pro Kurs.",
        cta: "Profil anlegen",
      };
    case "courses":
      return {
        title: "Nächster Schritt: Kurse wählen",
        text: `Plane Kurse mit mindestens ${MATCH_THRESHOLD} % Match, die deine Lücken schliessen.`,
        cta: "Empfehlungen ansehen",
      };
    case "bidding":
      return {
        title: "Nächster Schritt: ins Bidding übernehmen",
        text:
          journey.waiting > 0
            ? `${journey.waiting} geplante ${journey.waiting === 1 ? "Kurs wartet" : "Kurse warten"} auf die Übernahme ins Bidding.`
            : "Übernimm deine geplanten Kurse ins Bidding.",
        cta: "Zum Bidding-Schritt",
      };
    default:
      return {
        title: "Geschafft",
        text: `${journey.strongInBidding} ${journey.strongInBidding === 1 ? "Kurs" : "Kurse"} mit gutem Match ${
          journey.strongInBidding === 1 ? "ist" : "sind"
        } im Bidding. Du kannst dein Profil jederzeit nachschärfen.`,
        cta: null,
      };
  }
}

/**
 * The three-step guide (Profil anlegen → Kurse wählen → Ins Bidding) with the
 * next step and one button for it. `onAction(stepId)` performs that step:
 * the caller decides whether it opens the wizard, a tab or scrolls.
 */
export default function SkillJourney({ journey, onAction }) {
  const next = nextStep(journey);
  return (
    <div data-testid="skill-journey">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs" aria-label="Dein Weg zu den passenden Kursen">
        {JOURNEY_STEPS.map((step, i) => {
          const done = journey.done[step.id];
          const current = journey.current === step.id;
          return (
            <li key={step.id} className="flex items-center gap-2" aria-current={current ? "step" : undefined}>
              {i > 0 && <span aria-hidden="true" className="w-4 h-px bg-gray-300" />}
              <span
                className={`flex items-center justify-center w-5 h-5 text-[11px] font-bold rounded-full ${
                  done
                    ? "bg-hsg-800 text-white"
                    : current
                    ? "bg-white text-hsg-800 border-2 border-hsg-800"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span className={current ? "font-semibold text-gray-900" : done ? "text-hsg-800" : "text-gray-500"}>
                {step.label}
                {done && <span className="sr-only"> (erledigt)</span>}
              </span>
            </li>
          );
        })}
      </ol>
      <div
        className={`flex flex-wrap items-center justify-between gap-3 mt-3 ${
          next.cta ? "p-3 bg-white border border-green-200 rounded-lg" : ""
        }`}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{next.title}</p>
          <p className="text-xs text-gray-600">{next.text}</p>
        </div>
        {next.cta && (
          <button
            type="button"
            onClick={() => onAction(journey.current)}
            className="shrink-0 px-4 py-2 text-sm font-semibold text-white rounded-lg bg-hsg-800 hover:bg-hsg-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-hsg-600 focus-visible:ring-offset-2"
          >
            {next.cta} →
          </button>
        )}
      </div>
    </div>
  );
}

SkillJourney.propTypes = {
  journey: PropTypes.shape({
    done: PropTypes.object.isRequired,
    current: PropTypes.string,
    waiting: PropTypes.number,
    strongInBidding: PropTypes.number,
  }).isRequired,
  onAction: PropTypes.func.isRequired,
};
