# Contract: Engine module API (pure functions)

The `engine/` modules have no DOM, timer, network, randomness, or global state. The same inputs
always give the same outputs. The UI and tests depend only on these signatures.

## `engine/content.js`

```text
validateContent(doc) → { ok: boolean, errors: Array<{ levelId?, roundId?, code, message }> }
```

Checks every rule in [../data-model.md](../data-model.md), collects **all** errors (it does not stop
at the first), and never throws on bad input.

## `engine/rules.js`

```text
listSites(round)            → Array<{ id, kind: "span"|"mh", label }>   // CO-A → CO-Z order
cableModel(round)           → Array<{ pointId, kind, groundFromTestEndM, inM, outM }> // test-end order
locate(round, opts = {})    → Location
evaluate(round, answer)     → Diagnosis
```

**`locate` options** (used only for diagnosis):

| Option | Meaning |
| --- | --- |
| `fromWrongEnd: true` | Use the opposite CO as the test end, with the same break distance |
| `ignoreSlack: true` | Treat the break distance as ground distance from the test end |
| `subtractCoilContainingBreak: true` | Ground = d − Σ slack of every manhole with `inM ≤ d` (including the coil the break is in), then place by ground |

Placing by ground: exactly at a manhole's ground → `mh:<id>`; otherwise the span containing it.

**`Location`**: `{ siteId, breakM, slackBeforeM, lowerCableM, upperCableM, groundFromTestEndM, groundFromAM }`

**`Diagnosis`**:

```text
{
  status:     "correct" | "incorrect" | "invalid-input" | "content-error",
  expected:   siteId | null,
  reasonCode: "correct" | "picked-non-break-event" | "wrong-end" | "ignored-slack"
            | "over-subtracted-slack" | "wrong-site" | "no-selection" | "content-error",
  evidence:   { breakM, testEnd, slackBeforeM, lowerCableM, upperCableM, groundFromAM,
                chosen?: { siteId, lowerCableM, upperCableM }, eventId? }
}
```

**`evaluate` order:**
1. `answer` is null, empty, or not one of `listSites(round)` → `invalid-input` / `no-selection`.
2. The round fails validation → `content-error` (a defensive guard; load-time validation normally
   prevents this).
3. `answer === locate(round).siteId` → `correct`.
4. Otherwise, the first match wins:
   1. The answer is the site of any `connector` or `splice` event (placed with the full rule) →
      `picked-non-break-event` (with `eventId`).
   2. The answer equals `locate(round, {fromWrongEnd:true}).siteId` → `wrong-end`.
   3. The answer equals `locate(round, {ignoreSlack:true}).siteId` → `ignored-slack`.
   4. The answer equals `locate(round, {subtractCoilContainingBreak:true}).siteId` →
      `over-subtracted-slack`.
   5. Otherwise → `wrong-site`.

**Hand-checked expectations** (tests transcribe these; they do not compute them):

| Round | Answer | status / reasonCode | Key evidence |
| --- | --- | --- | --- |
| L1R1 | `span:MH-2~MH-3` | correct | groundFromAM 7400 |
| L1R1 | `mh:MH-2` | picked-non-break-event | eventId = splice at 5000 |
| L1R2 | `span:MH-2~MH-3` | correct | groundFromAM 4250 |
| L1R2 | `mh:MH-1` | picked-non-break-event | eventId = connector at 1500 |
| L2R1 | `span:MH-2~MH-3` | correct | slackBefore 100; upper 3100; groundFromAM 2960 |
| L2R1 | `span:MH-3~CO-Z` | ignored-slack | |
| L2R2 | `span:MH-2~MH-3` | correct | slackBefore 130; lower 2030; upper 2730; groundFromAM 2570 |
| L2R2 | `span:MH-3~MH-4` | ignored-slack | |
| L3R1 | `mh:MH-2` | correct | lower 2050; upper 2100 |
| L3R1 | `span:MH-2~MH-3` | ignored-slack | |
| L3R1 | `span:MH-1~MH-2` | over-subtracted-slack | |
| L3R2 | `span:MH-2~MH-3` | correct | testEnd Z; lower 1540; upper 3040; groundFromAM 3240 |
| L3R2 | `span:MH-1~MH-2` | wrong-end | |
| any | `null` | invalid-input / no-selection | |
| L2R1 with break 3090 | (load) | validateContent → `ambiguous-break` for L2R1 | 10 m from 3100 |

## `engine/state.js`

```text
createSession(content)            → State (phase "setup")
reduce(state, action)             → State          // pure; returns a new object
roleFor(player, sessionRound, n)  → role name
```

Actions: `chooseTeamSize{n}`, `startLevel`, `selectSite{siteId}`, `highlightEvent{eventId}`,
`submit`, `requestHelp`, `next`, `requestRestart`, `cancelRestart`, `confirmRestart`. The
transitions are as listed in [../data-model.md](../data-model.md). `submit` calls `rules.evaluate`,
and the state module never decides correctness itself.

## `engine/feedback.js`

```text
explain(diagnosis, round) → { headline, lines: string[], tone: "success"|"retry"|"guidance"|"error" }
```

Text is assembled from the evidence values and fixed templates per `reasonCode`. The headline always
carries the result in words ("Break found", "Intact cable", "Choose a dig site first"). Wording
follows research R9: for example, "backscatter continues after 1.500 km, so there is still fiber
there". It never claims field precision.
