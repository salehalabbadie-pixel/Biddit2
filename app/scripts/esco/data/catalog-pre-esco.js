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
  "product-management": { label: "Produktmanagement durchführen", aiAutomation: 25 },
  "supplier-management": { label: "Outsourcing und Lieferanten steuern", aiAutomation: 25 },
  "agile-project-management": { label: "Agiles Projektmanagement anwenden", aiAutomation: 20 },
  "supply-chain-management": { label: "Lieferketten analysieren und gestalten", aiAutomation: 35 },
  "circular-economy": { label: "Kreislaufwirtschaft umsetzen", aiAutomation: 20 },
  "innovation-management": { label: "Innovationsprozesse gestalten", aiAutomation: 20 },
  "human-behaviour": { label: "Kenntnisse über menschliches Verhalten anwenden", aiAutomation: 10 },
  "design-thinking": { label: "Design Thinking anwenden", aiAutomation: 20 },
  "ai-solutions": { label: "KI-Lösungen konzipieren und einsetzen", aiAutomation: 40 },
  "healthcare-management": { label: "Gesundheitseinrichtungen managen", aiAutomation: 20 },
  "strategic-thinking": { label: "Strategisches Denken anwenden", aiAutomation: 25 },
  "qualitative-research": { label: "Qualitative Forschung betreiben", aiAutomation: 30 },
  "project-management": { label: "Projektmanagement durchführen", aiAutomation: 25 },
  "responsible-innovation": { label: "Ethische Risiken von Innovationen bewerten", aiAutomation: 15 },
  "stakeholder-management": { label: "Stakeholder identifizieren und einbinden", aiAutomation: 20 },
  "academic-writing": { label: "Wissenschaftliche Texte verfassen", aiAutomation: 60 },
  "business-development": { label: "Geschäftsentwicklung vorantreiben", aiAutomation: 30 },
  "aerospace-industry": { label: "Luft- und Raumfahrtbranche verstehen", aiAutomation: 20 },
  "low-code-development": { label: "Anwendungen mit Low-Code und KI-Tools entwickeln", aiAutomation: 50 },
  "digital-transformation": { label: "Digitale Transformation gestalten", aiAutomation: 25 },
  "research-design": { label: "Forschungsdesigns entwickeln und anwenden", aiAutomation: 30 },
  "business-it-alignment": { label: "Business und IT integrieren", aiAutomation: 25 },
  "change-management": { label: "Veränderungsprozesse begleiten", aiAutomation: 15 },
  "process-management": { label: "Prozesse und Organisationen gestalten", aiAutomation: 35 },
  "cloud-architecture": { label: "Skalierbare Cloud-Architekturen aufbauen", aiAutomation: 45 },
  entrepreneurship: { label: "Unternehmerische Chancen erkennen und validieren", aiAutomation: 20 },
  "venture-financing": { label: "Finanzierung für Ventures sichern", aiAutomation: 30 },
  "digital-analytics": { label: "Web- und Social-Media-Analytics anwenden", aiAutomation: 60 },
  "digital-marketing": { label: "Digitale Kanäle und Kampagnen steuern", aiAutomation: 45 },
  "operations-planning": { label: "Absatz- und Produktionsplanung durchführen", aiAutomation: 50 },
  "erp-systems": { label: "ERP- und Planungssysteme (z. B. SAP) anwenden", aiAutomation: 45 },
  "ux-design": { label: "Benutzeroberflächen mit hoher Usability gestalten", aiAutomation: 35 },
  "usability-evaluation": { label: "Usability-Studien planen und auswerten", aiAutomation: 35 },
  experimentation: { label: "Produkthypothesen mit Experimenten testen", aiAutomation: 35 },
  "investment-analysis": { label: "Start-ups und Investments bewerten (Due Diligence)", aiAutomation: 45 },
  storytelling: { label: "Geschäftsideen mit Storytelling vermitteln", aiAutomation: 40 },
  "enterprise-architecture": { label: "Unternehmens- und IT-Architekturen gestalten", aiAutomation: 35 },
  "requirements-engineering": { label: "Anforderungen erheben und spezifizieren", aiAutomation: 45 },
  "risk-analysis": { label: "Risiken und Wahrscheinlichkeiten beurteilen", aiAutomation: 50 },
};

/**
 * Target roles. Each one stands for an ESCO occupation; ESCO lists essential
 * and optional skills per occupation, which become target levels 80 and 50.
 */
export const ROLES = [
  {
    id: "innovation-manager",
    label: "Innovation Manager",
    essential: ["problem-solving", "business-models", "context-analysis", "innovation-management"],
    optional: ["negotiating", "prototyping", "presenting", "human-behaviour", "design-thinking", "responsible-innovation"],
  },
  {
    id: "strategy-consultant",
    label: "Junior Consultant Strategie",
    essential: ["context-analysis", "presenting", "problem-solving", "strategic-thinking"],
    optional: ["team-leadership", "data-analysis", "business-models", "qualitative-research", "project-management", "market-research", "academic-writing"],
  },
  {
    id: "product-owner",
    label: "Product Owner",
    essential: ["customer-needs", "prototyping", "team-leadership", "product-management"],
    optional: ["critical-thinking", "programming", "problem-solving", "agile-project-management", "supplier-management", "ux-design", "experimentation", "requirements-engineering"],
  },
  {
    id: "risk-analyst",
    label: "Risk & Decision Analyst",
    essential: ["decision-making", "critical-thinking", "data-analysis", "risk-analysis"],
    optional: ["financial-modelling", "presenting", "human-behaviour"],
  },
  {
    id: "sustainable-supply-chain-manager",
    label: "Sustainable Supply Chain Manager",
    essential: ["supply-chain-management", "circular-economy"],
    optional: ["supplier-management", "context-analysis", "problem-solving", "operations-planning"],
  },
  {
    id: "ai-product-designer",
    label: "AI Product Designer",
    essential: ["design-thinking", "ai-solutions", "customer-needs"],
    optional: ["prototyping", "presenting", "product-management", "low-code-development", "ux-design"],
  },
  {
    id: "healthcare-manager",
    label: "Healthcare Manager",
    essential: ["healthcare-management", "strategic-thinking", "project-management"],
    optional: ["context-analysis", "presenting", "qualitative-research", "change-management", "process-management"],
  },
  {
    id: "csr-manager",
    label: "CSR & Responsible Innovation Manager",
    essential: ["responsible-innovation", "stakeholder-management", "context-analysis"],
    optional: ["circular-economy", "business-models", "critical-thinking", "presenting", "academic-writing"],
  },
  {
    id: "business-development-manager",
    label: "Business Development Manager (Tech)",
    essential: ["business-development", "market-research", "strategic-thinking"],
    optional: ["business-models", "stakeholder-management", "presenting", "financial-modelling", "aerospace-industry", "storytelling"],
  },
  {
    id: "digital-transformation-manager",
    label: "Digital Transformation Manager",
    essential: ["digital-transformation", "low-code-development", "project-management"],
    optional: ["ai-solutions", "prototyping", "customer-needs", "stakeholder-management", "business-it-alignment", "change-management", "process-management", "cloud-architecture", "enterprise-architecture"],
  },
  {
    id: "research-associate",
    label: "Research Associate (Digital Business)",
    essential: ["research-design", "qualitative-research", "academic-writing"],
    optional: ["critical-thinking", "data-analysis", "presenting", "digital-transformation"],
  },
  {
    id: "business-analyst",
    label: "Business Analyst (Digital)",
    essential: ["business-it-alignment", "customer-needs", "problem-solving"],
    optional: ["qualitative-research", "project-management", "digital-transformation", "data-analysis", "process-management", "requirements-engineering", "enterprise-architecture"],
  },
  {
    id: "tech-founder",
    label: "Tech Startup Founder",
    essential: ["entrepreneurship", "business-models", "prototyping", "low-code-development"],
    optional: ["cloud-architecture", "customer-needs", "programming", "business-development", "presenting", "venture-financing", "experimentation", "storytelling"],
  },
  {
    id: "data-translator",
    label: "Data Translator / Digital Analyst",
    essential: ["digital-analytics", "data-analysis", "business-it-alignment"],
    optional: ["digital-marketing", "presenting", "ai-solutions", "critical-thinking"],
  },
  {
    id: "supply-chain-planner",
    label: "Supply Chain Planner",
    essential: ["operations-planning", "supply-chain-management", "erp-systems"],
    optional: ["data-analysis", "decision-making", "financial-modelling", "process-management"],
  },
  {
    id: "ux-designer",
    label: "UX Designer",
    essential: ["ux-design", "usability-evaluation", "prototyping"],
    optional: ["customer-needs", "design-thinking", "human-behaviour", "qualitative-research", "experimentation"],
  },
  {
    id: "vc-analyst",
    label: "Venture Capital Analyst",
    essential: ["investment-analysis", "venture-financing", "financial-modelling"],
    optional: ["entrepreneurship", "market-research", "strategic-thinking", "negotiating", "presenting", "risk-analysis"],
  },
];
