// Arcwise Front Desk: the shared brain. Works on Vercel (edge) and Cloudflare Workers:
// it only uses fetch, Request and Response. Everything business-specific lives in clients/*.js.

const MAX_TURNS = 12;        // messages of history sent to the AI
const MAX_CHARS = 800;       // per message
const PER_IP_PER_HOUR = 40;  // messages

// Best-effort limits. They live in each running instance's memory, so they are a guard
// against abuse, not exact accounting.
const ipHits = new Map();
const dayHits = new Map();

export function limited(client, ip) {
  const now = Date.now();
  const k = `${ip}|${Math.floor(now / 3_600_000)}`;
  const n = (ipHits.get(k) || 0) + 1;
  ipHits.set(k, n);
  if (ipHits.size > 5000) ipHits.clear();
  const dk = `${client.id}|${new Date(now).toISOString().slice(0, 10)}`;
  const d = (dayHits.get(dk) || 0) + 1;
  dayHits.set(dk, d);
  if (n > PER_IP_PER_HOUR) return 'ip';
  if (d > (client.dailyCap || 300)) return 'day';
  return null;
}

// ---------- language ----------
const ID_WORDS = /\b(saya|aku|mau|bisa|berapa|harga|jam|buka|tutup|cabang|dimana|di mana|apa|ada|hari|ini|besok|antri|antre|potong|rambut|cukur|halo|hai|kak|bang|mas|gak|nggak|tidak|ya|dong|sih|terima kasih|makasih|lokasi|alamat|masuk|daftar|bikin|buat|usaha|toko|biaya)\b/i;
export function detectLang(text) {
  return ID_WORDS.test(text || '') ? 'id' : 'en';
}

// ---------- WhatsApp hand-off (shared by AI and offline answers) ----------
function fill(tpl, vars) {
  return String(tpl || '').replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}
export function handoff(client, contactKey, purpose, lang, details = {}) {
  const c = client.contacts.find(x => x.key === contactKey) || client.contacts[0];
  const p = client.handoff[purpose] || client.handoff[Object.keys(client.handoff)[0]];
  const name = String(details.name || '').replace(/[^\p{L}\p{N} .'-]/gu, '').slice(0, 40).trim();
  const about = String(details.about || '').replace(/[^\p{L}\p{N} .,'&/()-]/gu, '').slice(0, 120).trim();
  const vars = { client: client.name, contact: c.name, name, about };
  const pick = o => fill(o?.[lang] ?? o?.en ?? '', vars);
  const text = pick(p) + (name ? pick(p.nameLine) : (about ? '' : pick(p.noName))) + (about ? pick(p.aboutLine) : '');
  if (c.ig) return { type: 'link', channel: 'ig', label: `@${c.ig}`, url: `https://ig.me/m/${c.ig}`, text };
  return { type: 'link', label: `WhatsApp ${c.name}`, url: `https://wa.me/${c.e164}?text=${encodeURIComponent(text)}` };
}
export function findContact(client, text) {
  const t = (text || '').toLowerCase();
  return client.contacts.find(b =>
    t.includes(b.key.replace('-', ' ')) || t.includes(b.key) ||
    b.name.toLowerCase().split(' ').some(w => w.length > 4 && t.includes(w)));
}

// ---------- AI answers ----------
function systemPrompt(client) {
  const contacts = client.contacts.map(c => `${c.key} = ${c.name}${c.note ? `, ${c.note}` : ''}`).join('\n');
  const purposes = Object.entries(client.handoff).map(([k, v]) => `${k}: ${v.when}`).join('\n');
  return `You are ${client.assistant}, the chat assistant on ${client.name}'s website.

WHAT YOU KNOW (the only things you know):
${client.knowledge}

WHATSAPP CONTACTS:
${contacts}

HAND-OFF PURPOSES:
${purposes}

RULES:
- Reply in the customer's language (Bahasa Indonesia or English). Match their tone; casual Bahasa is fine.
- Keep replies short: 1 to 3 sentences, or a short list. Plain text, no markdown headings or bold.
- Only state what is in WHAT YOU KNOW. If you don't know, say so and offer the WhatsApp button.
- Always write a short reply to the customer, even when you also call a tool.
- Call whatsapp_button when the next step is talking to a person. Use suggest_replies to offer up to 3 short next steps when helpful.
- Never invent prices, discounts, dates or availability. Stay on topic and steer back politely.
${client.agentRules || ''}`.trim();
}

function tools(client) {
  return [
    {
      name: 'whatsapp_button',
      description: 'Show the customer a button that opens a chat with the contact (WhatsApp, or Instagram DM for contacts that use Instagram) with their message ready.',
      input_schema: {
        type: 'object',
        properties: {
          contact: { type: 'string', enum: client.contacts.map(b => b.key) },
          purpose: { type: 'string', enum: Object.keys(client.handoff) },
          name: { type: 'string', description: "The customer's name, if they gave it." },
          about: { type: 'string', description: "A few words on the customer's business or request, in their language, if they told you (e.g. 'dental clinic in KL, wants more bookings')." },
        },
        required: ['contact', 'purpose'],
      },
    },
    {
      name: 'suggest_replies',
      description: 'Show up to 3 short tap-to-send replies.',
      input_schema: {
        type: 'object',
        properties: { options: { type: 'array', items: { type: 'string' }, maxItems: 3 } },
        required: ['options'],
      },
    },
  ];
}

export function cleanHistory(messages) {
  const out = [];
  for (const m of (Array.isArray(messages) ? messages : []).slice(-MAX_TURNS)) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) continue;
    const text = String(m.text || '').slice(0, MAX_CHARS).trim();
    if (!text) continue;
    const last = out[out.length - 1];
    if (last && last.role === m.role) last.content += '\n' + text;
    else out.push({ role: m.role, content: text });
  }
  while (out.length && out[0].role !== 'user') out.shift();
  return out;
}

async function aiReply(client, messages, lang, env) {
  const history = cleanHistory(messages);
  if (!history.length || history[history.length - 1].role !== 'user') return null;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: env.FRONT_DESK_MODEL || 'claude-haiku-5-5',
      max_tokens: 400,
      system: [{ type: 'text', text: systemPrompt(client), cache_control: { type: 'ephemeral' } }],
      tools: tools(client),
      messages: history,
    }),
  });
  if (!res.ok) throw new Error(`ai ${res.status}`);
  const data = await res.json();
  let text = '';
  const actions = [];
  let replies = [];
  for (const b of data.content || []) {
    if (b.type === 'text') text += b.text;
    if (b.type === 'tool_use' && b.name === 'whatsapp_button' && client.contacts.some(c => c.key === b.input?.contact)) {
      actions.push(handoff(client, b.input.contact, b.input.purpose, lang, { name: b.input.name, about: b.input.about }));
    }
    if (b.type === 'tool_use' && b.name === 'suggest_replies') {
      replies = (b.input?.options || []).map(s => String(s).slice(0, 40)).slice(0, 3);
    }
  }
  text = text.trim();
  if (!text && !actions.length) {
    // The model sometimes answers with only a tool call. Fall back to the client's own written answer.
    const o = offlineReply(client, history[history.length - 1].content, lang);
    return { ...o, replies: replies.length ? replies : o.replies, source: 'ai+rules' };
  }
  if (!text) {
    const where = actions.length === 1 ? actions[0].label.replace('WhatsApp ', '') : '';
    text = actions.length
      ? (actions[0].channel === 'ig'
          ? (lang === 'id' ? `Siap! Tap tombol di bawah untuk DM ${actions[0].label} di Instagram. Pesannya otomatis tersalin, tinggal tempel.`
                           : `Done. Tap the button below to DM ${actions[0].label} on Instagram. Your message is copied, just paste it.`)
          : (lang === 'id' ? `Siap! Tap tombol di bawah untuk kirim ke ${where} via WhatsApp, pesannya sudah siap.`
                           : `Done. Tap the button below to message ${where} on WhatsApp. The message is ready to send.`))
      : (lang === 'id' ? 'Ada yang bisa saya bantu lagi?' : 'Anything else I can help with?');
  }
  return { text, actions, replies, source: 'ai' };
}

export function offlineReply(client, text, lang) {
  return { ...client.offline(String(text || ''), lang, { handoff: (...a) => handoff(client, ...a), findContact: t => findContact(client, t) }), source: 'rules' };
}

export async function reply(client, messages, env) {
  const lastUser = [...(messages || [])].reverse().find(m => m && m.role === 'user');
  const lang = detectLang(lastUser?.text);
  if (env.ANTHROPIC_API_KEY) {
    try {
      const r = await aiReply(client, messages, lang, env);
      if (r) return r;
    } catch (e) {
      console.error('front-desk ai error', e.message);
    }
  }
  return offlineReply(client, lastUser?.text, lang);
}

// ---------- HTTP ----------
export function originAllowed(client, origin, host, env) {
  if (!origin) return false;
  try {
    const u = new URL(origin);
    if (u.host === host) return true;
    if (env.VERCEL_ENV !== 'production' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1')) return true;
    const extra = (env.EXTRA_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    return [...client.allowedOrigins, ...extra].includes(u.origin);
  } catch { return false; }
}

export function cors(origin) {
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    vary: 'Origin',
  };
}

export function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}
