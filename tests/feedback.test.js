import { test, assertEqual, assertIncludes, assertTrue } from './harness.js';
import { ROUNDS, CORRECT } from './cases.js';
import { evaluate } from '../engine/rules.js';
import { explain } from '../engine/feedback.js';

const text = (fb) => [fb.headline, ...fb.lines, fb.next || '', fb.note || ''].join(' | ');
const fbFor = (rid, answer) => explain(evaluate(ROUNDS[rid], answer), ROUNDS[rid]);

test('feedback/correct-L2R1', () => {
  const fb = fbFor('L2R1', CORRECT.L2R1);
  assertEqual(fb.tone, 'success');
  assertIncludes(fb.headline, 'Break found');
  const t = text(fb);
  assertIncludes(t, '2.960 km from CO-A');
  assertIncludes(t, '40 m short of MH-3');
  assertIncludes(t, 'Model value');
  assertIncludes(t, '±2%');
});

test('feedback/ignored-slack-L2R1', () => {
  const fb = fbFor('L2R1', 'span:MH-3~CO-Z');
  assertEqual(fb.tone, 'retry');
  assertIncludes(fb.headline, 'Intact cable');
  const t = text(fb);
  assertIncludes(t, '0.100 km');
  assertIncludes(t, '3.100 km');
  assertIncludes(t, '40 m');
  assertIncludes(t, 'cable length, not ground distance');
});

test('feedback/non-break-event-L1R2', () => {
  const t = text(fbFor('L1R2', 'mh:MH-1'));
  assertIncludes(t, 'Intact cable');
  assertIncludes(t, 'connector');
  assertIncludes(t, 'backscatter continues after 1.500 km');
  assertIncludes(t, '4.250 km');
});

test('feedback/non-break-event-L1R1-splice', () => {
  const t = text(fbFor('L1R1', 'mh:MH-2'));
  assertIncludes(t, 'splice');
  assertIncludes(t, 'backscatter continues after 5.000 km');
});

test('feedback/coil-correct-L3R1', () => {
  const t = text(fbFor('L3R1', CORRECT.L3R1));
  assertIncludes(t, 'Break found');
  assertIncludes(t, 'inside MH-2');
  assertIncludes(t, '2.050');
  assertIncludes(t, '2.100 km');
});

test('feedback/over-subtracted-L3R1', () => {
  const t = text(fbFor('L3R1', 'span:MH-1~MH-2'));
  assertIncludes(t, 'Intact cable');
  assertIncludes(t, 'coil');
});

test('feedback/wrong-end-L3R2', () => {
  const t = text(fbFor('L3R2', 'span:MH-1~MH-2'));
  assertIncludes(t, 'CO-Z');
  assertIncludes(t, 'wrong end');
});

test('feedback/correct-L3R2-far-end-position', () => {
  const t = text(fbFor('L3R2', CORRECT.L3R2));
  assertIncludes(t, '3.240 km from CO-A');
});

test('feedback/wrong-site-generic', () => {
  const t = text(fbFor('L2R1', 'span:CO-A~MH-1'));
  assertIncludes(t, 'Intact cable');
  assertIncludes(t, '3.060 km');
});

test('feedback/no-selection', () => {
  const fb = fbFor('L2R1', null);
  assertEqual(fb.tone, 'guidance');
  assertIncludes(fb.headline, 'Choose a dig site first');
});

test('feedback/every-reason-has-words-not-just-colour', () => {
  for (const [rid, ans] of [['L2R1', CORRECT.L2R1], ['L2R1', 'span:MH-3~CO-Z'], ['L2R1', null]]) {
    const fb = fbFor(rid, ans);
    assertTrue(/Break found|Intact cable|Choose a dig site first/.test(fb.headline), fb.headline);
  }
});
