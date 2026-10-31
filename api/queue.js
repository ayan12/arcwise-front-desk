// Gentology Queue API: branch tablets, the owner view, customer tickets and the WhatsApp demo simulator.
import { json } from '../lib/engine.js';
import { clientIp } from '../lib/auth.js';
import { hit, storeEnabled } from '../lib/store.js';
import { SHOP, branchOf, board, addTicket, act, getTicket, setBarbers, resetDay } from '../lib/queue.js';
import { handle, notifyAfterChange } from '../lib/bot.js';
import { simPush, simRead } from '../lib/channels.js';

export const config = { runtime: 'edge' };

const COOKIE = 'gq_session';
const DEFAULT_STAFF = '1920', DEFAULT_OWNER = '2026';
const enc = new TextEncoder();
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
const pins = env => ({ staff: env.GQ_STAFF_PIN || DEFAULT_STAFF, owner: env.GQ_OWNER_PIN || DEFAULT_OWNER, demo: !env.GQ_STAFF_PIN || !env.GQ_OWNER_PIN });
const hkey = env => crypto.subtle.importKey('raw', enc.encode(`${env.SESSION_SECRET || ''}|gq|${env.INBOX_PASSWORD || ''}|${pins(env).staff}|${pins(env).owner}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);

async function makeCookie(env, role) {
  const body = b64u(enc.encode(JSON.stringify({ role, exp: Date.now() + 30 * 86400000 })));
  const sig = b64u(await crypto.subtle.sign('HMAC', await hkey(env), enc.encode(body)));
  return `${COOKIE}=${body}.${sig}; Path=/; Max-Age=${30 * 86400}; HttpOnly; Secure; SameSite=Strict`;
}
async function role(req, env) {
  const m = (req.headers.get('cookie') || '').match(/(?:^|;\s*)gq_session=([^;]+)/);
  if (!m || !m[1].includes('.')) return null;
  const [body, sig] = m[1].split('.');
  try {
    if (!(await crypto.subtle.verify('HMAC', await hkey(env), unb64u(sig), enc.encode(body)))) return null;
    const d = JSON.parse(new TextDecoder().decode(unb64u(body)));
    return d.exp > Date.now() ? d.role : null;
  } catch { return null; }
}
function sameOrigin(req) {
  const o = req.headers.get('origin');
  if (!o) return req.method === 'GET';
  try { return new URL(o).host === (req.headers.get('host') || new URL(req.url).host); } catch { return false; }
}
const base = req => { const u = new URL(req.url); return `${u.protocol}//${req.headers.get('host') || u.host}`; };
const publicTicket = t => t && ({ ...t, ticket: { ...t.ticket, phone: undefined, user: undefined, channel: undefined } });

export default async function handler(req) {
  const env = globalThis.process?.env || {};
  if (!storeEnabled(env)) return json({ error: 'no_store' }, 503);
  if (!sameOrigin(req)) return json({ error: 'bad_origin' }, 403);
  const url = new URL(req.url);
  const ip = clientIp(req);

  try {
    if (req.method === 'GET') {
      const a = url.searchParams.get('action');
      if (a === 'ticket') {
        const t = await getTicket(env, url.searchParams.get('id'));
        return t ? json(publicTicket(t)) : json({ error: 'not_found' }, 404);
      }
      if (a === 'sim-poll') {
        const user = url.searchParams.get('user') || '';
        if (!/^[a-z0-9]{12,24}$/.test(user)) return json({ error: 'bad_user' }, 400);
        return json({ messages: await simRead(env, user, Math.max(0, Number(url.searchParams.get('from')) || 0)) });
      }
      if (a === 'me') { const r = await role(req, env); return json({ role: r, demo: pins(env).demo, branches: SHOP.branches, services: SHOP.services }); }
      const r = await role(req, env);
      if (!r) return json({ error: 'signed_out' }, 401);
      if (a === 'board') {
        const b = url.searchParams.get('branch');
        if (!branchOf(b)) return json({ error: 'bad_branch' }, 400);
        return json(await board(env, b));
      }
      if (a === 'all') {
        if (r !== 'owner') return json({ error: 'owner_only' }, 403);
        return json({ boards: await Promise.all(SHOP.branches.map(b => board(env, b.key))) });
      }
      return json({ error: 'unknown_action' }, 400);
    }

    if (req.method !== 'POST') return json({ error: 'method' }, 405);
    let b; try { b = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }

    // ----- public: customer side -----
    if (b.action === 'sim-send') {
      const user = String(b.user || '');
      if (!/^[a-z0-9]{12,24}$/.test(user)) return json({ error: 'bad_user' }, 400);
      if ((await hit(env, `gq:rl:sim:${ip}:${Math.floor(Date.now() / 3600000)}`, 3700)) > 120) return json({ error: 'slow_down' }, 429);
      const input = b.id ? { id: String(b.id).slice(0, 40) } : { text: String(b.text || '').slice(0, 500) };
      await simPush(env, user, { from: 'me', text: b.label ? String(b.label).slice(0, 60) : input.text || '' });
      await handle(env, { channel: 'sim', user, input, profileName: String(b.name || '').slice(0, 30) || null, base: base(req) });
      return json({ ok: true });
    }
    if (b.action === 'cancel-ticket') {
      const t = await getTicket(env, String(b.id || ''));
      if (!t || t.ticket.status !== 'waiting') return json({ error: 'not_found' }, 404);
      await act(env, t.ticket.branch, t.ticket.id, 'cancel');
      return json({ ok: true });
    }
    if (b.action === 'login') {
      const failKey = `gq:fail:${ip}`;
      if ((await hit(env, failKey, 900)) > 12) return json({ error: 'locked' }, 429);
      const p = pins(env), pin = String(b.pin || '');
      const r = pin === p.owner ? 'owner' : pin === p.staff ? 'staff' : null;
      if (!r) { await new Promise(x => setTimeout(x, 600)); return json({ error: 'wrong_pin' }, 401); }
      return json({ ok: true, role: r }, 200, { 'set-cookie': await makeCookie(env, r) });
    }
    if (b.action === 'logout') return json({ ok: true }, 200, { 'set-cookie': `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict` });

    // ----- staff -----
    const r = await role(req, env);
    if (!r) return json({ error: 'signed_out' }, 401);
    const br = String(b.branch || '');
    if (!branchOf(br)) return json({ error: 'bad_branch' }, 400);

    if (b.action === 'walkin') {
      const t = await addTicket(env, br, { name: b.name, service: b.service, source: 'walkin' });
      return json({ ok: true, ticket: t, board: await board(env, br) });
    }
    if (b.action === 'ticket') {
      const t = await act(env, br, String(b.id || ''), String(b.op || ''));
      await notifyAfterChange(env, br, t);
      return json({ ok: true, board: await board(env, br) });
    }
    if (b.action === 'barbers') {
      await setBarbers(env, br, b.n);
      await notifyAfterChange(env, br, null);
      return json({ ok: true, board: await board(env, br) });
    }
    if (b.action === 'reset') {
      if (r !== 'owner') return json({ error: 'owner_only' }, 403);
      await resetDay(env, br);
      return json({ ok: true, board: await board(env, br) });
    }
    return json({ error: 'unknown_action' }, 400);
  } catch (e) {
    if (['not_found', 'bad_action', 'bad_branch'].includes(e.message)) return json({ error: e.message }, 400);
    console.error('queue error', e);
    return json({ error: 'server_error' }, 500);
  }
}
