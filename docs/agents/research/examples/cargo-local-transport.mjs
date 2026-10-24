#!/usr/bin/env node
// Capture four Cargo upload cases against a disposable localhost registry; never forward requests.
// Usage: node docs/agents/research/examples/cargo-local-transport.mjs
// Requires Cargo 1.99.1 and Git. Retains fixture captures in the reported temporary directory.
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, mkdtempSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
async function main() {
const root=mkdtempSync(join(tmpdir(),'tkt local Cargo transport ')), source=join(root,'source'), home=join(root,'cargo-home');
mkdirSync(join(source,'src'),{recursive:true});mkdirSync(home);mkdirSync(join(root,'home'));
const clean=Object.fromEntries(Object.entries(process.env).filter(([key])=>!/^CARGO_|^GIT_|TOKEN|PASSWORD|SECRET|CREDENTIAL|PROXY|^HOME$|^USERPROFILE$/i.test(key)));
const env={...clean,HOME:join(root,'home'),CARGO_HOME:home,CARGO_REGISTRIES_PROBE_TOKEN:'local-probe-only',CARGO_REGISTRIES_PROBE_CREDENTIAL_PROVIDER:'cargo:token',CARGO_HTTP_PROXY:'',NO_PROXY:'127.0.0.1',GIT_CONFIG_GLOBAL:join(root,'empty-gitconfig'),GIT_CONFIG_NOSYSTEM:'1',GIT_NO_REPLACE_OBJECTS:'1'};
writeFileSync(join(root,'empty-gitconfig'),'');
const calls=[];let captured;
const server=createServer(async(req,res)=>{
 calls.push({method:req.method,path:req.url});
 if(req.method==='GET'&&req.url==='/index/config.json'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({api:`http://127.0.0.1:${server.address().port}`,dl:`http://127.0.0.1:${server.address().port}/download`}));return;}
 if(req.method==='PUT'&&req.url==='/api/v1/crates/new'){
  const chunks=[];let received=0;for await(const chunk of req){received+=chunk.length;if(received>1024*1024){req.destroy();return;}chunks.push(chunk);}const body=Buffer.concat(chunks);
  if(body.length<8){res.statusCode=400;res.end('Invalid capture envelope');return;}
  const n=body.readUInt32LE(0), offset=4+n;
  if(offset>body.length-4){res.statusCode=400;res.end('Invalid metadata length');return;}
  const size=body.readUInt32LE(offset);if(offset+4+size!==body.length){res.statusCode=400;res.end('Invalid crate length');return;}
  captured=body.subarray(offset+4);writeFileSync(join(root,'captured.crate'),captured);writeFileSync(join(root,'request-metadata.json'),body.subarray(4,offset));
  res.statusCode=400;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({errors:[{detail:'Local transport capture completed; deliberate refusal, nothing forwarded'}]}));return;
 }
 res.statusCode=404;res.end('not found');
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const index=`sparse+http://127.0.0.1:${server.address().port}/index/`;
env.CARGO_REGISTRIES_PROBE_INDEX=index;
writeFileSync(join(home,'config.toml'),`[registries.probe]\nindex = "${index}"\ncredential-provider = "cargo:token"\n`);
writeFileSync(join(source,'Cargo.toml'),'[package]\nname="tkt-local-transport-fixture"\nversion="0.0.1"\nedition="2021"\npublish=["probe"]\ninclude=["/src/**","/Cargo.toml","/Cargo.lock"]\n');
writeFileSync(join(source,'src/main.rs'),'fn main() {}\n');
const command=(bin,args)=>new Promise((resolve,reject)=>{const p=spawn(bin,args,{cwd:source,env,stdio:['ignore','pipe','pipe']});let stdout='',stderr='';p.stdout.on('data',x=>stdout+=x);p.stderr.on('data',x=>stderr+=x);p.on('error',reject);p.on('exit',code=>resolve({code,stdout,stderr}));});
const run=async(bin,args)=>{const r=await command(bin,args);if(r.code)throw Error(`${bin} failed: ${r.stderr}`);return r;};
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
try {
 const cargoVersion=await run('cargo',['--version']);if(!cargoVersion.stdout.startsWith('cargo 1.99.1 '))throw Error('This probe requires Cargo 1.99.1');
 await run('git',['init']);await run('cargo',['generate-lockfile','--offline']);await run('git',['add','.']);await run('git',['-c','user.name=Probe','-c','user.email=probe@example.invalid','-c',`core.hooksPath=${join(root,'no-hooks')}`,'commit','-m','Fixture']);
 await run('cargo',['package','--registry','probe','--locked','--no-verify','--target-dir',join(root,'target')]);
 const archive=join(root,'target/package/tkt-local-transport-fixture-0.0.1.crate');copyFileSync(archive,join(root,'sealed.crate'));const sealed=digest(readFileSync(archive));
 const publication=await command('cargo',['publish','--registry','probe','--locked','--no-verify','--target-dir',join(root,'target')]);
 const cases=[{name:'baseline',cargoExit:publication.code,puts:calls.filter(c=>c.method==='PUT').length,capturedSha256:captured?digest(captured):null,matchesSeal:captured&&digest(captured)===sealed}];
 if(cases[0].cargoExit!==101||cases[0].puts!==1||!cases[0].matchesSeal)throw Error('Baseline transport did not match the seal and deliberate refusal');
 copyFileSync(join(root,'captured.crate'),join(root,'baseline-captured.crate'));
 const capture=async(name,args=[])=>{const before=calls.filter(c=>c.method==='PUT').length;captured=null;const r=await command('cargo',['publish','--registry','probe','--locked','--no-verify','--target-dir',join(root,'target'),...args]);const row={name,cargoExit:r.code,puts:calls.filter(c=>c.method==='PUT').length-before,capturedSha256:captured?digest(captured):null,matchesSeal:captured?digest(captured)===sealed:null,stderr:r.stderr};if(captured)writeFileSync(join(root,`${name}-captured.crate`),captured);cases.push(row);return row;};
 writeFileSync(archive,'Corrupted preexisting crate');
 const replaced=await capture('corrupted-output');if(replaced.cargoExit!==101||replaced.puts!==1||!replaced.matchesSeal)throw Error('Cargo did not replace corrupt output with original source bytes');
 writeFileSync(join(source,'src/main.rs'),'fn main() { println!("changed"); }\n');
 const dirty=await capture('dirty-source');if(dirty.puts!==0||dirty.cargoExit!==101||!dirty.stderr.includes('allow-dirty'))throw Error('Dirty source was not refused before PUT');
 const allowed=await capture('dirty-source-allowed',['--allow-dirty']);if(allowed.cargoExit!==101||allowed.puts!==1||allowed.matchesSeal!==false)throw Error('Allow-dirty mutation did not expose repackaging boundary');
 const record={status:'pass',cargoVersion:cargoVersion.stdout.trim(),root,index,cases,calls,sealedSha256:sealed,realRegistryPublication:false,limits:['Dependency-free fixture; no production upload mechanism','No OS egress filter; isolated Cargo config names only loopback registry, fixture publish allowlist contains only probe, dummy token only','Default clean-source refusal is observed; no proof of arbitrary concurrent mutation safety']};
 writeFileSync(join(root,'result.json'),JSON.stringify(record,null,2));console.log(JSON.stringify(record,null,2));
} finally {await new Promise(resolve=>server.close(resolve));}

}
main().catch(error=>{console.error(JSON.stringify({status:"error",errors:[error.message]}));process.exitCode=2;});
