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

function WalkIn({ services, close, add }) {
  const [name, setName] = useState('');
  const [svc, setSvc] = useState('signature');
  const ref = useRef();
  useEffect(() => ref.current?.focus(), []);
  return html`<div class="modal-bg" onClick=${e => e.target === e.currentTarget && close()}>
    <form class="modal" role="dialog" aria-label="Add a walk-in" onSubmit=${e => { e.preventDefault(); add(name, svc); }}>
      <h3>Walk-in customer</h3>
      <input ref=${ref} value=${name} onInput=${e => setName(e.target.value)} placeholder="Name" maxlength="40" aria-label="Name" />
      <div class="chips">${services.map(s => html`<button type="button" class=${'chip' + (svc === s.key ? ' on' : '')} onClick=${() => setSvc(s.key)}>${s.name}<small>${s.mins} min</small></button>`)}</div>
      <div class="row"><button type="button" class="btn" onClick=${close}>Cancel</button><button class="btn go" type="submit">Add to queue</button></div>
    </form></div>`;
}

function Board({ bd, onAct, onWalkIn, onBarbers }) {
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick(x => x + 1), 1000); return () => clearInterval(t); }, []);
  const waiting = bd.tickets.filter(t => t.status === 'waiting');
  const chair = bd.tickets.filter(t => t.status === 'chair');
  const finished = bd.tickets.filter(t => ['done', 'noshow', 'cancelled'].includes(t.status)).sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));
  const full = chair.length >= bd.barbers;
  const svc = k => (window.__services || []).find(s => s.key === k) || { name: k, mins: 35 };
  return html`
    <section class="strip" aria-label="Today at a glance">
      <div class="stat"><b>${bd.stats.waiting}</b><span>waiting</span></div>
      <div class="stat"><b>${bd.stats.chair} / ${bd.barbers}</b><span>chairs busy</span></div>
      <div class="stat"><b>${bd.stats.nextWait ? '~' + bd.stats.nextWait + 'm' : 'Now'}</b><span>wait for a new customer</span></div>
      <div class="stat"><b>${bd.stats.done}</b><span>served today</span></div>
      <div class="stat"><b>${bd.stats.whatsapp}<span style="font-size:18px;color:var(--mute)"> / ${bd.stats.walkin}</span></b><span>WhatsApp / walk-in</span></div>
      <div class="stat barbers"><span>Barbers on shift</span><div class="step"><button type="button" onClick=${() => onBarbers(bd.barbers - 1)} aria-label="One fewer barber">−</button><b class="serif" style="font-size:28px">${bd.barbers}</b><button type="button" onClick=${() => onBarbers(bd.barbers + 1)} aria-label="One more barber">+</button></div></div>
    </section>
    <div class="cols">
      <section class="col" aria-label="Waiting">
        <h2>Waiting <span class="n">${waiting.length}</span><span class="grow"></span><button class="add" type="button" onClick=${onWalkIn}>+ Walk-in</button></h2>
        ${waiting.length ? waiting.map((t, i) => html`<article class=${'card' + (i === 0 ? ' first' : '')}>
          <div class="no">${t.no}</div>
          <div class="who"><b>${t.name}</b><span>${svc(t.service).name} · <span class=${'src' + (t.source === 'walkin' ? ' walk' : '')}>${t.source === 'walkin' ? 'Walk-in' : 'WhatsApp'}</span> · ${t.waitMins > 0 ? '~' + t.waitMins + ' min' : (full ? 'next' : 'chair free')}</span></div>
          <div class="acts"><button class="btn warn" type="button" onClick=${() => onAct(t, 'noshow')} title="Called but not here">No-show</button><button class="btn go" type="button" onClick=${() => onAct(t, 'start')}>Start</button></div>
        </article>`) : html`<p class="empty">Nobody waiting. New WhatsApp bookings appear here on their own.</p>`}
      </section>
      <section class="col" aria-label="In the chair">
        <h2>In the chair <span class="n">${chair.length} / ${bd.barbers}</span></h2>
        ${chair.length ? chair.map(t => { const el = Date.now() - (t.startAt || Date.now()), over = mins(el) > svc(t.service).mins; return html`<article class="card">
          <div class="no">${t.no}</div>
          <div class="who"><b>${t.name}</b><span>${svc(t.service).name} · <span class=${'timer' + (over ? ' over' : '')}>${mmss(el)}</span></span></div>
          <div class="acts"><button class="btn" type="button" onClick=${() => onAct(t, 'back')} title="Move back to waiting">↩</button><button class="btn done" type="button" onClick=${() => onAct(t, 'done')}>Done</button></div>
        </article>`; }) : html`<p class="empty">All chairs are free.</p>`}
      </section>
      <section class="col" aria-label="Finished today">
        <h2>Finished today <span class="n">${finished.length}</span></h2>
        ${finished.length ? html`<div class="donelist">${finished.slice(0, 30).map(t => html`<div><span class="k">${t.no}</span><span>${t.name}</span><span class=${'s' + (t.status === 'done' ? '' : ' ns')}>${t.status === 'done' ? 'done ' + hhmm(t.doneAt) : t.status === 'noshow' ? 'no-show' : 'cancelled'}</span></div>`)}</div>` : html`<p class="empty">No finished cuts yet today.</p>`}
      </section>
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
  const [msg, setMsg] = useState('');
  const [now, setNow] = useState(Date.now());
  const toastT = useRef();
  const toast = t => { setMsg(t); clearTimeout(toastT.current); toastT.current = setTimeout(() => setMsg(''), 2200); };

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
  const post = async (body, okMsg) => { try { const r = await api('', { branch: view, ...body }); if (r.board) setBd(r.board); if (okMsg) toast(okMsg); } catch (e) { toast(e.code === 'owner_only' ? 'Only the owner can do that' : 'Didn’t work. Try again.'); refresh(); } };
  const onAct = (t, op) => post({ action: 'ticket', id: t.id, op }, { start: `#${t.no} ${t.name} is in the chair`, done: `#${t.no} done. Thank-you sent`, noshow: `#${t.no} marked no-show`, back: `#${t.no} back to waiting` }[op]);

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
      <button class="ghost" type="button" onClick=${async () => { await api('', { action: 'logout' }).catch(() => {}); setRole(null); }}>Lock</button>
    </header>
    <main class="main">
      ${view === 'all' ? (all ? html`<${Owner} boards=${all} open=${go} />` : html`<p class="empty">Loading…</p>`)
        : bd ? html`<${Board} bd=${bd} onAct=${onAct} onWalkIn=${() => setWalk(true)} onBarbers=${n => post({ action: 'barbers', n })} />` : html`<p class="empty">Loading…</p>`}
    </main>
    ${walk ? html`<${WalkIn} services=${me.services} close=${() => setWalk(false)} add=${async (name, service) => { setWalk(false); await post({ action: 'walkin', name, service }, 'Added to the queue'); }} />` : null}
    ${msg ? html`<div class="toast" role="status">${msg}</div>` : null}`;
}

render(html`<${App} />`, document.getElementById('root'));
