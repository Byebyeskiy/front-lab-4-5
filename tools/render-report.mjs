import { marked } from 'marked';
import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
const markdown=await readFile('REPORT.md','utf8');
let body=marked.parse(markdown);
const sources=[...new Set([...body.matchAll(/<img src="([^"]+)"/g)].map(m=>m[1]))];
for(const source of sources) {
  const path=resolve(source);
  if(!path.startsWith(resolve('audit/evidence')+'/')) throw new Error(`Unexpected report image: ${source}`);
  const bytes=await readFile(path);
  const mime=extname(source)==='.png'?'image/png':'image/jpeg';
  body=body.replaceAll(`src="${source}"`,`src="data:${mime};base64,${bytes.toString('base64')}"`);
}
const html=`<!doctype html><html lang="uk"><meta charset="utf-8"><title>Звіт — FlowTask ЛР 4–5</title><style>
body{font:11px/1.55 Arial,sans-serif;color:#172033;margin:32px auto;max-width:1050px;padding:0 20px}
h1{font-size:24px}h2{font-size:17px;margin-top:28px}h3{font-size:13px}a{color:#3730a3}table{border-collapse:collapse;width:100%;font-size:9px;table-layout:fixed;margin:16px 0}th,td{border:1px solid #b9c1d1;padding:5px;vertical-align:top;overflow-wrap:anywhere}th{background:#eef2ff}code{font-size:.95em;overflow-wrap:anywhere}img{display:block;max-width:100%;max-height:230mm;object-fit:contain;margin:auto}p,li{overflow-wrap:anywhere}tr,img{break-inside:avoid}h1,h2,h3{break-after:avoid}@page{size:A4;margin:16mm 13mm}@media print{body{margin:0;padding:0;max-width:none}a{color:inherit}}
</style><body>${body}</body></html>`;
await writeFile('REPORT.html',html);
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || '/usr/bin/chromium',args:['--no-sandbox']});
try {
  const page=await browser.newPage();await page.setContent(html,{waitUntil:'load'});
  await page.pdf({path:'REPORT.pdf',format:'A4',printBackground:true,displayHeaderFooter:true,headerTemplate:'<span></span>',footerTemplate:'<div style="font-size:8px;width:100%;text-align:center;color:#667085">FlowTask · ЛР 4–5 · <span class="pageNumber"></span> / <span class="totalPages"></span></div>',margin:{top:'16mm',bottom:'16mm',left:'13mm',right:'13mm'}});
  console.log('REPORT.html and REPORT.pdf generated from REPORT.md with embedded evidence screenshots.');
}finally{await browser.close();}
