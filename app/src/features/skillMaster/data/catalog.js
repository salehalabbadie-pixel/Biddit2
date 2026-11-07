/**
 * Skill catalogue and target roles for the Skill-Master demo.
 *
 * Keys are the `escoUri` values used in the semester skill files. Here they are
 * readable placeholders. Before a pilot, replace each id with
 * the real ESCO URI and the label with its German ESCO preferred label.
 * `aiAutomation` is the share (0–100) of the skill that AI can automate today;
 * it is maintained here per skill, not re-estimated on every extraction run.
 */
export const SKILLS = {
  "decision-making": { label: "Entscheidungen treffen", aiAutomation: 20 },
  "context-analysis": { label: "Zusammenhänge analysieren", aiAutomation: 15 },
  "problem-solving": { label: "Lösungen für Probleme entwickeln", aiAutomation: 20 },
  presenting: { label: "Präsentationen halten", aiAutomation: 30 },
  "team-leadership": { label: "Teams leiten", aiAutomation: 10 },
  "critical-thinking": { label: "Kritisch denken", aiAutomation: 15 },
  "customer-needs": { label: "Kundenbedürfnisse ermitteln", aiAutomation: 20 },
  negotiating: { label: "Verhandlungen führen", aiAutomation: 15 },
  "business-models": { label: "Geschäftsmodelle entwickeln", aiAutomation: 40 },
  prototyping: { label: "Prototypen entwickeln", aiAutomation: 35 },
  "data-analysis": { label: "Daten analysieren", aiAutomation: 75 },
  "market-research": { label: "Marktforschung durchführen", aiAutomation: 70 },
  "financial-modelling": { label: "Finanzprognosen erstellen", aiAutomation: 75 },
  programming: { label: "Software programmieren", aiAutomation: 65 },
};

/**
 * Target roles. Each one stands for an ESCO occupation; ESCO lists essential
 * and optional skills per occupation, which become target levels 80 and 50.
 */
export const ROLES = [
  {
    id: "innovation-manager",
    label: "Innovation Manager",
    essential: ["problem-solving", "business-models", "context-analysis"],
    optional: ["negotiating", "prototyping", "presenting"],
  },
  {
    id: "strategy-consultant",
    label: "Junior Consultant Strategie",
    essential: ["context-analysis", "presenting", "problem-solving"],
    optional: ["team-leadership", "data-analysis", "business-models"],
  },
  {
    id: "product-owner",
    label: "Product Owner",
    essential: ["customer-needs", "prototyping", "team-leadership"],
    optional: ["critical-thinking", "programming", "problem-solving"],
  },
  {
    id: "risk-analyst",
    label: "Risk & Decision Analyst",
    essential: ["decision-making", "critical-thinking", "data-analysis"],
    optional: ["financial-modelling", "presenting"],
  },
];
