// Pure content validation (spec FR-021, data-model.md). Collects ALL errors; never throws.
import { cableModel } from './rules.js';

export const AMBIGUITY_MARGIN_M = 25;
const EVENT_TYPES = ['launch', 'connector', 'splice', 'end'];
const isInt = (v) => Number.isInteger(v);
const isStr = (v) => typeof v === 'string' && v.trim() !== '';
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

export function validateContent(doc) {
  const errors = [];
  const add = (code, message, where = {}) => errors.push({ ...where, code, message });
  try {
    if (!isObj(doc)) {
      add('bad-type', 'Content must be a JSON object.');
      return { ok: false, errors };
    }
    if (doc.schemaVersion !== 1) add('bad-type', 'schemaVersion must be 1.');

    const sourceIds = new Set();
    if (!Array.isArray(doc.sources) || doc.sources.length < 1) {
      add('missing-field', 'At least one source is required.');
    } else {
      doc.sources.forEach((s, i) => {
        if (!isObj(s)) return add('bad-type', `sources[${i}] must be an object.`);
        if (!isStr(s.id)) add('missing-field', `sources[${i}].id is required.`);
        else if (sourceIds.has(s.id)) add('duplicate-id', `Duplicate source id ${s.id}.`);
        else sourceIds.add(s.id);
        for (const f of ['title', 'url', 'section', 'claim']) {
          if (!isStr(s[f])) add('missing-field', `Source ${s.id || i}: ${f} is required.`);
        }
        if (isStr(s.url) && !s.url.startsWith('https://')) add('bad-type', `Source ${s.id}: url must start with https://.`);
      });
    }

    if (!Array.isArray(doc.levels) || doc.levels.length < 1) {
      add('missing-field', 'At least one level is required.');
      return { ok: false, errors };
    }
    const levelIds = new Set();
    const roundIds = new Set();
    doc.levels.forEach((level, li) => {
      if (!isObj(level)) return add('bad-type', `levels[${li}] must be an object.`);
      const where = { levelId: level.id || `levels[${li}]` };
      if (!isStr(level.id) || !/^L\d+$/.test(level.id)) add('bad-type', 'Level id must look like L1.', where);
      else if (levelIds.has(level.id)) add('duplicate-id', `Duplicate level id ${level.id}.`, where);
      else levelIds.add(level.id);
      if (!isStr(level.title)) add('missing-field', 'Level title is required.', where);
      if (!['LO1', 'LO2', 'LO3'].includes(level.learningOutcome)) add('bad-type', 'learningOutcome must be LO1, LO2 or LO3.', where);
      const b = level.briefing;
      if (!isObj(b) || !Array.isArray(b.paragraphs) || b.paragraphs.length < 1 || !b.paragraphs.every(isStr)) {
        add('missing-field', 'briefing.paragraphs needs at least one paragraph.', where);
      }
      if (!isObj(b) || !isStr(b.workedExample)) add('missing-field', 'briefing.workedExample is required.', where);
      if (!isObj(b) || !isStr(b.summary)) add('missing-field', 'briefing.summary (2–3 short sentences) is required.', where);
      if (isObj(b) && b.demo !== undefined) {
        // The mini demo is checked with the same rules as a round (FR-002).
        const demoId = `${where.levelId} demo`;
        const demo = { ...b.demo, id: `${level.id || 'L0'}R0`, title: 'demo', hints: ['-', '-', '-'] };
        validateRound(demo, 0, where.levelId, new Set(),
          (code, message) => add(code, `Demo: ${message}`, { levelId: where.levelId, roundId: demoId }));
      }
      if (!isObj(b) || !Array.isArray(b.limits) || !b.limits.every(isStr)) add('missing-field', 'briefing.limits must be a list of text.', where);
      if (!Array.isArray(level.sourceIds) || level.sourceIds.length < 1) add('missing-field', 'Level needs at least one sourceId.', where);
      else level.sourceIds.forEach((id) => { if (!sourceIds.has(id)) add('unknown-source', `Unknown source id ${id}.`, where); });
      if (!Array.isArray(level.rounds) || level.rounds.length < 1) {
        add('missing-field', 'Level needs at least one round.', where);
        return;
      }
      level.rounds.forEach((round, ri) => validateRound(round, ri, where.levelId, roundIds, add));
    });
  } catch (err) {
    add('bad-type', `Content could not be checked: ${err.message}`);
  }
  return { ok: errors.length === 0, errors };
}

function validateRound(round, ri, levelId, roundIds, add) {
  if (!isObj(round)) return add('bad-type', `Round ${ri + 1} must be an object.`, { levelId });
  const where = { levelId, roundId: round.id || `${levelId} round ${ri + 1}` };
  const err = (code, msg) => add(code, msg, where);

  if (!isStr(round.id) || !/^L\d+R\d+$/.test(round.id)) err('bad-type', 'Round id must look like L1R1.');
  else if (roundIds.has(round.id)) err('duplicate-id', `Duplicate round id ${round.id}.`);
  else roundIds.add(round.id);
  if (!isStr(round.title)) err('missing-field', 'Round title is required.');
  if (round.testEnd === undefined) err('missing-field', 'testEnd is required (A or Z).');
  else if (!['A', 'Z'].includes(round.testEnd)) err('bad-type', 'testEnd must be A or Z.');
  if (!Array.isArray(round.hints) || round.hints.length !== 3 || !round.hints.every(isStr)) {
    err('hint-count', 'Exactly 3 hints are required: method, worked step, full solution.');
  }

  // Route
  const pts = round.route && round.route.points;
  let routeOk = Array.isArray(pts) && pts.length >= 3;
  if (!routeOk) err('missing-field', 'route.points needs CO-A, at least one manhole, and CO-Z.');
  else {
    const ids = new Set();
    pts.forEach((p, i) => {
      if (!isObj(p)) { routeOk = false; return err('bad-type', `Route point ${i + 1} must be an object.`); }
      if (!isStr(p.id) || !/^(CO-A|CO-Z|MH-\d+)$/.test(p.id)) { routeOk = false; err('bad-type', `Route point ${i + 1}: bad id.`); }
      else if (ids.has(p.id)) { routeOk = false; err('duplicate-id', `Duplicate route point id ${p.id}.`); }
      else ids.add(p.id);
      if (!['co', 'manhole'].includes(p.kind)) { routeOk = false; err('bad-type', `${p.id}: kind must be co or manhole.`); }
      if (!isInt(p.groundM) || p.groundM < 0) { routeOk = false; err('bad-type', `${p.id}: groundM must be a whole number of metres ≥ 0.`); }
      if (p.kind === 'co' && p.slackM !== undefined) { routeOk = false; err('slack-on-co', `${p.id}: slack is only stored in manholes.`); }
      if (p.kind === 'manhole' && (!isInt(p.slackM) || p.slackM < 0)) { routeOk = false; err('bad-type', `${p.id}: slackM must be a whole number of metres ≥ 0.`); }
      const shouldBe = i === 0 ? 'CO-A' : i === pts.length - 1 ? 'CO-Z' : null;
      if (shouldBe && p.id !== shouldBe) { routeOk = false; err('bad-route-order', `Route must ${i === 0 ? 'start' : 'end'} at ${shouldBe}.`); }
      if (!shouldBe && p.kind !== 'manhole') { routeOk = false; err('bad-route-order', `${p.id}: only manholes may sit between the COs.`); }
    });
    if (routeOk && pts[0].groundM !== 0) { routeOk = false; err('bad-route-order', 'CO-A must be at ground 0.'); }
    for (let i = 1; routeOk && i < pts.length; i++) {
      if (!(pts[i].groundM > pts[i - 1].groundM)) { routeOk = false; err('bad-route-order', 'Ground distances must strictly increase from CO-A to CO-Z.'); }
    }
  }

  // Trace
  const t = round.trace;
  if (!isObj(t)) return err('missing-field', 'trace is required.');
  if (!isInt(t.wavelengthNm)) err('bad-type', 'trace.wavelengthNm must be a whole number.');
  if (typeof t.attenuationDbPerKm !== 'number' || !(t.attenuationDbPerKm > 0)) err('bad-type', 'trace.attenuationDbPerKm must be > 0.');
  const evs = t.events;
  if (!Array.isArray(evs) || evs.length < 2) return err('missing-field', 'trace.events needs a launch and an end.');
  let eventsOk = true;
  const evIds = new Set();
  evs.forEach((e, i) => {
    if (!isObj(e)) { eventsOk = false; return err('bad-type', `Event ${i + 1} must be an object.`); }
    if (!isStr(e.id)) { eventsOk = false; err('missing-field', `Event ${i + 1}: id is required.`); }
    else if (evIds.has(e.id)) { eventsOk = false; err('duplicate-id', `Duplicate event id ${e.id}.`); }
    else evIds.add(e.id);
    if (!EVENT_TYPES.includes(e.type)) { eventsOk = false; err('bad-type', `Event ${e.id || i + 1}: unknown type ${JSON.stringify(e.type)}.`); }
    if (!isInt(e.distanceM) || e.distanceM < 0) { eventsOk = false; err('bad-type', `Event ${e.id || i + 1}: distanceM must be a whole number ≥ 0.`); }
    if (typeof e.reflective !== 'boolean') { eventsOk = false; err('bad-type', `Event ${e.id || i + 1}: reflective must be true or false.`); }
    else if ((e.type === 'launch' || e.type === 'connector') && !e.reflective) err('bad-reflectivity', `${e.id}: a ${e.type} is reflective.`);
    else if (e.type === 'splice' && e.reflective) err('bad-reflectivity', `${e.id}: a fusion splice is non-reflective.`);
    if (e.lossDb !== undefined && !(typeof e.lossDb === 'number' && e.lossDb >= 0)) err('bad-type', `${e.id}: lossDb must be ≥ 0.`);
  });
  if (!eventsOk) return;
  if (evs[0].type !== 'launch' || evs[0].distanceM !== 0) err('bad-event-order', 'The first event must be the launch at 0.');
  for (let i = 1; i < evs.length; i++) {
    if (!(evs[i].distanceM > evs[i - 1].distanceM)) err('bad-event-order', 'Event distances must strictly increase.');
  }
  const ends = evs.filter((e) => e.type === 'end');
  if (ends.length !== 1) err('end-count', `Exactly one end-of-fiber (break) event is required; found ${ends.length}.`);
  const firstEnd = evs.findIndex((e) => e.type === 'end');
  if (firstEnd !== -1 && firstEnd !== evs.length - 1) err('event-after-end', 'No events may appear after the end of fiber.');

  // Break placement checks need a valid route, a valid test end and a single break.
  if (!routeOk || !['A', 'Z'].includes(round.testEnd) || ends.length !== 1) return;
  const d = ends[0].distanceM;
  const model = cableModel(round);
  const farCable = model[model.length - 1].inM;
  if (d >= farCable) {
    return err('end-beyond-route', `Break at ${d} m is at or beyond the far CO (${farCable} m of cable).`);
  }
  const boundaries = model.flatMap((r) => [r.inM, r.outM]);
  const nearest = boundaries.reduce((best, b) => (Math.abs(d - b) < Math.abs(d - best) ? b : best), boundaries[0]);
  if (Math.abs(d - nearest) < AMBIGUITY_MARGIN_M) {
    err('ambiguous-break', `Break at ${d} m is only ${Math.abs(d - nearest)} m from a boundary at ${nearest} m (minimum ${AMBIGUITY_MARGIN_M} m).`);
  }
}
