import { getClient } from '../clients/index.js';
import { reply, limited, originAllowed, cors, json, ruleReply, detectLang } from '../lib/engine.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const env = globalThis.process?.env || {};
  const origin = req.headers.get('origin') || '';
  const host = req.headers.get('host') || new URL(req.url).host;

  let body = {};
  if (req.method === 'POST') {
    try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  }
  const clientId = req.method === 'POST' ? body.client : new URL(req.url).searchParams.get('client');
  const client = getClient(String(clientId || ''));
  if (!client) return json({ error: 'unknown_client' }, 404);
  if (!originAllowed(client, origin, host, env)) return json({ error: 'origin_not_allowed' }, 403);
  const h = cors(origin);

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
  if (req.method !== 'POST') return json({ error: 'method' }, 405, h);

  const messages = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
  const ip = req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip') ||
    (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'anon';

  const hit = limited(client, ip);
  if (hit) {
    // Over a limit: still help, without spending on AI.
    const last = [...messages].reverse().find(m => m && m.role === 'user');
    return json({ ...ruleReply(client, last?.text || '', detectLang(last?.text)), source: 'rules' }, 200, h);
  }
  return json(await reply(client, messages, env), 200, h);
}
