import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const template=readFileSync(resolve(root,'skills/productivity/delivery-dashboard/assets/dashboard-template.html'),'utf8');
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||pathToFileURL(resolve(dirname(process.execPath),'../lib/node_modules/playwright/index.mjs')).href);
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
test.after(()=>browser.close());
const ticket=(id,status,blocked_by=[],tags=[])=>({id,title:'Fixture work '+id,status,blocked_by,tags});
const snap={generated:'2026-10-31T00:00:00Z',frontier:['start','parallel'],tickets:[ticket('base','done',[],['archive']),ticket('start','open',['base'],['build']),ticket('active','in_progress',['start'],['build']),ticket('finish','open',['active'],['build']),ticket('later','backlog',[],['future']),ticket('parallel','open',[],['other'])]};
function html(config={},snapshot=snap){return template.replace(/(<script type="application\/json" id="gm-config">)[\s\S]*?(<\/script>)/,'$1'+JSON.stringify({project:'Synthetic flow fixture',ticketFlow:{defaultScope:'archive',scopes:[{id:'archive',label:'Completed stream',tags:['archive']},{id:'build',label:'Build stream',tags:['build']}]},...config})+'$2').replace(/(<script type="application\/json" id="gm-tickets">)[\s\S]*?(<\/script>)/,'$1'+JSON.stringify(snapshot)+'$2');}
async function pageFor(width,config,snapshot){const context=await browser.newContext({viewport:{width,height:1000}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:html(config,snapshot)}));await page.goto('http://dashboard.invalid/#plan');return {context,page,errors};}
for(const width of [1280,390]){
 test('remaining flow, filters, keyboard selection and complete status accounting at '+width,async()=>{
  const {context,page,errors}=await pageFor(width);
  try{
   await page.locator('.flow-node').first().waitFor();
   assert.equal(await page.locator('#plan > section').first().getAttribute('id'),'ticket-flow');
   assert.equal(await page.locator('#flow-scope').inputValue(),'all');
   assert.match(await page.locator('.flow-notice').innerText(),/showing all remaining work/);
   assert.deepEqual((await page.locator('.flow-node').evaluateAll(nodes=>nodes.map(n=>n.dataset.ticket))).sort(),['active','finish','later','parallel','start']);
   await page.waitForFunction(()=>document.querySelectorAll('.flow-links path[data-from]').length===2);
   assert.deepEqual((await page.locator('.flow-links path[data-from]').evaluateAll(nodes=>nodes.map(n=>n.dataset.from+'>'+n.dataset.to))).sort(),['active>finish','start>active']);
   assert.match(await page.locator('.flow-counts').innerText(),/2 prerequisites met · 1 in progress · 1 waiting · 1 deferred · 0 done · 5 shown/);
   const start=page.locator('.flow-node[data-ticket=start]');await start.focus();await page.keyboard.press('Enter');
   assert.equal(await start.getAttribute('aria-pressed'),'true');assert.equal(await page.locator('.flow-node[data-ticket=finish]').getAttribute('data-related'),'after');assert.equal(await page.locator('.flow-node[data-ticket=parallel]').getAttribute('data-related'),'unrelated');
   assert.match(await page.locator('.flow-detail').innerText(),/base \(done\)/);assert.equal(await page.locator('.flow-links path[data-related=true]').count(),2);
   await page.locator('.flow-options > summary').click();await page.locator('#flow-completed').check();await page.locator('.flow-node[data-ticket=base]').waitFor();assert.equal(await page.locator('.flow-node[data-ticket=base]').getAttribute('data-related'),'before');
   await page.locator('#flow-scope').selectOption('archive');assert.equal(await page.locator('.flow-node').count(),1);assert.match(await page.locator('.flow-notice').innerText(),/5 unfinished tickets are outside/);
   await page.locator('#flow-completed').uncheck();assert.equal(await page.locator('#flow-scope').inputValue(),'all');assert.equal(await page.locator('.flow-node').count(),5);
   await page.locator('#flow-deferred').uncheck();assert.equal(await page.locator('.flow-node[data-ticket=later]').count(),0);await page.locator('#flow-deferred').check();
   await page.locator('#flow-scope').selectOption('build');assert.equal(await page.locator('.flow-node').count(),3);assert.match(await page.locator('.flow-notice').innerText(),/2 unfinished tickets are outside/);
   await page.locator('#flow-scope').selectOption('all');await page.locator('.flow-options > summary').click();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   assert.deepEqual(errors,[]);
   if(process.env.DASHBOARD_CAPTURE_DIR){mkdirSync(process.env.DASHBOARD_CAPTURE_DIR,{recursive:true});await page.screenshot({path:resolve(process.env.DASHBOARD_CAPTURE_DIR,'remaining-flow-'+width+'.png'),fullPage:true});}
  }finally{await context.close();}
 });
}
test('flow can be disabled without dropping the existing ticket list',async()=>{const {context,page,errors}=await pageFor(390,{ticketFlow:false});try{assert.equal(await page.locator('#ticket-flow').isVisible(),false);assert.equal(await page.locator('#t-start').count(),1);assert.equal(await page.locator('#plan-lanes').isVisible(),true);assert.deepEqual(errors,[]);}finally{await context.close();}});

if(process.env.DASHBOARD_CONSUMER_SNAPSHOT){
 const source=readFileSync(process.env.DASHBOARD_CONSUMER_SNAPSHOT,'utf8');
 const consumer=JSON.parse(source.match(/<script type="application\/json" id="gm-tickets">([\s\S]*?)<\/script>/)[1]);
 for(const width of [1280,390])test('actual consumer snapshot remains complete at '+width,async()=>{
  const {context,page,errors}=await pageFor(width,{ticketFlow:{defaultScope:'all',scopes:[]}},consumer);
  try{
   const expected=consumer.tickets.filter(t=>t.status!=='done');
   assert.deepEqual((await page.locator('.flow-node').evaluateAll(ns=>ns.map(n=>n.dataset.ticket))).sort(),expected.map(t=>t.id).sort());
   const ids=new Set(expected.map(t=>t.id)),edges=expected.flatMap(t=>(t.blocked_by||[]).filter(id=>ids.has(id)).map(id=>id+'>'+t.id)).sort();
   await page.waitForFunction(n=>document.querySelectorAll('.flow-links path[data-from]').length===n,edges.length);
   assert.deepEqual((await page.locator('.flow-links path[data-from]').evaluateAll(ns=>ns.map(n=>n.dataset.from+'>'+n.dataset.to))).sort(),edges);
   assert.match(await page.locator('.flow-counts').innerText(),new RegExp(expected.length+' shown'));
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
   if(process.env.DASHBOARD_CAPTURE_DIR)await page.screenshot({path:resolve(process.env.DASHBOARD_CAPTURE_DIR,'consumer-flow-'+width+'.png'),fullPage:true});
  }finally{await context.close();}
 });
}

test('prototype-like ticket IDs remain selectable after a flow redraw',async()=>{
 const snapshot={tickets:[ticket('__proto__','open'),ticket('constructor','open',['__proto__']),ticket('toString','open',['constructor'])],frontier:['__proto__']};
 const {context,page,errors}=await pageFor(390,{ticketFlow:{defaultScope:'all',scopes:[]}},snapshot);
 try{
  for(const id of ['__proto__','constructor','toString']){const node=page.locator('.flow-node[data-ticket="'+id+'"]');await node.click();assert.equal(await node.getAttribute('aria-pressed'),'true');}
  await page.locator('.flow-options > summary').click();await page.locator('#flow-completed').check();
  await page.locator('.flow-node[data-ticket="constructor"]').click();
  assert.equal(await page.locator('.flow-node[data-ticket="__proto__"]').getAttribute('data-related'),'before');
  assert.equal(await page.locator('.flow-node[data-ticket="toString"]').getAttribute('data-related'),'after');
  assert.deepEqual(errors,[]);
 }finally{await context.close();}
});
