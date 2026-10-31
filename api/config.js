import { getClient, publicConfig } from '../clients/index.js';
import { originAllowed, cors, json } from '../lib/engine.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const env = globalThis.process?.env || {};
  const url = new URL(req.url);
  const origin = req.headers.get('origin') || '';
  const client = getClient(url.searchParams.get('client') || '');
  if (!client) return json({ error: 'unknown_client' }, 404);
  // Same-origin requests send no Origin header; the config holds nothing private.
  if (origin && !originAllowed(client, origin, req.headers.get('host') || url.host, env)) {
    return json({ error: 'origin_not_allowed' }, 403);
  }
  const h = origin ? cors(origin) : {};
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
  return json(publicConfig(client), 200, { ...h, 'cache-control': 'public, max-age=300' });
}
