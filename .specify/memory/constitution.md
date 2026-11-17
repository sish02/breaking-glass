# Breaking Glass Constitution

**Purpose:** help general networking students and new field technicians practice locating a fiber
cut from an OTDR trace by reading the trace, converting optical (cable) distance to a place on the
route map, and dispatching the dig crew to the correct span or manhole.

**Name:** the fiber route the team restores is the fictional "Albuquerque route". The game MUST NOT depict,
describe, or include an image of any real person or real network.

**First release budget:** one core mechanic, three short levels of two rounds each, a browser, and a
60-minute workshop build, played co-operatively by a team of 3–4 on one shared screen. This budget
changes only through the amendment procedure below.

## Core Principles

### I. Technical Truth Is a Release Requirement

- The game MUST NOT reward a technically incorrect answer.
- Grading MUST be reproducible from a documented rule and the challenge inputs alone.
- Unsupported or ambiguous content is an authoring error: the game MUST show that the challenge is
  unavailable and MUST NOT grade it.
- **Model taught:** a single-mode fiber route tested with an OTDR from one central office (the test
  end). The OTDR is assumed configured with the correct IOR and helix factor, so event distances are
  cable length from the instrument. The break is the event where backscatter ends and the trace
  falls to the noise floor before the expected fiber end; it may or may not be reflective. Cable
  length exceeds ground distance by the slack coils stored in manholes; the dig site is found by
  accounting for slack passed, measured from the test end.
- **Exclusions:** IOR/helix calibration errors, dead zones, ghosts, gainers, bidirectional
  averaging, macrobend diagnosis, splice-loss pass/fail, and real GIS/GPS data. Simplifications that
  affect what a player can conclude MUST appear in the briefing and README.
- The restoration story MAY illustrate a rule; it MUST NOT change it.
- **Evidence:** hand-checked correct, incorrect, and boundary cases for every shipped round; a source
  link and section for each networking rule; review of every shipped briefing and explanation.
  Expected results MUST be recorded independently of the implementation under test.

*Rationale:* a teaching game that grades wrong teaches wrong; field techs act on what it rewards.

### II. Every Round Teaches Through a Decision

- The team's main action MUST exercise the target skill: choosing the dig site from trace and route
  evidence.
- A concept MUST be introduced before it is tested, and every value needed to reason MUST be shown.
- A wrong answer MUST explain the specific mistake (e.g. chose a splice instead of the break;
  treated cable distance as ground distance) and give a useful next step. A correct answer MUST
  explain why it works, with the calculation shown.
- Learning sequence: read the trace to find the break → convert cable distance to route position
  using slack → edge cases (break inside a slack coil; test shot from the far end).
- Hints MUST reveal a method first, then a worked step. A worked solution MUST be available when a
  team is stuck and MUST be recorded as assistance, never as independent mastery.
- **Evidence:** a teammate can connect each action to a learning outcome and describe what was
  learned from a deliberately wrong choice.

*Rationale:* the decision is the lesson; feedback is where learning happens.

### III. Honest Progress and Safe Retry

- A round MUST complete only on a valid, correct submission. Incorrect answers MUST keep the
  challenge available.
- An empty submission MUST give input guidance without counting as an attempt. Repeated Submit
  actions MUST NOT award progress twice.
- Play is co-operative (PvE): one shared team submission per round. Version 1 MUST NOT include
  lives, countdowns, speed bonuses, points, or player-versus-player rankings.
- Hints and retries carry no penalty. Completed rounds, attempts, and assistance MUST be shown
  separately; completion is not proof of independent mastery.
- The specification MUST state exactly what advances a round, finishes a level, and resets a session.
- **Evidence:** wrong-answer, repeated-submit, hint, completion, and reset checks match the spec.

*Rationale:* pressure mechanics reward guessing; honest counters keep the summary meaningful.

### IV. Access Is Part of the Core Game

- All core actions MUST be usable by keyboard with visible focus, readable labels, and a logical
  order.
- Success and failure MUST be conveyed in text, not color alone.
- The OTDR trace and route map MUST each have a text equivalent (event table and route table).
- Reduced-motion preferences MUST be respected; animation MUST NOT delay feedback or controls.
- The challenge MUST be usable on a typical laptop, a projector shared by a team, and a narrow
  window. Dense data MAY scroll within its own labeled container without hiding action buttons.
- **Evidence:** keyboard-only playthrough, narrow-window check, projector-distance readability check,
  and reduced-motion check, recorded as actually performed. No claim of full certification.

*Rationale:* a team around one screen includes people who can't use a mouse or see color well.

### V. Deterministic and Self-Contained

- Version 1 MUST ship authored content and deterministic domain logic, requiring no account,
  backend, networking between players, live device connection, model, or API key.
- All art MUST be original SVG made for this project; no photographs.
- AI MAY help write code and assets during development; its output receives the same review as any
  other contribution.
- Runtime AI tutoring, generated scenarios, networked multiplayer, and PvP are stretch work and
  require an explicit amendment of this constitution, the specification, and the verification
  approach before implementation.
- **Evidence:** a clean browser session plays using only the project's static files; no external
  service decides an answer.

*Rationale:* reproducible answers and zero setup keep the workshop build verifiable.

### VI. Content and Logic Reviewed Separately

- Level content, routes, trace events, hints, sources, and difficulty MUST live in editable data.
- Domain rules MUST be separate from rendering and progress tracking.
- Data MUST be validated before a challenge is presented.
- Feedback MUST agree with the evaluator's reasoning; a hand-authored answer key MUST NOT silently
  override the rule engine.
- Adding a challenge with the existing mechanic MUST require only a data change and its checks — no
  new scoring path or screen.
- **Evidence:** inspect one round's data, trace one answer through the evaluator, and add a trial
  challenge without modifying the rule engine.

*Rationale:* reviewers can check networking facts without reading code, and vice versa.

### VII. Done Is Demonstrated

- Only the agreed scope ships. Requirements, plan, tasks, and README MUST describe the same game.
- A feature is complete only when its acceptance criteria pass and its actual status is recorded. A
  screenshot, a checked task box, or an agent saying "done" is insufficient by itself.
- When time is short, scope MUST be reduced explicitly. Incorrect teaching and broken core
  interactions MUST be fixed before visual effects are added. Failed and untested checks MUST stay
  visible.
- **Evidence:** reproducible run/test commands, recorded verification results, a fresh-start
  playthrough, and a README another attendee can follow.

*Rationale:* the workshop deliverable is evidence, not a claim.

## Scope and Content Constraints

- Stack: static HTML, CSS, and native JavaScript modules served over HTTP; no backend.
- Content: three levels × two rounds; one break per round; distances authored in integer metres.
- A break closer than 25 m to any span or slack-coil boundary is an authoring error (Principle I).
- No collection of player names or personal data; roles are labelled Player 1–4.
- Stretch features (persistence across reloads, networked play, PvP, runtime AI, editor, audio) are
  out of scope for version 1.

## Development Workflow and Quality Gates

- Workflow: constitution → specify → clarify → plan → tasks → analyze → implement.
- Unresolved questions that could change grading, progression, or scope MUST be resolved in clarify
  before planning.
- Analyze findings that touch accuracy, scope, or this constitution MUST be resolved before
  implement.
- Implementation order: prove the rule with tests → complete one round → add curriculum → make it
  usable → package. Each slice's evidence MUST pass before the next begins.
- The browser test runner MUST report zero discovered tests as failure.

## Governance

- This constitution supersedes other project practices. Spec, plan, tasks, and README MUST comply.
- Amendments: record the reason, update the affected spec and plan, bump the version, and rerun
  analysis. A conflict is resolved openly; the build agent MUST NOT weaken a principle merely to
  make an implementation pass.
- Versioning: MAJOR for removed or redefined principles; MINOR for new principles or materially
  expanded guidance; PATCH for clarifications and wording.
- Compliance review: every analyze run and every pre-demo review checks the artifacts against
  Principles I–VII and records pass, fail, or not run.
- `StarterKit/CONSTITUTION.md` is the team-authored input; this file is the working constitution.

**Version**: 1.0.2 | **Ratified**: 2026-11-17 | **Last Amended**: 2026-11-17

*1.0.1 (PATCH): game renamed to Breaking Glass; no principle changed.*
*1.0.2 (PATCH): route renamed to the Albuquerque route; no principle changed.*
