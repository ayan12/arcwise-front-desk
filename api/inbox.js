import { CLIENTS } from '../clients/index.js';
import { json } from '../lib/engine.js';
import { checkKey } from '../lib/auth.js';
import { listConversations, storeEnabled } from '../lib/store.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const env = globalThis.process?.env || {};
  const denied = await checkKey(req, env);
  if (denied) return json({ error: denied }, denied === 'wrong_password' ? 401 : 503);
  if (!storeEnabled(env)) return json({ error: 'no_store' }, 503);
  const url = new URL(req.url);
  const id = url.searchParams.get('client') || '';
  if (!Object.prototype.hasOwnProperty.call(CLIENTS, id)) {
    return json({ clients: Object.values(CLIENTS).map(c => ({ id: c.id, name: c.name })) });
  }
  return json({ client: id, conversations: await listConversations(env, id, 60) });
}
