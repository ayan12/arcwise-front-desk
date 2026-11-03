// The Arcwise workspace: clients, their websites and the activity log, stored in Redis as JSON.
// One person edits it, so a single document is simple and safe.

import { CLIENTS } from '../clients/index.js';

export const STAGES = ['Lead', 'Concept', 'Pitched', 'Won', 'Building', 'Live', 'Lost'];
export const PAYING = ['Won', 'Building', 'Live'];
const CURRENCIES = ['IDR', 'MYR', 'SGD', 'USD', 'EUR', 'GBP', 'PKR'];
const KEY = 'fd:workspace';
const ACT = 'fd:activity';

const now = () => Date.now();
const uid = p => p + '_' + Math.random().toString(36).slice(2, 8) + now().toString(36).slice(-4);

const SEED = () => {
  const t = now();
  return {
    v: 1, updated: t,
    clients: [
      { id: 'c_arcwise', name: 'Arcwise Studios', business: 'Our own agency site', location: 'Worldwide', stage: 'Live', internal: true,
        value: null, monthly: null, currency: 'IDR', contact: { name: 'Ayan', whatsapp: '+60 11-6416 9355', email: 'hello@arcwisestudios.com', instagram: '' },
        notes: 'Portfolio and lead source. Front Desk installed.', createdAt: t,
        sites: [{ id: 's_arcwise', url: 'https://arcwise-studios.vercel.app/', label: 'Portfolio', frontDesk: 'arcwise', indexable: true, addedAt: t }] },
      { id: 'c_moosh', name: 'Moosh Hair Studio', business: 'Ladies-only hair salon', location: 'Banjarbaru', stage: 'Won',
        value: 3000000, monthly: null, currency: 'IDR', contact: { name: '', whatsapp: '', email: '', instagram: '' },
        notes: 'Agreed Rp 3 jt for the website. Hosting not included.', createdAt: t,
        sites: [{ id: 's_moosh', url: 'https://moosh-concept.vercel.app/', label: 'Website', frontDesk: null, indexable: false, addedAt: t }] },
      { id: 'c_gentology', name: 'Gentology Barbershop', business: 'Barbershop, 3 branches', location: 'Jakarta', stage: 'Pitched',
        value: 10000000, monthly: 3000000, currency: 'IDR', contact: { name: 'Owner', whatsapp: '0817 7000 3750', email: 'gentology.barbershop@gmail.com', instagram: '@gentology.roaring20s.barber' },
        notes: 'Meeting set. Pitching the Growth System: Rp 10 jt setup + Rp 3 jt/month, 30-day pilot at one branch.', createdAt: t,
        sites: [{ id: 's_gentology', url: 'https://gentology-site.vercel.app/', label: 'Concept site', frontDesk: 'gentology', indexable: false, addedAt: t }] },
      { id: 'c_brap', name: 'BRAP Helmet', business: 'Helmet brand', location: '', stage: 'Concept',
        value: null, monthly: null, currency: 'IDR', contact: { name: '', whatsapp: '', email: '', instagram: '' },
        notes: '3D helmet designer concept.', createdAt: t,
        sites: [{ id: 's_brap', url: 'https://brap-site.vercel.app/', label: 'Concept site', frontDesk: null, indexable: false, addedAt: t }] },
    ],
  };
};

// ---------- tiny Redis client (Upstash REST) ----------
function redis(env) {
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}
export async function rx(env, cmds) {
  const r = redis(env);
  if (!r) throw new Error('no_store');
  const res = await fetch(`${r.url}/pipeline`, {
    method: 'POST', headers: { authorization: `Bearer ${r.token}`, 'content-type': 'application/json' }, body: JSON.stringify(cmds),
  });
  if (!res.ok) throw new Error(`store ${res.status}`);
  return (await res.json()).map(x => x.result);
}
const parse = s => { try { return s ? JSON.parse(s) : null; } catch { return null; } };

export async function loadWorkspace(env) {
  const [raw] = await rx(env, [['GET', KEY]]);
  const ws = parse(raw);
  if (ws) return ws;
  const seed = SEED();
  await rx(env, [['SET', KEY, JSON.stringify(seed)]]);
  await logActivity(env, { type: 'system', text: 'Workspace created with Arcwise, Moosh, Gentology and BRAP' });
  return seed;
}
export async function saveWorkspace(env, ws) {
  ws.updated = now();
  await rx(env, [['SET', KEY, JSON.stringify(ws)]]);
}

export async function logActivity(env, e) {
  const entry = { id: uid('a'), t: now(), type: e.type || 'note', text: String(e.text || '').slice(0, 500), clientId: e.clientId || null, siteId: e.siteId || null };
  await rx(env, [['LPUSH', ACT, JSON.stringify(entry)], ['LTRIM', ACT, '0', '299']]);
  return entry;
}
export async function activity(env, n = 120) {
  const [list] = await rx(env, [['LRANGE', ACT, '0', String(n - 1)]]);
  return (list || []).map(parse).filter(Boolean);
}

// ---------- validation ----------
const str = (v, n = 120) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
const num = v => { const n = Number(String(v ?? '').replace(/[^\d.]/g, '')); return Number.isFinite(n) && n > 0 ? Math.round(n) : null; };

export function cleanUrl(u) {
  let s = str(u, 300);
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  try {
    const x = new URL(s);
    if (x.protocol !== 'https:' && x.protocol !== 'http:') return null;
    if (!/\./.test(x.hostname) || /^(localhost|127\.|10\.|192\.168\.|169\.254\.)/.test(x.hostname)) return null;
    return x.origin + (x.pathname || '/');
  } catch { return null; }
}

export function cleanSite(s, prev) {
  const url = cleanUrl(s.url);
  if (!url) throw new Error('bad_url');
  const fd = s.frontDesk && Object.prototype.hasOwnProperty.call(CLIENTS, s.frontDesk) ? s.frontDesk : null;
  return {
    id: prev?.id || (typeof s.id === 'string' && /^s_[a-z0-9_]{3,40}$/.test(s.id) ? s.id : uid('s')),
    url, label: str(s.label, 40) || 'Website', frontDesk: fd,
    indexable: !!s.indexable, addedAt: prev?.addedAt || now(),
  };
}

export function cleanClient(c, prev) {
  const name = str(c.name, 80);
  if (!name) throw new Error('name_required');
  const sitesIn = Array.isArray(c.sites) ? c.sites.slice(0, 20) : (prev?.sites || []);
  return {
    id: prev?.id || uid('c'),
    name, business: str(c.business, 120), location: str(c.location, 80),
    stage: STAGES.includes(c.stage) ? c.stage : 'Lead',
    internal: !!(prev ? prev.internal : c.internal),
    value: num(c.value), monthly: num(c.monthly),
    currency: CURRENCIES.includes(c.currency) ? c.currency : 'IDR',
    contact: { name: str(c.contact?.name, 80), whatsapp: str(c.contact?.whatsapp, 30), email: str(c.contact?.email, 120), instagram: str(c.contact?.instagram, 60) },
    notes: str(c.notes, 2000),
    createdAt: prev?.createdAt || now(),
    sites: sitesIn.map(s => cleanSite(s, (prev?.sites || []).find(p => p.id === s.id))),
  };
}

// ---------- domains (registration date and expiry from public RDAP) ----------
const SLD = new Set(['co', 'com', 'net', 'org', 'ac', 'or', 'web', 'my', 'biz', 'sch', 'gov', 'edu']);
export function apexOf(host) {
  const p = host.toLowerCase().replace(/^www\./, '').split('.');
  if (p.length >= 3 && p[p.length - 1].length === 2 && SLD.has(p[p.length - 2])) return p.slice(-3).join('.');
  return p.slice(-2).join('.');
}
export function domainKind(host) {
  if (/\.vercel\.app$/i.test(host)) return 'vercel';
  if (/\.(netlify\.app|pages\.dev|github\.io)$/i.test(host)) return 'platform';
  return 'custom';
}

export async function domainInfo(env, host) {
  const kind = domainKind(host);
  if (kind !== 'custom') return { host, apex: host, kind, checkedAt: now() };
  const apex = apexOf(host);
  const ck = `fd:domain:${apex}`;
  const [cached] = await rx(env, [['GET', ck]]);
  const c = parse(cached);
  if (c && now() - c.checkedAt < 20 * 3600 * 1000) return { ...c, host };
  let info = { host, apex, kind, checkedAt: now(), expires: null, registered: null, registrar: null, status: [], error: null };
  try {
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(`https://rdap.org/domain/${apex}`, { signal: ctrl.signal, headers: { accept: 'application/rdap+json' }, redirect: 'follow' });
    clearTimeout(t);
    if (res.ok) {
      const j = await res.json();
      for (const e of j.events || []) {
        if (e.eventAction === 'expiration') info.expires = Date.parse(e.eventDate) || null;
        if (e.eventAction === 'registration') info.registered = Date.parse(e.eventDate) || null;
      }
      const reg = (j.entities || []).find(e => (e.roles || []).includes('registrar'));
      const fn = reg?.vcardArray?.[1]?.find(v => v[0] === 'fn');
      info.registrar = fn ? String(fn[3]).slice(0, 80) : null;
      info.status = (j.status || []).slice(0, 4);
    } else info.error = res.status === 404 ? 'not_registered' : 'lookup_failed';
  } catch { info.error = 'lookup_failed'; }
  await rx(env, [['SET', ck, JSON.stringify(info), 'EX', String(3 * 86400)]]);
  return info;
}
