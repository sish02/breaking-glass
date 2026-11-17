// Event wiring, focus management, restart dialog, and arcade animations.
// Game state lives in engine/state.js; `ui` holds view-only details (truck/dig positions, which
// animation to play next). Animations run after the state and feedback are already final.
import { reduce, currentRound } from '../engine/state.js';
import { render } from './render.js';
import { siteBounds, testEndX, streetScale } from './routemap.js';
import { playPulse, playDig, flashBanner, reducedMotion } from './anim.js';

let state;
const ui = {
  teamChoice: 3,
  reduced: false,
  pulseRound: null,     // round id whose trace should animate on this paint
  animateDemo: false,   // briefing demo should animate on this paint
  dig: null,            // { roundId, fromX, toX } for the dig being animated
  truckX: {},           // roundId → parked truck x
  digXs: {},            // roundId → [x of each dig]
};

/** Where focus goes after an action (contracts/ui-contract.md). null = keep the current element. */
function focusTargetFor(action, next) {
  switch (action.type) {
    case 'chooseTeamSize': return '#screen-heading';
    case 'startLevel': return '#round-heading';
    case 'next': return next.phase === 'round' ? '#round-heading' : '#screen-heading';
    case 'confirmRestart': return '#screen-heading';
    default: return null;   // dig: focus stays on the zone so the animation stays in view
  }
}

function runAnimations() {
  if (ui.pulseRound) playPulse(document.querySelector('.scene .trace-chart'));
  if (ui.animateDemo) {
    const demo = document.getElementById('demo');
    if (demo) {
      playPulse(demo.querySelector('.trace-chart')).then(() => {
        const res = demo.querySelector('[data-anim="result"]');
        if (res) {
          res.classList.remove('pending');
          if (res.animate && !reducedMotion()) res.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400 });
        }
      });
    }
  }
  if (ui.dig) {
    const svg = document.querySelector('.scene .street-chart');
    const hit = state.roundState[ui.dig.roundId].solved;
    playDig(svg, { fromX: ui.dig.fromX, toX: ui.dig.toX, hit });
    flashBanner(document.querySelector('[data-anim="flash"]'));
  }
}

function paint(action) {
  ui.reduced = reducedMotion();
  const activeId = document.activeElement && document.activeElement.id;
  render(state, ui);
  runAnimations();
  const target = action ? focusTargetFor(action, state) : '#screen-heading';
  let el = (target && document.querySelector(target)) || (activeId && document.getElementById(activeId));
  if (el && (el.disabled || el.getAttribute('aria-disabled') === 'true')) {
    el = document.getElementById(el.id === 'help-btn' ? 'help-h' : 'next-btn') || el;
  }
  // Moving to a new screen scrolls to its heading; staying on a screen keeps the view still.
  if (el && typeof el.focus === 'function') el.focus({ preventScroll: !target });
  ui.pulseRound = null;
  ui.animateDemo = false;
  ui.dig = null;
}

function dispatch(action, { force = false } = {}) {
  const before = state;
  state = reduce(state, action);
  if (state === before && !force) return false;
  if (action.type === 'confirmRestart') { ui.truckX = {}; ui.digXs = {}; }
  if (action.type === 'chooseTeamSize' || (action.type === 'next' && state.phase === 'briefing')) ui.animateDemo = true;
  paint(action);
  return true;
}

function fire() {
  const r = currentRound(state);
  ui.pulseRound = r.id;
  if (!dispatch({ type: 'firePulse' })) paint({ type: 'replayPulse' }); // already fired: just replay
}

function dig(siteId, x) {
  const r = currentRound(state);
  const rs = state.roundState[r.id];
  if (!rs.fired || rs.solved) return;
  const b = siteBounds(r, siteId);
  let toX = x == null ? b.cx : Math.max(b.x0, Math.min(b.x1, x));
  const fromX = ui.truckX[r.id] ?? testEndX(r);
  const before = state;
  state = reduce(state, { type: 'dig', siteId });
  if (state === before) return;
  const after = state.roundState[r.id];
  if (after.solved) toX = streetScale(r)(after.lastDiagnosis.evidence.groundFromAM); // crew drives onto the cut
  ui.digXs[r.id] = [...(ui.digXs[r.id] || []), toX];
  ui.truckX[r.id] = toX;
  ui.dig = { roundId: r.id, fromX, toX };
  paint({ type: 'dig' });
}

/** Convert a pointer event to the street SVG's x coordinate. */
function svgX(evt, svg) {
  const m = svg.getScreenCTM && svg.getScreenCTM();
  if (!m) return null;
  const pt = svg.createSVGPoint();
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  return pt.matrixTransform(m.inverse()).x;
}

function bind() {
  const app = document.getElementById('app');
  app.addEventListener('click', (e) => {
    const zone = e.target.closest('.zone');
    if (zone) {
      if (zone.getAttribute('aria-disabled') === 'true') return;
      dig(zone.dataset.site, svgX(e, zone.ownerSVGElement));
      return;
    }
    const b = e.target.closest('[data-action]');
    if (!b || b.disabled) return;
    switch (b.dataset.action) {
      case 'start': dispatch({ type: 'chooseTeamSize', n: ui.teamChoice }); break;
      case 'startLevel': dispatch({ type: 'startLevel' }); break;
      case 'replayDemo': ui.animateDemo = true; paint({ type: 'replayDemo' }); break;
      case 'fire': fire(); break;
      case 'help': dispatch({ type: 'requestHelp' }); break;
      case 'next': dispatch({ type: 'next' }); break;
      case 'highlight': dispatch({ type: 'highlightEvent', eventId: b.dataset.event }); break;
      case 'playAgain': dispatch({ type: 'confirmRestart' }); break;
      default: break;
    }
  });
  app.addEventListener('keydown', (e) => {
    const zone = e.target.closest && e.target.closest('.zone');
    if (zone && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      if (zone.getAttribute('aria-disabled') !== 'true') dig(zone.dataset.site, null);
    }
  });
  app.addEventListener('change', (e) => {
    if (e.target.name === 'team') ui.teamChoice = Number(e.target.value);
  });

  const dialog = document.getElementById('restart-dialog');
  const restartBtn = document.getElementById('restart-btn');
  restartBtn.addEventListener('click', () => {
    dispatch({ type: 'requestRestart' });
    if (state.restartPending) {
      dialog.returnValue = '';
      dialog.showModal();
      document.getElementById('restart-cancel').focus();
    }
  });
  document.getElementById('restart-cancel').addEventListener('click', () => dialog.close('cancel'));
  document.getElementById('restart-confirm').addEventListener('click', () => dialog.close('confirm'));
  dialog.addEventListener('close', () => {
    if (dialog.returnValue === 'confirm') {
      dispatch({ type: 'confirmRestart' });
    } else {
      dispatch({ type: 'cancelRestart' });
      restartBtn.focus();
    }
  });
}

export function start(initialState) {
  state = initialState;
  bind();
  paint(null);
}
