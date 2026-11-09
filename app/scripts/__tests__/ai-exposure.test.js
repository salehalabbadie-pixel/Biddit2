// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ExcelJS from "exceljs";
import { afterAll, describe as group, expect, it } from "vitest";
import { SKILLS } from "../../src/features/skillMaster/data/catalog.js";
import { DESCRIPTIONS } from "../ai-exposure/descriptions.mjs";
import { evaluate } from "../ai-exposure/evaluate.mjs";
import {
  COL,
  buildWorkbook,
  catalogVersion,
  parseRating,
  questionnaireItems,
  readResponse,
  shuffleFor,
} from "../ai-exposure/questionnaire.mjs";
import { consensus, describe, icc } from "../ai-exposure/stats.mjs";
import { syncText } from "../ai-exposure/sync-semester-files.mjs";

const dir = mkdtempSync(join(tmpdir(), "ai-exposure-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

group("statistics", () => {
  it("reproduces the ICC example of Shrout & Fleiss (1979)", () => {
    const ratings = [
      [9, 2, 5, 8],
      [6, 1, 3, 2],
      [8, 4, 6, 8],
      [7, 1, 2, 6],
      [10, 5, 6, 9],
      [6, 2, 4, 7],
    ];
    const r = icc(ratings);
    expect(r.single).toBeCloseTo(0.29, 2);
    expect(r.average).toBeCloseTo(0.62, 2);
  });

  it("describes ratings with quartiles as in Excel QUARTILE.INC", () => {
    expect(describe([40, 10, 30, 20])).toMatchObject({ n: 4, median: 25, q1: 17.5, q3: 32.5, iqr: 15, min: 10, max: 40 });
    expect(describe([null, Number.NaN])).toEqual({ n: 0 });
  });

  it("labels consensus by the interquartile range", () => {
    expect([consensus(20), consensus(25), consensus(31)]).toEqual(["hoch", "mittel", "tief"]);
  });
});

group("questionnaire", () => {
  it("has a description for every catalogue skill and no stale ones", () => {
    expect(Object.keys(DESCRIPTIONS).sort()).toEqual(Object.keys(SKILLS).sort());
    expect(questionnaireItems()).toHaveLength(Object.keys(SKILLS).length);
  });

  it("shuffles per participant, reproducibly", () => {
    const items = questionnaireItems();
    expect(shuffleFor(items, "P01").map((i) => i.id)).toEqual(shuffleFor(items, "P01").map((i) => i.id));
    expect(shuffleFor(items, "P01").map((i) => i.id)).not.toEqual(shuffleFor(items, "P02").map((i) => i.id));
    expect(shuffleFor(items, undefined)).toBe(items);
  });

  it("parses ratings and rejects invalid ones", () => {
    expect([parseRating(45), parseRating("45 %"), parseRating(""), parseRating(null)]).toEqual([45, 45, null, null]);
    expect(parseRating(130)).toBeNaN();
    expect(parseRating("viel")).toBeNaN();
    expect(parseRating(12.5)).toBeNaN();
  });

  it("reads back what an expert filled in", async () => {
    const items = questionnaireItems().slice(0, 3);
    const file = join(dir, "P07.xlsx");
    await (await buildWorkbook({ items, code: "P07" })).xlsx.writeFile(file);

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(file);
    wb.getWorksheet("Angaben").getCell("B3").value = "Informatik / KI";
    wb.getWorksheet("Angaben").getCell("B4").value = 4;
    const ws = wb.getWorksheet("Bewertung");
    const col = {};
    ws.getRow(1).eachCell((c, n) => (col[c.value] = n));
    const entries = { [items[0].id]: [60, "hoch", "Entwürfe"], [items[1].id]: [130, "mittel", null] };
    ws.eachRow((row, n) => {
      const e = entries[row.getCell(col[COL.id]).value];
      if (n === 1 || !e) return;
      row.getCell(col[COL.value]).value = e[0];
      row.getCell(col[COL.confidence]).value = e[1];
      row.getCell(col[COL.comment]).value = e[2];
    });
    await wb.xlsx.writeFile(file);

    const r = await readResponse(file);
    expect(r).toMatchObject({ code: "P07", field: "Informatik / KI", aiExperience: 4, round: 1, catalogVersion: catalogVersion() });
    expect(r.ratings[items[0].id]).toEqual({ value: 60, confidence: "hoch", comment: "Entwürfe" });
    expect(r.ratings[items[1].id].value).toBeNull();
    expect(r.ratings[items[2].id]).toEqual({ value: null, confidence: null, comment: null });
    expect(r.problems.join()).toMatch(/«130»/);
  });
});

group("evaluation", () => {
  const skills = { a: { label: "A" }, b: { label: "B" } };
  const response = (code, a, b) => ({
    code,
    field: "Andere",
    aiExperience: 3,
    round: 1,
    catalogVersion: catalogVersion(skills),
    ratings: { a: { value: a, confidence: "hoch", comment: null }, b: { value: b, confidence: null, comment: "unsicher" } },
    problems: [],
  });

  it("aggregates per skill and warns about too few ratings", () => {
    const responses = ["P1", "P2", "P3", "P4", "P5", "P6"].map((c, i) => response(c, 40 + i * 2, i < 3 ? 70 : null));
    const { results, warnings, comments } = evaluate(responses, skills);
    expect(results.skills.a).toMatchObject({ n: 6, median: 45, consensus: "hoch", confidence: { hoch: 6 } });
    expect(results.skills.b.n).toBe(3);
    expect(warnings.join()).toMatch(/b: nur 3 Bewertungen/);
    expect(comments.b).toHaveLength(6);
    expect(JSON.stringify(results)).not.toMatch(/P1|unsicher/); // aggregated file holds no codes or comments
  });

  it("flags duplicate codes and answers to another catalogue version", () => {
    const stale = { ...response("P1", 10, 10), catalogVersion: "old" };
    const { warnings } = evaluate([stale, response("P1", 20, 20)], skills);
    expect(warnings.join()).toMatch(/P1 kommt mehrfach vor/);
    expect(warnings.join()).toMatch(/Katalog-Version old/);
  });
});

group("semester file sync", () => {
  it("changes only the aiAutomation numbers", () => {
    const text = '{\r\n  "escoUri": "a",\r\n  "contribution": 10,\r\n  "aiAutomation": 20,\r\n  "status": "extracted"\r\n}';
    const { text: out, changes } = syncText(text, { a: { aiAutomation: 35 } });
    expect(changes).toBe(1);
    expect(out).toBe(text.replace('"aiAutomation": 20', '"aiAutomation": 35'));
    expect(syncText(out, { a: { aiAutomation: 35 } }).changes).toBe(0);
  });
});
