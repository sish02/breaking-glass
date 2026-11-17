---

description: "Task list for Breaking Glass — co-op OTDR fiber-cut locator (first playable)"
---

# Tasks: Breaking Glass — co-op OTDR fiber-cut locator

**Input**: Design documents from `specs/001-breaking-glass-otdr/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: REQUIRED. Constitution Principles I and VII, plan "Verification", and research R2 call
for them. Expected values are hand-transcribed from the spec and contract tables, never computed by
the code under test. Write each test task before its implementation and confirm it fails first.

**Organization**: tasks are grouped by user story (spec.md US1–US4) so each story can be built and
checked on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: US1–US4 from spec.md
- All paths are relative to the repository root (a single static project; see plan.md "Project Structure").

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: directory layout and a test harness that runs in Node and the browser.

- [X] T001 Create the directories `engine/`, `ui/`, `data/`, `tests/`, and `tests/fixtures/` at the repository root, per plan.md "Source Code"; keep the existing `assets/icons/`
- [X] T002 [P] Create the minimal shared test harness (`test(id, fn)`, `assertEqual`, `assertDeepEqual`, `assertTrue`, results collector) in tests/harness.js. Pure ES module, no DOM, no Node-only APIs
- [X] T003 [P] Create the Node runner in tests/run.mjs: import every `tests/*.test.js`, print `N passed, M failed` plus failed case IDs, and exit non-zero on any failure **or when zero tests are discovered** (research R2)
- [X] T004 [P] Create the browser runner in tests/index.html: import the same suites as modules, render totals and failed case IDs visibly, and show FAIL when zero tests are discovered
- [X] T005 [P] Implement the pure formatting helpers `km(m)` → `"3.060 km"` and `metres(m)` → `"40 m"` in engine/format.js (research R4)

**Checkpoint**: `node tests/run.mjs` runs and reports FAIL (zero tests), proving the zero-test guard.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: prove the rule (plan slice 1), author the content, and build the page shell that every story renders into.

**⚠️ CRITICAL**: no user-story work begins until this phase is complete.

### Tests first (must fail before T011–T013)

- [X] T006 [P] Transcribe every row of the hand-checked table in contracts/engine-api.md (six rounds: correct site, each plausible-wrong `reasonCode`, and the evidence numbers `slackBeforeM`, `lowerCableM`, `upperCableM`, `groundFromAM`), plus the L2R1 CableModel hand-check from data-model.md, into tests/cases.js as literal values. Include the six round definitions as literal fixtures copied from spec.md "Version-one content"
- [X] T007 [P] Write tests/rules.test.js. For each case in tests/cases.js, assert `listSites` order (CO-A → CO-Z, spans and manholes interleaved), `cableModel` in/out values, `locate` site and evidence, and the `evaluate` status and reasonCode, including the `invalid-input`/`no-selection` case for `null` and for an unknown site ID
- [X] T008 [P] Create invalid-content fixtures in tests/fixtures/invalid.js: L2R1 with the end at 3090 (`ambiguous-break`), end beyond the route (`end-beyond-route`), two `end` events (`end-count`), an event after the end (`event-after-end`), slack on a CO (`slack-on-co`), non-increasing ground (`bad-route-order`), duplicate point ID (`duplicate-id`), a splice marked reflective (`bad-reflectivity`), 2 hints (`hint-count`), an unknown source ID (`unknown-source`), a missing `testEnd` (`missing-field`), `groundM` given as the string `"1000"` (`bad-type`, data-model.md RoutePoint.groundM), and an event with `type: "bend"` (an unknown event type, reported as `bad-type`, data-model.md TraceEvent.type)
- [X] T009 [P] Write tests/content.test.js. Each fixture in tests/fixtures/invalid.js yields `ok:false` with the expected `code` and `roundId`. A document with two broken rounds reports **both** (all errors collected). Loading data/levels.json from disk (Node `fs`) or by fetch (browser) yields `ok:true` **and** has exactly 3 levels × 2 rounds (the shipped-content count lives in this test, not in `validateContent`; data-model.md ContentDocument.levels, Level.rounds)

### Implementation

- [X] T010 Author data/levels.json with all 3 levels and 6 rounds exactly as spec.md "Version-one content", following contracts/content-schema.md. Fields per data-model.md: ContentDocument.schemaVersion, ContentDocument.sources, ContentDocument.levels, Level.id, Level.title, Level.learningOutcome, Level.briefing (paragraphs, a worked example whose values appear in no round, and limits, including the ±2% uncertainty statement from research R6 in L2 and L3), Level.sourceIds, Level.rounds, Round.id, Round.title, Round.testEnd, Round.route.points, Round.trace.wavelengthNm, Round.trace.attenuationDbPerKm, Round.trace.events, Round.hints (method → worked step → full solution), RoutePoint.id, RoutePoint.kind, RoutePoint.groundM, RoutePoint.slackM, TraceEvent.id, TraceEvent.type, TraceEvent.distanceM, TraceEvent.reflective, TraceEvent.lossDb. The sources are the four records in research.md R9, using its section names. Player-facing text follows the R9 wording rules: no "helix factor", and backscatter continuing is phrased as a conclusion
- [X] T011 [P] Implement `cableModel(round)` and `listSites(round)` in engine/rules.js per data-model.md "CableModel" and "DigSite": test-end ordering, mirroring for `testEnd:"Z"`, accumulating `inM`/`outM`, and span IDs always in CO-A → CO-Z order
- [X] T012 Implement `validateContent(doc)` in engine/content.js, enforcing every rule for data-model.md ContentDocument.schemaVersion, ContentDocument.sources, ContentDocument.levels, Source.id, Source.title, Source.url, Source.section, Source.claim, Level.id, Level.title, Level.learningOutcome, Level.briefing, Level.sourceIds, Level.rounds, Round.id, Round.title, Round.testEnd, Round.route.points, Round.trace.wavelengthNm, Round.trace.attenuationDbPerKm, Round.trace.events, Round.hints, RoutePoint.id, RoutePoint.kind, RoutePoint.groundM, RoutePoint.slackM, TraceEvent.id, TraceEvent.type, TraceEvent.distanceM, TraceEvent.reflective, and TraceEvent.lossDb, plus the round-level codes (including the 25 m `ambiguous-break` rule against every in/out boundary, 0, and the far-CO cable distance). Collect all errors as `{levelId?, roundId?, code, message}`, never throw, and depend on T011's `cableModel` for boundaries
- [X] T013 Implement `locate(round, opts)` and `evaluate(round, answer)` in engine/rules.js per contracts/engine-api.md: span rule `out(prev) ≤ d < in(k)`, coil rule `in(k) ≤ d ≤ out(k)`, the options `fromWrongEnd`, `ignoreSlack`, `subtractCoilContainingBreak`, placement by ground, and the fixed diagnosis order (non-break event → wrong end → ignored slack → over-subtracted slack → wrong site). Must be pure: no DOM, timers, or randomness
- [X] T014 Run `node tests/run.mjs`; all rules and content tests must pass. Fix the engine (never the expected values) on any mismatch, and record the totals in the task notes
- [X] T015 [P] Create the page shell in index.html: `<header>` with logo (assets/icons/logo.svg), `<main id="app">`, an `aria-live="polite"` feedback region, a native `<dialog id="restart-dialog">` (Cancel default, Restart), a `<noscript>` message, and `<script type="module" src="main.js">`. Use relative paths only
- [X] T016 [P] Create the base styles in style.css: colour tokens on `:root` with dark-mode overrides, base font ≥ 18 px with key values ≥ 24 px (research R7), a visible `:focus-visible` ring, success/retry/guidance/error states that also carry text labels, and a `@media (prefers-reduced-motion: reduce)` block
- [X] T017 Implement main.js: show "Loading the Albuquerque route…", fetch `data/levels.json` (relative URL), run `validateContent`, then either render the content-error screen (data-model.md Session.phase `content-error`, Session.contentErrors) listing every `roundId: message` with a **Try again** button (reload), or create the session and hand off to ui/render.js. A fetch or parse failure shows the same error screen (spec Edge Cases, FR-021)

**Checkpoint**: the rule is proven by tests; the page loads, and with a deliberately broken levels.json it shows the content-error screen.

---

## Phase 3: User Story 1 - Locate a cut and understand the result (Priority: P1) 🎯 MVP

**Goal**: team setup → L1 briefing → a playable round with trace, map, dig-site choice, graded feedback, retry, and Next.

**Independent Test**: quickstart.md Q1, Q2, Q3, Q6. Play L2R1: span MH-3 → CO-Z gives "Intact cable" (ignored slack); then span MH-2 → MH-3 gives "Break found, 2.960 km from CO-A".

### Tests for User Story 1 ⚠️

- [X] T018 [P] [US1] Write the US1 cases in tests/state.test.js: `createSession` starts in `setup`; `chooseTeamSize{3}` → `briefing` of L1; `startLevel` → `round` L1R1; `selectSite` changes no counts; `submit` with no selection → guidance and attempts unchanged; a wrong submit → attempts+1, unsolved; a correct submit → attempts+1, solved; a second submit after solving → state unchanged; `next` → the next round
- [X] T019 [P] [US1] Write tests/feedback.test.js: for each reasonCode, `explain()` returns a headline containing the result in words ("Break found" / "Intact cable" / "Choose a dig site first") and lines with the evidence numbers formatted by engine/format.js. L2R1 `ignored-slack` mentions 0.100 km slack, 3.100 km, and 40 m; L1R2 `picked-non-break-event` says backscatter continues after 1.500 km

### Implementation for User Story 1

- [X] T020 [US1] Implement `createSession(content)` and `reduce(state, action)` in engine/state.js for the actions `chooseTeamSize`, `startLevel`, `selectSite`, `highlightEvent`, `submit`, `next`, using data-model.md Session.phase, Session.teamSize, Session.levelIndex, Session.sessionRound, and Session.roundState (selectedSite, highlightedEvent, attempts, solved, lastDiagnosis). `submit` must call `rules.evaluate` and never decide correctness itself; the solved guard lives in the reducer
- [X] T021 [P] [US1] Implement `explain(diagnosis, round)` in engine/feedback.js with fixed templates per reasonCode from contracts/engine-api.md, giving positions to the metre ("Break found 2.960 km from CO-A, 40 m short of MH-3") **labelled as the model value**, followed by the field note "Real OTDR distances are about ±2%; crews confirm against records and the nearest manholes" (FR-012, research R6)
- [X] T022 [P] [US1] Implement the OTDR trace SVG builder in ui/trace.js per research R3 (dB vs distance from the test end; connector spike and step; splice step; reflective or plain end; a deterministic noise floor seeded by round ID; `role="img"` with a label). Add a **Trace events** table with distance (km), type, and reflective columns. Event rows and markers are buttons that dispatch `highlightEvent` only (FR-010a)
- [X] T023 [P] [US1] Implement the route map SVG builder in ui/routemap.js: CO-A on the left and CO-Z on the right, manholes using assets/icons/manhole.svg, slack coils as loops labelled with metres, and the OTDR icon at the test end. Add a **Route** table with point, ground km from CO-A, and slack m; also a cumulative-slack column, hidden until the round is solved or the full solution is opened (FR-008)
- [X] T024 [US1] Implement the screens in ui/render.js: setup (radio 3/4 players, Start), briefing (title, paragraphs, worked example, limits, sources with title, section, and link; **Begin round**), round (test-end banner "OTDR connected at CO-A", trace, map, dig-site `<fieldset>` with legend "Where should the crew dig?" and radios from `listSites`, **Dispatch crew**, **Next** enabled only when solved, feedback region filled from `explain`, progress line "Level x of 3 · Round y of 2 · Solved n of 6"), per contracts/ui-contract.md
- [X] T025 [US1] Implement event wiring in ui/controls.js: map clicks and keys to reducer actions and re-render. Disable **Dispatch crew** once solved. After a correct submit, play the dispatch marker through the coils and move the truck (≤ 1.5 s). The feedback text appears immediately and never waits for the animation
- [X] T026 [US1] Run `node tests/run.mjs` (all suites pass), then perform quickstart.md Q1, Q2, Q3, and Q6 in a browser; record the results in the T026 notes

**Checkpoint**: MVP. One complete teaching loop works for every round, with retry and advance.

---

## Phase 4: User Story 2 - Get help, see progress, and finish the session (Priority: P1)

**Goal**: three-step help, level completion, the session summary, and Restart with confirmation.

**Independent Test**: quickstart.md Q7, Q8, Q9, Q16.

### Tests for User Story 2 ⚠️

- [X] T027 [P] [US2] Add the US2 cases to tests/state.test.js: `requestHelp` raises assistance 0→1→2→3, then stops; it never selects or submits; it is ignored once the round is solved. `next` after the second round of a level → the next level's briefing; after L3R2 → `summary`. `requestRestart` → `restartPending:true`; `cancelRestart` → identical prior state; `confirmRestart` → `setup` with all roundState cleared. Help is usable with zero attempts (FR-016)

### Implementation for User Story 2

- [X] T028 [US2] Extend engine/state.js with `requestHelp`, level-boundary `next`, `summary`, `requestRestart`, `cancelRestart`, and `confirmRestart`, using data-model.md Session.roundState (assistance 0–3) and Session.restartPending
- [X] T029 [US2] Add the help panel to ui/render.js: a **Get help (k of 3)** button, revealed hints staying visible in order, and the button disabled after step 3 or once solved. Add the level recap (shown in the feedback region when a level's second round is solved, before Next: that level's solved / attempts / help) and the summary screen grouped by level (per round solved / attempts / help steps used, level subtotals, session totals) and **Play again** (FR-018, contracts/ui-contract.md)
- [X] T030 [US2] Wire **Restart** in ui/controls.js to the native `<dialog id="restart-dialog">` (Cancel has default focus; Esc = Cancel) and the summary's **Play again** to `confirmRestart`
- [X] T031 [US2] Run `node tests/run.mjs`, then perform quickstart.md Q7, Q8, Q9, Q11, Q16, and Q17 (reload → new session, FR-006); record the results in the T031 notes

**Checkpoint**: the whole six-round session plays from start to summary.

---

## Phase 5: User Story 3 - Play as a co-op team around one screen (Priority: P2)

**Goal**: role cards rotate per FR-019 for 3 or 4 players.

**Independent Test**: quickstart.md Q10.

### Tests for User Story 3 ⚠️

- [X] T032 [P] [US3] Add `roleFor` cases to tests/state.test.js as literal expectations: n=3, r=0 → P1 OTDR Reader, P2 Route Mapper, P3 Dispatcher; n=3, r=1 → P1 Route Mapper, P2 Dispatcher, P3 OTDR Reader; n=4, r=0 → P4 Safety Lead; n=4, r=5 → P1 Route Mapper, P2 Dispatcher, P3 Safety Lead, P4 OTDR Reader

### Implementation for User Story 3

- [X] T033 [US3] Implement `roleFor(player, sessionRound, n)` in engine/state.js using data-model.md Session.teamSize and Session.sessionRound and `ROLES[(p − 1 + r) mod n]`
- [X] T034 [US3] Render the role cards ("Player 2 — Route Mapper", not interactive) above the challenge in ui/render.js; show no name fields anywhere (FR-020)
- [X] T035 [US3] Run `node tests/run.mjs` and perform quickstart.md Q10; record the results in the T035 notes

**Checkpoint**: the team experience is complete.

---

## Phase 6: User Story 4 - Play with keyboard, projector, and reduced motion (Priority: P2)

**Goal**: Principle IV evidence: keyboard-only play, text feedback, reduced motion, narrow and projector layouts.

**Independent Test**: quickstart.md Q12, Q13, Q14.

### Implementation for User Story 4

- [X] T036 [US4] Add focus management to ui/controls.js: after Submit, focus the feedback heading; after Next, focus the new round's test-end banner or the briefing heading; after setup Start, focus the L1 briefing heading; restore focus to Restart after Cancel
- [X] T037 [P] [US4] Add reduced-motion handling to ui/controls.js and ui/routemap.js: check `matchMedia('(prefers-reduced-motion: reduce)')` and skip the marker and truck animation, showing final positions at once
- [X] T038 [P] [US4] Add responsive and projector layout to style.css: at ≤ 600 px, stack trace, map, choices, and feedback; tables scroll horizontally inside labelled `role="region"` containers with `tabindex="0"`; action buttons are never hidden; key values ≥ 24 px. Check contrast in both themes
- [X] T039 [P] [US4] Wire the original icons from assets/icons/ (otdr, manhole, slack-coil, splice-closure, fiber-cut, dig-truck) into ui/trace.js, ui/routemap.js, and ui/render.js; decorative uses get `aria-hidden="true"`. No photographs (FR-028)
- [X] T040 [US4] Perform quickstart.md Q12 (keyboard-only Level 1), Q13 (reduced motion), and Q14 (360 px plus projector/150% zoom); record what was actually checked in the T040 notes

**Checkpoint**: access checks recorded.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T041 [P] Add a trial seventh round to a copy of the content inside tests/content.test.js and assert it validates and evaluates with no engine change (SC-008, Principle VI; relies on data-model.md ContentDocument.levels and Level.rounds having no fixed count)
- [X] T042 [P] **Required (Principle I).** Source and teaching review against research.md R9: re-check the foa-restoration quotes on the live page; confirm or drop the itu-g650-1 citation; review **every** briefing in data/levels.json **and every explanation template in engine/feedback.js** against the cited sources and R9 wording rules; confirm that no briefing worked example reuses a round's break distance (data-model.md Level.briefing); update data/levels.json `sources` and wording to match; note in research.md any gap still open (the slack-offset source)
- [ ] T043 **Required (Principle I).** A teammate who did not author the content independently re-computes the six-round table in spec.md "Version-one content" (correct site, each plausible-wrong diagnosis, ground position) by hand from FR-011, without running the code, and records the result (agree / disagree per row, name or handle, date) in README.md Verification. Any disagreement blocks release until it is resolved in the spec and tests
- [ ] T044 **Required (Principle II, SC-002, SC-003).** Observed playtest with a team new to the game, without coaching: time from setup to summary (target ≤ 15 min), and after each of 5 deliberate wrong choices, whether a player can state the mistake in one sentence (target ≥ 4 of 5). Record the observations in README.md Verification
- [X] T045 Update README.md: status (set to "verified" only if T042–T044 passed, otherwise "playable, not verified"), controls (actual), how to play, model and limits (including ±2% and the derived slack model), sources table with sections, commands (`python3 -m http.server …`, `/tests/`, `node tests/run.mjs`), working artifact paths (`.specify/memory/constitution.md`, `specs/001-breaking-glass-otdr/`), and the Verification table filled from the T026, T031, T035, T040, T042, T043, and T044 notes with pass / fail / not run, date, and browser
- [X] T046 Run quickstart.md Q15 (fresh clone into a new folder, following the README only) and the full `node tests/run.mjs`; record the results in README.md Verification
- [X] T047 Remove the Sync Impact Report comment from .specify/memory/constitution.md before the first commit (per the constitution command's instructions)

---

## Phase 8: Arcade redesign (spec clarifications 2026-11-17, FR-002/007/010/026/029)

**Purpose**: make the first playable click-and-watch and arcade-styled without changing the grading engine.

- [X] T048 Record the redesign decisions in spec.md (Clarifications, FR-002, FR-007, FR-010, FR-026, new FR-029) and contracts/ui-contract.md
- [X] T049 [US1] Write tests for `firePulse` and `dig` in tests/state.test.js (dig/submit ignored before firing; firing free and idempotent; a dig is one attempt and is recorded in `digs`; no digs after solving; an unknown site is guidance only), then add them to engine/state.js (data-model.md Session.roundState gains `fired` and `digs`)
- [X] T050 Require `briefing.summary` and validate an optional `briefing.demo` with the round rules in engine/content.js, with tests in tests/content.test.js; add summaries and demo routes built from each worked example to data/levels.json (demo answers checked against the worked-example text)
- [X] T051 [US1] Animated OTDR trace in ui/trace.js: empty until fired; the pulse runs along the fiber strand above the plot only; the trace is revealed in step; the echo returns from the break
- [X] T052 [US1] Street-as-controller in ui/routemap.js: focusable zones per span and manhole in CO-A → CO-Z order, hover/focus "DIG?", miss markers, original pixel-style truck, the cut marker and the "TRACE SAID" ghost line after a hit
- [X] T053 [US1] Arcade effects in ui/anim.js (pulse, truck drive and dig, hit burst, CUT FOUND / NO DAMAGE banner). All of them settle immediately with reduced motion
- [X] T054 [US1] Arcade screens in ui/render.js (title with PRESS START, short briefing with demo and More detail, HUD with level / cuts found / digs / help and no points, scene panel with feedback below the street, final screen) and wiring in ui/controls.js (fire, click and Enter/Space digs, the truck ends on the cut after a hit, focus stays on the dug zone)
- [X] T055 [P] Arcade stylesheet in style.css: neon cabinet, CRT scanlines, chunky buttons, body ≥ 18 px, dashed focus ring, narrow layout, reduced motion
- [X] T056 Browser re-verification with real mouse clicks, keyboard-only play, reduced motion, 360 px, content error and console errors (44/44), plus `node tests/run.mjs` (95/95); README updated with the results and new screenshots

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: depends on Setup. Blocks all stories. T006–T009 (tests) come before
  T011–T013. T011 (`cableModel`) comes before T012 (validation uses it) and T013. T014 gates the
  phase.
- **US1 (Phase 3)**: depends on Foundational. This is the MVP.
- **US2 (Phase 4)**: depends on US1's engine/state.js and ui/render.js (it extends the same files).
- **US3 (Phase 5)**: depends on Foundational and US1 (render.js); independent of US2.
- **US4 (Phase 6)**: depends on US1 screens; best after US2 and US3, so every control exists.
- **Polish (Phase 7)**: after the desired stories.

### Within Each Story

Tests → engine → UI → manual verification task. A story is not complete until its verification
task records results (Principle VII).

### Parallel Opportunities

- Phase 1: T002, T003, T004, T005.
- Phase 2: T006, T007, T008, T009 (tests); T015 and T016 (shell and styles) alongside the engine work; T010 alongside T011.
- US1: T018 ∥ T019; then T021 ∥ T022 ∥ T023 once T020 has started (different files).
- US3 can proceed in parallel with US2 after US1 (they touch different parts of render.js; coordinate merges).
- US4: T037 ∥ T038 ∥ T039.
- Polish: T041 ∥ T042 ∥ T043 (different people/files); T044 needs the finished game.

---

## Parallel Example: User Story 1

```bash
# Tests together:
Task: "Write the US1 cases in tests/state.test.js"
Task: "Write tests/feedback.test.js"

# Then the independent builders together:
Task: "Implement explain() in engine/feedback.js"
Task: "Implement the OTDR trace SVG builder in ui/trace.js"
Task: "Implement the route map SVG builder in ui/routemap.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup → Phase 2 Foundational (the rule is proven by tests).
2. Phase 3 US1 → **stop and validate** with quickstart Q1, Q2, Q3, Q6.
3. Demo-ready: one teaching loop with a deliberate wrong answer and its explanation.

### Incremental Delivery (60-minute budget, per StarterKit/PLAN.md)

1. 0–15 min: Setup + Foundational (T001–T017).
2. 15–35 min: US1 (T018–T026).
3. 35–45 min: US2 + US3 (T027–T035).
4. 45–55 min: US4 + verification (T036–T040).
5. 55–60 min: README, fresh-clone check, and constitution cleanup (T045–T047); T041 if time allows.
6. **Release gate (not optional):** T042 source/teaching review, T043 teammate re-check, and T044
   playtest. These may happen after the workshop hour, but until all three pass the README status
   stays "playable, not verified" (Principles I, II, VII).

**Scope cut order if short on time** (plan.md): Level 3 content first (keep the engine support and
tests), then animation. Never cut the slack math, the feedback, or the tests.

---

## Notes

- Expected values in tests/cases.js are literals from spec.md and contracts/engine-api.md. Never
  generate them by calling the engine.
- A checked box needs evidence (test totals or recorded manual results), not just finished code.
- Commit after each phase checkpoint.
