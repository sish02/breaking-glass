# Quickstart & Validation Guide: Breaking Glass

Run these after `/speckit-implement`. Until then, the files below do not exist.

## Prerequisites

- Python 3 (3.9+), to serve the static files.
- Node 20+ (optional), for the command-line test runner.
- A current desktop browser.

## Run

```sh
# from the repository root
python3 -m http.server 8000 --bind 127.0.0.1
```

Open http://127.0.0.1:8000 for the game and http://127.0.0.1:8000/tests/ for the browser test
runner. On Windows use `py` in place of `python3`. Do not open `index.html` via `file://`.

## Automated checks

```sh
node tests/run.mjs
```

**Expected**: a printed total such as `N passed, 0 failed` with N > 0, and exit code 0. The browser
runner at `/tests/` shows the same totals and lists failed case IDs. **Zero tests discovered = FAIL.**

The suites cover every row of the hand-checked table in
[contracts/engine-api.md](contracts/engine-api.md), the content-validation cases in
[data-model.md](data-model.md), and the state transitions.

## Manual validation scenarios

Since the arcade redesign, "dispatch to X" means: press **FIRE OTDR**, then click X on the street (or Tab to it and press Enter).

Record each as pass, fail, or not run, with the date and browser, in the README's Verification table.

| # | Scenario | Steps | Expected |
| --- | --- | --- | --- |
| Q1 | Fresh start | Load the game | Team setup, then the L1 briefing before any challenge (FR-001) |
| Q2 | Core loop (US1) | L2R1: dispatch to span MH-3 → CO-Z, then to span MH-2 → MH-3 | First: "Intact cable" with the ignored-slack explanation, attempts 1, unsolved. Second: "Break found", 2.960 km from CO-A, 40 m short of MH-3; Next enabled |
| Q3 | Connector trap | L1R2: dispatch to MH-1 | Explains that the spike at 1.500 km is a connector and backscatter continues past it |
| Q4 | Coil edge case | L3R1: dispatch to span MH-1 → MH-2, then MH-2 | Over-subtracted-slack explanation, then solved |
| Q5 | Far end | L3R2: dispatch to span MH-1 → MH-2 | Wrong-end explanation (the OTDR is at CO-Z) |
| Q6 | No selection | Any round: press Dispatch crew with nothing chosen | Guidance; attempts unchanged |
| Q7 | Help | Request help 3× on an unsolved round | Method, worked step, solution, in order; summary shows 3 for that round; round not solved |
| Q8 | Duplicate submit | Solve a round, then try to submit again | No change (the button is disabled, and the guard also blocks it) |
| Q9 | Restart | Restart → Cancel; Restart → Restart | Cancel keeps everything; confirm returns to setup with cleared counts |
| Q10 | Roles | 3 players: compare L1R1 and L1R2; 4 players: check the Safety Lead | Matches FR-019 |
| Q11 | Content error | Temporarily change L2R1's end to 3090 in `data/levels.json` and reload; then restore it | Error screen naming L2R1 (`ambiguous-break`); the game does not start |
| Q12 | Keyboard only | Complete Level 1 with no mouse | All actions reachable; focus always visible |
| Q13 | Reduced motion | Turn on the OS reduced-motion setting and dispatch | Result appears immediately with the same text |
| Q14 | Narrow / projector | 360 px-wide window; projected or zoomed to 150% | Choices and buttons reachable; key values readable at about 3 m |
| Q15 | Fresh checkout | Clone into a new folder and follow the README only | The game runs |
| Q16 | Summary | Finish all 6 rounds | The summary is grouped by level and lists solved, attempts, and help per round with subtotals; a level recap appeared after each level's second round |
| Q18 | Fire first | Before pressing FIRE OTDR, click the street | Nothing happens; DIGS stays 0. After firing, the pulse runs on the trace only |
| Q17 | Reload | Mid-round with attempts recorded, reload the page | Back at team setup; all counts cleared (FR-006) |
