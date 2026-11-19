/**
 * The Excel coding sheet: one per coder, listing every course–skill pair of a
 * semester file. Coders read the Merkblatt and fill in three codes per pair
 * (share, Bloom level, assessment weight) plus the ECTS per course. The
 * extraction's own values and evidence are not shown, so coders work
 * independently of it and of each other.
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ExcelJS from "exceljs";
import { SKILLS } from "../../src/features/skillMaster/data/catalog.js";
import { BLOOM, BLOOM_CHOICES, PARAMS, parseBloom } from "./codebook.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
export const SEMESTER_FILE = join(HERE, "..", "..", "public", "skill-master", "HS26.json");

export const SHEETS = { guide: "Anleitung", courses: "Kurse", coding: "Codierung", meta: "_meta" };
export const COURSE_COL = { nr: "Nr.", numbers: "Kursnummer(n)", title: "Kurs", sheet: "Merkblatt", ects: "ECTS" };
export const COL = {
  nr: "Nr.",
  course: "Kurs-Nr.",
  title: "Kurs",
  skillId: "Skill-ID",
  skill: "Skill",
  share: "Zeitanteil (%)",
  bloom: "Bloom-Stufe",
  assessed: "Prüfungsgewicht (%)",
  evidence: "Belegstelle im Merkblatt",
  comment: "Kommentar",
};

/** Link to the official course fact sheet (the URL the app opens in course details). */
export const merkblattUrl = (semester, courseNumber) =>
  `https://tools.unisg.ch/handlers/Public/CourseInformationSheet.ashx/semester/${semester}/eventnumber/${courseNumber}.pdf`;

/**
 * Courses and course–skill pairs to code. Courses listed under two numbers with
 * the same title (cross-listed) are coded once; the result applies to both.
 */
export function codingUnits(file = SEMESTER_FILE) {
  const data = JSON.parse(readFileSync(file, "utf8"));
  const byTitle = new Map();
  data.courses.forEach((course) => {
    const key = course.title.trim();
    if (!byTitle.has(key)) byTitle.set(key, { title: key, numbers: [], skills: new Set() });
    const entry = byTitle.get(key);
    entry.numbers.push(course.courseNumber);
    course.skills.filter((s) => s.status !== "rejected").forEach((s) => entry.skills.add(s.escoUri));
  });
  const courses = [...byTitle.values()].map((c) => ({ ...c, skills: [...c.skills] }));
  const pairs = courses.flatMap((course) =>
    course.skills.map((skillId) => ({ course: course.numbers[0], numbers: course.numbers, title: course.title, skillId }))
  );
  const version = createHash("sha256")
    .update(JSON.stringify(pairs.map((p) => [p.course, p.skillId])))
    .digest("hex")
    .slice(0, 10);
  return { semester: data.semester, courses, pairs, version };
}

// --- writing ----------------------------------------------------------------

const INPUT_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF5CC" } };
const HEADER_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };
const WRAP_TOP = { wrapText: true, vertical: "top" };
const LOCK_OPTIONS = { selectLockedCells: true, selectUnlockedCells: true, formatColumns: true, formatRows: true };
const unlock = (cell) => {
  cell.protection = { locked: false };
  cell.fill = INPUT_FILL;
};
const percent = (prompt) => ({
  type: "whole",
  operator: "between",
  formulae: [0, 100],
  allowBlank: true,
  showErrorMessage: true,
  errorTitle: "Ungültiger Wert",
  error: "Bitte eine ganze Zahl von 0 bis 100 eingeben.",
  showInputMessage: true,
  prompt,
});

function guideSheet(wb, { code, count, courses, semester }) {
  const ws = wb.addWorksheet(SHEETS.guide);
  ws.getColumn(1).width = 28;
  ws.getColumn(2).width = 90;
  const rows = [
    ["Codierung: Beitrag von Kursen zu Skills", ""],
    ["Codierer/in", code ?? ""],
    ["Semester", semester],
    ["Umfang", `${courses} Kurse, ${count} Kurs–Skill-Paare`],
    ["", ""],
    ["So gehen Sie vor", "1. Blatt «Kurse»: ECTS je Kurs aus dem Merkblatt eintragen."],
    ["", "2. Blatt «Codierung»: je Zeile das Merkblatt lesen (Link) und drei Codes eintragen."],
    ["", "3. Arbeiten Sie unabhängig; besprechen Sie Fälle erst nach der Abgabe."],
    ["", "Massgebend sind die Regeln im Codierleitfaden (CODEBOOK.md). Gelbe Zellen sind Eingabefelder."],
    ["", ""],
    [COL.share, "Anteil des Kurses (Lernziele, Inhaltsblöcke bzw. Sitzungen), der dem Skill gewidmet ist, 0–100. 0 = Skill kommt im Kurs nicht vor."],
    [COL.bloom, "Höchste Stufe, die ein Lernziel für diesen Skill verlangt (Verb des Lernziels), 1–6."],
    [COL.assessed, "Anteil an der Gesamtnote, der den Skill prüft, 0–100. 0 = nicht geprüft."],
    [COL.evidence, "Kurz zitieren, worauf sich die Codes stützen (Lernziel, Inhalt, Prüfung)."],
    ["", ""],
    ["Bloom-Stufen", ""],
    ...BLOOM.map((b) => [`${b.level} ${b.label}`, b.verbs]),
  ];
  rows.forEach((row, i) => {
    const r = ws.addRow(row);
    r.alignment = WRAP_TOP;
    if (i === 0) r.font = { bold: true, size: 14 };
    else if ([COL.share, COL.bloom, COL.assessed, COL.evidence, "Bloom-Stufen", "So gehen Sie vor"].includes(row[0]))
      r.getCell(1).font = { bold: true };
  });
  ws.protect("", LOCK_OPTIONS);
}

function coursesSheet(wb, { courses, semester }) {
  const ws = wb.addWorksheet(SHEETS.courses, { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = [
    { header: COURSE_COL.nr, key: "nr", width: 6 },
    { header: COURSE_COL.numbers, key: "numbers", width: 24 },
    { header: COURSE_COL.title, key: "title", width: 60 },
    { header: COURSE_COL.sheet, key: "sheet", width: 14 },
    { header: COURSE_COL.ects, key: "ects", width: 10 },
  ];
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = HEADER_FILL;
  courses.forEach((course, i) => {
    const row = ws.addRow({ nr: i + 1, numbers: course.numbers.join(" | "), title: course.title });
    row.getCell("sheet").value = { text: "öffnen", hyperlink: merkblattUrl(semester, course.numbers[0]) };
    row.getCell("sheet").font = { color: { argb: "FF006625" }, underline: true };
    const ects = row.getCell("ects");
    unlock(ects);
    ects.dataValidation = {
      type: "decimal",
      operator: "between",
      formulae: [0.5, 30],
      allowBlank: true,
      showErrorMessage: true,
      error: "ECTS zwischen 0.5 und 30.",
    };
  });
  ws.protect("", LOCK_OPTIONS);
}

function codingSheet(wb, { pairs, semester }) {
  const ws = wb.addWorksheet(SHEETS.coding, { views: [{ state: "frozen", ySplit: 1, xSplit: 5 }] });
  ws.columns = [
    { header: COL.nr, key: "nr", width: 6 },
    { header: COL.course, key: "course", width: 14 },
    { header: COL.title, key: "title", width: 40 },
    { header: COL.skillId, key: "skillId", width: 22 },
    { header: COL.skill, key: "skill", width: 30 },
    { header: COL.share, key: "share", width: 14 },
    { header: COL.bloom, key: "bloom", width: 16 },
    { header: COL.assessed, key: "assessed", width: 18 },
    { header: COL.evidence, key: "evidence", width: 50 },
    { header: COL.comment, key: "comment", width: 30 },
  ];
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = HEADER_FILL;
  ws.getRow(1).alignment = WRAP_TOP;
  pairs.forEach((pair, i) => {
    const row = ws.addRow({
      nr: i + 1,
      course: pair.course,
      title: pair.title,
      skillId: pair.skillId,
      skill: SKILLS[pair.skillId]?.label ?? pair.skillId,
    });
    row.getCell("course").value = { text: pair.course, hyperlink: merkblattUrl(semester, pair.course) };
    row.getCell("course").font = { color: { argb: "FF006625" }, underline: true };
    row.alignment = WRAP_TOP;
    ["share", "bloom", "assessed", "evidence", "comment"].forEach((key) => unlock(row.getCell(key)));
    row.getCell("share").dataValidation = percent("Anteil des Kurses für diesen Skill, 0–100");
    row.getCell("assessed").dataValidation = percent("Anteil an der Note, der den Skill prüft, 0–100");
    row.getCell("bloom").dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`"${BLOOM_CHOICES.join(",")}"`],
      showErrorMessage: true,
      error: "Bitte eine Stufe aus der Liste wählen.",
    };
  });
  ws.protect("", LOCK_OPTIONS);
}

/** Coding workbook for one coder (`code`, e.g. "C1"). */
export function buildSheet({ units = codingUnits(), code }) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Biddit Skill-Master";
  guideSheet(wb, { code, count: units.pairs.length, courses: units.courses.length, semester: units.semester });
  coursesSheet(wb, units);
  codingSheet(wb, units);
  const meta = wb.addWorksheet(SHEETS.meta, { state: "veryHidden" });
  meta.addRows([
    ["version", units.version],
    ["semester", units.semester],
    ["code", code ?? ""],
    ["params", JSON.stringify(PARAMS)],
  ]);
  return wb;
}

// --- reading ----------------------------------------------------------------

const text = (value) => {
  if (value == null) return "";
  if (typeof value === "object") {
    if ("result" in value) return text(value.result);
    if (value.richText) return value.richText.map((t) => t.text).join("");
    if ("text" in value) return String(value.text);
  }
  return String(value).trim();
};

/** Number in [0, max] (whole unless `decimal`), null when empty, NaN when invalid. Accepts "45 %". */
export function parseNumber(value, max = 100, decimal = false) {
  const raw = text(value).replace(/%/g, "").replace(",", ".").trim();
  if (raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > max || (!decimal && !Number.isInteger(n))) return Number.NaN;
  return n;
}

function columns(ws) {
  const col = {};
  ws.getRow(1).eachCell((cell, n) => (col[text(cell.value)] = n));
  return col;
}

/**
 * One coder's file: { file, code, version, ects: { title: number }, codes:
 * { "course|skillId": { share, bloom, assessed, evidence, comment } }, problems }.
 * Invalid entries are reported in `problems` and read as missing.
 */
export async function readCoding(path) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);
  const meta = Object.fromEntries(
    (wb.getWorksheet(SHEETS.meta)?.getSheetValues() ?? []).filter(Boolean).map((r) => [r[1], r[2]])
  );
  const problems = [];
  const ects = {};
  const cs = wb.getWorksheet(SHEETS.courses);
  const ccol = columns(cs);
  cs.eachRow((row, n) => {
    if (n === 1) return;
    const title = text(row.getCell(ccol[COURSE_COL.title]).value);
    const value = parseNumber(row.getCell(ccol[COURSE_COL.ects]).value, 30, true);
    if (Number.isNaN(value)) problems.push(`Kurse, Zeile ${n}: ECTS ungültig`);
    ects[title] = Number.isNaN(value) ? null : value;
  });

  const codes = {};
  const ws = wb.getWorksheet(SHEETS.coding);
  const col = columns(ws);
  ws.eachRow((row, n) => {
    if (n === 1) return;
    const course = text(row.getCell(col[COL.course]).value);
    const skillId = text(row.getCell(col[COL.skillId]).value);
    const read = (header, parse, label) => {
      const v = parse(row.getCell(col[header]).value);
      if (Number.isNaN(v)) {
        problems.push(`Codierung, Zeile ${n} (${course}, ${skillId}): ${label} «${text(row.getCell(col[header]).value)}» ungültig`);
        return null;
      }
      return v;
    };
    codes[`${course}|${skillId}`] = {
      title: text(row.getCell(col[COL.title]).value),
      share: read(COL.share, (v) => parseNumber(v), "Zeitanteil"),
      bloom: read(COL.bloom, (v) => parseBloom(text(v)), "Bloom-Stufe"),
      assessed: read(COL.assessed, (v) => parseNumber(v), "Prüfungsgewicht"),
      evidence: text(row.getCell(col[COL.evidence]).value) || null,
      comment: text(row.getCell(col[COL.comment]).value) || null,
    };
  });
  return { file: path, code: meta.code || null, version: meta.version || null, ects, codes, problems };
}

/** All coding files in a folder (skips Excel lock files «~$…»). */
export async function readCodings(dir) {
  const files = readdirSync(dir).filter((f) => f.endsWith(".xlsx") && !f.startsWith("~$"));
  return Promise.all(files.map((f) => readCoding(join(dir, f))));
}
