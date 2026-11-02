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
    finished: 'Selesai hari ini', noshow: 'tidak datang', cancelled: 'batal', wa: 'WhatsApp', walk: 'Walk-in',
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
    finished: 'Finished today', noshow: 'no-show', cancelled: 'cancelled', wa: 'WhatsApp', walk: 'Walk-in',
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
    <section class="sum"><span><b>${waiting.length}</b> ${t.waiting}</span><span><b>${bd.stats.nextWait ? '~' + bd.stats.nextWait + ' ' + t.min : '0'}</b> ${bd.stats.nextWait ? t.wait : t.none}</span><span><b>${bd.stats.done}</b> ${t.served}</span>
      <span class="grow"></span><span class="step">${t.chairs}<button type="button" onClick=${() => onBarbers(bd.barbers - 1)} aria-label="−">−</button><b>${bd.barbers}</b><button type="button" onClick=${() => onBarbers(bd.barbers + 1)} aria-label="+">+</button></span></section>
    <section class="seats" aria-label=${t.chairs}>${seats.map((tk, i) => {
      if (tk) { const el = Date.now() - (tk.startAt || Date.now()), over = mins(el) > svcOf(tk.service).mins;
        return html`<article class="seat busy"><header>${t.chair} ${i + 1}<span class=${'timer' + (over ? ' over' : '')}>${mmss(el)}${over ? ' · ' + t.over : ''}</span></header>
          <div class="who-big"><span class="no">${tk.no}</span><div><b>${tk.name}</b><span>${svcOf(tk.service).name}</span></div></div>
          <button class="btn done lg" type="button" onClick=${() => onAct(tk, 'done')}>✓ ${t.done}</button></article>`; }
      return html`<article class="seat"><header>${t.chair} ${i + 1}<span>${t.free}</span></header>
        ${next ? html`<button class="btn go xl" type="button" onClick=${() => onAct(next, 'start')}>${t.callNext}<small>#${next.no} ${next.name}</small></button>` : html`<p class="empty">${t.nobody}</p>`}</article>`;
    })}</section>
    <section class="queue">
      <h2>${t.queue} <span class="n">${waiting.length}</span><span class="grow"></span><button class="add" type="button" onClick=${onWalkIn}>${t.walkin}</button></h2>
      ${waiting.length ? html`<p class="hint">${t.tapRow}</p>${waiting.map((x, i) => html`<button type="button" class=${'qrow' + (i === 0 ? ' first' : '')} onClick=${() => onRow(x)}>
          <span class="no">${x.no}</span><span class="who"><b>${x.name}</b><span>${svcOf(x.service).name} · <span class=${'src' + (x.source === 'walkin' ? ' walk' : '')}>${x.source === 'walkin' ? t.walk : t.wa}</span></span></span>
          <span class="eta">${x.waitMins > 0 ? '~' + x.waitMins + ' ' + t.min : '→'}</span></button>`)}` : html`<p class="empty">${t.emptyQ}</p>`}
    </section>
    <details class="fin"><summary>${t.finished} (${finished.length})</summary><div class="donelist">${finished.slice(0, 40).map(x => html`<div><span class="k">${x.no}</span><span>${x.name}</span><span class=${'s' + (x.status === 'done' ? '' : ' ns')}>${x.status === 'done' ? hhmm(x.doneAt) : x.status === 'noshow' ? t.noshow : t.cancelled}</span></div>`)}</div></details>`;
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
      <button class="ghost" type="button" onClick=${flip}>${lang === 'id' ? 'EN' : 'ID'}</button>
      <button class="ghost" type="button" onClick=${async () => { await api('', { action: 'logout' }).catch(() => {}); setRole(null); }}>${lang === 'id' ? 'Kunci' : 'Lock'}</button>
    </header>
    <main class="main">
      ${view === 'all' ? (all ? html`<${Owner} boards=${all} open=${go} />` : html`<p class="empty">Loading…</p>`)
        : bd ? html`<${Board} bd=${bd} t=${t} hide=${pend?.tk.id} onAct=${onAct} onRow=${setRow} onWalkIn=${() => setWalk(true)} onBarbers=${n => post({ action: 'barbers', n })} />` : html`<p class="empty">Loading…</p>`}
    </main>
    ${walk ? html`<${WalkIn} t=${t} services=${me.services} close=${() => setWalk(false)} add=${async (name, service) => { setWalk(false); const r = await post({ action: 'walkin', name: name || (lang === 'id' ? 'Tamu' : 'Guest'), service }); if (r?.ticket) setIssued(r.ticket); }} />` : null}
    ${row ? html`<${Sheet} t=${t} tk=${row} close=${() => setRow(null)} act=${onAct} />` : null}
    ${issued ? html`<${Issued} t=${t} ticket=${issued} close=${() => setIssued(null)} />` : null}
    ${msg ? html`<div class="toast" role="status"><span>${msg.text}</span>${msg.undo ? html`<button type="button" onClick=${() => { const u = msg.undo; setMsg(''); u(); }}>${t.undo}</button>` : null}</div>` : null}`;
}

render(html`<${App} />`, document.getElementById('root'));
