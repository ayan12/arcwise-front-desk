// Daily health check (scheduled in vercel.json), so uptime builds up even when nobody opens the dashboard.
import { PROJECTS } from '../lib/projects.js';
import { json } from '../lib/engine.js';
import { checkSite } from '../lib/health.js';
import { pushHealth } from '../lib/store.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const env = globalThis.process?.env || {};
  if (env.CRON_SECRET && req.headers.get('authorization') !== `Bearer ${env.CRON_SECRET}`) {
    return json({ error: 'unauthorized' }, 401);
  }
  const checks = await Promise.all(PROJECTS.map(checkSite));
  await Promise.all(checks.map(c => pushHealth(env, c.id, { t: c.checkedAt, s: c.state, ms: c.ms })));
  return json({ ok: true, checked: checks.map(c => ({ id: c.id, state: c.state, ms: c.ms })) });
}
