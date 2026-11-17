// Invalid-content fixtures (tasks.md T008). Each builds a document from a literal valid base
// (L2R1 from spec.md) and applies one defect.

export function baseDoc() {
  return {
    schemaVersion: 1,
    sources: [{ id: 's1', title: 'Source', url: 'https://example.org/', section: 'S', claim: 'C' }],
    levels: [
      {
        id: 'L2',
        title: 'Mind the slack',
        learningOutcome: 'LO2',
        briefing: { summary: 's', paragraphs: ['p'], workedExample: 'w', limits: [] },
        sourceIds: ['s1'],
        rounds: [
          {
            id: 'L2R1',
            title: 'Three manholes',
            testEnd: 'A',
            route: {
              points: [
                { id: 'CO-A', kind: 'co', groundM: 0 },
                { id: 'MH-1', kind: 'manhole', groundM: 1000, slackM: 50 },
                { id: 'MH-2', kind: 'manhole', groundM: 2000, slackM: 50 },
                { id: 'MH-3', kind: 'manhole', groundM: 3000, slackM: 50 },
                { id: 'CO-Z', kind: 'co', groundM: 4000 },
              ],
            },
            trace: {
              wavelengthNm: 1550,
              attenuationDbPerKm: 0.2,
              events: [
                { id: 'e0', type: 'launch', distanceM: 0, reflective: true },
                { id: 'e1', type: 'end', distanceM: 3060, reflective: false },
              ],
            },
            hints: ['m', 'w', 's'],
          },
        ],
      },
    ],
  };
}

const r = (doc) => doc.levels[0].rounds[0];

export const INVALID = [
  { name: 'ambiguous 3090', code: 'ambiguous-break', roundId: 'L2R1', mutate: (d) => { r(d).trace.events[1].distanceM = 3090; } },
  { name: 'end beyond route', code: 'end-beyond-route', roundId: 'L2R1', mutate: (d) => { r(d).trace.events[1].distanceM = 4200; } },
  { name: 'two end events', code: 'end-count', roundId: 'L2R1',
    mutate: (d) => { r(d).trace.events.push({ id: 'e2', type: 'end', distanceM: 3500, reflective: false }); } },
  { name: 'event after end', code: 'event-after-end', roundId: 'L2R1',
    mutate: (d) => { r(d).trace.events.push({ id: 'e2', type: 'splice', distanceM: 3500, reflective: false }); } },
  { name: 'slack on CO', code: 'slack-on-co', roundId: 'L2R1', mutate: (d) => { r(d).route.points[4].slackM = 10; } },
  { name: 'non-increasing ground', code: 'bad-route-order', roundId: 'L2R1', mutate: (d) => { r(d).route.points[2].groundM = 900; } },
  { name: 'duplicate point id', code: 'duplicate-id', roundId: 'L2R1', mutate: (d) => { r(d).route.points[2].id = 'MH-1'; } },
  { name: 'reflective splice', code: 'bad-reflectivity', roundId: 'L2R1',
    mutate: (d) => { r(d).trace.events.splice(1, 0, { id: 'e9', type: 'splice', distanceM: 1500, reflective: true }); } },
  { name: 'two hints', code: 'hint-count', roundId: 'L2R1', mutate: (d) => { r(d).hints = ['m', 'w']; } },
  { name: 'unknown source', code: 'unknown-source', levelId: 'L2', mutate: (d) => { d.levels[0].sourceIds.push('nope'); } },
  { name: 'missing testEnd', code: 'missing-field', roundId: 'L2R1', mutate: (d) => { delete r(d).testEnd; } },
  { name: 'groundM as string', code: 'bad-type', roundId: 'L2R1', mutate: (d) => { r(d).route.points[1].groundM = '1000'; } },
  { name: 'unknown event type', code: 'bad-type', roundId: 'L2R1',
    mutate: (d) => { r(d).trace.events.splice(1, 0, { id: 'e9', type: 'bend', distanceM: 1500, reflective: false }); } },
];
