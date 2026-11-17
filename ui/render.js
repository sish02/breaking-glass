// Screens (contracts/ui-contract.md), arcade style (spec FR-029). Rendering only — every decision
// comes from engine/*. `ui` carries view-only state (animation flags, truck/dig positions).
import { esc } from '../engine/format.js';
import { explain } from '../engine/feedback.js';
import { locate } from '../engine/rules.js';
import {
  currentLevel, currentRound, totalRounds, roleFor, levelRecap, sessionSummary,
} from '../engine/state.js';
import { traceSvg, traceTable } from './trace.js';
import { streetSvg, routeTable } from './routemap.js';

const $app = () => document.getElementById('app');
const $fb = () => document.getElementById('feedback');

function setChrome(phase) {
  const btn = document.getElementById('restart-btn');
  if (btn) btn.hidden = !['briefing', 'round', 'summary'].includes(phase);
}

export function renderContentError(errors) {
  setChrome('content-error');
  $fb().className = 'feedback';
  $fb().innerHTML = '';
  const items = errors.map((e) => `<li><strong>${esc(e.roundId || e.levelId || 'Content')}</strong>: ${esc(e.message)} <span class="muted">(${esc(e.code)})</span></li>`).join('');
  $app().innerHTML = `<section class="cabinet" aria-labelledby="screen-heading">
    <h1 id="screen-heading" tabindex="-1" class="neon-pink">Content problem</h1>
    <p>The game can't start because the content didn't pass its checks. Nothing has been graded.</p>
    <ul class="error-list">${items}</ul>
    <div class="actions"><button type="button" class="btn" id="retry-load">Try again</button></div>
  </section>`;
  document.getElementById('retry-load').addEventListener('click', () => window.location.reload());
  document.getElementById('screen-heading').focus();
}

function setupScreen(ui) {
  const opt = (n) => `<label class="team-opt"><input type="radio" name="team" value="${n}" id="team-${n}" ${ui.teamChoice === n ? 'checked' : ''}><span>${n} PLAYERS</span></label>`;
  return `<section class="cabinet title-screen" aria-labelledby="screen-heading">
    <p class="kicker">NAF AC6 · CO-OP FIBER RESTORATION</p>
    <h1 id="screen-heading" tabindex="-1" class="logo-title"><span class="icon icon-logo" aria-hidden="true"></span>BREAKING GLASS</h1>
    <p class="motto">“I am the one who digs.”</p>
    <p class="tagline-big">The Albuquerque fiber route is cut. Fire the OTDR, read the echo, and send the dig crew to the cut.</p>
    <fieldset class="team-choice"><legend>SELECT CREW SIZE</legend>${opt(3)}${opt(4)}</fieldset>
    <div class="actions center"><button type="button" class="btn btn-start" data-action="start" id="start-btn">PRESS START</button></div>
    <p class="muted center small">Co-op on one screen · no names, no scores · roles rotate each round · anyone can press the buttons</p>
  </section>`;
}

function demoBlock(level, ui) {
  const demo = level.briefing.demo;
  if (!demo) return '';
  const round = { ...demo, id: `${level.id}-demo` };
  // The demo's answer comes from the engine, like any round.
  const loc = locate(round);
  const far = round.route.points[round.route.points.length - 1].groundM;
  const solvedResult = loc && {
    groundFromAM: loc.groundFromAM,
    breakM: loc.breakM,
    naiveGroundFromAM: round.testEnd === 'A' ? loc.breakM : far - loc.breakM,
  };
  return `<div class="screen demo" id="demo">
    <p class="screen-label">DEMO · WORKED EXAMPLE · watch the pulse, then where the cut really is</p>
    <div class="chart-wrap">${traceSvg(round, { fired: true, animate: ui.animateDemo && !ui.reduced, label: 'Demo OTDR trace' })}</div>
    <div class="chart-wrap">${streetSvg(round, { zones: false, showTruck: false, label: 'Demo street map', result: solvedResult ? { ...solvedResult, pending: ui.animateDemo && !ui.reduced } : null })}</div>
  </div>`;
}

function briefingScreen(state, ui) {
  const level = currentLevel(state);
  const n = state.content.levels.length;
  const sources = level.sourceIds.map((id) => state.content.sources.find((s) => s.id === id))
    .map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a> — <span class="muted">${esc(s.section)}</span></li>`).join('');
  return `<section class="cabinet briefing" aria-labelledby="screen-heading">
    <p class="kicker">LEVEL ${state.levelIndex + 1} OF ${n}</p>
    <h1 id="screen-heading" tabindex="-1" class="neon-cyan">${esc(level.title.toUpperCase())}</h1>
    <p class="summary">${esc(level.briefing.summary)}</p>
    ${demoBlock(level, ui)}
    <div class="actions">
      <button type="button" class="btn btn-start" data-action="startLevel" id="begin-btn">PRESS START</button>
      ${level.briefing.demo ? '<button type="button" class="btn btn-quiet" data-action="replayDemo" id="replay-btn">↻ REPLAY DEMO</button>' : ''}
    </div>
    <details class="more">
      <summary>More detail: how it works, worked example, simplifications, sources</summary>
      ${level.briefing.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}
      <div class="worked"><strong>Worked example.</strong> ${esc(level.briefing.workedExample)}</div>
      ${level.briefing.limits.length ? `<h2>What this game simplifies</h2><ul>${level.briefing.limits.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>` : ''}
      <h2>Sources</h2><ul>${sources}</ul>
    </details>
  </section>`;
}

function hud(state, round, rs) {
  const level = currentLevel(state);
  const idx = level.rounds.findIndex((r) => r.id === round.id);
  const found = Object.values(state.roundState).filter((r) => r.solved).length;
  const roles = [];
  for (let p = 1; p <= state.teamSize; p++) roles.push(`<li><span class="p">P${p}</span> ${esc(roleFor(p, state.sessionRound, state.teamSize))}</li>`);
  return `<div class="hud" role="group" aria-label="Status">
      <div class="hud-cell"><span class="hud-k">LEVEL</span><span class="hud-v">${state.levelIndex + 1}-${idx + 1}</span></div>
      <div class="hud-cell"><span class="hud-k">CUTS FOUND</span><span class="hud-v">${found}/${totalRounds(state)}</span></div>
      <div class="hud-cell"><span class="hud-k">DIGS</span><span class="hud-v">${rs.attempts}</span></div>
      <div class="hud-cell"><span class="hud-k">HELP</span><span class="hud-v">${rs.assistance}/3</span></div>
    </div>
    <ul class="roles" aria-label="Roles this round">${roles.join('')}</ul>`;
}

function helpPanel(round, rs) {
  const shown = round.hints.slice(0, rs.assistance);
  const names = ['METHOD', 'WORKED STEP', 'FULL SOLUTION'];
  const label = rs.assistance >= 3 ? 'ALL HELP SHOWN' : `GET HELP (${rs.assistance + 1}/3)`;
  return `<section class="cabinet help" aria-labelledby="help-h">
    <div class="panel-head"><h3 id="help-h" tabindex="-1">HELP</h3><span class="muted">Free, and recorded separately.</span></div>
    ${shown.length ? `<ol>${shown.map((h, i) => `<li><strong>${names[i]}:</strong> ${esc(h)}</li>`).join('')}</ol>` : ''}
    <div class="actions"><button type="button" class="btn btn-quiet" id="help-btn" data-action="help" ${rs.assistance >= 3 || rs.solved ? 'disabled' : ''}>${label}</button></div>
  </section>`;
}

function roundScreen(state, ui) {
  const round = currentRound(state);
  const rs = state.roundState[round.id];
  const level = currentLevel(state);
  const idxInLevel = level.rounds.findIndex((r) => r.id === round.id);
  const isLastInLevel = idxInLevel === level.rounds.length - 1;
  const isLastLevel = state.levelIndex === state.content.levels.length - 1;
  const nextLabel = !isLastInLevel ? 'NEXT ROUND ▶' : isLastLevel ? 'FINAL SCREEN ▶' : 'NEXT LEVEL ▶';
  const d = rs.lastDiagnosis;
  const digging = ui.dig && ui.dig.roundId === round.id;
  const far = round.route.points[round.route.points.length - 1].groundM;
  const result = rs.solved && d ? {
    groundFromAM: d.evidence.groundFromAM,
    breakM: d.evidence.breakM,
    naiveGroundFromAM: round.testEnd === 'A' ? d.evidence.breakM : far - d.evidence.breakM,
    pending: digging && !ui.reduced,
  } : null;
  const xs = ui.digXs[round.id] || [];
  const digs = rs.digs.map((g, i) => ({ ...g, x: xs[i], fresh: digging && i === rs.digs.length - 1 }));
  const truckX = digging ? ui.dig.toX : (ui.truckX[round.id] ?? null);
  const status = !rs.fired ? 'Fire the OTDR first, then click the street where the crew should dig.'
    : rs.solved ? 'Cut found! Press NEXT when your crew is ready.'
      : 'Click the street (a stretch of road or a manhole) where the crew should dig.';
  const banner = digging ? (d && d.status === 'correct'
    ? '<div class="flash hit" data-anim="flash" aria-hidden="true">CUT FOUND!</div>'
    : '<div class="flash miss" data-anim="flash" aria-hidden="true">NO DAMAGE HERE</div>') : '';

  return `${hud(state, round, rs)}
    <section class="cabinet scene" aria-labelledby="round-heading">
      <div class="scene-head">
        <div>
          <h2 id="round-heading" tabindex="-1" class="neon-yellow">${esc(round.title.toUpperCase())}</h2>
          <p class="test-end"><span class="icon icon-otdr" aria-hidden="true"></span>OTDR PLUGGED IN AT <strong>CO-${esc(round.testEnd)}</strong> · distances measured from there</p>
        </div>
        <button type="button" class="btn btn-fire" id="fire-btn" data-action="fire">${rs.fired ? '↻ REPLAY PULSE' : '⚡ FIRE OTDR'}</button>
      </div>
      <div class="screen">
        <div class="chart-wrap" role="region" tabindex="0" aria-label="OTDR trace (scrolls sideways on narrow screens)">
          ${traceSvg(round, { fired: rs.fired, highlightedEvent: rs.highlightedEvent, showBreak: rs.solved, animate: ui.pulseRound === round.id && !ui.reduced })}
        </div>
      </div>
      <p class="status" id="status">${esc(status)}</p>
      <div class="screen street-screen">
        ${banner}
        <div class="chart-wrap">
          ${streetSvg(round, { interactive: rs.fired && !rs.solved, digs, truckX, result })}
        </div>
      </div>
      <div id="feedback-slot"></div>
      <div class="actions">
        <button type="button" class="btn btn-start" id="next-btn" data-action="next" ${rs.solved ? '' : 'disabled'}>${nextLabel}</button>
      </div>
    </section>
    ${helpPanel(round, rs)}
    <section class="cabinet numbers" aria-labelledby="numbers-h">
      <div class="panel-head"><h3 id="numbers-h">THE NUMBERS</h3></div>
      ${rs.fired ? traceTable(round, rs.highlightedEvent) : '<p class="muted">Trace events appear after you fire the OTDR.</p>'}
      ${routeTable(round, rs.solved || rs.assistance >= 3)}
    </section>`;
}

function feedbackHtml(state) {
  if (state.phase !== 'round') return { cls: '', html: '' };
  const round = currentRound(state);
  const rs = state.roundState[round.id];
  if (!rs.lastDiagnosis) return { cls: '', html: '' };
  const fb = explain(rs.lastDiagnosis, round);
  const mark = fb.tone === 'success' ? '✔' : fb.tone === 'retry' ? '✖' : 'ℹ';
  let recap = '';
  const level = currentLevel(state);
  if (rs.solved && level.rounds[level.rounds.length - 1].id === round.id) {
    const c = levelRecap(state, state.levelIndex);
    recap = `<div class="recap"><strong>LEVEL ${state.levelIndex + 1} CLEAR!</strong> ${c.solved} of ${c.rounds} cuts found · ${c.attempts} digs · ${c.assistance} help steps used.</div>`;
  }
  const html = `<h2 id="feedback-heading" tabindex="-1">${mark} ${esc(fb.headline)}</h2>
    <ul>${fb.lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
    ${fb.next ? `<p><strong>Next step:</strong> ${esc(fb.next)}</p>` : ''}
    ${fb.note ? `<p class="field-note">${esc(fb.note)}</p>` : ''}
    ${rs.lastDiagnosis.status === 'invalid-input' ? '' : `<p class="muted">Dig ${rs.attempts} this round.</p>`}
    ${recap}`;
  return { cls: fb.tone, html };
}

function summaryScreen(state) {
  const sum = sessionSummary(state);
  const rows = sum.levels.map((l, i) => `
    <tbody>
      <tr><th colspan="4" scope="rowgroup">LEVEL ${i + 1} · ${esc(l.title.toUpperCase())}</th></tr>
      ${l.rounds.map((r) => `<tr><td>${esc(r.title)}</td><td>${r.solved ? '✔ Found' : 'Not found'}</td><td class="num">${r.attempts}</td><td class="num">${r.assistance} of 3</td></tr>`).join('')}
      <tr><td><em>Level subtotal</em></td><td>${l.recap.solved} of ${l.recap.rounds}</td><td class="num">${l.recap.attempts}</td><td class="num">${l.recap.assistance}</td></tr>
    </tbody>`).join('');
  return `<section class="cabinet title-screen" aria-labelledby="screen-heading">
    <p class="kicker">ALL LEVELS CLEAR</p>
    <h1 id="screen-heading" tabindex="-1" class="logo-title">ROUTE RESTORED!</h1>
    <p class="tagline-big">Your crew found <strong>${sum.totals.solved} of ${sum.totals.rounds}</strong> cuts with <strong>${sum.totals.attempts}</strong> digs and <strong>${sum.totals.assistance}</strong> help steps.</p>
    <p class="muted center small">Help is listed separately: a cut found with the full solution open is not the same as finding it on your own.</p>
    <div class="table-wrap" role="region" aria-label="Session summary" tabindex="0">
      <table>
        <thead><tr><th scope="col">Round</th><th scope="col">Result</th><th scope="col" class="num">Digs</th><th scope="col" class="num">Help steps</th></tr></thead>
        ${rows}
        <tfoot><tr><th scope="row">Session total</th><td>${sum.totals.solved} of ${sum.totals.rounds}</td><td class="num">${sum.totals.attempts}</td><td class="num">${sum.totals.assistance}</td></tr></tfoot>
      </table>
    </div>
    <div class="actions center"><button type="button" class="btn btn-start" data-action="playAgain" id="again-btn">PLAY AGAIN</button></div>
  </section>`;
}

export function render(state, ui) {
  setChrome(state.phase);
  const app = $app();
  const region = $fb();
  // Keep the single live region alive across renders: park it, re-render, then re-insert.
  document.getElementById('main').append(region);
  if (state.phase === 'setup') app.innerHTML = setupScreen(ui);
  else if (state.phase === 'briefing') app.innerHTML = briefingScreen(state, ui);
  else if (state.phase === 'round') app.innerHTML = roundScreen(state, ui);
  else if (state.phase === 'summary') app.innerHTML = summaryScreen(state);
  const slot = document.getElementById('feedback-slot');
  if (slot) slot.replaceWith(region);
  const fb = feedbackHtml(state);
  region.className = `feedback ${fb.cls}`;
  if (region.innerHTML !== fb.html) region.innerHTML = fb.html;
}

