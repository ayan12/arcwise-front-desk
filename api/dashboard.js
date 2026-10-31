import { PROJECTS } from '../lib/projects.js';
import { json } from '../lib/engine.js';
import { checkKey } from '../lib/auth.js';
import { checkSite } from '../lib/health.js';
import { listConversations, storeEnabled, saveJson, getJsonMany, pushHealth, healthHistory } from '../lib/store.js';

export const config = { runtime: 'edge' };

const DAY = 86400000;

function deskStats(convs) {
  const now = Date.now();
  const users = c => (c.messages || []).filter(m => m.role === 'user');
  const in7 = convs.filter(c => now - c.updated < 7 * DAY);
  const in30 = convs.filter(c => now - c.updated < 30 * DAY);
  const ai = convs.reduce((n, c) => n + (c.messages || []).filter(m => m.source === 'ai').length, 0);
  const all = convs.reduce((n, c) => n + (c.messages || []).filter(m => m.source).length, 0);
  // Last 14 days, one bar per day, oldest first.
  const days = Array.from({ length: 14 }, (_, i) => {
    const end = now - (13 - i) * DAY;
    return { chats: convs.filter(c => c.updated <= end && c.updated > end - DAY).length };
  });
  return {
    chats7: in7.length, chats30: in30.length,
    leads7: in7.filter(c => c.lead).length, leads30: in30.filter(c => c.lead).length,
    leadRate30: in30.length ? Math.round((in30.filter(c => c.lead).length / in30.length) * 100) : null,
    avgMessages30: in30.length ? +(in30.reduce((n, c) => n + users(c).length, 0) / in30.length).toFixed(1) : null,
    aiShare: all ? Math.round((ai / all) * 100) : null,
    lastChat: convs[0]?.updated || null,
    recent: convs.slice(0, 5).map(c => ({ updated: c.updated, first: users(c)[0]?.text?.slice(0, 120) || '', lead: !!c.lead })),
    days,
  };
}

export default async function handler(req) {
  const env = globalThis.process?.env || {};
  const denied = await checkKey(req, env);
  if (denied) return json({ error: denied }, denied === 'wrong_password' ? 401 : 503);
  if (!storeEnabled(env)) return json({ error: 'no_store' }, 503);

  // Save a speed / SEO score measured by the browser (Google PageSpeed Insights).
  if (req.method === 'POST') {
    let b; try { b = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
    const p = PROJECTS.find(x => x.id === b.id);
    if (!p || !b.scores) return json({ error: 'bad_request' }, 400);
    const clean = {};
    for (const k of ['performance', 'seo', 'accessibility', 'bestPractices']) {
      const v = Number(b.scores[k]); if (v >= 0 && v <= 100) clean[k] = Math.round(v);
    }
    const lcp = Number(b.lcp);
    await saveJson(env, `fd:psi:${p.id}`, { scores: clean, lcp: lcp > 0 && lcp < 120000 ? Math.round(lcp) : null, at: Date.now() });
    return json({ ok: true });
  }

  const checks = await Promise.all(PROJECTS.map(checkSite));
  await Promise.all(checks.map(c => pushHealth(env, c.id, { t: c.checkedAt, s: c.state, ms: c.ms })));
  const [history, psi] = await Promise.all([
    healthHistory(env, PROJECTS.map(p => p.id)),
    getJsonMany(env, PROJECTS.map(p => `fd:psi:${p.id}`)),
  ]);
  const desks = await Promise.all(PROJECTS.map(p => p.frontDesk ? listConversations(env, p.frontDesk, 200) : null));

  return json({
    generatedAt: Date.now(),
    projects: PROJECTS.map((p, i) => {
      const h = history[i];
      return {
        ...p,
        health: checks[i],
        uptime: h.length ? Math.round((h.filter(x => x.s !== 'down').length / h.length) * 100) : null,
        checks: h.length,
        history: h.slice(0, 30).reverse(),
        psi: psi[i],
        desk: desks[i] ? deskStats(desks[i]) : null,
      };
    }),
  });
}
