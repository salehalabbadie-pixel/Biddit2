import { useState } from "react";
import PropTypes from "prop-types";
import { SKILLS } from "../../data/catalog";
import { INTEREST_AREAS } from "../../data/interests";
import { areasFromCourses } from "../../domain/profile";
import { adTitle, findSkills, isLink, matchJobTitle } from "../../domain/textAnalysis";
import { MAX_ROLES, allRoles } from "../../state/skillMasterState";
import { readPdfText } from "../../state/readPdfText";

const label = (id) => SKILLS[id]?.label ?? id;

/** The jobs.ch search the Biddit team chose (last 30 days, all fields), with the job as search term. */
const JOBS_CH_SEARCH =
  "https://www.jobs.ch/de/stellenangebote/?category=100&category=101&category=102&category=103&category=104&category=105&category=106&category=107&category=108&category=109&category=110&category=111&category=112&category=113&category=114&category=115&category=116&category=117&employment-type=1&employment-type=2&employment-type=3&employment-type=4&employment-type=5&employment-type=6&industry=1&industry=2&industry=3&industry=4&industry=5&industry=6&industry=7&industry=8&industry=9&industry=10&industry=11&industry=12&industry=13&industry=14&industry=15&industry=16&industry=17&industry=18&industry=19&industry=20&industry=21&industry=22&industry=23&industry=24&language-skill=de&language-skill=en&language-skill=fr&language-skill=it&position=1&position=2&position=3&publication-date=30&segment=gu&segment=kmu&segment=pdl";

const jobsChUrl = (title) => `${JOBS_CH_SEARCH}&term=${encodeURIComponent(title)}`;

const chipBase =
  "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold border rounded-full transition-colors";
const chipOn = "bg-green-50 border-hsg-600 text-hsg-800";
const chipOff = "bg-white border-gray-300 text-gray-800 hover:border-gray-400";
const inputStyle =
  "flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-hsg-600 focus:ring-hsg-600";
const outlineButton =
  "shrink-0 px-4 py-2 text-sm font-semibold border-2 rounded-lg border-hsg-800 text-hsg-800 hover:bg-green-50 disabled:opacity-40";

function Heading({ title, text }) {
  return (
    <>
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <p className="mt-1 mb-4 text-sm text-gray-600">{text}</p>
    </>
  );
}

Heading.propTypes = { title: PropTypes.string.isRequired, text: PropTypes.node.isRequired };

function Notice({ children }) {
  return (
    <p role="status" className="mt-2 text-xs text-gray-600">
      {children}
    </p>
  );
}

Notice.propTypes = { children: PropTypes.node };

/* ------------------------------------------------------------------ 1 */

/** Step 1: target jobs from the catalogue, a typed job title or a pasted job ad. */
export function StepJobs({ profile, update }) {
  const [title, setTitle] = useState("");
  const [ad, setAd] = useState("");
  const [titleNote, setTitleNote] = useState(null);
  const [adNote, setAdNote] = useState(null);

  const roles = allRoles(profile);
  const chosen = profile.roleIds.slice(0, MAX_ROLES);
  const full = chosen.length >= MAX_ROLES;

  const toggle = (id) =>
    update((p) => ({
      ...p,
      roleIds: p.roleIds.includes(id)
        ? p.roleIds.filter((r) => r !== id)
        : p.roleIds.length >= MAX_ROLES
        ? p.roleIds
        : [...p.roleIds, id],
    }));

  const select = (id) =>
    update((p) =>
      p.roleIds.includes(id) || p.roleIds.length >= MAX_ROLES
        ? p
        : { ...p, roleIds: [...p.roleIds, id] }
    );

  const addTitle = () => {
    const role = matchJobTitle(title, roles);
    if (!role) {
      setTitleNote(
        `Kein passender Zieljob im Katalog für «${title.trim()}». Füge unten eine Stellenanzeige ein, dann leiten wir die Skills daraus ab.`
      );
      return;
    }
    if (!chosen.includes(role.id) && full) {
      setTitleNote(`«${role.label}» passt, aber du hast schon ${MAX_ROLES} Zieljobs. Entferne zuerst einen.`);
      return;
    }
    select(role.id);
    setTitleNote(`«${role.label}» gewählt.`);
    setTitle("");
  };

  const analyseAd = () => {
    if (isLink(ad)) {
      setAdNote(
        <>
          Biddit kann die Seite aus dem Browser nicht öffnen.{" "}
          <a href={ad.trim()} target="_blank" rel="noreferrer" className="font-semibold text-hsg-800 underline">
            Anzeige öffnen ↗
          </a>
          , den Text kopieren und hier einfügen.
        </>
      );
      return;
    }
    const found = findSkills(ad);
    if (found.length === 0) {
      setAdNote("In diesem Text haben wir keine Skills aus dem Katalog gefunden.");
      return;
    }
    const role = {
      id: `ad-${Date.now()}`,
      label: adTitle(ad),
      essential: found.map((f) => f.id),
      optional: [],
      source: "ad",
    };
    update((p) => ({
      ...p,
      customRoles: [...p.customRoles, role],
      roleIds: p.roleIds.length >= MAX_ROLES ? p.roleIds : [...p.roleIds, role.id],
    }));
    setAdNote(
      `«${role.label}» ${full ? "angelegt (nicht gewählt, du hast schon " + MAX_ROLES + " Zieljobs)" : "als Zieljob gewählt"}: ${found
        .map((f) => label(f.id))
        .join(", ")}.`
    );
    setAd("");
  };

  const removeCustom = (id) =>
    update((p) => ({
      ...p,
      customRoles: p.customRoles.filter((r) => r.id !== id),
      roleIds: p.roleIds.filter((r) => r !== id),
    }));

  const chosenCatalogJobs = roles.filter((r) => chosen.includes(r.id) && r.source !== "ad");

  return (
    <>
      <Heading
        title="Für welche Jobs interessierst du dich?"
        text={`Wähle bis zu ${MAX_ROLES} Richtungen, gib einen Jobtitel ein oder füge eine Stellenanzeige ein.`}
      />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Zieljobs">
        {roles.map((role) => {
          const on = chosen.includes(role.id);
          return (
            <span key={role.id} className="inline-flex items-center">
              <button
                type="button"
                aria-pressed={on}
                disabled={!on && full}
                onClick={() => toggle(role.id)}
                className={`${chipBase} ${on ? chipOn : chipOff} disabled:opacity-40 disabled:cursor-not-allowed ${
                  role.source === "ad" ? "rounded-r-none" : ""
                }`}
              >
                {role.label}
                {role.source === "ad" && (
                  <span className="text-xs font-normal text-gray-500">aus Anzeige</span>
                )}
              </button>
              {role.source === "ad" && (
                <button
                  type="button"
                  onClick={() => removeCustom(role.id)}
                  aria-label={`${role.label} entfernen`}
                  className={`px-2 py-1.5 text-sm border border-l-0 rounded-r-full ${on ? chipOn : chipOff}`}
                >
                  ×
                </button>
              )}
            </span>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-gray-500">
        {chosen.length} von {MAX_ROLES} gewählt
        {chosenCatalogJobs.length > 0 && (
          <>
            {" · Offene Stellen auf jobs.ch: "}
            {chosenCatalogJobs.map((role, i) => (
              <span key={role.id}>
                {i > 0 && ", "}
                <a
                  href={jobsChUrl(role.label)}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-hsg-800 hover:underline"
                >
                  {role.label} ↗
                </a>
              </span>
            ))}
          </>
        )}
      </p>

      <form
        className="flex gap-3 mt-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) addTitle();
        }}
      >
        <input
          aria-label="Jobtitel"
          className={inputStyle}
          placeholder="Freitext, z. B. Venture Analyst"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button type="submit" className={outlineButton} disabled={!title.trim()}>
          Hinzufügen
        </button>
      </form>
      {titleNote && <Notice>{titleNote}</Notice>}

      <div className="flex gap-3 mt-3">
        <textarea
          aria-label="Stellenanzeige"
          rows={2}
          className={`${inputStyle} resize-y`}
          placeholder="Link oder Text einer Stellenanzeige einfügen"
          value={ad}
          onChange={(e) => setAd(e.target.value)}
        />
        <button type="button" className={`${outlineButton} self-start`} disabled={!ad.trim()} onClick={analyseAd}>
          Analysieren
        </button>
      </div>
      {adNote && <Notice>{adNote}</Notice>}
    </>
  );
}

StepJobs.propTypes = { profile: PropTypes.object.isRequired, update: PropTypes.func.isRequired };

/* ------------------------------------------------------------------ 2 */

/** Step 2: CV or LinkedIn PDF, analysed in the browser, and the past HSG courses. */
export function StepExperience({ profile, update, past }) {
  const [state, setState] = useState({ status: "idle", found: null });

  const upload = async (file) => {
    if (!file) return;
    setState({ status: "reading", found: null });
    try {
      const found = findSkills(await readPdfText(file));
      setState({ status: "done", found });
      update((p) => ({ ...p, cvFile: file.name, cvSkills: found.map((f) => f.id) }));
    } catch {
      setState({ status: "error", found: null });
    }
  };

  const toggleCvSkill = (id) =>
    update((p) => ({
      ...p,
      cvSkills: p.cvSkills.includes(id) ? p.cvSkills.filter((s) => s !== id) : [...p.cvSkills, id],
    }));

  const clearCv = () => {
    setState({ status: "idle", found: null });
    update((p) => ({ ...p, cvFile: null, cvSkills: [] }));
  };

  // After a reload only the kept skill ids remain (the CV text is never stored).
  const listed = state.found ?? profile.cvSkills.map((id) => ({ id, snippet: null }));

  return (
    <>
      <Heading
        title="Was hast du schon gemacht?"
        text="Lade deinen CV oder dein LinkedIn-Profil als PDF hoch (LinkedIn: Profil → Mehr → Als PDF speichern). Die Datei bleibt in deinem Browser. Deine bisherigen HSG-Kurse übernehmen wir automatisch."
      />

      {profile.cvFile ? (
        <section className="p-4 border-2 rounded-xl border-hsg-600 bg-green-50">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-bold text-gray-900">{profile.cvFile} · analysiert</h3>
            <button type="button" onClick={clearCv} className="text-xs font-semibold text-hsg-800 hover:underline">
              Entfernen
            </button>
          </div>
          {listed.length === 0 ? (
            <p className="mt-2 text-sm text-gray-600">
              Keine Skills aus dem Katalog erkannt. Ist das PDF ein Scan? Dann enthält es keinen lesbaren Text.
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {listed.map(({ id, snippet }) => {
                const kept = profile.cvSkills.includes(id);
                return (
                  <li key={id} className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={kept}
                      onChange={() => toggleCvSkill(id)}
                      aria-label={`${label(id)} übernehmen`}
                      className="mt-0.5 rounded text-hsg-800 focus:ring-hsg-600"
                    />
                    <span className={kept ? "text-gray-800" : "text-gray-400 line-through"}>
                      <span className="font-medium">{label(id)}</span>
                      {snippet && <span className="text-xs text-gray-500"> ← «{snippet}»</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-2 text-xs text-gray-500">
            Erkannt über Stichwörter. Entferne den Haken bei allem, was nicht stimmt.
          </p>
        </section>
      ) : (
        <label className="flex flex-col items-center justify-center gap-1 p-6 text-sm text-center border-2 border-dashed cursor-pointer rounded-xl border-gray-300 hover:border-hsg-600">
          <span className="font-semibold text-hsg-800">
            {state.status === "reading" ? "Wird gelesen …" : "PDF auswählen"}
          </span>
          <span className="text-xs text-gray-500">CV oder LinkedIn-Profil, wird nur in deinem Browser gelesen</span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            disabled={state.status === "reading"}
            onChange={(e) => upload(e.target.files?.[0])}
          />
        </label>
      )}
      {state.status === "error" && (
        <Notice>Dieses PDF konnten wir nicht lesen. Versuche einen anderen Export.</Notice>
      )}

      <section className="p-4 mt-4 rounded-xl bg-gray-50">
        <h3 className="font-bold text-gray-900">Bisherige HSG-Kurse (automatisch übernommen)</h3>
        {past.matched.length === 0 ? (
          <p className="mt-2 text-sm text-gray-600">
            {past.unmatched > 0
              ? "Für deine bisherigen Kurse gibt es noch keine Merkblatt-Skills."
              : "Keine bewerteten HSG-Kurse gefunden."}
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5 text-sm">
            {past.matched.map((course) => (
              <li key={course.name} className="flex gap-2">
                <span aria-hidden="true" className="text-hsg-800">✓</span>
                <span>
                  {course.name}
                  {course.semester && <span className="text-xs text-gray-500"> ({course.semester})</span>}
                  <span className="text-xs text-gray-500">
                    {" → "}
                    {[...course.skills]
                      .sort((a, b) => b.contribution - a.contribution)
                      .slice(0, 4)
                      .map((s) => label(s.escoUri))
                      .join(", ")}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
        {past.matched.length > 0 && past.unmatched > 0 && (
          <p className="mt-2 text-xs text-gray-500">
            {past.unmatched} weitere Kurse haben noch keine Merkblatt-Skills.
          </p>
        )}
      </section>
    </>
  );
}

StepExperience.propTypes = {
  profile: PropTypes.object.isRequired,
  update: PropTypes.func.isRequired,
  past: PropTypes.shape({ matched: PropTypes.array, unmatched: PropTypes.number }).isRequired,
};

/* ------------------------------------------------------------------ 3 */

/** Step 3: interest areas suggested from past and current courses, plus typed interests. */
export function StepInterests({ profile, update, courseSkillLists }) {
  const [text, setText] = useState("");
  const [note, setNote] = useState(null);

  const suggested = areasFromCourses(courseSkillLists);
  const others = INTEREST_AREAS.filter((area) => !suggested.includes(area));

  const toggleArea = (id) =>
    update((p) => ({
      ...p,
      interestAreas: p.interestAreas.includes(id)
        ? p.interestAreas.filter((a) => a !== id)
        : [...p.interestAreas, id],
    }));

  const addTyped = () => {
    const found = findSkills(text).map((f) => f.id);
    if (found.length === 0) {
      setNote(`Zu «${text.trim()}» passt kein Skill aus dem Katalog. Versuche ein anderes Wort.`);
      return;
    }
    update((p) => ({ ...p, interestSkills: [...new Set([...p.interestSkills, ...found])] }));
    setNote(`Hinzugefügt: ${found.map(label).join(", ")}.`);
    setText("");
  };

  const areaChip = (area) => {
    const on = profile.interestAreas.includes(area.id);
    return (
      <button
        key={area.id}
        type="button"
        aria-pressed={on}
        onClick={() => toggleArea(area.id)}
        className={`${chipBase} ${on ? chipOn : chipOff}`}
      >
        {area.label}
      </button>
    );
  };

  return (
    <>
      <Heading
        title="Was interessiert dich inhaltlich?"
        text="Fliesst mit 40 % in den Match ein, damit dir auch Kurse vorgeschlagen werden, die dir Freude machen."
      />
      {suggested.length > 0 && (
        <>
          <h3 className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
            Aus deinen bisherigen und aktuellen Kursen
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">{suggested.map(areaChip)}</div>
          <h3 className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">Weitere Themen</h3>
        </>
      )}
      <div className="flex flex-wrap gap-2">{others.map(areaChip)}</div>

      <form
        className="flex gap-3 mt-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) addTyped();
        }}
      >
        <input
          aria-label="Eigenes Interesse"
          className={inputStyle}
          placeholder="Eigenes Interesse, z. B. Nachhaltigkeit oder Machine Learning"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className={outlineButton} disabled={!text.trim()}>
          Hinzufügen
        </button>
      </form>
      {note && <Notice>{note}</Notice>}
      {profile.interestSkills.length > 0 && (
        <ul className="flex flex-wrap gap-2 mt-3" aria-label="Eigene Interessen">
          {profile.interestSkills.map((id) => (
            <li key={id} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border rounded-full border-hsg-600 bg-green-50 text-hsg-800">
              {label(id)}
              <button
                type="button"
                aria-label={`${label(id)} entfernen`}
                onClick={() =>
                  update((p) => ({ ...p, interestSkills: p.interestSkills.filter((s) => s !== id) }))
                }
                className="font-bold"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

StepInterests.propTypes = {
  profile: PropTypes.object.isRequired,
  update: PropTypes.func.isRequired,
  courseSkillLists: PropTypes.array.isRequired,
};

/* ------------------------------------------------------------------ 4 */

/** Step 4: what the inputs add up to — current level against the level the jobs ask for. */
export function StepResult({ profile, roles, targets, levels, past }) {
  const ids = Object.keys(targets).sort(
    (a, b) => targets[b] - (levels[b] || 0) - (targets[a] - (levels[a] || 0))
  );
  const below = ids.filter((id) => (levels[id] || 0) < targets[id]).length;
  const interestCount = profile.interestAreas.length + profile.interestSkills.length;

  if (ids.length === 0) {
    return (
      <Heading title="Dein Skill-Profil" text="Wähle zuerst mindestens einen Zieljob, dann zeigen wir hier deine Lücken." />
    );
  }

  return (
    <>
      <Heading
        title="Dein Skill-Profil"
        text={`${below} von ${ids.length} Skills, die deine Zieljobs verlangen, liegen noch unter dem Zielniveau. Du kannst das Profil jederzeit nachschärfen.`}
      />
      <p className="mb-4 text-xs text-gray-600" data-testid="wizard-inputs">
        Grundlage: {roles.map((r) => r.label).join(", ")}
        {" · "}
        {profile.cvFile ? `CV (${profile.cvSkills.length} Skills)` : "kein CV"}
        {" · "}
        {past.matched.length} HSG-Kurse mit Merkblatt
        {" · "}
        {interestCount} {interestCount === 1 ? "Interesse" : "Interessen"}
      </p>
      <ul className="space-y-2.5">
        {ids.map((id) => {
          const level = Math.round(levels[id] || 0);
          return (
            <li key={id} className="grid items-center grid-cols-12 gap-3 text-sm">
              <span className="col-span-5 truncate sm:col-span-4" title={label(id)}>
                {label(id)}
              </span>
              <span className="relative h-3 col-span-5 rounded-full sm:col-span-6 bg-gray-200">
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-gray-600"
                  style={{ width: `${Math.min(100, level)}%` }}
                />
                <span
                  className="absolute -inset-y-1 w-0.5 bg-gray-900"
                  style={{ left: `${targets[id]}%` }}
                  title={`Ziel ${targets[id]}`}
                />
              </span>
              <span className="col-span-2 text-xs text-gray-600 whitespace-nowrap">
                {level} / {targets[id]}
              </span>
            </li>
          );
        })}
      </ul>
      <ul className="flex gap-5 mt-4 text-xs text-gray-600">
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block w-5 h-2.5 rounded-full bg-gray-600" />
          Ist-Stand
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block w-0.5 h-3 bg-gray-900" />
          Ziel laut Zieljob
        </li>
      </ul>
    </>
  );
}

StepResult.propTypes = {
  profile: PropTypes.object.isRequired,
  roles: PropTypes.array.isRequired,
  targets: PropTypes.object.isRequired,
  levels: PropTypes.object.isRequired,
  past: PropTypes.shape({ matched: PropTypes.array }).isRequired,
};
