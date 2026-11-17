---
# ARCADE SUBMISSION — commit this file to the ROOT of your game repository as ARCADE.md,
# then send John your GitHub URL. Everything between the two --- lines is machine-read.
# Filled in by the build agent from its own session record. Fields marked (HUMAN) still need
# the creator's answers; consent_to_publish stays false until the creator says yes.
arcade_version: 1

game:
  title: "Breaking Glass"
  slug: breaking-glass
  tagline: "Fire the OTDR, read the echo, and dig where the fiber is really cut."
  summary: "A co-op arcade game for 3-4 players on one screen. The crew fires an OTDR, watches the trace draw itself, then clicks the street to send a dig truck to the cut. They learn to read a trace and to correct cable distance for slack coiled in manholes."
  topics: [Fiber optics, OTDR, Fault location, Outside plant, Slack loops]
  category: network-fundamentals
  skill_level: beginner
  play_minutes: 15           # design target from the spec; not yet measured with a real team
  levels: 3                  # 3 levels × 2 rounds = 6 rounds
  card_image: assets/images/card.png
  card_image_alt: "Neon arcade title screen reading BREAKING GLASS, with the tagline I am the one who digs, crew-size buttons and a PRESS START button."
  repo: "https://github.com/sish02/breaking-glass"
  repo_path: ""
  license: Apache-2.0

creator:                     # (HUMAN) to be filled in by the creator
  name: ""
  github: ""
  location: ""
  organization: ""
  links: []
  first_spec_project: true   # (HUMAN) confirm
  workshop: "NAF AC6"
  consent_to_publish: false  # (HUMAN) set true ONLY if you agree to this card appearing on the Arcade

build:
  started: "2026-11-17"
  finished: "2026-11-17"
  wall_time: unknown
  spec_driven:
    framework: GitHub Spec Kit
    framework_version: "1.4.2.dev0"
    artifacts: [constitution, spec, clarify, plan, tasks, analysis, checklists]
    task_count: 56           # 54 done; T043 (teammate re-check) and T044 (team playtest) open
    loops_or_phases: 8       # tasks.md phases 1-8; phase 8 was the arcade redesign
  model: claude-opus-5-5
  helper_models: ["web-fetch sub-agent for source checks (model ID not reported)"]
  harness: Claude Code (VS Code extension)
  harness_version: unknown
  mcp_servers: ["claude.ai Claude Docs (connected, not used)", "claude-vscode IDE diagnostics (available, not used)"]
  rag_and_sources:
    - "FOA Reference – OTDRs (thefoa.org/tech/ref/testing/OTDR/OTDR.html)"
    - "FOA Reference – OTDR FAQs (thefoa.org/tech/ref/testing/OTDR/OTDR-FAQS.html)"
    - "FOA – Fiber Optic Network Restoration (thefoa.org/tech/ref/restoration/rest.html), quotes checked verbatim"
    - "ITU-T G.650.1 summary page (checked, then dropped: backscatter clause not confirmable)"
    - "NAF AC6 workshop lab guide and StarterKit templates"
  skills_and_plugins: [speckit-constitution, speckit-specify, speckit-clarify, speckit-plan, speckit-tasks, speckit-analyze, speckit-implement]
  other_tools:
    - "Node 22.14 (dependency-free test runner)"
    - "Python http.server (local serving)"
    - "headless Google Chrome 157 driven over DevTools Protocol by a throwaway script (real mouse clicks, keyboard, reduced motion, 360 px)"
    - "Homebrew, GitHub CLI 2.104.0"
    - "macOS sips, qlmanage and xmllint (screenshots, icon checks)"
  human_prompts: 28
  usage:
    input_tokens: unknown
    output_tokens: unknown
    cost_note: "not reported by the harness during the session"
  ai_generated_assets: ["icons: original SVG hand-written by the build agent", "screenshots and card image: captured from the running game", "generated images: none", "audio: none"]

runtime:
  kind: static-web
  stack: [HTML, CSS, JavaScript ES modules, inline SVG, Web Animations API]
  start: "python3 -m http.server 8000 --bind 127.0.0.1"
  url_after_start: "http://127.0.0.1:8000"
  hosted_url: ""
  static_root: "."
  requires_install: false
  requires_network: false
  requires_api_key: false
  uses_ai_at_runtime: false
  browsers: ["Chrome 157 (headless, scripted)"]
  accessibility: "Scripted checks only: Level 1 played keyboard-only (Tab, Enter) with a visible focus ring; reduced motion shows results instantly; usable at 360 px; text tables for the trace and route; feedback in an aria-live region. Not yet tested by a person, with a screen reader, or in Firefox/Safari."
  save_state: none

verification:
  tests: "node tests/run.mjs"
  tests_passing: 95
  facts_sourced_from:
    - "FOA Reference – OTDRs: How Does an OTDR Work?; Information in the OTDR Trace; Index of Refraction"
    - "FOA OTDR FAQs: Systematic Errors; reflections from the end of the cable; troubleshooting a break in a long cable run"
    - "FOA Network Restoration: Locating Faults (OTDR ~±2%, look for the end); service loops; Mapping The Route"
  known_limits:
    - "Distances are treated as exact; real OTDR distances are only about ±2% accurate (stated in the game)"
    - "The slack-coil offset is a model built from sourced facts; no source states it directly"
    - "One break per round; no dead zones, ghosts, gainers, IOR or helix errors, macrobends or loss budgets"
    - "The trace events table names the end-of-fiber event, which makes Level 1 easier than reading the chart"
    - "Teammate answer re-check and observed team playtest not done yet, so status is 'playable, not verified'"
---

## In one paragraph

Breaking Glass is a co-op arcade game about finding a fiber cut. A crew of 3–4 shares one screen and fires an OTDR. A pulse of light races down the fiber of the fictional Albuquerque route, and the trace draws itself as the echo comes back. The crew then clicks the street to send the dig truck out. A wrong dig finds intact cable and explains why; the right one flashes CUT FOUND! The trap is slack: cable coiled in manholes makes the OTDR distance longer than the distance along the street. It's built for networking students and new field techs, with no prior knowledge needed.

## How it was built

We followed the workshop's Spec Kit order:
- **Constitution, specify and clarify.** Clarify settled four questions: only the dig site is graded, content is checked when the game loads, help unlocks in order, and roles rotate on a fixed schedule.
- **Plan.** A source check during planning showed that OTDR distances are only about ±2% accurate. That made one of the spec's assumptions false, so we corrected it and added the caveat to the game.
- **Tasks and analyze.** Analysis flagged one critical gap: the source review and an independent answer re-check were optional. We made both required, plus a team playtest.
- **Implement.** The first build was correct but felt like a worksheet. The human asked for clicking, animation and an arcade look, so we kept the tested engine and rebuilt only the screen layer.

Things that broke and how we fixed them:
- Charts were unreadable at 360 px. They now scroll sideways in their own area.
- Two browser checks failed because CSS uppercasing changed `innerText`. They now read `textContent`.

The game was renamed twice, finally to Breaking Glass.

## What we'd tell the next builder

- Check your sources during planning, not at the end: one fact (±2% OTDR accuracy) changed what the game could honestly claim.
- Keep the animation from leaking the answer. We kept the light pulse on the trace, because a pulse that stopped at the cut on the street would have given the puzzle away.
- Test in a real browser with real mouse clicks and keyboard-only play. Several layout and focus bugs only showed up there, never in the unit tests.
