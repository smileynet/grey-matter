import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,symlinkSync,renameSync,rmSync} from 'node:fs';
import {tmpdir,homedir} from 'node:os';
import {join} from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createReceipt,acceptReceipt,checkReceipt,inspectReceipt} from '../skills/productivity/delivery-dashboard/scripts/review-receipt.mjs';
const helper=fileURLToPath(new URL('../skills/productivity/delivery-dashboard/scripts/review-receipt.mjs',import.meta.url));
const attempts=[];
function fixture(){
 const fixtureHome=join(homedir(),'.scratch');mkdirSync(fixtureHome,{recursive:true});const root=mkdtempSync(join(fixtureHome,'t47-review-'));attempts.push(root);
 for(const dir of ['ui','.tickets','data','evidence'])mkdirSync(join(root,dir));
 writeFileSync(join(root,'ui/app.mjs'),'export const title="Example";\n');writeFileSync(join(root,'ui/app.css'),'body{color:navy}\n');
 writeFileSync(join(root,'.tickets/01-example.md'),'---\nid: "01"\nstatus: in_progress\n---\n\n# Example\n\n## Acceptance criteria\n\n- [ ] Render the actual output\n');
 const snapshot={generated:'2026-10-31',frontier:['01'],tickets:[{id:'01',title:'Example',status:'in_progress',blocked_by:[]}]};
 writeFileSync(join(root,'data/tickets.json'),JSON.stringify(snapshot));writeFileSync(join(root,'data/status.html'),'<h1>Actual renderer</h1><script id="gm-tickets" type="application/json">'+JSON.stringify(snapshot)+'</script><script>const behavior=1;</script>');
 writeFileSync(join(root,'evidence/laptop.png'),'synthetic capture bytes');writeFileSync(join(root,'evidence/phone.png'),'synthetic phone bytes');
 const manifest={version:1,subject:'Synthetic UI acceptance',sources:['ui','.tickets','data'],metadata:[{path:'.tickets/01-example.md',kind:'ticket-lifecycle',reason:'Ticket closure bookkeeping'},{path:'data/tickets.json',kind:'ticket-snapshot',reason:'Generated lifecycle snapshot'},{path:'data/status.html',kind:'ticket-snapshot',reason:'Only embedded lifecycle JSON may change'}],captures:[{path:'evidence/laptop.png',viewport:{width:1280,height:800}},{path:'evidence/phone.png',viewport:{width:390,height:900}}]};
 const save=()=>writeFileSync(join(root,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');save();
 const create=(name='receipt.json')=>createReceipt(root,'manifest.json',name);
 const accept=(record,name='receipt.json')=>acceptReceipt(root,'manifest.json',name,{expectedId:record.id,reviewer:'Independent synthetic critic',note:'Inspected both synthetic captures and scoped sources'});
 return {root,manifest,save,create,accept};
}
function change(root,path,edit){const file=join(root,path);writeFileSync(file,edit(readFileSync(file,'utf8')));}

test('inspection reuses current acceptance after an unrelated change without rewriting it',()=>{
 const f=fixture(),record=f.create();f.accept(record);const before=readFileSync(join(f.root,'receipt.json'));
 writeFileSync(join(f.root,'unrelated.md'),'Another ticket completed.');
 const result=inspectReceipt(f.root,'manifest.json','receipt.json');
 assert.equal(result.reusable,true);assert.equal(result.id,record.id);assert.equal(result.currentId,record.id);
 assert.equal(result.reason,'current-accepted');assert.equal(result.scopeChanged,false);
 assert.deepEqual(result.changes.source,{added:[],removed:[],changed:[]});
 assert.deepEqual(result.changes.captures,{added:[],removed:[],changed:[]});
 assert.deepEqual(readFileSync(join(f.root,'receipt.json')),before);
});

test('independently scoped view retains acceptance when another view changes',()=>{
 const f=fixture();mkdirSync(join(f.root,'other'));writeFileSync(join(f.root,'other/view.html'),'<p>Other view</p>');
 writeFileSync(join(f.root,'evidence/other.png'),'Synthetic other-view capture');
 const other={version:1,subject:'Independently scoped synthetic view',sources:['other'],captures:[{path:'evidence/other.png',viewport:{width:1280,height:800}}]};
 writeFileSync(join(f.root,'other-manifest.json'),JSON.stringify(other));
 const record=f.create();f.accept(record);const second=createReceipt(f.root,'other-manifest.json','other-receipt.json');
 acceptReceipt(f.root,'other-manifest.json','other-receipt.json',{expectedId:second.id,reviewer:'Independent synthetic critic',note:'Inspected other synthetic view'});
 change(f.root,'ui/app.css',text=>text+'p{color:teal}');
 const stale=inspectReceipt(f.root,'manifest.json','receipt.json');assert.equal(stale.reusable,false);
 assert.deepEqual(stale.changes.source.changed,['ui/app.css']);assert.deepEqual(stale.changes.captures.changed,[]);
 assert.throws(()=>checkReceipt(f.root,'manifest.json','receipt.json'),/source or captures changed/);
 assert.equal(inspectReceipt(f.root,'other-manifest.json','other-receipt.json').reusable,true);
 assert.equal(checkReceipt(f.root,'other-manifest.json','other-receipt.json').id,second.id);
});

test('a shared rendering input invalidates both independently recorded views',()=>{
 const f=fixture();writeFileSync(join(f.root,'shared.css'),'body{color:navy}');
 f.manifest.sources.push('shared.css');f.save();const first=f.create();f.accept(first);
 const secondManifest={...f.manifest,subject:'Second view sharing styles'};
 writeFileSync(join(f.root,'second-manifest.json'),JSON.stringify(secondManifest));
 const second=createReceipt(f.root,'second-manifest.json','second-receipt.json');
 acceptReceipt(f.root,'second-manifest.json','second-receipt.json',{expectedId:second.id,reviewer:'Independent synthetic critic',note:'Inspected shared style input'});
 change(f.root,'shared.css',text=>text+'p{color:teal}');
 for(const [manifest,receipt]of [['manifest.json','receipt.json'],['second-manifest.json','second-receipt.json']]){
  const result=inspectReceipt(f.root,manifest,receipt);assert.equal(result.reusable,false);assert.deepEqual(result.changes.source.changed,['shared.css']);
  assert.throws(()=>checkReceipt(f.root,manifest,receipt),/source or captures changed/);
 }
});

test('inspection reports directory membership, capture and scope changes separately',()=>{
 const f=fixture(),record=f.create();f.accept(record);
 renameSync(join(f.root,'ui/app.css'),join(f.root,'evidence/old.css'));writeFileSync(join(f.root,'ui/new.css'),'p{color:teal}');
 change(f.root,'evidence/phone.png',text=>text+' changed capture');
 const result=inspectReceipt(f.root,'manifest.json','receipt.json');
 assert.equal(result.reusable,false);assert.equal(result.scopeChanged,false);
 assert.deepEqual(result.changes.source,{added:['ui/new.css'],removed:['ui/app.css'],changed:[]});
 assert.deepEqual(result.changes.captures.changed,['evidence/phone.png']);
 f.manifest.subject='Changed review scope';f.save();assert.equal(inspectReceipt(f.root,'manifest.json','receipt.json').reason,'scope-changed');
 assert.throws(()=>checkReceipt(f.root,'manifest.json','receipt.json'),/scope\/projections changed/);
});

test('inspection never treats a pending receipt as reusable and CLI fails closed',()=>{
 const f=fixture(),record=f.create();const pending=inspectReceipt(f.root,'manifest.json','receipt.json');
 assert.equal(pending.reusable,false);assert.equal(pending.reason,'acceptance-missing');
 const run=()=>spawnSync(process.execPath,[helper,'inspect',f.root,'manifest.json','receipt.json'],{encoding:'utf8'});
 assert.equal(run().status,1);f.accept(record);assert.equal(run().status,0);
 change(f.root,'evidence/phone.png',text=>text+' changed capture');
 const stale=run();assert.equal(stale.status,1);assert.deepEqual(JSON.parse(stale.stdout).changes.captures.changed,['evidence/phone.png']);
 const malformed=JSON.parse(readFileSync(join(f.root,'receipt.json'),'utf8'));malformed.id='not-the-snapshot';
 writeFileSync(join(f.root,'receipt.json'),JSON.stringify(malformed));
 assert.throws(()=>inspectReceipt(f.root,'manifest.json','receipt.json'),/Invalid review receipt identity/);
});
test('cancelled lifecycle is known but cancellation prose is still reviewed source',()=>{const f=fixture(),record=f.create();f.accept(record);change(f.root,'.tickets/01-example.md',text=>text.replace('status: in_progress','status: cancelled'));for(const path of ['data/tickets.json','data/status.html'])change(f.root,path,text=>text.replace('"status":"in_progress"','"status":"cancelled"'));assert.equal(checkReceipt(f.root,'manifest.json','receipt.json').id,record.id);change(f.root,'.tickets/01-example.md',text=>text+'\n## Cancellation\n\nReason: obsolete\n');assert.throws(()=>checkReceipt(f.root,'manifest.json','receipt.json'),/source or captures changed/);});
test('pending snapshot needs explicit acceptance of its exact inspected ID',()=>{const f=fixture(),record=f.create();assert.equal(record.review.outcome,'pending');assert.equal(record.captures.length,2);assert.deepEqual(record.captures[0].viewport,{width:1280,height:800});assert.throws(()=>checkReceipt(f.root,'manifest.json','receipt.json'),/no acceptance/);assert.throws(()=>acceptReceipt(f.root,'manifest.json','receipt.json',{expectedId:'wrong',reviewer:'critic',note:'inspected'}),/snapshot ID/);f.accept(record);assert.equal(checkReceipt(f.root,'manifest.json','receipt.json').review.outcome,'accept');});
for(const path of ['ui/app.css','ui/app.mjs'])test('rendering change invalidates acceptance: '+path,()=>{const f=fixture(),record=f.create();f.accept(record);change(f.root,path,text=>text+'\n// new rendering behavior\n');assert.throws(()=>checkReceipt(f.root,'manifest.json','receipt.json'),/source or captures changed/);assert.throws(()=>f.accept(record),/source or captures changed/);});
test('new source directory member invalidates old acceptance',()=>{const f=fixture(),record=f.create();f.accept(record);writeFileSync(join(f.root,'ui/new.mjs'),'export const value=1;');assert.throws(()=>checkReceipt(f.root,'manifest.json','receipt.json'),/source or captures changed/);});
test('removed directory member invalidates acceptance',()=>{const f=fixture(),record=f.create();f.accept(record);renameSync(join(f.root,'ui/app.css'),join(f.root,'evidence/removed-app.css'));assert.throws(()=>checkReceipt(f.root,'manifest.json','receipt.json'),/source or captures changed/);});
test('capture mutation invalidates acceptance; recapture plus renewed review accepts new source',()=>{const f=fixture(),record=f.create();f.accept(record);change(f.root,'ui/app.css',text=>text+'p{color:teal}');change(f.root,'evidence/laptop.png',text=>text+' recaptured');assert.throws(()=>checkReceipt(f.root,'manifest.json','receipt.json'),/source or captures changed/);const updated=f.create('receipt-v2.json');f.accept(updated,'receipt-v2.json');assert.notEqual(updated.id,record.id);assert.equal(checkReceipt(f.root,'manifest.json','receipt-v2.json').id,updated.id);});
test('declared lifecycle updates preserve acceptance without hiding source code',()=>{const f=fixture(),record=f.create();f.accept(record);change(f.root,'.tickets/01-example.md',text=>text.replace('status: in_progress','status: done').replace('- [ ]','- [x]')+'\n## Resolution (2026-10-31)\n\nVerified closure bookkeeping.\n');for(const path of ['data/tickets.json','data/status.html'])change(f.root,path,text=>text.replace('2026-10-31','2026-11-01').replace('"frontier":["01"]','"frontier":[]').replace('"status":"in_progress"','"status":"done"'));assert.equal(checkReceipt(f.root,'manifest.json','receipt.json').id,record.id);change(f.root,'data/status.html',text=>text.replace('behavior=1','behavior=2'));assert.throws(()=>checkReceipt(f.root,'manifest.json','receipt.json'),/source or captures changed/);});
test('ticket requirements and graph edges remain part of reviewed source',()=>{const f=fixture(),record=f.create();f.accept(record);change(f.root,'.tickets/01-example.md',text=>text.replace('Render the actual output','Render something different'));assert.throws(()=>checkReceipt(f.root,'manifest.json','receipt.json'),/source or captures changed/);const g=fixture(),other=g.create();g.accept(other);change(g.root,'data/tickets.json',text=>text.replace('"blocked_by":[]','"blocked_by":["02"]'));assert.throws(()=>checkReceipt(g.root,'manifest.json','receipt.json'),/source or captures changed/);});
test('undeclared metadata changes fail and expanding the manifest invalidates approval',()=>{const f=fixture();f.manifest.metadata=[];f.save();const record=f.create();f.accept(record);change(f.root,'.tickets/01-example.md',text=>text.replace('in_progress','done'));assert.throws(()=>checkReceipt(f.root,'manifest.json','receipt.json'),/source or captures changed/);f.manifest.metadata=[{path:'.tickets/01-example.md',kind:'ticket-lifecycle',reason:'new exclusion'}];f.save();assert.throws(()=>checkReceipt(f.root,'manifest.json','receipt.json'),/scope\/projections changed/);});
test('arbitrary exclusions and executable-file projections are rejected',()=>{const f=fixture();f.manifest.metadata=[{path:'ui/app.css',kind:'ignore-file',reason:'hide change'}];f.save();assert.throws(()=>f.create(),/Unknown metadata/);f.manifest.metadata=[{path:'ui/app.mjs',kind:'ticket-snapshot',reason:'pretend code is data'}];f.save();assert.throws(()=>f.create(),/supports JSON or an HTML/);});
test('escaping paths and source/parent symlinks are rejected',()=>{const f=fixture();f.manifest.sources=['../foreign'];f.save();assert.throws(()=>f.create(),/escapes root/);f.manifest.sources=['ui'];f.save();symlinkSync(join(f.root,'evidence'),join(f.root,'ui/captures'),'dir');assert.throws(()=>f.create(),/symlinks/);const g=fixture();symlinkSync(join(g.root,'evidence'),join(g.root,'linked'),'dir');g.manifest.captures[0].path='linked/laptop.png';g.save();assert.throws(()=>g.create(),/symlinks/);});
test('receipt cannot include itself or silently overwrite an existing acceptance',()=>{const f=fixture();assert.throws(()=>f.create('ui/receipt.json'),/outside the declared source/);assert.equal(existsSync(join(f.root,'ui/receipt.json')),false);const record=f.create();f.accept(record);assert.throws(()=>f.create(),/already exists/);});
test('read-only CLI check from unrelated cwd preserves source and record bytes',()=>{const f=fixture(),record=f.create();f.accept(record);const before=readFileSync(join(f.root,'receipt.json'));const command=['check',f.root,'manifest.json','receipt.json'];const output=execFileSync(process.execPath,[helper,...command],{cwd:tmpdir(),encoding:'utf8'});assert.equal(JSON.parse(output).id,record.id);assert.deepEqual(readFileSync(join(f.root,'receipt.json')),before);change(f.root,'ui/app.css',text=>text+'div{color:black}');const failed=spawnSync(process.execPath,[helper,...command],{cwd:tmpdir(),encoding:'utf8'});assert.equal(failed.status,1);assert.match(failed.stderr,/source or captures changed/);});

// The test made these mkdtemp fixtures and nothing else lives in them, so remove them
// outright. An OS-trash route showed a modal dialog on Windows and hung the gate.
test.after(()=>{for(const root of attempts)rmSync(root,{recursive:true,force:true});});
