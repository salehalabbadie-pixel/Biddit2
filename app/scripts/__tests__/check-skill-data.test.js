import { describe, expect, it } from "vitest";
import { checkSkillData, readSkillFiles } from "../check-skill-data.mjs";

const SKILLS = {
  "data-analysis": { label: "Datenanalyse", aiAutomation: 75 },
  presenting: { label: "Präsentieren", aiAutomation: 30 },
};
const ROLES = [{ id: "analyst", label: "Analyst", essential: ["data-analysis"], optional: ["presenting"] }];

const skill = (escoUri, aiAutomation, contribution = 10) => ({
  escoUri,
  contribution,
  evidence: "Lernziel: …",
  aiAutomation,
  status: "extracted",
});
const file = (courses) => [{ name: "TEST.json", text: JSON.stringify({ schemaVersion: "1.0", courses }) }];
const course = (courseNumber, title, skills) => ({
  courseNumber,
  rootKey: courseNumber.split(",").slice(0, 2).join(","),
  title,
  skills,
});

describe("check-skill-data", () => {
  it("accepts the shipped catalogue and semester files", () => {
    const { errors } = checkSkillData({ files: readSkillFiles() });
    expect(errors).toEqual([]);
  });

  it("accepts consistent data", () => {
    const files = file([course("7,001,1.00", "Kurs", [skill("data-analysis", 75)])]);
    expect(checkSkillData({ skills: SKILLS, roles: ROLES, files }).errors).toEqual([]);
  });

  it("reports a course skill that is missing from the catalogue", () => {
    const files = file([course("7,001,1.00", "Kurs", [skill("unknown-skill", 10)])]);
    const { errors } = checkSkillData({ skills: SKILLS, roles: ROLES, files });
    expect(errors.join()).toMatch(/«unknown-skill» fehlt in SKILLS/);
  });

  it("reports an aiAutomation that differs from the catalogue as an error", () => {
    const files = file([course("7,001,1.00", "Kurs", [skill("data-analysis", 60)])]);
    const { errors } = checkSkillData({ skills: SKILLS, roles: ROLES, files });
    expect(errors.join()).toMatch(/aiAutomation von «data-analysis» ist 60, im Katalog 75/);
  });

  it("reports cross-listed courses whose skills drifted apart", () => {
    const files = file([
      course("7,019,1.00", "Design Thinking", [skill("data-analysis", 75, 20)]),
      course("8,023,1.00", "Design Thinking", [skill("data-analysis", 75, 15)]),
    ]);
    const { errors } = checkSkillData({ skills: SKILLS, roles: ROLES, files });
    expect(errors.join()).toMatch(/weichen vom gleichnamigen Kurs 7,019,1.00 ab/);
  });

  it("reports a wrong rootKey and a role naming an unknown skill", () => {
    const files = file([{ ...course("7,001,1.00", "Kurs", [skill("data-analysis", 75)]), rootKey: "7,002" }]);
    const roles = [...ROLES, { id: "x", label: "X", essential: ["ghost"], optional: [] }];
    const { errors } = checkSkillData({ skills: SKILLS, roles, files });
    expect(errors.join()).toMatch(/rootKey muss «7,001» sein/);
    expect(errors.join()).toMatch(/Rolle «X» nennt den Skill «ghost»/);
  });
});
