# Implementation Plan: Breaking Glass — co-op OTDR fiber-cut locator

**Branch**: `001-breaking-glass-otdr` (working on `main`) | **Date**: 2026-11-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-breaking-glass-otdr/spec.md`; planning input
`StarterKit/PLAN.md`; constitution v1.0.0.

## Summary

A static browser game in which a 3–4-person co-op team reads an OTDR trace and a route map, then
dispatches a dig crew to one span or manhole. A pure rule engine places the break: it orders the
route from the test end, accumulates manhole slack, and places the break in a span or a coil. The
same engine diagnoses wrong answers by re-running the placement with deliberate mistakes (wrong
end, ignored slack, over-subtracted slack, or a non-break event). Content lives in one JSON file,
validated in full at load. Rendering is inline SVG with text tables. Session state is held in memory
by a pure reducer.

**Hardest behavior to get right:** slack accumulation in the correct direction, the
inside-a-coil case, and diagnosing mistakes in a fixed order.
**First evidence:** L2R1 → `span:MH-2~MH-3` correct (ground 2960 m); `span:MH-3~CO-Z` →
`ignored-slack`. All six rounds were cross-checked by hand and with a throwaway script during
planning (see the [engine-api contract](contracts/engine-api.md) table).

## Technical Context

**Language/Version**: HTML5, CSS, JavaScript ES2022 modules (no transpiling)

**Primary Dependencies**: none at runtime. Python 3 `http.server` for local serving; Node 20+
(local 22.14) optional, for `tests/run.mjs`.

**Storage**: none. Authored content in `data/levels.json`; session state in memory only.

**Testing**: dependency-free shared test modules, run by `tests/index.html` (browser, required) and
`tests/run.mjs` (Node). Expected values are hand-transcribed in `tests/cases.js`.

**Target Platform**: current desktop browsers (Chromium, Firefox, Safari), on a laptop and a
projector; narrow windows down to 360 px.

**Project Type**: static single-page web game (no backend)

**Performance Goals**: first render < 1 s on a local server; interactions respond < 100 ms;
dispatch animation ≤ 1.5 s and never blocks feedback.

**Constraints**: offline-capable once served; relative paths only (GitHub Pages subpath); no
`file://`; no network calls apart from loading the game's own files; no storage APIs; original SVG
art only.

**Scale/Scope**: 3 levels × 2 rounds; one shared device; about 10 source modules and 7 icons.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Pre-research | Post-design |
| --- | --- | --- | --- |
| I. Technical truth | Rule documented; hand-checked cases; sources with sections; simplifications disclosed | PASS (rule in spec FR-011) | PASS with a **correction**: the uncertainty assumption was false (R6) and has been fixed in the spec. Source gaps are disclosed in R9 as release items |
| II. Teach through a decision | Graded action = dig site; specific misconception feedback; method-first hints | PASS | PASS (five reason codes; three help steps) |
| III. Honest progress | Correct-only completion; no-selection is free; no double award; co-op, no points | PASS | PASS (reducer guards; data-model transitions) |
| IV. Access | Keyboard, text feedback, text equivalents, reduced motion, projector, narrow | PASS | PASS ([ui-contract](contracts/ui-contract.md)) |
| V. Self-contained | No backend, model, or key; original SVG; no photos | PASS | PASS |
| VI. Content/logic separation | Data file; validation before play; feedback from the evaluator | PASS | PASS ([content-schema](contracts/content-schema.md), [engine-api](contracts/engine-api.md)) |
| VII. Done is demonstrated | Test commands; zero tests = fail; recorded manual checks | PASS | PASS ([quickstart](quickstart.md)) |

No violations; Complexity Tracking is not needed.

## Contradictions resolved

| Between | Conflict | Resolution |
| --- | --- | --- |
| Spec assumption ↔ FOA restoration guide | The spec said the 25 m margin covers measurement uncertainty; FOA gives ~±2% | Spec assumption corrected. The margin is only an authoring tie-breaker; briefings and README disclose ±2% and field confirmation (R6) |
| StarterKit/PLAN.md ↔ clarified spec | PLAN showed a per-round content-error view; the spec now requires load-time refusal | Load-time `validateContent` blocks the start; `evaluate` keeps a defensive `content-error` guard only |
| StarterKit/PLAN.md ↔ spec FR-019 | PLAN said "round number modulo team size"; the spec gives the exact formula | `roleFor(p, r, n) = ROLES[(p − 1 + r) mod n]` |
| StarterKit/PLAN.md ↔ sources | PLAN and constitution wording mention the "helix factor"; no source read covers it | Player-facing text says "corrected from fiber length to cable length" (foa-otdr-faq); "helix" is dropped from the UI |
| StarterKit/PLAN.md tests ↔ agent verification | Browser runner only | Add the Node runner `tests/run.mjs`, which runs the same test modules |

## Project Structure

### Documentation (this feature)

```text
specs/001-breaking-glass-otdr/
├── plan.md              # This file
├── research.md          # Phase 0: decisions, source verification, gaps
├── data-model.md        # Phase 1: entities, validation, state transitions
├── quickstart.md        # Phase 1: run + validation scenarios
├── contracts/
│   ├── content-schema.md
│   ├── engine-api.md
│   └── ui-contract.md
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks; not created here)
```

### Source Code (repository root)

```text
index.html                 Page shell, landmarks, live region, restart dialog; loads main.js
style.css                  Tokens (light/dark), projector-size type, focus rings, layout, reduced motion
main.js                    fetch data/levels.json → validateContent → createSession → render loop
engine/
  rules.js                 cableModel, listSites, locate, evaluate (pure)
  content.js               validateContent (pure; collects all errors)
  state.js                 createSession, reduce, roleFor (pure)
  feedback.js              explain(diagnosis, round) → text (pure)
  format.js                km/m formatting helpers (pure)
ui/
  render.js                Screens: setup, briefing, round, summary, content-error
  trace.js                 OTDR trace SVG + event table from round data
  routemap.js              Route SVG + route table, dispatch marker/truck
  controls.js              Event wiring, focus moves, dialog, reduced-motion check
  anim.js                  Arcade effects (Web Animations API); settles instantly with reduced motion (arcade redesign)
data/
  levels.json              3 levels × 2 rounds, sources
assets/icons/              Original SVGs (already present: logo, otdr, manhole, slack-coil,
                           splice-closure, fiber-cut, dig-truck)
tests/
  index.html               Browser runner (totals, failed IDs, zero = fail)
  run.mjs                  Node runner (same suites; exit code ≠ 0 on failure or zero tests)
  harness.js               Minimal test/assert helpers shared by both runners
  cases.js                 Hand-transcribed expected results (from spec/contract tables)
  rules.test.js            All six rounds: correct sites, diagnoses, evidence numbers
  content.test.js          Shipped file valid; ambiguity (3090) and malformed fixtures rejected
  state.test.js            Attempts, no-selection, help 0–3, duplicate submit, next/summary, restart, roles
README.md                  Updated with actual behavior, commands, verification
```

**Structure Decision**: a single static project at the repository root, following
`StarterKit/PLAN.md`, plus `engine/format.js`, `ui/trace.js`, `ui/routemap.js`, and the Node runner.
The extra view files keep each SVG builder small. There is no `src/`, because GitHub Pages serves
the root.

## Implementation slices (for /speckit-tasks)

| Slice | Deliverable | Exit evidence |
| --- | --- | --- |
| 1 · Prove the rule | `engine/rules.js`, `content.js`, `format.js`, test harness and both runners, `rules.test.js`, `content.test.js` | `node tests/run.mjs` passes every contract row; the 3090 fixture is rejected |
| 2 · One full round | `state.js`, `feedback.js`, L2R1 in `levels.json`, page shell, round screen with trace, map, tables, choices, feedback, Next | Q2 passes in a browser |
| 3 · Curriculum | All 6 rounds and 3 briefings with sources and limits; setup and roles; help; summary; restart | Q1, Q3–Q11, Q16, Q17 pass; `state.test.js` passes |
| 4 · Usable | Keyboard and focus, reduced motion, narrow and projector layout, light/dark tokens, icons wired | Q12–Q14 recorded |
| 5 · Package | README (commands, behavior, verification table, sources, limits) | Q15 recorded |

If time is short, cut Level 3 content (keeping the engine support and tests), then animation. Never
cut the slack math, the feedback, or the tests.

## Open release items (not plan blockers)

- Re-check the foa-restoration quotes verbatim on the live page (R9). → **T042**
- Find a direct source for the slack-loop distance offset, or keep it labelled as a derived model
  in the briefings (R9). → **T042**
- Confirm the G.650.1 backscatter clause from the recommendation text, or drop that citation. → **T042**
- A teammate independently re-checks the six-round table (Principle I). → **T043**
- Observed playtest with a new team for SC-002 and SC-003 (Principle II). → **T044**

## Complexity Tracking

No constitution violations to justify.
