import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const priorities = ['urgent', 'high', 'medium', 'low'];
const statuses = ['open', 'in_progress', 'backlog', 'done', 'cancelled'];

export function countAcceptanceCriteria(markdown) {
  if (typeof markdown !== 'string') throw new TypeError('ticket body must be text');
  const body = markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\s*/m, '');
  let inCriteria = false;
  let fence = null;
  let total = 0;
  let checked = 0;
  for (const line of body.split(/\r?\n/)) {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})/)?.[1];
    if (fence) {
      if (marker?.[0] === fence.character && marker.length >= fence.length && /^ {0,3}(?:`{3,}|~{3,})\s*$/.test(line)) fence = null;
      continue;
    }
    if (marker) {
      fence = { character: marker[0], length: marker.length };
      continue;
    }
    const heading = line.match(/^##\s+(.+?)\s*#*\s*$/)?.[1];
    if (heading) {
      inCriteria = /^acceptance criteria(?:\b|\s*\()/i.test(heading) || /^accepted .+ amendment(?:\b|\s*\()/i.test(heading);
      continue;
    }
    if (!inCriteria) continue;
    const checkbox = line.match(/^\s*[-*+]\s+\[([ xX])\]/);
    if (checkbox) {
      total++;
      if (checkbox[1].toLowerCase() === 'x') checked++;
    }
  }
  return { total, checked };
}

export function reviewTickets(tickets, { tag, queue = [] } = {}) {
  if (!Array.isArray(tickets) || typeof tag !== 'string' || !tag || !Array.isArray(queue) ||
    !queue.every(id => typeof id === 'string' || (typeof id === 'number' && Number.isSafeInteger(id)))) {
    throw new TypeError('tickets, exact tag and queue are required');
  }
  const ids = new Set();
  for (const ticket of tickets) {
    if (!ticket || typeof ticket.id !== 'string' || ids.has(ticket.id) ||
      !statuses.includes(ticket.status) || (ticket.priority != null && !priorities.includes(ticket.priority)) ||
      !Array.isArray(ticket.tags) || !ticket.tags.every(tag => typeof tag === 'string') ||
      !Array.isArray(ticket.blocked_by) || !ticket.blocked_by.every(id => typeof id === 'string' || typeof id === 'number') ||
      (ticket.pending_blockers !== undefined && (!Array.isArray(ticket.pending_blockers) ||
        !ticket.pending_blockers.every(id => typeof id === 'string' || typeof id === 'number')))) {
      throw new TypeError('query rows require unique string ids, tags and blocked_by arrays');
    }
    ids.add(ticket.id);
  }
  const members = tickets.filter(ticket => ticket.tags.includes(tag));
  const memberIds = new Set(members.map(ticket => ticket.id));
  const normalizedQueue = queue.map(String);
  if (new Set(normalizedQueue).size !== normalizedQueue.length) throw new TypeError('queue contains duplicate ticket ids');
  const queueIds = normalizedQueue.filter(id => memberIds.has(id));
  const position = new Map(queueIds.map((id, index) => [id, index]));
  const findings = [];
  for (const ticket of members) {
    const pendingIds = ticket.pending_blockers?.map(String) ?? ticket.blocked_by.map(String)
      .filter(id => tickets.find(row => row.id === id)?.status !== 'done');
    const blockers = pendingIds.map(id => tickets.find(row => row.id === id)).filter(Boolean);
    if (ticket.status === 'open' && blockers.some(blocker => blocker.status === 'backlog')) {
      findings.push({ kind: 'open-behind-backlog', id: ticket.id, blockers: blockers.filter(b => b.status === 'backlog').map(b => b.id) });
    }
    const index = position.get(ticket.id);
    if (index !== undefined) {
      for (const blocker of pendingIds.map(id => tickets.find(row => row.id === id)).filter(Boolean)) {
        const blockerPosition = position.get(blocker.id);
        if (blocker.status !== 'done' && blockerPosition !== undefined && blockerPosition > index) {
          findings.push({ kind: 'queue-before-prerequisite', id: ticket.id, prerequisite: blocker.id });
        }
      }
    }
    if (ticket.status === 'open' && ticket.priority == null) findings.push({ kind: 'missing-priority', id: ticket.id });
    if (ticket.status === 'open' && priorities.includes(ticket.priority)) {
      const laterHigher = members.filter(other => other.status === 'open' && priorities.includes(other.priority) &&
        position.has(other.id) && position.has(ticket.id) &&
        position.get(other.id) > position.get(ticket.id) && priorities.indexOf(other.priority) < priorities.indexOf(ticket.priority));
      for (const other of laterHigher) findings.push({ kind: 'priority-queue-inversion-advisory', earlier: ticket.id, later: other.id });
    }
    if (ticket.status === 'open' && typeof ticket.criteria_checked === 'number' && ticket.criteria_checked > 0 &&
      ticket.criteria_checked === ticket.criteria_total) findings.push({ kind: 'all-criteria-checked', id: ticket.id });
  }
  return {
    included: members.map(ticket => ticket.id),
    excluded: tickets.filter(ticket => !memberIds.has(ticket.id)).map(ticket => ({ id: ticket.id, tags: ticket.tags })),
    excludedQueue: normalizedQueue.filter(id => !memberIds.has(id)).map(id => {
      const ticket = tickets.find(row => row.id === id);
      return { id, tags: ticket?.tags ?? null };
    }),
    externalBlockers: members.flatMap(ticket => (ticket.pending_blockers?.map(String) ?? ticket.blocked_by.map(String)
      .filter(id => tickets.find(row => row.id === id)?.status !== 'done'))
      .filter(id => !memberIds.has(id)).map(id => ({ ticket: ticket.id, blocker: id, status: tickets.find(row => row.id === id)?.status ?? 'missing-from-query' }))),
    unknownBlockers: members.flatMap(ticket => (ticket.pending_blockers?.map(String) ?? ticket.blocked_by.map(String)
      .filter(id => tickets.find(row => row.id === id)?.status !== 'done'))
      .filter(id => !tickets.some(row => row.id === id)).map(id => ({ ticket: ticket.id, blocker: id }))),
    findings
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const tag = process.argv[2];
  if (!tag) throw new Error('usage: node priority-review.mjs <exact-tag> [queue-id,...]');
  const queue = (process.argv[3] ?? '').split(',').filter(Boolean);
  const raw = execFileSync('tkt', ['query', '--all-context', '-o', 'json'], { encoding: 'utf8' });
  const tickets = raw.trim().split(/\r?\n/).filter(Boolean).map(line => {
    const ticket = JSON.parse(line);
    const prefix = `${ticket.id.padStart(2, '0')}-`;
    const filename = readdirSync(join(process.cwd(), '.tickets')).find(name => name.startsWith(prefix) && name.endsWith('.md'));
    if (!filename) throw new Error(`ticket ${ticket.id} has no matching .tickets file`);
    const { total, checked } = countAcceptanceCriteria(readFileSync(join(process.cwd(), '.tickets', filename), 'utf8'));
    ticket.criteria_total = total;
    ticket.criteria_checked = checked;
    return ticket;
  });
  process.stdout.write(`${JSON.stringify(reviewTickets(tickets, { tag, queue }), null, 2)}\n`);
}
