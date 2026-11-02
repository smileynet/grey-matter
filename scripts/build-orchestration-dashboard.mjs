import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const editorial = JSON.parse(read('docs/orchestration-findings.json'));
const tickets = fs.readdirSync(path.join(root, '.tickets')).filter(p => p.endsWith('.md')).flatMap(name => {
  const raw = read(`.tickets/${name}`);
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return [];
  const data = YAML.parse(match[1]);
  if (!data.tags?.includes('stream:orchestration')) return [];
  const id = String(data.id);
  return [{ id, title: data.title, status: data.status, blocked_by: (data.blocked_by ?? []).map(String), criteria: data.validation_criteria ?? [], body: match[2].trim(), file: `../.tickets/${name}`, label: editorial.ticketNotes[id]?.[0] ?? data.title, value: editorial.ticketNotes[id]?.[1] ?? data.title }];
}).sort((a, b) => Number(a.id) - Number(b.id));
const queue = [...read('docs/plan.md').matchAll(/^\|\s*(\d+)\s*\|/gm)].map(m => m[1]).filter((id, i, all) => tickets.some(t => t.id === id) && all.indexOf(id) === i);
const serialise = value => JSON.stringify(value).replaceAll('<', '\\u003c');
const html = read('scripts/assets/orchestration-dashboard.html').replace('%%FINDINGS%%', serialise(editorial)).replace('%%TICKETS%%', serialise({ tickets, queue }));
fs.writeFileSync(path.join(root, 'docs/orchestration.html'), html);
console.log(`Built docs/orchestration.html: ${tickets.length} scoped tickets, ${editorial.findings.length} findings, ${Buffer.byteLength(html)} bytes.`);
