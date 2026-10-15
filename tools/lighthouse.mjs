import { mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const url = process.env.AUDIT_URL;
const phase = process.argv[2] || 'after';
if (!url) throw new Error('Set AUDIT_URL to the exact URL to measure (public Vercel URL for submission).');
if (!['before','after'].includes(phase)) throw new Error('Use before or after');
await mkdir(`audit/evidence/${phase}`,{recursive:true});
for (let i=1;i<=3;i++) {
  const run=spawnSync(process.execPath,['node_modules/lighthouse/cli/index.js',url,'--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage','--only-categories=performance,accessibility,seo','--output=json','--output=html',`--output-path=audit/evidence/${phase}/lighthouse-${i}`,'--quiet'],{stdio:'inherit',env:{...process.env,CHROME_PATH:process.env.CHROME_PATH || '/usr/bin/chromium'}});
  if (run.error) throw run.error;
  if (run.status !== 0) process.exit(run.status || 1);
}
