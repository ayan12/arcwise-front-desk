// Daily health check of every website in the workspace (scheduled in vercel.json),
// so uptime history builds up even when nobody opens the dashboard.
import { json } from '../lib/engine.js';
import { checkSite } from '../lib/health.js';
import { rx, loadWorkspace, logActivity } from '../lib/workspace.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const env = globalThis.process?.env || {};
  if (env.CRON_SECRET && req.headers.get('authorization') !== `Bearer ${env.CRON_SECRET}`) {
    return json({ error: 'unauthorized' }, 401);
  }
  const ws = await loadWorkspace(env);
  const sites = ws.clients.flatMap(c => c.sites.map(s => ({ ...s, clientId: c.id })));
  const results = await Promise.all(sites.map(s => checkSite({ id: s.id, url: s.url })));
  const prev = sites.length ? await rx(env, sites.map(s => ['LINDEX', `fd:health:${s.id}`, '0'])) : [];
  const cmds = [];
  for (let i = 0; i < sites.length; i++) {
    const r = results[i];
    let p = null; try { p = JSON.parse(prev[i]); } catch {}
    cmds.push(['LPUSH', `fd:health:${sites[i].id}`, JSON.stringify({ t: r.checkedAt, s: r.state, ms: r.ms })],
      ['LTRIM', `fd:health:${sites[i].id}`, '0', '59'],
      ['SET', `fd:last:${sites[i].id}`, JSON.stringify(r), 'EX', String(30 * 86400)]);
    if (p && p.s !== r.state && (p.s === 'down' || r.state === 'down')) {
      await logActivity(env, { type: r.state === 'down' ? 'alert' : 'site', clientId: sites[i].clientId, siteId: sites[i].id,
        text: `${new URL(sites[i].url).host} ${r.state === 'down' ? 'went down' : 'is back up'} (daily check)` });
    }
  }
  if (cmds.length) await rx(env, cmds);
  return json({ ok: true, checked: results.map((r, i) => ({ host: new URL(sites[i].url).host, state: r.state, ms: r.ms })) });
}
