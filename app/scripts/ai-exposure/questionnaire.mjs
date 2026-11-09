// Builds the expert questionnaire (Excel) and reads the returned files back.
// Used by build-questionnaire.mjs and evaluate.mjs; see README.md for the method.
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ExcelJS from "exceljs";
import { SKILLS } from "../../src/features/skillMaster/data/catalog.js";
import { DESCRIPTIONS } from "./descriptions.mjs";

// Plain paths: under the jsdom test environment `URL` is the browser class.
const HERE = dirname(fileURLToPath(import.meta.url));
const SKILL_FILES = join(HERE, "..", "..", "public", "skill-master");

export const SHEETS = { guide: "Anleitung", scale: "Skala", person: "Angaben", rating: "Bewertung", meta: "_meta" };
export const COL = {
  nr: "Nr.",
  id: "Skill-ID",
  label: "Kompetenz",
  description: "Beschreibung",
  example: "Beispiel aus einem HSG-Kurs",
  median: "Median Runde 1",
  range: "Mittlere 50 % Runde 1",
  own: "Ihr Wert Runde 1",
  value: "KI-Exposition (0–100)",
  confidence: "Sicherheit",
  comment: "Kommentar",
};
export const PERSON = {
  code: "Teilnehmer-Code",
  field: "Fachgebiet",
  aiExperience: "Erfahrung mit KI-Werkzeugen (1 = kaum, 5 = sehr gross)",
  note: "Bemerkungen (freiwillig)",
};
export const FIELDS = [
  "Informatik / KI",
  "Volkswirtschaft / Arbeitsmarkt",
  "Management / Strategie",
  "Finance / Accounting",
  "Marketing / Innovation",
  "Operations / Supply Chain",
  "Recht / Gesellschaft",
  "Andere",
];
export const CONFIDENCE = ["niedrig", "mittel", "hoch"];

export const DEFINITION =
  "KI-Exposition einer Kompetenz = Anteil der typischen beruflichen Tätigkeiten dieser Kompetenz, " +
  "bei denen heute allgemein verfügbare KI-Werkzeuge die benötigte Zeit bei gleicher Qualität mindestens halbieren.";

export const SCALE = [
  [0, "Bei keiner typischen Tätigkeit dieser Kompetenz halbiert KI heute die benötigte Zeit."],
  [25, "Bei einem kleinen Teil der Tätigkeiten, z. B. Recherche oder erste Entwürfe."],
  [50, "Bei etwa der Hälfte der Tätigkeiten."],
  [75, "Bei den meisten Tätigkeiten. Der Mensch prüft, ergänzt und entscheidet weiterhin."],
  [100, "Bei praktisch allen typischen Tätigkeiten."],
];

/** Short hash of the skill ids and labels: identifies the catalogue the experts rated. */
export function catalogVersion(skills = SKILLS) {
  const content = JSON.stringify(Object.entries(skills).map(([id, s]) => [id, s.label]).sort());
  return createHash("sha256").update(content).digest("hex").slice(0, 10);
}

const truncate = (text, max) => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" "))} …`;
};

/** Per skill, the fact-sheet evidence of the course that contributes most to it. */
export function courseExamples(dir = SKILL_FILES) {
  const best = {};
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const data = JSON.parse(readFileSync(join(dir, file), "utf8"));
    for (const course of data.courses ?? []) {
      for (const s of course.skills ?? []) {
        if (!s.evidence || (best[s.escoUri] && best[s.escoUri].contribution >= s.contribution)) continue;
        best[s.escoUri] = { contribution: s.contribution, text: `${course.title}: ${s.evidence}` };
      }
    }
  }
  return Object.fromEntries(Object.entries(best).map(([id, b]) => [id, truncate(b.text, 260)]));
}

/** The skills to rate, in catalogue order, with description and course example. */
export function questionnaireItems(skills = SKILLS, descriptions = DESCRIPTIONS, examples = courseExamples()) {
  const missing = Object.keys(skills).filter((id) => !descriptions[id]);
  if (missing.length) throw new Error(`Beschreibung fehlt in descriptions.mjs: ${missing.join(", ")}`);
  return Object.entries(skills).map(([id, s]) => ({
    id,
    label: s.label,
    description: descriptions[id],
    example: examples[id] ?? "",
  }));
}

/** Deterministic shuffle per participant, so order effects average out across the panel. */
export function shuffleFor(items, code) {
  if (!code) return items;
  let seed = createHash("sha256").update(code).digest().readUInt32LE(0);
  const random = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// --- writing --------------------------------------------------------------

const INPUT_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF5CC" } };
const HEADER_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };
const PRIOR_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0F2FE" } };
const WRAP_TOP = { wrapText: true, vertical: "top" };

const unlock = (cell) => {
  cell.protection = { locked: false };
  cell.fill = INPUT_FILL;
};

const LOCK_OPTIONS = { selectLockedCells: true, selectUnlockedCells: true, formatColumns: true, formatRows: true };

function guideSheet(wb, { round, count, version, created, contact, deadline }) {
  const ws = wb.addWorksheet(SHEETS.guide);
  ws.getColumn(1).width = 110;
  const lines = [
    [`Befragung: KI-Exposition von Kompetenzen – Runde ${round}`, "title"],
    ["Worum es geht", "heading"],
    [
      "Der Skill-Master in Biddit zeigt Studierenden der HSG, welche Kompetenzen ihre Kurse aufbauen und wie stark " +
        "diese Kompetenzen von künstlicher Intelligenz (KI) betroffen sind. Für diesen zweiten Wert bitten wir Sie um " +
        "Ihre fachliche Einschätzung. Ihre Antworten fliessen anonym in den Median mehrerer Expertinnen und Experten ein.",
    ],
    ["Was wir mit KI-Exposition meinen", "heading"],
    [DEFINITION, "bold"],
    ["Die Definition lehnt sich an Eloundou, Manning, Mishkin & Rock (2024), «GPTs are GPTs», Science 384, an."],
    ["Bitte beachten", "heading"],
    [
      "• Bewerten Sie den heutigen Stand mit allgemein verfügbaren KI-Werkzeugen (z. B. ChatGPT, Claude, Microsoft " +
        "Copilot oder spezialisierte KI-Software), nicht künftige Entwicklungen.",
    ],
    ["• Denken Sie an den Berufsalltag von HSG-Absolventinnen und -Absolventen, nicht an die Lehre."],
    [
      "• Exposition heisst nicht Ersetzung: Auch wenn KI eine Tätigkeit stark beschleunigt, braucht es den Menschen " +
        "oft weiterhin, etwa zum Prüfen und Entscheiden.",
    ],
    ["• Können Sie eine Kompetenz nicht beurteilen, lassen Sie das Feld leer. Leer ist besser als geraten."],
    ["• Geben Sie zu jedem Wert an, wie sicher Sie sich sind. Ein Kommentar ist freiwillig, hilft aber bei der Auswertung."],
    ...(round > 1
      ? [
          [
            "• In dieser Runde sehen Sie den Median und die mittleren 50 % aller Antworten der ersten Runde sowie Ihren " +
              "eigenen Wert. Ihr Wert aus Runde 1 ist bereits eingetragen; ändern Sie ihn, wenn Sie Ihre Einschätzung " +
              "anpassen möchten. Liegt Ihr Wert deutlich ausserhalb der mittleren 50 %, begründen Sie ihn bitte kurz im Kommentar.",
          ],
        ]
      : []),
    ["So gehen Sie vor", "heading"],
    [`1. Blatt «${SHEETS.person}»: Fachgebiet und Erfahrung mit KI-Werkzeugen wählen.`],
    [`2. Blatt «${SHEETS.scale}»: die Bedeutung der Werte lesen.`],
    [
      `3. Blatt «${SHEETS.rating}»: pro Kompetenz einen Wert von 0 bis 100 (ganze Zahl) in die gelbe Spalte ` +
        "eintragen und die Sicherheit wählen.",
    ],
    [
      "4. Datei speichern, ohne den Namen zu ändern, und " +
        (contact ? `an ${contact} zurücksenden` : "an die Person zurücksenden, von der Sie die Datei erhalten haben") +
        (deadline ? `, bitte bis ${deadline}.` : "."),
    ],
    [`Dauer: etwa 30–40 Minuten für ${count} Kompetenzen. Bearbeiten lassen sich nur die gelben Felder.`],
    ["Datenschutz", "heading"],
    [
      "Die Datei enthält statt Ihres Namens einen Teilnehmer-Code. Veröffentlicht werden nur zusammengefasste Werte " +
        "(Median und Streuung). Kommentare werden nicht mit Ihrem Code veröffentlicht.",
    ],
    [`Katalog-Stand: ${count} Kompetenzen, Version ${version}, erstellt am ${created}.`, "small"],
  ];
  for (const [text, style] of lines) {
    const row = ws.addRow([text]);
    const cell = row.getCell(1);
    cell.alignment = WRAP_TOP;
    if (style === "title") cell.font = { bold: true, size: 14 };
    if (style === "heading") cell.font = { bold: true, size: 12 };
    if (style === "bold") cell.font = { bold: true };
    if (style === "small") cell.font = { italic: true, color: { argb: "FF6B7280" } };
    if (style === "heading") row.height = 22;
  }
}

function scaleSheet(wb) {
  const ws = wb.addWorksheet(SHEETS.scale);
  ws.columns = [
    { header: "Wert", key: "value", width: 8 },
    { header: "Bedeutung", key: "meaning", width: 100 },
  ];
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = HEADER_FILL;
  for (const [value, meaning] of SCALE) ws.addRow({ value, meaning }).alignment = WRAP_TOP;
  ws.addRow([]);
  ws.addRow(["", "Zwischenwerte sind erlaubt (ganze Zahlen von 0 bis 100)."]);
  ws.addRow(["", `Definition: ${DEFINITION}`]).getCell(2).alignment = WRAP_TOP;
}

async function personSheet(wb, code) {
  const ws = wb.addWorksheet(SHEETS.person);
  ws.columns = [
    { header: "Angabe", width: 55 },
    { header: "Ihre Antwort", width: 40 },
  ];
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = HEADER_FILL;
  ws.addRow([PERSON.code, code ?? ""]);
  ws.addRow([PERSON.field, ""]);
  ws.addRow([PERSON.aiExperience, ""]);
  ws.addRow([PERSON.note, ""]);
  if (!code) unlock(ws.getCell("B2"));
  for (const ref of ["B3", "B4", "B5"]) unlock(ws.getCell(ref));
  ws.getCell("B3").dataValidation = {
    type: "list",
    allowBlank: true,
    formulae: [`"${FIELDS.join(",")}"`],
  };
  ws.getCell("B4").dataValidation = {
    type: "whole",
    operator: "between",
    allowBlank: true,
    formulae: [1, 5],
    showErrorMessage: true,
    errorTitle: "Ungültiger Wert",
    error: "Bitte eine ganze Zahl von 1 bis 5 eintragen.",
  };
  ws.getCell("B5").alignment = WRAP_TOP;
  await ws.protect("", LOCK_OPTIONS);
}

async function ratingSheet(wb, items, prior) {
  const ws = wb.addWorksheet(SHEETS.rating, { views: [{ state: "frozen", xSplit: 3, ySplit: 1 }] });
  const columns = [
    { header: COL.nr, key: "nr", width: 5 },
    { header: COL.id, key: "id", width: 14 },
    { header: COL.label, key: "label", width: 28 },
    { header: COL.description, key: "description", width: 50 },
    { header: COL.example, key: "example", width: 50 },
    ...(prior
      ? [
          { header: COL.median, key: "median", width: 11 },
          { header: COL.range, key: "range", width: 13 },
          { header: COL.own, key: "own", width: 11 },
        ]
      : []),
    { header: COL.value, key: "value", width: 13 },
    { header: COL.confidence, key: "confidence", width: 12 },
    { header: COL.comment, key: "comment", width: 40 },
  ];
  ws.columns = columns;
  const header = ws.getRow(1);
  header.font = { bold: true };
  header.fill = HEADER_FILL;
  header.alignment = WRAP_TOP;
  header.height = 32;

  items.forEach((item, i) => {
    const p = prior?.get(item.id);
    const row = ws.addRow({
      nr: i + 1,
      id: item.id,
      label: item.label,
      description: item.description,
      example: item.example,
      ...(prior
        ? {
            median: p?.median ?? "",
            range: p?.q1 != null ? `${p.q1}–${p.q3}` : "",
            own: p?.own ?? "",
          }
        : {}),
      value: p?.own ?? null,
      confidence: null,
      comment: null,
    });
    row.alignment = WRAP_TOP;
    row.getCell("id").font = { color: { argb: "FF6B7280" }, size: 9 };
    row.getCell("label").font = { bold: true };
    if (prior) for (const key of ["median", "range", "own"]) row.getCell(key).fill = PRIOR_FILL;
    const value = row.getCell("value");
    unlock(value);
    value.dataValidation = {
      type: "whole",
      operator: "between",
      allowBlank: true,
      formulae: [0, 100],
      showErrorMessage: true,
      errorTitle: "Ungültiger Wert",
      error: "Bitte eine ganze Zahl von 0 bis 100 eintragen oder das Feld leer lassen.",
    };
    const confidence = row.getCell("confidence");
    unlock(confidence);
    confidence.dataValidation = { type: "list", allowBlank: true, formulae: [`"${CONFIDENCE.join(",")}"`] };
    unlock(row.getCell("comment"));
  });
  await ws.protect("", LOCK_OPTIONS);
}

/**
 * The questionnaire for one participant (or an empty template without `code`).
 * `prior` (round 2): Map skill id -> { median, q1, q3, own }.
 */
export async function buildWorkbook({ items, round = 1, code, prior, version = catalogVersion(), created, contact, deadline }) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Biddit Skill-Master";
  const date = created ?? new Date().toISOString().slice(0, 10);
  guideSheet(wb, { round, count: items.length, version, created: date, contact, deadline });
  scaleSheet(wb);
  await personSheet(wb, code);
  await ratingSheet(wb, shuffleFor(items, code), prior);
  const meta = wb.addWorksheet(SHEETS.meta, { state: "veryHidden" });
  meta.addRows([
    ["catalogVersion", version],
    ["round", round],
    ["created", date],
    ["code", code ?? ""],
  ]);
  return wb;
}

// --- reading --------------------------------------------------------------

const text = (value) => {
  if (value == null) return "";
  if (typeof value === "object") {
    if ("result" in value) return text(value.result);
    if (value.richText) return value.richText.map((t) => t.text).join("");
    if ("text" in value) return String(value.text);
  }
  return String(value).trim();
};

/** 0–100 as integer, null when empty; NaN marks an invalid entry. */
export function parseRating(value) {
  const raw = typeof value === "number" ? value : text(value).replace("%", "").replace(",", ".").trim();
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 && n <= 100 ? n : Number.NaN;
}

const keyValues = (ws) => {
  const out = {};
  ws?.eachRow((row) => {
    const key = text(row.getCell(1).value);
    if (key) out[key] = row.getCell(2).value;
  });
  return out;
};

/** One returned questionnaire as { code, field, aiExperience, round, catalogVersion, ratings, problems }. */
export async function readResponse(path) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);
  const meta = keyValues(wb.getWorksheet(SHEETS.meta));
  const person = keyValues(wb.getWorksheet(SHEETS.person));
  const ws = wb.getWorksheet(SHEETS.rating);
  const problems = [];
  if (!ws) throw new Error(`${path}: Blatt «${SHEETS.rating}» fehlt`);

  const cols = {};
  ws.getRow(1).eachCell((cell, n) => {
    cols[text(cell.value)] = n;
  });
  for (const name of [COL.id, COL.value, COL.confidence, COL.comment]) {
    if (!cols[name]) throw new Error(`${path}: Spalte «${name}» fehlt`);
  }

  const ratings = {};
  ws.eachRow((row, n) => {
    if (n === 1) return;
    const id = text(row.getCell(cols[COL.id]).value);
    if (!id) return;
    const value = parseRating(row.getCell(cols[COL.value]).value);
    const confidence = text(row.getCell(cols[COL.confidence]).value) || null;
    if (Number.isNaN(value)) problems.push(`${id}: Wert «${text(row.getCell(cols[COL.value]).value)}» ist keine ganze Zahl von 0 bis 100`);
    if (confidence && !CONFIDENCE.includes(confidence)) problems.push(`${id}: Sicherheit «${confidence}» unbekannt`);
    ratings[id] = {
      value: Number.isNaN(value) ? null : value,
      confidence: CONFIDENCE.includes(confidence) ? confidence : null,
      comment: text(row.getCell(cols[COL.comment]).value) || null,
    };
  });

  const experience = Number(text(person[PERSON.aiExperience]));
  return {
    file: path,
    code: text(person[PERSON.code]) || text(meta.code) || null,
    field: text(person[PERSON.field]) || null,
    aiExperience: Number.isInteger(experience) && experience >= 1 && experience <= 5 ? experience : null,
    round: Number(text(meta.round)) || null,
    catalogVersion: text(meta.catalogVersion) || null,
    ratings,
    problems,
  };
}

/** All returned questionnaires in a folder (Excel lock files `~$…` are skipped). */
export async function readResponses(dir) {
  const files = readdirSync(dir).filter((f) => f.endsWith(".xlsx") && !f.startsWith("~$"));
  return Promise.all(files.map((f) => readResponse(join(dir, f))));
}
