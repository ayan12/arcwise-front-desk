// Umar Sardar concept: menu, route-map property match, payment schedule, lead form. No inline scripts (strict CSP).
(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const D = JSON.parse(document.getElementById('site-data').textContent);
  const $ = (s) => document.querySelector(s);
  const clean = (s, n) => String(s || '').replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const aed = (n) => 'AED ' + Math.round(n).toLocaleString('en-US');
  const igUrl = 'https://ig.me/m/' + D.ig;
  const waUrl = (t) => 'https://wa.me/' + D.wa + '?text=' + encodeURIComponent(t);
  const copy = (text, note) => {
    const show = () => { if (note) { note.hidden = false; setTimeout(() => { note.hidden = true; }, 6000); } };
    try { navigator.clipboard.writeText(text).then(show, () => {}); } catch (e) { /* clipboard unavailable */ }
  };

  // menu
  const btn = $('.menu'), nav = $('#site-nav');
  const setMenu = (o) => { btn.setAttribute('aria-expanded', String(o)); nav.classList.toggle('open', o); };
  btn.addEventListener('click', () => setMenu(btn.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  matchMedia('(min-width: 901px)').addEventListener('change', (m) => { if (m.matches) setMenu(false); });

  // property match on the route map
  const mf = $('#match-form'), list = $('#m-list'), sum = $('#m-sum'), visa = $('#m-visa'), send = $('#m-send');
  const stations = [...document.querySelectorAll('.route .st')];
  const tierIdx = (id) => D.tiers.findIndex((t) => t[0] === id);
  let shortlistText = '';
  const match = () => {
    const f = new FormData(mf);
    const goal = D.goals.find((g) => g[0] === f.get('goal')) || D.goals[0];
    const tier = D.tiers[Math.max(0, tierIdx(f.get('tier')))];
    const em = ['Dubai', 'Abu Dhabi', 'Either'].includes(f.get('em')) ? f.get('em') : 'Either';
    const ti = tierIdx(tier[0]);
    const scored = D.areas
      .filter((a) => em === 'Either' || a.em === em)
      .map((a) => {
        const fit = a.tiers.includes(tier[0]) ? 3 : a.tiers.some((t) => Math.abs(tierIdx(t) - ti) === 1) ? 1 : -9;
        const g = a.goals.indexOf(goal[0]);
        return { a, s: fit + (g === -1 ? 0 : 3 - g), stretch: fit === 1 };
      })
      .filter((x) => x.s > 0)
      .sort((x, y) => y.s - x.s)
      .slice(0, 3);
    const rank = Object.fromEntries(scored.map((x, i) => [x.a.id, i + 1]));
    stations.forEach((s) => {
      const r = rank[s.dataset.id];
      s.classList.toggle('on', !!r);
      s.classList.toggle('off', em !== 'Either' && !D.areas.some((a) => a.id === s.dataset.id && a.em === em));
      s.querySelector('.rank').textContent = r ? String(r) : '';
    });
    sum.textContent = scored.length ? 'Your shortlist for ' + goal[1].toLowerCase() + ', ' + tier[1] : 'No typical match';
    if (goal[0] === 'visa' && tier[3] <= 2e6) { visa.textContent = 'The Golden Visa through property starts at AED 2M. These picks work for rent or growth while you plan the step up.'; visa.hidden = false; }
    else if (tier[3] > 2e6) { visa.textContent = 'From AED 2M, your purchase can qualify for the 10-year Golden Visa. Umar confirms eligibility before you book.'; visa.hidden = false; }
    else visa.hidden = true;
    list.replaceChildren(...scored.map(({ a, stretch }, i) => {
      const li = el('li');
      li.append(el('span', 'n', String(i + 1)));
      const d = el('div');
      d.append(el('h3', null, a.name), el('p', 'meta', a.em + '. ' + a.type + (stretch ? '. A stretch for this budget' : '')), el('p', null, a.why));
      li.append(d);
      return li;
    }));
    if (!scored.length) list.append(el('li', 'empty', 'Nothing typical fits this mix, which usually means an off-market or resale opportunity. Send it to Umar and he will look.'));
    shortlistText = ['Hi Umar, INVEST. My shortlist from your website:', '', 'Goal: ' + goal[1], 'Budget: ' + tier[1], 'Emirate: ' + em, '', ...scored.map((x, i) => (i + 1) + '. ' + x.a.name + ' (' + x.a.em + ')'), '', 'Can you send me real units and payment plans?'].join('\n');
    send.href = D.wa ? waUrl(shortlistText) : igUrl;
    const sc = $('.map-scroll'), first = stations.find((s) => rank[s.dataset.id] === 1);
    if (first && sc.scrollWidth > sc.clientWidth) {
      const r = first.getBoundingClientRect(), b = sc.getBoundingClientRect();
      sc.scrollTo({ left: sc.scrollLeft + r.left - b.left - b.width / 2, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  };
  mf.addEventListener('change', match);
  mf.addEventListener('submit', (e) => e.preventDefault());
  send.addEventListener('click', () => { if (!D.wa) copy(shortlistText, $('#m-copied')); });
  match();

  // payment schedule
  const pf = $('#plan-form'), price = $('#p-price'), range = $('#p-range');
  const parse = (v) => Math.min(1e9, Math.max(0, Number(String(v).replace(/[^\d.]/g, '')) || 0));
  const plan = () => {
    const f = new FormData(pf);
    const P = parse(price.value) || 0;
    const p = D.plans[Math.min(D.plans.length - 1, Math.max(0, Number(f.get('plan')) || 0))];
    const dxb = f.get('pem') !== 'auh';
    const fee = P * (dxb ? 0.04 : 0.02);
    const [down, cons, hand, post] = p[2];
    $('#p-desc').textContent = p[1] + '.';
    const stages = [
      ['Booking', down + '% down payment, plus the ' + (dxb ? '4% Dubai Land Department fee' : 'Abu Dhabi registration fee of about 2%'), P * down / 100 + fee, down],
      ['Construction', cons + '% in instalments while the building goes up', P * cons / 100, cons],
    ];
    if (hand) stages.push(['Handover', hand + '% when you get the keys', P * hand / 100, hand]);
    if (post) stages.push(['After handover', post + '% over 24 months, about ' + aed(P * post / 100 / 24) + ' a month', P * post / 100, post]);
    $('#p-line').replaceChildren(...stages.map(([h, d, v, pct]) => {
      const li = el('li');
      li.style.flexGrow = String(Math.max(pct, 24));
      li.append(el('span', 'pct', pct + '%'), el('h3', null, h), el('p', 'amt', aed(v)), el('p', 'what', d));
      return li;
    }));
    $('#p-total').textContent = 'Total ' + aed(P + fee) + ', including the ' + (dxb ? 'land department' : 'registration') + ' fee';
    $('#p-visa').textContent = P >= 2e6 ? 'At this price, the property can qualify for the 10-year Golden Visa.' : 'The Golden Visa through property starts at AED 2,000,000.';
  };
  price.addEventListener('input', () => { range.value = String(parse(price.value)); plan(); });
  price.addEventListener('blur', () => { price.value = parse(price.value).toLocaleString('en-US'); });
  range.addEventListener('input', () => { price.value = Number(range.value).toLocaleString('en-US'); plan(); });
  pf.addEventListener('change', plan);
  pf.addEventListener('submit', (e) => e.preventDefault());
  plan();

  // lead form
  const form = $('#lead-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const name = clean(f.get('name'), 60), country = clean(f.get('country'), 60), goal = clean(f.get('goal'), 40), tier = clean(f.get('tier'), 30), when = clean(f.get('when'), 40);
    const err = $('#f-err');
    if (!name) { err.textContent = 'Add your name so Umar knows who to reply to.'; $('#f-name').focus(); return; }
    err.textContent = '';
    const text = ['Hi Umar, INVEST.', '', 'Name: ' + name, country ? 'Based in: ' + country : null, 'Goal: ' + goal, 'Budget: ' + tier, 'Timeline: ' + when].filter((x) => x !== null).join('\n');
    const url = D.wa ? waUrl(text) : igUrl;
    if (!D.wa) copy(text, $('#f-copied'));
    const w = window.open(url, '_blank', 'noopener,noreferrer');
    if (!w) location.href = url;
  });
})();
