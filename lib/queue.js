// Gentology Queue: the paperless waiting list for every branch.
// One Redis hash per branch per day (field = ticket id), plus an atomic counter for ticket numbers.

import { rx } from './workspace.js';

export const SHOP = {
  id: 'gentology',
  name: 'Gentology Barbershop',
  tz: 7, // Jakarta, UTC+7
  branches: [
    { key: 'cideng', name: 'Cideng', full: 'Gentology Cideng', address: 'Jl. Cideng Timur Raya No. 90, Gambir', tel: '0817 7000 3750', e164: '6281770003750',
      maps: 'https://www.google.com/maps/search/?api=1&query=Gentology+Barbershop+Cideng' },
    { key: 'tanjung-duren', name: 'Tanjung Duren', full: 'Gentology Tanjung Duren', address: 'Jl. Tanjung Duren Raya Lama No. 823', tel: '0878 8693 4674', e164: '6287886934674',
      maps: 'https://www.google.com/maps/search/?api=1&query=Gentology+Barbershop+Tanjung+Duren' },
    { key: 'cipete', name: 'Silverhawk Cipete', full: 'Gentology Silverhawk Cipete', address: 'Jl. Puri Mutiara No. 10A, Cipete', tel: '0877 7813 6435', e164: '6287778136435',
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
  loyaltyEvery: 10,
};

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
  const done = tickets.filter(t => t.status === 'done');
  return {
    branch: branchOf(b), date: today(), barbers: cfg.barbers, tickets,
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
    phone: phone ? String(phone).replace(/\D/g, '').slice(0, 15) : null,
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
  if (action === 'start') { t.status = 'chair'; t.startAt = now; }
  else if (action === 'done') { t.status = 'done'; t.doneAt = now; t.startAt = t.startAt || now; }
  else if (action === 'noshow') { t.status = 'noshow'; t.doneAt = now; }
  else if (action === 'cancel') { t.status = 'cancelled'; t.doneAt = now; }
  else if (action === 'back') { t.status = 'waiting'; t.startAt = null; t.doneAt = null; }
  else throw new Error('bad_action');
  await save(env, t);
  const who = t.phone || (t.user ? `${t.channel}:${t.user}` : null);
  if (action === 'done' && who) {
    const [n] = await rx(env, [['INCR', K.visits(who)], ['EXPIRE', K.visits(who), String(400 * 86400)]]);
    t.visits = Number(n);
  }
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
