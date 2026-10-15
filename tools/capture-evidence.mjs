import { chromium } from 'playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
const browser = await chromium.launch({executablePath:process.env.CHROME_PATH || '/usr/bin/chromium',args:['--no-sandbox']});
try {
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  const out='audit/evidence/after';await mkdir(out,{recursive:true});
  await page.goto(process.env.AUDIT_URL || 'http://127.0.0.1:8000/');
  await page.locator('#trial-submit').click();
  await page.screenshot({path:`${out}/form-errors.png`});
  await page.locator('.faq__q').first().focus();await page.keyboard.press('Enter');
  await page.screenshot({path:`${out}/faq-focus.png`});
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('Tracing.start',{categories:'devtools.timeline,blink.user_timing',transferMode:'ReturnAsStream'});
  await page.locator('#header-cta').click();
  const completion=new Promise(resolve=>cdp.once('Tracing.tracingComplete',resolve));
  await cdp.send('Tracing.end');
  const {stream}=await completion;
  const chunks=[];
  while(true) { const r=await cdp.send('IO.read',{handle:stream});chunks.push(r.data);if(r.eof)break; }
  await cdp.send('IO.close',{handle:stream});
  await writeFile(`${out}/signup-trace.json`,chunks.join(''));
  for(const phase of ['before','after']) {
    await page.setContent(await readFile(`audit/evidence/${phase}/lighthouse-1.report.html`, 'utf8'));
    await page.waitForTimeout(1200);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({path:`audit/evidence/${phase}/lighthouse-summary.png`});
  }
} finally {await browser.close();}
