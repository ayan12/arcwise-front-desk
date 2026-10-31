import { getClient } from '../clients/index.js';
import { reply, limited, originAllowed, cors, json, offlineReply, detectLang } from '../lib/engine.js';
import { saveConversation, hit } from '../lib/store.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const env = globalThis.process?.env || {};
  const origin = req.headers.get('origin') || '';
  const host = req.headers.get('host') || new URL(req.url).host;

  // Browser permission check before a cross-site POST. It carries no client id; the POST
  // itself is still checked against the client's allowed sites below.
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: origin ? cors(origin) : {} });

  let body = {};
  if (req.method === 'POST') {
    try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  }
  const clientId = req.method === 'POST' ? body.client : new URL(req.url).searchParams.get('client');
  const client = getClient(String(clientId || ''));
  if (!client) return json({ error: 'unknown_client' }, 404);
  if (!originAllowed(client, origin, host, env)) return json({ error: 'origin_not_allowed' }, 403);
  const h = cors(origin);

  if (req.method !== 'POST') return json({ error: 'method' }, 405, h);

  const messages = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
  const ip = req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip') ||
    (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'anon';

  // Limits that protect the AI bill: per visitor per hour and per client per day.
  // Kept in the database when it's connected; falls back to in-memory limits otherwise.
  let over = false;
  try {
    const hour = Math.floor(Date.now() / 3600000), day = new Date().toISOString().slice(0, 10);
    const [perIp, perDay] = await Promise.all([hit(env, `fd:rl:ip:${ip}:${hour}`, 3700), hit(env, `fd:rl:day:${client.id}:${day}`, 90000)]);
    if (perIp == null) over = !!limited(client, ip);
    else over = perIp > 40 || perDay > (client.dailyCap || 300);
  } catch { over = !!limited(client, ip); }

  let out;
  if (over) {
    // Over a limit: still help, without spending on AI.
    const last = [...messages].reverse().find(m => m && m.role === 'user');
    out = offlineReply(client, last?.text, detectLang(last?.text));
  } else {
    out = await reply(client, messages, env);
  }
  const country = req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || '';
  await saveConversation(env, client, String(body.sid || ''), body.page, messages, out, { country });
  return json(out, 200, h);
}
