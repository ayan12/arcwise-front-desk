// Renders the Umar Sardar concept page. Every dynamic value goes through esc().
export const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const I = {
  ig: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.3" cy="6.7" r="1.3" fill="currentColor"/></svg>',
  wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5.5v13l10.5-6.5z"/></svg>',
};

// The E11 route map: Abu Dhabi stations on the left, Dubai on the right. Diagram, not to scale.
function routeMap(areas, route) {
  const byId = Object.fromEntries(areas.map((a) => [a.id, a]));
  const ad = route.ad.map((id, i) => ({ a: byId[id], x: 70 + i * 100 }));
  const dx = route.dxb.map((id, i) => ({ a: byId[id], x: 660 + i * 82 }));
  const y = 150;
  const station = ({ a, x }, i) => {
    const up = i % 2 === 0;
    const label = a.short || a.name.replace(' Island', '').replace(' Estate', '');
    return `<g class="st" data-id="${esc(a.id)}" transform="translate(${x} ${y})">
      <line class="tick" x1="0" y1="0" x2="0" y2="${up ? -34 : 34}"/>
      <circle class="dot" r="11"/><text class="rank" y="5" text-anchor="middle"></text>
      <text class="lbl" y="${up ? -44 : 56}" text-anchor="middle">${esc(label)}</text>
    </g>`;
  };
  return `<svg class="route" viewBox="0 0 1200 270" role="img" aria-labelledby="route-t">
    <title id="route-t">Map of the communities along the E11, from Abu Dhabi to Dubai</title>
    <path class="coast" d="M0 62C40 72 120 46 170 52S300 34 520 64 760 42 860 50 1060 68 1200 54"/>
    <text class="sea-l" x="24" y="30">Arabian Gulf</text>
    <line class="road" x1="40" y1="${y}" x2="430" y2="${y}"/>
    <line class="road far" x1="430" y1="${y}" x2="610" y2="${y}"/>
    <line class="road" x1="610" y1="${y}" x2="1180" y2="${y}"/>
    <g class="e11" transform="translate(520 ${y})"><rect x="-26" y="-15" width="52" height="30" rx="6"/><text y="6" text-anchor="middle">E11</text></g>
    <text class="gap" x="520" y="${y + 44}" text-anchor="middle">About an hour by car</text>
    <text class="city" x="70" y="250">Abu Dhabi</text>
    <text class="city" x="650" y="250">Dubai</text>
    ${ad.map(station).join('')}
    ${dx.map(station).join('')}
  </svg>`;
}

export function renderPage(c, assets) {
  const { site, ledger, launches, reels, proof, goals, tiers, areas, route, plans, after, insights, faqs } = c;
  const igUrl = 'https://ig.me/m/' + site.instagram;
  const contact = site.wa ? { href: 'https://wa.me/' + site.wa + '?text=INVEST', label: 'Message Umar on WhatsApp', icon: I.wa } : { href: igUrl, label: 'Message Umar on Instagram', icon: I.ig };
  const data = { wa: site.wa, ig: site.instagram, launches, goals, tiers: tiers.map(([id, label, min, max]) => [id, label, min, max === Infinity ? 1e12 : max]), areas, plans };
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  const ld = JSON.stringify({ '@context': 'https://schema.org', '@type': 'RealEstateAgent', name: site.name, url: site.url, image: site.url + '/img/umar.webp', areaServed: ['Dubai', 'Abu Dhabi'], identifier: 'BRN ' + site.brn, sameAs: ['https://www.instagram.com/' + site.instagram, site.youtube] }).replace(/</g, '\\u003c');
  const title = 'Umar Sardar, property investment advisor in Dubai and Abu Dhabi';
  const desc = 'Find where to buy between Abu Dhabi and Dubai for a Golden Visa, rental income or growth. Award-winning off-plan advisor, BRN ' + site.brn + '.';
  const chips = (name, items, checked, cls = '') => items.map(([id, l, d], i) => `<label class="chip${cls}"><input type="radio" name="${name}" value="${esc(id)}"${i === checked ? ' checked' : ''}><span>${esc(l)}${d ? `<small>${esc(d)}</small>` : ''}</span></label>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#f5f5f2">
<link rel="canonical" href="${esc(site.url)}/">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(site.url)}/img/hero.webp">
<link rel="icon" href="/img/umar.webp" type="image/webp">
<link rel="preload" href="/fonts/archivo.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${assets.css}">
<script type="application/ld+json">${ld}</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<p class="concept">Concept by Arcwise Studios, not Umar’s official website</p>
<header class="top">
  <div class="wrap bar">
    <a class="brand" href="/">Umar Sardar<small>${esc(site.role)}</small></a>
    <nav id="site-nav" class="nav" aria-label="Main">
      <a href="#match">Where to buy</a><a href="#plan">Payment plans</a><a href="#after">After the sale</a><a href="#insights">Insights</a><a href="#faq">Questions</a>
    </nav>
    <a class="btn btn-sign hide-sm" href="${esc(contact.href)}" target="_blank" rel="noopener">${contact.icon}<span>Message Umar</span></a>
    <button class="menu" type="button" aria-expanded="false" aria-controls="site-nav"><span class="sr">Menu</span><i></i><i></i></button>
  </div>
</header>

<main id="main">
<section class="hx">
  <div class="wrap hx-grid">
    <div class="hx-copy">
      <p class="role">Umar Sardar, property investment advisor. BRN ${esc(site.brn)}</p>
      <h1>Invest in Dubai and Abu Dhabi with the advisor the developers award.</h1>
      <p class="lede">Off-plan launches before they go public, honest numbers and one person from the first shortlist to the keys.</p>
      <ul class="hx-proof">${ledger.slice(0, 3).map(([a, b]) => `<li><b>${esc(a)}</b><span>${esc(b)}</span></li>`).join('')}</ul>
    </div>
    <form class="hx-tool" id="hx" aria-labelledby="hx-t">
      <p class="hx-t" id="hx-t">What’s your budget?</p>
      <output id="hx-amt" for="hx-range">AED 2,000,000</output>
      <input id="hx-range" type="range" min="500000" max="15000000" step="50000" value="2000000" aria-label="Budget in AED">
      <div class="hx-scale"><span>AED 500K</span><span>AED 15M+</span></div>
      <fieldset><legend>Your goal</legend><div class="chips">${chips('hxgoal', goals.map(([id, l]) => [id, l]), 0, ' sm')}</div></fieldset>
      <div class="hx-res" aria-live="polite"><p class="hx-visa" id="hx-visa"></p><ol id="hx-list"></ol></div>
      <a class="btn btn-go" id="hx-send" href="${esc(contact.href)}" target="_blank" rel="noopener">${contact.icon}<span>Send me these options</span></a>
      <p class="copied" id="hx-copied" hidden>Your options are copied. Paste them into the chat.</p>
    </form>
  </div>
  <figure class="hx-media"><img src="/img/difc.webp" width="820" height="860" alt="DIFC towers in Dubai at dusk" fetchpriority="high"></figure>
</section>

<section class="awards">
  <div class="wrap">
    <div class="aw-head"><h2>Awarded by the developers he sells for</h2><p class="lede">Three award nights in 2026, from Majid Al Futtaim, Aldar and the H1 Broker Awards with Emaar.</p></div>
    <div class="aw-grid">
      <figure><img src="/img/award-maf.webp" width="945" height="1269" alt="Umar Sardar holding the Majid Al Futtaim Top Sales Partner award" loading="lazy"><figcaption><b>Top Sales Partner</b>Majid Al Futtaim</figcaption></figure>
      <figure><img src="/img/hero.webp" width="480" height="564" alt="Umar Sardar with four awards at the Aldar Elite Awards" loading="lazy"><figcaption><b>International Market Champion</b>Aldar Elite Awards Q3 2026, 4 awards in one day</figcaption></figure>
      <figure><img src="/img/award-h1.webp" width="818" height="1456" alt="Umar Sardar at the H1 Broker Awards 2026 with Emaar" loading="lazy"><figcaption><b>H1 Broker Awards 2026</b>With Emaar</figcaption></figure>
    </div>
  </div>
</section>

<section class="sec launches" id="launches">
  <div class="wrap">
    <div class="aw-head"><h2>Launches Umar is selling now</h2><p class="lede">Tap one to get the brochure, floor plans and payment plan from Umar directly.</p></div>
    <ul class="ln-grid">${launches.map((l) => `<li class="ln${l.img ? '' : ' ln-text'}">
      ${l.img ? `<img src="${esc(l.img)}" alt="" loading="lazy" width="820" height="1076">` : ''}
      <div class="ln-body"><span class="ln-tag">${esc(l.tag)}</span><h3>${esc(l.name)}</h3><p class="ln-where">${esc(l.where)}</p><p>${esc(l.line)}</p>
      <p class="ln-price">${l.from ? 'From AED ' + esc((l.from / 1e6).toFixed(1)) + 'M' : 'Price on request'}</p>
      <a class="btn btn-line" href="${esc(contact.href)}" target="_blank" rel="noopener" data-ask="${esc(l.name)}">Get the brochure</a></div>
    </li>`).join('')}</ul>
  </div>
</section>

<section id="match" class="hero">
  <div class="wrap hero-top">
    <div class="hero-copy">
      <p class="kicker">Explore every community</p>
      <h2>From Saadiyat to Creek&nbsp;Harbour, matched to your goal.</h2>
      <p class="lede">Answer three questions and the map lights up the communities that fit your goal and budget. Send the shortlist and Umar replies with real units, prices and payment plans.</p>
    </div>
  </div>

  <form id="match-form" class="wrap q">
    <fieldset><legend>What is the property for?</legend><div class="chips">${chips('goal', goals, 0)}</div></fieldset>
    <fieldset><legend>Budget</legend><div class="chips">${chips('tier', tiers.map(([id, l]) => [id, l]), 1, ' sm')}</div></fieldset>
    <fieldset><legend>Emirate</legend><div class="chips">${chips('em', [['Either', 'Either'], ['Dubai', 'Dubai'], ['Abu Dhabi', 'Abu Dhabi']], 0, ' sm')}</div></fieldset>
  </form>

  <div class="map-band">
    <div class="wrap"><div class="map-scroll" tabindex="0" aria-label="Route map, scroll sideways on small screens">${routeMap(areas, route)}</div></div>
  </div>

  <div class="wrap results" aria-live="polite">
    <div class="r-head">
      <h2 id="m-sum">Your shortlist</h2>
      <p id="m-visa" class="visa" hidden></p>
    </div>
    <ol id="m-list" class="picks"></ol>
    <div class="r-act">
      <a class="btn btn-go" id="m-send" href="${esc(contact.href)}" target="_blank" rel="noopener">${contact.icon}<span>Send this shortlist to Umar</span></a>
      <p class="small">A guide based on typical prices and demand. Exact units and availability come with your reply.</p>
      <p class="copied" id="m-copied" hidden>Shortlist copied. Paste it into the chat.</p>
    </div>
  </div>
</section>

<section id="plan" class="sec plan-sec">
  <div class="wrap">
    <div class="head">
      <h2>What you pay, and when</h2>
      <p class="lede">Most off-plan projects let you pay in stages while the building goes up. Set a price and a plan to see the schedule.</p>
    </div>
    <form id="plan-form" class="p-form">
      <label class="field price"><span>Property price in AED</span><input id="p-price" name="price" inputmode="numeric" value="2,000,000" autocomplete="off"></label>
      <input id="p-range" type="range" min="500000" max="15000000" step="50000" value="2000000" aria-label="Property price">
      <fieldset><legend>Payment plan</legend><div class="chips">${plans.map(([n], i) => `<label class="chip sm"><input type="radio" name="plan" value="${i}"${i === 0 ? ' checked' : ''}><span>${esc(n)}</span></label>`).join('')}</div></fieldset>
      <fieldset><legend>Emirate</legend><div class="chips"><label class="chip sm"><input type="radio" name="pem" value="dxb" checked><span>Dubai</span></label><label class="chip sm"><input type="radio" name="pem" value="auh"><span>Abu Dhabi</span></label></div></fieldset>
    </form>
    <p id="p-desc" class="p-desc"></p>
    <ol id="p-line" class="timeline" aria-live="polite"></ol>
    <div class="p-foot"><p id="p-total" class="p-total"></p><p id="p-visa" class="p-visa"></p></div>
    <p class="small">Plans differ by project, and admin fees are extra. This is a guide, not financial advice.</p>
  </div>
</section>

<section id="after" class="sec after-sec">
  <div class="wrap after">
    <div class="after-copy">
      <blockquote><p>“Buying is easy. After-sales is where your agent proves their worth.”</p></blockquote>
      <figure class="me"><img src="/img/umar.webp" width="360" height="360" alt="" loading="lazy"><figcaption>Umar Sardar</figcaption></figure>
      <p>Too many buyers are promised a Golden Visa or a rental return, then hear nothing after the booking. Every client gets the same six steps, from the first shortlist to a tenant or a resale.</p>
    </div>
    <ol class="steps">${after.map(([h, d], i) => `<li><span class="n">${i + 1}</span><h3>${esc(h)}</h3><p>${esc(d)}</p></li>`).join('')}</ol>
  </div>
</section>

<section id="insights" class="sec talk-sec">
  <div class="wrap talk">
    <a class="video" href="${esc(site.youtube)}" target="_blank" rel="noopener">
      <img src="https://i.ytimg.com/vi/${esc(site.youtubeId)}/hqdefault.jpg" width="480" height="360" alt="" loading="lazy">
      <span class="play">${I.play}</span>
      <span class="v-cap">Watch: a Sunday on Saadiyat Island</span>
    </a>
    <div class="talk-copy">
      <h2>Straight answers, not brochures</h2>
      <ul class="reels">${reels.map(([id, t]) => `<li><a href="https://www.instagram.com/reel/${esc(id)}/" target="_blank" rel="noopener"><span class="play">${I.play}</span><span>${esc(t)}</span></a></li>`).join('')}</ul>
      <ul class="topics" hidden>${insights.map(([tag, h, d]) => `<li><h3>${esc(h)}</h3><p>${esc(d)}</p></li>`).join('')}</ul>
      <a class="text-link" href="https://www.instagram.com/${esc(site.instagram)}/" target="_blank" rel="noopener">More market breakdowns on Instagram</a>
    </div>
  </div>
</section>

<section id="faq" class="sec faq-sec">
  <div class="wrap narrow">
    <h2>Questions overseas buyers ask</h2>
    <div class="faq">${faqs.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
  </div>
</section>

<section id="contact" class="sec contact-sec">
  <div class="wrap contact">
    <div class="c-copy">
      <h2>Tell Umar what you’re looking for</h2>
      <p class="lede">He replies within a day with a shortlist of real units, prices and payment plans.</p>
    </div>
    <form id="lead-form" class="c-form" novalidate>
      <div class="row2">
        <label class="field"><span>Your name</span><input id="f-name" name="name" autocomplete="name" maxlength="60" required></label>
        <label class="field"><span>Country you live in</span><input id="f-country" name="country" autocomplete="country-name" maxlength="60"></label>
      </div>
      <div class="row2">
        <label class="field"><span>Goal</span><select id="f-goal" name="goal">${goals.map(([, l]) => `<option>${esc(l)}</option>`).join('')}</select></label>
        <label class="field"><span>Budget</span><select id="f-tier" name="tier">${tiers.map(([, l], i) => `<option${i === 1 ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label>
      </div>
      <label class="field"><span>When are you buying?</span><select id="f-when" name="when"><option>Ready to buy now</option><option>In the next 3 months</option><option>Just researching</option></select></label>
      <p class="err" id="f-err" role="alert"></p>
      <button class="btn btn-go" type="submit">${contact.icon}<span>${site.wa ? 'Send on WhatsApp' : 'Send on Instagram'}</span></button>
      <p class="copied" id="f-copied" hidden>Message copied. Paste it into the chat that just opened.</p>
    </form>
  </div>
</section>
</main>

<footer class="foot">
  <div class="wrap foot-grid">
    <p class="brand">Umar Sardar<small>${esc(site.role)}. BRN ${esc(site.brn)}</small></p>
    <p class="social"><a href="https://www.instagram.com/${esc(site.instagram)}/" target="_blank" rel="noopener">Instagram</a><a href="${esc(site.youtube)}" target="_blank" rel="noopener">YouTube</a></p>
  </div>
  <p class="wrap fine">Figures on this page are a guide, not financial advice. Concept redesign by Arcwise Studios, not the official website.</p>
</footer>
<nav class="mbar" aria-label="Quick actions"><a class="btn btn-line" href="#hx">My budget</a><a class="btn btn-go" href="${esc(contact.href)}" target="_blank" rel="noopener">${contact.icon}<span>Message Umar</span></a></nav>
<a class="fab" href="${esc(contact.href)}" target="_blank" rel="noopener" aria-label="${esc(contact.label)}">${contact.icon}</a>
<script type="application/json" id="site-data">${json}</script>
<script src="${assets.js}" defer></script>
</body>
</html>
`;
}
