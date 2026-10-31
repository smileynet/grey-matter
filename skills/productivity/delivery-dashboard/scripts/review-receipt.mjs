#!/usr/bin/env node
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,readdirSync,lstatSync,realpathSync,existsSync} from 'node:fs';
import {resolve,relative,isAbsolute,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const digest=value=>createHash('sha256').update(value).digest('hex');
const statuses=new Set(['open','in_progress','backlog','done']);
function demand(condition,message){if(!condition)throw Error(message);}
function object(value){return value!==null&&typeof value==='object'&&!Array.isArray(value);}
function keys(value,allowed,label){demand(object(value)&&Object.keys(value).every(key=>allowed.includes(key)),`Unsupported ${label} fields`);}
function inside(root,path){
 demand(typeof path==='string'&&path.length>0&&!isAbsolute(path),'Use a nonempty relative path inside the review root');
 const full=resolve(root,path),name=relative(root,full);
 demand(name!=='..'&&!name.startsWith('..'+sep)&&!isAbsolute(name),'Review path escapes root: '+path);
 let cursor=root;for(const part of name.split(sep).filter(Boolean)){cursor=resolve(cursor,part);if(!existsSync(cursor))break;demand(!lstatSync(cursor).isSymbolicLink(),'Review path cannot traverse symlinks: '+path);}
 return {full,name:name.split(sep).join('/')||'.'};
}
function validateManifest(manifest){
 keys(manifest,['version','subject','sources','metadata','captures'],'manifest');
 demand(manifest.version===1&&typeof manifest.subject==='string'&&manifest.subject.trim(),'Expected version1 and a review subject');
 demand(Array.isArray(manifest.sources)&&manifest.sources.length&&manifest.sources.every(path=>typeof path==='string'),'Declare source files or directories');
 demand(new Set(manifest.sources).size===manifest.sources.length,'Duplicate source declarations');
 demand(Array.isArray(manifest.metadata??[]),'Expected metadata array');
 const paths=new Set();
 for(const entry of manifest.metadata??[]){
  keys(entry,['path','kind','reason'],'metadata projection');
  demand(typeof entry.path==='string'&&!paths.has(entry.path),'Duplicate or missing metadata path');paths.add(entry.path);
  demand(['ticket-lifecycle','ticket-snapshot'].includes(entry.kind),'Unknown metadata projection');
  demand(typeof entry.reason==='string'&&entry.reason.trim(),'Metadata projection needs a review reason');
 }
 demand(Array.isArray(manifest.captures)&&manifest.captures.length,'Declare the rendered captures inspected by the reviewer');
 for(const capture of manifest.captures){
  keys(capture,['path','viewport'],'capture');keys(capture.viewport,['width','height'],'viewport');
  demand(typeof capture.path==='string'&&['width','height'].every(key=>Number.isSafeInteger(capture.viewport[key])&&capture.viewport[key]>0),'Capture needs a relative path and positive viewport dimensions');
 }
 demand(new Set(manifest.captures.map(row=>row.path)).size===manifest.captures.length,'Duplicate capture declarations');
}
function normalizeTicket(text){
 const match=text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);demand(match,'Ticket projection needs frontmatter');
 const lines=match[1].split(/\r?\n/),state=lines.filter(line=>line.startsWith('status: '));
 demand(state.length===1&&statuses.has(state[0].slice(8)),'Ticket projection needs one known lifecycle status');
 const front=lines.map(line=>line.startsWith('status: ')?'status: <lifecycle>':line).join('\n');
 let body=text.slice(match[0].length).replace(/\r\n/g,'\n');
 const resolution=body.match(/^## Resolution(?: \([^\n]*\))?\n/m);
 if(resolution){const start=resolution.index,next=body.slice(start+resolution[0].length).search(/^## /m);body=body.slice(0,start)+(next<0?'':body.slice(start+resolution[0].length+next));}
 const ac=body.match(/^## Acceptance criteria\n([\s\S]*?)(?=^## |$(?![\s\S]))/m);
 if(ac)body=body.slice(0,ac.index)+ac[0].replace(/^- \[[ xX]\]/gm,'- [ ]')+body.slice(ac.index+ac[0].length);
 return '---\n'+front+'\n---\n'+body.trimEnd();
}
function normalizeSnapshot(value){
 demand(object(value)&&Array.isArray(value.tickets),'Ticket snapshot needs a tickets array');
 demand(value.tickets.every(ticket=>object(ticket)&&typeof ticket.id==='string'&&statuses.has(ticket.status)),'Ticket snapshot needs IDs and known lifecycle statuses');
 const {generated,frontier,...rest}=value;
 return {...rest,tickets:value.tickets.map(ticket=>({...ticket,status:'<lifecycle>'}))};
}
function projected(bytes,entry,path){
 if(!entry)return bytes;
 const text=bytes.toString('utf8');
 if(entry.kind==='ticket-lifecycle'){
  demand(/^\.tickets\/[^/]+\.md$/.test(path),'Ticket lifecycle projection is restricted to .tickets/*.md');
  return Buffer.from(normalizeTicket(text));
 }
 if(extname(path)==='.json')return Buffer.from(JSON.stringify(normalizeSnapshot(JSON.parse(text))));
 demand(extname(path)==='.html','Snapshot projection supports JSON or an HTML gm-tickets block');
 const pattern=/(<script\b[^>]*\bid=["']gm-tickets["'][^>]*>)([\s\S]*?)(<\/script>)/g,matches=[...text.matchAll(pattern)];
 demand(matches.length===1,'HTML snapshot needs exactly one gm-tickets block');
 return Buffer.from(text.replace(pattern,(_,open,json,close)=>open+JSON.stringify(normalizeSnapshot(JSON.parse(json)))+close));
}
function snapshot(root,manifest,receiptPath){
 const files=new Map(),projections=new Map((manifest.metadata??[]).map(entry=>[inside(root,entry.path).name,entry]));
 demand(projections.size===(manifest.metadata??[]).length,'Duplicate normalized metadata paths');
 const receiptName=inside(root,receiptPath).name;
 for(const path of manifest.sources){const source=inside(root,path);if(lstatSync(source.full).isDirectory())demand(source.name!=='.'&&!receiptName.startsWith(source.name+'/')&&receiptName!==source.name,'Receipt output must be outside the declared source scope');}
 function visit(path){const {full,name}=inside(root,path),stat=lstatSync(full);demand(!stat.isSymbolicLink(),'Review scope cannot traverse symlinks: '+name);
  if(stat.isDirectory()){for(const child of readdirSync(full).sort())visit(name==='.'?child:name+'/'+child);}
  else{demand(stat.isFile(),'Review source must be a regular file: '+name);files.set(name,full);}
 }
 for(const path of manifest.sources)visit(path);
 demand(!files.has(inside(root,receiptPath).name),'Receipt output must be outside the declared source scope');
 for(const path of projections.keys())demand(files.has(path),'Metadata projection is outside the source scope: '+path);
 const source=[...files].sort(([a],[b])=>a===b?0:a<b?-1:1).map(([path,full])=>{const bytes=projected(readFileSync(full),projections.get(path),path);return {path,projection:projections.get(path)?.kind??null,bytes:bytes.length,sha256:digest(bytes)};});
 const captures=manifest.captures.map(capture=>{const {full,name}=inside(root,capture.path);demand(lstatSync(full).isFile()&&!lstatSync(full).isSymbolicLink(),'Capture must be a regular file');const bytes=readFileSync(full);return {path:name,bytes:bytes.length,sha256:digest(bytes),viewport:capture.viewport};});
 demand(new Set(captures.map(row=>row.path)).size===captures.length,'Duplicate normalized capture paths');
 return {subject:manifest.subject,source,captures,sourceDigest:digest(JSON.stringify(source))};
}
function load(rootPath,manifestPath,receiptPath){
 const root=realpathSync(rootPath),manifestFile=inside(root,manifestPath),receiptFile=inside(root,receiptPath),raw=readFileSync(manifestFile.full),manifest=JSON.parse(raw);
 validateManifest(manifest);
 return {root,receiptFile,manifestDigest:digest(raw),...snapshot(root,manifest,receiptPath)};
}
function contentId(value){return digest(JSON.stringify({manifestDigest:value.manifestDigest,subject:value.subject,source:value.source,captures:value.captures,sourceDigest:value.sourceDigest}));}
function current(root,manifestPath,receiptPath){
 const actual=load(root,manifestPath,receiptPath),record=JSON.parse(readFileSync(actual.receiptFile.full));
 demand(record.version===1&&record.id===contentId(record),'Invalid review receipt identity');
 demand(record.manifestDigest===actual.manifestDigest,'Review scope/projections changed; obtain a new review');
 demand(record.id===contentId(actual),'Reviewed source or captures changed; obtain new captures and review');
 return {actual,record};
}
export function createReceipt(root,manifestPath,receiptPath){
 const value=load(root,manifestPath,receiptPath);demand(!existsSync(value.receiptFile.full),'Receipt already exists; retain it and choose a new receipt name');
 const {receiptFile,...snapshot}=value;delete snapshot.root;
 const record={version:1,...snapshot,id:contentId(snapshot),review:{outcome:'pending'}};
 writeFileSync(receiptFile.full,JSON.stringify(record,null,2)+'\n',{flag:'wx'});return record;
}
export function acceptReceipt(root,manifestPath,receiptPath,{expectedId,reviewer,note}){
 demand(typeof reviewer==='string'&&reviewer.trim()&&typeof note==='string'&&note.trim(),'Acceptance needs reviewer identity and review note');
 const {actual,record}=current(root,manifestPath,receiptPath);
 demand(expectedId===record.id,'Acceptance must name the snapshot ID the reviewer inspected');
 record.review={outcome:'accept',reviewer,note,acceptedAt:new Date().toISOString(),snapshotId:record.id};
 writeFileSync(actual.receiptFile.full,JSON.stringify(record,null,2)+'\n');return record;
}
export function checkReceipt(root,manifestPath,receiptPath){
 const {record}=current(root,manifestPath,receiptPath);
 demand(record.review?.outcome==='accept'&&record.review.snapshotId===record.id&&typeof record.review.reviewer==='string'&&record.review.reviewer.trim()&&typeof record.review.note==='string'&&record.review.note.trim(),'Receipt has no acceptance for this snapshot');
 return record;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const [command,root,manifest,receipt,...flags]=process.argv.slice(2);demand(root&&manifest&&receipt,'Usage: review-receipt.mjs create|accept|check ROOT MANIFEST RECEIPT [--expected-id ID --reviewer NAME --note TEXT]');let result;
  if(command==='accept'){demand(flags.length===6,'Acceptance needs --expected-id, --reviewer and --note');const options={};for(let i=0;i<flags.length;i+=2){demand(['--expected-id','--reviewer','--note'].includes(flags[i])&&!Object.hasOwn(options,flags[i]),'Unknown or duplicate acceptance option');options[flags[i]]=flags[i+1];}result=acceptReceipt(root,manifest,receipt,{expectedId:options['--expected-id'],reviewer:options['--reviewer'],note:options['--note']});}
  else{demand(flags.length===0,'Unexpected options');demand(['create','check'].includes(command),'Expected create, accept or check');result=(command==='create'?createReceipt:checkReceipt)(root,manifest,receipt);}
  console.log(JSON.stringify({id:result.id,sourceDigest:result.sourceDigest,outcome:result.review.outcome,files:result.source.length,captures:result.captures.length}));
 }catch(error){console.error(error.message);process.exitCode=1;}
}
