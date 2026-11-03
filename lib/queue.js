// Gentology Queue: the paperless waiting list for every branch.
// One Redis hash per branch per day (field = ticket id), plus an atomic counter for ticket numbers.

import { rx } from './workspace.js';

export const SHOP = {
  id: 'gentology',
  name: 'Gentology Barbershop',
  tz: 7, // Jakarta, UTC+7
  branches: [
    { key: 'cideng', name: 'Cideng', full: 'Gentology Cideng', address: 'Jl. Cideng Timur Raya No. 90, Gambir', tel: '0817 7000 3750', e164: '6281770003750', placeId: 'ChIJeUivafH2aS4RfrUTqt1AZAM',
      maps: 'https://www.google.com/maps/search/?api=1&query=Gentology+Barbershop+Cideng' },
    { key: 'tanjung-duren', name: 'Tanjung Duren', full: 'Gentology Tanjung Duren', address: 'Jl. Tanjung Duren Raya Lama No. 823', tel: '0878 8693 4674', e164: '6287886934674', placeId: 'ChIJIXQ7iCz3aS4RhSJFT7oYrqc',
      maps: 'https://www.google.com/maps/search/?api=1&query=Gentology+Barbershop+Tanjung+Duren' },
    { key: 'cipete', name: 'Silverhawk Cipete', full: 'Gentology Silverhawk Cipete', address: 'Jl. Puri Mutiara No. 10A, Cipete', tel: '0877 7813 6435', e164: '6287778136435', placeId: 'ChIJJ2xw3I_vaS4RR59d7Dqo4SY',
      maps: 'https://www.google.com/maps/search/?api=1&query=Gentology+Barbershop+Silverhawk+Cipete' },
  ],
  services: [
    { key: 'fade', name: 'Fade signature haircut', price: 'IDR 90k', mins: 40 },
    { key: 'signature', name: 'Signature haircut', price: 'IDR 80k', mins: 35 },
    { key: 'shave', name: 'Traditional shaving', price: 'IDR 30–60k', mins: 20 },
    { key: 'tattoo', name: 'Hair tattoo', price: 'from IDR 60k', mins: 30 },
    { key: 'polish', name: 'Hair polish', price: 'IDR 80k', mins: 30 },
  ],
  defaultBarbers: 3,
  // Loyalty: 5 paid cuts, the 6th is free (Gentology's own punch-card rule).
  loyaltyPaid: 5,
  loyaltyEvery: 6,
};

// Indonesian numbers in one shape: 0812... / +62 812... / 812... -> 62812...
export function normPhone(p) {
  let d = String(p || '').replace(/\D/g, '');
  if (d.startsWith('0')) d = '62' + d.slice(1);
  else if (d.startsWith('8') && d.length >= 9 && d.length <= 12) d = '62' + d;
  return d.length >= 9 && d.length <= 15 ? d : null;
}
// Which loyalty card a ticket belongs to: the customer's phone number, or their chat id in the demo.
export function cardKey(t) {
  if (!t) return null;
  if (t.phone) return normPhone(t.phone);
  if (t.channel && t.user) return t.channel === 'wa' ? normPhone(t.user) : `${t.channel}:${t.user}`;
  return null;
}
// visits = finished visits so far. stamps = paid cuts on the current card (0-5); free = this next cut is free.
export const cardOf = visits => { const v = Number(visits) || 0, s = v % SHOP.loyaltyEvery; return { stamps: s, paid: SHOP.loyaltyPaid, free: s === SHOP.loyaltyPaid }; };

export const branchOf = k => SHOP.branches.find(b => b.key === k) || null;
export const serviceOf = k => SHOP.services.find(s => s.key === k) || SHOP.services[1];

export function today(t = Date.now()) {
  return new Date(t + SHOP.tz * 3600000).toISOString().slice(0, 10);
}
const K = {
  q: (b, d) => `gq:q:${b}:${d}`,
  seq: (b, d) => `gq:seq:${b}:${d}`,
  cfg: b => `gq:cfg:${b}`,
  tix: id => `gq:t:${id}`,
  visits: p => `gq:visits:${p}`,
};
const TTL = String(3 * 86400);
const parse = s => { try { return s ? JSON.parse(s) : null; } catch { return null; } };
const rid = () => Array.from(crypto.getRandomValues(new Uint8Array(9)), b => 'abcdefghjkmnpqrstuvwxyz23456789'[b % 31]).join('');

export async function branchCfg(env, b) {
  const [raw] = await rx(env, [['GET', K.cfg(b)]]);
  return { barbers: SHOP.defaultBarbers, ...(parse(raw) || {}) };
}
export async function setBarbers(env, b, n) {
  const barbers = Math.max(1, Math.min(12, Math.round(Number(n) || 1)));
  const cfg = await branchCfg(env, b);
  await rx(env, [['SET', K.cfg(b), JSON.stringify({ ...cfg, barbers })]]);
  return barbers;
}

export async function list(env, b, d = today()) {
  const [flat] = await rx(env, [['HGETALL', K.q(b, d)]]);
  const out = [];
  for (let i = 0; i < (flat || []).length; i += 2) { const t = parse(flat[i + 1]); if (t) out.push(t); }
  return out.sort((a, c) => a.no - c.no);
}

// Wait estimates: people waiting ahead, divided across the barbers on shift.
export function annotate(tickets, barbers) {
  const waiting = tickets.filter(t => t.status === 'waiting');
  const chair = tickets.filter(t => t.status === 'chair');
  const now = Date.now();
  // Minutes until each chair frees up, soonest first.
  const free = Array.from({ length: barbers }, (_, i) => {
    const c = chair[i];
    if (!c) return 0;
    const left = serviceOf(c.service).mins - (now - (c.startAt || now)) / 60000;
    return Math.max(3, left);
  }).sort((a, c) => a - c);
  waiting.forEach((t, i) => {
    const slot = free.indexOf(Math.min(...free));
    t.position = i + 1;
    t.waitMins = Math.round(free[slot]);
    free[slot] += serviceOf(t.service).mins;
  });
  // What a new customer joining now would wait.
  return { tickets, nextWait: Math.round(Math.min(...free)) };
}

export async function board(env, b) {
  const [tickets, cfg] = await Promise.all([list(env, b), branchCfg(env, b)]);
  const { nextWait } = annotate(tickets, cfg.barbers);
  await attachCards(env, tickets.filter(t => t.status === 'waiting' || t.status === 'chair'));
  const done = tickets.filter(t => t.status === 'done');
  const reviews = await reviewStats(env, b);
  return {
    branch: branchOf(b), date: today(), barbers: cfg.barbers, tickets, reviews,
    stats: {
      waiting: tickets.filter(t => t.status === 'waiting').length,
      chair: tickets.filter(t => t.status === 'chair').length,
      done: done.length,
      noshow: tickets.filter(t => t.status === 'noshow').length,
      whatsapp: tickets.filter(t => t.source !== 'walkin').length,
      walkin: tickets.filter(t => t.source === 'walkin').length,
      avgCut: done.length ? Math.round(done.reduce((n, t) => n + ((t.doneAt - (t.startAt || t.doneAt)) / 60000), 0) / done.length) : null,
      nextWait,
    },
  };
}

export async function attachCards(env, tickets) {
  const keyed = tickets.map(t => [t, cardKey(t)]).filter(([, k]) => k);
  if (!keyed.length) return;
  const vals = await rx(env, keyed.map(([, k]) => ['GET', K.visits(k)]));
  keyed.forEach(([t], i) => { t.card = cardOf(vals[i]); });
}
export async function getCard(env, key) {
  if (!key) return null;
  const [v] = await rx(env, [['GET', K.visits(key)]]);
  return cardOf(v);
}
// Move a paper punch card onto the digital one: set how many paid cuts are already stamped (0-5).
export async function setStamps(env, key, stamps) {
  const n = Math.max(0, Math.min(SHOP.loyaltyPaid, Math.round(Number(stamps) || 0)));
  if (!key) throw new Error('no_card');
  const [v] = await rx(env, [['GET', K.visits(key)]]);
  const base = (Number(v) || 0) - ((Number(v) || 0) % SHOP.loyaltyEvery);
  await rx(env, [['SET', K.visits(key), String(base + n), 'EX', String(400 * 86400)]]);
  return cardOf(base + n);
}

export async function quote(env, b) {
  const bd = await board(env, b);
  return { waiting: bd.stats.waiting, waitMins: bd.stats.nextWait };
}

export async function addTicket(env, b, { name, service, source, phone, channel, user }) {
  if (!branchOf(b)) throw new Error('bad_branch');
  const d = today();
  const [no] = await rx(env, [['INCR', K.seq(b, d)], ['EXPIRE', K.seq(b, d), TTL]]);
  const t = {
    id: rid(), no: Number(no), branch: b, date: d,
    name: String(name || '').replace(/[^\p{L}\p{N} .'-]/gu, '').trim().slice(0, 40) || 'Guest',
    service: serviceOf(service).key, source: source === 'walkin' ? 'walkin' : source === 'web' ? 'web' : 'whatsapp',
    phone: phone ? normPhone(phone) : null,
    channel: channel || null, user: user || null,
    status: 'waiting', createdAt: Date.now(), startAt: null, doneAt: null, alerted: false,
  };
  await rx(env, [
    ['HSET', K.q(b, d), t.id, JSON.stringify(t)], ['EXPIRE', K.q(b, d), TTL],
    ['SET', K.tix(t.id), JSON.stringify({ b, d }), 'EX', TTL],
  ]);
  return t;
}

export async function getTicket(env, id) {
  if (!/^[a-z2-9]{9}$/.test(id || '')) return null;
  const [ref] = await rx(env, [['GET', K.tix(id)]]);
  const r = parse(ref);
  if (!r) return null;
  const tickets = await list(env, r.b, r.d);
  const cfg = await branchCfg(env, r.b);
  annotate(tickets, cfg.barbers);
  const t = tickets.find(x => x.id === id);
  return t ? { ticket: t, branch: branchOf(r.b), serving: tickets.filter(x => x.status === 'chair').map(x => x.no) } : null;
}

async function save(env, t) {
  await rx(env, [['HSET', K.q(t.branch, t.date), t.id, JSON.stringify(t)]]);
}

// Staff and customer actions. Returns the changed ticket.
export async function act(env, b, id, action) {
  const tickets = await list(env, b);
  const t = tickets.find(x => x.id === id);
  if (!t) throw new Error('not_found');
  const now = Date.now();
  if (action === 'start') {
    const used = new Set(tickets.filter(x => x.status === 'chair' && x.id !== t.id && x.chair).map(x => x.chair));
    let c = 1; while (used.has(c)) c++;
    t.status = 'chair'; t.startAt = now; t.chair = c;
  }
  else if (action === 'done') { t.status = 'done'; t.doneAt = now; t.startAt = t.startAt || now; }
  else if (action === 'noshow') { t.status = 'noshow'; t.doneAt = now; }
  else if (action === 'cancel') { t.status = 'cancelled'; t.doneAt = now; }
  else if (action === 'back') { t.status = 'waiting'; t.startAt = null; t.doneAt = null; t.chair = null; }
  else throw new Error('bad_action');
  const who = cardKey(t);
  if (action === 'done' && who && !t.counted) {
    const [n] = await rx(env, [['INCR', K.visits(who)], ['EXPIRE', K.visits(who), String(400 * 86400)]]);
    t.visits = Number(n); t.counted = true;
    t.freeCut = (t.visits - 1) % SHOP.loyaltyEvery === SHOP.loyaltyPaid;
  }
  if (action === 'back' && t.counted && who) {
    // undo a Done that already stamped the card
    await rx(env, [['DECR', K.visits(who)]]); t.counted = false; t.freeCut = false; t.visits = null;
  }
  await save(env, t);
  return t;
}

// Tickets that should get the "your turn is soon" message now.
export async function dueForAlert(env, b) {
  const bd = await board(env, b);
  const due = bd.tickets.filter(t => t.status === 'waiting' && !t.alerted && t.channel && (t.waitMins <= 15 || t.position <= 1));
  for (const t of due) { t.alerted = true; const { position, waitMins, ...plain } = t; await save(env, plain); }
  return due;
}

export async function resetDay(env, b) {
  const d = today();
  await rx(env, [['DEL', K.q(b, d), K.seq(b, d)]]);
}

export async function activeTicketFor(env, channel, user) {
  const out = [];
  for (const br of SHOP.branches) {
    const tickets = await list(env, br.key);
    const t = tickets.find(x => x.channel === channel && x.user === user && (x.status === 'waiting' || x.status === 'chair'));
    if (t) out.push(t);
  }
  return out[0] || null;
}

// ---------- reviews ----------
export const reviewUrl = b => `https://search.google.com/local/writereview?placeid=${b.placeId}`;
export async function logReview(env, b, stars, posted) {
  const k = `gq:rv:${b}:${today()}`;
  const cmds = posted ? [['HINCRBY', k, 'posted', '1']] : [['HINCRBY', k, 'count', '1'], ['HINCRBY', k, 'sum', String(stars)], ['HINCRBY', k, 's' + stars, '1']];
  await rx(env, [...cmds, ['EXPIRE', k, String(40 * 86400)]]);
}
export async function reviewStats(env, b) {
  const [flat] = await rx(env, [['HGETALL', `gq:rv:${b}:${today()}`]]);
  const h = {}; for (let i = 0; i < (flat || []).length; i += 2) h[flat[i]] = Number(flat[i + 1]);
  return { count: h.count || 0, posted: h.posted || 0, avg: h.count ? +(h.sum / h.count).toFixed(1) : null };
}
