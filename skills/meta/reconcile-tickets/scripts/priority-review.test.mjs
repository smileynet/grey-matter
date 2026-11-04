import assert from 'node:assert/strict';
import test from 'node:test';
import { countAcceptanceCriteria, reviewTickets } from './priority-review.mjs';

const tickets = [
  { id: '10', title: 'Earlier low priority', status: 'open', priority: 'low', tags: ['stream:tools'], blocked_by: ['12'], criteria_checked: 0, criteria_total: 2 },
  { id: '11', title: 'Unrelated', status: 'open', priority: 'urgent', tags: ['stream:other'], blocked_by: [], criteria_checked: 0, criteria_total: 1 },
  { id: '12', title: 'Backlogged prerequisite', status: 'backlog', priority: 'medium', tags: ['stream:tools'], blocked_by: ['99'], criteria_checked: 0, criteria_total: 1 },
  { id: '13', title: 'Later high priority', status: 'open', priority: 'high', tags: ['stream:tools'], blocked_by: [], criteria_checked: 2, criteria_total: 2 },
  { id: '16', title: 'Completed historical work', status: 'done', priority: 'urgent', tags: ['stream:tools'], blocked_by: [], criteria_checked: 2, criteria_total: 2 },
  { id: '17', title: 'Cancelled work', status: 'cancelled', priority: 'urgent', tags: ['stream:tools'], blocked_by: [], criteria_checked: 0, criteria_total: 2 },
  { id: '15', title: 'No priority', status: 'open', tags: ['stream:tools'], blocked_by: [], criteria_checked: 0, criteria_total: 2 },
  { id: '14', title: 'Untagged', status: 'open', priority: null, tags: [], blocked_by: [], criteria_checked: 0, criteria_total: 0 }
];

test('selects exact tag membership and reports queue, backlog, missing AC, and excluded context facts', () => {
  const result = reviewTickets(tickets, { tag: 'stream:tools', queue: ['10', '12', '13', '16', '17', '14', '11'] });
  assert.deepEqual(result.included, ['10', '12', '13', '16', '17', '15']);
  assert.deepEqual(result.excluded.map(row => row.id), ['11', '14']);
  assert.deepEqual(result.excludedQueue, [{ id: '14', tags: [] }, { id: '11', tags: ['stream:other'] }]);
  assert.deepEqual(result.externalBlockers, [{ ticket: '12', blocker: '99', status: 'missing-from-query' }]);
  assert.deepEqual(result.unknownBlockers, [{ ticket: '12', blocker: '99' }]);
  assert.deepEqual(result.findings, [
    { kind: 'open-behind-backlog', id: '10', blockers: ['12'] },
    { kind: 'queue-before-prerequisite', id: '10', prerequisite: '12' },
    { kind: 'priority-queue-inversion-advisory', earlier: '10', later: '13' },
    { kind: 'all-criteria-checked', id: '13' },
    { kind: 'missing-priority', id: '15' }
  ]);
});

test('rejects malformed query trust-boundary inputs', () => {
  assert.throws(() => reviewTickets({}, { tag: 'stream:tools' }), /required/);
  assert.throws(() => reviewTickets([{ id: '1', tags: 'stream:tools', blocked_by: [] }], { tag: 'stream:tools' }), /query rows/);
  assert.throws(() => reviewTickets([{ id: '1', tags: [], blocked_by: [] }, { id: '1', tags: [], blocked_by: [] }], { tag: 'stream:tools' }), /query rows/);
  assert.throws(() => reviewTickets(tickets, { tag: 'stream:tools', queue: ['10', '10'] }), /duplicate/);
  assert.throws(() => reviewTickets([{ id: '1', status: 'open', priority: 'mystery', tags: [], blocked_by: [] }], { tag: 'stream:tools' }), /query rows/);
});

test('counts checked criteria across the original and accepted amendment sections', () => {
  assert.deepEqual(countAcceptanceCriteria(`---\nid: "7"\n---\n\n## Origin\n\n- [x] not a criterion\n\n## Acceptance criteria\n\n- [x] shipped\n- [ ] still needed\n\n\`\`\`md\n## Acceptance criteria\n- [x] fake criterion\n\`\`\`\n\n## Accepted orchestration retro amendment\n\n- [x] accepted criterion\n\n## Notes\n\n- [ ] not a criterion\n`), { total: 3, checked: 2 });
  assert.throws(() => countAcceptanceCriteria({}), /text/);
});
