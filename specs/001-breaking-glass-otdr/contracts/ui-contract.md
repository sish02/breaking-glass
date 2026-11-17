# Contract: Player-facing screens and controls

What a player (or a manual tester) can rely on. Element names are the accessible names.

## Screens

| Phase | Shows | Primary controls (in tab order) |
| --- | --- | --- |
| loading | "Loading the Albuquerque route…" | none |
| content-error | Heading "Content problem"; a list of `roundId: message` for every error | **Try again** (reloads) |
| setup | Title, one-line pitch, team size choice | Radio **3 players** / **4 players**, **Start** |
| briefing | Level title, 2–3 sentence summary, animated mini demo, and under **More detail**: concept paragraphs, worked example, limits, sources | **Replay demo**, **Begin round**, More detail (disclosure) |
| round | Role cards; test-end banner; scene panel (OTDR trace, street map, feedback directly below the street); help; numbers (**Trace events** table after firing, **Route** table) | **Fire OTDR**, street zones (one per span and manhole, in route order), **Next** (enabled only when solved), **Get help**, trace event Highlight buttons, **Restart** |
| summary | Grouped by level: per round solved, attempts, help steps used (0–3); level subtotals; session totals | **Play again** (same as a confirmed restart) |

## Rules

- **Street zones** (the Submit control): each span and manhole is a focusable zone named like "Dig in span MH-2 → MH-3" or "Dig at manhole MH-2", in CO-A → CO-Z tab order, activated by click, Enter or Space. They are disabled until **Fire OTDR** and after the round is solved; the state guard ignores digs anyway. Hover or focus highlights the zone and shows "Dig here?". Misses stay marked "✖ intact".
- **Fire OTDR**: draws the trace with a pulse running out along it and an echo returning from the break (about 2–3 s). Pressing it again replays the animation.
- **Get help** label changes to "Get help (1 of 3)", "(2 of 3)", "(3 of 3)"; disabled after step 3
  or once solved. Revealed help text stays visible.
- **Feedback region**: `aria-live="polite"`, shown directly below the street map. Content: headline (result in words), numeric lines, next step. Focus stays on the dug zone so the animation remains in view; the live region announces the result.
- **Next** moves focus to the new round's test-end banner or the next briefing's heading.
- **Restart** opens a modal dialog "Restart the session? Progress will be cleared." with
  **Cancel** (default focus) and **Restart**. Esc means Cancel.
- **Role cards**: text like "Player 2 — Route Mapper", following `roleFor`. Not interactive.
- **Level recap**: when a level's second round is solved, the feedback region also shows that
  level's rounds solved, attempts, and help steps, before **Next**.
- **Progress line**: "Level 2 of 3 · Round 1 of 2 · Solved 2 of 6".
- **Motion**: under `prefers-reduced-motion: reduce`, final positions appear immediately. Otherwise
  the animation lasts ≤ 1.5 s and the feedback text appears immediately (it never waits for the
  animation).
- **Layout**: narrow widths (≤ 600 px) stack trace, map, choices, and feedback vertically; the
  tables scroll horizontally inside labelled regions; the action buttons are never hidden.
- **Art**: original SVG icons from `assets/icons/`, decorative ones with `aria-hidden="true"`.
  No photographs.
