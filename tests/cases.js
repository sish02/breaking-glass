// Hand-transcribed fixtures and expected results.
// Sources: spec.md "Version-one content" and contracts/engine-api.md "Hand-checked expectations".
// NEVER compute these by calling the engine (constitution Principle I).

const mh = (id, groundM, slackM) => ({ id, kind: 'manhole', groundM, slackM });
const coA = { id: 'CO-A', kind: 'co', groundM: 0 };
const coZ = (groundM) => ({ id: 'CO-Z', kind: 'co', groundM });
const ev = (id, type, distanceM, reflective, lossDb) =>
  (lossDb === undefined ? { id, type, distanceM, reflective } : { id, type, distanceM, reflective, lossDb });
const round = (id, testEnd, points, events) => ({
  id,
  title: id,
  testEnd,
  route: { points },
  trace: { wavelengthNm: 1550, attenuationDbPerKm: 0.2, events },
  hints: ['method', 'worked step', 'solution'],
});

export const ROUNDS = {
  L1R1: round('L1R1', 'A',
    [coA, mh('MH-1', 2000, 0), mh('MH-2', 5000, 0), mh('MH-3', 9000, 0), coZ(12000)],
    [ev('e0', 'launch', 0, true), ev('e1', 'splice', 5000, false, 0.08), ev('e2', 'end', 7400, true)]),
  L1R2: round('L1R2', 'A',
    [coA, mh('MH-1', 1500, 0), mh('MH-2', 3500, 0), mh('MH-3', 6000, 0), coZ(8000)],
    [ev('e0', 'launch', 0, true), ev('e1', 'connector', 1500, true, 0.5), ev('e2', 'end', 4250, false)]),
  L2R1: round('L2R1', 'A',
    [coA, mh('MH-1', 1000, 50), mh('MH-2', 2000, 50), mh('MH-3', 3000, 50), coZ(4000)],
    [ev('e0', 'launch', 0, true), ev('e1', 'end', 3060, false)]),
  L2R2: round('L2R2', 'A',
    [coA, mh('MH-1', 800, 30), mh('MH-2', 1900, 100), mh('MH-3', 2600, 30), mh('MH-4', 3700, 100), coZ(5000)],
    [ev('e0', 'launch', 0, true), ev('e1', 'end', 2700, true)]),
  L3R1: round('L3R1', 'A',
    [coA, mh('MH-1', 1000, 50), mh('MH-2', 2000, 50), mh('MH-3', 3000, 50), coZ(4000)],
    [ev('e0', 'launch', 0, true), ev('e1', 'end', 2075, false)]),
  L3R2: round('L3R2', 'Z',
    [coA, mh('MH-1', 1200, 40), mh('MH-2', 2500, 40), mh('MH-3', 4000, 40), coZ(5500)],
    [ev('e0', 'launch', 0, true), ev('e1', 'end', 2300, true)]),
};

/** The correct dig site per round (spec.md table). */
export const CORRECT = {
  L1R1: 'span:MH-2~MH-3',
  L1R2: 'span:MH-2~MH-3',
  L2R1: 'span:MH-2~MH-3',
  L2R2: 'span:MH-2~MH-3',
  L3R1: 'mh:MH-2',
  L3R2: 'span:MH-2~MH-3',
};

/** contracts/engine-api.md "Hand-checked expectations". */
export const EVALUATIONS = [
  { round: 'L1R1', answer: 'span:MH-2~MH-3', status: 'correct', reason: 'correct', evidence: { groundFromAM: 7400 } },
  { round: 'L1R1', answer: 'mh:MH-2', status: 'incorrect', reason: 'picked-non-break-event', evidence: { eventId: 'e1' } },
  { round: 'L1R2', answer: 'span:MH-2~MH-3', status: 'correct', reason: 'correct', evidence: { groundFromAM: 4250 } },
  { round: 'L1R2', answer: 'mh:MH-1', status: 'incorrect', reason: 'picked-non-break-event', evidence: { eventId: 'e1' } },
  { round: 'L2R1', answer: 'span:MH-2~MH-3', status: 'correct', reason: 'correct',
    evidence: { slackBeforeM: 100, upperCableM: 3100, groundFromAM: 2960 } },
  { round: 'L2R1', answer: 'span:MH-3~CO-Z', status: 'incorrect', reason: 'ignored-slack', evidence: {} },
  { round: 'L2R2', answer: 'span:MH-2~MH-3', status: 'correct', reason: 'correct',
    evidence: { slackBeforeM: 130, lowerCableM: 2030, upperCableM: 2730, groundFromAM: 2570 } },
  { round: 'L2R2', answer: 'span:MH-3~MH-4', status: 'incorrect', reason: 'ignored-slack', evidence: {} },
  { round: 'L3R1', answer: 'mh:MH-2', status: 'correct', reason: 'correct', evidence: { lowerCableM: 2050, upperCableM: 2100 } },
  { round: 'L3R1', answer: 'span:MH-2~MH-3', status: 'incorrect', reason: 'ignored-slack', evidence: {} },
  { round: 'L3R1', answer: 'span:MH-1~MH-2', status: 'incorrect', reason: 'over-subtracted-slack', evidence: {} },
  { round: 'L3R2', answer: 'span:MH-2~MH-3', status: 'correct', reason: 'correct',
    evidence: { testEnd: 'Z', lowerCableM: 1540, upperCableM: 3040, groundFromAM: 3240 } },
  { round: 'L3R2', answer: 'span:MH-1~MH-2', status: 'incorrect', reason: 'wrong-end', evidence: {} },
  { round: 'L2R1', answer: null, status: 'invalid-input', reason: 'no-selection', evidence: {} },
  { round: 'L2R1', answer: 'span:MH-9~MH-10', status: 'invalid-input', reason: 'no-selection', evidence: {} },
  { round: 'L2R1', answer: 'span:CO-A~MH-1', status: 'incorrect', reason: 'wrong-site', evidence: {} },
];

/** data-model.md CableModel hand-check for L2R1 (test end A). */
export const L2R1_CABLE_MODEL = [
  { pointId: 'CO-A', inM: 0, outM: 0 },
  { pointId: 'MH-1', inM: 1000, outM: 1050 },
  { pointId: 'MH-2', inM: 2050, outM: 2100 },
  { pointId: 'MH-3', inM: 3100, outM: 3150 },
  { pointId: 'CO-Z', inM: 4150, outM: 4150 },
];

/** L3R2 is tested from CO-Z: model rows are in test-end order. */
export const L3R2_CABLE_MODEL = [
  { pointId: 'CO-Z', inM: 0, outM: 0 },
  { pointId: 'MH-3', inM: 1500, outM: 1540 },
  { pointId: 'MH-2', inM: 3040, outM: 3080 },
  { pointId: 'MH-1', inM: 4380, outM: 4420 },
  { pointId: 'CO-A', inM: 5620, outM: 5620 },
];

/** listSites order for L2R1 (CO-A → CO-Z, spans and manholes interleaved). */
export const L2R1_SITES = [
  'span:CO-A~MH-1', 'mh:MH-1', 'span:MH-1~MH-2', 'mh:MH-2', 'span:MH-2~MH-3', 'mh:MH-3', 'span:MH-3~CO-Z',
];

/** A minimal valid content document built from the six literal rounds (for state tests). */
export function contentDoc() {
  const src = [{ id: 's1', title: 'Source', url: 'https://example.org/', section: 'S', claim: 'C' }];
  const level = (id, lo, roundIds) => ({
    id,
    title: id,
    learningOutcome: lo,
    briefing: { summary: 's', paragraphs: ['p'], workedExample: 'w', limits: [] },
    sourceIds: ['s1'],
    rounds: roundIds.map((r) => structuredClone(ROUNDS[r])),
  });
  return {
    schemaVersion: 1,
    sources: src,
    levels: [level('L1', 'LO1', ['L1R1', 'L1R2']), level('L2', 'LO2', ['L2R1', 'L2R2']), level('L3', 'LO3', ['L3R1', 'L3R2'])],
  };
}
