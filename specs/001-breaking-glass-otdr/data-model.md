# Data Model: Breaking Glass

**Spec**: [spec.md](spec.md) · **Content schema**: [contracts/content-schema.md](contracts/content-schema.md)

All distances are **integer metres**. "Ground" distances are measured from CO-A. Trace event
distances are **cable** metres measured from the round's **test end**.

## Authored entities (in `data/levels.json`)

### ContentDocument

| Field | Type | Rules |
| --- | --- | --- |
| `schemaVersion` | integer | Must be `1` |
| `sources` | Source[] | ≥ 1; unique `id` |
| `levels` | Level[] | ≥ 1; unique `id`. (The shipped v1 file has exactly 3 levels / 6 rounds; that is checked by a test of `data/levels.json`, not by `validateContent`, so trial rounds stay valid — SC-008) |

### Source

| Field | Type | Rules |
| --- | --- | --- |
| `id` | string | Unique, kebab-case |
| `title`, `url`, `section`, `claim` | string | All non-empty; `url` starts with `https://` |

### Level

| Field | Type | Rules |
| --- | --- | --- |
| `id` | string | `L1`…`L3`, unique |
| `title` | string | Non-empty |
| `learningOutcome` | `"LO1" \| "LO2" \| "LO3"` | |
| `briefing` | { `paragraphs`: string[], `workedExample`: string, `limits`: string[] } | Paragraphs ≥ 1; the worked example must not reuse any round's break distance (human review check in the source-review task, not a validator rule); `limits` states the simplifications (e.g. ±2% uncertainty) |
| `sourceIds` | string[] | ≥ 1; each must exist in `sources` |
| `rounds` | Round[] | ≥ 1 (the shipped v1 file has exactly 2 per level; checked by test) |

### Round

| Field | Type | Rules |
| --- | --- | --- |
| `id` | string | `L<n>R<m>`, unique across the document |
| `title` | string | Non-empty |
| `testEnd` | `"A" \| "Z"` | Which CO the OTDR is connected to |
| `route.points` | RoutePoint[] | ≥ 3; first `CO-A` (kind `co`, ground 0); last `CO-Z` (kind `co`); manholes in between; `groundM` strictly increasing |
| `trace.wavelengthNm` | integer | Display only (1550) |
| `trace.attenuationDbPerKm` | number | > 0; display only |
| `trace.events` | TraceEvent[] | Distances strictly increasing; first is `launch` at 0; exactly one `end`, which is last |
| `hints` | [string, string, string] | Exactly 3: method, worked step, full solution |

### RoutePoint

| Field | Type | Rules |
| --- | --- | --- |
| `id` | string | `CO-A`, `CO-Z`, or `MH-<n>`; unique within the round |
| `kind` | `"co" \| "manhole"` | |
| `groundM` | integer ≥ 0 | From CO-A |
| `slackM` | integer ≥ 0 | Required for manholes (may be 0); forbidden on COs |

### TraceEvent

| Field | Type | Rules |
| --- | --- | --- |
| `id` | string | Unique within the round |
| `type` | `"launch" \| "connector" \| "splice" \| "end"` | |
| `distanceM` | integer ≥ 0 | Cable metres from the test end |
| `reflective` | boolean | `launch` and `connector` must be `true`; `splice` must be `false`; `end` either |
| `lossDb` | number ≥ 0, optional | Drawing only |

**Round-level validation (FR-021).** Every failure is reported as `{ roundId, code, message }`:

- `end-beyond-route`: the break is at or beyond the far CO's cable distance.
- `ambiguous-break`: the break is less than 25 m from any boundary value (`in`/`out` of any manhole,
  the far CO's cable distance, or 0).
- `missing-field`, `bad-type`, `duplicate-id`, `bad-route-order`, `slack-on-co`, `bad-event-order`,
  `end-count`, `event-after-end`, `unknown-source`, `bad-reflectivity`, `hint-count`.

## Derived entities (computed, never authored)

### CableModel (per round)

Points are ordered from the test end. For `testEnd = "Z"`, the ground distance from the test end is
`groundM(CO-Z) − groundM`. Walking from the test end with `slackBefore = 0`:

| Point | `inM` | `outM` |
| --- | --- | --- |
| Test-end CO | 0 | 0 |
| Manhole k | `groundFromTestEnd + slackBefore` | `inM + slackM`, then `slackBefore += slackM` |
| Far CO | `groundFromTestEnd + slackBefore` | same |

**Hand-check, L2R1 (test end A):** MH-1 1000/1050 · MH-2 2050/2100 · MH-3 3100/3150 · CO-Z 4150.

### DigSite

- `mh:<pointId>`, e.g. `mh:MH-2`.
- `span:<pointId>~<pointId>`, always written in CO-A → CO-Z order, e.g. `span:MH-2~MH-3`, even when
  the test end is Z.
- The list offered to players contains every span and every manhole, in CO-A → CO-Z order:
  `span:CO-A~MH-1, mh:MH-1, span:MH-1~MH-2, …, span:MH-n~CO-Z`.

### Location (output of `locate`)

`{ siteId, breakM, slackBeforeM, lowerCableM, upperCableM, groundFromTestEndM, groundFromAM }`

### Diagnosis (output of `evaluate`)

`{ status, expected, reasonCode, evidence }`. See [contracts/engine-api.md](contracts/engine-api.md).

## Session state (in memory only)

| Field | Type | Notes |
| --- | --- | --- |
| `phase` | `"loading" \| "content-error" \| "setup" \| "briefing" \| "round" \| "summary"` | |
| `teamSize` | `3 \| 4 \| null` | Set at setup |
| `levelIndex` | 0–2 | |
| `sessionRound` | 0–5 | Drives role rotation |
| `roundState[roundId]` | { `selectedSite`, `highlightedEvent`, `attempts`, `assistance` (0–3), `solved`, `lastDiagnosis` } | Reset on Restart |
| `restartPending` | boolean | True while the confirmation dialog is open |
| `contentErrors` | Error[] | Filled only in the `content-error` phase |

**Role for Player p (1…N) in session round r:** `ROLES[(p − 1 + r) mod N]`, where
`ROLES = [OTDR Reader, Route Mapper, Dispatcher, Safety Lead]` and N is the team size.

### State transitions

```text
loading ──valid──▶ setup ──chooseTeamSize(3|4)──▶ briefing(L1)
loading ──invalid──▶ content-error (lists every invalid round; Retry reloads)
briefing(Ln) ──start──▶ round(first round of Ln)
round ──selectSite / highlightEvent / requestHelp──▶ round      (attempts unchanged)
round ──submit, no selection──▶ round + guidance               (attempts unchanged)
round ──submit, unsolved, incorrect──▶ round                   (attempts+1, diagnosis shown)
round ──submit, unsolved, correct──▶ round(solved)             (attempts+1, solved=true)
round(solved) ──submit──▶ no change
round(solved) ──next──▶ next round in level | briefing(Ln+1) | summary
any ──requestRestart──▶ restartPending ──cancel──▶ unchanged
                                       └─confirm──▶ setup (all roundState cleared)
```

`requestHelp` increases `assistance` by 1 up to 3 while the round is unsolved, and never selects or
submits.
