// Meta WhatsApp Cloud API webhook for the Gentology booking assistant.
// Needs, in Vercel env: WA_VERIFY_TOKEN, WA_APP_SECRET, WA_TOKEN, WA_PHONE_ID (and optionally WA_API_VERSION).
import { json } from '../lib/engine.js';
import { handle } from '../lib/bot.js';
import { hit } from '../lib/store.js';

export const config = { runtime: 'edge' };

const enc = new TextEncoder();
async function validSignature(env, raw, header) {
  if (!env.WA_APP_SECRET || !header || !header.startsWith('sha256=')) return false;
  const key = await crypto.subtle.importKey('raw', enc.encode(env.WA_APP_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(raw))), b => b.toString(16).padStart(2, '0')).join('');
  const sig = header.slice(7);
  let d = mac.length ^ sig.length;
  for (let i = 0; i < Math.max(mac.length, sig.length); i++) d |= (mac.charCodeAt(i) || 0) ^ (sig.charCodeAt(i) || 0);
  return d === 0;
}

export default async function handler(req) {
  const env = globalThis.process?.env || {};
  const url = new URL(req.url);

  // Meta's one-time check when you register the webhook.
  if (req.method === 'GET') {
    if (url.searchParams.get('hub.mode') === 'subscribe' && env.WA_VERIFY_TOKEN && url.searchParams.get('hub.verify_token') === env.WA_VERIFY_TOKEN) {
      return new Response(url.searchParams.get('hub.challenge') || '', { status: 200 });
    }
    return json({ error: 'forbidden' }, 403);
  }
  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  const raw = await req.text();
  if (!(await validSignature(env, raw, req.headers.get('x-hub-signature-256')))) return json({ error: 'bad_signature' }, 401);

  let body; try { body = JSON.parse(raw); } catch { return json({ ok: true }); }
  const base = env.PUBLIC_URL || `https://${req.headers.get('host')}`;
  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const v = change.value || {};
      if (env.WA_PHONE_ID && v.metadata?.phone_number_id && v.metadata.phone_number_id !== env.WA_PHONE_ID) continue;
      const names = Object.fromEntries((v.contacts || []).map(c => [c.wa_id, c.profile?.name || null]));
      for (const m of v.messages || []) {
        // Meta can deliver the same message twice: handle each message id once.
        if ((await hit(env, `gq:wa:seen:${m.id}`, 86400)) > 1) continue;
        let input = null;
        if (m.type === 'text') input = { text: m.text?.body || '' };
        else if (m.type === 'interactive') input = { id: m.interactive?.button_reply?.id || m.interactive?.list_reply?.id || '' };
        else if (m.type === 'button') input = { text: m.button?.text || '' };
        else input = { text: '' };
        try { await handle(env, { channel: 'wa', user: m.from, input, profileName: names[m.from], base }); }
        catch (e) { console.error('whatsapp handle error', e); }
      }
    }
  }
  return json({ ok: true });
}
