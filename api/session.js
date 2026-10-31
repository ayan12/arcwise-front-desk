// POST = sign in with the password, DELETE = sign out. GET = am I signed in?
import { json } from '../lib/engine.js';
import { tryPassword, makeSession, clearSession, sameOrigin, checkKey } from '../lib/auth.js';
import { logActivity } from '../lib/workspace.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const env = globalThis.process?.env || {};
  if (!sameOrigin(req)) return json({ error: 'bad_origin' }, 403);

  if (req.method === 'GET') {
    const denied = await checkKey(req, env);
    return json({ signedIn: !denied, error: denied || undefined }, denied ? 401 : 200);
  }
  if (req.method === 'DELETE') {
    return json({ ok: true }, 200, { 'set-cookie': clearSession() });
  }
  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  let b; try { b = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const r = await tryPassword(req, env, String(b.password || '').slice(0, 200));
  if (!r.ok) {
    const status = r.error === 'locked' ? 429 : r.error === 'no_password_set' ? 503 : 401;
    return json({ error: r.error }, status, r.retryAfter ? { 'retry-after': String(r.retryAfter) } : {});
  }
  try {
    const country = req.headers.get('x-vercel-ip-country') || '';
    await logActivity(env, { type: 'system', text: `Signed in to the workstation${country ? ' from ' + country : ''}` });
  } catch {}
  return json({ ok: true }, 200, { 'set-cookie': await makeSession(env) });
}
