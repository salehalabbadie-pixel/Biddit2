import { describe, expect, it } from "vitest";
import { ROLES, SKILLS } from "../data/catalog";
import { INTEREST_AREAS } from "../data/interests";
import { KEYWORDS } from "../data/keywords";
import { areasFromCourses, interestFit, interestSkillSet, matchPastCourses } from "../domain/profile";
import { adTitle, findSkills, isLink, matchJobTitle } from "../domain/textAnalysis";

describe("catalogue coverage", () => {
  it("has search terms for every skill and no stale ones", () => {
    expect(Object.keys(KEYWORDS).sort()).toEqual(Object.keys(SKILLS).sort());
  });

  it("puts every skill into exactly one interest area", () => {
    const ids = INTEREST_AREAS.flatMap((area) => area.skills);
    expect(ids.sort()).toEqual(Object.keys(SKILLS).sort());
  });
});

describe("findSkills", () => {
  const cv = [
    "Praktikum Strategieberatung (2026, 4 Monate)",
    "Marktanalysen erstellt und Ergebnisse vor dem Kunden präsentiert",
    "Ressortleitung Studierendenverein: Verhandlungen mit Sponsoren",
  ].join("\n");

  it("finds skills by word stems, German and English, and quotes the line", () => {
    const found = Object.fromEntries(findSkills(cv).map((f) => [f.id, f.snippet]));
    expect(found["strategic-thinking"]).toMatch(/Strategieberatung/);
    expect(found["market-research"]).toMatch(/Marktanalysen/);
    expect(found.presenting).toMatch(/präsentiert/);
    expect(found.negotiating).toMatch(/Verhandlungen/);
    expect(found["team-leadership"]).toMatch(/Ressortleitung/);
    expect(findSkills("Built a Python prototype").map((f) => f.id)).toEqual(
      expect.arrayContaining(["programming", "prototyping"])
    );
  });

  it("matches at word starts only", () => {
    // "excellent" must not count as Excel, "research" not as "sea".
    expect(findSkills("excellent research").map((f) => f.id)).not.toContain("data-analysis");
    expect(findSkills("")).toEqual([]);
  });
});

describe("job titles and job ads", () => {
  it("finds the catalogue job a typed title names", () => {
    expect(matchJobTitle("Venture Analyst", ROLES)?.id).toBe("vc-analyst");
    expect(matchJobTitle("product owner", ROLES)?.id).toBe("product-owner");
    expect(matchJobTitle("Koch", ROLES)).toBeNull();
  });

  it("recognises a bare link and names an ad by its first line", () => {
    expect(isLink(" https://www.jobs.ch/de/stellenangebote/detail/123/ ")).toBe(true);
    expect(isLink("Siehe https://x.ch")).toBe(false);
    expect(adTitle("\n  Venture Analyst (80–100 %)\nText")).toBe("Venture Analyst (80–100 %)");
    expect(adTitle("")).toBe("Stellenanzeige");
  });
});

describe("matchPastCourses", () => {
  const skills = [{ escoUri: "business-models", contribution: 20, status: "extracted" }];
  const skillData = { courses: [{ courseNumber: "7,001,1.00", title: "Business Innovation I: Geschäftsmodelle entwickeln", skills }] };
  const catalog = [{ courseNumber: "7,000,1.00", shortName: "Grundlagen Business Innovation", classification: "Fundamentals of Business Innovation" }];
  const skillsOf = (course) => (course.courseNumber === "7,000,1.00" ? skills : null);

  it("matches transcript names to the German or English course name", () => {
    const { matched, unmatched } = matchPastCourses(
      [
        { name: "Fundamentals of Business Innovation", semester: "HS 23" },
        { name: "Business Innovation I: Geschäftsmodelle entwickeln" },
        { name: "Rhetorik" },
        { name: "Rhetorik" },
      ],
      skillData,
      catalog,
      skillsOf
    );
    expect(matched.map((c) => c.name)).toEqual([
      "Fundamentals of Business Innovation",
      "Business Innovation I: Geschäftsmodelle entwickeln",
    ]);
    expect(matched[0].semester).toBe("HS 23");
    expect(unmatched).toBe(1); // duplicates count once
  });
});

describe("interests", () => {
  it("suggests the areas the courses train most", () => {
    const areas = areasFromCourses([
      [{ escoUri: "programming", contribution: 30 }],
      [{ escoUri: "strategic-thinking", contribution: 10 }],
    ]);
    expect(areas.map((a) => a.id)).toEqual(["tech-code", "strategy-innovation"]);
  });

  it("weights a course by the share of its skills on the interests", () => {
    const set = interestSkillSet(["digital-health"], ["programming"]);
    expect([...set].sort()).toEqual(["healthcare-management", "programming"]);
    const course = [
      { escoUri: "programming", contribution: 30 },
      { escoUri: "presenting", contribution: 10 },
    ];
    expect(interestFit(course, set)).toBe(75);
    expect(interestFit(course, new Set())).toBeNull();
  });
});
