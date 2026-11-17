import { test, env, assertEqual, assertTrue, assertDeepEqual } from './harness.js';
import { baseDoc, INVALID } from './fixtures/invalid.js';
import { ROUNDS, CORRECT } from './cases.js';
import { validateContent } from '../engine/content.js';
import { evaluate } from '../engine/rules.js';

test('content/base-fixture-is-valid', () => {
  const v = validateContent(baseDoc());
  assertTrue(v.ok, 'base fixture should validate: ' + JSON.stringify(v.errors));
});

for (const f of INVALID) {
  test(`content/invalid/${f.name}`, () => {
    const doc = baseDoc();
    f.mutate(doc);
    const v = validateContent(doc);
    assertEqual(v.ok, false, 'ok');
    const hit = v.errors.some((e) => e.code === f.code
      && (f.roundId ? e.roundId === f.roundId : e.levelId === f.levelId));
    assertTrue(hit, `expected ${f.code}; got ${JSON.stringify(v.errors)}`);
  });
}

test('content/collects-all-errors', () => {
  const doc = baseDoc();
  const second = structuredClone(doc.levels[0].rounds[0]);
  second.id = 'L2R2';
  doc.levels[0].rounds.push(second);
  doc.levels[0].rounds[0].trace.events[1].distanceM = 3090; // ambiguous
  doc.levels[0].rounds[1].hints = ['only one'];             // hint-count
  const v = validateContent(doc);
  assertTrue(v.errors.some((e) => e.roundId === 'L2R1' && e.code === 'ambiguous-break'), 'L2R1 reported');
  assertTrue(v.errors.some((e) => e.roundId === 'L2R2' && e.code === 'hint-count'), 'L2R2 reported');
});

test('content/never-throws-on-garbage', () => {
  for (const bad of [null, 42, 'x', {}, { levels: 'no' }, { schemaVersion: 1, sources: [], levels: [{}] }]) {
    const v = validateContent(bad);
    assertEqual(v.ok, false);
  }
});

test('content/shipped-levels-json-valid', async () => {
  const doc = await env.loadJSON('data/levels.json');
  const v = validateContent(doc);
  assertTrue(v.ok, JSON.stringify(v.errors));
});

test('content/shipped-has-3-levels-x-2-rounds', async () => {
  const doc = await env.loadJSON('data/levels.json');
  assertEqual(doc.levels.length, 3, 'levels');
  for (const l of doc.levels) assertEqual(l.rounds.length, 2, `rounds in ${l.id}`);
});

// The shipped data must match the spec's decision-relevant values exactly.
test('content/shipped-rounds-match-spec-values', async () => {
  const doc = await env.loadJSON('data/levels.json');
  const shipped = Object.fromEntries(doc.levels.flatMap((l) => l.rounds).map((r) => [r.id, r]));
  for (const [rid, spec] of Object.entries(ROUNDS)) {
    const s = shipped[rid];
    assertTrue(s, `round ${rid} present`);
    assertEqual(s.testEnd, spec.testEnd, `${rid} testEnd`);
    assertDeepEqual(s.route.points, spec.route.points, `${rid} route`);
    assertDeepEqual(
      s.trace.events.map(({ type, distanceM, reflective }) => ({ type, distanceM, reflective })),
      spec.trace.events.map(({ type, distanceM, reflective }) => ({ type, distanceM, reflective })),
      `${rid} events`);
  }
});

test('content/shipped-rounds-grade-as-spec', async () => {
  const doc = await env.loadJSON('data/levels.json');
  for (const r of doc.levels.flatMap((l) => l.rounds)) {
    assertEqual(evaluate(r, CORRECT[r.id]).status, 'correct', r.id);
  }
});

// T041 / SC-008: a trial seventh round needs only content — no engine change.
// Hand-computed: MH-1 at 600 m stores 70 m; MH-2 at 1800 m. Break at 1500 m of cable from CO-A.
// MH-1 coil 600–670; MH-2 entered at 1870. 1500 lies in span MH-1 → MH-2, ground 600 + (1500 − 670) = 1430 m.
test('content/trial-seventh-round-is-content-only', async () => {
  const doc = await env.loadJSON('data/levels.json');
  const trial = {
    id: 'L3R3',
    title: 'Trial round',
    testEnd: 'A',
    route: { points: [
      { id: 'CO-A', kind: 'co', groundM: 0 },
      { id: 'MH-1', kind: 'manhole', groundM: 600, slackM: 70 },
      { id: 'MH-2', kind: 'manhole', groundM: 1800, slackM: 20 },
      { id: 'CO-Z', kind: 'co', groundM: 2500 },
    ] },
    trace: { wavelengthNm: 1550, attenuationDbPerKm: 0.2, events: [
      { id: 'e0', type: 'launch', distanceM: 0, reflective: true },
      { id: 'e1', type: 'end', distanceM: 1500, reflective: false },
    ] },
    hints: ['m', 'w', 's'],
  };
  doc.levels[2].rounds.push(trial);
  const v = validateContent(doc);
  assertTrue(v.ok, JSON.stringify(v.errors));
  const d = evaluate(trial, 'span:MH-1~MH-2');
  assertEqual(d.status, 'correct');
  assertEqual(d.evidence.groundFromAM, 1430);
  assertEqual(evaluate(trial, 'span:MH-2~CO-Z').status, 'incorrect');
});

test('content/briefing-summary-required', () => {
  const doc = baseDoc();
  delete doc.levels[0].briefing.summary;
  const v = validateContent(doc);
  assertTrue(v.errors.some((e) => e.code === 'missing-field' && e.levelId === 'L2'), JSON.stringify(v.errors));
});

test('content/bad-demo-is-reported', () => {
  const doc = baseDoc();
  const r = doc.levels[0].rounds[0];
  doc.levels[0].briefing.demo = { testEnd: 'A', route: structuredClone(r.route), trace: structuredClone(r.trace) };
  doc.levels[0].briefing.demo.trace.events[1].distanceM = 3090; // ambiguous
  const v = validateContent(doc);
  assertTrue(v.errors.some((e) => e.code === 'ambiguous-break' && e.roundId === 'L2 demo'), JSON.stringify(v.errors));
});
