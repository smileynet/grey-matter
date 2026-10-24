from pathlib import Path
import json,hashlib,shutil,sys,subprocess,datetime
source=Path('/Users/sambiggins/code/grey-matter'); review=Path(sys.argv[1]); rel=Path('docs/agents/releases/20261024'); base=review/rel; base.mkdir(parents=True,exist_ok=True)
def sha(b):return hashlib.sha256(b).hexdigest()
def save(p,v):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,indent=2)+'\n')
def ref(p):return {'file':str(p.relative_to(review)),'sha256':sha(p.read_bytes())}
entries=[]
for product,version,folder in [('grey-matter','0.2.0','grey-matter-0.2.0-d997841'),('tkt','0.5.0','tkt-0.5.0-df4b652')]:
 origin=source/'.scratch/candidates'/folder; dest=base/product; dest.mkdir(exist_ok=True)
 for src,dst in [('artifacts','artifacts'),('verification','evidence')]:shutil.copytree(origin/src,dest/dst,dirs_exist_ok=True)
 shutil.copyfile(origin/'release-notes.md',dest/'release-notes.md')
 for name in ['README.md','CHANGELOG.md']:shutil.copyfile(origin/'worktree'/name,dest/(name.replace('.md','.snapshot.txt')))
 state=json.loads((origin/'prepare-state.json').read_text()); C=state['candidateSha']; gates={}
 for gate in ['scope','compatibility','upgrade','platform-approval','final-audit','staging']:
  p=base/'gates'/f'{product}-{gate}.json'
  if gate=='staging':save(p,{'schema':1,'kind':'release-gate','gate':gate,'product':product,'version':version,'candidateSha':C,'status':'pass','blockers':[],'summary':'Exact prepared bytes, note drafts, snapshots, child reports and real gate receipts assembled for pinned-commit verification; staged only.','evidence':['Audit70 d7370df970c777c09b60c9c7a47350689d10e377: staging go decision and completed platform evidence.','Carrier inventory.json binds every copied asset, report, log, note and gate; readStagedCandidate validates committed regular blobs at review R.','Companion installation guide records dependency-first install, update/migration prerequisites and measured limitations.'],'publicationPerformed':False})
  else:p.parent.mkdir(exist_ok=True);shutil.copyfile(source/'docs/agents/research/evidence/release-gates'/f'{product}-{version}-{gate}.json',p)
  gates[gate]=ref(p)
 entry={'product':product,'version':version,'candidateSha':C,'sourceSha':state['sourceSha'],'repository':'smileynet/'+product,'metadataSha256':sha((dest/'artifacts/release-metadata.json').read_bytes()),'verificationSha256':sha((dest/'evidence/verification.json').read_bytes()),'notes':ref(dest/'release-notes.md'),'gates':gates}
 # Store a reviewed annotated-tag record without creating any tag object or ref.
 record=f'object {C}\ntype commit\ntag v{version}\ntagger {subprocess.check_output(['git','-C',str(source),'var','GIT_COMMITTER_IDENT'],text=True).strip()}\n\nRelease {product} {version}\n'
 p=dest/'annotated-tag.txt';p.write_text(record); objectsha=hashlib.sha1(f'tag {len(record.encode())}\0'.encode()+record.encode()).hexdigest();entry['tagRecord']={**ref(p),'objectSha':objectsha}
 if product=='tkt':
  ci=json.loads((source/'docs/agents/research/evidence/tkt-candidate-stage-2b6ff17-20261024.json').read_text())['expected'];p=dest/'ci-identity.json';save(p,ci);entry['ci']=ref(p);entry['publication']={'workflowSha':C,'workflowId':394865280,'branch':'refs/heads/'+state['branch'],'tag':{'file':str((dest/'annotated-tag.txt').relative_to(review)),'objectSha':objectsha}}
 save(dest/'preparation.json',{k:state[k] for k in ['schema','sourceSha','candidateSha','version','date','branch','fileHashes','notesSha256']})
 entries.append(entry)
save(base/'index.json',{'schema':1,'kind':'release-staging','status':'staged','entries':entries})
files=[]
for p in sorted(base.rglob('*')):
 if p.is_file() and p.name!='inventory.json':files.append({'file':str(p.relative_to(review)),'size':p.stat().st_size,'sha256':sha(p.read_bytes())})
save(base/'inventory.json',{'schema':1,'status':'staged','files':files,'publicationPerformed':False,'ciAssets':'16 dist/crate files plus tkt-stage.json remain in the provenance-verified Actions ZIP; CI identity is committed here. Plugin release has five assets per product; tkt joined release has 22 assets.','reproduction':'Check out the pinned review commit to recover these exact regular blobs. Preparation source/version/date and every planned version-file hash are preserved per product; do not rebuild CI assets. Original Actions ZIP digest is in tkt/ci-identity.json.'})
print(json.dumps({'status':'staged','base':str(base),'files':len(files),'candidates':[e['candidateSha'] for e in entries]}))
