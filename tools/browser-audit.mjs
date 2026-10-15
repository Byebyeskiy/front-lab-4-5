import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const base = process.env.AUDIT_URL || 'http://127.0.0.1:8000/';
const phase = process.argv[2] || 'after';
if (!['before', 'after'].includes(phase)) throw new Error('Use before or after');
const out = `audit/evidence/${phase}`;
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.addInitScript(() => {
  window.auditPerf = { lcp: [], shifts: [], events: [] };
  new PerformanceObserver(list => list.getEntries().forEach(e => window.auditPerf.lcp.push({ time: e.startTime, tag: e.element?.tagName, className: e.element?.className, url: e.url }))).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver(list => list.getEntries().forEach(e => window.auditPerf.shifts.push({ value: e.value, recentInput: e.hadRecentInput, sources: e.sources?.map(s => s.node?.className) }))).observe({ type: 'layout-shift', buffered: true });
});
const result = { base, phase, timestamp: new Date().toISOString(), browser: browser.version(), pages: {} };
for (const path of ['', 'about.html']) {
  await page.goto(new URL(path, base).href);
  await page.waitForTimeout(1800);
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  const axe = await page.evaluate(async () => {
    const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice'] } });
    return { version: axe.version, violations: r.violations, incomplete: r.incomplete, passes: r.passes.map(x => x.id) };
  });
  const key = path ? 'about' : 'index';
  await writeFile(`${out}/axe-${key}.json`, JSON.stringify(axe, null, 2));
  await page.screenshot({ path: `${out}/${key}-desktop.png`, fullPage: true });
  const cdp = await context.newCDPSession(page);
  const tree = await cdp.send('Accessibility.getFullAXTree');
  await writeFile(`${out}/ax-${key}.json`, JSON.stringify(tree, null, 2));
  const headings = await page.locator('h1,h2,h3,h4').allTextContents();
  const seo = await page.evaluate(() => ({ title: document.title, lang: document.documentElement.lang, description: document.querySelector('meta[name=description]')?.content, robots: document.querySelector('meta[name=robots]')?.content, canonical: document.querySelector('link[rel=canonical]')?.href, og: [...document.querySelectorAll('meta[property^="og:"]')].map(n => [n.getAttribute('property'),n.content]), jsonld: [...document.querySelectorAll('script[type="application/ld+json"]')].map(n => JSON.parse(n.textContent)), brokenFragments: [...document.querySelectorAll('a[href^="#"]')].filter(n => n.hash && !document.getElementById(n.hash.slice(1))).map(n => n.getAttribute('href')) }));
  result.pages[key] = { violations: axe.violations.map(v => ({ id:v.id, nodes:v.nodes.length })), incomplete: axe.incomplete.map(v => v.id), headings, seo, performance: await page.evaluate(() => window.auditPerf) };
  await cdp.detach();
}
await page.goto(base);
await page.waitForTimeout(1800);
const tabs = [];
for (let i=0; i<65; i++) {
  await page.keyboard.press('Tab');
  const focus = await page.evaluate(() => { const n = document.activeElement; const r = n.getBoundingClientRect(); const c = getComputedStyle(n); return { tag: n.tagName, id: n.id, text: n.getAttribute('aria-label') || n.textContent.trim().slice(0,80), outline: c.outlineStyle, top: r.top, bottom: r.bottom }; });
  tabs.push(focus);
  if (focus.id === 'trial-submit') break;
}
result.tabs = tabs;
const q = page.locator('.faq__q').first();
result.faq = { before: { expanded: await q.getAttribute('aria-expanded'), visible: await page.locator('.faq__a').first().isVisible() } };
await q.focus();
await page.keyboard.press('Enter');
result.faq.after = { expanded: await q.getAttribute('aria-expanded'), visible: await page.locator('.faq__a').first().isVisible() };
// Measure actual event handler via DevTools timeline, rather than reporting it as field INP.
const session = await context.newCDPSession(page);
await session.send('Profiler.enable');
await session.send('Profiler.start');
const duration = await page.evaluate(() => {
  const start = performance.now();
  document.getElementById('header-cta').click();
  return performance.now()-start;
});
const profile = await session.send('Profiler.stop');
await writeFile(`${out}/signup-cpu-profile.json`, JSON.stringify(profile));
result.signupHandlerMs = duration;
result.errors = errors;
await page.setViewportSize({width:390,height:844});
await page.goto(base);
await page.waitForTimeout(1800);
result.mobileOverflow = await page.evaluate(() => ({ viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
await page.screenshot({path:`${out}/index-mobile.png`,fullPage:true});
await writeFile(`${out}/summary.json`, JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
await browser.close();
