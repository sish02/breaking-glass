# Feature Specification: Breaking Glass — co-op OTDR fiber-cut locator (first playable)

**Feature Branch**: `001-breaking-glass-otdr` (no branch created; work is on `main`)

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "Read StarterKit/Spec.md" — the team-authored input at
`StarterKit/SPEC.md`, governed by `.specify/memory/constitution.md` v1.0.0.

## Overview

A team of 3–4 fiber restoration technicians shares one screen. Each round shows an OTDR trace and a
route map of the fictional "Albuquerque" fiber route. The team decides
where the cut is and dispatches the dig crew to one span or one manhole. A correct dispatch shows the
crew finding the break, with the distance reasoning. An incorrect dispatch shows the crew finding
intact cable and explains the specific mistake. The session ends when all six rounds are solved and
the session summary is shown.

**Learners:** general networking students and new outside-plant or field technicians. No prior knowledge is
assumed; briefings teach what is needed. First team playthrough target: 10–15 minutes, with
unlimited thinking time.

## Clarifications

### Session 2026-11-17

- Q: Should the team only pick the dig site, or also mark the break on the trace as a graded step? → A: Dig site only is graded; clicking a trace event only highlights it for discussion.
- Q: If any round fails validation, should the whole game refuse to start or only that round be unavailable? → A: Validate all content at load; if any round is invalid, show an error screen naming every invalid round and do not start the game.
- Q: When can the team open each help step? → A: Any time, strictly in order (method → worked step → full solution), each step needing its own request; nothing waits on a wrong attempt.
- Q: Should role cards follow a fixed rotation or be reassignable by the team? → A: Fixed rotation, display only: in session round r (0–5), Player p gets role (p − 1 + r) mod N from [OTDR Reader, Route Mapper, Dispatcher, Safety Lead].

### Session 2026-11-17 (redesign after first playable)

- Q: The first playable felt like a worksheet. How should the dig site be chosen? → A: Click the street map directly; each span and manhole is a clickable (and keyboard-focusable) zone. Clicking digs (select + submit in one action).
- Q: How much animation? → A: "Fire OTDR": a light pulse runs out along the trace, the trace draws itself, and the echo returns from the break; after a dig, the truck drives to the spot and digs, with a hit or miss effect. The pulse is drawn on the trace only, never on the street, so it does not reveal the dig site.
- Q: What should be simplified? → A: Short briefings: 2–3 sentences plus an animated mini demo built from the worked example; the full text, simplifications and sources sit under "More detail". Tables, role cards and the three help steps are kept.
- Q: What should it look like? → A: An arcade game: dark neon "cabinet" screens, chunky buttons, PRESS START, an arcade HUD (level, cuts found, digs, help used), hit and miss effects. Constitution III still applies: the HUD shows no points, lives, timers or rankings, and there is no sound in v1.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Locate a cut and understand the result (Priority: P1)

The team reads the briefing, inspects the OTDR trace and the route map, discusses, selects one dig
site, and submits. The game tells them whether the crew found the break and explains why, showing the
break distance, the slack already passed, and where the break lies along the street. After a wrong
answer they can try again; after a correct answer they move on.

**Why this priority**: This is the whole teaching loop. Without it there is no game. One round of it
already teaches the core misconception (cable distance is not street distance).

**Independent Test**: Play Level 2 Round 1 alone: submit the plausible wrong site, read the feedback,
then submit the correct site and advance.

**Acceptance Scenarios**:

1. **Given** a fresh session, **When** the team starts, **Then** they see team setup (choose 3 or 4
   players) and then the first briefing before any challenge.
2. **Given** Level 2 Round 1 (break at 3.060 km, test end CO-A, manholes every 1.000 km each storing
   0.050 km slack), **When** the team submits span MH-2 → MH-3, **Then** the round is marked solved and
   the explanation shows 0.100 km of slack passed before MH-3, MH-3 at 3.100 km of cable, and the break
   at 2.960 km along the route (40 m short of MH-3).
3. **Given** that round, **When** the team submits span MH-3 → CO-Z, **Then** the feedback names the
   mistake "treated cable distance as ground distance (ignored slack)", shows the numbers, the round
   stays unsolved, and the team can retry.
4. **Given** any round with no dig site selected, **When** the team submits, **Then** guidance asks
   them to choose a site, and neither the attempt count nor completion changes.
5. **Given** Level 1 Round 2 (reflective connector at 1.500 km, non-reflective end of fiber at
   4.250 km), **When** the team submits MH-1, **Then** the feedback explains that backscatter continues
   after 1.500 km, so that spike is a connector, not the break.

---

### User Story 2 - Get help, see progress, and finish the session (Priority: P1)

When stuck, the team can ask for help in steps: a method hint, then a worked step, then a full
solution. They always see which rounds they've solved, how many valid attempts they made, and how
much help they used. Finishing both rounds of a level completes it. Finishing all three levels opens
a session summary. The team can restart, with a confirmation step.

**Why this priority**: The constitution requires honest progress and safe retry. Without help,
learners who are stuck abandon the game; without a summary, nobody can tell mastery from assistance.

**Independent Test**: Use all three help steps on one round, submit twice after solving, complete a
level, then restart and cancel, then restart and confirm.

**Acceptance Scenarios**:

1. **Given** an unsolved round, **When** the team opens help, **Then** the first step explains the
   method only. Further requests reveal a worked step and then the full solution. Each step reached is
   recorded as assistance, and the round is not marked solved.
2. **Given** an unsolved round, **When** the team makes valid submissions, **Then** each counts as one
   attempt. **Given** a solved round, **When** Submit is pressed again, **Then** nothing changes.
3. **Given** both rounds of a level are solved, **When** the team presses Next, **Then** the next
   level's briefing opens; after the final round, the session summary opens and shows completed rounds,
   attempts, and assistance for each round.
4. **Given** progress exists, **When** the team chooses Restart and confirms, **Then** the session
   clears and returns to team setup. **When** they cancel instead, **Then** nothing changes.

---

### User Story 3 - Play as a co-op team around one screen (Priority: P2)

At setup the team chooses 3 or 4 players. Each round, rotating role cards (Player 1–4) suggest who
reads the trace (OTDR Reader), who works out slack and direction (Route Mapper), who selects and
submits (Dispatcher), and, with 4 players, who manages hints and reads explanations aloud (Safety
Lead).

**Why this priority**: It turns a solo quiz into the team experience the workshop wants. The core
loop still works without it, so it ranks below the P1 stories.

**Independent Test**: Start with 3 players, then with 4, advance through four rounds, and confirm the
roles rotate as specified and the Safety Lead appears only with 4 players.

**Acceptance Scenarios**:

1. **Given** team setup, **When** the team chooses 3 players, **Then** L1R1 shows Player 1 as OTDR
   Reader, Player 2 as Route Mapper, and Player 3 as Dispatcher. L1R2 shows Player 1 as Route
   Mapper, Player 2 as Dispatcher, and Player 3 as OTDR Reader (FR-019).
2. **Given** 4 players, **When** a round starts, **Then** a fourth role, Safety Lead, is also shown, and the
   rotation cycles through all four players.
3. **Given** any team size, **When** any player uses the controls, **Then** the game accepts the
   action. Roles are guidance only, and no individual player is tracked or scored.

---

### User Story 4 - Play with keyboard, projector, and reduced motion (Priority: P2)

A keyboard user can inspect the challenge, choose a dig site, submit, get help, advance, and restart
without a mouse. The trace and route map each have a text table with every value. Text is large
enough to read from a projector. Feedback is in text (not color alone), stays on screen, and is
announced to assistive technology. With reduced motion, the dispatch effect is skipped without losing
information.

**Why this priority**: Required by Constitution Principle IV. It ranks P2 only in build order:
the P1 loop has to exist first. It is still required for release.

**Independent Test**: Complete one full level using only the keyboard, with reduced motion enabled, in
a narrow browser window.

**Acceptance Scenarios**:

1. **Given** any screen, **When** the user presses Tab, **Then** focus is visible and reaches every
   core control in a logical order, each with an understandable name.
2. **Given** a submission, **When** feedback appears, **Then** it is text, remains readable until the
   next action, and is announced to assistive technology.
3. **Given** reduced-motion preference, **When** the team dispatches, **Then** the result appears
   immediately with the same information.
4. **Given** a narrow window, **When** a round is shown, **Then** the trace and route data may scroll
   within their own labeled areas while the dig-site choices and Submit stay reachable.

---

### Edge Cases

- **Break inside a slack coil (L3R1):** break at 2.075 km falls within MH-2's coil (2.050–2.100 km of
  cable). The correct site is MH-2 itself, not a span. Choosing span MH-1 → MH-2 is diagnosed as
  "subtracted slack the cable had not yet passed".
- **Test from the far end (L3R2):** the OTDR is at CO-Z. Measuring from CO-A instead lands in span
  MH-1 → MH-2 and is diagnosed as "measured from the wrong end".
- **Ambiguous authored content:** a break less than 25 m from any span or coil boundary (e.g. 3.090 km
  on the L2R1 route, 10 m from 3.100 km) is an authoring error. The load-time check reports it, and the
  game does not start (FR-021).
- **Malformed content:** missing values, duplicate IDs, more or fewer than one break, events after
  the break, or a break beyond the route's end. The load-time error screen lists every broken round
  and its problem, and the game does not start.
- **No selection:** guidance is shown and the attempt count is unchanged.
- **Repeated Submit after success:** no change in attempts or completion.
- **Reload mid-session:** a new session starts at team setup; no progress is kept.
- **Content fails to load:** an error screen explains the problem and offers to try again.

## Requirements *(mandatory)*

### Functional Requirements

**Session and flow**

- **FR-001**: The game MUST start with team setup (choose 3 or 4 players), then show the Level 1
  briefing before any challenge.
- **FR-002**: Each level MUST open with a short briefing: a 2–3 sentence summary and an animated mini
  demo of the level's worked example (which differs from that level's rounds). The full concept
  text, the worked example in words, the simplifications and the sources MUST be available on the
  same screen under "More detail".
- **FR-003**: Rounds MUST be played in order on a first playthrough: three levels of two rounds
  each, six in total.
- **FR-004**: The game MUST advance only through an explicit Next action after a correct
  submission; the final round's Next MUST open the session summary.
- **FR-005**: Restart MUST ask for confirmation. Confirming clears the session and returns to team
  setup; cancelling changes nothing.
- **FR-006**: Progress MUST last only for the current page session; reloading starts a new session.

**Challenge presentation**

- **FR-007**: Each round MUST start with an empty trace and a **Fire OTDR** control. Firing draws the
  trace (animated, unless reduced motion is requested) and reveals an event table listing every
  event's distance (km, 3 decimals), its type (launch, connector, splice, or end of fiber), and
  whether it is reflective. The pulse animation MUST stay on the trace and MUST NOT indicate any
  position on the street map.
- **FR-008**: Each round MUST show the route map together with a route table listing every point
  (CO-A, manholes, CO-Z), its ground distance from CO-A, and the slack stored at each manhole.
  Cumulative slack (the running total) MUST NOT be shown before the round is solved or the full
  solution is opened, because adding it up is the skill being practised. (This deliberately
  overrides the StarterKit input's "cumulative-slack column always visible"; decided in
  /speckit-analyze remediation, 2026-11-17.)
- **FR-009**: Each round MUST state clearly which CO the OTDR is connected to (the test end).
- **FR-010**: The dig sites MUST be the street map itself: every span and every manhole is a
  clickable zone, reachable by keyboard in route order (CO-A → CO-Z) and activated with Enter or
  Space. Zones MUST NOT be filtered, reordered, or styled in a way that reveals the answer. Digging
  is possible only after the OTDR has been fired. Clicking a zone digs there (selects and submits
  in one action); each miss stays marked on the street for that round.
- **FR-010a**: The dig site MUST be the only graded answer. Selecting a trace event MAY highlight it
  (and its row in the event table) for discussion, but MUST NOT submit, grade, or count as an
  attempt or assistance.

**Grading and feedback**

- **FR-011**: The correct dig site MUST be computed from the round's data by the documented rule:
  find the break (the end-of-fiber event), measure from the test end, and add the slack of each
  manhole passed. The break is in the span between two points when it falls between leaving the
  first and entering the next. It is in a manhole when it falls within that manhole's coil.
- **FR-012**: A correct submission MUST mark the round solved exactly once and show the break
  distance, the slack passed, the cable distance at the nearest boundary, and the break's position
  along the route from CO-A to the metre. That position MUST be labelled as the model value, with a
  reminder that real OTDR distances are only accurate to about ±2% and crews confirm in the field.
- **FR-013**: An incorrect submission MUST keep the round unsolved and give feedback that names the
  first matching mistake, checked in this order:
  (1) chose the site of a connector or splice instead of the break;
  (2) measured from the wrong end;
  (3) ignored slack (treated cable distance as ground distance);
  (4) subtracted slack the cable had not yet passed;
  (5) otherwise, a general wrong site, showing where that site sits compared with the break.
- **FR-014**: Feedback MUST agree with the grading rule; no hand-written answer key may override it.
- **FR-015**: Submitting with no site selected MUST show guidance and MUST NOT count as an attempt.

**Help and progress**

- **FR-016**: Each round MUST offer three help steps, opened strictly in order (method → worked step →
  full solution), one step per explicit request. Help MUST be available at any time while the round
  is unsolved, with no wrong attempt required. The furthest step reached (0–3) MUST be recorded as
  assistance for that round. Opening help MUST NOT select a dig site or submit an answer.
- **FR-017**: The game MUST count valid submissions per round only while the round is unsolved.
- **FR-018**: The game MUST show completed rounds, attempts, and assistance as separate counts, per
  level (a level recap shown when a level's second round is solved, before Next) and in the
  session summary (grouped by level, with totals). There are no points, lives, timers, streaks, or rankings.

**Team play**

- **FR-019**: Each round MUST show role cards for Players 1–N (N = 3 or 4), using the role list
  [OTDR Reader, Route Mapper, Dispatcher, Safety Lead] with only the first N roles used. In session
  round r (0 for L1R1 through 5 for L3R2), Player p MUST be shown role index (p − 1 + r) mod N. There
  are no controls to reassign roles.
- **FR-020**: The game MUST NOT collect player names or any personal data, and MUST NOT enforce
  roles or track individual players.

**Content integrity**

- **FR-021**: All content MUST be checked once at load, before team setup. A round is invalid if it
  has missing or invalid values, duplicate IDs, other than exactly one break, events after the
  break, a break at or beyond the route's cable end, or a break less than 25 m from a span or coil
  boundary. If any round is invalid, the game MUST show an error screen naming every invalid round
  and its problem, MUST NOT start, and MUST NOT grade anything. No partial session is offered.
- **FR-022**: Adding a new round that uses the same mechanic MUST require only new content, not
  new grading or screen behavior.
- **FR-023**: Each level MUST cite its supporting references (title, link, section, claim) in its
  briefing.

**Access**

- **FR-024**: Every core action MUST be possible by keyboard, with visible focus and understandable
  control names.
- **FR-025**: Results MUST be conveyed in text as well as color, remain readable, and be announced to
  assistive technology.
- **FR-026**: With reduced motion requested, the game MUST skip motion effects (pulse, trace drawing,
  truck, dig effects, briefing demo) without delaying or removing information. Feedback text MUST
  appear immediately on a dig and never wait for the truck animation.
- **FR-027**: Content MUST be readable on a typical laptop, from a projector, and in a narrow window.
  Dense data scrolls in its own labeled area without hiding the action controls.
- **FR-028**: All art MUST be original illustration; no photographs, and no depiction of any real
  person.
- **FR-029**: The presentation MUST use an arcade style (dark neon screens, HUD, hit/miss effects).
  The HUD MUST show only level/round, cuts found, digs this round and help used, never points,
  lives, timers or rankings. Effects MUST respect reduced motion, and text MUST stay readable from a
  projector (body ≥ 18 px).

### Version-one content

OTDR at CO-A unless stated otherwise. Distances in km along the route (ground) unless marked as
cable. Expected answers were computed by hand from FR-011 and must be re-checked by a teammate.

| Round | Route (ground) and slack | Trace events (cable) | Correct site | Plausible wrong → diagnosed mistake |
| --- | --- | --- | --- | --- |
| L1R1 | CO-A 0, MH-1 2.000, MH-2 5.000, MH-3 9.000, CO-Z 12.000; no slack | launch 0.000; splice 5.000 (0.08 dB); reflective end 7.400 | Span MH-2 → MH-3 (2.400 past MH-2) | MH-2 → chose a splice |
| L1R2 | CO-A 0, MH-1 1.500, MH-2 3.500, MH-3 6.000, CO-Z 8.000; no slack | launch 0.000; reflective connector 1.500 (0.5 dB); non-reflective end 4.250 | Span MH-2 → MH-3 (0.750 past MH-2) | MH-1 → chose a connector |
| L2R1 | CO-A 0, MH-1 1.000, MH-2 2.000, MH-3 3.000, CO-Z 4.000; 0.050 each | launch 0.000; end 3.060 | Span MH-2 → MH-3 (ground 2.960) | Span MH-3 → CO-Z → ignored slack |
| L2R2 | CO-A 0, MH-1 0.800, MH-2 1.900, MH-3 2.600, MH-4 3.700, CO-Z 5.000; slack 0.030 / 0.100 / 0.030 / 0.100 | launch 0.000; end 2.700 | Span MH-2 → MH-3 (ground 2.570) | Span MH-3 → MH-4 → ignored slack |
| L3R1 | As L2R1 | launch 0.000; end 2.075 | **MH-2** (coil 2.050–2.100 cable) | Span MH-2 → MH-3 → ignored slack; span MH-1 → MH-2 → subtracted slack not yet passed |
| L3R2 | CO-A 0, MH-1 1.200, MH-2 2.500, MH-3 4.000, CO-Z 5.500; 0.040 each; **OTDR at CO-Z** | launch 0.000 (at CO-Z); end 2.300 | Span MH-2 → MH-3 (ground 3.240 from CO-A) | Span MH-1 → MH-2 → measured from wrong end |

| Level | Concept | Misconception exposed |
| --- | --- | --- |
| 1 · Read the trace | The break is where backscatter ends; connectors and splices are not the break | "The biggest spike or step is the cut" |
| 2 · Mind the slack | OTDR distance includes slack coiled in manholes | "OTDR distance = distance along the street" |
| 3 · Edge cases | A break inside a coil; a test shot from the far end | "It's always in a span" / "always measure from CO-A" |

### Key Entities

- **Route**: the Albuquerque fiber path from CO-A to CO-Z; an ordered list of points.
- **Route point**: a CO or a manhole, with its ground distance from CO-A; a manhole also has its
  stored slack length.
- **Trace event**: something the OTDR shows at a cable distance: launch, connector, splice, or end of
  fiber (the break). It is reflective or non-reflective and may have a loss value.
- **Round**: one challenge: a route, a test end, trace events, three help steps, and references.
- **Level**: a briefing with a worked example, a learning outcome, references, and two rounds.
- **Dig site**: what the team chooses: one span (between two adjacent points) or one manhole.
- **Diagnosis**: the result of grading. It is correct, incorrect with a named mistake, input
  guidance, or a content error, together with the values used to explain it.
- **Session**: team size, current round, per-round attempts, assistance reached, and solved rounds.
- **Reference**: title, link, section, and the claim it supports.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For all 6 rounds, the correct site and every listed plausible-wrong diagnosis
  match the hand-checked content table (100%, 0 mismatches).
- **SC-002**: A team new to the game completes all six rounds and reaches the summary in 15 minutes
  or less, without outside coaching.
- **SC-003**: After making a deliberately wrong choice, a player can state in one sentence what the
  mistake was (e.g. "we forgot the slack"), in at least 4 of 5 observed attempts.
- **SC-004**: A keyboard-only player completes at least one full level with no mouse use.
- **SC-005**: Repeated Submit, no-selection submits, and help use never change the solved count;
  observed counts match the specification in 100% of scripted checks.
- **SC-006**: The ambiguous (3.090 km) and malformed content cases stop the game at load in 100% of
  checks, with every invalid round named and no session started.
- **SC-007**: All values a team needs to decide (break distance, test end, every ground distance and
  slack) are readable from about 3 m from a projected screen, as confirmed by one observed check.
- **SC-008**: A trial seventh round can be added and played by changing content only.

## Assumptions

- The OTDR's IOR and helix factor are set correctly, so displayed event distances are cable length.
  Calibration errors, dead zones, ghosts, gainers, bidirectional averaging, macrobends, loss
  budgets, multiple faults, and GIS mapping are out of scope; briefings state this.
- Each round has exactly one break, and no events appear after it. Slack is stored only as coils in
  manholes, not at the COs.
- Distances are authored to the metre, and the model treats them as exact. Measurement uncertainty
  is NOT modelled. Real OTDR distances carry about ±2% uncertainty (FOA restoration guide), which is
  more than the gaps in some rounds. The 25 m margin only prevents authoring ties, and the briefings
  MUST say that in the field a crew confirms the location against records and the adjacent manholes.
  (Corrected during /speckit-plan source review, 2026-11-17.)
- Illustrative trace values: 1550 nm, about 0.20 dB/km. They are used for drawing only, not for grading.
- Play is co-operative on one shared device (PvE). Networked multiplayer, PvP, persistence across
  reloads, runtime AI, an editor, and audio are out of scope for version 1.
- References: Fiber Optic Association OTDR testing and outside-plant restoration pages, and ITU-T
  G.650.1. Exact sections are confirmed during source review before release.
- No account, internet service, model, or key is needed to play.
