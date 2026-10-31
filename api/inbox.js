import { CLIENTS } from '../clients/index.js';
import { json } from '../lib/engine.js';
import { listConversations, storeEnabled } from '../lib/store.js';

export const config = { runtime: 'edge' };

// Constant-time-ish compare so the password can't be guessed by timing.
function same(a, b) {
  a = String(a || ''); b = String(b || '');
  let d = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return d === 0;
}

export default async function handler(req) {
  const env = globalThis.process?.env || {};
  if (!env.INBOX_PASSWORD) return json({ error: 'no_password_set' }, 503);
  if (!same(req.headers.get('x-inbox-key'), env.INBOX_PASSWORD)) {
    await new Promise(r => setTimeout(r, 600));
    return json({ error: 'wrong_password' }, 401);
  }
  if (!storeEnabled(env)) return json({ error: 'no_store' }, 503);
  const url = new URL(req.url);
  const id = url.searchParams.get('client') || '';
  if (!Object.prototype.hasOwnProperty.call(CLIENTS, id)) {
    return json({ clients: Object.values(CLIENTS).map(c => ({ id: c.id, name: c.name })) });
  }
  return json({ client: id, conversations: await listConversations(env, id, 60) });
}
