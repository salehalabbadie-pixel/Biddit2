# ESCO alignment of the Skill-Master catalogue

Generates `app/src/features/skillMaster/data/catalog.js` (skills and target roles)
from the ESCO classification. Runs **by hand**; nothing in the app calls it.
The data under `data/` is a snapshot of the ESCO API from **2026-11-08**, so the
catalogue can be regenerated without network access and the result can be audited.

## Method

1. **Roles → ESCO occupations.** Each target role is matched to the ESCO occupation
   whose official description fits best (`ROLE_MAP` in `mapping.mjs`, with a fit
   rating and a note). Roles without a fitting occupation keep an expert-defined
   skill set and are marked "Kein eindeutiges ESCO-Konzept".
2. **Skills → ESCO concepts.** Each catalogue skill gets one core ESCO concept
   (URI, German label) plus closely related ESCO skills (`SKILL_MAP`). Every ESCO
   skill belongs to at most one catalogue skill, so nothing is counted twice.
   Fit `exact`/`close` → "ESCO-konzipiert"; `approx`/none → "Kein eindeutiges
   ESCO-Konzept" (with the nearest concept, if any).
3. **Levels.** A skill is *essential* for a role if its core concept or a related
   ESCO skill is listed as essential in the occupation profile; *optional* likewise.
   With two occupations, essential in either wins.

## Project decisions (2026-11-08)

- **Labels** follow the HSG course fact sheets (Swiss usage), not the German ESCO
  labels (`LABELS`); role labels stay as used at HSG. ESCO is the reference for
  the skill structure, not for the wording.
- **Critical thinking** is essential in every role (`ALWAYS_ESSENTIAL`),
  independent of ESCO, whose occupation profiles rarely list transversal skills.
- Roles without ESCO equivalent are kept, never deleted.
- Renamed after the review: Risk & Decision Analyst → Financial Risk Analyst,
  Supply Chain Planner → Logistics Analyst, Data Translator → Data Analyst.
- Added so that every taught skill belongs to an ESCO-based role:
  E-Business Manager, Chief Information Officer (CIO).
- ESCO qualifications were not used: the ESCO API has no qualification type;
  ESCO publishes qualifications only through Europass (national databases).

## Files

| File | What it is |
| ---- | ---------- |
| `mapping.mjs` | the mapping tables and decisions above (the part to review) |
| `search.mjs` | searches ESCO occupations or skills by text |
| `fetch-occ.mjs` | downloads occupation profiles into `data/occupations/` |
| `reuse.mjs` | fetches URI, German label and reuse level of every core concept → `data/core-skills.json` |
| `compare.mjs` | compares a catalogue's roles with the ESCO-derived levels |
| `generate-catalog.mjs` | writes `catalog.js` |
| `data/catalog-pre-esco.js` | the expert-defined catalogue before the ESCO review (generator input) |
| `data/comparison-pre-esco.*` | comparison of that catalogue with ESCO (39 of 244 levels agreed) |

## Usage (from `app/`)

```bash
# look up candidates (network)
node scripts/esco/search.mjs occupation 5 "supply chain manager"
node scripts/esco/search.mjs skill 5 "design thinking"

# refresh the snapshot after changing ROLE_MAP / SKILL_MAP (network)
node scripts/esco/fetch-occ.mjs scripts/esco/data/occupations <occupation-uuid> ...
node scripts/esco/reuse.mjs scripts/esco/data/occupations scripts/esco/data/core-skills.json

# regenerate the catalogue (offline)
node scripts/esco/generate-catalog.mjs scripts/esco/data/catalog-pre-esco.js \
  scripts/esco/data/occupations scripts/esco/data/core-skills.json \
  src/features/skillMaster/data/catalog.js

# then check that the semester skill files still fit the catalogue
node scripts/check-skill-data.mjs
```

A new skill or role is added to `data/catalog-pre-esco.js` (id, label,
aiAutomation, and for roles without ESCO equivalent its skills) and mapped in
`mapping.mjs`; then regenerate. Edit `catalog.js` only through the generator.
