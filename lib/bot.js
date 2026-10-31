// The Gentology WhatsApp booking assistant. Channel-agnostic: the same flow runs on real
// WhatsApp (Cloud API) and in the demo phone simulator.

import { rx } from './workspace.js';
import { send } from './channels.js';
import { SHOP, branchOf, serviceOf, quote, addTicket, act, activeTicketFor, getTicket, dueForAlert } from './queue.js';
import { reply as aiReply, detectLang } from './engine.js';
import gentology from '../clients/gentology.js';

const parse = s => { try { return s ? JSON.parse(s) : null; } catch { return null; } };
const convKey = (ch, u) => `gq:conv:${ch}:${u}`;

const TX = {
  en: {
    hello: n => `Hi${n ? ' ' + n : ''}! Welcome to Gentology Barbershop. Skip the phone call: join today’s waiting list right here, and we’ll message you when it’s almost your turn.`,
    join: 'Join the waiting list', prices: 'Prices', hours: 'Branches & hours', status: 'My spot', cancel: 'Cancel my spot', choose: 'Choose',
    pickBranch: 'Which branch? Live waiting times right now:', branches: 'Branches',
    wait: (m, w) => m <= 0 ? 'No wait right now' : `~${m} min wait · ${w} waiting`,
    pickService: 'Which service?', services: 'Services',
    askName: 'What name should we call out?',
    useName: n => `Use “${n}”`, otherName: 'Another name',
    booked: (t, b, link) => `You’re in! 🎟️\n\nNumber *${t.no}* at ${b.full}\n${t.waitMins > 0 ? `Position ${t.position} · about ${t.waitMins} min` : 'You’re next: come in now and show this number'}\n\nWe’ll message you about 15 minutes before your turn. Track it live: ${link}\n\n📍 ${b.address}`,
    statusMsg: (t, b, link) => t.status === 'chair' ? `You’re in the chair at ${b.full}. Enjoy the cut ✂️` : `Number *${t.no}* at ${b.full}\n${t.waitMins > 0 ? `Position ${t.position} · about ${t.waitMins} min` : 'You’re next: come in now'}\n\nLive: ${link}`,
    none: 'You don’t have a spot in the queue right now.',
    cancelled: 'Your spot is cancelled. Join again any time.',
    soon: (t, b) => `⏰ Almost your turn at ${b.full}!\n\nNumber *${t.no}*, about ${Math.max(5, t.waitMins)} minutes. Please head over now so you don’t miss your call.\n📍 ${b.address}`,
    thanks: (t, v, review) => `Thanks for coming in, ${t.name}! ✂️\n\nLoyalty card: ${'●'.repeat(v % SHOP.loyaltyEvery || SHOP.loyaltyEvery)}${'○'.repeat(SHOP.loyaltyEvery - (v % SHOP.loyaltyEvery || SHOP.loyaltyEvery))} (${v % SHOP.loyaltyEvery || SHOP.loyaltyEvery}/${SHOP.loyaltyEvery})${v % SHOP.loyaltyEvery === 0 ? '\nYour next cut is on us 🎉' : ''}\n\nHow was it? A quick Google review helps us a lot: ${review}`,
    missed: t => `We called number ${t.no} but missed you. Want a new spot? Tap below.`,
    priceList: () => 'Our prices:\n' + SHOP.services.map(s => `• ${s.name}: ${s.price}`).join('\n') + '\n\nEvery haircut includes hair vitamin, hot towel, massage and pomade styling.',
    hoursList: () => 'Our branches:\n' + SHOP.branches.map(b => `• ${b.full}: ${b.address}`).join('\n') + '\n\nOpen Mon–Thu & Sun 11:00–22:00, Fri 14:00–22:00, Sat 09:00–20:00.',
  },
  id: {
    hello: n => `Halo${n ? ' ' + n : ''}! Selamat datang di Gentology Barbershop. Gak perlu telepon: masuk waiting list hari ini langsung di sini, nanti kami kabari pas giliran kamu sudah dekat.`,
    join: 'Masuk waiting list', prices: 'Harga', hours: 'Cabang & jam', status: 'Posisi saya', cancel: 'Batalkan antrian', choose: 'Pilih',
    pickBranch: 'Mau di cabang mana? Waktu tunggu sekarang:', branches: 'Cabang',
    wait: (m, w) => m <= 0 ? 'Tanpa antri sekarang' : `~${m} menit · ${w} antri`,
    pickService: 'Mau layanan apa?', services: 'Layanan',
    askName: 'Atas nama siapa?',
    useName: n => `Pakai “${n}”`, otherName: 'Nama lain',
    booked: (t, b, link) => `Sudah masuk! 🎟️\n\nNomor *${t.no}* di ${b.full}\n${t.waitMins > 0 ? `Posisi ${t.position} · sekitar ${t.waitMins} menit` : 'Kamu berikutnya: langsung datang dan tunjukkan nomor ini'}\n\nKami kabari sekitar 15 menit sebelum giliran kamu. Pantau langsung: ${link}\n\n📍 ${b.address}`,
    statusMsg: (t, b, link) => t.status === 'chair' ? `Kamu sedang dipotong di ${b.full}. Selamat menikmati ✂️` : `Nomor *${t.no}* di ${b.full}\n${t.waitMins > 0 ? `Posisi ${t.position} · sekitar ${t.waitMins} menit` : 'Kamu berikutnya: langsung datang'}\n\nPantau: ${link}`,
    none: 'Kamu belum ada di antrian sekarang.',
    cancelled: 'Antrian kamu sudah dibatalkan. Bisa daftar lagi kapan saja.',
    soon: (t, b) => `⏰ Giliran kamu sebentar lagi di ${b.full}!\n\nNomor *${t.no}*, sekitar ${Math.max(5, t.waitMins)} menit lagi. Yuk berangkat sekarang biar gak kelewat.\n📍 ${b.address}`,
    thanks: (t, v, review) => `Terima kasih sudah datang, ${t.name}! ✂️\n\nKartu loyalty: ${'●'.repeat(v % SHOP.loyaltyEvery || SHOP.loyaltyEvery)}${'○'.repeat(SHOP.loyaltyEvery - (v % SHOP.loyaltyEvery || SHOP.loyaltyEvery))} (${v % SHOP.loyaltyEvery || SHOP.loyaltyEvery}/${SHOP.loyaltyEvery})${v % SHOP.loyaltyEvery === 0 ? '\nPotongan berikutnya gratis 🎉' : ''}\n\nGimana hasilnya? Review singkat di Google sangat membantu kami: ${review}`,
    missed: t => `Nomor ${t.no} sudah dipanggil tapi kamu belum ada. Mau ambil nomor baru? Tap di bawah.`,
    priceList: () => 'Harga kami:\n' + SHOP.services.map(s => `• ${s.name}: ${s.price}`).join('\n') + '\n\nSemua haircut sudah termasuk hair vitamin, hot towel, pijat dan styling pomade.',
    hoursList: () => 'Cabang kami:\n' + SHOP.branches.map(b => `• ${b.full}: ${b.address}`).join('\n') + '\n\nBuka Sen–Kam & Min 11:00–22:00, Jum 14:00–22:00, Sab 09:00–20:00.',
  },
};

const ticketLink = (base, t) => `${base}/ticket?id=${t.id}`;
const reviewLink = b => b.maps;

async function loadConv(env, ch, u) { const [raw] = await rx(env, [['GET', convKey(ch, u)]]); return parse(raw) || { step: null, history: [] }; }
async function saveConv(env, ch, u, c) { await rx(env, [['SET', convKey(ch, u), JSON.stringify(c), 'EX', String(86400)]]); }

function menu(T, active) {
  return active
    ? [{ id: 'tk:status', title: T.status }, { id: 'tk:cancel', title: T.cancel }, { id: 'menu:prices', title: T.prices }]
    : [{ id: 'menu:join', title: T.join }, { id: 'menu:prices', title: T.prices }, { id: 'menu:hours', title: T.hours }];
}

// input: { text } or { id } (button or list reply). profileName: the WhatsApp display name, if known.
export async function handle(env, { channel, user, input, profileName, base }) {
  const c = await loadConv(env, channel, user);
  if (input.text) c.lang = detectLang(input.text) === 'id' ? 'id' : (c.lang || 'en');
  const L = c.lang || 'en', T = TX[L];
  const out = m => send(env, channel, user, m);
  const text = String(input.text || '').trim();
  const id = input.id || '';
  const active = await activeTicketFor(env, channel, user);

  c.history = [...(c.history || []), ...(text ? [{ role: 'user', text }] : [])].slice(-8);

  // 1) Structured replies (taps)
  const wantsJoin = !id && !c.step && !active && /\b(antri|antre|antrian|queue|waiting|daftar|booking|book|join|ambil nomor)\b/i.test(text);
  const named = wantsJoin && SHOP.branches.find(b => text.toLowerCase().includes(b.key.replace('-', ' ')) || b.name.toLowerCase().split(' ').some(w => w.length > 4 && text.toLowerCase().includes(w)));
  if (named) {
    c.branch = named.key; c.step = 'service'; await saveConv(env, channel, user, c);
    return out({ text: T.pickService, list: { button: T.choose, title: T.services, rows: SHOP.services.map(s => ({ id: 'sv:' + s.key, title: s.name, desc: `${s.price} · ${s.mins} min` })) } });
  }
  if (id === 'menu:join' || wantsJoin) {
    const rows = await Promise.all(SHOP.branches.map(async b => { const q = await quote(env, b.key); return { id: 'br:' + b.key, title: b.name, desc: T.wait(q.waitMins, q.waiting) }; }));
    c.step = 'branch'; await saveConv(env, channel, user, c);
    return out({ text: T.pickBranch, list: { button: T.choose, title: T.branches, rows } });
  }
  if (id.startsWith('br:') && branchOf(id.slice(3))) {
    c.branch = id.slice(3); c.step = 'service'; await saveConv(env, channel, user, c);
    return out({ text: T.pickService, list: { button: T.choose, title: T.services, rows: SHOP.services.map(s => ({ id: 'sv:' + s.key, title: s.name, desc: `${s.price} · ${s.mins} min` })) } });
  }
  if (id.startsWith('sv:')) {
    c.service = serviceOf(id.slice(3)).key;
    if (profileName) { c.step = 'confirmName'; c.profileName = profileName; await saveConv(env, channel, user, c); return out({ text: T.askName, buttons: [{ id: 'nm:yes', title: T.useName(profileName.slice(0, 12)) }, { id: 'nm:other', title: T.otherName }] }); }
    c.step = 'name'; await saveConv(env, channel, user, c);
    return out({ text: T.askName });
  }
  if (id === 'nm:other') { c.step = 'name'; await saveConv(env, channel, user, c); return out({ text: T.askName }); }
  if (id === 'nm:yes' || (c.step === 'name' && text)) {
    const name = id === 'nm:yes' ? c.profileName : text;
    if (!c.branch) { c.step = null; await saveConv(env, channel, user, c); return out({ text: T.hello(), buttons: menu(T, active) }); }
    const t = await addTicket(env, c.branch, { name, service: c.service, source: 'whatsapp', phone: channel === 'wa' ? user : null, channel, user });
    const info = await getTicket(env, t.id);
    c.step = null; c.lastTicket = t.id; await saveConv(env, channel, user, c);
    return out({ text: T.booked(info.ticket, info.branch, ticketLink(base, t)), buttons: menu(T, true).slice(0, 2) });
  }
  if (id === 'tk:status' || (!id && active && /\b(status|posisi|nomor|giliran|turn|position|berapa lama|how long)\b/i.test(text))) {
    if (!active) return out({ text: T.none, buttons: menu(T, false) });
    const info = await getTicket(env, active.id);
    return out({ text: T.statusMsg(info.ticket, info.branch, ticketLink(base, active)), buttons: menu(T, true).slice(0, 2) });
  }
  if (id === 'tk:cancel' || (!id && active && /\b(cancel|batal|batalkan)\b/i.test(text))) {
    if (active) await act(env, active.branch, active.id, 'cancel');
    return out({ text: active ? T.cancelled : T.none, buttons: menu(T, false) });
  }
  if (id === 'menu:prices') { await saveConv(env, channel, user, c); return out({ text: T.priceList(), buttons: menu(T, !!active) }); }
  if (id === 'menu:hours') { await saveConv(env, channel, user, c); return out({ text: T.hoursList(), buttons: menu(T, !!active) }); }

  // 2) First hello, or anything else: let the AI answer from Gentology's facts, then show the menu.
  if (!text || /^(hi|hai|halo|hallo|hello|hey|p|pagi|siang|sore|malam|bang|kak|min)\b[!. ]*$/i.test(text)) {
    c.step = null; await saveConv(env, channel, user, c);
    return out({ text: T.hello(profileName), buttons: menu(T, !!active) });
  }
  let answer = null;
  try {
    const r = await aiReply(gentology, c.history, env);
    answer = r.text;
  } catch {}
  c.history.push({ role: 'assistant', text: answer || '' });
  c.step = null; await saveConv(env, channel, user, c);
  return out({ text: answer || T.hello(profileName), buttons: menu(T, !!active) });
}

// After staff actions: tell customers it's nearly their turn, thank them after the cut.
export async function notifyAfterChange(env, branchKey, changed) {
  const b = branchOf(branchKey);
  const conv = async t => (await loadConv(env, t.channel, t.user));
  if (changed && changed.channel) {
    const L = (await conv(changed)).lang || 'en', T = TX[L];
    if (changed.status === 'done') await send(env, changed.channel, changed.user, { text: T.thanks(changed, changed.visits || 1, reviewLink(b)) });
    if (changed.status === 'noshow') await send(env, changed.channel, changed.user, { text: T.missed(changed), buttons: [{ id: 'menu:join', title: T.join }] });
  }
  for (const t of await dueForAlert(env, branchKey)) {
    const L = (await conv(t)).lang || 'en';
    await send(env, t.channel, t.user, { text: TX[L].soon(t, b) });
  }
}
