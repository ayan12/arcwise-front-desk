import { html, render, useState, useEffect, useRef, useCallback } from '/vendor/htm-preact.js';

/* ---------- helpers ---------- */
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} },
};
const DAY = 86400000;
const ago = t => {
  if (!t) return 'never';
  const s = (Date.now() - t) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  if (s < 86400 * 30) return Math.floor(s / 86400) + 'd ago';
  return new Date(t).toLocaleDateString();
};
const dateStr = t => t ? new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '–';
function money(n, cur) {
  if (n == null) return '–';
  if (cur === 'IDR') {
    if (n >= 1e9) return 'Rp ' + +(n / 1e9).toFixed(1) + ' M';
    if (n >= 1e6) return 'Rp ' + +(n / 1e6).toFixed(1) + ' jt';
    return 'Rp ' + n.toLocaleString('id-ID');
  }
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n); } catch (e) { return cur + ' ' + n; }
}
const sumBy = (list, f) => { const m = {}; list.forEach(x => { const v = f(x); if (v != null && v > 0) m[x.currency] = (m[x.currency] || 0) + v; }); return m; };
const fmtSums = m => { const k = Object.keys(m).sort((a, b) => (a === 'IDR' ? -1 : b === 'IDR' ? 1 : 0)); return k.length ? k.map(c => money(m[c], c)).join(' · ') : '–'; };
const grade = v => v == null ? 'muted' : v >= 90 ? 'g' : v >= 50 ? 'm' : 'p';
const waLink = n => {
  let d = String(n || '').replace(/[^\d+]/g, '');
  if (!d) return null;
  if (d.startsWith('+')) d = d.slice(1); else if (d.startsWith('0')) d = '62' + d.slice(1);
  return 'https://wa.me/' + d.replace(/\D/g, '');
};
const PAYING = ['Won', 'Building', 'Live'];
const OPEN = ['Lead', 'Concept', 'Pitched'];

/* ---------- icons ---------- */
const P = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  users: 'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 19v-1a4 4 0 0 0-3-3.9M16 2.1a4 4 0 0 1 0 7.8',
  globe: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20',
  link: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
  chat: 'M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z',
  pulse: 'M3 12h4l3-8 4 16 3-8h4',
  plus: 'M12 5v14M5 12h14',
  refresh: 'M21 12a9 9 0 1 1-2.6-6.4L21 8M21 3v5h-5',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  x: 'M6 6l12 12M18 6 6 18',
  ext: 'M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
  trash: 'M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14',
  bolt: 'M13 2 3 14h9l-1 8 10-12h-9z',
  alert: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  check: 'M20 6 9 17l-5-5',
  menu: 'M3 6h18M3 12h18M3 18h18',
  wa: 'M3 21l1.7-5A9 9 0 1 1 8 19.3z',
  note: 'M4 4h16v12H8l-4 4z',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  back: 'M19 12H5M11 18l-6-6 6-6',
  board: 'M4 4h5v16H4zM10 4h5v10h-5zM16 4h4v13h-4z',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z',
};
const I = ({ n, s = 18, w = 1.8 }) => html`<svg width=${s} height=${s} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=${w} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d=${P[n]} /></svg>`;
const Mark = () => html`<span class="mark"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#101217" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M4 18a8 8 0 0 1 16 0"/><circle cx="12" cy="18" r="1.6" fill="#101217" stroke="none"/></svg></span>`;

/* ---------- api ---------- */
function useApi(onSignedOut) {
  return useCallback(async (path, opts = {}) => {
    const r = await fetch('/api/workspace' + path, {
      method: opts.body ? 'POST' : 'GET', credentials: 'same-origin',
      headers: opts.body ? { 'content-type': 'application/json' } : {},
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    if (r.status === 401) { onSignedOut(); throw Object.assign(new Error('signed_out'), { code: 'signed_out' }); }
    const d = await r.json().catch(() => ({ error: 'server_error' }));
    if (!r.ok || d.error) throw Object.assign(new Error(d.error || 'error'), { code: d.error, status: r.status });
    return d;
  }, []);
}
const ERR = {
  wrong_password: 'Wrong password.', locked: 'Too many wrong passwords. Try again in 15 minutes.', signed_out: 'Signed out. Enter your password.', bad_origin: 'Blocked for safety. Open the workstation directly.', no_password_set: 'No password set. Add INBOX_PASSWORD in Vercel, then redeploy.',
  no_store: 'Storage isn’t connected. Add Upstash Redis in Vercel Storage.', bad_url: 'That website address doesn’t look right.',
  name_required: 'Give the client a name.', duplicate_url: 'That website is already in your workspace.', cannot_delete_own: 'Your own agency can’t be deleted.',
  server_error: 'Something went wrong. Try again.',
};
const errText = e => ERR[e.code] || ERR[e.message] || 'Something went wrong. Try again.';

/* ---------- small charts ---------- */
function Spark({ values, color = 'var(--accent)' }) {
  if (!values || values.length < 2 || !values.some(Boolean)) return null;
  const max = Math.max(...values, 1), w = 70, h = 26;
  const pts = values.map((v, i) => [i * (w / (values.length - 1)), h - 2 - (v / max) * (h - 4)]);
  const d = 'M' + pts.map(p => p.map(n => n.toFixed(1)).join(',')).join('L');
  return html`<svg class="spark" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path d=${d + `L${w},${h}L0,${h}Z`} fill=${color} opacity=".12"/><path d=${d} fill="none" stroke=${color} stroke-width="1.6" stroke-linejoin="round"/></svg>`;
}
function Uptime({ history }) {
  if (!history || !history.length) return html`<span class="muted">–</span>`;
  const h = history.slice(-30), w = 90 / 30;
  return html`<svg class="ups" viewBox="0 0 90 20" role="img" aria-label=${'Last ' + h.length + ' checks: ' + h.filter(x => x.s === 'down').length + ' down'}>
    ${h.map((x, i) => html`<rect x=${(30 - h.length + i) * w + .5} y="2" width=${Math.max(w - 1, 1)} height="16" rx="1" fill=${x.s === 'down' ? 'var(--down)' : x.s === 'slow' ? 'var(--slow)' : 'var(--up)'} />`)}
  </svg>`;
}
function Ring({ v, label }) {
  const r = 22, c = 2 * Math.PI * r, col = v == null ? 'var(--line2)' : v >= 90 ? 'var(--up)' : v >= 50 ? 'var(--slow)' : 'var(--down)';
  return html`<div class="ring"><svg width="56" height="56" viewBox="0 0 56 56" role="img" aria-label=${label + ': ' + (v == null ? 'not tested' : v + ' out of 100')}>
    <circle cx="28" cy="28" r=${r} fill="none" stroke="var(--line)" stroke-width="5"/>
    <circle cx="28" cy="28" r=${r} fill="none" stroke=${col} stroke-width="5" stroke-linecap="round" stroke-dasharray=${c} stroke-dashoffset=${v == null ? c : c * (1 - v / 100)} transform="rotate(-90 28 28)"/>
    <text x="28" y="33" text-anchor="middle" font-family="Space Grotesk, sans-serif" font-size="15" font-weight="600" fill="var(--fg)">${v == null ? '–' : v}</text>
  </svg><span>${label}</span></div>`;
}
function ChatChart({ days }) {
  if (!days || !days.length) return null;
  const W = 600, H = 180, pad = 14, max = Math.max(4, ...days.map(d => d.chats));
  const x = i => pad + i * ((W - pad * 2) / (days.length - 1)), y = v => H - pad - (v / max) * (H - pad * 2);
  const line = days.map((d, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(d.chats).toFixed(1)).join('');
  const bw = Math.max(3, (W - pad * 2) / days.length - 8);
  return html`<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label=${'Chats per day for 30 days: ' + days.reduce((n, d) => n + d.chats, 0) + ' chats, ' + days.reduce((n, d) => n + d.leads, 0) + ' leads'}>
    ${[0, .5, 1].map(t => html`<line x1=${pad} x2=${W - pad} y1=${y(max * t)} y2=${y(max * t)} stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/>`)}
    ${days.map((d, i) => d.leads ? html`<rect x=${x(i) - bw / 2} y=${y(d.leads)} width=${bw} height=${H - pad - y(d.leads)} rx="2" fill="var(--up)" opacity=".85"/>` : null)}
    <path d=${line + `L${x(days.length - 1)},${H - pad}L${x(0)},${H - pad}Z`} fill="var(--accent)" opacity=".1"/>
    <path d=${line} fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  </svg>`;
}

/* ---------- derived data ---------- */
function derive(d) {
  const sites = d.sites, clients = d.clients;
  const byClient = Object.fromEntries(clients.map(c => [c.id, c]));
  const siteState = s => s && s.health ? s.health.state : 'none';
  const desks = Object.values(d.desks || {});
  const deskSum = k => desks.reduce((n, x) => n + (x[k] || 0), 0);
  const days = Array.from({ length: 30 }, (_, i) => ({
    chats: desks.reduce((n, x) => n + (x.days[i]?.chats || 0), 0), leads: desks.reduce((n, x) => n + (x.days[i]?.leads || 0), 0),
  }));
  const domainFor = s => d.domains.find(x => x.host === s.host);
  const attention = [];
  sites.forEach(s => {
    const c = byClient[s.clientId], h = s.health;
    if (!h) return;
    if (h.state === 'down') attention.push({ sev: 'high', icon: 'alert', title: `${s.host} is down`, sub: `${c?.name} · ${h.error || 'error ' + h.status}`, go: { type: 'site', id: s.id } });
    else if (h.state === 'slow') attention.push({ sev: 'mid', icon: 'clock', title: `${s.host} is slow`, sub: `${c?.name} · ${h.ms} ms to respond`, go: { type: 'site', id: s.id } });
    if (s.indexable && h.state !== 'down' && !h.indexable) attention.push({ sev: 'high', icon: 'search', title: `${s.host} is hidden from Google`, sub: `${c?.name} · it should be visible`, go: { type: 'site', id: s.id } });
    if (s.indexable && h.seo && h.state !== 'down' && h.seo.passed < 7) attention.push({ sev: 'mid', icon: 'search', title: `SEO setup needs work on ${s.host}`, sub: `${h.seo.passed} of ${h.seo.total} checks pass`, go: { type: 'site', id: s.id } });
    if (s.frontDesk && h.state !== 'down' && !h.frontDeskInstalled && c && PAYING.includes(c.stage)) attention.push({ sev: 'low', icon: 'chat', title: `Front Desk isn’t on ${s.host} yet`, sub: `${c.name} · add the chat script`, go: { type: 'site', id: s.id } });
  });
  d.domains.forEach(x => {
    if (x.kind === 'custom' && x.expires) {
      const left = Math.round((x.expires - Date.now()) / DAY);
      if (left < 45) attention.push({ sev: left < 14 ? 'high' : 'mid', icon: 'link', title: `${x.apex} renews in ${left} days`, sub: x.registrar || 'Check the registrar', go: { type: 'page', id: 'domains' } });
    }
  });
  clients.filter(c => PAYING.includes(c.stage) && !c.internal && !c.sites.some(s => s.frontDesk)).forEach(c =>
    attention.push({ sev: 'low', icon: 'bolt', title: `Offer Front Desk to ${c.name}`, sub: 'Paying client without the AI receptionist: an easy monthly add-on', go: { type: 'client', id: c.id } }));
  clients.filter(c => ['Won', 'Pitched', 'Building'].includes(c.stage) && !c.contact?.whatsapp && !c.contact?.email).forEach(c =>
    attention.push({ sev: 'low', icon: 'users', title: `Add contact details for ${c.name}`, sub: 'No WhatsApp or email saved', go: { type: 'client', id: c.id } }));
  const order = { high: 0, mid: 1, low: 2 };
  attention.sort((a, b) => order[a.sev] - order[b.sev]);
  const live = sites.filter(s => s.health && s.health.state !== 'down');
  return {
    byClient, siteState, domainFor, attention, days,
    up: sites.filter(s => siteState(s) === 'up' || siteState(s) === 'slow').length,
    down: sites.filter(s => siteState(s) === 'down').length,
    avgMs: live.length ? live.reduce((n, s) => n + s.health.ms, 0) / live.length : 0,
    chats7: deskSum('chats7'), chatsPrev7: deskSum('chatsPrev7'), leads7: deskSum('leads7'), leadsPrev7: deskSum('leadsPrev7'),
    chats30: deskSum('chats30'), leads30: deskSum('leads30'),
    expiring: d.domains.filter(x => x.kind === 'custom' && x.expires && x.expires - Date.now() < 45 * DAY).length,
    real: clients.filter(c => !c.internal),
  };
}
const Delta = ({ now, prev }) => {
  if (prev == null) return null;
  const diff = now - prev;
  if (!diff) return html`<span class="delta flat">same as last week</span>`;
  return html`<span class=${'delta ' + (diff > 0 ? 'pos' : 'neg')}>${diff > 0 ? '+' : ''}${diff} vs last week</span>`;
};

/* ---------- pages ---------- */
function Overview({ d, x, go, openSite, openClient }) {
  const real = x.real;
  const open = real.filter(c => OPEN.includes(c.stage)), paying = real.filter(c => PAYING.includes(c.stage));
  const counts = d.stages.filter(s => s !== 'Lost').map(s => ({ s, list: real.filter(c => c.stage === s) }));
  const maxN = Math.max(1, ...counts.map(c => c.list.length));
  const stageColor = { Lead: 'var(--dim)', Concept: 'var(--violet)', Pitched: 'var(--blue)', Won: 'var(--up)', Building: 'var(--slow)', Live: 'var(--accent)' };
  return html`
    <section class="kpis" aria-label="Key numbers">
      <div class="card kpi"><span class="label">Open pipeline</span><span class="num">${fmtSums(sumBy(open, c => c.value))}</span><span class="meta">${open.length} deals in progress</span></div>
      <div class="card kpi"><span class="label">Won revenue</span><span class="num">${fmtSums(sumBy(paying, c => c.value))}</span><span class="meta">${paying.length} paying ${paying.length === 1 ? 'client' : 'clients'}</span></div>
      <div class="card kpi"><span class="label">Monthly recurring</span><span class="num">${fmtSums(sumBy(paying, c => c.monthly))}</span><span class="meta">+ ${fmtSums(sumBy(open, c => c.monthly))} if open deals close</span></div>
      <div class="card kpi"><span class="label">Websites online</span><span class="num">${x.up} / ${d.sites.length}</span><span class="meta">${x.down ? html`<span class="delta neg">${x.down} down</span>` : 'all responding'} · avg ${Math.round(x.avgMs)} ms</span></div>
      <div class="card kpi"><span class="label">Front Desk chats, 7 days</span><span class="num">${x.chats7}</span><span class="meta"><${Delta} now=${x.chats7} prev=${x.chatsPrev7} /></span><${Spark} values=${x.days.slice(-14).map(v => v.chats)} /></div>
      <div class="card kpi"><span class="label">WhatsApp leads, 7 days</span><span class="num">${x.leads7}</span><span class="meta"><${Delta} now=${x.leads7} prev=${x.leadsPrev7} /></span><${Spark} values=${x.days.slice(-14).map(v => v.leads)} color="var(--up)" /></div>
    </section>

    <div class="grid2">
      <section class="card">
        <header><h2>Needs attention</h2><span class="hint">${x.attention.length ? x.attention.length + (x.attention.length === 1 ? ' item' : ' items') : ''}</span></header>
        <div class="body">
          ${x.attention.length ? html`<ul class="att">${x.attention.slice(0, 8).map(a => html`
            <li><span class=${'ic ' + a.sev}><${I} n=${a.icon} s="16" /></span>
              <div><b>${a.title}</b><span class="s">${a.sub}</span></div>
              <button class="btn sm" onClick=${() => a.go.type === 'site' ? openSite(a.go.id) : a.go.type === 'client' ? openClient(a.go.id) : go(a.go.id)}>Open</button></li>`)}</ul>`
          : html`<div class="allclear"><span class="ic good"><${I} n="check" s="16" /></span>All sites are up and nothing needs you right now.</div>`}
        </div>
      </section>
      <section class="card">
        <header><h2>Front Desk, last 30 days</h2><span class="r"><button class="btn sm" onClick=${() => go('frontdesk')}>Open chats</button></span></header>
        <div class="body">
          <div class="legend"><span><i style="background:var(--accent)"></i>Chats ${x.chats30}</span><span><i style="background:var(--up)"></i>WhatsApp leads ${x.leads30}</span></div>
          <${ChatChart} days=${x.days} />
        </div>
      </section>
    </div>

    <section class="card">
      <header><h2>Pipeline</h2><span class="hint">${real.length} clients</span><span class="r"><button class="btn sm" onClick=${() => go('clients')}>Open board</button></span></header>
      <div class="body"><div class="strip">
        ${counts.map(({ s, list }) => html`<button onClick=${() => go('clients')}>
          <span class=${'pill st-' + s}>${s}</span><span class="n">${list.length}</span>
          <span class="v">${fmtSums(sumBy(list, c => c.value))}</span>
          <span class="bar" style=${`background:${stageColor[s]};width:${list.length ? Math.max(8, list.length / maxN * 100) : 3}%`}></span></button>`)}
      </div></div>
    </section>

    <div class="grid2">
      <section class="card">
        <header><h2>Websites</h2><span class="r"><button class="btn sm" onClick=${() => go('websites')}>All websites</button></span></header>
        <div class="tablewrap" style="margin-top:8px"><${SiteTable} x=${x} sites=${d.sites.slice(0, 6)} openSite=${openSite} compact /></div>
      </section>
      <section class="card">
        <header><h2>Recent activity</h2><span class="r"><button class="btn sm" onClick=${() => go('activity')}>All activity</button></span></header>
        <div class="body"><${Feed} items=${d.activity.slice(0, 8)} x=${x} /></div>
      </section>
    </div>`;
}

function Feed({ items, x }) {
  if (!items.length) return html`<p class="note">Nothing yet. New clients, stage moves, notes and site alerts show up here.</p>`;
  const icon = { alert: 'alert', stage: 'arrow', note: 'note', client: 'users', site: 'globe', system: 'bolt' };
  return html`<ul class="feed">${items.map(a => html`<li>
    <span class=${'ty ' + a.type}><${I} n=${icon[a.type] || 'note'} s="13" /></span>
    <div>${a.text}${a.clientId && x.byClient[a.clientId] && a.type === 'note' ? html`<div class="who">${x.byClient[a.clientId].name}</div>` : null}</div>
    <span class="t">${ago(a.t)}</span></li>`)}</ul>`;
}

function SiteTable({ x, sites, openSite, compact }) {
  if (!sites.length) return html`<p class="note" style="padding:16px 18px">No websites match.</p>`;
  return html`<table class="t"><thead><tr>
    <th>Website</th><th>Status</th>${compact ? html`<th class="r">Response</th>` : html`<th class="r">Response</th><th>Uptime</th><th class="r">SEO</th><th class="r">Speed</th><th>Front Desk</th>`}<th class="r">Checked</th></tr></thead>
    <tbody>${sites.map(s => {
      const h = s.health, st = x.siteState(s);
      return html`<tr onClick=${() => openSite(s.id)} tabindex="0" onKeyDown=${e => e.key === 'Enter' && openSite(s.id)}>
        <td class="host"><b>${s.host}</b><span>${s.clientName} · ${s.label}</span></td>
        <td><span class=${'pill ' + (st === 'none' ? '' : st)}><span class="d"></span>${st === 'up' ? 'Up' : st === 'slow' ? 'Slow' : st === 'down' ? 'Down' : 'Not checked'}</span></td>
        <td class="r nowrap">${h && h.state !== 'down' ? h.ms + ' ms' : '–'}</td>
        ${compact ? null : html`
        <td><div style="display:flex;gap:8px;align-items:center"><${Uptime} history=${s.history} /><span class="muted nowrap">${s.uptime == null ? '' : s.uptime + '%'}</span></div></td>
        <td class="r"><span class="miniscore">${h && h.seo && h.state !== 'down' ? h.seo.passed + '/' + h.seo.total : '–'}</span></td>
        <td class="r"><span class=${'miniscore ' + grade(s.psi?.scores?.performance)}>${s.psi?.scores?.performance ?? '–'}</span></td>
        <td>${s.frontDesk ? html`<span class=${'pill ' + (h?.frontDeskInstalled ? 'up' : 'slow')}>${h?.frontDeskInstalled ? 'Installed' : 'Not installed'}</span>` : html`<span class="muted">–</span>`}</td>`}
        <td class="r nowrap muted">${h ? ago(h.checkedAt) : '–'}</td></tr>`;
    })}</tbody></table>`;
}

function Clients({ d, x, q, openClient, saveStage, newClient }) {
  const [view, setView] = useState(store.get('ws-clients-view') || 'board');
  const [over, setOver] = useState(null);
  const drag = useRef(null);
  const list = x.real.filter(c => !q || (c.name + ' ' + c.business + ' ' + c.location + ' ' + c.notes).toLowerCase().includes(q));
  const setV = v => { setView(v); store.set('ws-clients-view', v); };
  const status = c => {
    const st = c.sites.map(s => x.siteState(d.sites.find(y => y.id === s.id)));
    return st.includes('down') ? 'down' : st.includes('slow') ? 'slow' : st.includes('up') ? 'up' : 'none';
  };
  return html`
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <div class="seg" aria-label="View"><button class=${view === 'board' ? 'on' : ''} onClick=${() => setV('board')}><${I} n="board" s="14" /> Board</button><button class=${view === 'table' ? 'on' : ''} onClick=${() => setV('table')}><${I} n="list" s="14" /> Table</button></div>
      <span class="note hide-sm">${view === 'board' ? 'Drag a client card to another stage. On a phone, change the stage inside the client.' : ''}</span>
      <span style="flex:1"></span>
      <button class="btn primary" onClick=${newClient}><${I} n="plus" s="16" /> New client</button>
    </div>
    ${view === 'board' ? html`<div class="board">${d.stages.map(stg => {
      const col = list.filter(c => c.stage === stg);
      return html`<div class=${'col' + (over === stg ? ' over' : '')}
        onDragOver=${e => { e.preventDefault(); if (over !== stg) setOver(stg); }} onDragLeave=${e => { if (!e.currentTarget.contains(e.relatedTarget)) setOver(null); }}
        onDrop=${e => { e.preventDefault(); setOver(null); const id = drag.current; drag.current = null; if (id) saveStage(id, stg); }}>
        <h3><span class=${'pill st-' + stg}>${stg}</span><small>${col.length}${col.some(c => c.value) ? ' · ' + fmtSums(sumBy(col, c => c.value)) : ''}</small></h3>
        ${col.length ? col.map(c => html`<div class="deal" draggable="true" tabindex="0"
            onDragStart=${e => { drag.current = c.id; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', c.id); } catch (_) {} e.currentTarget.classList.add('dragging'); }}
            onDragEnd=${e => e.currentTarget.classList.remove('dragging')}
            onClick=${() => openClient(c.id)} onKeyDown=${e => e.key === 'Enter' && openClient(c.id)}>
          <b>${c.name}</b><span class="sub">${[c.business, c.location].filter(Boolean).join(' · ') || '–'}</span>
          <div class="row"><span class="val">${c.value ? money(c.value, c.currency) : html`<span class="muted">No value yet</span>`}${c.monthly ? html` <span class="muted">+ ${money(c.monthly, c.currency)}/mo</span>` : null}</span>
            <span title=${'Websites: ' + status(c)}><span class=${'dot ' + status(c)}></span></span></div>
          ${c.sites.some(s => s.frontDesk) ? html`<span class="pill accent" style="align-self:flex-start">Front Desk</span>` : null}
        </div>`) : html`<div class="emptycol">Drop a client here</div>`}
      </div>`;
    })}</div>` : html`<section class="card"><div class="tablewrap"><table class="t"><thead><tr><th>Client</th><th>Stage</th><th class="r">Deal value</th><th class="r">Monthly</th><th>Websites</th><th>Contact</th></tr></thead>
      <tbody>${list.map(c => html`<tr onClick=${() => openClient(c.id)} tabindex="0" onKeyDown=${e => e.key === 'Enter' && openClient(c.id)}>
        <td class="host"><b>${c.name}</b><span>${[c.business, c.location].filter(Boolean).join(' · ')}</span></td>
        <td><span class=${'pill st-' + c.stage}>${c.stage}</span></td>
        <td class="r nowrap">${money(c.value, c.currency)}</td><td class="r nowrap">${c.monthly ? money(c.monthly, c.currency) : '–'}</td>
        <td><span style="display:inline-flex;gap:6px;align-items:center"><span class=${'dot ' + status(c)}></span>${c.sites.length}</span></td>
        <td class="muted">${c.contact?.whatsapp || c.contact?.email || '–'}</td></tr>`)}</tbody></table></div></section>`}`;
}

function Websites({ d, x, q, openSite, addSite }) {
  const [f, setF] = useState('all');
  const issues = s => ['down', 'slow'].includes(x.siteState(s));
  let list = d.sites.filter(s => !q || (s.host + ' ' + s.clientName + ' ' + s.label).toLowerCase().includes(q));
  if (f === 'up') list = list.filter(s => x.siteState(s) === 'up');
  if (f === 'issues') list = list.filter(issues);
  if (f === 'desk') list = list.filter(s => s.frontDesk);
  return html`
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <div class="seg">${[['all', 'All ' + d.sites.length], ['up', 'Up ' + d.sites.filter(s => x.siteState(s) === 'up').length], ['issues', 'Issues ' + d.sites.filter(issues).length], ['desk', 'With Front Desk ' + d.sites.filter(s => s.frontDesk).length]].map(([k, l]) => html`<button class=${f === k ? 'on' : ''} onClick=${() => setF(k)}>${l}</button>`)}</div>
      <span style="flex:1"></span>
      <button class="btn primary" onClick=${() => addSite()}><${I} n="plus" s="16" /> Add website</button>
    </div>
    <section class="card"><div class="tablewrap"><${SiteTable} x=${x} sites=${list} openSite=${openSite} /></div></section>
    <p class="note">Every website is checked when you open the workstation (at most every 15 minutes) and once a day automatically. Speed scores come from Google’s own test: open a website to run it.</p>`;
}

function Domains({ d, x, q, openSite }) {
  const rows = d.sites.filter(s => !q || (s.host + ' ' + s.clientName).toLowerCase().includes(q)).map(s => ({ s, dm: x.domainFor(s) || { kind: 'vercel' } }));
  const custom = rows.filter(r => r.dm.kind === 'custom').length;
  return html`
    <div class="grid3">
      <div class="card kpi"><span class="label">Domains</span><span class="num">${rows.length}</span><span class="meta">${custom} custom · ${rows.length - custom} free addresses</span></div>
      <div class="card kpi"><span class="label">Renewing within 45 days</span><span class="num">${x.expiring}</span><span class="meta">${x.expiring ? 'renew before they lapse' : 'nothing due'}</span></div>
      <div class="card kpi"><span class="label">Secure and reachable</span><span class="num">${rows.filter(r => r.s.health && r.s.health.state !== 'down' && r.s.url.startsWith('https')).length} / ${rows.length}</span><span class="meta">answering over https</span></div>
    </div>
    <section class="card"><div class="tablewrap"><table class="t"><thead><tr><th>Domain</th><th>Client</th><th>Type</th><th>Registrar</th><th>Registered</th><th>Expires</th><th>Status</th></tr></thead>
      <tbody>${rows.map(({ s, dm }) => {
        const left = dm.expires ? Math.round((dm.expires - Date.now()) / DAY) : null, st = x.siteState(s);
        return html`<tr onClick=${() => openSite(s.id)} tabindex="0" onKeyDown=${e => e.key === 'Enter' && openSite(s.id)}>
          <td class="host"><b>${s.host}</b><span>${dm.kind === 'custom' ? dm.apex : 'Free address on Vercel'}</span></td>
          <td class="nowrap">${s.clientName}</td>
          <td>${dm.kind === 'custom' ? html`<span class="pill blue">Custom</span>` : html`<span class="pill">Vercel subdomain</span>`}</td>
          <td class="muted">${dm.kind === 'custom' ? dm.registrar || (dm.error ? 'Lookup failed' : '–') : 'Not needed'}</td>
          <td class="nowrap muted">${dm.kind === 'custom' ? dateStr(dm.registered) : '–'}</td>
          <td class="nowrap">${dm.kind !== 'custom' ? html`<span class="muted">Never expires</span>` : left == null ? html`<span class="muted">Unknown</span>` :
            html`${dateStr(dm.expires)} <span class=${'pill ' + (left < 14 ? 'down' : left < 45 ? 'slow' : 'up')}>${left} days</span>`}</td>
          <td><span class=${'pill ' + (st === 'none' ? '' : st)}><span class="d"></span>${st === 'down' ? 'Not reachable' : st === 'none' ? 'Not checked' : 'Live, https'}</span></td></tr>`;
      })}</tbody></table></div></section>
    <section class="card"><header><h2>Moving a client to their own domain</h2></header><div class="body"><p class="note">Free vercel.app addresses never expire, but a client’s own name looks more professional and is what Google ranks. When a client pays: buy the domain in their name, connect it in Vercel (Project → Domains), then add it here with “Add website”. Custom domains show their registrar and expiry date automatically, and you’re warned 45 days before renewal.</p></div></section>`;
}

function FrontDesk({ d, api, q, toast }) {
  const [desk, setDesk] = useState(Object.keys(d.desks || {})[0] || d.frontDeskClients[0]?.id);
  const [f, setF] = useState('all');
  const [convs, setConvs] = useState(null);
  const [sel, setSel] = useState(null);
  useEffect(() => {
    if (!desk) return; setConvs(null); setSel(null);
    api('?view=chats&desk=' + encodeURIComponent(desk)).then(r => setConvs(r.conversations)).catch(e => { setConvs([]); toast(errText(e)); });
  }, [desk]);
  const cur = d.desks?.[desk];
  let list = (convs || []).filter(c => f === 'all' || c.lead);
  if (q) list = list.filter(c => c.messages.some(m => m.text.toLowerCase().includes(q)));
  const conv = list.find(c => c.sid === sel);
  const users = c => c.messages.filter(m => m.role === 'user');
  const siteFor = d.sites.find(s => s.frontDesk === desk);
  return html`
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <div class="seg" aria-label="Front Desk">${d.frontDeskClients.map(c => html`<button class=${desk === c.id ? 'on' : ''} onClick=${() => setDesk(c.id)}>${c.name}${d.desks?.[c.id]?.leads7 ? html`<span class="pill up" style="padding:0 6px">${d.desks[c.id].leads7}</span>` : null}</button>`)}</div>
      <span style="flex:1"></span>
      ${siteFor ? html`<span class=${'pill ' + (siteFor.health?.frontDeskInstalled ? 'up' : 'slow')}>${siteFor.health?.frontDeskInstalled ? 'Live on ' + siteFor.host : 'Demo only, not on ' + siteFor.host + ' yet'}</span>` : null}
    </div>
    <section class="kpis" style="grid-template-columns:repeat(5,minmax(0,1fr))">
      <div class="card kpi"><span class="label">Chats, 7 days</span><span class="num">${cur?.chats7 ?? 0}</span><span class="meta"><${Delta} now=${cur?.chats7 || 0} prev=${cur?.chatsPrev7} /></span></div>
      <div class="card kpi"><span class="label">WhatsApp leads, 7 days</span><span class="num">${cur?.leads7 ?? 0}</span><span class="meta"><${Delta} now=${cur?.leads7 || 0} prev=${cur?.leadsPrev7} /></span></div>
      <div class="card kpi"><span class="label">Chat to lead, 30 days</span><span class="num">${cur?.leadRate30 == null ? '–' : cur.leadRate30 + '%'}</span><span class="meta">${cur?.leads30 || 0} of ${cur?.chats30 || 0} chats</span></div>
      <div class="card kpi"><span class="label">Messages per chat</span><span class="num">${cur?.avgMessages30 ?? '–'}</span><span class="meta">average, 30 days</span></div>
      <div class="card kpi"><span class="label">Answered by AI</span><span class="num">${cur?.aiShare == null ? '–' : cur.aiShare + '%'}</span><span class="meta">rest from built-in answers</span></div>
    </section>
    <section class=${'card inbox' + (conv ? ' reading' : '')}>
      <div class="list">
        <div class="filters">
          <div class="seg"><button class=${f === 'all' ? 'on' : ''} onClick=${() => setF('all')}>All chats</button><button class=${f === 'leads' ? 'on' : ''} onClick=${() => setF('leads')}>Leads only</button></div>
          <span class="note">${convs ? list.length + ' shown' : ''}</span>
        </div>
        <div class="items">
          ${convs == null ? html`<p class="note" style="padding:16px">Loading chats…</p>` : !list.length ? html`<p class="note" style="padding:16px">${f === 'leads' ? 'No leads yet.' : 'No chats yet. They appear the moment someone uses the chat.'}</p>` :
            list.map(c => html`<button class=${'conv' + (c.sid === sel ? ' on' : '')} onClick=${() => setSel(c.sid)}>
              <span class="l1"><span>${ago(c.updated)}</span><span class="grow"></span>${c.country ? html`<span>${c.country}</span>` : null}<span>${users(c).length} ${users(c).length === 1 ? 'message' : 'messages'}</span>${c.lead ? html`<span class="pill up" style="padding:1px 7px">Lead</span>` : null}</span>
              <span class="first">${users(c)[0]?.text || '(no message)'}</span></button>`)}
        </div>
      </div>
      <div class="thread">
        ${conv ? html`
          <header><button class="iconbtn menu-btn" onClick=${() => setSel(null)} aria-label="Back to chats"><${I} n="back" s="16" /></button>
            <b>${new Date(conv.updated).toLocaleString()}</b>
            ${conv.lead ? html`<span class="pill up">Got the WhatsApp button</span>` : html`<span class="pill">Browsed only</span>`}
            <span class="note">${[conv.country, conv.page].filter(Boolean).join(' · ')}</span></header>
          <div class="msgs">${conv.messages.map(m => html`<div class=${'msg ' + m.role}>${m.text}${m.actions && m.actions.length ? html`<small>Button shown: ${m.actions.join(', ')}</small>` : null}</div>`)}</div>`
        : html`<div class="placeholder"><div><${I} n="chat" s="28" /><p>Pick a chat to read it. Visitors who tap the WhatsApp button message you directly on WhatsApp.</p></div></div>`}
      </div>
    </section>`;
}

function Activity({ d, x, q }) {
  const [f, setF] = useState('all');
  let list = d.activity.filter(a => f === 'all' || a.type === f || (f === 'site' && a.type === 'alert'));
  if (q) list = list.filter(a => a.text.toLowerCase().includes(q));
  const groups = {};
  list.forEach(a => { const k = new Date(a.t).toDateString(); (groups[k] = groups[k] || []).push(a); });
  const label = k => k === new Date().toDateString() ? 'Today' : k === new Date(Date.now() - DAY).toDateString() ? 'Yesterday' : new Date(k).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  return html`
    <div class="seg">${[['all', 'Everything'], ['note', 'Notes'], ['stage', 'Stage moves'], ['site', 'Websites'], ['client', 'Clients']].map(([k, l]) => html`<button class=${f === k ? 'on' : ''} onClick=${() => setF(k)}>${l}</button>`)}</div>
    ${Object.keys(groups).length ? Object.entries(groups).map(([day, items]) => html`<section class="card"><header><h2>${label(day)}</h2><span class="hint">${items.length}</span></header><div class="body"><${Feed} items=${items} x=${x} /></div></section>`)
      : html`<p class="note">Nothing here yet.</p>`}`;
}

/* ---------- drawers ---------- */
function ClientDrawer({ d, x, client, api, close, refresh, toast, openSite, addSite }) {
  const isNew = !client;
  const [tab, setTab] = useState('details');
  const blank = { name: '', business: '', location: '', stage: 'Lead', value: '', monthly: '', currency: 'IDR', notes: '', contact: { name: '', whatsapp: '', email: '', instagram: '' }, sites: [] };
  const [f, setF] = useState(() => client ? JSON.parse(JSON.stringify(client)) : blank);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [note, setNote] = useState('');
  const set = (k, v) => setF(o => ({ ...o, [k]: v }));
  const setC = (k, v) => setF(o => ({ ...o, contact: { ...o.contact, [k]: v } }));
  const save = async () => {
    setBusy(true);
    try {
      const r = await api('', { body: { action: 'saveClient', client: { ...f, sites: undefined, stageChangedFrom: client?.stage } } });
      toast(isNew ? 'Client added' : 'Saved'); await refresh(); if (isNew) close(r.client.id);
    } catch (e) { toast(errText(e)); } finally { setBusy(false); }
  };
  const del = async () => { setBusy(true); try { await api('', { body: { action: 'deleteClient', id: client.id } }); toast('Client removed'); close(); refresh(); } catch (e) { toast(errText(e)); setBusy(false); } };
  const addNote = async () => { if (!note.trim()) return; try { await api('', { body: { action: 'note', clientId: client.id, text: note } }); setNote(''); toast('Note added'); refresh(); } catch (e) { toast(errText(e)); } };
  const sites = client ? d.sites.filter(s => s.clientId === client.id) : [];
  const timeline = client ? d.activity.filter(a => a.clientId === client.id) : [];
  const wa = waLink(f.contact.whatsapp);
  return html`<div class="scrim" onClick=${() => close()}></div>
  <aside class="drawer" role="dialog" aria-modal="true" aria-label=${isNew ? 'New client' : client.name}>
    <header><div style="flex:1;min-width:0"><h2>${isNew ? 'New client' : client.name}</h2><div class="sub">${isNew ? 'Add a business you’re talking to' : [client.business, client.location].filter(Boolean).join(' · ')}</div></div>
      ${!isNew ? html`<span class=${'pill st-' + client.stage}>${client.stage}</span>` : null}
      <button class="iconbtn" onClick=${() => close()} aria-label="Close"><${I} n="x" s="16" /></button></header>
    ${!isNew ? html`<nav class="tabs">${[['details', 'Details'], ['sites', 'Websites ' + sites.length], ['timeline', 'Timeline ' + timeline.length]].map(([k, l]) => html`<button class=${tab === k ? 'on' : ''} onClick=${() => setTab(k)}>${l}</button>`)}</nav>` : null}
    <div class="dbody">
      ${tab === 'details' ? html`
        ${!isNew && (wa || f.contact.email || f.contact.instagram || sites[0]) ? html`<div class="quick">
          ${wa ? html`<a class="btn" href=${wa} target="_blank" rel="noopener"><${I} n="wa" s="15" /> WhatsApp</a>` : null}
          ${f.contact.email ? html`<a class="btn" href=${'mailto:' + f.contact.email}>Email</a>` : null}
          ${f.contact.instagram ? html`<a class="btn" href=${'https://instagram.com/' + f.contact.instagram.replace(/^@/, '')} target="_blank" rel="noopener">Instagram</a>` : null}
          ${sites[0] ? html`<a class="btn" href=${sites[0].url} target="_blank" rel="noopener"><${I} n="ext" s="14" /> Website</a>` : null}</div>` : null}
        <div class="form2">
          <label class="f wide">Business name<input value=${f.name} onInput=${e => set('name', e.target.value)} placeholder="e.g. Gentology Barbershop" /></label>
          <label class="f">What they do<input value=${f.business} onInput=${e => set('business', e.target.value)} placeholder="Barbershop, 3 branches" /></label>
          <label class="f">Location<input value=${f.location} onInput=${e => set('location', e.target.value)} placeholder="Jakarta" /></label>
          <label class="f">Stage<select value=${f.stage} onChange=${e => set('stage', e.target.value)}>${d.stages.map(s => html`<option value=${s}>${s}</option>`)}</select></label>
          <label class="f">Currency<select value=${f.currency} onChange=${e => set('currency', e.target.value)}>${['IDR', 'MYR', 'SGD', 'USD', 'EUR', 'GBP', 'PKR'].map(c => html`<option value=${c}>${c}</option>`)}</select></label>
          <label class="f">Deal value (one-off)<input inputmode="numeric" value=${f.value ?? ''} onInput=${e => set('value', e.target.value)} placeholder="3000000" /></label>
          <label class="f">Monthly fee<input inputmode="numeric" value=${f.monthly ?? ''} onInput=${e => set('monthly', e.target.value)} placeholder="Front Desk, hosting, care" /></label>
        </div>
        <p class="sect">Contact</p>
        <div class="form2">
          <label class="f">Contact person<input value=${f.contact.name} onInput=${e => setC('name', e.target.value)} /></label>
          <label class="f">WhatsApp<input value=${f.contact.whatsapp} onInput=${e => setC('whatsapp', e.target.value)} placeholder="+62 812…" inputmode="tel" /></label>
          <label class="f">Email<input type="email" value=${f.contact.email} onInput=${e => setC('email', e.target.value)} /></label>
          <label class="f">Instagram<input value=${f.contact.instagram} onInput=${e => setC('instagram', e.target.value)} placeholder="@handle" /></label>
          <label class="f wide">Notes<textarea value=${f.notes} onInput=${e => set('notes', e.target.value)} placeholder="What they want, what you quoted, the next step…"></textarea></label>
        </div>
        ${isNew ? html`<p class="note">Add their websites after saving, from the Websites tab.</p>` : null}` : null}
      ${tab === 'sites' ? html`
        ${sites.length ? sites.map(s => html`<div class="sitecard"><div class="row">
          <span class=${'dot ' + x.siteState(s)}></span><b>${s.host}</b><span class="muted">${s.label}</span><span class="grow"></span>
          <button class="btn sm" onClick=${() => openSite(s.id)}>Details</button></div>
          <div class="row note">${s.health ? (s.health.state === 'down' ? 'Down' : s.health.ms + ' ms') : 'Not checked yet'} · uptime ${s.uptime == null ? '–' : s.uptime + '%'} · SEO ${s.health?.seo && s.health.state !== 'down' ? s.health.seo.passed + '/' + s.health.seo.total : '–'}${s.frontDesk ? ' · Front Desk' : ''}</div></div>`)
          : html`<p class="note">No websites yet for this client.</p>`}
        <button class="btn" style="align-self:flex-start" onClick=${() => addSite(client.id)}><${I} n="plus" s="15" /> Add a website</button>` : null}
      ${tab === 'timeline' ? html`
        <label class="f">Add a note<textarea value=${note} onInput=${e => setNote(e.target.value)} placeholder="Called the owner, sending the quote on Friday…"></textarea></label>
        <button class="btn primary" style="align-self:flex-start" onClick=${addNote} disabled=${!note.trim()}>Add note</button>
        <${Feed} items=${timeline} x=${x} />` : null}
    </div>
    ${tab === 'details' ? html`<footer>
      ${!isNew && !client.internal ? (confirm ? html`<span class="confirm">Delete ${client.name} and its websites? <button class="btn sm danger" onClick=${del} disabled=${busy}>Delete</button><button class="btn sm" onClick=${() => setConfirm(false)}>Keep</button></span>`
        : html`<button class="btn ghost danger" onClick=${() => setConfirm(true)}><${I} n="trash" s="15" /> Delete</button>`) : null}
      <span class="grow"></span>
      <button class="btn" onClick=${() => close()}>Cancel</button>
      <button class="btn primary" onClick=${save} disabled=${busy || !f.name.trim()}>${isNew ? 'Add client' : 'Save changes'}</button></footer>` : null}
  </aside>`;
}

function SiteDrawer({ d, x, site, clientId, api, close, refresh, toast }) {
  const isNew = !site;
  const [edit, setEdit] = useState(isNew);
  const [f, setF] = useState(() => site ? { ...site, frontDesk: site.frontDesk || '' } : { url: '', label: 'Website', frontDesk: '', indexable: false, clientId: clientId || x.real[0]?.id || d.clients[0]?.id });
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [psiBusy, setPsiBusy] = useState(false);
  const [psiMsg, setPsiMsg] = useState('');
  const set = (k, v) => setF(o => ({ ...o, [k]: v }));
  const owner = site ? site.clientId : f.clientId;
  const save = async () => {
    setBusy(true);
    try { await api('', { body: { action: 'saveSite', clientId: owner, site: { id: site?.id, url: f.url, label: f.label, frontDesk: f.frontDesk || null, indexable: f.indexable } } });
      toast(isNew ? 'Website added and checked' : 'Saved'); await refresh(); if (isNew) close(); else setEdit(false); }
    catch (e) { toast(errText(e)); } finally { setBusy(false); }
  };
  const remove = async () => { setBusy(true); try { await api('', { body: { action: 'removeSite', clientId: owner, siteId: site.id } }); toast('Website removed'); close(); refresh(); } catch (e) { toast(errText(e)); setBusy(false); } };
  const runPsi = async () => {
    setPsiBusy(true); setPsiMsg('Running Google’s speed test on mobile. This takes about 30 seconds.');
    try {
      const q = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed?strategy=mobile&url=' + encodeURIComponent(site.url) + '&category=performance&category=seo&category=accessibility&category=best-practices';
      const j = await (await fetch(q)).json();
      const c = j.lighthouseResult?.categories;
      if (!c) throw new Error(j.error?.message || 'no result');
      const sc = k => c[k]?.score != null ? Math.round(c[k].score * 100) : null;
      await api('', { body: { action: 'psi', siteId: site.id, scores: { performance: sc('performance'), seo: sc('seo'), accessibility: sc('accessibility'), bestPractices: sc('best-practices') }, lcp: j.lighthouseResult.audits?.['largest-contentful-paint']?.numericValue } });
      setPsiMsg(''); toast('Speed test saved'); refresh();
    } catch (e) { setPsiMsg(/quota|rate|429/i.test(String(e.message)) ? 'Google’s free test is busy. Try again in a minute.' : 'The test didn’t finish. Try again.'); }
    finally { setPsiBusy(false); }
  };
  const h = site?.health, dm = site ? x.domainFor(site) : null, psi = site?.psi;
  const snippet = site?.frontDesk ? `<script src="https://arcwise-front-desk.vercel.app/widget.js" data-client="${site.frontDesk}" defer></` + `script>` : '';
  return html`<div class="scrim" onClick=${() => close()}></div>
  <aside class="drawer" role="dialog" aria-modal="true" aria-label=${isNew ? 'Add website' : site.host}>
    <header><div style="flex:1;min-width:0"><h2>${isNew ? 'Add website' : site.host}</h2><div class="sub">${isNew ? 'It’s checked straight away, then every day' : site.clientName + ' · ' + site.label}</div></div>
      ${!isNew && h ? html`<span class=${'pill ' + h.state}><span class="d"></span>${h.state === 'up' ? 'Up' : h.state === 'slow' ? 'Slow' : 'Down'}</span>` : null}
      <button class="iconbtn" onClick=${() => close()} aria-label="Close"><${I} n="x" s="16" /></button></header>
    <div class="dbody">
      ${edit ? html`<div class="form2">
          ${isNew ? html`<label class="f wide">Client<select value=${f.clientId} onChange=${e => set('clientId', e.target.value)}>${d.clients.map(c => html`<option value=${c.id}>${c.name}</option>`)}</select></label>` : null}
          <label class="f wide">Website address<input value=${f.url} onInput=${e => set('url', e.target.value)} placeholder="https://clientname.com" inputmode="url" autocapitalize="off" /></label>
          <label class="f">Label<input value=${f.label} onInput=${e => set('label', e.target.value)} placeholder="Website, Concept site, Shop" /></label>
          <label class="f">Front Desk chat<select value=${f.frontDesk || ''} onChange=${e => set('frontDesk', e.target.value)}><option value="">None</option>${d.frontDeskClients.map(c => html`<option value=${c.id}>${c.name}</option>`)}</select></label>
          <label class="check wide"><input type="checkbox" checked=${f.indexable} onChange=${e => set('indexable', e.target.checked)} /><span>This site should be on Google<br/><span class="muted">Leave it off for concept links you keep hidden. When on, you’re warned if the site gets hidden by mistake.</span></span></label>
        </div>` : html`
        <div class="quick"><a class="btn" href=${site.url} target="_blank" rel="noopener"><${I} n="ext" s="14" /> Open site</a><button class="btn" onClick=${() => setEdit(true)}><${I} n="edit" s="14" /> Edit</button></div>
        <div class="stats">
          <div class="stat"><span class="num">${h && h.state !== 'down' ? h.ms + ' ms' : '–'}</span><span>response time</span></div>
          <div class="stat"><span class="num">${site.uptime == null ? '–' : site.uptime + '%'}</span><span>uptime, ${site.checks} checks</span></div>
          <div class="stat"><span class="num">${h ? h.sizeKb + ' KB' : '–'}</span><span>page size</span></div>
          <div class="stat"><span class="num">${h ? ago(h.checkedAt) : '–'}</span><span>last checked</span></div>
        </div>
        <section class="card"><header><h2>Uptime history</h2><span class="hint">last ${Math.min(30, site.history.length)} checks</span></header><div class="body"><${Uptime} history=${site.history} /></div></section>
        <section class="card"><header><h2>Google speed test</h2><span class="hint">${psi ? 'mobile · ' + ago(psi.at) : 'not run yet'}</span><span class="r"><button class="btn sm" onClick=${runPsi} disabled=${psiBusy}><${I} n="bolt" s="14" /> ${psiBusy ? 'Testing…' : psi ? 'Run again' : 'Run test'}</button></span></header>
          <div class="body"><div class="scores"><${Ring} v=${psi?.scores?.performance} label="Speed" /><${Ring} v=${psi?.scores?.seo} label="SEO" /><${Ring} v=${psi?.scores?.accessibility} label="Accessibility" /><${Ring} v=${psi?.scores?.bestPractices} label="Best practice" /></div>
          ${psiMsg ? html`<p class="note" style="margin-top:10px">${psiMsg}</p>` : psi?.lcp ? html`<p class="note" style="margin-top:10px">Main content appears in ${(psi.lcp / 1000).toFixed(1)} s on a phone.</p>` : null}
          ${h && !h.indexable && h.state !== 'down' ? html`<p class="note" style="margin-top:6px">This site is hidden from Google, so Google’s SEO score is lower on purpose. It rises once the site launches on its own domain.</p>` : null}</div></section>
        ${h && h.seo && h.state !== 'down' ? html`<section class="card"><header><h2>SEO checklist</h2><span class="hint">${h.seo.passed} of ${h.seo.total} pass · ${h.indexable ? 'visible to Google' : 'hidden from Google'}</span></header><div class="body"><ul class="checks">
          ${h.seo.checks.map(k => html`<li><span class=${k.pass ? 'ok' : 'no'}>${k.pass ? 'Pass' : 'Fix'}</span><span>${k.label}<em>${k.detail}</em></span></li>`)}</ul></div></section>` : null}
        <section class="card"><header><h2>Domain</h2></header><div class="body">
          ${dm && dm.kind === 'custom' ? html`<p class="note">${dm.apex} · ${dm.registrar || 'registrar unknown'} · ${dm.expires ? 'expires ' + dateStr(dm.expires) : 'expiry unknown'}</p>` : html`<p class="note">Free Vercel address. It never expires. Move the client to their own domain when they pay.</p>`}</div></section>
        ${site.frontDesk ? html`<section class="card"><header><h2>Front Desk</h2><span class="hint">${h?.frontDeskInstalled ? 'live on this site' : 'not on this site yet'}</span></header><div class="body">
          <p class="note">${h?.frontDeskInstalled ? 'The AI receptionist is live on this site. Its chats are in Front Desk.' : 'Paste this line before </body> on the site to switch the chat on:'}</p>
          ${!h?.frontDeskInstalled ? html`<pre class="code">${snippet}</pre>` : null}</div></section>` : null}`}
    </div>
    <footer>
      ${!isNew ? (confirm ? html`<span class="confirm">Remove this website? <button class="btn sm danger" onClick=${remove} disabled=${busy}>Remove</button><button class="btn sm" onClick=${() => setConfirm(false)}>Keep</button></span>`
        : html`<button class="btn ghost danger" onClick=${() => setConfirm(true)}><${I} n="trash" s="15" /> Remove</button>`) : null}
      <span class="grow"></span>
      ${edit ? html`<button class="btn" onClick=${() => isNew ? close() : setEdit(false)}>Cancel</button><button class="btn primary" onClick=${save} disabled=${busy || !String(f.url).trim()}>${busy ? 'Checking…' : isNew ? 'Add website' : 'Save'}</button>` : html`<button class="btn" onClick=${() => close()}>Close</button>`}
    </footer>
  </aside>`;
}

/* ---------- app ---------- */
const PAGES = [
  ['overview', 'Overview', 'home'], ['clients', 'Clients', 'users'], ['websites', 'Websites', 'globe'],
  ['domains', 'Domains', 'link'], ['frontdesk', 'Front Desk', 'chat'], ['activity', 'Activity', 'pulse'],
];
const SUBS = {
  overview: 'Everything across your clients at a glance', clients: 'Your pipeline, from first chat to live site', websites: 'Health, uptime, SEO and speed for every site',
  domains: 'Addresses, registrars and renewals', frontdesk: 'Every conversation with your AI receptionists', activity: 'What changed, newest first',
};

function App() {
  const [pw, setPw] = useState('');
  const [authed, setAuthed] = useState(false);
  const [trying, setTrying] = useState(true);
  const [loginErr, setLoginErr] = useState('');
  const [data, setData] = useState(null);
  const [page, setPage] = useState((location.hash || '#overview').slice(1));
  const [drawer, setDrawer] = useState(null);
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');
  const [checking, setChecking] = useState(false);
  const [menu, setMenu] = useState(false);
  const [theme, setTheme] = useState(store.get('ws-theme') || '');
  const api = useApi(() => { setAuthed(false); setData(null); });
  const toastT = useRef();
  const toast = t => { setMsg(t); clearTimeout(toastT.current); toastT.current = setTimeout(() => setMsg(''), 2600); };

  useEffect(() => { if (theme) document.documentElement.dataset.theme = theme; else delete document.documentElement.dataset.theme; }, [theme]);
  useEffect(() => { const f = () => { setPage((location.hash || '#overview').slice(1)); setQ(''); }; addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  useEffect(() => { const f = e => { if (e.key === 'Escape') setDrawer(null); if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); document.getElementById('q')?.focus(); } }; addEventListener('keydown', f); return () => removeEventListener('keydown', f); }, []);

  const load = async check => {
    try { const d = await api(check ? '?check=1' : ''); setData(d); setAuthed(true); return d; }
    catch (e) { if (e.code !== 'signed_out') { setLoginErr(errText(e)); toast(errText(e)); } }
    finally { setTrying(false); }
  };
  const signIn = async () => {
    setTrying(true); setLoginErr('');
    try {
      const r = await fetch('/api/session', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password: pw }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setLoginErr(errText({ code: j.error || 'server_error' })); setTrying(false); return; }
      setPw(''); await load();
    } catch (e) { setLoginErr('Couldn’t reach the server. Check your connection.'); setTrying(false); }
  };
  const signOut = async () => { try { await fetch('/api/session', { method: 'DELETE', credentials: 'same-origin' }); } catch (e) {} setAuthed(false); setData(null); setLoginErr(''); };
  useEffect(() => { store.set('fd-inbox-pw', null); load(); }, []);
  useEffect(() => { if (!authed) return; const t = setInterval(() => load(), 5 * 60 * 1000); return () => clearInterval(t); }, [authed]);

  const go = p => { location.hash = p; setMenu(false); };
  const checkAll = async () => { setChecking(true); await load(true); setChecking(false); toast('All websites checked'); };
  const saveStage = async (id, stage) => {
    const c = data.clients.find(x => x.id === id);
    if (!c || c.stage === stage) return;
    setData(d => ({ ...d, clients: d.clients.map(x => x.id === id ? { ...x, stage } : x) }));
    try { await api('', { body: { action: 'saveClient', client: { ...c, sites: undefined, stage, stageChangedFrom: c.stage } } }); toast(`${c.name} moved to ${stage}`); load(); }
    catch (e) { toast(errText(e)); load(); }
  };

  if (!authed && trying && !loginErr) return html`<p class="loading">Opening…</p>`;
  if (!authed) return html`<div class="login"><form class="card" onSubmit=${e => { e.preventDefault(); signIn(); }}>
    <${Mark} /><h1>Arcwise Workstation</h1><p class="note">Clients, websites, domains and Front Desk in one place. You stay signed in on this device for 14 days.</p>
    <label class="f">Password<input type="password" value=${pw} onInput=${e => setPw(e.target.value)} autocomplete="current-password" autofocus /></label>
    ${loginErr ? html`<p class="err">${loginErr}</p>` : null}
    <button class="btn primary" type="submit" style="justify-content:center" disabled=${trying || !pw}>${trying ? 'Checking…' : 'Sign in'}</button></form></div>`;

  const x = derive(data);
  const ql = q.trim().toLowerCase();
  const openSite = id => setDrawer({ type: 'site', id });
  const openClient = id => setDrawer({ type: 'client', id });
  const addSite = clientId => setDrawer({ type: 'newSite', clientId });
  const highs = x.attention.filter(a => a.sev === 'high').length;
  const counts = {
    overview: highs ? { n: highs, cls: 'alert' } : null,
    clients: { n: x.real.length }, websites: x.down ? { n: x.down, cls: 'alert' } : { n: data.sites.length },
    domains: x.expiring ? { n: x.expiring, cls: 'alert' } : null, frontdesk: x.leads7 ? { n: x.leads7, cls: 'good' } : null,
  };
  const title = PAGES.find(p => p[0] === page) || PAGES[0];
  const cur = title[0];
  const dSite = drawer && drawer.type === 'site' ? data.sites.find(s => s.id === drawer.id) : null;
  const dClient = drawer && drawer.type === 'client' ? data.clients.find(c => c.id === drawer.id) : null;
  const props = { d: data, x, q: ql, api, toast, go, openSite, openClient, addSite };

  return html`<div class="app">
    <aside class=${'side' + (menu ? ' open' : '')} aria-label="Navigation">
      <div class="brand"><${Mark} /><div><b>Arcwise</b><small>Workstation</small></div></div>
      <nav class="nav">${PAGES.map(([k, l, ic]) => html`<a href=${'#' + k} class=${cur === k ? 'on' : ''} onClick=${() => setMenu(false)} aria-current=${cur === k ? 'page' : null}><${I} n=${ic} s="17" />${l}${counts[k] ? html`<span class=${'count ' + (counts[k].cls || '')}>${counts[k].n}</span>` : null}</a>`)}</nav>
      <div class="grow"></div>
      <div class="sidefoot">
        <button onClick=${() => { const n = theme === '' ? 'dark' : theme === 'dark' ? 'light' : ''; setTheme(n); store.set('ws-theme', n || null); }}><${I} n=${theme === 'light' ? 'sun' : 'moon'} s="17" />${theme === 'dark' ? 'Dark theme' : theme === 'light' ? 'Light theme' : 'System theme'}</button>
        <button onClick=${signOut}><${I} n="lock" s="17" />Sign out</button>
        <div class="synced"><span class="pulse"></span>Updated ${ago(data.generatedAt)}</div>
      </div>
    </aside>
    ${menu ? html`<div class="scrim" style="z-index:45" onClick=${() => setMenu(false)}></div>` : null}
    <main class="main">
      <div class="top">
        <button class="iconbtn menu-btn" onClick=${() => setMenu(true)} aria-label="Open menu"><${I} n="menu" s="18" /></button>
        <div style="min-width:0"><h1>${title[1]}</h1><div class="sub hide-sm">${SUBS[cur]}</div></div>
        <span class="spacer"></span>
        <label class="search"><${I} n="search" s="16" /><input id="q" value=${q} onInput=${e => setQ(e.target.value)} placeholder=${'Search ' + title[1].toLowerCase() + '  ( / )'} aria-label="Search" /></label>
        <button class="btn hide-sm" onClick=${checkAll} disabled=${checking}><${I} n="refresh" s="15" />${checking ? 'Checking…' : 'Check sites'}</button>
        <button class="btn primary" onClick=${() => setDrawer({ type: 'newClient' })} aria-label="New client"><${I} n="plus" s="16" /><span class="hide-sm">New client</span></button>
      </div>
      <div class="content">
        ${cur === 'overview' ? html`<${Overview} ...${props} />` : null}
        ${cur === 'clients' ? html`<${Clients} ...${props} saveStage=${saveStage} newClient=${() => setDrawer({ type: 'newClient' })} />` : null}
        ${cur === 'websites' ? html`<${Websites} ...${props} />` : null}
        ${cur === 'domains' ? html`<${Domains} ...${props} />` : null}
        ${cur === 'frontdesk' ? html`<${FrontDesk} ...${props} />` : null}
        ${cur === 'activity' ? html`<${Activity} ...${props} />` : null}
      </div>
    </main>
    ${drawer && ((drawer.type === 'client' && dClient) || drawer.type === 'newClient') ? html`<${ClientDrawer} key=${drawer.id || 'new'} ...${props} client=${dClient}
      close=${id => setDrawer(id ? { type: 'client', id } : null)} refresh=${() => load()} />` : null}
    ${drawer && ((drawer.type === 'site' && dSite) || drawer.type === 'newSite') ? html`<${SiteDrawer} key=${drawer.id || 'newsite'} ...${props} site=${dSite} clientId=${drawer.clientId}
      close=${() => setDrawer(null)} refresh=${() => load()} />` : null}
    ${msg ? html`<div class="toast" role="status">${msg}</div>` : null}
  </div>`;
}

render(html`<${App} />`, document.getElementById('root'));
