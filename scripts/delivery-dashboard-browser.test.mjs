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
async function pageFor(width,config,snapshot){const context=await browser.newContext({viewport:{width,height:1000}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.stack||e.message));await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:html(config,snapshot)}));await page.goto('http://dashboard.invalid/#plan');return {context,page,errors};}
const routeFixture={generated:'2026-11-05T00:00:00Z',frontier:['T1','T5'],executionOrder:['T4','T1','T2','T3','T5','T7','T6','T8'],tickets:[
 ticket('T1','open'),ticket('T2','open',['T1']),ticket('T3','in_progress',['T2']),ticket('T4','open',['T3']),
 ticket('T5','open'),ticket('T6','backlog'),ticket('T7','open',['T4']),ticket('T8','open',['T5','T7']),
]};
for(const width of [1280,390])test('Focus, Route and DAG retain independent selection at '+width,async()=>{
 const {context,page,errors}=await pageFor(width,{ticketFlow:{defaultScope:'all',scopes:[],view:'focus'}},routeFixture);
 try{
  await page.locator('#flow-content').waitFor({state:'attached'});
  assert.equal(await page.locator('#flow-content').getAttribute('data-view'),'focus',errors.join('; ')||'view mode did not initialize');
  assert.equal(await page.locator('.flow-scroll').isHidden(),true);
  assert.equal(await page.locator('.flow-focus-view').isVisible(),true);
  assert.equal(await page.locator('.flow-node[data-ticket=T3]').getAttribute('aria-pressed'),'true');
  await page.locator('#flow-focus-ticket').selectOption('T5');
  assert.equal(await page.locator('.focus-ticket-card h3').innerText(),'Fixture work T5');
  assert.deepEqual(await page.locator('.focus-neighbors').allInnerTexts().then(rows=>rows.map(text=>text.includes('T8'))),[false,true]);
  assert.match(await page.locator('.flow-detail').innerText(),/No dependency path to:/);
  await page.locator('#flow-view').selectOption('route');
  await page.locator('#flow-content[data-view=route]').waitFor();
  assert.equal(await page.locator('.flow-scroll').isHidden(),true);
  assert.equal(await page.locator('.flow-zoom-tools').isHidden(),true);
  assert.equal(await page.locator('.route-ticket').count(),8);
  assert.deepEqual(await page.locator('.route-ticket').evaluateAll(nodes=>nodes.map(n=>n.dataset.ticket)),['T1','T2','T3','T4','T5','T7','T6','T8']);
  assert.equal(await page.locator('.route-ticket[data-ticket=T5]').getAttribute('aria-pressed'),'true');
  assert.match(await page.locator('.route-ticket[data-ticket=T8]').innerText(),/Prerequisites: T5, T7/);
  assert.match(await page.locator('.flow-edge-legend').innerText(),/Prerequisite[\s\S]*Suggested sequence/);
  await page.locator('#flow-view').selectOption('dag');
  await page.locator('#flow-content[data-view=dag]').waitFor();
  assert.equal(await page.locator('.flow-scroll').isVisible(),true);
  assert.equal(await page.locator('.flow-zoom-tools').isVisible(),true);
  const baseScroll=await page.locator('.flow-scroll').evaluate(node=>node.scrollWidth);
  for(let i=0;i<5;i++)await page.getByRole('button',{name:'Zoom in'}).click();
  assert.equal(await page.locator('.flow-zoom-tools [aria-live=polite]').innerText(),'150%');
  assert.ok(await page.locator('.flow-scroll').evaluate(node=>node.scrollWidth)>=baseScroll*1.4);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.getByRole('button',{name:'Reset'}).click();
  assert.equal(await page.locator('.flow-zoom-tools [aria-live=polite]').innerText(),'100%');
  assert.equal(await page.locator('.flow-links path[data-kind=sequence]').count(),0);
  const independent=page.locator('.flow-node[data-ticket=T5]');assert.equal(await independent.getAttribute('aria-pressed'),'true');
  assert.deepEqual((await page.locator('.flow-links path[data-from]').evaluateAll(nodes=>nodes.map(n=>n.dataset.from+'>'+n.dataset.to))).sort(),['T1>T2','T2>T3','T3>T4','T4>T7','T5>T8','T7>T8']);
  await independent.focus();await page.keyboard.press('Enter');assert.equal(await independent.getAttribute('aria-pressed'),'true');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
 }finally{await context.close();}
});
test('Route labels a missing authored order instead of inventing one',async()=>{
 const oldSnapshot={generated:'2026-11-05T00:00:00Z',frontier:['alpha'],tickets:[ticket('alpha','open'),ticket('bravo','open')]};
 const {context,page,errors}=await pageFor(390,{ticketFlow:{defaultScope:'all',scopes:[],view:'route'}},oldSnapshot);
 try{
  assert.equal(await page.locator('.route-ticket').count(),2);
  assert.equal(await page.locator('.route-ticket[data-ticket=alpha] .route-order').innerText(),'F1');
  assert.match(await page.locator('.route-ticket[data-ticket=alpha]').innerText(),/Native frontier/);
  assert.equal(await page.locator('.route-ticket[data-ticket=bravo] .route-order').innerText(),'—');
  assert.match(await page.locator('.route-ticket[data-ticket=bravo]').innerText(),/Unsequenced/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
 }finally{await context.close();}
});
for (const width of [1280,390]) test('decision choices, notes and clipboard fallback at '+width, async()=>{
 const decision={id:'scope',question:'Which scope?',context:'Sets delivery time.',status:'open',options:[{id:'small',label:'Small',detail:'Ships sooner.'},{id:'large',label:'Large',detail:'More coverage.'}],recommended:'small',reason:'Validate early.'};
 const {context,page,errors}=await pageFor(width,{decisions:[decision,{...decision,id:'old',status:'answered',answer:'Confirmed in chat.'}]});
 try {
  await page.locator('#tab-overview').click(); await page.locator('#needs a[href="#decision-scope"]').click(); await page.locator('#decisions').waitFor({state:'visible'});
  assert.equal(await page.locator('#decision-instructions').isVisible(),true);
  assert.equal(await page.locator('#decision-scope-small').isChecked(),true);
  await page.locator('#decision-scope-large').check(); await page.locator('#decision-notes-scope').fill('Alternative with conditions');
  await page.locator('#tab-plan').click(); await page.locator('#tab-decisions').click(); await page.locator('#decisions').waitFor({state:'visible'});
  assert.equal(await page.locator('#decision-scope-large').isChecked(),true);
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw Error('denied');}},configurable:true}));
  await page.locator('#copy-decisions').click(); await page.waitForFunction(()=>document.querySelector('#decision-copy-status').textContent.includes('Clipboard unavailable'));
  assert.match(await page.locator('#decision-reply').inputValue(),/Choice: Large\nNotes: Alternative with conditions/);
  assert.equal((await page.locator('#decision-reply').inputValue()).includes('Confirmed'),false);
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.copied=text;}},configurable:true}));
  await page.locator('#copy-decisions').click(); await page.waitForFunction(()=>document.querySelector('#decision-copy-status').textContent.startsWith('Copied.'));
  assert.match(await page.evaluate(()=>window.copied),/Choice: Large/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true); assert.deepEqual(errors,[]);
 } finally {await context.close();}
});
for(const width of [1280,390]){
 test('remaining flow, filters, keyboard selection and complete status accounting at '+width,async()=>{
  const {context,page,errors}=await pageFor(width);
  try{
   await page.locator('.flow-node').first().waitFor();
   assert.equal(await page.locator('#plan > section').first().getAttribute('id'),'ticket-flow');
   await page.getByRole('link',{name:'Browse unfinished tickets'}).click();
   await page.waitForURL('**/#tickets-h');
   assert.deepEqual(await page.locator('#tickets > h3').allInnerTexts(),[
    'Unfinished work','In progress (1)','Open · can start (2)','Open · waiting (1)','Deferred (1)','Ticket history',
   ]);
   assert.equal(await page.locator('#done-group').getAttribute('open'),null);
   const activeFilter=page.getByRole('button',{name:'In progress 1',exact:true});
   await activeFilter.focus(); await page.keyboard.press('Enter');
   assert.equal(await activeFilter.evaluate(button=>document.activeElement===button),true);
   await page.keyboard.press('Enter');
   assert.equal(await page.locator('#flow-scope').inputValue(),'all');
   assert.match(await page.locator('.flow-notice').innerText(),/showing all remaining work/);
   assert.deepEqual((await page.locator('.flow-node').evaluateAll(nodes=>nodes.map(n=>n.dataset.ticket))).sort(),['active','finish','later','parallel','start']);
   await page.waitForFunction(()=>document.querySelectorAll('.flow-links path[data-from]').length===2);
   assert.deepEqual((await page.locator('.flow-links path[data-from]').evaluateAll(nodes=>nodes.map(n=>n.dataset.from+'>'+n.dataset.to))).sort(),['active>finish','start>active']);
   assert.match(await page.locator('.flow-counts').innerText(),/2 unblocked · 1 in progress · 1 waiting on tickets · 1 deferred · 5 shown/);
   assert.deepEqual(await page.locator('.flow-chain button').allInnerTexts(),['start','active','finish']);
   assert.deepEqual((await page.locator('.flow-node[data-critical=true]').evaluateAll(ns=>ns.map(n=>n.dataset.ticket))).sort(),['active','finish','start']);
   assert.deepEqual(await page.locator('.flow-start .flow-pick b').allInnerTexts(),['active','start','parallel']);
   assert.match(await page.locator('.flow-pick[data-state=ready]').first().innerText(),/unlocks 2/);
   const lefts=await page.evaluate(()=>['start','active','finish'].map(id=>document.querySelector('.flow-node[data-ticket='+id+']').offsetLeft));
   assert.ok(lefts[0]<lefts[1]&&lefts[1]<lefts[2],'each step sits in a later column: '+lefts);
   assert.equal(await page.locator('.flow-links path[data-critical=true]').count(),2);
   await page.locator('.flow-chain button',{hasText:'finish'}).click();assert.equal(await page.locator('.flow-node[data-ticket=finish]').getAttribute('aria-pressed'),'true');
   const start=page.locator('.flow-node[data-ticket=start]');await start.focus();await page.keyboard.press('Enter');
   assert.equal(await start.getAttribute('aria-pressed'),'true');assert.equal(await page.locator('.flow-node[data-ticket=finish]').getAttribute('data-related'),'after');assert.equal(await page.locator('.flow-node[data-ticket=parallel]').getAttribute('data-related'),'unrelated');
   assert.match(await page.locator('.flow-detail').innerText(),/base \(done\)/);assert.equal(await page.locator('.flow-links path[data-related=true]').count(),2);
   const detail=await page.locator('.flow-detail').boundingBox(), graph=await page.locator('.flow-scroll').boundingBox();
   assert.ok(width>760 ? detail.x>=graph.x+graph.width : detail.y<graph.y);
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
   const expected=consumer.tickets.filter(t=>t.status!=='done'&&t.status!=='cancelled');
   assert.deepEqual((await page.locator('.flow-node').evaluateAll(ns=>ns.map(n=>n.dataset.ticket))).sort(),expected.map(t=>t.id).sort());
   const ids=new Set(expected.map(t=>t.id)),edges=expected.flatMap(t=>(t.blocked_by||[]).filter(id=>ids.has(id)).map(id=>id+'>'+t.id)).sort();
   await page.waitForFunction(n=>document.querySelectorAll('.flow-links path[data-from]').length===n,edges.length);
   assert.deepEqual((await page.locator('.flow-links path[data-from]').evaluateAll(ns=>ns.map(n=>n.dataset.from+'>'+n.dataset.to))).sort(),edges);
   assert.match(await page.locator('.flow-counts').innerText(),new RegExp(expected.length+' shown'));
   if(process.env.DASHBOARD_CAPTURE_DIR){mkdirSync(process.env.DASHBOARD_CAPTURE_DIR,{recursive:true});await page.screenshot({path:resolve(process.env.DASHBOARD_CAPTURE_DIR,'consumer-dag-'+width+'.png'),fullPage:true});}
   await page.locator('#flow-view').selectOption('route');
   assert.equal(await page.locator('.route-ticket').count(),expected.length);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   if(process.env.DASHBOARD_CAPTURE_DIR)await page.screenshot({path:resolve(process.env.DASHBOARD_CAPTURE_DIR,'consumer-route-'+width+'.png'),fullPage:true});
   await page.locator('#flow-view').selectOption('focus');
   await page.locator('#flow-focus-ticket').selectOption(expected[expected.length-1].id);
   assert.equal(await page.locator('.focus-ticket-card').count(),1);
   if(process.env.DASHBOARD_CAPTURE_DIR)await page.screenshot({path:resolve(process.env.DASHBOARD_CAPTURE_DIR,'consumer-focus-'+width+'.png'),fullPage:true});
   const overflow=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth,elements:Array.from(document.body.querySelectorAll('*')).filter(node=>node.getBoundingClientRect().right>innerWidth+1).slice(0,8).map(node=>({tag:node.tagName,id:node.id,className:node.className,right:node.getBoundingClientRect().right,width:node.getBoundingClientRect().width}))}));
   assert.ok(overflow.width<=overflow.viewport,JSON.stringify(overflow));assert.deepEqual(errors,[]);
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
