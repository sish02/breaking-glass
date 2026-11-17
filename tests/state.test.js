import { test, assertEqual, assertTrue, assertDeepEqual } from './harness.js';
import { contentDoc, CORRECT } from './cases.js';
import { createSession, reduce, currentRound } from '../engine/state.js';

const doc = contentDoc();
const at = (...actions) => actions.reduce((s, a) => reduce(s, a), createSession(doc));
const rs = (s, id) => s.roundState[id];
const inRound = () => at({ type: 'chooseTeamSize', n: 3 }, { type: 'startLevel' }, { type: 'firePulse' });

// ---------- US1 ----------
test('state/US1/starts-in-setup', () => {
  const s = createSession(doc);
  assertEqual(s.phase, 'setup');
  assertEqual(s.teamSize, null);
});

test('state/US1/team-size-opens-L1-briefing', () => {
  const s = at({ type: 'chooseTeamSize', n: 3 });
  assertEqual(s.phase, 'briefing');
  assertEqual(s.levelIndex, 0);
  assertEqual(s.teamSize, 3);
});

test('state/US1/invalid-team-size-ignored', () => {
  const s0 = createSession(doc);
  assertTrue(reduce(s0, { type: 'chooseTeamSize', n: 5 }) === s0, 'unchanged object');
});

test('state/US1/startLevel-opens-L1R1', () => {
  const s = inRound();
  assertEqual(s.phase, 'round');
  assertEqual(currentRound(s).id, 'L1R1');
});

test('state/US1/select-changes-no-counts', () => {
  const s = reduce(inRound(), { type: 'selectSite', siteId: 'mh:MH-2' });
  assertEqual(rs(s, 'L1R1').selectedSite, 'mh:MH-2');
  assertEqual(rs(s, 'L1R1').attempts, 0);
});

test('state/US1/highlight-event-changes-no-counts', () => {
  const s = reduce(inRound(), { type: 'highlightEvent', eventId: 'e1' });
  assertEqual(rs(s, 'L1R1').highlightedEvent, 'e1');
  assertEqual(rs(s, 'L1R1').attempts, 0);
  assertEqual(rs(s, 'L1R1').assistance, 0);
});

test('state/US1/no-selection-submit-is-guidance-only', () => {
  const s = reduce(inRound(), { type: 'submit' });
  assertEqual(rs(s, 'L1R1').attempts, 0);
  assertEqual(rs(s, 'L1R1').solved, false);
  assertEqual(rs(s, 'L1R1').lastDiagnosis.reasonCode, 'no-selection');
});

test('state/US1/wrong-then-right', () => {
  let s = reduce(inRound(), { type: 'selectSite', siteId: 'mh:MH-2' });
  s = reduce(s, { type: 'submit' });
  assertEqual(rs(s, 'L1R1').attempts, 1);
  assertEqual(rs(s, 'L1R1').solved, false);
  assertEqual(rs(s, 'L1R1').lastDiagnosis.reasonCode, 'picked-non-break-event');
  s = reduce(s, { type: 'selectSite', siteId: CORRECT.L1R1 });
  s = reduce(s, { type: 'submit' });
  assertEqual(rs(s, 'L1R1').attempts, 2);
  assertEqual(rs(s, 'L1R1').solved, true);
});

test('state/US1/duplicate-submit-after-success-no-change', () => {
  let s = reduce(inRound(), { type: 'selectSite', siteId: CORRECT.L1R1 });
  s = reduce(s, { type: 'submit' });
  assertTrue(reduce(s, { type: 'submit' }) === s, 'submit after solve returns same state');
  assertTrue(reduce(s, { type: 'selectSite', siteId: 'mh:MH-1' }) === s, 'selection locked after solve');
});

test('state/US1/next-requires-solved', () => {
  const s = inRound();
  assertTrue(reduce(s, { type: 'next' }) === s);
});

test('state/US1/next-opens-L1R2', () => {
  let s = reduce(inRound(), { type: 'selectSite', siteId: CORRECT.L1R1 });
  s = reduce(s, { type: 'submit' });
  s = reduce(s, { type: 'next' });
  assertEqual(s.phase, 'round');
  assertEqual(currentRound(s).id, 'L1R2');
  assertEqual(s.sessionRound, 1);
});

test('state/US1/reducer-is-pure', () => {
  const s0 = inRound();
  const snapshot = JSON.stringify(s0.roundState);
  reduce(s0, { type: 'selectSite', siteId: 'mh:MH-2' });
  assertEqual(JSON.stringify(s0.roundState), snapshot);
});

// ---------- US2 ----------
import { levelRecap, sessionSummary } from '../engine/state.js';

const solve = (s) => {
  const id = currentRound(s).id;
  s = reduce(s, { type: 'firePulse' });
  return reduce(s, { type: 'dig', siteId: CORRECT[id] });
};
const playAll = () => {
  let s = inRound();
  for (let i = 0; i < 6; i++) {
    s = solve(s);
    s = reduce(s, { type: 'next' });
    if (s.phase === 'briefing') s = reduce(s, { type: 'startLevel' });
  }
  return s;
};

test('state/US2/help-steps-0-to-3-then-stop', () => {
  let s = inRound();
  const counts = [];
  for (let i = 0; i < 4; i++) { s = reduce(s, { type: 'requestHelp' }); counts.push(rs(s, 'L1R1').assistance); }
  assertDeepEqual(counts, [1, 2, 3, 3]);
});

test('state/US2/help-available-with-zero-attempts', () => {
  const s = reduce(inRound(), { type: 'requestHelp' });
  assertEqual(rs(s, 'L1R1').attempts, 0);
  assertEqual(rs(s, 'L1R1').assistance, 1);
});

test('state/US2/help-never-selects-or-submits', () => {
  let s = reduce(inRound(), { type: 'selectSite', siteId: 'mh:MH-1' });
  s = reduce(s, { type: 'requestHelp' });
  s = reduce(s, { type: 'requestHelp' });
  s = reduce(s, { type: 'requestHelp' });
  assertEqual(rs(s, 'L1R1').selectedSite, 'mh:MH-1');
  assertEqual(rs(s, 'L1R1').attempts, 0);
  assertEqual(rs(s, 'L1R1').solved, false);
  assertEqual(rs(s, 'L1R1').lastDiagnosis, null);
});

test('state/US2/help-ignored-once-solved', () => {
  const s = solve(inRound());
  assertTrue(reduce(s, { type: 'requestHelp' }) === s);
});

test('state/US2/level-boundary-opens-next-briefing', () => {
  let s = solve(inRound());
  s = reduce(s, { type: 'next' });          // → L1R2
  s = solve(s);
  s = reduce(s, { type: 'next' });          // → L2 briefing
  assertEqual(s.phase, 'briefing');
  assertEqual(s.levelIndex, 1);
  s = reduce(s, { type: 'startLevel' });
  assertEqual(currentRound(s).id, 'L2R1');
  assertEqual(s.sessionRound, 2);
});

test('state/US2/final-next-opens-summary', () => {
  const s = playAll();
  assertEqual(s.phase, 'summary');
  const sum = sessionSummary(s);
  assertEqual(sum.totals.solved, 6);
  assertEqual(sum.totals.attempts, 6);
  assertEqual(sum.totals.assistance, 0);
  assertEqual(sum.levels.length, 3);
  assertEqual(sum.levels[0].rounds.length, 2);
});

test('state/US2/level-recap-counts', () => {
  let s = reduce(inRound(), { type: 'requestHelp' });
  s = reduce(s, { type: 'selectSite', siteId: 'mh:MH-2' });
  s = reduce(s, { type: 'submit' });        // wrong
  s = solve(s);                             // right (attempt 2)
  s = reduce(s, { type: 'next' });
  s = solve(s);                             // L1R2 attempt 1
  assertDeepEqual(levelRecap(s, 0), { solved: 2, rounds: 2, attempts: 3, assistance: 1 });
});

test('state/US2/restart-cancel-keeps-everything', () => {
  const s0 = solve(inRound());
  const s1 = reduce(s0, { type: 'requestRestart' });
  assertEqual(s1.restartPending, true);
  const s2 = reduce(s1, { type: 'cancelRestart' });
  assertDeepEqual(s2, s0);
});

test('state/US2/restart-confirm-clears-to-setup', () => {
  const s = reduce(reduce(solve(inRound()), { type: 'requestRestart' }), { type: 'confirmRestart' });
  assertEqual(s.phase, 'setup');
  assertEqual(s.teamSize, null);
  assertEqual(rs(s, 'L1R1').attempts, 0);
  assertEqual(rs(s, 'L1R1').solved, false);
  assertEqual(s.restartPending, false);
});

test('state/US2/confirm-without-request-ignored', () => {
  const s = solve(inRound());
  assertTrue(reduce(s, { type: 'confirmRestart' }) === s);
});

// ---------- US3 ----------
import { roleFor } from '../engine/state.js';

test('state/US3/roles-n3-r0', () => {
  assertEqual(roleFor(1, 0, 3), 'OTDR Reader');
  assertEqual(roleFor(2, 0, 3), 'Route Mapper');
  assertEqual(roleFor(3, 0, 3), 'Dispatcher');
});

test('state/US3/roles-n3-r1', () => {
  assertEqual(roleFor(1, 1, 3), 'Route Mapper');
  assertEqual(roleFor(2, 1, 3), 'Dispatcher');
  assertEqual(roleFor(3, 1, 3), 'OTDR Reader');
});

test('state/US3/roles-n4-r0-safety-lead', () => {
  assertEqual(roleFor(4, 0, 4), 'Safety Lead');
});

test('state/US3/roles-n4-r5', () => {
  assertEqual(roleFor(1, 5, 4), 'Route Mapper');
  assertEqual(roleFor(2, 5, 4), 'Dispatcher');
  assertEqual(roleFor(3, 5, 4), 'Safety Lead');
  assertEqual(roleFor(4, 5, 4), 'OTDR Reader');
});

test('state/US3/no-safety-lead-with-3', () => {
  for (let r = 0; r < 6; r++) for (let p = 1; p <= 3; p++) assertTrue(roleFor(p, r, 3) !== 'Safety Lead');
});

// ---------- Redesign: Fire OTDR + click-to-dig ----------
const unfired = () => at({ type: 'chooseTeamSize', n: 3 }, { type: 'startLevel' });

test('state/fire/round-starts-unfired', () => {
  assertEqual(rs(unfired(), 'L1R1').fired, false);
});

test('state/fire/dig-before-fire-ignored', () => {
  const s = unfired();
  assertTrue(reduce(s, { type: 'dig', siteId: CORRECT.L1R1 }) === s, 'dig ignored');
  assertTrue(reduce(s, { type: 'submit' }) === s, 'submit ignored');
});

test('state/fire/fire-is-idempotent-and-free', () => {
  const s = reduce(unfired(), { type: 'firePulse' });
  assertEqual(rs(s, 'L1R1').fired, true);
  assertEqual(rs(s, 'L1R1').attempts, 0);
  assertTrue(reduce(s, { type: 'firePulse' }) === s, 'second fire changes nothing');
});

test('state/dig/wrong-dig-is-one-attempt-and-marked', () => {
  const s = reduce(inRound(), { type: 'dig', siteId: 'mh:MH-2' });
  assertEqual(rs(s, 'L1R1').attempts, 1);
  assertEqual(rs(s, 'L1R1').solved, false);
  assertEqual(rs(s, 'L1R1').lastDiagnosis.reasonCode, 'picked-non-break-event');
  assertDeepEqual(rs(s, 'L1R1').digs, [{ siteId: 'mh:MH-2', status: 'incorrect' }]);
});

test('state/dig/right-dig-solves-and-locks', () => {
  let s = reduce(inRound(), { type: 'dig', siteId: 'span:CO-A~MH-1' });
  s = reduce(s, { type: 'dig', siteId: CORRECT.L1R1 });
  assertEqual(rs(s, 'L1R1').solved, true);
  assertEqual(rs(s, 'L1R1').attempts, 2);
  assertEqual(rs(s, 'L1R1').digs.length, 2);
  assertTrue(reduce(s, { type: 'dig', siteId: 'mh:MH-1' }) === s, 'no digs after solve');
});

test('state/dig/unknown-site-is-guidance-not-attempt', () => {
  const s = reduce(inRound(), { type: 'dig', siteId: 'span:MH-8~MH-9' });
  assertEqual(rs(s, 'L1R1').attempts, 0);
  assertEqual(rs(s, 'L1R1').digs.length, 0);
});
