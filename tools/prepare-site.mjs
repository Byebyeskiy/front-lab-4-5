import { mkdir, cp, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const output = 'artifacts/site';
await rm(output, {recursive:true,force:true});
await mkdir(output,{recursive:true});
if (process.argv.includes('--baseline')) {
  // Export, never reset the active checkout or overwrite the corrected source.
  const files = execFileSync('git',['ls-tree','-r','--name-only','ca4a46f'],{encoding:'utf8'}).trim().split('\n');
  for (const file of files) {
    await mkdir(`${output}/${file.split('/').slice(0,-1).join('/')}`,{recursive:true});
    await writeFile(`${output}/${file}`,execFileSync('git',['show',`ca4a46f:${file}`],{maxBuffer:10*1024*1024}));
  }
} else {
  for (const file of ['index.html','about.html','robots.txt','sitemap.xml','.nojekyll','css','js','img','fonts']) await cp(file,`${output}/${file}`,{recursive:true});
  // Keep the original JPEG in Git as evidence, but don't deploy an unused 2.8MB asset.
  await rm(`${output}/img/hero.jpg`,{force:true});
}
console.log(`Static files copied to ${output}; no bundling or source transformation.`);
