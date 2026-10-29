# Assemble this carrier from the 2026-10-28 prepare and verify outputs on randomserver.
# Kept for forensic reproduction; its machine paths are historical inputs. Do not rerun
# it over reviewed evidence: verify.mjs is the reproducible integrity check.
from pathlib import Path
import json, hashlib, shutil, sys, subprocess
work = Path.home() / 'release-work/20261028'
review = Path(sys.argv[1]); base = review / 'docs/agents/releases/20261029'; base.mkdir(parents=True, exist_ok=True)
def sha(b): return hashlib.sha256(b).hexdigest()
def save(p, v): p.parent.mkdir(parents=True, exist_ok=True); p.write_text(json.dumps(v, indent=2) + '\n')
def ref(p): return {'file': str(p.relative_to(review)), 'sha256': sha(p.read_bytes())}
ev = 'docs/agents/research/evidence/'
audit = 'docs/agents/research/final-release-audit-20261029.md: candidate identities, findings and dispositions, deferred scope and the staging go decision.'
summary = ev + 'release-validation-20261029.json: Linux, Windows and macOS product, native and harness-probe results for the exact candidates, with per-platform raw archive hashes.'
limits = 'Staging readiness only. Catalog checks show skills load; they do not prove every model activation or authenticated interactive hooks. Network isolation was enforced on macOS only. No publication authorization.'
receipts = {
 'scope': ('The approved version and everything on the recorded source revision are included; every open ticket in both repos is deferred by the user\'s 2026-10-28 instruction.',
           [audit, 'User decision 2026-10-28 (docs/plan.md): prepare 0.2.0 again from main; prepare tkt 0.5.0 again with all open tickets deferred.']),
 'compatibility': ('Fresh sealed archives load in Codex, Claude and Antigravity on Linux, Windows and macOS, and in Kiro, OpenCode and Crush bare roots on Linux and macOS, at the measured client versions.',
           [summary, audit]),
 'upgrade': ('Previous-release installations upgrade to the candidate without duplicate skills or loss of foreign content on Linux, Windows (Codex) and macOS.',
           [summary, ev + 'windows-evidence-20261029.zip: codex-candidate-probe.json, 53 skills, foreign preserved, repeated catalog identical.']),
 'platform-approval': ('Product, native and probe gates pass on macOS arm64, Linux x86_64 and Windows x64 without a coverage waiver.',
           [summary, ev + 'linux-evidence-20261029.zip, windows-evidence-20261029.zip, mac-evidence-20261029.zip: raw reports, logs and probe sources.']),
 'final-audit': ('The 2026-10-29 audit finds no unresolved release defect for the exact candidate; go for staging only.',
           [audit]),
}
tkt_extra = {
 'compatibility': [ev + 'tkt-candidate-stage-a827bb6-20261029.json: readCiStage provenance of run 40822712451; 16 sealed assets including the crate.',
                   'CI x86_64 Linux binary reports tkt 0.5.0 (a827bb6); CLI-surface check passes 386 invocations in 42 files across 21 commands (tktCli in ' + ev + 'release-validation-20261029.json).'],
}
entries = []
for product, version, prep, verify in [('grey-matter', '0.2.0', 'prepare-2', 'verify-linux-3'), ('tkt', '0.5.0', 'tkt-prepare', 'tkt-verify-linux')]:
  origin = work / prep; dest = base / product
  shutil.copytree(origin / 'artifacts', dest / 'artifacts', dirs_exist_ok=True)
  shutil.copytree(work / verify, dest / 'evidence', dirs_exist_ok=True)
  shutil.copyfile(origin / 'release-notes.md', dest / 'release-notes.md')
  for name in ['README.md', 'CHANGELOG.md']: shutil.copyfile(origin / 'worktree' / name, dest / name.replace('.md', '.snapshot.txt'))
  state = json.loads((origin / 'prepare-state.json').read_text()); C = state['candidateSha']; gates = {}
  for gate in ['scope', 'compatibility', 'upgrade', 'platform-approval', 'final-audit', 'staging']:
    p = base / 'gates' / f'{product}-{gate}.json'
    if gate == 'staging':
      text, evidence = ('Exact prepared archives, note drafts, snapshots, verification reports and real gate receipts assembled for pinned-commit verification; staged only.',
                        [audit, 'inventory.json in this carrier hashes every copied file; verify.mjs checks committed regular blobs and both staging readers at the review commit.', 'installation.md records dependency-first install, update prerequisites and measured limits.'])
    else:
      text, evidence = receipts[gate]; evidence = evidence + (tkt_extra.get(gate, []) if product == 'tkt' else [])
    save(p, {'schema': 1, 'kind': 'release-gate', 'gate': gate, 'product': product, 'version': version, 'candidateSha': C, 'status': 'pass', 'blockers': [], 'summary': text, 'evidence': evidence, 'limits': limits, 'publicationPerformed': False})
    gates[gate] = ref(p)
  entry = {'product': product, 'version': version, 'candidateSha': C, 'sourceSha': state['sourceSha'], 'repository': 'smileynet/' + product,
           'metadataSha256': sha((dest / 'artifacts/release-metadata.json').read_bytes()), 'verificationSha256': sha((dest / 'evidence/verification.json').read_bytes()),
           'notes': ref(dest / 'release-notes.md'), 'gates': gates}
  # A reviewed annotated-tag record; no tag object or ref is created.
  record = f'object {C}\ntype commit\ntag v{version}\ntagger {subprocess.check_output(["git", "-C", str(review), "var", "GIT_COMMITTER_IDENT"], text=True).strip()}\n\nRelease {product} {version}\n'
  p = dest / 'annotated-tag.txt'; p.write_text(record)
  objectsha = hashlib.sha1(f'tag {len(record.encode())}\0'.encode() + record.encode()).hexdigest(); entry['tagRecord'] = {**ref(p), 'objectSha': objectsha}
  if product == 'tkt':
    ci = json.loads((review / ev / 'tkt-candidate-stage-a827bb6-20261029.json').read_text())['expected']; p = dest / 'ci-identity.json'; save(p, ci); entry['ci'] = ref(p)
    entry['publication'] = {'workflowSha': C, 'workflowId': 394865280, 'branch': 'refs/heads/' + state['branch'], 'tag': {'file': str((dest / 'annotated-tag.txt').relative_to(review)), 'objectSha': objectsha}}
  save(dest / 'preparation.json', {k: state[k] for k in ['schema', 'sourceSha', 'candidateSha', 'version', 'date', 'branch', 'fileHashes', 'notesSha256']})
  entries.append(entry)
save(base / 'index.json', {'schema': 1, 'kind': 'release-staging', 'status': 'staged', 'entries': entries})
files = [{'file': str(p.relative_to(review)), 'size': p.stat().st_size, 'sha256': sha(p.read_bytes())} for p in sorted(base.rglob('*')) if p.is_file() and p.name != 'inventory.json']
save(base / 'inventory.json', {'schema': 1, 'status': 'staged', 'files': files, 'publicationPerformed': False,
  'ciAssets': '16 dist/crate files plus tkt-stage.json remain in the provenance-verified Actions ZIP of run 40822712451; CI identity is committed here. Plugin release has five assets per product; tkt joined release has 22 assets.',
  'reproduction': 'Check out the pinned review commit to recover these exact regular blobs. Preparation source, version, date and planned version-file hashes are preserved per product; do not rebuild CI assets.'})
print(json.dumps({'status': 'staged', 'files': len(files), 'candidates': [e['candidateSha'] for e in entries]}))
