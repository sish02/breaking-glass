# Breaking Glass · Project constitution

**Purpose:** help general networking students and new field technicians practice **locating a fiber cut from an OTDR trace** through **reading the trace, converting optical distance to a place on the route map, and dispatching the dig crew to the right span or manhole**.

**Name:** the fiber route the team restores is the fictional "Albuquerque route". The game MUST NOT depict,
describe, or include an image of any real person or real network.

**First release:** one core mechanic, three short levels, two rounds per level, a browser, and a 60-minute workshop build. Played co-operatively by a team of 3–4 on one shared screen. Change this budget only by updating the agreed scope.

## C1 · Technical truth is a release requirement

The game must never reward a technically incorrect answer. Grading must be reproducible from a documented rule and the challenge inputs. Unsupported or ambiguous content is an authoring error: show an explanation that the challenge is unavailable and prevent grading it.

**Model being taught:** a single-mode fiber route tested with an OTDR from one central office (CO). The OTDR is assumed to be configured with the correct index of refraction (IOR) and helix factor, so event distances are **cable length**, measured from the instrument. The fiber break is the event at which backscatter ends and the trace falls to the noise floor before the expected end of the fiber. That break may or may not have a reflective spike. Cable length differs from ground (route) distance because of **slack coils stored in manholes**. To find the dig site, the player adds the stored slack along the route and works from the end where the OTDR was connected.

**Important exclusions:** IOR and helix-factor errors, OTDR dead zones, ghosts, gainers, bidirectional averaging, macrobend diagnosis, splice-loss pass/fail, and real GIS or GPS data. The briefing and README state these simplifications wherever they affect what the player can conclude. The fiber-restoration story may illustrate a rule; it must not change it.

**Evidence:** hand-checked correct, incorrect, and boundary cases for every shipped round. Each networking rule has a source link and section. Every shipped briefing and explanation is reviewed. Expected results are recorded independently of the implementation under test.

## C2 · Every round teaches through a decision

The team's main action must exercise the target skill: choosing the dig site from the trace and route evidence. Introduce a concept before testing it, and show every value needed to reason about the answer. A wrong answer explains the specific mistake (for example, "you chose the splice, not the break" or "you treated cable distance as ground distance") and gives a useful next step. A correct answer explains why it works, with the calculation shown.

Learning sequence: **read the trace to find the break → convert cable distance to a route position using slack → handle edge cases (a break inside a slack coil, a test shot from the far end)**. Hints reveal a method first, then a worked step. Worked solutions are available when a team is stuck; viewing one is recorded as assistance, never as independent mastery.

**Evidence:** a teammate can connect each action to a learning outcome and describe what they learned from a deliberately wrong choice.

## C3 · Progress is honest and retry is safe

A round completes only on a valid, correct submission. Incorrect answers keep the challenge available. An empty submission gives input guidance without counting as a wrong attempt. Repeated Submit actions cannot award progress twice.

The game is **co-operative (PvE)**: the team submits one shared answer per round. There are no lives, countdowns, speed bonuses, points, or player-versus-player rankings in this version. Hints and retries carry no penalty. Completed rounds, attempts, and assistance are shown separately; completion is not proof of independent mastery. The specification says exactly what advances a round, finishes a level, and resets a session.

**Evidence:** wrong-answer, repeated-submit, hint, completion, and reset checks match the specification.

## C4 · Access is part of the core game

All core actions must work by keyboard, with visible focus, readable labels, and a sensible order. Success and failure are explained in text as well as color. The OTDR trace and route map each have a text equivalent (an event table and a route table). Reduced-motion preferences are respected; animation never delays feedback or controls.

The challenge must be usable on a typical laptop, a projector shared by a team, and a narrow browser window. Dense data may scroll within its own labeled container without hiding the action buttons.

**Evidence:** a keyboard-only playthrough, a narrow-window check, a projector-distance readability check, and a reduced-motion check. Record what was actually checked; do not claim full accessibility certification.

## C5 · The first version is deterministic and self-contained

Ship authored content and deterministic domain logic. The game requires no account, backend, network connection between players, live device connection, model, or API key. AI may help write code and assets during development; its output gets the same review as any other contribution.

All art is original SVG made for this project; no photographs. Runtime AI tutoring, generated scenarios, networked multiplayer, and PvP modes are stretch work. Adding any of them requires an explicit change to the constitution, specification, and verification approach before implementation.

**Evidence:** a clean browser session can play using only the project's static files; no external service decides an answer.

## C6 · Content and logic can be reviewed separately

Level content, routes, trace events, hints, sources, and difficulty live in editable data. Domain rules are kept separate from rendering and progress tracking. Data is validated before a challenge is presented. Feedback must agree with the evaluator's reasoning; a hand-authored answer key cannot silently override the rule engine.

Adding another challenge that uses the existing mechanic must need only a data change and its checks, not a new scoring path or screen.

**Evidence:** inspect one round's data, trace one answer through the evaluator, and add a trial challenge without modifying the rule engine.

## C7 · Done is demonstrated

Ship only the agreed scope. Requirements, plan, tasks, and README must describe the same game. A feature is complete when its acceptance criteria pass and its actual status is recorded. A screenshot, a checked task box, or the agent saying "done" is not enough by itself.

When time is short, reduce scope explicitly. Fix incorrect teaching and broken core interactions before adding visual effects. Keep failed and untested checks visible.

**Evidence:** reproducible run/test commands, recorded verification results, a fresh-start playthrough, and a README another attendee can follow.

## How we change these rules

For any material change, record the reason, update the affected spec and plan, and rerun analysis. A conflict with this constitution is resolved openly; the build agent must not weaken a principle merely to make its implementation pass.
