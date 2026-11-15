/**
 * Interest areas for step 3 of the profile wizard. Every catalogue skill belongs
 * to exactly one area, so the areas can be derived from the skills the
 * Merkblätter assign to a student's courses.
 */
export const INTEREST_AREAS = [
  {
    id: "strategy-innovation",
    label: "Strategie & Innovation",
    skills: ["strategic-thinking", "innovation-management", "business-models", "business-development", "context-analysis", "design-thinking", "responsible-innovation"],
  },
  {
    id: "decision-risk",
    label: "Entscheiden & Risiko",
    skills: ["decision-making", "risk-analysis", "critical-thinking", "problem-solving"],
  },
  {
    id: "finance-venture",
    label: "Finanzen & Gründen",
    skills: ["financial-modelling", "investment-analysis", "venture-financing", "entrepreneurship"],
  },
  {
    id: "digital-products",
    label: "Digitale Produkte",
    skills: ["product-management", "ux-design", "usability-evaluation", "prototyping", "experimentation", "requirements-engineering", "customer-needs"],
  },
  {
    id: "digital-health",
    label: "Digital Health",
    skills: ["healthcare-management"],
  },
  {
    id: "tech-code",
    label: "Technologie & Code",
    skills: ["programming", "low-code-development", "cloud-architecture", "ai-solutions", "enterprise-architecture", "business-it-alignment", "erp-systems"],
  },
  {
    id: "data-markets",
    label: "Daten & Märkte",
    skills: ["data-analysis", "digital-analytics", "market-research", "digital-marketing"],
  },
  {
    id: "people-leadership",
    label: "Menschen & Führung",
    skills: ["team-leadership", "negotiating", "stakeholder-management", "human-behaviour", "presenting", "storytelling"],
  },
  {
    id: "projects-change",
    label: "Projekte & Wandel",
    skills: ["project-management", "agile-project-management", "change-management", "digital-transformation", "process-management"],
  },
  {
    id: "operations-sustainability",
    label: "Operations & Nachhaltigkeit",
    skills: ["supply-chain-management", "supplier-management", "operations-planning", "circular-economy", "aerospace-industry"],
  },
  {
    id: "research",
    label: "Forschung & Methoden",
    skills: ["qualitative-research", "research-design", "academic-writing"],
  },
];
