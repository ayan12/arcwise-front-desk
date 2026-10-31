// Where bot messages go: the real WhatsApp Cloud API, or the demo phone simulator.
// A message is { text, buttons?: [{id,title}] (max 3), list?: { button, rows: [{id,title,desc}] } (max 10) }.

import { rx } from './workspace.js';

const SIM_TTL = String(2 * 86400);

export async function simPush(env, user, msg) {
  await rx(env, [['RPUSH', `gq:sim:${user}`, JSON.stringify({ ...msg, at: Date.now() })], ['LTRIM', `gq:sim:${user}`, '-80', '-1'], ['EXPIRE', `gq:sim:${user}`, SIM_TTL]]);
}
export async function simRead(env, user, from = 0) {
  const [items] = await rx(env, [['LRANGE', `gq:sim:${user}`, String(from), '-1']]);
  return (items || []).map(s => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
}

const cut = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; };

function toWhatsApp(to, msg) {
  if (msg.list && msg.list.rows?.length) {
    return { messaging_product: 'whatsapp', to, type: 'interactive', interactive: {
      type: 'list', body: { text: cut(msg.text, 1024) },
      action: { button: cut(msg.list.button || 'Choose', 20), sections: [{ title: cut(msg.list.title || 'Options', 24), rows: msg.list.rows.slice(0, 10).map(r => ({ id: r.id, title: cut(r.title, 24), description: r.desc ? cut(r.desc, 72) : undefined })) }] },
    } };
  }
  if (msg.buttons && msg.buttons.length) {
    return { messaging_product: 'whatsapp', to, type: 'interactive', interactive: {
      type: 'button', body: { text: cut(msg.text, 1024) },
      action: { buttons: msg.buttons.slice(0, 3).map(b => ({ type: 'reply', reply: { id: b.id, title: cut(b.title, 20) } })) },
    } };
  }
  return { messaging_product: 'whatsapp', to, type: 'text', text: { body: cut(msg.text, 4096), preview_url: true } };
}

export async function send(env, channel, user, msg) {
  if (channel === 'sim') return simPush(env, user, { from: 'bot', ...msg });
  if (channel === 'wa') {
    if (!env.WA_TOKEN || !env.WA_PHONE_ID) { console.error('whatsapp not configured'); return; }
    const res = await fetch(`https://graph.facebook.com/${env.WA_API_VERSION || 'v21.0'}/${env.WA_PHONE_ID}/messages`, {
      method: 'POST',
      headers: { authorization: `Bearer ${env.WA_TOKEN}`, 'content-type': 'application/json' },
      body: JSON.stringify(toWhatsApp(user, msg)),
    });
    if (!res.ok) console.error('whatsapp send failed', res.status, (await res.text()).slice(0, 300));
  }
}
