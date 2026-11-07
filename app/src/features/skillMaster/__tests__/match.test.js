import { describe, expect, it } from "vitest";
import {
  aiBadge,
  aiScore,
  currentLevels,
  gapCoverage,
  gaps,
  indexSkillData,
  levelsWithPlan,
  matchScore,
  roleFit,
  skillsForCourse,
  targetLevels,
} from "../domain/match";

const ROLES = [
  { id: "a", essential: ["x"], optional: ["y"] },
  { id: "b", essential: ["y"], optional: [] },
];

describe("targetLevels", () => {
  it("takes the highest level any chosen role asks for", () => {
    expect(targetLevels(ROLES, ["a"])).toEqual({ x: 80, y: 50 });
    expect(targetLevels(ROLES, ["a", "b"])).toEqual({ x: 80, y: 80 });
    expect(targetLevels(ROLES, [])).toEqual({});
  });
});

describe("currentLevels and gaps", () => {
  it("maps answers to levels and never returns a negative gap", () => {
    const levels = currentLevels({ x: "solid", y: "basic", z: "none" });
    expect(levels).toEqual({ x: 70, y: 40, z: 0 });
    expect(gaps({ x: 50, y: 80 }, levels)).toEqual({ x: 0, y: 40 });
  });
});

describe("skillsForCourse", () => {
  const index = indexSkillData({
    courses: [
      {
        courseNumber: "7,001,1.00",
        rootKey: "7,001",
        skills: [
          { escoUri: "x", contribution: 10, aiAutomation: 20, status: "extracted" },
          { escoUri: "y", contribution: 10, aiAutomation: 20, status: "rejected" },
        ],
      },
    ],
  });

  it("finds a course by number or by its root key and drops rejected skills", () => {
    expect(skillsForCourse(index, { courseNumber: "7,001,1.00" })).toHaveLength(1);
    expect(skillsForCourse(index, { courseNumber: "7,001,2.04" })).toHaveLength(1);
    expect(skillsForCourse(index, { courseNumber: "9,999,1.00" })).toBeNull();
  });
});

describe("roleFit and matchScore", () => {
  const skills = [
    { escoUri: "x", contribution: 30, aiAutomation: 20 },
    { escoUri: "z", contribution: 10, aiAutomation: 80 },
  ];

  it("rewards courses that close open gaps", () => {
    expect(roleFit(skills, { x: 80 })).toBe(75);
    expect(roleFit(skills, {})).toBe(0);
    expect(roleFit(null, { x: 80 })).toBeNull();
  });

  it("weights role fit 60 % and interests 40 %", () => {
    expect(matchScore(80)).toBe(80);
    expect(matchScore(80, 50)).toBe(68);
    expect(matchScore(null, 50)).toBeNull();
  });
});

describe("AI badge", () => {
  it("weights automation by contribution", () => {
    const skills = [
      { contribution: 30, aiAutomation: 20 },
      { contribution: 10, aiAutomation: 80 },
    ];
    expect(aiScore(skills)).toBe(35);
    expect(aiBadge(35)).toBe("resilient");
    expect(aiBadge(50)).toBe("partial");
    expect(aiBadge(70)).toBe("strong");
  });
});

describe("plan coverage", () => {
  it("counts only gap points the planned courses close", () => {
    const targets = { x: 80, y: 50 };
    const levels = { x: 40 };
    const planned = levelsWithPlan(levels, [[{ escoUri: "x", contribution: 20 }]]);
    expect(planned).toEqual({ x: 60 });
    expect(gapCoverage(targets, levels, planned)).toBe(22);
  });
});
