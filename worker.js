// Cloudflare Workers entry (free plan). Serves public/ as static assets, runs the same /api handlers
// as Vercel, applies the headers and redirects from vercel.json, and runs the daily cron.
import vercel from './vercel.json';
import chat from './api/chat.js';
import config from './api/config.js';
import workspace from './api/workspace.js';
import session from './api/session.js';
import cron from './api/cron.js';
import queue from './api/queue.js';
import whatsapp from './api/whatsapp.js';

const routes = { '/api/chat': chat, '/api/config': config, '/api/workspace': workspace, '/api/session': session, '/api/cron': cron, '/api/queue': queue, '/api/whatsapp': whatsapp };
const rx = src => new RegExp('^' + src.replace(/[.+?^${}|[\]\\]/g, '\\$&').replace(/\\?\(\.\*\)/g, '(.*)') + '$');
const HEADERS = (vercel.headers || []).map(h => ({ re: rx(h.source), headers: h.headers }));
const REDIRECTS = (vercel.redirects || []).map(r => ({ re: rx(r.source), to: r.destination, code: r.permanent ? 308 : 307 }));

// The handlers read settings from process.env, as on Vercel.
const useEnv = env => {
  const vars = {};
  for (const [k, v] of Object.entries(env)) if (typeof v === 'string') vars[k] = v;
  globalThis.process = globalThis.process || {};
  globalThis.process.env = vars;
};

function withHeaders(res, path) {
  const out = new Response(res.body, res);
  for (const h of HEADERS) if (h.re.test(path)) for (const { key, value } of h.headers) out.headers.set(key, value);
  return out;
}

export default {
  async fetch(req, env, ctx) {
    useEnv(env);
    const url = new URL(req.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    for (const r of REDIRECTS) if (r.re.test(path)) return Response.redirect(new URL(r.to, url), r.code);
    const fn = routes[path];
    if (fn) return withHeaders(await fn(req), path);
    let res = await env.ASSETS.fetch(req);
    return withHeaders(res, path);
  },
  async scheduled(event, env, ctx) {
    useEnv(env);
    const headers = env.CRON_SECRET ? { authorization: `Bearer ${env.CRON_SECRET}` } : {};
    ctx.waitUntil(cron(new Request('https://local/api/cron', { headers })));
  },
};
