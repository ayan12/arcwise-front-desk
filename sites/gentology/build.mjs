// Static build for the Gentology concept. No dependencies: `node build.mjs`.
//   SITE_URL  base URL used for canonical, OG, sitemap and structured data
//             (default: the official domain, where these pages would live if adopted)
//   SITE_ENV  "concept" (default): every page noindex, robots.txt disallows crawling
//             "production": indexable, robots.txt points to the sitemap
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BRANCHES, HOURS, HAIRCUTS, HAIRCUT_INCLUDES, OTHER_SERVICES, SOCIAL, EMAIL, SOURCE, BRAND } from './src/content.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, 'dist');
const SITE = (process.env.SITE_URL || 'https://www.gentology-barbershop.com').replace(/\/+$/, '');
const ENV = process.env.SITE_ENV === 'production' ? 'production' : 'concept';
const TODAY = new Date().toISOString().slice(0, 10);

const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hash = (s) => createHash('sha256').update(s).digest('hex').slice(0, 10);
const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 'assets'), { recursive: true });
cpSync(join(ROOT, 'public'), OUT, { recursive: true });
const css = read('src/styles.css'), js = read('src/main.js');
const CSS = `/assets/site.${hash(css)}.css`, JS = `/assets/site.${hash(js)}.js`;
writeFileSync(join(OUT, CSS), css);
writeFileSync(join(OUT, JS), js);

const P = (n) => read(`src/partials/${n}.html`);
const SYMBOLS = read('src/symbols.html');
const pageUrl = (slug) => (slug ? `${SITE}/${slug}/` : `${SITE}/`);
const hrefOf = (slug) => (slug ? `/${slug}/` : '/');
const addr = (b) => `${b.street}, ${b.area}`;
const telText = (b) => esc(b.tel).replace(/ /g, '&nbsp;');

/* ---------- images ---------- */
const IMG = {
  a: 'Panelled fireplace wall with a gilt-framed portrait, candle sconces and a gramophone',
  b: 'Arched mahogany doorway into the barber room, with leather chairs and stained-glass lamps',
  c: 'Carved wooden clock cabinet with a gold clock face and a curved glass case',
};
const img = (k, { lazy = true, alt } = {}) =>
  `<img src="/media/${k}-360.webp" width="360" height="640" decoding="async"${lazy ? ' loading="lazy"' : ' fetchpriority="high"'} alt="${esc(alt ?? IMG[k])}"`;

/* ---------- structured data (published facts only) ---------- */
const ORG_ID = `${SITE}/#organization`;
const hoursSpec = () => {
  const groups = new Map();
  for (const h of HOURS) {
    const k = `${h.open}-${h.close}`;
    if (!groups.has(k)) groups.set(k, { '@type': 'OpeningHoursSpecification', dayOfWeek: [], opens: h.open, closes: h.close });
    groups.get(k).dayOfWeek.push(h.schema);
  }
  return [...groups.values()];
};
const shopNode = (b) => ({
  '@type': 'BarberShop',
  '@id': `${pageUrl(b.slug)}#barbershop`,
  name: b.full,
  url: pageUrl(b.slug),
  telephone: b.e164,
  email: EMAIL,
  image: `${SITE}/media/og.jpg`,
  address: { '@type': 'PostalAddress', streetAddress: addr(b), addressLocality: 'Jakarta', addressRegion: 'DKI Jakarta', postalCode: b.postal, addressCountry: 'ID' },
  openingHoursSpecification: hoursSpec(),
  parentOrganization: { '@id': ORG_ID },
});
const orgNode = () => ({
  '@type': 'Organization',
  '@id': ORG_ID,
  name: BRAND.name,
  url: `${SITE}/`,
  email: EMAIL,
  founder: BRAND.founders.map((name) => ({ '@type': 'Person', name })),
  sameAs: [SOCIAL.facebook, SOCIAL.instagram],
  subOrganization: BRANCHES.map((b) => ({ '@id': `${pageUrl(b.slug)}#barbershop` })),
});

/* ---------- shared chrome ---------- */
const NAV = [['tariff', 'Tariff'], ['work', 'The work'], ['waiting-list', 'Waiting list'], ['reviews', 'Reviews'], ['parlour', 'The parlour'], ['visit', 'Branches']];
function head({ title, description, slug, graph }) {
  const url = pageUrl(slug);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="${ENV === 'production' ? 'index, follow' : 'noindex, nofollow'}">
<link rel="canonical" href="${url}">
<meta name="theme-color" content="#10261F">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Gentology Barbershop">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/media/og.jpg">
<meta property="og:image:width" content="600">
<meta property="og:image:height" content="315">
<meta property="og:image:alt" content="${esc(IMG.b)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;0,6..96,700;1,6..96,400;1,6..96,500&family=Poiret+One&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${CSS}">
<script type="application/ld+json">${json({ '@context': 'https://schema.org', '@graph': graph })}</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${SYMBOLS}`;
}
function header({ home, branch }) {
  const base = home ? '' : '/';
  const links = NAV.map(([id, label]) => `<a href="${base}#${id}">${label}</a>`).join('');
  const cta = branch
    ? `<a class="call" href="tel:${branch.e164}">Ring ${telText(branch)}</a>`
    : `<a class="call" href="#waiting-list">Ring to join the list</a>`;
  return `<header class="top">
  <div class="wrap">
    <a class="mark" href="${home ? '#main' : '/'}" aria-label="${home ? 'Gentology, back to top' : 'Gentology home'}"><svg style="color:var(--brass-hi)" aria-hidden="true"><use href="#emblem"/></svg><span>Gentology</span></a>
    <nav aria-label="Main">${links}</nav>
    ${cta}
  </div>
</header>`;
}
function footer() {
  return `<footer>
  <div class="wrap">
    <span>Gentology Barbershop · Jakarta · <a href="/cideng/">Cideng</a> · <a href="/tanjung-duren/">Tanjung Duren</a> · <a href="/cipete/">Silverhawk Cipete</a></span>
    <span>Concept redesign by Ayan · not the official Gentology website. Details from <a href="${SOURCE}" rel="noopener" target="_blank">gentology-barbershop.com</a>.</span>
  </div>
</footer>
<div class="tray" id="tray" role="region" aria-label="Parlour music">
  <button type="button" class="tray-play" id="trayPlay" aria-pressed="false" aria-label="Play parlour music"><svg viewBox="0 0 24 24" aria-hidden="true"><path class="i-play" d="M8 5l11 7-11 7z"/><path class="i-pause" d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg></button>
  <div class="tray-info"><span class="tray-k">Parlour radio</span><span class="tray-t" id="trayTitle" aria-live="polite">Cideng Stomp</span></div>
  <button type="button" class="tray-next" id="trayNext" aria-label="Next tune"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5l9 7-9 7zM16 5h3v14h-3z"/></svg></button>
  <label class="tray-vol"><span class="vh">Volume</span><input type="range" id="trayVol" min="0" max="100" value="60"></label>
</div>
<script src="${JS}" defer></script>
</body>
</html>
`;
}

/* ---------- sections ---------- */
const svgDeco = `<svg class="deco base" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><g class="rays"></g><g class="steps"></g></svg>
  <svg class="deco lit" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><g class="rays"></g><g class="steps"></g></svg>`;

function tariff() {
  const row = (s) => `<li><div class="t-row"><span class="t-name">${esc(s.name)}</span><span class="t-dots" aria-hidden="true"></span><span class="t-price">${esc(s.price)}${s.confirm ? '<sup aria-hidden="true">*</sup><span class="vh"> (see the price note below)</span>' : ''}</span></div>${s.note ? `<p class="t-note">${esc(s.note)}</p>` : ''}</li>`;
  return `<section class="sec panel" id="tariff" aria-labelledby="t-h">
  <div class="wrap">
    <div class="head reveal">
      <p class="sign">The tariff</p>
      <h2 id="t-h">Every head is read <em>before</em> it is cut.</h2>
      <p>Different head shapes need different approaches, so each haircut starts with a head-reading. Ask for a low, mid or high fade.</p>
    </div>
    <div class="card reveal">
      <div class="c-head"><p class="sign">Gentology</p><p>Services, in Indonesian rupiah</p></div>
      <div class="t-group">
        <h3>Signature haircuts</h3>
        <ul class="tariff">
          ${HAIRCUTS.map(row).join('\n          ')}
          <li class="t-add"><div class="t-row"><span class="t-name">Add a hair wash to either haircut</span><span class="t-dots" aria-hidden="true"></span><span class="t-price">+ IDR 10k</span></div></li>
        </ul>
        <p class="t-incl">Both signature haircuts include <b>${HAIRCUT_INCLUDES.slice(0, -1).join('</b>, <b>')}</b> and <b>${HAIRCUT_INCLUDES.at(-1)}</b>.</p>
      </div>
      <div class="t-group">
        <h3>Other services</h3>
        <ul class="tariff">
          ${OTHER_SERVICES.map(row).join('\n          ')}
        </ul>
      </div>
      <p class="t-foot"><sup>*</sup> Gentology's services page lists IDR 90k and IDR 80k for the signature haircuts without marking which price belongs to which cut; they are shown here in the order published. The hair wash is listed there as "add 10k" on the signature haircuts only. Please confirm the price when you ring your branch.</p>
    </div>
  </div>
</section>`;
}

const steps = `<ol class="steps">
        <li><div><b>Ring the branch</b><span>Ask the store manager for your waiting-list number and estimated time.</span></div></li>
        <li><div><b>Expect some give</b><span>The estimated time can move by up to an hour either way.</span></div></li>
        <li><div><b>Ring again if it is a while away</b><span>Joined more than four hours ahead? It is recommended to ring again at least an hour before your estimated time.</span></div></li>
      </ol>`;
function callCard(b) {
  // b given: static card for one branch. Otherwise an empty card filled by the branch buttons.
  return `<div class="dispenser">
        <div class="slot" aria-hidden="true"></div>
        <div class="ticket-clip">
          <div class="ticket out${b ? '' : ' blank'}" id="ticket" aria-live="polite">
            <p class="tag">Gentology · Waiting list by phone</p>
            <p class="br" id="tBr">${b ? esc(b.name) : 'Choose a branch'}</p>
            <p class="addr" id="tAddr">${b ? esc(addr(b)) : 'and its phone number will appear here'}</p>
            <div class="perf"></div>
            <p class="ring">Ring for your number and estimated time</p>
            <a class="tel" id="tTel" href="${b ? `tel:${b.e164}` : '#'}"${b ? '' : ' tabindex="-1" aria-hidden="true"'}>${b ? telText(b) : '—'}</a>
            <p class="fine">This card is not a queue ticket. Numbers are only given by the store manager on the call.</p>
          </div>
        </div>
      </div>`;
}
function waitingList(branch) {
  const picker = branch ? '' : `<div class="branches" role="group" aria-label="Choose a branch">
        ${BRANCHES.map((b, i) => `<button type="button" data-b="${i}" aria-pressed="false">${esc(b.name)}</button>`).join('\n        ')}
      </div>
      <script type="application/json" id="branch-data">${json(BRANCHES.map((b) => ({ name: b.name, address: addr(b), tel: b.tel, e164: b.e164 })))}</script>`;
  return `<section class="sec" id="waiting-list" aria-labelledby="w-h">
  <div class="wrap wl">
    <div class="reveal">
      <p class="sign" style="font-size:14px;color:var(--brass)">How booking works</p>
      <h2 id="w-h" style="margin-top:14px">There are no time slots. <em>There is the list.</em></h2>
      <p class="lead">Gentology runs a waiting list, not appointments, and <b>it is kept by phone</b>. ${branch ? `Ring the ${esc(branch.name)} branch` : 'Ring your branch'} and the store manager puts your name on the board. There is no online booking on this site.</p>
      ${steps}
      <p class="wl-src">From Gentology's <a href="${SOURCE}/how-to-book" rel="noopener" target="_blank">How to book</a> page.</p>
    </div>
    <div class="reveal">
      ${picker}
      ${callCard(branch)}
    </div>
  </div>
</section>`;
}
const rules = (withLoyalty) => {
  let s = P('rules').replace('<section class="sec panel" aria-labelledby="r-h">', '<section class="sec panel" id="house-rules" aria-labelledby="r-h">');
  if (withLoyalty) s = s.replace(/  <\/div>\n<\/section>\n?$/, `${P('loyalty')}  </div>\n</section>\n`);
  return s;
};
const parlour = () => P('parlour').replace(/\{\{IMG_([abc])\}\} alt="[^"]*"/g, (_, k) => img(k));

function hoursTable() {
  const to12 = (t) => { const h = +t.slice(0, 2); return h === 12 ? '12pm' : h > 12 ? `${h - 12}pm` : `${h}am`; };
  return `<table id="hours">
          <caption class="sign" style="text-align:left;font-size:14px;color:var(--brass);caption-side:top">Opening hours, all branches</caption>
          <tbody>${HOURS.map((h) => `<tr data-d="${h.d}" data-o="${+h.open.slice(0, 2)}" data-c="${+h.close.slice(0, 2)}"><th scope="row">${h.day}</th><td>${to12(h.open)} – ${to12(h.close)}</td></tr>`).join('\n          ')}</tbody>
        </table>`;
}
function branchCard(b, here) {
  return `<div class="bcard reveal${here ? ' here' : ''}"><h3 class="h4"><a href="${hrefOf(b.slug)}" style="text-decoration:none;color:inherit"${here ? ' aria-current="page"' : ''}>${esc(b.name)}</a></h3><address>${esc(addr(b))}, ${b.postal}</address>
          <div class="acts"><a href="tel:${b.e164}">${telText(b)}</a><a href="${esc(b.maps)}" target="_blank" rel="noopener">Directions<span class="vh"> to ${esc(b.name)} (opens Google Maps)</span></a></div></div>`;
}
function visit(current) {
  return `<section class="sec panel" id="visit" aria-labelledby="v-h">
  <div class="wrap">
    <div class="head reveal">
      <p class="sign">Branches &amp; hours</p>
      <h2 id="v-h">${current ? 'All three <em>parlours.</em>' : 'Three parlours. <em>Same chairs, same standard.</em>'}</h2>
    </div>
    <div class="visit">
      <div class="hours reveal">
        ${hoursTable()}
        <p class="now" id="now">&nbsp;</p>
        <p class="fine">Last order one hour before closing.</p>
      </div>
      <div class="cards">
        ${(current ? [current, ...BRANCHES.filter((b) => b !== current)] : BRANCHES).map((b) => branchCard(b, b === current)).join('\n        ')}
        <p style="font-size:15px;color:var(--ivory-dim);margin-top:6px">Write to us: <a href="mailto:${EMAIL}">${EMAIL}</a> · <a href="${SOCIAL.instagram}" target="_blank" rel="noopener">Instagram</a> · <a href="${SOCIAL.facebook}" target="_blank" rel="noopener">Facebook</a></p>
      </div>
    </div>
  </div>
</section>`;
}


/* ---------- the work: one fade, frame by frame (photos from Gentology's own "fade progress" story) ---------- */
const FADE = [
  ['fade-1', 'Read and section', 'The guide line goes in first, so the fade has somewhere to land.'],
  ['fade-2', 'Take the sides down', 'Clippers open from the bottom, a little at a time.'],
  ['fade-3', 'Blend it out', 'Skin to short, short to length, with no line left behind.'],
  ['fade-4', 'Shape the top', 'The length on top is cut to sit with the fade, not against it.'],
  ['fade-5', 'The finish', 'Styled with pomade and checked from every side before you stand up.'],
];
function work() {
  return `<section class="sec" id="work" aria-labelledby="wk-h">
  <div class="wrap">
    <div class="head reveal">
      <p class="sign">The work</p>
      <h2 id="wk-h">One fade, <em>start to finish.</em></h2>
      <p>Five frames from a real cut in the chair. Tap a step, or drag along the strip, and watch it come together.</p>
    </div>
    <div class="fade reveal" id="fade">
      <figure class="fade-stage">
        ${FADE.map(([f, t], i) => `<img src="/media/${f}.webp" alt="Fade, step ${i + 1}: ${esc(t)}" width="477" height="596" loading="lazy"${i === 0 ? ' class="on"' : ''}>`).join('\n        ')}
        <figcaption class="fade-credit">Fade by Genzi Aditya</figcaption>
      </figure>
      <p class="fade-now" id="fadeNow" aria-live="polite"><b>1. ${esc(FADE[0][1])}</b> ${esc(FADE[0][2])}</p>
      <div class="fade-side">
        <ol class="fade-steps" role="tablist" aria-label="Fade steps">
          ${FADE.map(([, t, d], i) => `<li><button type="button" role="tab" aria-selected="${i === 0}" data-i="${i}"><span class="n">${i + 1}</span><span><b>${esc(t)}</b><span>${esc(d)}</span></span></button></li>`).join('\n          ')}
        </ol>
        <label class="fade-scrub"><span class="vh">Scrub through the fade</span><input type="range" min="0" max="${FADE.length - 1}" step="1" value="0" id="fadeRange"></label>
        <div class="fade-also">
          <img src="/media/barber-at-work.webp" alt="A Gentology barber in waistcoat and hat working a taper with clippers" width="477" height="596" loading="lazy">
          <p>Waistcoats, ties and a proper taper. Every barber works to the same standard at all three branches.</p>
        </div>
      </div>
    </div>
  </div>
</section>`;
}

/* ---------- reviews: Google ratings, checked 2026-11-03 ---------- */
const RATINGS = [
  { name: 'Cideng', rating: 4.7, count: 928, placeId: 'ChIJeUivafH2aS4RfrUTqt1AZAM' },
  { name: 'Tanjung Duren', rating: 4.8, count: 453, placeId: 'ChIJIXQ7iCz3aS4RhSJFT7oYrqc' },
  { name: 'Silverhawk Cipete', rating: 4.7, count: 35, placeId: 'ChIJJ2xw3I_vaS4RR59d7Dqo4SY' },
];
const THEMES = [
  ['chair', 'The room', 'An authentic British parlour: wood, leather chairs and old music. “A step back in time.”'],
  ['clipper', 'The fade', 'Clean, sharp fades, and a barber who takes his time over the detail.'],
  ['towel', 'The extras', 'Hair wash, hot towel and head massage, included even on the basic cut.'],
  ['vest', 'The barbers', 'Friendly, professional, and every one of them in a suit or waistcoat.'],
  ['razor', 'The shave', 'Straight-razor shaves that handle thick beards properly.'],
  ['coin', 'The price', 'Less than the mall nearby, with far more care.'],
];
const ICON = {
  chair: '<path d="M7 3h10v7H7zM5 10h14v3H5zM7 13v5M17 13v5M5 21h4M15 21h4M9 18h6"/>',
  clipper: '<path d="M8 3h8l1 5H7zM7 8h10v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2zM10 12v5M14 12v5M8 3v2M11 3v2M14 3v2"/>',
  towel: '<path d="M4 6c0-1.7 1.3-3 3-3h10v14H7a3 3 0 0 1-3-3zM4 14V6M17 3a3 3 0 0 1 3 3v11h-3M8 21c2-1 6-1 8 0"/>',
  vest: '<path d="M8 3l4 5 4-5M8 3L5 6v15h6V8M16 3l3 3v15h-6V8M12 13h.01M12 16h.01"/>',
  razor: '<path d="M3 17l9-9 4 4-9 9H3zM12 8l3-3a2 2 0 0 1 3 0l1 1a2 2 0 0 1 0 3l-3 3M6 18l2-2"/>',
  coin: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5.5"/><path d="M12 9v6M10.5 10.5h2.2a1 1 0 0 1 0 2h-1.4a1 1 0 0 0 0 2H13.5"/>',
};
function gauge(r) {
  // a brass dial from 1 to 5 stars; the needle swings to the rating when it scrolls into view
  const ticks = Array.from({ length: 41 }, (_, k) => {
    const a = Math.PI * (1 - k / 40), big = k % 10 === 0, r0 = big ? 62 : 68;
    return `<line x1="${(80 + Math.cos(a) * r0).toFixed(1)}" y1="${(84 - Math.sin(a) * r0).toFixed(1)}" x2="${(80 + Math.cos(a) * 74).toFixed(1)}" y2="${(84 - Math.sin(a) * 74).toFixed(1)}"${big ? ' class="big"' : ''}/>`;
  }).join('');
  const nums = [1, 2, 3, 4, 5].map((n, k) => { const a = Math.PI * (1 - k / 4); return `<text x="${(80 + Math.cos(a) * 50).toFixed(1)}" y="${(88 - Math.sin(a) * 50).toFixed(1)}">${n}</text>`; }).join('');
  const deg = ((r.rating - 1) / 4) * 180 - 90;
  return `<svg class="dial" viewBox="0 0 160 96" aria-hidden="true"><path class="arc" d="M6 84a74 74 0 0 1 148 0"/><g class="ticks">${ticks}</g><g class="nums">${nums}</g>
    <g class="needle" style="--deg:${deg.toFixed(1)}deg"><path d="M80 84L78 30l2-8 2 8z"/></g><circle cx="80" cy="84" r="6" class="hub"/></svg>`;
}
function reviews() {
  const total = RATINGS.reduce((n, r) => n + r.count, 0);
  const avg = (RATINGS.reduce((n, r) => n + r.rating * r.count, 0) / total).toFixed(1);
  const star = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>';
  return `<section class="sec panel rvx" id="reviews" aria-labelledby="rv-h">
  <div class="rvx-glow" aria-hidden="true"></div>
  <div class="wrap">
    <p class="sign rvx-sign">What gentlemen say</p>
    <div class="rvx-top">
      <div class="medal reveal" role="img" aria-label="${avg} out of 5 stars from ${total} Google reviews">
        <div class="medal-ring"><span class="medal-n">${avg}</span><span class="medal-stars">${star.repeat(5)}</span></div>
        <p class="medal-c"><b class="odo" data-to="${total}">0</b> reviews on Google</p>
      </div>
      <div class="rvx-copy reveal">
        <h2 id="rv-h">Twelve years of <em>gentlemen leaving happy.</em></h2>
        <p>Since 2014, three parlours, more than 25,000 friends on Instagram, and one of the best-rated barbershops in Jakarta. Read every review yourself, then come and see why.</p>
      </div>
    </div>
    <div class="dials">
      ${RATINGS.map((r, k) => `<a class="dialcard reveal" style="--d:${k * 0.15}s" href="https://search.google.com/local/reviews?placeid=${r.placeId}" target="_blank" rel="noopener">
        ${gauge(r)}
        <span class="dc-score">${r.rating.toFixed(1)}</span>
        <span class="dc-name">${esc(r.name)}</span>
        <span class="dc-count">${r.count.toLocaleString('en-US')} reviews <span aria-hidden="true">↗</span><span class="vh"> (opens Google)</span></span>
      </a>`).join('\n      ')}
    </div>
    <h3 class="rvx-h3 reveal">What they write about, again and again</h3>
    <ul class="praise">
      ${THEMES.map(([ic, t, d], k) => `<li class="reveal" style="--d:${(k % 3) * 0.1}s"><span class="pi"><svg viewBox="0 0 24 24" aria-hidden="true">${ICON[ic]}</svg></span><b>${esc(t)}</b><span>${esc(d)}</span></li>`).join('\n      ')}
    </ul>
    <p class="fine rvx-fine">Ratings from Google, November 2026. Themes summarised from customers’ Google reviews.</p>
  </div>
</section>`;
}

/* ---------- pages ---------- */
function homePage() {
  const graph = [orgNode(), { '@type': 'WebSite', '@id': `${SITE}/#website`, url: `${SITE}/`, name: BRAND.name, publisher: { '@id': ORG_ID } }, ...BRANCHES.map(shopNode)];
  return head({
    title: 'Gentology Barbershop Jakarta · Fade specialists in a 1920s parlour',
    description: 'British-style barbering and fades in a Roaring Twenties parlour. Three Jakarta branches: Cideng, Tanjung Duren and Silverhawk Cipete. Ring your branch to join the waiting list.',
    slug: '', graph,
  }) + `
${header({ home: true })}
<main id="main" tabindex="-1">
<section class="hero" id="hero" aria-labelledby="hero-h">
  ${svgDeco}
  <div class="hero-in">
    <svg class="emblem" aria-hidden="true"><use href="#emblem"/></svg>
    <h1 id="hero-h"><span class="vh">Gentology Barbershop</span><span aria-hidden="true">G</span><span aria-hidden="true">e</span><span aria-hidden="true">n</span><span aria-hidden="true">t</span><span aria-hidden="true">o</span><span aria-hidden="true">l</span><span aria-hidden="true">o</span><span aria-hidden="true">g</span><span aria-hidden="true">y</span></h1>
    <p class="sub">The craftsmanship of British barbering tradition, kept in a 1920s parlour.</p>
    <p class="meta">Fade specialists. Detail oriented. Three branches across Jakarta: <a href="/cideng/">Cideng</a>, <a href="/tanjung-duren/">Tanjung Duren</a> and <a href="/cipete/">Silverhawk Cipete</a>.</p>
    <div class="ctas">
      <a class="btn" href="#waiting-list">Ring to join the waiting list</a>
      <a class="btn line" href="#tariff">Read the tariff</a>
    </div>
  </div>
</section>
${tariff()}
${work()}
${waitingList()}
${reviews()}
${rules(true)}
${parlour()}
${P('pomade')}
${P('founders')}
${visit()}
</main>
` + footer();
}

function branchPage(b) {
  const others = BRANCHES.filter((o) => o !== b);
  const graph = [
    shopNode(b),
    { '@type': 'Organization', '@id': ORG_ID, name: BRAND.name, url: `${SITE}/`, sameAs: [SOCIAL.facebook, SOCIAL.instagram] },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Gentology Barbershop', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: b.name, item: pageUrl(b.slug) },
    ] },
  ];
  return head({
    title: `Gentology ${b.name} · Barbershop in ${b.area}`,
    description: `Fades and signature haircuts in a 1920s parlour at ${b.street}, ${b.area.split(',')[0]}. Ring ${b.tel} to join the Gentology ${b.name} waiting list.`,
    slug: b.slug, graph,
  }) + `
${header({ branch: b })}
<main id="main" tabindex="-1">
<section class="hero branch" id="hero" aria-labelledby="hero-h">
  ${svgDeco}
  <div class="hero-in">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Gentology</a> · <span aria-current="page">${esc(b.name)}</span></nav>
    <h1 id="hero-h"><small>Gentology Barbershop </small>${esc(b.name)}</h1>
    <p class="sub">${esc(b.lede)}</p>
    <div class="ctas">
      <a class="btn" href="tel:${b.e164}">Ring ${telText(b)}</a>
      <a class="btn line" href="${esc(b.maps)}" target="_blank" rel="noopener">Directions<span class="vh"> (opens Google Maps)</span></a>
    </div>
  </div>
</section>
<section class="sec" aria-labelledby="loc-h">
  <div class="wrap local">
    <div class="reveal">
      <p class="sign" style="font-size:14px;color:var(--brass)">The ${esc(b.name)} branch</p>
      <h2 id="loc-h" style="margin-top:12px">A 1920s parlour for <em>${esc(b.near)}.</em></h2>
      <p>Same standard as every Gentology branch: a head-reading before each signature haircut, fades crafted low, mid or high on request, hands sanitised before every service and a disposable razor for every shave.</p>
      <dl>
        <dt>Address</dt><dd>${esc(b.street)}<br>${esc(b.area)} ${b.postal}</dd>
        <dt>Phone</dt><dd><a href="tel:${b.e164}">${telText(b)}</a></dd>
        <dt>Booking</dt><dd>Waiting list by phone</dd>
        <dt>Hours</dt><dd><a href="#visit">See opening hours</a></dd>
      </dl>
    </div>
    <figure class="arch mid reveal"><div class="win">${img(b.img, { alt: `${IMG[b.img]}, inside a Gentology parlour` })}></div><figcaption>Inside a Gentology parlour</figcaption></figure>
  </div>
</section>
${waitingList(b)}
${tariff()}
${rules(false)}
<section class="sec" aria-labelledby="more-h">
  <div class="wrap">
    <div class="head reveal">
      <p class="sign">More from Gentology</p>
      <h2 id="more-h">The pomade, the parlour <em>and the other branches.</em></h2>
      <p>Read about the <a href="/#pomade">in-house beeswax pomade</a>, <a href="/#parlour">the Roaring Twenties parlour</a> and the <a href="/#house-rules">sixth haircut on the house</a>, or visit ${others.map((o) => `<a href="${hrefOf(o.slug)}">${esc(o.name)}</a>`).join(' and ')}.</p>
    </div>
  </div>
</section>
${visit(b)}
</main>
` + footer();
}

/* ---------- write ---------- */
const pages = [{ slug: '', html: homePage() }, ...BRANCHES.map((b) => ({ slug: b.slug, html: branchPage(b) }))];
for (const p of pages) {
  const dir = join(OUT, p.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), p.html);
}
writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${pageUrl(p.slug)}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n')}
</urlset>
`);
writeFileSync(join(OUT, 'robots.txt'), ENV === 'production'
  ? `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`
  : `# Concept build: not for indexing. Build with SITE_ENV=production to open it up.\nUser-agent: *\nDisallow: /\n`);
console.log(`built ${pages.length} pages · ${ENV} · ${SITE} · ${CSS} ${JS}`);
