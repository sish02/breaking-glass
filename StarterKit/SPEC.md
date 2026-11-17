# Breaking Glass · First playable specification

## The pitch

**A team of 3–4 fiber restoration techs reads an OTDR trace, works out where the Albuquerque route is cut, and sends the dig crew to the right span or manhole. Each dispatch reveals why the dig site was right or wrong.**

The players are a co-op restoration crew at a shared screen in a network operations center. Each round shows an OTDR trace (with an event table) and a route map (with a route table of manholes, ground distances, and stored slack). The team picks one dig site: a span between two points, or a specific manhole. A correct dispatch shows the crew finding the break, with the full distance calculation. An incorrect dispatch shows the crew finding intact cable and explains the specific mistake. The session ends when all six rounds are solved and the session summary is shown.

## Who this is for

- **Learner:** general networking students and new outside-plant or field technicians, playing in teams of 3–4.
- **Assumed knowledge:** none beyond "fiber carries light between two offices". The first briefing teaches the basics.
- **What the briefing teaches:** what an OTDR does (sends light pulses and plots returned backscatter against distance), how to read a trace (a sloped line = fiber, a spike = reflective event such as a connector, a small step = splice, a drop to the noise floor = end of fiber), what a manhole slack coil is, and why OTDR distance is not ground distance.
- **Why interaction helps:** it exposes two common field mistakes. One is sending the crew to the biggest spike instead of the end of the fiber. The other is taking the OTDR distance as the distance along the street and digging in the wrong span.
- **Session target:** 10–15 minutes for a first team playthrough, with unlimited thinking and discussion time.

## Learning outcomes and evidence

| ID | After playing, the learner can… | The game asks them to… | Evidence of success |
| --- | --- | --- | --- |
| LO1 | Identify the fiber break on an OTDR trace and read its distance, telling it apart from connectors and splices | Dispatch to the site of the break, not to a reflective connector or splice event | Correct dig site in Level 1 rounds |
| LO2 | Convert OTDR cable distance to a route position by adding the slack stored in each manhole along the way | Dispatch to the span that contains the break after accounting for slack | Correct span in Level 2 rounds where ignoring slack gives a different span |
| LO3 | Handle edge cases: a break inside a manhole's slack coil, and a trace shot from the far-end CO | Dispatch to a manhole (not a span) when the break falls in its coil; measure from the correct end | Correct site in Level 3 rounds |

## The technical model

- **Rule being taught:** The break distance *d* is the distance of the event where backscatter ends and the trace falls to the noise floor, before the expected cable end. Measure from the CO where the OTDR is connected (the *test end*) and walk the route toward the other end. Along the way:
  - The test-end CO is at ground 0. Manhole *k* is at ground distance *gₖ* from the test end and stores slack *sₖ*.
  - Cable distance on entering manhole *k*: `inₖ = gₖ + Σ(slack of manholes before k)`. On leaving: `outₖ = inₖ + sₖ`.
  - If `outₖ₋₁ ≤ d < inₖ`, the break is in the span between the previous point and manhole *k*. The test-end CO counts as point 0 with `out₀ = 0`. The ground position is `gₖ₋₁ + (d − outₖ₋₁)`.
  - If `inₖ ≤ d ≤ outₖ`, the break is inside manhole *k*'s slack coil and the dig site is that manhole.
  - The final span (last manhole → far-end CO) uses the far CO's cable distance as its upper bound.
- **Context:** single-mode fiber, 1550 nm, illustrative attenuation 0.20 dB/km. The OTDR is assumed set with the correct IOR and helix factor, so displayed distances are cable length. All distances are stored as integer metres and shown in km to 3 decimals.
- **Assumptions:** there is exactly one break per round, and the trace shows no events after it. Slack is stored only at manholes, as a coil, not at the COs. Distances are exact; the model assumes the OTDR's distance uncertainty is well inside the 25 m authoring margin below.
- **Excluded behavior:** IOR/helix calibration errors, dead zones, ghosts, gainers, bidirectional averaging, macrobends and partial damage, loss-budget pass/fail, multiple faults, and real GPS/GIS mapping.
- **Authoritative references (titles to be verified with section numbers during source review):**
  - Fiber Optic Association, *OTDR testing* reference pages (thefoa.org): trace features, reflective/non-reflective events, end of fiber.
  - Fiber Optic Association, *Restoration of outside plant cable plants*: slack/service loops and why OTDR distance differs from route distance.
  - ITU-T G.650.1, *Definitions and test methods for linear, deterministic attributes of single-mode fibre and cable*: backscatter (OTDR) method.
  - ITU-T L-series outside-plant maintenance recommendation covering fault location (identify the exact number during review).

**Ambiguity rule:** if a break is less than 25 m from any span/coil boundary, the round is an authoring error. It shows a content error and cannot be graded. Ties are never decided by the game.

## Co-op team play (one shared screen)

- The game is co-operative (PvE): the team works against the fault, not against each other. One shared submission per round.
- At the start the team picks **3 or 4 players**. Each round, the game shows role cards labelled Player 1–4, rotating every round:
  - **OTDR Reader:** finds the break event and reads its distance.
  - **Route Mapper:** adds up the slack and works out the direction.
  - **Dispatcher:** selects the dig site and presses Submit.
  - **Safety Lead** (4th player): manages hints and reads the explanation aloud.
- Roles are guidance for discussion only. The game does not enforce who presses which control and does not track individual players. No names or personal data are collected.

## The repeatable game loop

1. **Brief:** introduce one concept, its terms, and a worked example different from the challenge.
2. **Inspect:** show the OTDR trace plus event table, and the route map plus route table. All distances, slack values, and the test end are visible as text.
3. **Choose:** the team selects one dig site (a span or a manhole) and explicitly submits.
4. **Explain:** show the result, the break distance, the cumulative slack, the computed ground position, and the rule that connects them.
5. **Retry or advance:** a wrong answer leaves the round playable; a correct answer enables Next.
6. **Reflect:** the level summary shows completed rounds, valid attempts, and assistance used for the team.

**Worked interaction (Level 2, round 1):** The trace shows a launch connector at 0.000 km and an end of fiber at 3.060 km. The route table lists CO-A 0.000, MH-1 1.000, MH-2 2.000, MH-3 3.000 and CO-Z 4.000 km, with 0.050 km slack stored in each manhole. The Dispatcher picks **span MH-3 → CO-Z** because 3.060 is past MH-3's 3.000. The game replies: *"The crew found intact cable. 3.060 km is cable length, not ground distance. Before MH-3 the cable has already passed two 50 m slack coils (MH-1 and MH-2), so MH-3 sits at 3.100 km of cable. The break at 3.060 km is 40 m before MH-3. Try again, adding the slack stored before each manhole."* The team then picks **span MH-2 → MH-3**, and the game confirms: *"Break found 2.960 km from CO-A, 40 m short of MH-3."*

## Required stories and acceptance criteria

### US1 · Make and understand a decision — P1

As a learner team, we want to apply the rule to visible evidence and understand the result.

- **AC1:** Given a fresh session, when we start, then we see team setup (3 or 4 players) and then the first briefing before any challenge.
- **AC2:** Given Level 2 round 1 (break 3.060 km, 50 m slack per manhole), when we submit **span MH-2 → MH-3**, then the round is marked solved and the explanation shows cumulative slack 0.100 km, MH-3 at 3.100 km of cable, and ground position 2.960 km.
- **AC3:** Given that round, when we submit **span MH-3 → CO-Z**, then the feedback identifies the misconception "treated cable distance as ground distance (ignored slack)", completion stays unchanged, and we can retry.
- **AC4:** Given no dig site selected, when we submit, then input guidance appears and attempts and completion remain unchanged.

### US2 · Learn from help and finish the game — P1

As a learner team, we want help when stuck and a clear view of our progress.

- **AC5:** The first hint explains the method; the second shows a worked step; a worked solution is available after that. Any of these is recorded as assistance without marking the round complete.
- **AC6:** Each valid submission counts as one attempt until the round is solved. A correct submission completes it once; repeated submission after success has no effect.
- **AC7:** A level completes after both of its rounds are solved. Next opens the following round or level; the final round opens a session summary.
- **AC8:** Restart asks for confirmation, then clears the current session and returns to team setup. Cancel preserves the session.

### US3 · Play with accessible controls — P1

As a keyboard user, or a team around a projector, we want to inspect, choose, submit, get help, and advance without a mouse.

- **AC9:** All core controls have visible focus and accessible names; keyboard interaction reaches every core action, including selecting a dig site.
- **AC10:** Correct and incorrect feedback includes text, stays available to read, and is announced to assistive technology. Motion can be reduced without losing information. The trace and map each have a text table equivalent.

## Version-one content

**Three levels, two rounds per level, six rounds total.** OTDR at CO-A unless stated otherwise. Distances are in km; the dig-site choices are every span and every manhole on that route.

| Level | New concept | Prerequisite | Misconception to expose |
| --- | --- | --- | --- |
| 1 · Read the trace | Break = backscatter ends; connectors and splices are not the break | None | "The biggest spike or step is the cut" |
| 2 · Mind the slack | OTDR distance includes manhole slack coils | Level 1 | "OTDR distance = distance along the street" |
| 3 · Edge cases | A break inside a coil; testing from the far end | Level 2 | "It's always in a span" / "measure from CO-A" |

| Round | Route (ground km) and slack | Trace events | Correct dig site | Plausible wrong → reason code |
| --- | --- | --- | --- | --- |
| L1R1 | CO-A 0, MH-1 2.000, MH-2 5.000, MH-3 9.000, CO-Z 12.000; no slack | 0.000 launch connector; 5.000 splice (0.08 dB, non-reflective); 7.400 reflective end of fiber | Span MH-2 → MH-3 (2.400 km past MH-2) | MH-2 → `picked-non-break-event` |
| L1R2 | CO-A 0, MH-1 1.500, MH-2 3.500, MH-3 6.000, CO-Z 8.000; no slack | 0.000 launch; 1.500 reflective connector pair (cabinet at MH-1, 0.5 dB); 4.250 non-reflective end of fiber | Span MH-2 → MH-3 (0.750 km past MH-2) | MH-1 → `picked-non-break-event` |
| L2R1 | CO-A 0, MH-1 1.000, MH-2 2.000, MH-3 3.000, CO-Z 4.000; 0.050 at each MH | 0.000 launch; 3.060 end of fiber | Span MH-2 → MH-3 (ground 2.960) | Span MH-3 → CO-Z → `ignored-slack` |
| L2R2 | CO-A 0, MH-1 0.800, MH-2 1.900, MH-3 2.600, MH-4 3.700, CO-Z 5.000; slack 0.030 / 0.100 / 0.030 / 0.100 | 0.000 launch; 2.700 end of fiber | Span MH-2 → MH-3 (ground 2.570) | Span MH-3 → MH-4 → `ignored-slack` |
| L3R1 | As L2R1 | 0.000 launch; 2.075 end of fiber | **MH-2** (coil spans 2.050–2.100 km of cable) | Span MH-2 → MH-3 → `ignored-slack`; span MH-1 → MH-2 → `over-subtracted-slack` |
| L3R2 | CO-A 0, MH-1 1.200, MH-2 2.500, MH-3 4.000, CO-Z 5.500; 0.040 at each MH; **OTDR at CO-Z** | 0.000 launch (at CO-Z); 2.300 end of fiber | Span MH-2 → MH-3 (0.760 km from MH-3 toward MH-2; ground 3.240 from CO-A) | Span MH-1 → MH-2 → `wrong-end` |

Any other wrong choice gets the generic reason `wrong-site`. The explanation shows where that site sits in cable distance compared with the break.

**Progression:** sequential on first playthrough; retry without penalty. Completion requires a correct submission in every round. Hints remain available. No points, lives, timer, leaderboard, streak, or PvP mechanic in v1.

**Session behavior:** progress is held for the current page session; reload starts again at team setup. Saving across reloads is a stretch feature and must be specified before it is added.

## Cases the implementation must satisfy

Expected results were computed by hand from the rule above (independently of any code) and must be re-checked by a teammate.

| Case | Input state | Player action | Expected result | Why / source |
| --- | --- | --- | --- | --- |
| Correct | L2R1: break 3.060, MH every 1.000 km, 0.050 slack each, test end CO-A | Submit span MH-2 → MH-3 | `correct`; in(MH-3) = 3.100; ground = 2.000 + (3.060 − 2.100) = 2.960 | Slack rule; FOA restoration reference |
| Plausible mistake | Same | Submit span MH-3 → CO-Z | `incorrect`, `ignored-slack`; explanation shows 0.100 km slack before MH-3 | Cable vs ground distance |
| Plausible mistake | L1R2: connector spike at 1.500, break 4.250 | Submit MH-1 | `incorrect`, `picked-non-break-event`; explains that the trace continues after 1.500 | Reflective event ≠ end of fiber; FOA OTDR reference |
| Boundary | L3R1: break 2.075; MH-2 coil 2.050–2.100 (exactly 25 m from each edge, allowed) | Submit MH-2 | `correct`; break is inside MH-2's slack coil | Coil rule; ≥ 25 m margin |
| Boundary mistake | Same | Submit span MH-1 → MH-2 | `incorrect`, `over-subtracted-slack` | Only slack before the break counts |
| Far end | L3R2: OTDR at CO-Z, break 2.300 | Submit span MH-1 → MH-2 | `incorrect`, `wrong-end` (that span is where 2.300 lands if measured from CO-A) | Measure from the test end |
| Invalid input | Any round, nothing selected | Submit | `invalid-input`; attempts unchanged | C3 |
| Unsupported content | L2R1 route with break at 3.090 (10 m from the 3.100 boundary) | Open round | Visible content error naming the round ID; no grading or progress | Ambiguity rule; authoring error, not learner failure |

## Experience direction

- **Visual metaphor:** a NOC wall screen. The OTDR trace (dB vs km) sits above a street-level route map with manhole covers, slack coils drawn as loops, and a dig-crew truck that drives to the dispatched site.
- **One memorable moment:** when the team dispatches, a vertical marker drops from the break point on the trace down to the route map. It shows the cable distance "unrolling" through each slack coil, so the team sees the offset between trace position and street position.
- **Always visible:** test end, break distance, every manhole's ground distance and slack, the cumulative-slack column, and the selected dig site.
- **Feedback voice:** patient and specific, like a senior tech on the radio. Name what the team chose, show the numbers, then offer the next step.
- **Layout:** challenge first, then the dig-site selector and Submit, with the explanation beside or below. Large type that reads from a projector. Technical values are never hidden behind hover.
- **Art:** original SVG icons only (OTDR, manhole, slack coil, splice closure, fiber cut, dig truck); no photographs.

## Non-goals

No user accounts, networked multiplayer, PvP scoring, backend, live infrastructure access, runtime AI, leaderboard, or level editor. No simulation of IOR or helix errors, dead zones, ghosts, gainers, loss budgets, or GIS mapping. No real person or real network is depicted. Visual polish must fit the existing mechanic.

## Open decisions for clarify

- Should the team also have to click the break event on the trace before choosing a dig site (two-step answer), or is the dig site the only graded answer? *Current draft: dig site only. Selecting a trace event highlights it but is not graded.*
- Should the explanation after a correct answer show the route position to the metre, or only the span? *Current draft: both.*
- Is a fixed role rotation (Player 1 → OTDR Reader in round 1, and so on) enough, or should teams be able to reassign roles? *Current draft: fixed rotation, display only.*

## Release evidence

Every required acceptance criterion has a recorded result. All six rounds and their explanations are checked against the references. A teammate completes the core flow using only the keyboard. The README describes implemented behavior, exact run/test commands, and any remaining limits.
