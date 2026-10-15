import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createSiteServer } from './serve.mjs';
const require=createRequire(import.meta.url);
const server=createSiteServer();
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}/`;
let browser;
const results=[];
async function check(name,fn) { await fn(); results.push(name); console.log(`PASS ${name}`); }
try {
  browser=await chromium.launch({executablePath:process.env.CHROME_PATH || '/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for (const path of ['','about.html']) {
    await page.goto(new URL(path,base).href);
    await check(`${path || 'index'}: axe WCAG and best practices`,async()=>{
      await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
      const violations=await page.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']}})).violations);
      assert.deepEqual(violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);
    });
    await check(`${path || 'index'}: metadata and canonical consistency`,async()=>{
      assert.equal(await page.locator('html').getAttribute('lang'),'en');
      assert.ok((await page.title()).length>15);
      assert.ok((await page.locator('meta[name=description]').getAttribute('content')).length>50);
      const canonical=await page.locator('link[rel=canonical]').getAttribute('href');
      assert.equal(canonical,`https://byebyeskiy.github.io/front-lab-4-5/${path}`);
      assert.equal(await page.locator('meta[property="og:url"]').getAttribute('content'),canonical);
      assert.equal(await page.locator('meta[name=robots][content*=noindex]').count(),0);
      for (const prop of ['title','description','type','image']) assert.ok(await page.locator(`meta[property="og:${prop}"]`).getAttribute('content'));
    });
    await check(`${path || 'index'}: every local link, fragment and asset exists`,async()=>{
      const links=await page.locator('[href], img[src], script[src]').evaluateAll(ns=>ns.map(n=>n.href || n.src).filter(Boolean));
      for (const href of links) {
        const u=new URL(href);
        if(u.origin!==new URL(base).origin) continue;
        assert.notEqual(u.href,base+'#');
        const response=await page.request.get(u.href);assert.equal(response.status(),200,u.href);
        if(u.hash) { const html=await response.text(); assert.ok(html.includes(`id="${u.hash.slice(1)}"`),u.href); }
      }
    });
  }
  await page.goto(base);
  await check('keyboard order reaches hero CTA and real form submit with visible focus',async()=>{
    const ids=[];
    for(let i=0;i<60;i++) {
      await page.keyboard.press('Tab');
      const f=await page.evaluate(()=>({id:document.activeElement.id,outline:getComputedStyle(document.activeElement).outlineStyle}));
      assert.notEqual(f.outline,'none');ids.push(f.id);if(f.id==='trial-submit')break;
    }
    assert.ok(ids.includes('hero-cta'));assert.equal(ids.at(-1),'trial-submit');
  });
  await check('native CTA activates with Space and focuses trial name',async()=>{
    await page.locator('#hero-cta').focus();await page.keyboard.press('Space');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'trial-name');
  });
  await check('FAQ Enter/Space synchronize hidden state and AX expanded state',async()=>{
    const q=page.locator('.faq__q').first(),a=page.locator('.faq__a').first();
    assert.equal(await q.getAttribute('aria-expanded'),'false');assert.equal(await a.isVisible(),false);
    await q.focus();await page.keyboard.press('Enter');assert.equal(await a.isVisible(),true);assert.equal(await q.getAttribute('aria-expanded'),'true');
    await page.keyboard.press('Space');assert.equal(await a.isVisible(),false);assert.equal(await q.getAttribute('aria-expanded'),'false');
    assert.equal(await q.getAttribute('aria-controls'),await a.getAttribute('id'));
  });
  await check('empty form identifies both errors as text and focuses first invalid field',async()=>{
    await page.locator('#trial-submit').click();
    assert.equal(await page.evaluate(()=>document.activeElement.id),'trial-name');
    assert.equal(await page.locator('[aria-invalid=true]').count(),2);
    assert.match(await page.locator('#email-error').textContent(),/email/);
  });
  await check('invalid email is rejected; Enter submits a valid demo without network',async()=>{
    await page.locator('#trial-name').fill('Test Student');await page.locator('#trial-email').fill('invalid');
    await page.locator('#trial-submit').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'trial-email');
    assert.match(await page.locator('#email-error').textContent(),/valid email/);
    await page.locator('#trial-email').fill('student@example.com');await page.keyboard.press('Enter');
    assert.equal(await page.locator('[aria-invalid=true]').count(),0);
    assert.match(await page.locator('#trial-status').textContent(),/No account was created/);
  });
  await check('JSON-LD matches visible Pro price and contains no invented rating',async()=>{
    const data=JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
    assert.equal(data['@type'],'SoftwareApplication');assert.equal(data.offers.price,'29.00');assert.equal(data.offers.priceCurrency,'USD');
    assert.match(await page.locator('.plan--featured .plan__price').textContent(),/\$29/);assert.equal(data.aggregateRating,undefined);
  });
  await check('robots allows render resources; sitemap lists canonical pages',async()=>{
    const robots=await (await page.request.get(base+'robots.txt')).text();assert.ok(!/Disallow: \/(?:css|img|js)\//.test(robots));
    const sitemap=await (await page.request.get(base+'sitemap.xml')).text();
    const locs=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
    assert.deepEqual(locs,['https://byebyeskiy.github.io/front-lab-4-5/','https://byebyeskiy.github.io/front-lab-4-5/about.html']);
  });
  await check('responsive layout and navigation at 320, 390, 768 and 1440 CSS px',async()=>{
    for(const width of [320,390,768,1440]) {
      await page.setViewportSize({width,height:1000});await page.goto(base);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`Overflow at ${width}`);
      assert.equal(await page.locator('.nav').isVisible(),true,`Navigation hidden at ${width}`);
      await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
      const violations=await page.evaluate(async()=> (await axe.run()).violations.map(v=>v.id));assert.deepEqual(violations,[],`axe at ${width}`);
    }
  });
  await check('no JavaScript runtime exceptions',async()=>assert.deepEqual(errors,[]));
  await mkdir('audit/evidence/after',{recursive:true});
  await writeFile('audit/evidence/after/tests.json',JSON.stringify({timestamp:new Date().toISOString(),browser:browser.version(),passed:results.length,tests:results},null,2));
  console.log(`${results.length} checks passed.`);
} finally { await browser?.close(); await new Promise(resolve=>server.close(resolve)); }
