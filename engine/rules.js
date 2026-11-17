// Pure domain rules: where is the break, and what mistake does a wrong dig site represent?
// No DOM, timers, network, randomness or global state. See contracts/engine-api.md.
//
// Model (spec FR-011): walk the route from the CO where the OTDR is connected (the test end),
// accumulating slack stored in manhole coils:
//   in(k)  = groundFromTestEnd(k) + slack of manholes before k
//   out(k) = in(k) + slack(k)
// The break d lies in the span (prev → k) if out(prev) ≤ d < in(k), or inside manhole k's coil if
// in(k) ≤ d ≤ out(k).

const other = (end) => (end === 'A' ? 'Z' : 'A');

function points(round) {
  return round.route.points;
}

function farGround(round) {
  const p = points(round);
  return p[p.length - 1].groundM;
}

/** Index of each point in CO-A → CO-Z order. */
function routeIndex(round) {
  return new Map(points(round).map((p, i) => [p.id, i]));
}

export function spanId(round, a, b) {
  const idx = routeIndex(round);
  return idx.get(a) < idx.get(b) ? `span:${a}~${b}` : `span:${b}~${a}`;
}

/** Cable model in test-end order (data-model.md "CableModel"). */
export function cableModel(round, testEnd = round.testEnd) {
  const far = farGround(round);
  const ordered = testEnd === 'A' ? points(round) : [...points(round)].reverse();
  let slackBefore = 0;
  return ordered.map((p) => {
    const g = testEnd === 'A' ? p.groundM : far - p.groundM;
    const s = p.kind === 'manhole' ? (p.slackM || 0) : 0;
    const inM = g + slackBefore;
    const row = { pointId: p.id, kind: p.kind, groundFromTestEndM: g, slackM: s, slackBeforeM: slackBefore, inM, outM: inM + s };
    slackBefore += s;
    return row;
  });
}

/** Every span and manhole, in CO-A → CO-Z order, never filtered or reordered (FR-010). */
export function listSites(round) {
  const out = [];
  points(round).forEach((p, i, arr) => {
    if (i > 0) {
      out.push({ id: `span:${arr[i - 1].id}~${p.id}`, kind: 'span', label: `Span ${arr[i - 1].id} → ${p.id}` });
    }
    if (p.kind === 'manhole') out.push({ id: `mh:${p.id}`, kind: 'mh', label: `Manhole ${p.id}` });
  });
  return out;
}

export function breakEvent(round) {
  const ends = round.trace.events.filter((e) => e.type === 'end');
  return ends.length === 1 ? ends[0] : null;
}

/** Place a cable distance d (from testEnd) using the full slack rule. */
function placeByCable(round, d, testEnd) {
  const m = cableModel(round, testEnd);
  const far = farGround(round);
  for (let k = 1; k < m.length; k++) {
    const prev = m[k - 1];
    const cur = m[k];
    if (prev.outM <= d && d < cur.inM) {
      const groundFromTestEndM = prev.groundFromTestEndM + (d - prev.outM);
      return {
        siteId: spanId(round, prev.pointId, cur.pointId),
        kind: 'span',
        breakM: d,
        testEnd,
        prevPointId: prev.pointId,
        nextPointId: cur.pointId,
        slackBeforeM: cur.slackBeforeM,
        lowerCableM: prev.outM,
        upperCableM: cur.inM,
        groundFromTestEndM,
        groundFromAM: testEnd === 'A' ? groundFromTestEndM : far - groundFromTestEndM,
      };
    }
    if (cur.kind === 'manhole' && cur.inM <= d && d <= cur.outM) {
      return {
        siteId: `mh:${cur.pointId}`,
        kind: 'mh',
        breakM: d,
        testEnd,
        prevPointId: prev.pointId,
        nextPointId: cur.pointId,
        slackBeforeM: cur.slackBeforeM,
        lowerCableM: cur.inM,
        upperCableM: cur.outM,
        groundFromTestEndM: cur.groundFromTestEndM,
        groundFromAM: testEnd === 'A' ? cur.groundFromTestEndM : far - cur.groundFromTestEndM,
      };
    }
  }
  return null; // at or beyond the far CO
}

/** Place a value treated as ground distance from testEnd (used only to diagnose mistakes). */
function placeByGround(round, g, testEnd) {
  const m = cableModel(round, testEnd);
  for (let k = 1; k < m.length; k++) {
    const prev = m[k - 1];
    const cur = m[k];
    if (cur.kind === 'manhole' && g === cur.groundFromTestEndM) return { siteId: `mh:${cur.pointId}` };
    if (prev.groundFromTestEndM <= g && g < cur.groundFromTestEndM) {
      return { siteId: spanId(round, prev.pointId, cur.pointId) };
    }
  }
  return null;
}

/**
 * Locate the break. Options (diagnosis only): fromWrongEnd, ignoreSlack, subtractCoilContainingBreak.
 * Returns a Location or null when the round has no single break or it lies beyond the route.
 */
export function locate(round, opts = {}) {
  const be = breakEvent(round);
  if (!be) return null;
  const d = be.distanceM;
  const testEnd = opts.fromWrongEnd ? other(round.testEnd) : round.testEnd;
  if (opts.ignoreSlack) return placeByGround(round, d, testEnd);
  if (opts.subtractCoilContainingBreak) {
    const passed = cableModel(round, testEnd)
      .filter((row) => row.kind === 'manhole' && row.inM <= d)
      .reduce((sum, row) => sum + row.slackM, 0);
    return placeByGround(round, d - passed, testEnd);
  }
  return placeByCable(round, d, testEnd);
}

/** Cable range (from the test end) covered by a dig site. */
function siteCableRange(round, siteId) {
  const rows = new Map(cableModel(round).map((r) => [r.pointId, r]));
  if (siteId.startsWith('mh:')) {
    const r = rows.get(siteId.slice(3));
    return { siteId, lowerCableM: r.inM, upperCableM: r.outM };
  }
  const [a, b] = siteId.slice(5).split('~').map((id) => rows.get(id));
  const [near, far] = a.inM <= b.inM ? [a, b] : [b, a];
  return { siteId, lowerCableM: near.outM, upperCableM: far.inM };
}

const site = (loc) => (loc ? loc.siteId : null);

/** Grade a dig-site answer (contracts/engine-api.md "evaluate order"). */
export function evaluate(round, answer) {
  const sites = listSites(round).map((s) => s.id);
  if (!answer || !sites.includes(answer)) {
    return { status: 'invalid-input', expected: null, reasonCode: 'no-selection', evidence: {} };
  }
  const loc = locate(round);
  if (!loc) {
    return { status: 'content-error', expected: null, reasonCode: 'content-error', evidence: {} };
  }
  const evidence = {
    breakM: loc.breakM,
    testEnd: round.testEnd,
    siteKind: loc.kind,
    prevPointId: loc.prevPointId,
    nextPointId: loc.nextPointId,
    slackBeforeM: loc.slackBeforeM,
    lowerCableM: loc.lowerCableM,
    upperCableM: loc.upperCableM,
    groundFromAM: loc.groundFromAM,
  };
  const result = (status, reasonCode, extra = {}) => ({
    status,
    expected: loc.siteId,
    reasonCode,
    evidence: { ...evidence, chosen: siteCableRange(round, answer), ...extra },
  });

  if (answer === loc.siteId) return result('correct', 'correct');

  const misleading = round.trace.events.find((e) => (e.type === 'connector' || e.type === 'splice')
    && site(placeByCable(round, e.distanceM, round.testEnd)) === answer);
  if (misleading) return result('incorrect', 'picked-non-break-event', { eventId: misleading.id, event: misleading });
  if (site(locate(round, { fromWrongEnd: true })) === answer) return result('incorrect', 'wrong-end');
  if (site(locate(round, { ignoreSlack: true })) === answer) return result('incorrect', 'ignored-slack');
  if (site(locate(round, { subtractCoilContainingBreak: true })) === answer) return result('incorrect', 'over-subtracted-slack');
  return result('incorrect', 'wrong-site');
}
