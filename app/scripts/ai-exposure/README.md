# AI exposure of the Skill-Master skills (HSG expert panel)

Replaces the expert estimates in `aiAutomation` with values from a panel of HSG
experts, collected in two Delphi rounds. Runs **by hand**; nothing in the app calls it.
Status: questionnaire and evaluation ready, panel not yet run.

## Method

- **Definition** (adapted from Eloundou, Manning, Mishkin & Rock 2024, *Science* 384):
  the AI exposure of a skill is the share of its typical professional activities for
  which generally available AI tools *today* at least halve the time needed at equal
  quality. Exposure is not replacement.
- **Scale** 0–100 (whole numbers) with anchors at 0, 25, 50, 75, 100 (sheet «Skala»).
  Experts may leave a skill blank; each rating carries a confidence (niedrig / mittel /
  hoch) and an optional comment.
- **Panel**: invite 10–12 to obtain at least 6, mixing computer science / AI, labour
  economics and the management disciplines. Each participant gets a code (P01 …), not a
  name, and a randomised skill order (seeded by the code) so order effects average out.
- **Round 1**: independent ratings. **Round 2**: each participant sees the panel median,
  the middle 50 % (Q1–Q3) and their own round-1 value (already filled in) and may revise;
  values clearly outside Q1–Q3 should be justified in the comment.
- **Result per skill**: median of the final round; spread as Q1–Q3 (type 7 quantiles,
  as Excel QUARTILE.INC). The catalogue takes the median rounded to 5.
- **Agreement**: ICC(2,1) and ICC(2,k), two-way random, absolute agreement
  (Shrout & Fleiss 1979), over the skills every participant rated.

### Project decisions

- A skill gets the panel value only with **at least 6 ratings** (`MIN_RATINGS`);
  otherwise it keeps its expert estimate, marked `aiBasis: "Expertenschätzung"`.
- Consensus by the IQR on the 0–100 scale: ≤ 20 high, ≤ 30 medium, above low
  (`CONSENSUS`). These thresholds are our choice, not a fixed standard.
- The catalogue is frozen during the panel: questionnaires carry a catalogue version
  (hash of skill ids and labels); the evaluation warns about answers to another version,
  and round 2 refuses to start if the catalogue changed. Skills added later need a
  follow-up round.
- Open: rename the UI label from “KI-Automatisierbarkeit” to “KI-Exposition”; clarify
  with the supervisor whether the HSG ethics committee must see the survey.

## Privacy

Returned files and the local report (`Auswertung-Runde*.md`, with comments) stay in
`responses/` or any folder outside the repo; `responses/` and `out/` are git-ignored.
Only the aggregated `data/results-r*.json` (no codes, no comments) belongs in the repo.

## Usage (from `app/`)

```bash
# 1. Round 1: one questionnaire per participant (P01 … P12) in scripts/ai-exposure/out/
node scripts/ai-exposure/build-questionnaire.mjs --experts 12 \
  --contact "Name, E-Mail" --deadline "30. November 2026"

# 2. Put the returned files into scripts/ai-exposure/responses/r1/, then evaluate
node scripts/ai-exposure/evaluate.mjs scripts/ai-exposure/responses/r1
#    -> data/results-r1.json (aggregated) + responses/r1/Auswertung-Runde1.md (local)

# 3. Round 2 (Delphi) for everyone who answered round 1
node scripts/ai-exposure/build-questionnaire.mjs --round 2 \
  --results scripts/ai-exposure/data/results-r1.json --responses scripts/ai-exposure/responses/r1

# 4. Returned round-2 files into responses/r2/, evaluate
node scripts/ai-exposure/evaluate.mjs scripts/ai-exposure/responses/r2

# 5. Take the final values into the catalogue and the semester files
node scripts/esco/generate-catalog.mjs scripts/esco/data/catalog-pre-esco.js \
  scripts/esco/data/occupations scripts/esco/data/core-skills.json \
  src/features/skillMaster/data/catalog.js scripts/ai-exposure/data/results-r2.json
node scripts/ai-exposure/sync-semester-files.mjs
node scripts/check-skill-data.mjs
```

Without the fifth argument the generator writes the catalogue exactly as before.

## Files

| File | What it is |
| ---- | ---------- |
| `descriptions.mjs` | one-sentence description per skill shown to the experts (review before sending) |
| `questionnaire.mjs` | definition, scale, building and reading the Excel questionnaire |
| `build-questionnaire.mjs` | writes the round-1 or round-2 questionnaires |
| `stats.mjs` | median, quartiles, consensus, ICC (pure functions) |
| `evaluate.mjs` | evaluates a round → `data/results-r<round>.json` and a local report |
| `sync-semester-files.mjs` | copies `aiAutomation` from the catalogue into `public/skill-master/*.json` |

Tests: `scripts/__tests__/ai-exposure.test.js` (includes the ICC example of Shrout & Fleiss).
