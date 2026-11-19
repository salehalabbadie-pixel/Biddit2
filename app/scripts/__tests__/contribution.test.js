// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ExcelJS from "exceljs";
import { afterAll, describe, expect, it } from "vitest";
import { alphaVerdict, krippendorffAlpha } from "../contribution/alpha.mjs";
import { PARAMS, contribution, parseBloom } from "../contribution/codebook.mjs";
import { evaluate, sensitivity, spearman } from "../contribution/evaluate.mjs";
import { COL, COURSE_COL, buildSheet, codingUnits, parseNumber, readCoding } from "../contribution/sheet.mjs";
import { syncText } from "../contribution/sync-semester-file.mjs";

const dir = mkdtempSync(join(tmpdir(), "contribution-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("Krippendorff's alpha", () => {
  // Krippendorff (2011), «Computing Krippendorff's Alpha-Reliability», 4 coders × 12 units.
  const n = null;
  const coders = [
    [1, 2, 3, 3, 2, 1, 4, 1, 2, n, n, n],
    [1, 2, 3, 3, 2, 2, 4, 1, 2, 5, n, 3],
    [n, 3, 3, 3, 2, 3, 4, 2, 2, 5, 1, n],
    [1, 2, 3, 3, 2, 4, 4, 1, 2, 5, 1, n],
  ];
  const units = coders[0].map((_, i) => coders.map((c) => c[i]));

  it("reproduces the published values", () => {
    expect(krippendorffAlpha(units, "nominal")).toBeCloseTo(0.743, 3);
    expect(krippendorffAlpha(units, "ordinal")).toBeCloseTo(0.815, 3);
    expect(krippendorffAlpha(units, "interval")).toBeCloseTo(0.849, 3);
  });

  it("is undefined without pairable values or variation", () => {
    expect(krippendorffAlpha([[1, null], [null, 2]])).toBeNull();
    expect(krippendorffAlpha([[3, 3], [3, 3]])).toBeNull();
    expect([alphaVerdict(0.85), alphaVerdict(0.7), alphaVerdict(0.5)]).toEqual(["verlässlich", "vorläufig", "ungenügend"]);
  });
});

describe("scoring rule", () => {
  it("computes the worked examples of the codebook", () => {
    expect(contribution({ ects: 4, share: 30, bloom: 3, assessed: 40 })).toBe(15);
    expect(contribution({ ects: 4, share: 10, bloom: 2, assessed: 0 })).toBe(5);
    expect(contribution({ ects: 4, share: 50, bloom: 5, assessed: 60 })).toBe(45);
  });

  it("caps at the Bloom level and treats share 0 as not part of the course", () => {
    expect(contribution({ ects: 12, share: 100, bloom: 6, assessed: 100 })).toBe(80);
    expect(contribution({ ects: 12, share: 100, bloom: 6, assessed: 0 })).toBe(60);
    expect(contribution({ ects: 4, share: 0, bloom: null, assessed: 0 })).toBe(0);
    expect(contribution({ ects: null, share: 30, bloom: 3, assessed: 0 })).toBeNull();
    expect(contribution({ ects: 4, share: 30, bloom: 7, assessed: 0 })).toBeNull();
  });

  it("reads Bloom levels and numbers from cells", () => {
    expect([parseBloom("3 Anwenden"), parseBloom(5), parseBloom(""), parseBloom("9")]).toEqual([3, 5, null, Number.NaN]);
    expect([parseNumber("45 %"), parseNumber(""), parseNumber(120), parseNumber("3.5", 30, true)]).toEqual([45, null, Number.NaN, 3.5]);
  });
});

describe("coding sheets", () => {
  const units = codingUnits();

  it("codes cross-listed courses once", () => {
    const titles = units.courses.map((c) => c.title);
    expect(new Set(titles).size).toBe(titles.length);
    expect(units.courses.some((c) => c.numbers.length > 1)).toBe(true);
    expect(units.pairs.length).toBeGreaterThan(100);
  });

  /** Writes a coder's sheet with codes from `codeFor(pair)` and ECTS 4 for every course. */
  async function filledSheet(code, codeFor) {
    const file = join(dir, `${code}.xlsx`);
    await buildSheet({ units, code }).xlsx.writeFile(file);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(file);
    const courses = wb.getWorksheet("Kurse");
    const ccol = {};
    courses.getRow(1).eachCell((c, i) => (ccol[c.value] = i));
    courses.eachRow((row, i) => i > 1 && (row.getCell(ccol[COURSE_COL.ects]).value = 4));
    const ws = wb.getWorksheet("Codierung");
    const col = {};
    ws.getRow(1).eachCell((c, i) => (col[c.value] = i));
    ws.eachRow((row, i) => {
      if (i === 1) return;
      const pair = { skillId: row.getCell(col[COL.skillId]).value };
      const [share, bloom, assessed] = codeFor(pair, i);
      row.getCell(col[COL.share]).value = share;
      row.getCell(col[COL.bloom]).value = bloom;
      row.getCell(col[COL.assessed]).value = assessed;
      row.getCell(col[COL.evidence]).value = "Lernziel";
    });
    await wb.xlsx.writeFile(file);
    return readCoding(file);
  }

  it("evaluates two coders end to end and writes the result into the semester file", async () => {
    const c1 = await filledSheet("C1", (_, i) => [10 + (i % 5) * 10, 2 + (i % 4), i % 2 ? 40 : 0]);
    const c2 = await filledSheet("C2", (_, i) => [i === 2 ? 90 : 10 + (i % 5) * 10, 2 + (i % 4), i % 2 ? 40 : 0]);
    expect(c1.code).toBe("C1");
    expect(c1.problems).toEqual([]);

    const { results, warnings, discuss } = evaluate([c1, c2], units);
    expect(results.alpha.bloom).toBeCloseTo(1, 5); // identical Bloom codes
    expect(results.alpha.share).toBeLessThan(1); // one pair differs
    expect(discuss).toHaveLength(1);
    expect(discuss[0].differs).toContain("share");
    expect(warnings).toEqual([]);
    expect(JSON.stringify(results)).not.toMatch(/Lernziel/); // no evidence in the repo file

    const first = Object.values(results.pairs)[0];
    expect(first.contribution).toBe(contribution(first.codes));
    expect(sensitivity(results)).toHaveLength(4);
  });

  it("uses a consensus sheet for the final values", async () => {
    const c1 = await filledSheet("C1", () => [10, 2, 0]);
    const consensus = await filledSheet("KONSENS", () => [50, 5, 60]);
    const { results } = evaluate([c1, consensus], units);
    expect(results.basis).toBe("Konsens");
    expect(Object.values(results.pairs)[0].contribution).toBe(45);
  });
});

describe("semester file sync", () => {
  const file =
    '{\r\n  "courses": [\r\n    {\r\n      "courseNumber": "1,000",\r\n      "skills": [\r\n' +
    '        { "escoUri": "a", "contribution": 10, "status": "extracted" },\r\n' +
    '        { "escoUri": "b", "contribution": 20, "status": "extracted" }\r\n      ]\r\n    },\r\n' +
    '    {\r\n      "courseNumber": "2,000",\r\n      "skills": [\r\n' +
    '        { "escoUri": "a", "contribution": 30, "status": "extracted" }\r\n      ]\r\n    }\r\n  ]\r\n}';

  it("changes only the coded contributions, per course, and rejects share-0 skills", () => {
    const results = {
      pairs: {
        "1,000|a": { numbers: ["1,000"], skillId: "a", contribution: 15 },
        "1,000|b": { numbers: ["1,000"], skillId: "b", contribution: 0 },
      },
    };
    const { text, changes } = syncText(file, results);
    expect(changes).toBe(2);
    expect(text).toContain('{ "escoUri": "a", "contribution": 15, "status": "extracted" }');
    expect(text).toContain('{ "escoUri": "b", "contribution": 0, "status": "rejected" }');
    expect(text).toContain('{ "escoUri": "a", "contribution": 30, "status": "extracted" }'); // other course untouched
    expect(text.split("\r\n").length).toBe(file.split("\r\n").length);
  });
});

describe("helpers", () => {
  it("computes Spearman's rho with ties", () => {
    expect(spearman([1, 2, 3, 4], [10, 20, 30, 40])).toBeCloseTo(1);
    expect(spearman([1, 2, 3, 4], [4, 3, 2, 1])).toBeCloseTo(-1);
    expect(spearman([1, 1, 2], [1, 1, 2])).toBeCloseTo(1);
    expect(PARAMS.fullHours).toBe(90);
  });
});
