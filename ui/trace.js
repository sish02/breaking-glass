// OTDR trace SVG + "Trace events" table (research R3). Illustrative only: grading never reads it.
// Before firing, the screen is empty. After FIRE OTDR, a pulse runs along the fiber strand above the
// plot, the trace is revealed in step with it, and an echo returns from the break. The pulse lives
// on the trace's distance axis only; it never points at a place on the street (spec FR-007).
import { km, esc } from '../engine/format.js';
import { cableModel } from '../engine/rules.js';

const W = 860;
const H = 300;
const L = 58;
const R = 18;
const T = 56;
const B = 50;
const STRAND_Y = 24;
const PX_PER_DB = 30;
const MIN_STEP_PX = 7;
const SPIKE_PX = 38;

const TYPE_LABEL = {
  launch: 'Launch (OTDR connection)',
  connector: 'Connector',
  splice: 'Splice',
  end: 'End of fiber (backscatter stops)',
};

function seeded(seedText) {
  let h = 2166136261;
  for (const ch of seedText) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return () => {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    return h / 4294967296;
  };
}

function scaleFor(round) {
  const model = cableModel(round);
  const farCable = model[model.length - 1].inM;
  const step = farCable <= 6000 ? 500 : 1000;
  const maxM = Math.ceil((farCable * 1.04) / step) * step;
  return { x: (m) => L + (m / maxM) * (W - L - R), maxM, step };
}

function tracePath(round, x) {
  const att = round.trace.attenuationDbPerKm;
  const y0 = T + SPIKE_PX + 6;
  const noiseY = H - B - 14;
  const y = (db) => y0 + db * PX_PER_DB;
  let level = 0;
  let prevD = 0;
  let endX = x(0);
  const p = [`M ${x(0).toFixed(1)} ${(y0 - SPIKE_PX).toFixed(1)}`, `L ${(x(0) + 3).toFixed(1)} ${y0.toFixed(1)}`];
  for (const e of round.trace.events.slice(1)) {
    level += (att * (e.distanceM - prevD)) / 1000;
    prevD = e.distanceM;
    const ex = x(e.distanceM);
    p.push(`L ${ex.toFixed(1)} ${y(level).toFixed(1)}`);
    if (e.type === 'connector' || e.type === 'splice') {
      const drop = Math.max((e.lossDb || 0) * PX_PER_DB, MIN_STEP_PX);
      if (e.type === 'connector') p.push(`L ${(ex + 1.5).toFixed(1)} ${(y(level) - SPIKE_PX).toFixed(1)}`);
      p.push(`L ${(ex + 3.5).toFixed(1)} ${(y(level) + drop).toFixed(1)}`);
      level += drop / PX_PER_DB;
    } else if (e.type === 'end') {
      if (e.reflective) p.push(`L ${(ex + 1.5).toFixed(1)} ${(y(level) - SPIKE_PX).toFixed(1)}`);
      p.push(`L ${(ex + 3.5).toFixed(1)} ${noiseY.toFixed(1)}`);
      endX = ex + 3.5;
    }
  }
  return { d: p.join(' '), endX, noiseY };
}

/**
 * @param opts.fired     trace is drawn only after FIRE OTDR
 * @param opts.animate   include the cover/pulse/echo elements that ui/anim.js plays
 * @param opts.showBreak mark the break distance (after the round is solved)
 */
export function traceSvg(round, { fired = true, highlightedEvent = null, showBreak = false, animate = false, label = 'OTDR trace' } = {}) {
  const { x, maxM, step } = scaleFor(round);
  const from = `CO-${round.testEnd}`;
  const brk = round.trace.events.find((e) => e.type === 'end');
  const bx = x(brk.distanceM);
  const ticks = [];
  for (let m = 0; m <= maxM; m += step) {
    ticks.push(`<line class="grid" x1="${x(m)}" y1="${T}" x2="${x(m)}" y2="${H - B}"/>`
      + `<text x="${x(m)}" y="${H - B + 20}" text-anchor="middle">${(m / 1000).toFixed(1)}</text>`);
  }
  const frame = `${ticks.join('')}
    <line class="axis" x1="${L}" y1="${H - B}" x2="${W - R}" y2="${H - B}"/>
    <line class="axis" x1="${L}" y1="${T}" x2="${L}" y2="${H - B}"/>
    <text x="${(L + W - R) / 2}" y="${H - 8}" text-anchor="middle">DISTANCE FROM ${esc(from)} (KM)</text>
    <text x="16" y="${(T + H - B) / 2}" text-anchor="middle" transform="rotate(-90 16 ${(T + H - B) / 2})">LIGHT BACK</text>
    <text x="${L}" y="${STRAND_Y - 10}" class="strand-label">FIBER FROM ${esc(from)} ▸</text>`;

  if (!fired) {
    return `<svg class="chart trace-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}: not fired yet. Press Fire OTDR to send a light pulse down the fiber.">
      ${frame}
      <line class="strand dim" x1="${L}" y1="${STRAND_Y}" x2="${W - R}" y2="${STRAND_Y}"/>
      <text class="press" x="${(L + W - R) / 2}" y="${(T + H - B) / 2 + 6}" text-anchor="middle">PRESS FIRE OTDR</text>
    </svg>`;
  }

  const { d, endX, noiseY } = tracePath(round, x);
  const rand = seeded(round.id || 'demo');
  const noise = [];
  for (let nx = endX; nx <= x(maxM); nx += 6) noise.push(`${nx.toFixed(1)},${(noiseY + (rand() - 0.5) * 9).toFixed(1)}`);
  const markers = round.trace.events.slice(1).map((e) => {
    const hl = e.id === highlightedEvent ? ' hl' : '';
    return `<line class="event-line${hl}" x1="${x(e.distanceM)}" y1="${T}" x2="${x(e.distanceM)}" y2="${H - B}"/>`
      + `<text x="${x(e.distanceM) + 4}" y="${T + 12}" class="event-label${hl}">${esc(e.type.toUpperCase())}</text>`;
  }).join('');
  const breakMark = showBreak
    ? `<line class="marker" x1="${bx}" y1="${T}" x2="${bx}" y2="${H - B}"/>`
      + `<text class="marker-label" x="${bx - 6}" y="${H - B - 4}" text-anchor="end">BREAK ${esc(km(brk.distanceM))}</text>`
    : '';
  const anim = animate
    ? `<rect class="cover" data-anim="cover" x="${L + 1}" y="${T - 4}" width="${W - R - L + 2}" height="${H - B - T + 4}"/>
       <circle class="pulse" data-anim="pulse" cx="${L}" cy="${STRAND_Y}" r="7"/>
       <circle class="echo" data-anim="echo" cx="${bx}" cy="${STRAND_Y}" r="5" opacity="0"/>`
    : '';
  const summary = `${label} measured from ${from}. Events: `
    + round.trace.events.map((e) => `${TYPE_LABEL[e.type]} at ${km(e.distanceM)}`).join('; ') + '.';

  return `<svg class="chart trace-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(summary)}"
      data-left="${L}" data-right="${W - R}" data-break-x="${bx.toFixed(1)}">
    ${frame}
    <line class="strand" x1="${L}" y1="${STRAND_Y}" x2="${bx}" y2="${STRAND_Y}"/>
    <line class="strand dim" x1="${bx}" y1="${STRAND_Y}" x2="${W - R}" y2="${STRAND_Y}"/>
    ${markers}
    <path class="trace" d="${d}"/>
    <polyline class="noise" points="${noise.join(' ')}"/>
    ${breakMark}
    ${anim}
  </svg>`;
}

export function traceTable(round, highlightedEvent) {
  const rows = round.trace.events.map((e) => `
    <tr class="${e.id === highlightedEvent ? 'hl' : ''}">
      <td><button type="button" class="linkish" id="ev-${esc(e.id)}" data-action="highlight" data-event="${esc(e.id)}"
        aria-pressed="${e.id === highlightedEvent}">Highlight</button></td>
      <td class="num">${esc(km(e.distanceM))}</td>
      <td>${esc(TYPE_LABEL[e.type])}</td>
      <td>${e.reflective ? 'Yes — spike' : 'No'}</td>
      <td class="num">${e.lossDb !== undefined ? `${e.lossDb} dB` : '—'}</td>
    </tr>`).join('');
  return `<p class="muted table-note">Trace events — cable length from CO-${esc(round.testEnd)}. Highlighting marks an event on the trace for discussion; it is not graded.</p>
  <div class="table-wrap" role="region" aria-label="Trace events table" tabindex="0">
    <table>
      <thead><tr><th scope="col">Mark</th><th scope="col" class="num">Distance</th><th scope="col">Event</th><th scope="col">Reflective</th><th scope="col" class="num">Loss</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}
