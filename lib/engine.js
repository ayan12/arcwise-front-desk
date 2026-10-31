// Arcwise Front Desk: the shared brain. Works on Vercel (edge) and Cloudflare Workers:
// it only uses fetch, Request and Response.

const MAX_TURNS = 12;        // messages of history sent to the AI
const MAX_CHARS = 800;       // per message
const PER_IP_PER_HOUR = 40;  // messages

// Best-effort limits. They live in each running instance's memory, so they are a guard
// against abuse, not exact accounting. Move them to a database when a client needs that.
const ipHits = new Map();
const dayHits = new Map();

export function limited(client, ip) {
  const now = Date.now();
  const hour = Math.floor(now / 3_600_000);
  const k = `${ip}|${hour}`;
  const n = (ipHits.get(k) || 0) + 1;
  ipHits.set(k, n);
  if (ipHits.size > 5000) ipHits.clear();
  const day = new Date(now).toISOString().slice(0, 10);
  const dk = `${client.id}|${day}`;
  const d = (dayHits.get(dk) || 0) + 1;
  dayHits.set(dk, d);
  if (n > PER_IP_PER_HOUR) return 'ip';
  if (d > (client.dailyCap || 300)) return 'day';
  return null;
}

// ---------- language ----------
const ID_WORDS = /\b(saya|aku|mau|bisa|berapa|harga|jam|buka|tutup|cabang|dimana|di mana|apa|ada|hari|ini|besok|antri|antre|potong|rambut|cukur|halo|hai|kak|bang|mas|gak|nggak|tidak|ya|dong|sih|terima kasih|makasih|lokasi|alamat|masuk|daftar)\b/i;
export function detectLang(text) {
  return ID_WORDS.test(text || '') ? 'id' : 'en';
}

// ---------- shared helpers ----------
function waUrl(branch, text) {
  return `https://wa.me/${branch.e164}?text=${encodeURIComponent(text)}`;
}
function waAction(client, branch, text, lang) {
  return {
    type: 'link',
    label: (lang === 'id' ? 'WhatsApp ' : 'WhatsApp ') + branch.name,
    url: waUrl(branch, text),
  };
}
function waitlistText(client, branch, lang, name) {
  return lang === 'id'
    ? `Halo ${client.name} ${branch.name}, saya mau masuk waiting list hari ini.${name ? ` Nama: ${name}.` : ' Nama: '}`
    : `Hi ${client.name} ${branch.name}, I'd like to join today's waiting list.${name ? ` Name: ${name}.` : ' Name: '}`;
}
function findBranch(client, text) {
  const t = (text || '').toLowerCase();
  return client.branches.find(b =>
    t.includes(b.key.replace('-', ' ')) || t.includes(b.key) ||
    b.name.toLowerCase().split(' ').some(w => w.length > 4 && t.includes(w)));
}

// ---------- offline answers (no AI key, AI down, or limits hit) ----------
export function ruleReply(client, text, lang) {
  const t = (text || '').toLowerCase();
  const id = lang === 'id';
  const branch = findBranch(client, t);
  const wantsQueue = /(waiting|antri|antre|queue|daftar|book|reserv|slot|masuk)/.test(t);
  const wantsPrice = /(harga|price|berapa|cost|biaya|haircut|fade|shav|cukur|tattoo|polish|layanan|service|menu)/.test(t);
  const wantsInfo = /(jam|buka|tutup|open|close|hour|cabang|branch|lokasi|location|alamat|address|where|mana|maps)/.test(t);

  if (wantsQueue || (branch && !wantsPrice && !wantsInfo)) {
    const list = branch ? [branch] : client.branches;
    return {
      text: branch
        ? (id ? `Siap. Tap di bawah untuk kirim ke ${branch.name} via WhatsApp, tulis nama kamu, dan mereka akan kasih nomor antrian.`
              : `Sure. Tap below to message ${branch.name} on WhatsApp, add your name, and they'll give you your place in the queue.`)
        : (id ? 'Mau di cabang mana? Tap cabangnya, lalu kirim pesannya di WhatsApp dengan nama kamu.'
              : 'Which branch? Tap one below and send the message on WhatsApp with your name.'),
      actions: list.map(b => waAction(client, b, waitlistText(client, b, lang), lang)),
      replies: [],
    };
  }
  if (wantsPrice) {
    const rows = client.services.map(([n, p]) => `• ${n}: ${p}`).join('\n');
    return {
      text: (id ? 'Harga kami:\n' : 'Our prices:\n') + rows +
        (id ? '\n\nSemua haircut sudah termasuk hair vitamin, hot towel, pijat dan styling pomade.'
            : '\n\nEvery haircut includes hair vitamin, hot towel, massage and pomade styling.'),
      actions: [],
      replies: client.quickReplies[lang].filter((_, i) => i !== 1),
    };
  }
  if (wantsInfo) {
    const hrs = client.hours.map(([d, h]) => `${d} ${h}`).join('\n');
    const brs = client.branches.map(b => `• ${b.name}: ${b.address} (${b.tel})`).join('\n');
    return {
      text: (id ? 'Cabang kami:\n' : 'Our branches:\n') + brs + (id ? '\n\nJam buka:\n' : '\n\nOpening hours:\n') + hrs,
      actions: [],
      replies: client.quickReplies[lang].filter((_, i) => i !== 2),
    };
  }
  return {
    text: id
      ? 'Saya bisa bantu soal harga, jam buka, lokasi cabang, atau masuk waiting list. Untuk pertanyaan lain, chat langsung cabangnya di WhatsApp.'
      : 'I can help with prices, opening hours, branch locations or joining the waiting list. For anything else, message the branch on WhatsApp.',
    actions: client.branches.map(b => waAction(client, b, id ? `Halo ${client.name} ${b.name}, ` : `Hi ${client.name} ${b.name}, `, lang)),
    replies: client.quickReplies[lang],
  };
}

// ---------- AI answers ----------
function systemPrompt(client) {
  const hrs = client.hours.map(([d, h]) => `${d}: ${h}`).join('\n');
  const svc = client.services.map(([n, p]) => `${n}: ${p}`).join('\n');
  const brs = client.branches.map(b => `${b.key} = ${b.name}, ${b.address}, phone/WhatsApp ${b.tel}`).join('\n');
  return `You are ${client.assistant}, the receptionist chat on ${client.name}'s website.

FACTS (the only things you know):
${client.facts}

SERVICES AND PRICES:
${svc}

OPENING HOURS:
${hrs}

BRANCHES:
${brs}

RULES:
- Reply in the customer's language (Bahasa Indonesia or English). Match their tone; casual Jakarta Bahasa is fine.
- Keep replies short: 1 to 3 sentences, or a short list. Plain text, no markdown headings or bold.
- Only state what is in FACTS, SERVICES, HOURS and BRANCHES. If you don't know (for example live queue length, a specific barber, promos), say the branch can tell them and offer the WhatsApp button.
- You cannot see the live queue and cannot confirm a place yourself. To join the waiting list: find out which branch (and their name if they give it), then call whatsapp_button so they send it to the branch, who confirm their number.
- Always write a short reply to the customer, even when you also call a tool.
- Use whatsapp_button whenever the next step is contacting a branch. Use suggest_replies to offer up to 3 short next steps when helpful.
- Never invent prices, discounts, times or availability. Never discuss topics unrelated to ${client.name}; steer back politely.`;
}

function tools(client) {
  return [
    {
      name: 'whatsapp_button',
      description: 'Show the customer a button that opens WhatsApp to a branch with a message already typed.',
      input_schema: {
        type: 'object',
        properties: {
          branch: { type: 'string', enum: client.branches.map(b => b.key) },
          name: { type: 'string', description: "The customer's name, if they gave it." },
          purpose: { type: 'string', enum: ['waitlist', 'question'], description: 'waitlist = join the waiting list; question = anything else for the branch.' },
        },
        required: ['branch', 'purpose'],
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

function cleanHistory(messages) {
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

export async function aiReply(client, messages, lang, env) {
  const history = cleanHistory(messages);
  if (!history.length || history[history.length - 1].role !== 'user') return null;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
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
    if (b.type === 'tool_use' && b.name === 'whatsapp_button') {
      const br = client.branches.find(x => x.key === b.input?.branch);
      if (br) {
        const name = String(b.input.name || '').replace(/[^\p{L}\p{N} .'-]/gu, '').slice(0, 40).trim();
        const msg = b.input.purpose === 'question'
          ? (lang === 'id' ? `Halo ${client.name} ${br.name}, ${name ? `saya ${name}. ` : ''}` : `Hi ${client.name} ${br.name}, ${name ? `this is ${name}. ` : ''}`)
          : waitlistText(client, br, lang, name);
        actions.push(waAction(client, br, msg, lang));
      }
    }
    if (b.type === 'tool_use' && b.name === 'suggest_replies') {
      replies = (b.input?.options || []).map(s => String(s).slice(0, 40)).slice(0, 3);
    }
  }
  text = text.trim();
  if (!text) {
    const where = actions.length === 1 ? actions[0].label.replace('WhatsApp ', '') : '';
    text = actions.length
      ? (lang === 'id'
          ? `Siap! Tap tombol di bawah untuk kirim ke ${where || 'cabangnya'} via WhatsApp, pesannya sudah siap.`
          : `Done. Tap the button below to send it to ${where || 'the branch'} on WhatsApp. The message is ready to send.`)
      : (lang === 'id' ? 'Ada yang bisa saya bantu lagi?' : 'Anything else I can help with?');
  }
  return { text, actions, replies, source: 'ai' };
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
  return { ...ruleReply(client, lastUser?.text || '', lang), source: 'rules' };
}

// ---------- HTTP ----------
export function originAllowed(client, origin, host, env) {
  if (!origin) return false;
  try {
    const u = new URL(origin);
    if (u.host === host) return true;                                   // the engine's own demo page
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
