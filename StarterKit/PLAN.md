# Breaking Glass · Implementation plan

## Build target

Implement the clarified specification for Breaking Glass within the workshop build block. First deliver one complete round (L2R1) with correct grading, explanatory feedback, retry, and advance. Then add team setup, the other five rounds, and polish through the same implementation.

**Hardest behavior to get right:** converting an OTDR cable distance into a dig site. This means accumulating manhole slack in the correct direction from the test end, detecting a break inside a coil, and telling which misconception a wrong site represents.

**First evidence we'll check:** L2R1. A break at 3060 m with 50 m slack per manhole gives span MH-2 → MH-3 (ground 2960 m). Span MH-3 → CO-Z gives `ignored-slack`.

## Stack and serving

- Semantic HTML, CSS, and native JavaScript modules. No framework, bundler, backend, or runtime model.
- DOM controls plus inline SVG for the OTDR trace and route map, each paired with a text table. No rendering dependency.
- Original SVG icons in `assets/icons/` (OTDR, manhole, slack coil, splice closure, fiber cut, dig truck, logo). They use `currentColor` so they follow light and dark themes. No photographs.
- `data/levels.json` for authored content, loaded over HTTP using a relative URL.
- In-memory session state. Reload starts a fresh session at team setup. No persistence in v1.
- Static hosting, including a repository subpath such as GitHub Pages. Relative asset paths and case-correct filenames.

Preview from the repository root after implementation creates `index.html`:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open **http://127.0.0.1:8000**. On Windows use `py` in place of `python3`. Native modules and JSON fetching need a web server; opening the HTML with `file://` is not the supported run path. [MDN reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules).

## Proposed files and responsibilities

```text
index.html                   Semantic page shell and module entry point
style.css                    Layout, focus, feedback states, reduced motion, projector-size type
main.js                      Load → validate → start; render loading/errors
engine/
  rules.js                   Pure slack/direction math and dig-site evaluation; no DOM
  content.js                 Validate level data, routes, events, 25 m ambiguity margin
  state.js                   Team size, role rotation, attempts, assistance, completion, restart
  feedback.js                Turn evaluator results + reason codes into explanation text
ui/
  render.js                  Team setup, briefing, trace SVG + event table, route map SVG + route table, feedback, summary
  controls.js                Dig-site selector (radio group), Submit/Hint/Next/Restart, focus management
assets/icons/                Original SVG icons
data/
  levels.json                Briefings, routes, trace events, hints, source records
tests/
  index.html                 Browser test runner with visible pass/fail summary
  rules.test.js              Hand-computed expected results from SPEC.md
  state.test.js              Attempts, assistance, duplicate submit, progression, role rotation
  content.test.js            Invalid/missing/ambiguous authored data
README.md                    Actual run instructions, behavior, and evidence
```

## Data contract

One document with `schemaVersion`, `sources`, and `levels`. Each level has a unique `id`, `title`, `learningOutcome` (LO1–LO3), `briefing` (with a worked example that differs from its rounds), `sourceIds`, and ordered `rounds`.

**Domain fields (all distances integer metres):**

```jsonc
{
  "id": "L2R1",
  "testEnd": "A",                       // "A" (CO-A) or "Z" (CO-Z)
  "route": {
    "points": [
      { "id": "CO-A", "kind": "co",      "groundM": 0 },
      { "id": "MH-1", "kind": "manhole", "groundM": 1000, "slackM": 50 },
      { "id": "MH-2", "kind": "manhole", "groundM": 2000, "slackM": 50 },
      { "id": "MH-3", "kind": "manhole", "groundM": 3000, "slackM": 50 },
      { "id": "CO-Z", "kind": "co",      "groundM": 4000 }
    ]
  },
  "trace": {
    "wavelengthNm": 1550,
    "attenuationDbPerKm": 0.20,
    "events": [
      { "id": "e0", "type": "launch",    "distanceM": 0,    "reflective": true },
      { "id": "e1", "type": "end",       "distanceM": 3060, "reflective": false }
    ]
  },
  "hints": ["method…", "worked step…", "worked solution…"]
}
```

- `groundM` is always measured from CO-A; the evaluator mirrors the route when `testEnd` is `"Z"`.
- Event `type` is one of `launch | connector | splice | end`. `lossDb` is optional and used for drawing only.

**Choice representation:** a dig-site ID, either `mh:<pointId>` (e.g. `mh:MH-2`) or `span:<pointId>~<pointId>` in CO-A → CO-Z order (e.g. `span:MH-2~MH-3`). The UI lists every span and every manhole on the route, in route order, as a radio group. It is never filtered or ordered by the answer.

**Validation rules (reject the round with a content error naming its ID):**
- Missing fields, duplicate point/event/round IDs, or non-integer or negative distances.
- Route not starting with `CO-A` and ending with `CO-Z`, ground distances not strictly increasing, slack on a CO, or negative slack.
- Not exactly one `end` event; any event after the `end`; or an `end` at or beyond the far CO's cable distance.
- The break less than 25 m from any span/coil boundary (the ambiguity rule).
- Unknown `testEnd`, source ID, or event type.

The loader validates the whole file before starting. Content errors are never counted as learner attempts. Briefings and hints reference source records with title, URL, section, and supported claim.

## Domain evaluation contract

```text
locate(round, options?) → { siteId, cableM: {in, out} per point, groundFromTestEndM, groundFromAM }
   options: { ignoreSlack?, fromWrongEnd?, subtractCoilContainingBreak? }   // used only to diagnose misconceptions

evaluate(round, answerSiteId) → {
  status: "correct" | "incorrect" | "invalid-input" | "content-error",
  expected: siteId | null,
  reasonCode: "correct" | "picked-non-break-event" | "wrong-end" | "ignored-slack"
            | "over-subtracted-slack" | "wrong-site" | "no-selection" | "content-error",
  evidence: { breakM, testEnd, cumulativeSlackM, boundaryCableM, groundFromAM, chosenSiteCableRangeM }
}
```

**Algorithm:**
1. Order points from the test end (mirror ground distances as `farGround − groundM` when `testEnd` is `"Z"`).
2. Walk the points accumulating slack: `in = ground + slackSoFar`, `out = in + slack`, then `slackSoFar += slack`.
3. The break `d` is in span (prev → k) if `out(prev) ≤ d < in(k)`; in manhole k's coil if `in(k) ≤ d ≤ out(k)`.
4. If the answer equals the expected site, the status is `correct`. Otherwise diagnose in this fixed order, taking the first match:
   1. `picked-non-break-event`: the answer is the site of a connector or splice event.
   2. `wrong-end`: the answer is `locate` with `fromWrongEnd`.
   3. `ignored-slack`: the answer is `locate` with `ignoreSlack`.
   4. `over-subtracted-slack`: the answer is `locate` with `subtractCoilContainingBreak`.
   5. Otherwise `wrong-site`.

- Pure function: same inputs, same result; no DOM, timer, network, random choice, or score changes.
- The UI never decides correctness by position, label, or animation destination.
- Expected answers in tests come from the hand-computed table in SPEC.md, not from calling `evaluate`.

**Feedback example:** L2R1, answer `span:MH-3~CO-Z` → `ignored-slack`, with evidence `{ breakM: 3060, cumulativeSlackM: 100, boundaryCableM: 3100, groundFromAM: 2960 }`. The text reads: *"The crew found intact cable. 3.060 km is cable length, not ground distance. Before MH-3 the cable has passed 0.100 km of stored slack, so MH-3 sits at 3.100 km of cable. The break is 40 m before MH-3. Add the slack stored before each manhole and try again."*

## Session transitions

```text
loading → team-setup (3 or 4 players) → briefing → awaiting-answer
                     ├─ no selection → guidance → awaiting-answer
                     ├─ incorrect → feedback → retry same round
                     └─ correct → feedback → Next → next round/briefing/summary
loading/content failure → error screen → retry loading
confirmed Restart → fresh team-setup
```

The state module owns team size, the role rotation index (round number modulo team size), attempts, assistance (hint level reached per round), completed round IDs, current round, and current view. Selecting a site, highlighting a trace event, and opening hints never submit an answer. Valid submissions count only while a round is unsolved. Submit is disabled after success, with a guard in the state logic as well. Advancing happens only through explicit Next. Restart requires confirmation; Cancel changes nothing.

## Interaction and visual direction

A NOC wall screen with dark slate panels and a bright cyan trace. The trace SVG is on top (dB vs km) and the street-level route SVG is below it, with manhole covers and slack coils drawn as loops. Large type so a team can read it from a projector. On submit, a vertical marker drops from the break on the trace to the route map and steps through each slack coil to show the offset. The dig truck then moves to the chosen site and shows "intact cable" or "break found". With `prefers-reduced-motion`, the final positions are shown instantly and the text appears at the same moment.

Native radio buttons for dig sites; feedback announced through an `aria-live="polite"` region; focus moves to the feedback heading after Submit and to the briefing heading after Next. The role card for the current round is shown above the challenge as text.

## Implementation order

| Slice | Deliverable | Evidence before the next slice |
| --- | --- | --- |
| 1 · Prove the rule | `rules.js` + `content.js` plus every case in SPEC.md's case table and the six-round table | All expected results pass in `tests/` |
| 2 · Complete one round | L2R1 briefing, trace + table, map + table, selector, feedback, retry, Next | One correct and one `ignored-slack` path work in the browser |
| 3 · Add the curriculum | All six rounds, team setup and role rotation, hints, level and session summary | Each round agrees with its hand-checked row |
| 4 · Make it usable | Keyboard/focus, reduced motion, narrow layout, projector readability, error states, SVG icons | Manual checks recorded |
| 5 · Package the result | README, screenshot, optional GitHub Pages / Arcade | Another attendee can run and explain the game |

Generate `tasks.md` from these slices and the actual acceptance criteria. Do not create tasks for stretch features (PvP, persistence, networked play).

## Verification and reporting

A dependency-free browser test runner at `tests/index.html` imports the pure modules, runs all assertions, and shows totals plus failed case IDs. It reports zero discovered tests as a failure. Open **http://127.0.0.1:8000/tests/** after starting the same server.

| Check | What must be established |
| --- | --- |
| Domain cases | All six rounds' correct sites and listed reason codes; L3R1 boundary; L3R2 far end |
| Input/content failures | No selection doesn't consume attempts; the 3090 m ambiguity case and other malformed data cannot be graded |
| State transitions | Retry, hints, duplicate submission, level completion, final summary, restart/cancel, role rotation for 3 and 4 players |
| Source review | Each briefing and explanation agrees with the cited OTDR and slack references |
| Browser playthrough | Fresh start to summary, keyboard-only core actions, readable feedback |
| Layout/motion | Typical laptop, projector, narrow viewport, reduced motion |
| Hosting, if used | Assets and data load under the published repository path |

For each required acceptance criterion, record **pass / fail / not run**, the date, environment, and evidence in the README. The test runner checks code behavior; a human still reviews the teaching content and the actual interaction.

## Scope controls

No persistence, networked multiplayer, PvP, runtime AI, procedural scenario generator, editor, or audio in v1. If time runs short, cut Level 3 first (keep L1 and L2, update AC7 and the content table), then animation. Never cut the slack math or the feedback. Do not hide skipped checks or silently weaken correctness.
