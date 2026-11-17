// Pure: turn an evaluator Diagnosis into explanation text (contracts/engine-api.md).
// Every message is built from the evaluator's evidence — no hand-written answer key (FR-014).
// Wording follows research R9 (sources) and R6 (no field-precision claims).
import { km, dist } from './format.js';
import { cableModel, listSites } from './rules.js';

export const FIELD_NOTE = 'Model value — real OTDR distances are only accurate to about ±2%, '
  + 'so crews confirm against records and the nearest manholes.';

const other = (end) => (end === 'A' ? 'Z' : 'A');

function siteLabel(round, siteId) {
  const s = listSites(round).find((x) => x.id === siteId);
  return s ? s.label : siteId;
}

/** Manholes with slack that the cable passes before reaching pointId (test-end order). */
function slackPassedBefore(round, pointId) {
  const names = [];
  for (const row of cableModel(round)) {
    if (row.pointId === pointId) break;
    if (row.kind === 'manhole' && row.slackM > 0) names.push(row.pointId);
  }
  return names;
}

const joinNames = (a) => (a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);

export function explain(diagnosis, round) {
  const ev = diagnosis.evidence || {};
  const end = ev.testEnd;
  const d = ev.breakM;
  const traceLine = () => `The trace ends at ${km(d)} of cable, measured from the OTDR at CO-${end}.`;

  switch (diagnosis.reasonCode) {
    case 'no-selection':
      return { tone: 'guidance', headline: 'Choose a dig site first', lines: ['Click the street where the crew should dig. Nothing was counted.'] };

    case 'content-error':
      return { tone: 'error', headline: 'Content problem', lines: ['This round’s content is invalid, so it cannot be graded.'] };

    case 'correct': {
      const lines = [traceLine()];
      if (ev.siteKind === 'mh') {
        lines.push(`The cable enters ${ev.nextPointId} at ${km(ev.lowerCableM)} and leaves its coil at ${km(ev.upperCableM)}, `
          + `so the break is inside ${ev.nextPointId}'s slack coil — the damage is in the manhole itself.`);
        lines.push(`Model position: ${ev.nextPointId}, ${km(ev.groundFromAM)} from CO-A.`);
      } else {
        if (ev.slackBeforeM > 0) {
          lines.push(`Before ${ev.nextPointId} the cable has passed ${km(ev.slackBeforeM)} of slack stored in manhole coils, `
            + `so ${ev.nextPointId} sits at ${km(ev.upperCableM)} of cable.`);
        }
        lines.push(`The break is ${dist(d - ev.lowerCableM)} past ${ev.prevPointId} and ${dist(ev.upperCableM - d)} short of ${ev.nextPointId}.`);
        lines.push(`Model position: ${km(ev.groundFromAM)} from CO-A, ${dist(ev.upperCableM - d)} short of ${ev.nextPointId}.`);
      }
      return { tone: 'success', headline: 'Break found — the crew is on the cut', lines, note: FIELD_NOTE };
    }

    case 'picked-non-break-event': {
      const e = ev.event;
      const what = e.type === 'connector' ? 'connector (a reflective spike)' : 'splice (a small loss step with no reflection)';
      return {
        tone: 'retry',
        headline: `Intact cable — that’s a ${e.type}, not the break`,
        lines: [
          `The event at ${km(e.distanceM)} is a ${what}.`,
          `The backscatter continues after ${km(e.distanceM)}, so there is still fiber there — it is not the break.`,
          `The break is where the backscatter ends and the trace drops to the noise floor: ${km(d)}.`,
        ],
        next: 'Find the end of the fiber first, then match that distance to the route.',
      };
    }

    case 'wrong-end':
      return {
        tone: 'retry',
        headline: 'Intact cable — measured from the wrong end',
        lines: [
          `The OTDR is connected at CO-${end}, so ${km(d)} is measured from CO-${end}, not from CO-${other(end)}.`,
          `Walk the route from CO-${end}, adding slack in the order the light meets it.`,
        ],
        next: 'Check the test-end banner, then try again.',
      };

    case 'ignored-slack': {
      const lines = [`${km(d)} is cable length, not ground distance.`];
      const passed = joinNames(slackPassedBefore(round, ev.nextPointId));
      if (ev.siteKind === 'mh') {
        lines.push(`The cable enters ${ev.nextPointId} at ${km(ev.lowerCableM)}`
          + (ev.slackBeforeM > 0 ? ` (after ${km(ev.slackBeforeM)} of slack in ${passed})` : '')
          + ` and leaves its coil at ${km(ev.upperCableM)}; ${km(d)} falls between them.`);
      } else {
        lines.push(`Before ${ev.nextPointId} the cable has already passed ${km(ev.slackBeforeM)} of stored slack`
          + (passed ? ` (${passed})` : '') + `, so ${ev.nextPointId} sits at ${km(ev.upperCableM)} of cable.`);
        lines.push(`The break is ${dist(ev.upperCableM - d)} before ${ev.nextPointId}.`);
      }
      return { tone: 'retry', headline: 'Intact cable — the slack was not counted', lines, next: 'Add the slack stored before each manhole, then compare again.' };
    }

    case 'over-subtracted-slack': {
      const lines = ['Only slack the cable has fully passed counts.'];
      if (ev.siteKind === 'mh') {
        lines.push(`${ev.nextPointId}'s coil runs from ${km(ev.lowerCableM)} to ${km(ev.upperCableM)} of cable.`);
        lines.push(`The break at ${km(d)} is inside that coil, so the light never finished passing it — the damage is not before ${ev.nextPointId}.`);
      } else {
        lines.push(`The break at ${km(d)} lies between ${km(ev.lowerCableM)} and ${km(ev.upperCableM)} of cable.`);
      }
      return { tone: 'retry', headline: 'Intact cable — too much slack subtracted', lines, next: 'Subtract only the coils that end before the break distance.' };
    }

    default: { // wrong-site
      const c = ev.chosen;
      const label = siteLabel(round, c.siteId);
      const range = c.lowerCableM === c.upperCableM
        ? `is at ${km(c.lowerCableM)} of cable from CO-${end}`
        : `covers ${km(c.lowerCableM)} to ${km(c.upperCableM)} of cable from CO-${end}`;
      return {
        tone: 'retry',
        headline: 'Intact cable — the crew found no damage there',
        lines: [`${label} ${range}; the break is at ${km(d)}.`],
        next: 'Compare the break distance with each point’s cable distance from the test end.',
      };
    }
  }
}
