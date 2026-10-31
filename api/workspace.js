// The workstation API: everything the dashboard reads and changes. Password-protected.
import { CLIENTS } from '../clients/index.js';
import { json } from '../lib/engine.js';
import { checkKey } from '../lib/auth.js';
import { checkSite } from '../lib/health.js';
import { listConversations, storeEnabled } from '../lib/store.js';
import {
  STAGES, rx, loadWorkspace, saveWorkspace, logActivity, activity, cleanClient, cleanSite, domainInfo,
} from '../lib/workspace.js';

export const config = { runtime: 'edge' };

const DAY = 86400000;
const STALE = 15 * 60 * 1000;
const parse = s => { try { return s ? JSON.parse(s) : null; } catch { return null; } };
const allSites = ws => ws.clients.flatMap(c => c.sites.map(s => ({ ...s, clientId: c.id, clientName: c.name })));

function deskStats(convs) {
  const t = Date.now();
  const users = c => (c.messages || []).filter(m => m.role === 'user');
  const within = d => convs.filter(c => t - c.updated < d * DAY);
  const c7 = within(7), c30 = within(30), p7 = convs.filter(c => t - c.updated >= 7 * DAY && t - c.updated < 14 * DAY);
  const replies = convs.flatMap(c => (c.messages || []).filter(m => m.source));
  return {
    chats7: c7.length, chatsPrev7: p7.length, chats30: c30.length,
    leads7: c7.filter(c => c.lead).length, leadsPrev7: p7.filter(c => c.lead).length, leads30: c30.filter(c => c.lead).length,
    leadRate30: c30.length ? Math.round(c30.filter(c => c.lead).length / c30.length * 100) : null,
    avgMessages30: c30.length ? +(c30.reduce((n, c) => n + users(c).length, 0) / c30.length).toFixed(1) : null,
    aiShare: replies.length ? Math.round(replies.filter(m => m.source === 'ai').length / replies.length * 100) : null,
    lastChat: convs[0]?.updated || null,
    days: Array.from({ length: 30 }, (_, i) => {
      const end = t - (29 - i) * DAY;
      const day = convs.filter(c => c.updated <= end && c.updated > end - DAY);
      return { chats: day.length, leads: day.filter(c => c.lead).length };
    }),
  };
}

async function runChecks(env, ws, sites) {
  const results = await Promise.all(sites.map(s => checkSite({ id: s.id, url: s.url })));
  const prevRaw = await rx(env, sites.map(s => ['LINDEX', `fd:health:${s.id}`, '0']));
  const cmds = [];
  for (let i = 0; i < sites.length; i++) {
    const r = results[i], s = sites[i], prev = parse(prevRaw[i]);
    cmds.push(['LPUSH', `fd:health:${s.id}`, JSON.stringify({ t: r.checkedAt, s: r.state, ms: r.ms })], ['LTRIM', `fd:health:${s.id}`, '0', '59']);
    cmds.push(['SET', `fd:last:${s.id}`, JSON.stringify(r), 'EX', String(30 * 86400)]);
    if (prev && prev.s !== r.state && (prev.s === 'down' || r.state === 'down')) {
      await logActivity(env, { type: r.state === 'down' ? 'alert' : 'site', clientId: s.clientId, siteId: s.id,
        text: r.state === 'down' ? `${hostOf(s.url)} went down (${r.error || 'error ' + r.status})` : `${hostOf(s.url)} is back up` });
    }
  }
  if (cmds.length) await rx(env, cmds);
  return results;
}
const hostOf = u => { try { return new URL(u).host; } catch { return u; } };

async function overview(env, force) {
  const ws = await loadWorkspace(env);
  const sites = allSites(ws);
  const ids = sites.map(s => s.id);
  const lastRaw = ids.length ? await rx(env, ids.map(id => ['GET', `fd:last:${id}`])) : [];
  let last = lastRaw.map(parse);
  const stale = sites.filter((s, i) => force || !last[i] || Date.now() - last[i].checkedAt > STALE);
  if (stale.length) {
    const fresh = await runChecks(env, ws, stale);
    stale.forEach((s, i) => { last[ids.indexOf(s.id)] = fresh[i]; });
  }
  const [histRaw, psiRaw] = ids.length
    ? await Promise.all([rx(env, ids.map(id => ['LRANGE', `fd:health:${id}`, '0', '59'])), rx(env, ids.map(id => ['GET', `fd:psi:${id}`]))])
    : [[], []];
  const hosts = [...new Set(sites.map(s => hostOf(s.url)))];
  const domains = await Promise.all(hosts.map(h => domainInfo(env, h)));
  const deskIds = [...new Set(sites.map(s => s.frontDesk).filter(Boolean))];
  const deskConvs = await Promise.all(deskIds.map(id => listConversations(env, id, 200)));
  const desks = Object.fromEntries(deskIds.map((id, i) => [id, { id, name: CLIENTS[id]?.name || id, ...deskStats(deskConvs[i] || []) }]));

  return {
    generatedAt: Date.now(),
    stages: STAGES,
    frontDeskClients: Object.values(CLIENTS).map(c => ({ id: c.id, name: c.name })),
    clients: ws.clients,
    sites: sites.map((s, i) => {
      const h = (histRaw[i] || []).map(parse).filter(Boolean);
      return {
        ...s, host: hostOf(s.url),
        health: last[i] || null,
        uptime: h.length ? Math.round(h.filter(x => x.s !== 'down').length / h.length * 100) : null,
        checks: h.length, history: h.slice(0, 40).reverse(),
        psi: parse(psiRaw[i]),
      };
    }),
    domains,
    desks,
    activity: await activity(env, 120),
  };
}

export default async function handler(req) {
  const env = globalThis.process?.env || {};
  const denied = await checkKey(req, env);
  if (denied) return json({ error: denied }, denied === 'wrong_password' ? 401 : 503);
  if (!storeEnabled(env)) return json({ error: 'no_store' }, 503);
  const url = new URL(req.url);

  try {
    if (req.method === 'GET') {
      if (url.searchParams.get('view') === 'chats') {
        const id = url.searchParams.get('desk') || '';
        if (!Object.prototype.hasOwnProperty.call(CLIENTS, id)) return json({ error: 'unknown_desk' }, 404);
        return json({ desk: id, conversations: await listConversations(env, id, 150) });
      }
      return json(await overview(env, url.searchParams.get('check') === '1'));
    }
    if (req.method !== 'POST') return json({ error: 'method' }, 405);

    let b; try { b = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
    const ws = await loadWorkspace(env);
    const find = id => ws.clients.find(c => c.id === id);

    switch (b.action) {
      case 'saveClient': {
        const prev = b.client?.id ? find(b.client.id) : null;
        const c = cleanClient(b.client || {}, prev);
        if (prev) {
          Object.assign(prev, c);
          if (b.client.stageChangedFrom && b.client.stageChangedFrom !== c.stage) {
            await logActivity(env, { type: 'stage', clientId: c.id, text: `${c.name} moved from ${b.client.stageChangedFrom} to ${c.stage}` });
          }
        } else {
          ws.clients.push(c);
          await logActivity(env, { type: 'client', clientId: c.id, text: `New client: ${c.name}` });
        }
        await saveWorkspace(env, ws);
        return json({ ok: true, client: c });
      }
      case 'deleteClient': {
        const c = find(b.id);
        if (!c) return json({ error: 'not_found' }, 404);
        if (c.internal) return json({ error: 'cannot_delete_own' }, 400);
        ws.clients = ws.clients.filter(x => x.id !== b.id);
        await saveWorkspace(env, ws);
        await logActivity(env, { type: 'client', text: `Removed client: ${c.name}` });
        return json({ ok: true });
      }
      case 'saveSite': {
        const c = find(b.clientId);
        if (!c) return json({ error: 'not_found' }, 404);
        const prev = c.sites.find(s => s.id === b.site?.id);
        const s = cleanSite(b.site || {}, prev);
        if (!prev && allSites(ws).some(x => x.url === s.url)) return json({ error: 'duplicate_url' }, 400);
        if (prev) Object.assign(prev, s); else { if (c.sites.length >= 20) return json({ error: 'too_many' }, 400); c.sites.push(s); }
        await saveWorkspace(env, ws);
        if (!prev) await logActivity(env, { type: 'site', clientId: c.id, siteId: s.id, text: `Added ${hostOf(s.url)} to ${c.name}` });
        await runChecks(env, ws, [{ ...s, clientId: c.id }]);
        return json({ ok: true, site: s });
      }
      case 'removeSite': {
        const c = find(b.clientId);
        const s = c?.sites.find(x => x.id === b.siteId);
        if (!s) return json({ error: 'not_found' }, 404);
        c.sites = c.sites.filter(x => x.id !== b.siteId);
        await saveWorkspace(env, ws);
        await rx(env, [['DEL', `fd:health:${s.id}`, `fd:last:${s.id}`, `fd:psi:${s.id}`]]);
        await logActivity(env, { type: 'site', clientId: c.id, text: `Removed ${hostOf(s.url)} from ${c.name}` });
        return json({ ok: true });
      }
      case 'note': {
        const c = find(b.clientId);
        const text = String(b.text || '').trim();
        if (!c || !text) return json({ error: 'bad_request' }, 400);
        return json({ ok: true, entry: await logActivity(env, { type: 'note', clientId: c.id, text }) });
      }
      case 'psi': {
        const s = allSites(ws).find(x => x.id === b.siteId);
        if (!s || !b.scores) return json({ error: 'bad_request' }, 400);
        const clean = {};
        for (const k of ['performance', 'seo', 'accessibility', 'bestPractices']) {
          const v = Number(b.scores[k]); if (v >= 0 && v <= 100) clean[k] = Math.round(v);
        }
        const lcp = Number(b.lcp);
        const val = { scores: clean, lcp: lcp > 0 && lcp < 120000 ? Math.round(lcp) : null, at: Date.now() };
        await rx(env, [['SET', `fd:psi:${s.id}`, JSON.stringify(val), 'EX', String(120 * 86400)]]);
        return json({ ok: true, psi: val });
      }
      default:
        return json({ error: 'unknown_action' }, 400);
    }
  } catch (e) {
    const known = ['bad_url', 'name_required', 'no_store'];
    if (known.includes(e.message)) return json({ error: e.message }, 400);
    console.error('workspace error', e);
    return json({ error: 'server_error' }, 500);
  }
}
