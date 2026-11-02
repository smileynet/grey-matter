import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const { chromium } = await import(pathToFileURL(path.resolve(process.env.PLAYWRIGHT_MODULE ?? '.scratch/orchestration-browser/node_modules/playwright-core/index.mjs')));
const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const evidence = process.env.DASHBOARD_CAPTURE_DIR ?? 'docs/agents/research/evidence/orchestration-dashboard';
fs.mkdirSync(evidence, { recursive: true });
try {
  for (const width of [1280, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(pathToFileURL(path.resolve('docs/orchestration.html')).href);
    assert.equal(await page.getByRole('tab').count(), 2);
    assert.equal(await page.locator('#finding-cards article').count(), 7);
    assert.equal(await page.locator('#possibilities article').count(), 2);
    assert.equal(await page.locator('details[open]').count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: `${evidence}/findings-${width}.png`, fullPage: true });
    await page.getByRole('tab', { name: 'Findings', exact: true }).focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#tickets').isVisible(), true);
    const data = await page.locator('#gm-tickets').evaluate(n => JSON.parse(n.textContent));
    assert.equal(await page.locator('.ticket').count(), data.tickets.length);
    assert.equal(await page.locator('.ticket[open]').count(), 0);
    assert.equal(await page.locator('#flow path').count(), data.tickets.filter(t => ['open', 'in_progress'].includes(t.status)).reduce((n, t) => n + t.blocked_by.filter(id => data.tickets.some(p => p.id === id && ['open', 'in_progress'].includes(p.status))).length, 0));
    await page.getByLabel('Search tickets').fill('Research Agent Client Protocol');
    assert.equal(await page.locator('#ticket-187').isVisible(), true);
    assert.equal(await page.locator('#ticket-95').isVisible(), false);
    await page.locator('#ticket-187 > summary').click();
    assert.equal(await page.locator('#ticket-187').getAttribute('open'), '');
    await page.locator('#ticket-187 > summary').click();
    await page.getByLabel('Search tickets').fill('');
    await page.getByLabel('Filter ticket status').selectOption('done');
    assert.equal(await page.locator('.ticket:visible').count(), data.tickets.filter(t => t.status === 'done').length);
    await page.getByLabel('Filter ticket status').selectOption('all');
    await page.getByLabel('Include completed work').check();
    assert.equal(await page.locator('.node').count(), data.tickets.length);
    await page.getByLabel('Include completed work').uncheck();
    await page.locator('[data-node="174"]').click();
    await page.getByRole('button', { name: 'Open ticket details', exact: true }).click();
    assert.equal(await page.locator('#ticket-174').getAttribute('open'), '');
    await page.locator('#ticket-174 > summary').click();
    await page.locator('#flow-selection').evaluate(n => n.textContent = 'Pick any ticket in the diagram.');
    await page.locator('#open-selected').evaluate(n => n.hidden = true);
    await page.locator('.node.selected').evaluateAll(nodes => nodes.forEach(n => n.classList.remove('selected')));
    await page.locator('.flow-scroll').evaluate(n => { n.scrollTop = 0; n.scrollLeft = 0; });
    await page.evaluate(() => scrollTo(0, 0));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: `${evidence}/tickets-${width}.png`, fullPage: true });
    assert.deepEqual(errors, []);
    console.log(`PASS ${width}px: local-file rendering, two tabs, default collapse, scoped rows, real edges, search, status filter, complete-work toggle, flow-to-detail, keyboard navigation, no page overflow or script errors.`);
    await page.close();
  }
} finally { await browser.close(); }
