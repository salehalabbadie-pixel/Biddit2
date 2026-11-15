/**
 * Keyword analysis of CVs, job ads and typed interests, and job-title lookup.
 * Runs in the browser only; no text leaves the device. Kept apart from
 * profile.js so the keyword lists load with the wizard, not with the app.
 */
import { KEYWORDS } from "../data/keywords";
import { normalize } from "./profile";

const NORMALIZED_KEYWORDS = Object.entries(KEYWORDS).map(([id, terms]) => [
  id,
  terms.map((term) => normalize(term).trimEnd()),
]);

const SNIPPET_LENGTH = 90;

/**
 * Catalogue skills a text mentions, each with the line that mentions it first.
 * A term matches at the start of a word (so stems catch inflections).
 */
export function findSkills(text) {
  const lines = String(text ?? "")
    .split(/\r?\n|(?<=[.;•])\s+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const normalizedLines = lines.map(normalize);
  const found = [];
  NORMALIZED_KEYWORDS.forEach(([id, terms]) => {
    const lineIndex = normalizedLines.findIndex((line) =>
      terms.some((term) => line.includes(term))
    );
    if (lineIndex === -1) return;
    const line = lines[lineIndex];
    found.push({
      id,
      snippet: line.length > SNIPPET_LENGTH ? `${line.slice(0, SNIPPET_LENGTH - 1)}…` : line,
    });
  });
  return found;
}

const tokens = (text) => normalize(text).trim().split(" ").filter((t) => t.length > 1);

/**
 * Catalogue job for a typed job title: the role sharing most words with it,
 * if at least half of the typed words appear in the role label.
 */
export function matchJobTitle(title, roles) {
  const wanted = tokens(title);
  if (wanted.length === 0) return null;
  let best = null;
  roles.forEach((role) => {
    const label = new Set(tokens(role.label));
    const shared = wanted.filter((word) =>
      [...label].some((l) => l.startsWith(word) || word.startsWith(l))
    ).length;
    const score = shared / wanted.length;
    if (score >= 0.5 && (!best || score > best.score)) best = { role, score };
  });
  return best?.role ?? null;
}

/** True when the input is only a link (which the browser cannot read for us). */
export function isLink(text) {
  return /^\s*https?:\/\/\S+\s*$/i.test(String(text ?? ""));
}

/** A short name for a pasted job ad: its first line, at most 40 characters. */
export function adTitle(text) {
  const first = String(text ?? "").split(/\r?\n/).map((l) => l.trim()).find(Boolean) ?? "";
  if (!first) return "Stellenanzeige";
  return first.length > 40 ? `${first.slice(0, 39)}…` : first;
}

