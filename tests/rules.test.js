import { test, assertEqual, assertDeepEqual } from './harness.js';
import { ROUNDS, CORRECT, EVALUATIONS, L2R1_CABLE_MODEL, L3R2_CABLE_MODEL, L2R1_SITES } from './cases.js';
import { cableModel, listSites, locate, evaluate } from '../engine/rules.js';

test('rules/listSites/L2R1-order', () => {
  assertDeepEqual(listSites(ROUNDS.L2R1).map((s) => s.id), L2R1_SITES);
});

test('rules/listSites/labels', () => {
  const sites = listSites(ROUNDS.L2R1);
  assertEqual(sites[0].label, 'Span CO-A → MH-1');
  assertEqual(sites[1].label, 'Manhole MH-1');
});

test('rules/listSites/far-end-test-keeps-A-to-Z-order', () => {
  const ids = listSites(ROUNDS.L3R2).map((s) => s.id);
  assertEqual(ids[0], 'span:CO-A~MH-1');
  assertEqual(ids[ids.length - 1], 'span:MH-3~CO-Z');
});

test('rules/cableModel/L2R1', () => {
  assertDeepEqual(cableModel(ROUNDS.L2R1).map(({ pointId, inM, outM }) => ({ pointId, inM, outM })), L2R1_CABLE_MODEL);
});

test('rules/cableModel/L3R2-from-CO-Z', () => {
  assertDeepEqual(cableModel(ROUNDS.L3R2).map(({ pointId, inM, outM }) => ({ pointId, inM, outM })), L3R2_CABLE_MODEL);
});

for (const [rid, site] of Object.entries(CORRECT)) {
  test(`rules/locate/${rid}`, () => {
    assertEqual(locate(ROUNDS[rid]).siteId, site);
  });
}

EVALUATIONS.forEach((c, i) => {
  test(`rules/evaluate/${c.round}/${c.answer}/${i}`, () => {
    const d = evaluate(ROUNDS[c.round], c.answer);
    assertEqual(d.status, c.status, 'status');
    assertEqual(d.reasonCode, c.reason, 'reasonCode');
    for (const [k, v] of Object.entries(c.evidence)) {
      assertEqual(d.evidence[k], v, `evidence.${k}`);
    }
    if (c.status === 'correct' || c.status === 'incorrect') {
      assertEqual(d.expected, CORRECT[c.round], 'expected');
    }
  });
});

test('rules/evaluate/is-pure', () => {
  const before = JSON.stringify(ROUNDS.L2R1);
  const a = evaluate(ROUNDS.L2R1, 'span:MH-3~CO-Z');
  const b = evaluate(ROUNDS.L2R1, 'span:MH-3~CO-Z');
  assertDeepEqual(a, b);
  assertEqual(JSON.stringify(ROUNDS.L2R1), before, 'round unchanged');
});
