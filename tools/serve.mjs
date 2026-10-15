import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function createSiteServer(root = process.cwd()) {
  const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.svg':'image/svg+xml', '.jpg':'image/jpeg', '.webp':'image/webp', '.woff2':'font/woff2', '.txt':'text/plain', '.xml':'application/xml' };
  return http.createServer(async (req,res) => {
    try {
      const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const file = path === '/' ? 'index.html' : path.slice(1);
      if (!/^(index\.html|about\.html|robots\.txt|sitemap\.xml|(?:css|js|img|fonts)\/[\w.-]+)$/.test(file)) {
        res.writeHead(404); res.end('Not found'); return;
      }
      const data = await readFile(resolve(root, file));
      res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch { res.writeHead(404); res.end('Not found'); }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT || 8000);
  createSiteServer().listen(port, '127.0.0.1', () => console.log(`FlowTask server listening on port ${port}`));
}
