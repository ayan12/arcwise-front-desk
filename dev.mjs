// Local test server: node dev.mjs [port]. Serves the static files and runs /api/* like Vercel does.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import chat from './api/chat.js';
import config from './api/config.js';
import inbox from './api/inbox.js';

const port = Number(process.argv[2] || 4321);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const routes = { '/api/chat': chat, '/api/config': config, '/api/inbox': inbox };

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const fn = routes[url.pathname];
  if (fn) {
    const chunks = []; for await (const c of req) chunks.push(c);
    const body = chunks.length ? Buffer.concat(chunks) : undefined;
    const r = await fn(new Request(url, { method: req.method, headers: req.headers, body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body }));
    res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer())); return;
  }
  const file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  if (file.includes('..')) { res.writeHead(400); res.end(); return; }
  try {
    const data = await readFile(join(process.cwd(), file));
    res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' }); res.end(data);
  } catch { res.writeHead(404); res.end('not found'); }
}).listen(port, () => console.log('http://localhost:' + port));
