# Phase 0 Research: Breaking Glass

**Feature**: [spec.md](spec.md) · **Plan**: [plan.md](plan.md) · **Date**: 2026-11-17

The Technical Context had no NEEDS CLARIFICATION items; the stack was fixed by the constitution and
`StarterKit/PLAN.md`. Research covered best-practice choices and a source check of the networking
claims (Principle I).

## R1 · Runtime stack

- **Decision**: Semantic HTML5, CSS, and native ES modules. No framework, bundler, or runtime
  dependency. Static files served over HTTP.
- **Rationale**: Principle V (self-contained, deterministic); the 60-minute build budget; GitHub
  Pages compatibility; nothing to install for players.
- **Alternatives considered**: a small framework (adds a build step and dependency review for no
  teaching benefit); Three.js like the PerHopWorks example (rejected, because a 2-D trace and route map
  teach this concept better, and 3-D needs an accessible alternative anyway).

## R2 · Test strategy

- **Decision**: Pure modules (`engine/*`) are tested by shared ES-module test files that run in two
  places: the required browser runner `tests/index.html`, and a Node runner `tests/run.mjs` (Node 22
  is available) for agent and CI checks. Expected values live in `tests/cases.js`, transcribed by
  hand from the spec's content table, never computed by the evaluator. Both runners treat zero
  discovered tests as failure.
- **Rationale**: the constitution requires the browser runner. A Node runner lets the build agent
  run real checks without a browser (Principle VII: evidence, not claims).
- **Alternatives considered**: a browser runner only (the agent couldn't verify it during
  implement); a test framework such as Vitest (adds a dependency and installation).

## R3 · Trace and map rendering

- **Decision**: Inline SVG generated from round data. Trace: y = dB and x = distance from the test
  end. The level falls at the illustrative attenuation; a connector is a spike plus a small step; a
  splice is a small step; the end of fiber is an optional reflective spike, then a drop to a flat,
  jittered noise floor (seeded from the round ID, so it is deterministic). The route map is always
  drawn CO-A on the left to CO-Z on the right, with the OTDR icon at the test end and slack coils
  drawn as loops at manholes. Each SVG has a visible text table (event table, route table) and
  `role="img"` with a short label.
- **Rationale**: Principle IV (text equivalents); Principle VI (no hand-drawn per-round art);
  deterministic output.
- **Alternatives considered**: canvas (no built-in accessibility tree); pre-drawn images per round
  (breaks the "data change only" rule).

## R4 · Units

- **Decision**: All distances are integer metres in data and logic; formatted for display as km to
  3 decimals (`3060` → `3.060 km`), and differences as metres (`40 m`).
- **Rationale**: avoids floating-point boundary errors (for example L3R1, which is exactly 25 m from
  each coil edge).

## R5 · Grading algorithm and diagnosis order

- **Decision**: As in FR-011/FR-013 and [contracts/engine-api.md](contracts/engine-api.md). Points
  are ordered from the test end and slack is accumulated: `in = ground + slackBefore`,
  `out = in + slack`. Span if `out(prev) ≤ d < in(k)`; manhole if `in(k) ≤ d ≤ out(k)`. Wrong answers
  are diagnosed by re-running `locate` with deliberate mistakes, in this fixed order:
  non-break event site → wrong end → ignore slack → subtract the coil containing the break → general.
- **Rationale**: Principle VI (feedback comes from the evaluator's reasoning, not an answer key).
  Hand-checking all six rounds shows each listed plausible-wrong answer maps to the intended code,
  and no diagnostic collides with the correct site in a way that changes the result (correct is
  checked first).

## R6 · Ambiguity margin and measurement uncertainty *(contradiction resolved)*

- **Finding**: FOA's restoration guide says OTDR data is "~ +/-2%" accurate. The spec's original
  assumption, that the 25 m margin covers unmodelled uncertainty, was therefore false. In L2R1 the
  break is 40 m from MH-3, while ±2% of 3.06 km is about ±61 m.
- **Decision**: Keep the 25 m margin purely as an **authoring tie-breaker**. The model treats
  distances as exact, and this is now stated openly in spec Assumptions (updated). The Level 2 and
  Level 3 briefings and the README MUST state: "Real OTDR distances are only accurate to about ±2%.
  In the field, crews confirm against records and check the nearest manholes." Feedback MUST NOT
  claim field-level precision.
- **Alternatives considered**: widening the margin to 2% (most of the slack-teaching rounds would
  become invalid, losing the core lesson); modelling uncertainty as a range of acceptable sites
  (more complex, and it weakens the single-answer rule; recorded as a candidate next step).

## R7 · Accessibility and team-screen readability

- **Decision**: Dig sites are a native radio group inside a `<fieldset>` with a legend. Submit, Help,
  Next, and Restart are native buttons. Feedback goes to an `aria-live="polite"` region, and focus
  moves to the feedback heading after Submit and to the briefing heading after Next. Restart uses a
  native `<dialog>`. Reduced motion (`prefers-reduced-motion: reduce`) skips the drop-marker and truck
  animation and shows final positions at once. Base font is ≥ 18 px, and the key values (break
  distance, test end) are ≥ 24 px. Colour is never the only signal (✔/✖ text, "Break found" or
  "Intact cable").
- **Rationale**: Principle IV; SC-004; SC-007.

## R8 · Serving

- **Decision**: `python3 -m http.server 8000 --bind 127.0.0.1` from the repository root. The local
  Python 3.9.6 is sufficient. `file://` is unsupported (modules and JSON fetch).

## R9 · Sources (verified 2026-11-17)

| ID | Source | Section | Supports | Status |
| --- | --- | --- | --- | --- |
| foa-otdr | FOA, "The FOA Reference For Fiber Optics – OTDRs", https://www.thefoa.org/tech/ref/testing/OTDR/OTDR.html | "How Does an OTDR Work?"; "Information in the OTDR Trace"; "Index of Refraction" | An OTDR sends pulses and displays backscatter along the fiber; connectors and mechanical splices show reflective peaks; fusion-splice loss is small; IOR calibrates distance; cable has ~1% excess fiber | Verified |
| foa-otdr-faq | FOA, "OTDR FAQs", https://www.thefoa.org/tech/ref/testing/OTDR/OTDR-FAQS.html | "Systematic Errors"; "…Big Reflections From The End Of The Cable But Sometimes … None At All"; "…Troubleshooting A Break In A Long Cable Run…"; "Finding Cable Kinks…" | An OTDR measures fiber length, not cable length; a break may or may not reflect; correct break distance using design/test records; a fusion splice has no reflection | Verified |
| foa-restoration | FOA, "Fiber Optic Network Restoration", https://www.thefoa.org/tech/ref/restoration/rest.html | "Locating Faults"; "Designing For Non-Stop Operation As Well As Restoration"; "Mapping The Route" | An OTDR locates faults on long cables; look for the end and compare to the documented length; ~±2% accuracy; extra cable is stored in service loops; route records are needed | **Verified verbatim 2026-11-17 (T042)**: "On long cables, an OTDR must be used to locate the problem." · "OTDR data is not accurate: ~ +/-2%, but you can shoot from both ends on long runs and average" · "Look for the end, compare to the expected length from documentation to see if you have a break" (all under *Locating Faults*); "Whenever possible, store extra cable in service loops…" (*Designing For Non-Stop Operation…*); "OTDRs measure fiber length, not cable length…" (*Test Equipment*) |
| itu-g650-1 | ITU-T G.650.1 (01/24), https://www.itu.int/rec/T-REC-G.650.1 | Title page only | Standard test methods for single-mode fibre attributes | **Dropped (T042)**: the backscatter clause could not be confirmed without the full recommendation text, so it is not cited in `data/levels.json` |

**T042 teaching review (2026-11-17):** every briefing in `data/levels.json` and every explanation template in `engine/feedback.js` was checked against the rows above and the wording rules below. No worked example reuses a round's break distance (examples use 3.350, 1.530 and 0.930 km; the round breaks are 7.400, 4.250, 3.060, 2.700, 2.075 and 2.300 km). The L2 briefing labels the slack arithmetic as a model, not a quoted rule.

**Gaps stated openly (release items under Principle I):**

- No source read so far states the **slack-coil distance offset** directly. The game's slack
  arithmetic is a *derived model*: an OTDR measures fiber length (foa-otdr-faq), extra cable is
  stored in service loops (foa-restoration), and cable stored in a coil adds length without
  advancing along the route. Briefings present it as such. The verbatim FOA restoration page was re-read in T042 and has no such statement (it lists service loops in documentation and says fiber vs cable length causes uncertainty). **Still open**: find a vendor or standards source that names slack loops in fault location (for example an OTDR vendor's fault-location application note).
- "The trace continuing past an event means the fiber continues" is not stated verbatim. Feedback
  words this as a conclusion from foa-otdr ("backscattered light at any point in the fiber along its
  length"): *"backscatter continues after 1.500 km, so there is still fiber there; the spike is a
  connector."*
- The helix factor is not mentioned in the sources read. The model wording becomes "the OTDR result
  has already been corrected from fiber length to cable length (see foa-otdr-faq on correction
  factors)", and the term "helix factor" is dropped from player-facing text.

## R10 · Persistence and privacy

- **Decision**: In-memory only. Nothing is written to storage, and no names are collected (players
  are labelled Player 1–4).
- **Rationale**: FR-006 and FR-020.
