import { html, render, useState, useEffect, useRef } from '/vendor/htm-preact.js';

const store = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
const api = async (q, body) => {
  const r = await fetch('/api/queue' + (body ? '' : q), body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {});
  const d = await r.json().catch(() => ({ error: 'server_error' }));
  if (!r.ok || d.error) throw Object.assign(new Error(d.error || 'error'), { code: d.error, status: r.status });
  return d;
};
const mins = ms => Math.max(0, Math.floor(ms / 60000));
const mmss = ms => { const s = Math.max(0, Math.floor(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const hhmm = t => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function Pin({ demo, onDone }) {
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const press = async k => {
    setErr('');
    if (k === 'del') return setPin(p => p.slice(0, -1));
    const next = (pin + k).slice(0, 4);
    setPin(next);
    if (next.length === 4) {
      try { const r = await api('', { action: 'login', pin: next }); onDone(r.role); }
      catch (e) { setErr(e.code === 'locked' ? 'Too many tries. Wait 15 minutes.' : 'Wrong PIN'); setPin(''); }
    }
  };
  useEffect(() => { const f = e => { if (/^\d$/.test(e.key)) press(e.key); if (e.key === 'Backspace') press('del'); }; addEventListener('keydown', f); return () => removeEventListener('keydown', f); }, [pin]);
  return html`<div class="pin"><div class="box">
    <div class="brand"><span class="g">G</span></div>
    <h1>Gentology Queue</h1><p>Enter the branch PIN</p>
    <div class="dots" aria-label=${pin.length + ' of 4 digits'}>${[0, 1, 2, 3].map(i => html`<i class=${i < pin.length ? 'on' : ''}></i>`)}</div>
    <p class="err" role="alert">${err}</p>
    <div class="keys">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map(k => k ? html`<button type="button" onClick=${() => press(k)} aria-label=${k === 'del' ? 'Delete' : k}>${k === 'del' ? '⌫' : k}</button>` : html`<span></span>`)}</div>
    ${demo ? html`<p class="demo">Demo PINs: staff <b>1920</b> · owner <b>2026</b></p>` : null}
  </div></div>`;
}

const L = {
  id: {
    help: ['Kursi kosong? Tekan <b>Panggil berikutnya</b>.', 'Potong selesai? Tekan <b>Selesai</b>.', 'Ada tamu datang langsung? Tekan <b>+ Walk-in</b>.'], gotIt: 'Mengerti',
    waiting: 'menunggu', wait: 'tunggu', none: 'tidak ada antrian', served: 'selesai hari ini', chairs: 'Kursi',
    chair: 'Kursi', free: 'Kosong', callNext: 'Panggil berikutnya', nobody: 'Belum ada yang menunggu', done: 'Selesai',
    queue: 'Antrian', walkin: '+ Walk-in', emptyQ: 'Antrian kosong. Booking WhatsApp masuk ke sini otomatis.', tapRow: 'Tekan nama untuk pilihan lain',
    finished: 'Selesai hari ini', noshow: 'tidak datang', cancelled: 'batal', seatWalk: '+ Walk-in duduk', wa: 'WhatsApp', walk: 'Walk-in',
    seatNow: 'Dudukkan sekarang', notHere: 'Tidak datang', cancel: 'Batalkan antrian', close: 'Tutup',
    newGuest: 'Tamu walk-in', name: 'Nama (boleh kosong)', add: 'Masukkan antrian', giveNo: 'Berikan nomor ini ke tamu', ok: 'Oke',
    undo: 'Batalkan', tSeat: (t, c) => `#${t.no} ${t.name} duduk di kursi ${c}`, tDone: t => `#${t.no} selesai · terima kasih terkirim`,
    tNo: t => `#${t.no} ditandai tidak datang`, tCancel: t => `#${t.no} dibatalkan`, tBack: t => `#${t.no} kembali ke antrian`, err: 'Gagal. Coba lagi.', min: 'mnt', over: 'lewat waktu',
  },
  en: {
    help: ['Chair free? Tap <b>Call next</b>.', 'Cut finished? Tap <b>Done</b>.', 'Someone walked in? Tap <b>+ Walk-in</b>.'], gotIt: 'Got it',
    waiting: 'waiting', wait: 'wait', none: 'no wait', served: 'served today', chairs: 'Chairs',
    chair: 'Chair', free: 'Free', callNext: 'Call next', nobody: 'Nobody waiting yet', done: 'Done',
    queue: 'Queue', walkin: '+ Walk-in', emptyQ: 'Queue is empty. WhatsApp bookings appear here on their own.', tapRow: 'Tap a name for more options',
    finished: 'Finished today', noshow: 'no-show', cancelled: 'cancelled', seatWalk: '+ Seat a walk-in', wa: 'WhatsApp', walk: 'Walk-in',
    seatNow: 'Seat now', notHere: 'Not here', cancel: 'Cancel booking', close: 'Close',
    newGuest: 'Walk-in customer', name: 'Name (optional)', add: 'Add to queue', giveNo: 'Give the customer this number', ok: 'OK',
    undo: 'Undo', tSeat: (t, c) => `#${t.no} ${t.name} is in chair ${c}`, tDone: t => `#${t.no} done · thank-you sent`,
    tNo: t => `#${t.no} marked not here`, tCancel: t => `#${t.no} cancelled`, tBack: t => `#${t.no} back in the queue`, err: 'Didn’t work. Try again.', min: 'min', over: 'over time',
  },
};
const svcOf = k => (window.__services || []).find(s => s.key === k) || { name: k, mins: 35 };

function WalkIn({ services, close, add, t }) {
  const [name, setName] = useState('');
  const [svc, setSvc] = useState('signature');
  return html`<div class="modal-bg" onClick=${e => e.target === e.currentTarget && close()}>
    <form class="modal" role="dialog" aria-label=${t.newGuest} onSubmit=${e => { e.preventDefault(); add(name.trim(), svc); }}>
      <h3>${t.newGuest}</h3>
      <div class="chips big">${services.map(s => html`<button type="button" class=${'chip' + (svc === s.key ? ' on' : '')} onClick=${() => setSvc(s.key)}>${s.name}<small>${s.mins} ${t.min}</small></button>`)}</div>
      <input value=${name} onInput=${e => setName(e.target.value)} placeholder=${t.name} maxlength="40" aria-label=${t.name} />
      <div class="row"><button type="button" class="btn" onClick=${close}>${t.close}</button><button class="btn go lg" type="submit">${t.add}</button></div>
    </form></div>`;
}

function Issued({ ticket, close, t }) {
  return html`<div class="modal-bg" onClick=${close}><div class="modal issued" role="dialog">
    <p>${t.giveNo}</p><div class="bigno">${ticket.no}</div><b>${ticket.name}</b><span>${svcOf(ticket.service).name}</span>
    <button class="btn go lg" type="button" onClick=${close}>${t.ok}</button></div></div>`;
}

function Sheet({ tk, close, act, t }) {
  return html`<div class="modal-bg" onClick=${e => e.target === e.currentTarget && close()}><div class="modal sheet" role="dialog" aria-label=${'#' + tk.no}>
    <div class="who-big"><span class="no">${tk.no}</span><div><b>${tk.name}</b><span>${svcOf(tk.service).name} · ${tk.source === 'walkin' ? t.walk : t.wa}</span></div></div>
    <button class="btn go lg" type="button" onClick=${() => act(tk, 'start')}>${t.seatNow}</button>
    <button class="btn lg warn" type="button" onClick=${() => act(tk, 'noshow')}>${t.notHere}</button>
    <button class="btn lg warn" type="button" onClick=${() => act(tk, 'cancel')}>${t.cancel}</button>
    <button class="btn lg" type="button" onClick=${close}>${t.close}</button>
  </div></div>`;
}

function Board({ bd, t, hide, onAct, onWalkIn, onBarbers, onRow }) {
  const [, tick] = useState(0);
  const [help, setHelp] = useState(store.get('gq-help') !== '0');
  useEffect(() => { const x = setInterval(() => tick(n => n + 1), 1000); return () => clearInterval(x); }, []);
  const vis = bd.tickets.filter(x => x.id !== hide);
  const waiting = vis.filter(x => x.status === 'waiting');
  const inChair = vis.filter(x => x.status === 'chair');
  const finished = bd.tickets.filter(x => ['done', 'noshow', 'cancelled'].includes(x.status)).sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));
  // chair tiles: numbered seats first, then any older ticket without a seat number
  const n = Math.max(bd.barbers, inChair.length);
  const seats = Array.from({ length: n }, (_, i) => inChair.find(x => x.chair === i + 1) || null);
  inChair.filter(x => !seats.includes(x)).forEach(x => { const i = seats.indexOf(null); if (i >= 0) seats[i] = x; });
  const next = waiting[0];
  return html`
    ${help ? html`<section class="help"><ol>${t.help.map(h => html`<li dangerouslySetInnerHTML=${{ __html: h }}></li>`)}</ol><button class="btn" type="button" onClick=${() => { setHelp(false); store.set('gq-help', '0'); }}>${t.gotIt}</button></section>` : null}
    <section class="sum"><span><b>${waiting.length}</b> ${t.waiting}</span><span><b>${bd.stats.nextWait ? '~' + bd.stats.nextWait : '0'} ${t.min}</b> ${t.wait}</span><span><b>${bd.stats.done}</b> ${t.served}</span>
      <span class="grow"></span><span class="step">${t.chairs}<button type="button" onClick=${() => onBarbers(bd.barbers - 1)} aria-label="−">−</button><b>${bd.barbers}</b><button type="button" onClick=${() => onBarbers(bd.barbers + 1)} aria-label="+">+</button></span></section>
    <section class="seats" aria-label=${t.chairs}>${seats.map((tk, i) => {
      if (tk) { const el = Date.now() - (tk.startAt || Date.now()), over = mins(el) > svcOf(tk.service).mins;
        return html`<article class="seat busy"><header>${t.chair} ${i + 1}<span class=${'timer' + (over ? ' over' : '')}>${mmss(el)}${over ? ' · ' + t.over : ''}</span></header>
          <div class="who-big"><span class="no">${tk.no}</span><div><b>${tk.name}</b><span>${svcOf(tk.service).name}</span></div></div>
          <button class="btn done lg" type="button" onClick=${() => onAct(tk, 'done')}>✓ ${t.done}</button></article>`; }
      return html`<article class="seat"><header>${t.chair} ${i + 1}<span>${t.free}</span></header>
        ${next ? html`<button class="btn go xl" type="button" onClick=${() => onAct(next, 'start')}>${t.callNext}<small>#${next.no} ${next.name}</small></button>` : html`<button class="btn xl seatwalk" type="button" onClick=${() => onWalkIn(true)}>${t.seatWalk}<small>${t.nobody}</small></button>`}</article>`;
    })}</section>
    <section class="queue">
      <h2>${t.queue} <span class="n">${waiting.length}</span><span class="grow"></span><button class="add" type="button" onClick=${() => onWalkIn(false)}>${t.walkin}</button></h2>
      ${waiting.length ? html`<p class="hint">${t.tapRow}</p>${waiting.map((x, i) => html`<button type="button" class=${'qrow' + (i === 0 ? ' first' : '')} onClick=${() => onRow(x)}>
          <span class="no">${x.no}</span><span class="who"><b>${x.name}</b><span>${svcOf(x.service).name} · <span class=${'src' + (x.source === 'walkin' ? ' walk' : '')}>${x.source === 'walkin' ? t.walk : t.wa}</span></span></span>
          <span class="eta">${x.waitMins > 0 ? '~' + x.waitMins + ' ' + t.min : '→'}</span></button>`)}` : html`<p class="empty">${t.emptyQ}</p>`}
    </section>
    <details class="fin"><summary>${t.finished} (${finished.length})</summary><div class="donelist">${finished.slice(0, 40).map(x => html`<div><span class="k">${x.no}</span><span>${x.name}</span><span class=${'s' + (x.status === 'done' ? '' : ' ns')}>${x.status === 'done' ? hhmm(x.doneAt) : x.status === 'noshow' ? t.noshow : t.cancelled}</span></div>`)}</div></details>`;
}


const TOUR = {
  id: [
    [null, 'Selamat datang 👋', 'Layar ini menggantikan buku antrian. Kamu cukup pakai 3 tombol. Panduan ini cuma 1 menit.'],
    ['.seat', 'Ini kursi barber', 'Satu kotak untuk setiap kursi. Abu-abu artinya kosong, hijau artinya ada pelanggan sedang dipotong.'],
    ['.seat .btn.xl, .seat', '1. Kursi kosong? Panggil berikutnya', 'Tekan tombol emas ini. Pelanggan nomor berikutnya langsung duduk di kursi ini. Panggil nomornya dengan suara.'],
    ['.seat.busy .btn.done, .seat', '2. Potong selesai? Tekan Selesai', 'Tekan tombol hijau saat potong rambut selesai. Pelanggan otomatis dapat ucapan terima kasih dan link review di WhatsApp. Timer jadi oranye kalau lewat waktu.'],
    ['.queue', 'Antrian', 'Booking dari WhatsApp masuk ke sini sendiri, kamu tidak perlu mencatat apa pun. Nomor paling atas yang dipanggil berikutnya.'],
    ['.queue .add', '3. Tamu datang langsung? + Walk-in', 'Tekan ini, pilih layanan, nama boleh kosong. Nomor besar muncul: sebutkan nomornya ke tamu.'],
    ['.qrow, .queue', 'Pilihan lain', 'Tekan nama di antrian untuk: dudukkan duluan, tandai tidak datang, atau batalkan antrian.'],
    [null, 'Salah tekan? Tenang', 'Setelah menekan, muncul tombol <b>Batalkan</b> di bawah selama 5 detik. WhatsApp ke pelanggan baru terkirim setelah itu, jadi salah tekan tidak pernah sampai ke pelanggan.'],
    ['.sum .step', 'Jumlah kursi', 'Ubah hanya kalau ada barber masuk atau pulang. Waktu tunggu dihitung dari angka ini.'],
    ['.tour-btn', 'Selesai!', 'Lupa caranya? Tekan <b>Panduan</b> di atas kapan saja untuk melihat ini lagi.'],
  ],
  en: [
    [null, 'Welcome 👋', 'This screen replaces the paper queue book. You only need 3 buttons. This guide takes 1 minute.'],
    ['.seat', 'These are the barber chairs', 'One box per chair. Grey means free, green means someone is getting a cut.'],
    ['.seat .btn.xl, .seat', '1. Chair free? Call next', 'Tap this gold button. The next customer is seated in this chair right away. Call their number out loud.'],
    ['.seat.busy .btn.done, .seat', '2. Cut finished? Tap Done', 'Tap the green button when the cut is finished. The customer automatically gets a thank-you and a review link on WhatsApp. The timer turns orange if a cut runs long.'],
    ['.queue', 'The queue', 'WhatsApp bookings appear here on their own, you never write anything down. The top number is called next.'],
    ['.queue .add', '3. Someone walked in? + Walk-in', 'Tap this, pick the service, the name is optional. A big number appears: tell the customer their number.'],
    ['.qrow, .queue', 'More options', 'Tap a name in the queue to seat them first, mark them as not here, or cancel their spot.'],
    [null, 'Wrong tap? No problem', 'After a tap, an <b>Undo</b> button shows at the bottom for 5 seconds. The customer’s WhatsApp is only sent after that, so a wrong tap never reaches them.'],
    ['.sum .step', 'Number of chairs', 'Only change this when a barber starts or ends a shift. Waiting times are worked out from it.'],
    ['.tour-btn', 'All done!', 'Forgot something? Tap <b>Guide</b> at the top any time to see this again.'],
  ],
};

const pick = sel => sel && sel.split(',').map(x => document.querySelector(x.trim())).find(Boolean);
function Tour({ lang, close }) {
  const steps = TOUR[lang];
  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null);
  const [sel, title, body] = steps[i];
  useEffect(() => {
    const place = () => {
      const el = pick(sel);
      if (!el) return setRect(null);
      const r = el.getBoundingClientRect();
      setRect({ x: r.left - 8, y: r.top - 8, w: r.width + 16, h: r.height + 16 });
    };
    const el = pick(sel);
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    place(); const t = setTimeout(place, 450);
    addEventListener('resize', place); addEventListener('scroll', place, true);
    return () => { clearTimeout(t); removeEventListener('resize', place); removeEventListener('scroll', place, true); };
  }, [i]);
  useEffect(() => { const f = e => { if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); }; addEventListener('keydown', f); return () => removeEventListener('keydown', f); });
  const go = d => { const n = i + d; if (n >= steps.length) return close(); if (n >= 0) setI(n); };
  const vh = innerHeight, below = rect && rect.y + rect.h + 230 < vh;
  const cardStyle = !rect ? 'top:50%;left:50%;transform:translate(-50%,-50%)'
    : innerWidth < 640 ? `left:12px;right:12px;${below ? 'top:' + (rect.y + rect.h + 12) : 'bottom:' + (vh - rect.y + 12)}px`
    : `left:${Math.min(Math.max(12, rect.x), innerWidth - 392)}px;${below ? 'top:' + (rect.y + rect.h + 12) : 'top:' + Math.max(12, rect.y - 232)}px`;
  const last = i === steps.length - 1;
  return html`<div class="tour" role="dialog" aria-modal="true" aria-label=${title}>
    ${rect ? html`<div class="spot" style=${`left:${rect.x}px;top:${rect.y}px;width:${rect.w}px;height:${rect.h}px`}></div>` : html`<div class="dim"></div>`}
    <div class="tcard" style=${cardStyle}>
      <div class="tprog">${steps.map((_, k) => html`<i class=${k <= i ? 'on' : ''}></i>`)}</div>
      <h3>${title}</h3>
      <p dangerouslySetInnerHTML=${{ __html: body }}></p>
      <div class="trow">
        <button type="button" class="ghost" onClick=${close}>${lang === 'id' ? 'Lewati' : 'Skip'}</button>
        <span class="grow"></span>
        ${i > 0 ? html`<button type="button" class="btn" onClick=${() => go(-1)}>${lang === 'id' ? 'Kembali' : 'Back'}</button>` : null}
        <button type="button" class="btn go" onClick=${() => go(1)}>${last ? (lang === 'id' ? 'Mulai kerja' : 'Start working') : (lang === 'id' ? 'Lanjut' : 'Next')} (${i + 1}/${steps.length})</button>
      </div>
    </div>
  </div>`;
}

function Owner({ boards, open }) {
  return html`<div class="branches">${boards.map(bd => {
    const total = bd.stats.done + bd.stats.waiting + bd.stats.chair || 1;
    return html`<button class="bcard" type="button" onClick=${() => open(bd.branch.key)}>
      <h3>${bd.branch.name}</h3>
      <div class="row"><div><b>${bd.stats.waiting}</b><span>waiting</span></div><div><b>${bd.stats.chair}/${bd.barbers}</b><span>in chairs</span></div><div><b>${bd.stats.done}</b><span>served today</span></div></div>
      <div class="bar" aria-hidden="true"><span style=${`width:${bd.stats.done / total * 100}%;background:var(--green)`}></span><span style=${`width:${bd.stats.chair / total * 100}%;background:var(--gold)`}></span><span style=${`width:${bd.stats.waiting / total * 100}%;background:var(--line)`}></span></div>
      <div class="serving">Now serving ${bd.tickets.filter(t => t.status === 'chair').map(t => html`<i>${t.no}</i>`)}${!bd.stats.chair ? ' nobody' : ''} · ${bd.stats.nextWait ? 'new customer waits ~' + bd.stats.nextWait + ' min' : 'no wait for new customers'}</div>
      <div class="serving">Reviews today: ${bd.reviews?.count || 0} rated${bd.reviews?.avg ? ' · avg ' + bd.reviews.avg + ' ★' : ''} · ${bd.reviews?.posted || 0} sent to Google</div>
      <div class="serving">${bd.stats.whatsapp} via WhatsApp · ${bd.stats.walkin} walk-in · ${bd.stats.noshow} no-show${bd.stats.avgCut ? ' · avg cut ' + bd.stats.avgCut + ' min' : ''}</div>
    </button>`;
  })}</div>`;
}

function App() {
  const [me, setMe] = useState(null);
  const [role, setRole] = useState(null);
  const [view, setView] = useState(store.get('gq-branch') || 'cideng');
  const [bd, setBd] = useState(null);
  const [all, setAll] = useState(null);
  const [walk, setWalk] = useState(false);
  const [lang, setLang] = useState(store.get('gq-staff-lang') || 'id');
  const [row, setRow] = useState(null);
  const [issued, setIssued] = useState(null);
  const [pend, setPend] = useState(null);
  const [tour, setTour] = useState(false);
  const t = L[lang];
  const [msg, setMsg] = useState('');
  const [now, setNow] = useState(Date.now());
  const toastT = useRef();
  const toast = (text, undo) => { setMsg({ text, undo }); clearTimeout(toastT.current); toastT.current = setTimeout(() => setMsg(''), undo ? 5000 : 2400); };

  useEffect(() => { api('?action=me').then(d => { setMe(d); window.__services = d.services; setRole(d.role); }).catch(() => setMe({ demo: false, branches: [] })); }, []);
  const refresh = async () => {
    try {
      if (view === 'all') setAll((await api('?action=all')).boards);
      else setBd(await api('?action=board&branch=' + view));
    } catch (e) { if (e.status === 401) setRole(null); }
  };
  useEffect(() => { if (!role) return; refresh(); const t = setInterval(refresh, 3000); return () => clearInterval(t); }, [role, view]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 15000); return () => clearInterval(t); }, []);
  useEffect(() => { if (role && bd && view !== 'all' && store.get('gq-tour') !== '1') setTour(true); }, [role, !!bd]);
  const endTour = () => { setTour(false); store.set('gq-tour', '1'); store.set('gq-help', '0'); };

  if (!me) return html`<p class="empty">Loading…</p>`;
  if (!role) return html`<${Pin} demo=${me.demo} onDone=${r => setRole(r)} />`;

  const go = v => { setView(v); store.set('gq-branch', v); setBd(null); };
  const post = async (body, okMsg, undo) => { try { const r = await api('', { branch: view, ...body }); if (r.board) setBd(r.board); if (okMsg) toast(okMsg, undo); return r; } catch (e) { toast(e.code === 'owner_only' ? 'Owner only' : t.err); refresh(); } };
  // Seating is instant (undo moves them back). Done / not here / cancel wait 5 seconds so a wrong tap can be undone before any WhatsApp goes out.
  const commit = p => { clearTimeout(p.timer); setPend(null); post({ action: 'ticket', id: p.tk.id, op: p.op }); };
  const onAct = (tk, op) => {
    setRow(null);
    if (pend) commit(pend);
    if (op === 'start') {
      const used = new Set((bd?.tickets || []).filter(x => x.status === 'chair' && x.chair).map(x => x.chair)); let c = 1; while (used.has(c)) c++;
      post({ action: 'ticket', id: tk.id, op }, t.tSeat(tk, c), () => post({ action: 'ticket', id: tk.id, op: 'back' }, t.tBack(tk)));
      return;
    }
    const p = { tk, op };
    p.timer = setTimeout(() => commit(p), 5000);
    setPend(p);
    toast(op === 'done' ? t.tDone(tk) : op === 'noshow' ? t.tNo(tk) : t.tCancel(tk), () => { clearTimeout(p.timer); setPend(null); });
  };
  const flip = () => { const l = lang === 'id' ? 'en' : 'id'; setLang(l); store.set('gq-staff-lang', l); };

  return html`
    <header class="top">
      <div class="brand"><span class="g">G</span><div><b>Gentology</b><small>Queue · ${role === 'owner' ? 'Owner' : 'Staff'}</small></div></div>
      <nav class="tabs" aria-label="Branch">
        ${me.branches.map(b => html`<button type="button" class=${view === b.key ? 'on' : ''} onClick=${() => go(b.key)}>${b.name}</button>`)}
        ${role === 'owner' ? html`<button type="button" class=${view === 'all' ? 'on' : ''} onClick=${() => go('all')}>All branches</button>` : null}
      </nav>
      <span class="grow"></span>
      <span class="clock">${new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      ${role === 'owner' && view !== 'all' && me.demo ? html`<button class="ghost" type="button" onClick=${() => post({ action: 'reset' }, 'Today’s queue cleared')}>Reset demo</button>` : null}
      ${view !== 'all' ? html`<button class="ghost tour-btn" type="button" onClick=${() => setTour(true)}>? ${lang === 'id' ? 'Panduan' : 'Guide'}</button>` : null}
      <button class="ghost" type="button" onClick=${flip}>${lang === 'id' ? 'EN' : 'ID'}</button>
      <button class="ghost" type="button" onClick=${async () => { await api('', { action: 'logout' }).catch(() => {}); setRole(null); }}>${lang === 'id' ? 'Kunci' : 'Lock'}</button>
    </header>
    <main class="main">
      ${view === 'all' ? (all ? html`<${Owner} boards=${all} open=${go} />` : html`<p class="empty">Loading…</p>`)
        : bd ? html`<${Board} bd=${bd} t=${t} hide=${pend?.tk.id} onAct=${onAct} onRow=${setRow} onWalkIn=${seat => setWalk(seat ? 'seat' : 'queue')} onBarbers=${n => post({ action: 'barbers', n })} />` : html`<p class="empty">Loading…</p>`}
    </main>
    ${walk ? html`<${WalkIn} t=${t} services=${me.services} close=${() => setWalk(false)} add=${async (name, service) => { setWalk(false); const r = await post({ action: 'walkin', name: name || (lang === 'id' ? 'Tamu' : 'Guest'), service }); if (!r?.ticket) return; if (walk === 'seat') onAct(r.ticket, 'start'); else setIssued(r.ticket); }} />` : null}
    ${row ? html`<${Sheet} t=${t} tk=${row} close=${() => setRow(null)} act=${onAct} />` : null}
    ${issued ? html`<${Issued} t=${t} ticket=${issued} close=${() => setIssued(null)} />` : null}
    ${tour && bd && view !== 'all' ? html`<${Tour} lang=${lang} close=${endTour} />` : null}
    ${msg ? html`<div class="toast" role="status"><span>${msg.text}</span>${msg.undo ? html`<button type="button" onClick=${() => { const u = msg.undo; setMsg(''); u(); }}>${t.undo}</button>` : null}</div>` : null}`;
}

render(html`<${App} />`, document.getElementById('root'));
