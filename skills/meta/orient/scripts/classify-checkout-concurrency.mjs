import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

function samePath(left, right) {
  const a = resolve(left).replaceAll('\\', '/');
  const b = resolve(right).replaceAll('\\', '/');
  return process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b;
}
export function classifyCheckoutConcurrency({ checkout, branch, status = '', upstream = '', binding }) {
  if (typeof checkout !== 'string' || !checkout || typeof branch !== 'string' || !branch) {
    throw new TypeError('checkout and branch are required');
  }
  if (typeof status !== 'string' || typeof upstream !== 'string') {
    throw new TypeError('Git status evidence must be text');
  }
  if (binding !== undefined && (!binding || typeof binding !== 'object' || Array.isArray(binding) ||
    typeof binding.active !== 'boolean' || typeof binding.writing !== 'boolean' ||
    typeof binding.checkout !== 'string' || typeof binding.branch !== 'string')) {
    throw new TypeError('binding must contain active/writing booleans and checkout/branch strings');
  }

  const sameWriter = binding?.active === true && binding?.writing === true &&
    samePath(binding.checkout, checkout) && binding.branch === branch;
  const branchStatus = upstream.split(/\r?\n/, 1)[0];
  const tracking = branchStatus.match(/\[([^\]]*)\]/)?.[1] ?? '';
  const behind = tracking.match(/(?:^|,\s*)behind\s+(\d+)\b/) ?? tracking.match(/(?:^|,\s*)(\d+)\s+behind\b/);
  const remoteAhead = Number(behind?.[1] ?? 0) > 0;
  const classifications = [
    ...(sameWriter ? ['shared-checkout-writer'] : []),
    ...(remoteAhead ? ['remote-advanced'] : [])
  ];
  const responses = [
    ...(sameWriter ? ['isolate-overlapping-local-edits'] : []),
    ...(remoteAhead ? ['reconcile-upstream'] : [])
  ];
  return {
    classification: classifications.length ? classifications.join('+') : 'liveness-unknown',
    localChangesObserved: status.trim().length > 0,
    remoteAdvanceObserved: remoteAhead,
    livenessEvidence: sameWriter ? 'caller-supplied-active-writer-binding' : 'unknown',
    responses: responses.length ? responses : ['report-unknown']
  };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  let binding;
  try { binding = process.argv[2] ? JSON.parse(process.argv[2]) : undefined; }
  catch { throw new Error('optional binding argument must be valid JSON'); }
  const git = args => execFileSync('git', args, { encoding: 'utf8' }).trim();
  const result = classifyCheckoutConcurrency({
    checkout: git(['rev-parse', '--show-toplevel']),
    branch: git(['rev-parse', '--abbrev-ref', 'HEAD']),
    status: git(['status', '--short']),
    upstream: git(['status', '-sb']),
    binding
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
