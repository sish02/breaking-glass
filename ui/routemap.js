// The street map, which is also the controller (spec FR-010): every span and manhole is a zone you
// click (or Tab to and press Enter/Space) to dig there. CO-A is always on the left.
// Nothing here reveals the answer before a correct dig.
import { km, metres, esc } from '../engine/format.js';
import { cableModel, listSites } from '../engine/rules.js';

const W = 860;
const H = 296;
const L = 46;
const R = 46;
const ROAD_Y = 150;
const ROAD_H = 64;
const MH_R = 14;

export function streetScale(round) {
  const pts = round.route.points;
  const far = pts[pts.length - 1].groundM;
  return (g) => L + (g / far) * (W - L - R);
}

/** Horizontal extent of a dig zone in SVG units. */
export function siteBounds(round, siteId) {
  const x = streetScale(round);
  const pts = new Map(round.route.points.map((p) => [p.id, p]));
  if (siteId.startsWith('mh:')) {
    const cx = x(pts.get(siteId.slice(3)).groundM);
    return { x0: cx - 22, x1: cx + 22, cx };
  }
  const [a, b] = siteId.slice(5).split('~').map((id) => pts.get(id));
  const pad = (p) => (p.kind === 'manhole' ? 24 : 20);
  const x0 = x(a.groundM) + pad(a);
  const x1 = x(b.groundM) - pad(b);
  return { x0, x1, cx: (x0 + x1) / 2 };
}

export function testEndX(round) {
  const p = round.route.points.find((q) => q.id === `CO-${round.testEnd}`);
  return streetScale(round)(p.groundM);
}

const safeId = (siteId) => siteId.replace(/[:~]/g, '_');

function building(cx, label) {
  const win = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    win.push(`<rect class="win" x="${cx - 14 + c * 10}" y="${ROAD_Y - 78 + r * 12}" width="6" height="6"/>`);
  }
  return `<rect class="building" x="${cx - 20}" y="${ROAD_Y - 86}" width="40" height="${86 - ROAD_H / 2}"/>${win.join('')}
    <text x="${cx}" y="${ROAD_Y - 92}" text-anchor="middle" class="pt-label">${esc(label)}</text>`;
}

function truck(xPos) {
  // Original pixel-style truck, drawn around x = 0 and positioned with a CSS transform.
  return `<g class="truck" data-truck style="transform: translateX(${xPos.toFixed(1)}px)">
    <g transform="translate(0 ${ROAD_Y - 31})">
      <rect class="truck-body" x="-22" y="6" width="30" height="16"/>
      <rect class="truck-cab" x="8" y="10" width="14" height="12"/>
      <rect class="truck-glass" x="12" y="12" width="7" height="5"/>
      <rect class="truck-arm" x="-18" y="0" width="16" height="4"/>
      <rect class="truck-arm" x="-20" y="-6" width="4" height="10"/>
      <circle class="wheel" cx="-13" cy="24" r="4"/><circle class="wheel" cx="14" cy="24" r="4"/>
      <rect class="beacon" x="12" y="5" width="5" height="4"/>
    </g>
  </g>`;
}

/**
 * @param opts.interactive dig zones are enabled (fired and not yet solved)
 * @param opts.digs        [{siteId, status, x}] digs made this round
 * @param opts.truckX      where the truck is parked (SVG x)
 * @param opts.result      after a correct dig: { groundFromAM, naiveGroundFromAM, pending }
 */
export function streetSvg(round, { interactive = false, zones = true, digs = [], truckX = null, result = null, showTruck = true, label = 'Street map' } = {}) {
  const x = streetScale(round);
  const pts = round.route.points;
  const far = pts[pts.length - 1].groundM;
  const parts = [];
  parts.push(`<rect class="ground" x="0" y="${ROAD_Y + ROAD_H / 2}" width="${W}" height="${H - ROAD_Y - ROAD_H / 2}"/>`);
  parts.push(`<rect class="road" x="${x(0)}" y="${ROAD_Y - ROAD_H / 2}" width="${x(far) - x(0)}" height="${ROAD_H}"/>`);
  parts.push(`<line class="lane" x1="${x(0)}" y1="${ROAD_Y - ROAD_H / 2 + 6}" x2="${x(far)}" y2="${ROAD_Y - ROAD_H / 2 + 6}"/>`);
  parts.push(`<line class="duct" x1="${x(0)}" y1="${ROAD_Y}" x2="${x(far)}" y2="${ROAD_Y}"/>`);

  for (const p of pts) {
    const px = x(p.groundM);
    if (p.kind === 'co') {
      parts.push(building(px, p.id));
      parts.push(`<text x="${px}" y="${ROAD_Y + ROAD_H / 2 + 22}" text-anchor="middle" class="km">${esc(km(p.groundM))}</text>`);
    } else {
      parts.push(`<circle class="mh" cx="${px}" cy="${ROAD_Y}" r="${MH_R}"/>`
        + `<line class="mh-bar" x1="${px - 9}" y1="${ROAD_Y - 4}" x2="${px + 9}" y2="${ROAD_Y - 4}"/>`
        + `<line class="mh-bar" x1="${px - 9}" y1="${ROAD_Y + 4}" x2="${px + 9}" y2="${ROAD_Y + 4}"/>`
        + `<text x="${px}" y="${ROAD_Y - ROAD_H / 2 - 8}" text-anchor="middle" class="pt-label">${esc(p.id)}</text>`);
      const kmY = p.slackM > 0 ? ROAD_Y + ROAD_H / 2 + 62 : ROAD_Y + ROAD_H / 2 + 22;
      if (p.slackM > 0) {
        const cy = ROAD_Y + ROAD_H / 2 + 22;
        parts.push(`<line class="coil" x1="${px}" y1="${ROAD_Y + MH_R}" x2="${px}" y2="${cy - 9}"/>`
          + `<ellipse class="coil" cx="${px}" cy="${cy}" rx="17" ry="9"/>`
          + `<ellipse class="coil" cx="${px}" cy="${cy}" rx="10" ry="5"/>`
          + `<text x="${px}" y="${cy + 24}" text-anchor="middle" class="coil-label">COIL ${esc(metres(p.slackM))}</text>`);
      }
      parts.push(`<text x="${px}" y="${kmY}" text-anchor="middle" class="km">${esc(km(p.groundM))}</text>`);
    }
  }
  // OTDR at the test end
  const tx = x(pts.find((p) => p.id === `CO-${round.testEnd}`).groundM);
  parts.push(`<rect class="otdr-tag" x="${tx - 24}" y="${ROAD_Y - 124}" width="48" height="18" rx="3"/>`
    + `<text x="${tx}" y="${ROAD_Y - 111}" text-anchor="middle" class="otdr-text">OTDR</text>`);

  // Dig zones, in CO-A → CO-Z order (= keyboard order).
  if (zones) {
    for (const s of listSites(round)) {
      const b = siteBounds(round, s.id);
      const shape = s.kind === 'mh'
        ? `<circle class="hit" cx="${b.cx}" cy="${ROAD_Y}" r="22"/>`
        : `<rect class="hit" x="${b.x0}" y="${ROAD_Y - ROAD_H / 2}" width="${Math.max(b.x1 - b.x0, 8)}" height="${ROAD_H}" rx="6"/>`;
      const name = s.kind === 'mh' ? `Dig at manhole ${s.label.replace('Manhole ', '')}` : `Dig in s${s.label.slice(1)}`;
      parts.push(`<g class="zone" id="zone-${esc(safeId(s.id))}" data-site="${esc(s.id)}" role="button"
          tabindex="${interactive ? 0 : -1}" aria-disabled="${!interactive}" aria-label="${esc(name)}">
        ${shape}<text class="tip" x="${b.cx}" y="${ROAD_Y + 5}" text-anchor="middle">DIG?</text></g>`);
    }
  }

  // Earlier misses stay on the street.
  digs.filter((d) => d.status === 'incorrect').forEach((d, i, arr) => {
    const mx = d.x ?? siteBounds(round, d.siteId).cx;
    const fresh = i === arr.length - 1 && d.fresh ? ' data-anim="miss"' : '';
    parts.push(`<g class="miss"${fresh}><text x="${mx}" y="${ROAD_Y + 7}" text-anchor="middle" class="miss-x">✖</text>
      <text x="${mx}" y="${ROAD_Y + 26}" text-anchor="middle" class="miss-label">INTACT</text></g>`);
  });

  if (result) {
    const toX = x(result.groundFromAM);
    const naiveX = x(Math.max(0, Math.min(far, result.naiveGroundFromAM)));
    const rays = [0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
      const r = (a * Math.PI) / 180;
      return `<line class="ray" x1="${toX + Math.cos(r) * 8}" y1="${ROAD_Y + Math.sin(r) * 8}" x2="${toX + Math.cos(r) * 20}" y2="${ROAD_Y + Math.sin(r) * 20}"/>`;
    }).join('');
    const ghost = Math.abs(naiveX - toX) > 2
      ? `<line class="ghost" x1="${naiveX}" y1="${ROAD_Y - ROAD_H / 2}" x2="${naiveX}" y2="${ROAD_Y + ROAD_H / 2}"/>
         <text class="ghost-label" x="${naiveX}" y="${H - 6}" text-anchor="${naiveX > toX ? 'start' : 'end'}">TRACE SAID ${esc(km(result.breakM))}</text>`
      : '';
    parts.push(`<g class="result${result.pending ? ' pending' : ''}" data-anim="result">
      ${ghost}
      <g class="burst" data-anim="burst" style="transform-origin: ${toX}px ${ROAD_Y}px">${rays}</g>
      <text x="${toX}" y="${ROAD_Y + 8}" text-anchor="middle" class="cut-x">✱</text>
      <text x="${toX}" y="${H - 22}" text-anchor="middle" class="cut-label">CUT ≈ ${esc(km(result.groundFromAM))} FROM CO-A</text>
    </g>`);
  }

  if (showTruck) parts.push(truck(truckX ?? tx));

  const desc = `${label}, CO-A on the left to CO-Z on the right. The OTDR is connected at CO-${round.testEnd}. `
    + pts.map((p) => `${p.id} at ${km(p.groundM)}${p.kind === 'manhole' ? `, slack ${metres(p.slackM)}` : ''}`).join('; ') + '.';
  return `<svg class="chart street-chart" viewBox="0 0 ${W} ${H}" aria-label="${esc(desc)}" role="group">${parts.join('')}</svg>`;
}

/** Route table. Running cable distances are hidden until solved or full solution shown (FR-008). */
export function routeTable(round, revealCable) {
  const model = new Map(cableModel(round).map((r) => [r.pointId, r]));
  const rows = round.route.points.map((p) => {
    const m = model.get(p.id);
    const cable = !revealCable ? '' : `<td class="num">${m.inM === m.outM ? esc(km(m.inM)) : `${esc(km(m.inM))} → ${esc(km(m.outM))}`}</td>`;
    return `<tr><th scope="row">${esc(p.id)}${p.id === `CO-${round.testEnd}` ? ' (OTDR)' : ''}</th>
      <td class="num">${esc(km(p.groundM))}</td>
      <td class="num">${p.kind === 'manhole' ? esc(metres(p.slackM)) : '—'}</td>${cable}</tr>`;
  }).join('');
  const cableHead = revealCable ? `<th scope="col" class="num">Cable from CO-${esc(round.testEnd)} (in → out)</th>` : '';
  return `<p class="muted table-note">Route — street distances from CO-A.${revealCable ? '' : ' Running cable distances appear once the round is solved or the full solution is shown.'}</p>
  <div class="table-wrap" role="region" aria-label="Route table" tabindex="0">
    <table>
      <thead><tr><th scope="col">Point</th><th scope="col" class="num">Street distance from CO-A</th><th scope="col" class="num">Slack coiled here</th>${cableHead}</tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}
