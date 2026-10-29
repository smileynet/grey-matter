// Read-only verification of the exact reviewed carrier, including hosted CI bytes.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readStagedCandidate,readStagedTktCandidate} from '../../../../scripts/release-staging.mjs';
import {githubActionsReadApi} from '../../../../scripts/release-ci-artifacts.mjs';
const repo=resolve(dirname(fileURLToPath(import.meta.url)),'../../../..');
const reviewSha=process.argv[2];
if(!/^[a-f0-9]{40}$/.test(reviewSha??''))throw Error('Supply explicit 40-character review commit');
const base='docs/agents/releases/20261029',indexFile=base+'/index.json';
const git=(...args)=>execFileSync('git',['-C',repo,...args],{env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},maxBuffer:32*1024*1024});
const hash=b=>createHash('sha256').update(b).digest('hex');
const inventory=JSON.parse(git('show',`${reviewSha}:${base}/inventory.json`));
for(const item of inventory.files){
 const mode=git('ls-tree',reviewSha,'--',item.file).toString().split('\t')[0];
 if(!/^100(?:644|755) blob [a-f0-9]{40}$/.test(mode))throw Error(`Non-regular carrier file: ${item.file}`);
 const bytes=git('show',`${reviewSha}:${item.file}`);
 if(bytes.length!==item.size||hash(bytes)!==item.sha256||hash(readFileSync(resolve(repo,item.file)))!==item.sha256)throw Error(`Carrier hash differs: ${item.file}`);
}
const rows=[];
for(const product of ['grey-matter','tkt']){
 const options={reviewRepo:repo,reviewSha,indexFile,product,artifacts:resolve(repo,base,product,'artifacts'),evidence:resolve(repo,base,product,'evidence')};
 const candidate=product==='tkt'?await readStagedTktCandidate({...options,api:githubActionsReadApi()}):readStagedCandidate(options);
 rows.push({product,candidateSha:candidate.candidateSha,version:candidate.version,assets:candidate.assets.map(({name,size,sha256})=>({name,size,sha256})),gates:candidate.gates,ciStage:candidate.ciStage??null});
}
console.log(JSON.stringify({schema:1,status:'pass',reviewSha,indexFile,regularCarrierFiles:inventory.files.length,rows,publicationPerformed:false},null,2));
