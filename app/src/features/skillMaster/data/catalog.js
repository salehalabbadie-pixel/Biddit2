/**
 * Skill catalogue and target roles for the Skill-Master demo.
 *
 * Skill keys are the readable `escoUri` values used in the semester skill files.
 * Labels follow the terminology of the HSG course fact sheets. `esco` marks
 * whether the skill is "ESCO-konzipiert" (URI + German ESCO label of the matching
 * ESCO v1.2 concept) or has "Kein eindeutiges ESCO-Konzept" (nearest concept, if any).
 * `aiAutomation` is the share (0–100) of the skill that AI can automate today;
 * it is maintained here per skill, not re-estimated on every extraction run.
 */
export const SKILLS = {
  "decision-making": {
    label: "Entscheidungsfindung",
    aiAutomation: 20,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/d62d2b4c-a6f8-439e-8a1b-4f29ab5f2c47", label: "Entscheidungen treffen" },
  },
  "context-analysis": {
    label: "Kontext- und Ökosystemanalyse",
    aiAutomation: 15,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/9714735d-6f60-440b-bdbc-aaf45ebcbe78", label: "IuK-Kontext einer Organisation analysieren" },
  },
  "problem-solving": {
    label: "Problemlösung",
    aiAutomation: 20,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/03b9b491-fc9b-4868-914a-bf7cd47b5041", label: "Problemlösungen finden" },
  },
  presenting: {
    label: "Präsentieren und Pitchen",
    aiAutomation: 30,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/c55caed2-de9e-4a25-819e-a0b0e83fba1b", label: "Live-Präsentation geben" },
  },
  "team-leadership": {
    label: "Leadership und Teamführung",
    aiAutomation: 10,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/1f1d2ff8-c4c1-45cc-9812-6a7ee84a73cb", label: "ein Team führen" },
  },
  "critical-thinking": {
    label: "Kritisches Denken",
    aiAutomation: 15,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/b9f16465-56a9-426b-a047-0f9f1f95ec92", label: "sich kritisch mit Problemen auseinandersetzen" },
  },
  "customer-needs": {
    label: "Kunden- und Nutzerbedürfnisse ermitteln",
    aiAutomation: 20,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/68698869-c13c-4563-adc7-118b7644f45d", label: "Kundenbedürfnisse feststellen" },
  },
  negotiating: {
    label: "Verhandlungsführung",
    aiAutomation: 15,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/87de6e49-ca1c-42a4-8751-5ff0b991966b", label: "mit Interessenträgern verhandeln" },
  },
  "business-models": {
    label: "Business Model Innovation",
    aiAutomation: 40,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/3c1cbc5e-2220-4f45-bcc8-3d52c8c9cae0", label: "Geschäftsmodell" },
  },
  prototyping: {
    label: "Prototyping",
    aiAutomation: 35,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/bacbfc27-4b5d-47de-8bfd-af5fa27562a2", label: "Prototyp entwerfen" },
  },
  "data-analysis": {
    label: "Datenanalyse",
    aiAutomation: 75,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/2b92a5b2-6758-4ee3-9fb4-b6387a55cc8f", label: "Datenanalyse durchführen" },
  },
  "market-research": {
    label: "Markt- und Wettbewerbsanalyse",
    aiAutomation: 70,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/fe39d4db-4cb5-4299-bb9f-896c8fd6ab13", label: "Marktforschung durchführen" },
  },
  "financial-modelling": {
    label: "Finanzmodellierung",
    aiAutomation: 75,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/4b2db903-cd8e-48ce-97fb-a92db4def54e", label: "Finanzprognose" },
  },
  programming: {
    label: "Programmierung",
    aiAutomation: 65,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/21d2f96d-35f7-4e3f-9745-c533d2dd6e97", label: "Computerprogrammierung" },
  },
  "product-management": {
    label: "Produktmanagement",
    aiAutomation: 25,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/29fb886c-6be0-4e93-9ea1-232881f2092a", label: "Produktmanagement planen" },
  },
  "supplier-management": {
    label: "Outsourcing- und Lieferantenmanagement",
    aiAutomation: 25,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/fe1ec582-d63b-466c-9149-e7fc4fe93e22", label: "Lieferantenmanagement" },
  },
  "agile-project-management": {
    label: "Agiles Projektmanagement",
    aiAutomation: 20,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/0a9acb6b-1139-4be9-b431-3a80a959f2f4", label: "agiles Projektmanagement" },
  },
  "supply-chain-management": {
    label: "Supply Chain Management",
    aiAutomation: 35,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/f929c89e-c363-4132-a918-e021d57b307c", label: "Lieferkettenmanagement" },
  },
  "circular-economy": {
    label: "Circular Economy",
    aiAutomation: 20,
    esco: { note: "Kein eindeutiges ESCO-Konzept", nearest: { uri: "http://data.europa.eu/esco/skill/4e87c852-602a-4a0e-b8d8-20709ce14ac5", label: "den Lebenszyklus von Ressourcen bewerten" } },
  },
  "innovation-management": {
    label: "Innovationsmanagement",
    aiAutomation: 20,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/2fb8480e-de3c-462b-b169-e8bbb344da68", label: "Innovationsprozesse" },
  },
  "human-behaviour": {
    label: "Verhaltenspsychologie",
    aiAutomation: 10,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/a0e23745-6ba4-45e2-9510-df6e71ed1230", label: "Kenntnisse über das menschliche Verhalten anwenden" },
  },
  "design-thinking": {
    label: "Design Thinking",
    aiAutomation: 20,
    esco: { note: "Kein eindeutiges ESCO-Konzept", nearest: { uri: "http://data.europa.eu/esco/skill/7364cc39-b9c0-449f-9416-57723e2fd9c4", label: "Methodik für nutzerorientierte Gestaltung anwenden" } },
  },
  "ai-solutions": {
    label: "KI-Anwendungen und AI Management",
    aiAutomation: 40,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/e465a154-93f7-4973-9ce1-31659fe16dd2", label: "Grundlagen der künstlichen Intelligenz" },
  },
  "healthcare-management": {
    label: "Management im Gesundheitswesen",
    aiAutomation: 20,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/7d77f9d8-4f9e-4b8f-aa93-bcc1c8ac2173", label: "Betrieb in Gesundheitsdiensteinrichtung verwalten" },
  },
  "strategic-thinking": {
    label: "Strategisches Management",
    aiAutomation: 25,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/6c870993-9341-438b-91c0-c7fe4f96d8f5", label: "strategisch denken" },
  },
  "qualitative-research": {
    label: "Qualitative Forschungsmethoden",
    aiAutomation: 30,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/fa465db3-56e8-4b5d-a781-e2a313a4ed2d", label: "qualitative Forschung betreiben" },
  },
  "project-management": {
    label: "Projektmanagement",
    aiAutomation: 25,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/cd5efa8c-e44d-4cbc-91c6-796018dbed68", label: "Projekte managen" },
  },
  "responsible-innovation": {
    label: "Responsible Innovation",
    aiAutomation: 15,
    esco: { note: "Kein eindeutiges ESCO-Konzept", nearest: { uri: "http://data.europa.eu/esco/skill/66db424f-2abe-420d-8e5b-186607266b61", label: "gesellschaftliche Verantwortung von Unternehmen" } },
  },
  "stakeholder-management": {
    label: "Stakeholder-Management",
    aiAutomation: 20,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/999286f1-22d9-4950-9422-89bd45265a5f", label: "Verbindung zu Interessengruppen aufrechterhalten" },
  },
  "academic-writing": {
    label: "Wissenschaftliches Schreiben",
    aiAutomation: 60,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/c3c2420c-ce9a-4371-8eed-1db479c3a562", label: "wissenschaftliche Arbeiten schreiben" },
  },
  "business-development": {
    label: "Business Development",
    aiAutomation: 30,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/d207a30b-2f80-4138-9b77-f88d549b8768", label: "neue Geschäftsgelegenheiten ermitteln" },
  },
  "aerospace-industry": {
    label: "Aviation & Space Industry",
    aiAutomation: 20,
    esco: { note: "Kein eindeutiges ESCO-Konzept" },
  },
  "low-code-development": {
    label: "Low-Code-Entwicklung und Vibe Coding",
    aiAutomation: 50,
    esco: { note: "Kein eindeutiges ESCO-Konzept", nearest: { uri: "http://data.europa.eu/esco/skill/96eb286a-58b7-45ff-a916-5578d0b79b8c", label: "Rapid Application Development" } },
  },
  "digital-transformation": {
    label: "Digitale Transformation",
    aiAutomation: 25,
    esco: { note: "Kein eindeutiges ESCO-Konzept", nearest: { uri: "http://data.europa.eu/esco/skill/0458f6a0-cb54-4ff5-a543-b2c5354e17c0", label: "beim digitalen Wandel industrieller Prozesse auf dem neuesten Stand sein" } },
  },
  "research-design": {
    label: "Forschungsdesign und -methoden",
    aiAutomation: 30,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/ed3f3dba-3a35-4ed5-b113-67f4d10ef4c8", label: "wissenschaftliche Forschung" },
  },
  "business-it-alignment": {
    label: "Business/IT-Integration",
    aiAutomation: 25,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/ccdbd9bb-4faf-403c-a968-e8bf487f8a53", label: "betriebliche IKT-Systeme" },
  },
  "change-management": {
    label: "Change Management",
    aiAutomation: 15,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/3c03ee71-4a23-448f-b79e-81fd75d27dca", label: "Änderungsmanagement anwenden" },
  },
  "process-management": {
    label: "Prozessmanagement",
    aiAutomation: 35,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/98301d4a-2cc3-439d-8d7f-0b6ac76302bb", label: "Geschäftsprozessmodellierung" },
  },
  "cloud-architecture": {
    label: "Scalable Tech Stacks (Cloud)",
    aiAutomation: 45,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/bd14968e-e409-45af-b362-3495ed7b10e0", label: "Cloud-Technologien" },
  },
  entrepreneurship: {
    label: "Entrepreneurship (Lean Startup)",
    aiAutomation: 20,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/658605f2-1c95-49f0-bd98-0af7b15ad0b0", label: "Unternehmertum" },
  },
  "venture-financing": {
    label: "Start-up-Finanzierung (Venture Capital)",
    aiAutomation: 30,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/3556c075-eee0-4549-b730-48ae70cb5af9", label: "Methoden der Mittelbeschaffung" },
  },
  "digital-analytics": {
    label: "Web, Social und Mobile Analytics",
    aiAutomation: 60,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/1605025e-a179-421f-8f35-5b07d182a6b2", label: "Web-Analyse" },
  },
  "digital-marketing": {
    label: "Digitales Marketing",
    aiAutomation: 45,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/43dfbe7f-9e10-4871-b171-e5076737b4cf", label: "digitale Vermarktungsmethoden" },
  },
  "operations-planning": {
    label: "Integrated Business Planning (S&OP)",
    aiAutomation: 50,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/68e73bf6-2838-4705-86f4-e4bda4ac8a6f", label: "Prognose für Produktnachfrage erstellen" },
  },
  "erp-systems": {
    label: "ERP-Systeme (SAP)",
    aiAutomation: 45,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/f0393af3-bcd9-41af-a36e-0cfb83b60081", label: "Standard-Warenwirtschaftssystem verwalten" },
  },
  "ux-design": {
    label: "User-Centred Design (UI/UX)",
    aiAutomation: 35,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/fd33c66c-70c4-40e6-b87c-5495bd3bf26e", label: "Benutzerschnittstelle konzipieren" },
  },
  "usability-evaluation": {
    label: "Usability-Evaluation",
    aiAutomation: 35,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/be0ff6d8-5e61-4021-9c89-e40cf0b75cc6", label: "Software-Gebrauchstauglichkeit messen" },
  },
  experimentation: {
    label: "Experimentation (Build-Measure-Learn, A/B-Tests)",
    aiAutomation: 35,
    esco: { note: "Kein eindeutiges ESCO-Konzept" },
  },
  "investment-analysis": {
    label: "Due Diligence und Investment-Analyse",
    aiAutomation: 45,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/bf12b461-1c53-4d81-a395-8ba77f7483c4", label: "Investmentanalyse" },
  },
  storytelling: {
    label: "Storytelling",
    aiAutomation: 40,
    esco: { note: "Kein eindeutiges ESCO-Konzept" },
  },
  "enterprise-architecture": {
    label: "Enterprise Architecture",
    aiAutomation: 35,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/c453cf81-6197-428e-84c6-70c773b63f27", label: "IKT-Architekturrahmen" },
  },
  "requirements-engineering": {
    label: "Requirements Engineering",
    aiAutomation: 45,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/d9e5349e-8791-49c2-8ba4-839fdd1606c2", label: "technische Anforderungen definieren" },
  },
  "risk-analysis": {
    label: "Risikoanalyse",
    aiAutomation: 50,
    esco: { note: "ESCO-konzipiert", uri: "http://data.europa.eu/esco/skill/1dd23dba-dd00-45ab-abf4-642902538317", label: "Risikoanalyse durchführen" },
  },
};

/**
 * Target roles. Labels follow Swiss usage. For "ESCO-konzipiert" roles,
 * essential/optional are taken from the referenced ESCO occupation profile(s):
 * a catalog skill counts when its ESCO concept or a closely related ESCO skill
 * is listed there. Roles with "Kein eindeutiges ESCO-Konzept" keep an
 * expert-defined skill set. By project decision, "critical-thinking" is
 * essential in every role. Essential and optional become target levels 80 and 50.
 */
export const ROLES = [
  {
    id: "innovation-manager",
    label: "Innovation Manager",
    esco: {
      note: "ESCO-konzipiert",
      occupations: [
        { uri: "http://data.europa.eu/esco/occupation/73ceb2f9-18e3-4cfe-9c06-e9fb31ece440", code: "1223.2", label: "Forschungs- und Entwicklungsleiter/Forschungs- und Entwicklungsleiterin" },
      ],
    },
    essential: [
      "critical-thinking",
      "context-analysis",
      "presenting",
      "team-leadership",
      "market-research",
      "innovation-management",
      "project-management",
      "responsible-innovation",
      "business-development",
    ],
    optional: [
      "customer-needs",
      "financial-modelling",
      "product-management",
      "qualitative-research",
      "research-design",
      "venture-financing",
      "risk-analysis",
    ],
  },
  {
    id: "strategy-consultant",
    label: "Junior Consultant Strategie",
    esco: {
      note: "ESCO-konzipiert",
      occupations: [
        { uri: "http://data.europa.eu/esco/occupation/6a29d804-f775-446c-bec7-35fc4e28ac97", code: "2421.2", label: "Unternehmensberater/Unternehmensberaterin" },
      ],
    },
    essential: [
      "critical-thinking",
      "decision-making",
      "context-analysis",
      "strategic-thinking",
      "qualitative-research",
      "stakeholder-management",
      "business-development",
      "business-it-alignment",
      "process-management",
    ],
    optional: [
      "presenting",
      "innovation-management",
      "risk-analysis",
    ],
  },
  {
    id: "product-owner",
    label: "Product Owner",
    esco: {
      note: "ESCO-konzipiert",
      occupations: [
        { uri: "http://data.europa.eu/esco/occupation/a79170ad-0b7b-4697-864f-1748359aa10a", code: "1330.6", label: "IT-Produktmanager/IT-Produktmanagerin" },
      ],
    },
    essential: [
      "critical-thinking",
      "market-research",
      "product-management",
      "business-it-alignment",
      "requirements-engineering",
      "risk-analysis",
    ],
    optional: [
      "prototyping",
      "agile-project-management",
      "innovation-management",
      "project-management",
      "low-code-development",
      "process-management",
      "cloud-architecture",
      "digital-analytics",
    ],
  },
  {
    id: "financial-risk-analyst",
    label: "Financial Risk Analyst",
    esco: {
      note: "ESCO-konzipiert",
      occupations: [
        { uri: "http://data.europa.eu/esco/occupation/7a6ca615-a2bc-499d-8288-d186ce2594ea", code: "2413.1.1", label: "Financial Risk Analyst/Financial Risk Analystin" },
      ],
    },
    essential: [
      "critical-thinking",
      "financial-modelling",
      "risk-analysis",
    ],
    optional: [
      "problem-solving",
      "negotiating",
      "data-analysis",
    ],
  },
  {
    id: "sustainable-supply-chain-manager",
    label: "Sustainable Supply Chain Manager",
    esco: {
      note: "ESCO-konzipiert",
      occupations: [
        { uri: "http://data.europa.eu/esco/occupation/aacc3918-b5d3-484b-9480-5d29aa550d74", code: "1324.3.4", label: "Supply-Chain-Manager/Supply-Chain-Managerin" },
      ],
    },
    essential: [
      "critical-thinking",
      "supplier-management",
      "supply-chain-management",
      "responsible-innovation",
      "business-development",
    ],
    optional: [
      "team-leadership",
      "negotiating",
      "data-analysis",
      "market-research",
      "financial-modelling",
      "circular-economy",
      "strategic-thinking",
      "project-management",
      "change-management",
      "operations-planning",
      "erp-systems",
      "investment-analysis",
      "risk-analysis",
    ],
  },
  {
    id: "ai-product-designer",
    label: "AI Product Designer",
    esco: { note: "Kein eindeutiges ESCO-Konzept" },
    essential: [
      "critical-thinking",
      "design-thinking",
      "ai-solutions",
      "customer-needs",
    ],
    optional: [
      "prototyping",
      "presenting",
      "product-management",
      "low-code-development",
      "ux-design",
    ],
  },
  {
    id: "healthcare-manager",
    label: "Healthcare Manager",
    esco: {
      note: "ESCO-konzipiert",
      occupations: [
        { uri: "http://data.europa.eu/esco/occupation/4a29eab1-5f02-4723-a863-e2d5a0614dfa", code: "1342.2", label: "Leiter einer Gesundheitseinrichtung/Leiterin einer Gesundheitseinrichtung" },
      ],
    },
    essential: [
      "critical-thinking",
      "healthcare-management",
      "strategic-thinking",
    ],
    optional: [
      "team-leadership",
      "negotiating",
      "change-management",
    ],
  },
  {
    id: "csr-manager",
    label: "CSR & Responsible Innovation Manager",
    esco: {
      note: "ESCO-konzipiert",
      occupations: [
        { uri: "http://data.europa.eu/esco/occupation/1313aeea-63a9-4b4d-82d1-dbe00ff9ed10", code: "1219.2", label: "Beauftragter für die soziale Verantwortung der Unternehmen/Beauftragte für die soziale Verantwortung der Unternehmen" },
      ],
    },
    essential: [
      "critical-thinking",
      "circular-economy",
      "strategic-thinking",
      "responsible-innovation",
      "business-it-alignment",
    ],
    optional: [
      "project-management",
      "risk-analysis",
    ],
  },
  {
    id: "business-development-manager",
    label: "Business Development Manager (Tech)",
    esco: {
      note: "ESCO-konzipiert",
      occupations: [
        { uri: "http://data.europa.eu/esco/occupation/57b459d4-655c-4053-b189-3c249ce33faf", code: "2434.2", label: "Leiter Geschäftsentwicklung IKT/Leiterin Geschäftsentwicklung IKT" },
      ],
    },
    essential: [
      "critical-thinking",
      "presenting",
      "data-analysis",
      "market-research",
      "innovation-management",
      "strategic-thinking",
      "business-development",
      "business-it-alignment",
      "process-management",
    ],
    optional: [
      "supplier-management",
      "stakeholder-management",
      "investment-analysis",
    ],
  },
  {
    id: "digital-transformation-manager",
    label: "Digital Transformation Manager",
    esco: {
      note: "ESCO-konzipiert",
      occupations: [
        { uri: "http://data.europa.eu/esco/occupation/4b3201cb-ffc5-4f61-9fc3-5c0f0038fa5f", code: "2511.7", label: "Leiter Businessanalyse (IKT)/Leiterin Businessanalyse (IKT)" },
      ],
    },
    essential: [
      "critical-thinking",
      "decision-making",
      "problem-solving",
      "strategic-thinking",
      "project-management",
      "business-it-alignment",
      "process-management",
      "requirements-engineering",
    ],
    optional: [
      "change-management",
    ],
  },
  {
    id: "research-associate",
    label: "Research Associate (Digital Business)",
    esco: {
      note: "ESCO-konzipiert",
      occupations: [
        { uri: "http://data.europa.eu/esco/occupation/5ac65daa-0896-4193-9f0e-8b00746b78a1", code: "2310.1.41", label: "Forschungsassistent/Forschungsassistentin" },
      ],
    },
    essential: [
      "critical-thinking",
      "academic-writing",
      "research-design",
    ],
    optional: [
      "data-analysis",
      "qualitative-research",
    ],
  },
  {
    id: "business-analyst",
    label: "Business Analyst (Digital)",
    esco: {
      note: "ESCO-konzipiert",
      occupations: [
        { uri: "http://data.europa.eu/esco/occupation/fe0fa514-b48d-4a53-9757-a283c0baacf0", code: "2511.8", label: "IT-Business-Analyst" },
      ],
    },
    essential: [
      "critical-thinking",
      "context-analysis",
      "problem-solving",
      "customer-needs",
      "strategic-thinking",
      "business-it-alignment",
      "change-management",
      "process-management",
      "requirements-engineering",
    ],
    optional: [
      "innovation-management",
      "project-management",
      "cloud-architecture",
      "enterprise-architecture",
    ],
  },
  {
    id: "tech-founder",
    label: "Tech Startup Founder",
    esco: { note: "Kein eindeutiges ESCO-Konzept" },
    essential: [
      "critical-thinking",
      "entrepreneurship",
      "business-models",
      "prototyping",
      "low-code-development",
    ],
    optional: [
      "cloud-architecture",
      "customer-needs",
      "programming",
      "business-development",
      "presenting",
      "venture-financing",
      "experimentation",
      "storytelling",
    ],
  },
  {
    id: "data-analyst",
    label: "Data Analyst",
    esco: {
      note: "ESCO-konzipiert",
      occupations: [
        { uri: "http://data.europa.eu/esco/occupation/d3edb8f8-3a06-47a0-8fb9-9b212c006aa2", code: "2511.2", label: "Datenanalytiker/Datenanalytikerin" },
      ],
    },
    essential: [
      "critical-thinking",
      "data-analysis",
    ],
    optional: [
      "presenting",
      "cloud-architecture",
      "digital-analytics",
      "enterprise-architecture",
    ],
  },
  {
    id: "logistics-analyst",
    label: "Logistics Analyst",
    esco: {
      note: "ESCO-konzipiert",
      occupations: [
        { uri: "http://data.europa.eu/esco/occupation/51cd3a7a-eae6-4dc6-9f24-179d7ec6d230", code: "2141.6", label: "Logistik-Analyst/Logistik-Analystin" },
      ],
    },
    essential: [
      "critical-thinking",
      "supply-chain-management",
    ],
    optional: [
      "data-analysis",
      "risk-analysis",
    ],
  },
  {
    id: "ux-designer",
    label: "UX Designer",
    esco: {
      note: "ESCO-konzipiert",
      occupations: [
        { uri: "http://data.europa.eu/esco/occupation/faed411a-f920-4100-86a8-b877928b429c", code: "2511.18", label: "User Experience Analyst" },
        { uri: "http://data.europa.eu/esco/occupation/96e20037-0a25-4bf6-a25e-808d1605d890", code: "2513.3", label: "Multimedia-Designer/Multimedia-Designerin" },
      ],
    },
    essential: [
      "critical-thinking",
      "presenting",
      "customer-needs",
      "prototyping",
      "programming",
      "human-behaviour",
      "design-thinking",
      "qualitative-research",
      "stakeholder-management",
      "business-it-alignment",
      "ux-design",
      "usability-evaluation",
      "requirements-engineering",
    ],
    optional: [
      "market-research",
      "agile-project-management",
      "low-code-development",
      "process-management",
      "digital-analytics",
      "erp-systems",
    ],
  },
  {
    id: "vc-analyst",
    label: "Venture Capital Analyst",
    esco: {
      note: "ESCO-konzipiert",
      occupations: [
        { uri: "http://data.europa.eu/esco/occupation/659b0ffd-337c-4a1f-82e3-2730812279de", code: "2412.11", label: "Risikokapitalgeber/Risikokapitalgeberin" },
      ],
    },
    essential: [
      "critical-thinking",
      "decision-making",
      "financial-modelling",
      "stakeholder-management",
      "venture-financing",
      "investment-analysis",
      "risk-analysis",
    ],
    optional: [],
  },
  {
    id: "ebusiness-manager",
    label: "E-Business Manager",
    esco: {
      note: "ESCO-konzipiert",
      occupations: [
        { uri: "http://data.europa.eu/esco/occupation/586fe133-1987-41f4-b89a-f39d4bc58e1e", code: "2431.10.2", label: "E-Business-Manager/E-Business-Managerin" },
      ],
    },
    essential: [
      "critical-thinking",
      "strategic-thinking",
      "digital-transformation",
      "business-it-alignment",
      "process-management",
      "digital-marketing",
    ],
    optional: [
      "decision-making",
      "customer-needs",
      "stakeholder-management",
      "digital-analytics",
    ],
  },
  {
    id: "cio",
    label: "Chief Information Officer (CIO)",
    esco: {
      note: "ESCO-konzipiert",
      occupations: [
        { uri: "http://data.europa.eu/esco/occupation/82f90e87-de92-4678-adae-61d3e5f7e1e4", code: "1330.2", label: "IT-Leiter/IT-Leiterin" },
      ],
    },
    essential: [
      "critical-thinking",
      "digital-transformation",
      "cloud-architecture",
      "enterprise-architecture",
    ],
    optional: [
      "team-leadership",
      "prototyping",
      "programming",
      "agile-project-management",
      "low-code-development",
      "process-management",
      "erp-systems",
    ],
  },
];
