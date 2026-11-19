# Skill contribution of courses (coding of the Merkblätter)

Replaces the estimated `contribution` values in the semester skill files
(`public/skill-master/*.json`) with values derived from a documented coding of
the HSG course fact sheets by two independent coders. Runs **by hand**; nothing
in the app calls it. Status: coding sheet and evaluation ready, coding not yet done.

## Method

- **Construct.** The contribution is the expected rise of a student's level in a
  skill (scale 0–100, the scale the app uses for targets and self-assessment)
  from attending the course.
- **Codes** per course–skill pair, taken from the Merkblatt only (rules in
  [CODEBOOK.md](CODEBOOK.md)), following constructive alignment (Biggs 1996):
  share of the course spent on the skill, highest Bloom level its learning
  objectives demand (Anderson & Krathwohl 2001), share of the grade that assesses
  it; plus the ECTS per course.
- **Scoring rule** (`contribution()` in `codebook.mjs`):
  `hours = ECTS × 30 × share/100`, `contribution = cap(Bloom) × min(1, hours/90) ×
  (assessed ? 1 : 0.75)`, rounded to 5. Caps per Bloom level: 15, 25, 40, 60, 70, 80.
- **Reliability.** Two coders code all pairs independently. Krippendorff's alpha
  per code (share and assessment interval, Bloom ordinal) and for the computed
  contribution (interval); ≥ 0.800 reliable, ≥ 0.667 tentative (Krippendorff
  2018). Implementation checked against Krippendorff's published example
  (nominal 0.743, ordinal 0.815, interval 0.849).
- **Consensus.** Pairs where the coders differ by ≥ 15 points of contribution,
  ≥ 20 points of share or assessment, or ≥ 2 Bloom levels are listed for
  discussion. The agreed codes go into a sheet with coder code `KONSENS`, which
  then defines the final values; without it the evaluation uses the mean of the
  coders (median for Bloom and ECTS).
- **Sensitivity.** The report recomputes all contributions with other parameter
  values (90 h → 60 / 120 h; 0.75 → 0.5 / 1.0) and gives the Spearman correlation
  with the chosen ones, to show how far the results depend on the parameters.

### Project decisions

- `PARAMS` in `codebook.mjs`: 30 h per ECTS (ECTS Users' Guide: 25–30 h; to be
  checked against the HSG regulations), 90 h to reach the Bloom cap (a full
  3-ECTS course), unassessed skills count 0.75. Chosen so that one course cannot
  bring a skill to the target level of a job (80) on its own.
- Only the pairs the extraction found are coded; coders mark missing skills in
  the comment, and they are added afterwards. A share of 0 removes the skill from
  the course (`status: "rejected"`).
- Cross-listed courses (same title, two numbers) are coded once; the result is
  written to both numbers.
- Coders see neither the extraction's values nor its evidence, so their codes are
  independent of it.

## Privacy

Coding sheets and the local report (evidence, comments) stay in `out/`,
`responses/` or any folder outside the repo; both folders are git-ignored. Only
`data/contributions.json` (codes and results, coder pseudonyms only as a count)
belongs in the repo.

## Usage (from `app/`)

```bash
# 1. One coding sheet per coder (default C1, C2) in scripts/contribution/out/
node scripts/contribution/build-sheets.mjs --coders C1,C2

# 2. Returned sheets into scripts/contribution/responses/, then evaluate
node scripts/contribution/evaluate.mjs scripts/contribution/responses
#    -> data/contributions.json + responses/Auswertung.md (alpha, cases to discuss, sensitivity)

# 3. After discussing the listed cases: a consensus sheet, filled in jointly
node scripts/contribution/build-sheets.mjs --coders KONSENS
#    put it into responses/ next to C1 and C2 and evaluate again

# 4. Write the contributions into the semester file and check it
node scripts/contribution/sync-semester-file.mjs --dry-run
node scripts/contribution/sync-semester-file.mjs
node scripts/check-skill-data.mjs
```

## Files

| File | What it is |
| ---- | ---------- |
| `CODEBOOK.md` | coding rules for the coders, with worked examples |
| `codebook.mjs` | Bloom levels, parameters and the scoring rule |
| `alpha.mjs` | Krippendorff's alpha (nominal, ordinal, interval) |
| `sheet.mjs` | the Excel coding sheet: building and reading |
| `build-sheets.mjs` | writes one sheet per coder |
| `evaluate.mjs` | reliability, cases to discuss, sensitivity, final values |
| `sync-semester-file.mjs` | writes the contributions into `public/skill-master/HS26.json` |

Tests: `scripts/__tests__/contribution.test.js`.
