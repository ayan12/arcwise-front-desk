// Conversation log in Upstash Redis (free tier), over its REST API: no packages needed.
// Turns itself on when the project has Upstash env vars (added by Vercel's Upstash integration).

const KEEP_DAYS = 90;

function redis(env) {
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}

async function pipeline(r, cmds) {
  const res = await fetch(`${r.url}/pipeline`, {
    method: 'POST',
    headers: { authorization: `Bearer ${r.token}`, 'content-type': 'application/json' },
    body: JSON.stringify(cmds),
  });
  if (!res.ok) throw new Error(`store ${res.status}`);
  return res.json();
}

export function storeEnabled(env) { return !!redis(env); }

export async function saveConversation(env, client, sid, page, messages, out, ip) {
  const r = redis(env);
  if (!r || !/^[a-z0-9]{8,40}$/i.test(sid || '')) return;
  const now = Date.now();
  const msgs = (messages || []).slice(-40).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', text: String(m.text || '').slice(0, 800) }));
  msgs.push({ role: 'assistant', text: out.text, actions: (out.actions || []).map(a => a.label), source: out.source });
  const doc = {
    sid, client: client.id, page: String(page || '').slice(0, 200), updated: now,
    country: ip?.country || '', lead: msgs.some(m => m.actions && m.actions.length),
    messages: msgs,
  };
  const key = `fd:conv:${client.id}:${sid}`;
  try {
    await pipeline(r, [
      ['SET', key, JSON.stringify(doc), 'EX', String(KEEP_DAYS * 86400)],
      ['ZADD', `fd:convs:${client.id}`, String(now), sid],
      ['ZREMRANGEBYSCORE', `fd:convs:${client.id}`, '0', String(now - KEEP_DAYS * 86400000)],
    ]);
  } catch (e) { console.error('front-desk store error', e.message); }
}

export async function listConversations(env, clientId, limit = 50) {
  const r = redis(env);
  if (!r) return null;
  const [ids] = await pipeline(r, [['ZREVRANGE', `fd:convs:${clientId}`, '0', String(limit - 1)]]);
  const list = ids.result || [];
  if (!list.length) return [];
  const [docs] = await pipeline(r, [['MGET', ...list.map(s => `fd:conv:${clientId}:${s}`)]]);
  return (docs.result || []).filter(Boolean).map(s => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
}

// ---------- dashboard data ----------
export async function saveJson(env, key, value, days = 120) {
  const r = redis(env); if (!r) return;
  await pipeline(r, [['SET', key, JSON.stringify(value), 'EX', String(days * 86400)]]);
}
export async function getJsonMany(env, keys) {
  const r = redis(env); if (!r || !keys.length) return keys.map(() => null);
  const [res] = await pipeline(r, [['MGET', ...keys]]);
  return (res.result || []).map(s => { try { return s ? JSON.parse(s) : null; } catch { return null; } });
}
// Keep the last 60 health checks per project, for uptime.
export async function pushHealth(env, id, entry) {
  const r = redis(env); if (!r) return;
  await pipeline(r, [['LPUSH', `fd:health:${id}`, JSON.stringify(entry)], ['LTRIM', `fd:health:${id}`, '0', '59']]);
}
export async function healthHistory(env, ids) {
  const r = redis(env); if (!r) return ids.map(() => []);
  const res = await pipeline(r, ids.map(id => ['LRANGE', `fd:health:${id}`, '0', '59']));
  return res.map(x => (x.result || []).map(s => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean));
}

// Counter that lives in the database, so limits hold across every server instance.
export async function hit(env, key, ttlSeconds) {
  const r = redis(env); if (!r) return null;
  const [, n] = await pipeline(r, [['SET', key, '0', 'EX', String(ttlSeconds), 'NX'], ['INCR', key]]);
  return Number(n.result) || 0;
}
