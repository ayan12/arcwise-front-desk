// Builds public/media/gentology-barbers-book.pdf (A4, 6 pages) from src/book.mjs.
// Run locally: FONTS=/path/to/@fontsource node book-pdf.mjs   (needs Playwright; not part of the site build)
import { writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { FAVOURITES, LENGTHS, SIDES, NECKLINES, DETAILS, BEARDS, fadeSvg, neckSvg, NECK_DEFS } from './src/book.mjs';
import { BRANCHES, HOURS, HAIRCUTS, HAIRCUT_INCLUDES } from './src/content.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const F = process.env.FONTS;
const font = (fam, file, w, st = 'normal') => `@font-face{font-family:"${fam}";src:url("${pathToFileURL(join(F, file)).href}") format("woff2");font-weight:${w};font-style:${st}}`;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const emblem = readFileSync(join(ROOT, 'src/symbols.html'), 'utf8');
const t12 = (x) => { const h = +x.slice(0, 2); return h === 12 ? '12pm' : h > 12 ? `${h - 12}pm` : `${h}am`; };

const head = (title, sub, n) => `<header class="ph"><span>Gentology Barbershop</span><span>The Barber’s Book · ${n} / 6</span></header>
  <h2>${title}</h2>${sub ? `<p class="lede">${sub}</p>` : ''}`;
const styleList = (l) => `<section class="len"><h3>${esc(l.name)}</h3><ul>${l.styles.map(([n, d]) => `<li><b>${esc(n)}</b><span>${esc(d)}</span></li>`).join('')}</ul></section>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${font('Bodoni Moda', 'bodoni-moda/files/bodoni-moda-latin-400-normal.woff2', 400)}
${font('Bodoni Moda', 'bodoni-moda/files/bodoni-moda-latin-500-normal.woff2', 500)}
${font('Bodoni Moda', 'bodoni-moda/files/bodoni-moda-latin-600-normal.woff2', 600)}
${font('Bodoni Moda', 'bodoni-moda/files/bodoni-moda-latin-400-italic.woff2', 400, 'italic')}
${font('Poiret One', 'poiret-one/files/poiret-one-latin-400-normal.woff2', 400)}
@page{size:A4;margin:0}
*{box-sizing:border-box;margin:0}
:root{--wall:#10261F;--brass:#C6A15A;--hi:#E3C886;--ivory:#ECE2C9;--dim:#BDB39C;--fd-hair:#C6A15A;--fd-skin:#1E3A31}
body{font-family:"Bodoni Moda",serif;color:var(--ivory);background:var(--wall);-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:210mm;height:297mm;position:relative;overflow:hidden;padding:20mm 17mm 16mm;page-break-after:always;
  background:radial-gradient(ellipse 80% 50% at 50% 0%,#1d3a30,transparent 70%),var(--wall)}
.page::before{content:"";position:absolute;inset:8mm;border:1px solid var(--brass);pointer-events:none}
.page::after{content:"";position:absolute;inset:9.6mm;border:.5px solid rgba(198,161,90,.5);pointer-events:none}
.ph{display:flex;justify-content:space-between;font-family:"Poiret One";letter-spacing:.22em;text-transform:uppercase;font-size:8.5pt;color:var(--brass);border-bottom:.5px solid rgba(198,161,90,.5);padding-bottom:3mm;margin-bottom:9mm}
h2{font-weight:400;font-size:30pt;line-height:1.05;color:var(--ivory)}
h2 em{font-style:italic;color:var(--hi)}
.lede{color:var(--dim);font-size:11pt;line-height:1.5;margin-top:3mm;max-width:150mm}
h3{font-family:"Poiret One";font-weight:400;letter-spacing:.2em;text-transform:uppercase;color:var(--hi);font-size:12pt;border-bottom:.5px solid rgba(198,161,90,.45);padding-bottom:2mm;margin:8mm 0 3.5mm}
.sign{font-family:"Poiret One";letter-spacing:.3em;text-transform:uppercase}
/* cover */
.cover{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.cover svg.em{width:34mm;height:43mm;color:var(--hi)}
.cover .k{color:var(--brass);font-size:11pt;margin-top:10mm}
.cover h1{font-family:"Poiret One";font-weight:400;font-size:46pt;letter-spacing:.12em;color:var(--hi);margin-top:5mm;line-height:1.1}
.cover .s{font-style:italic;font-size:15pt;margin-top:6mm}
.cover .rays{position:absolute;inset:0;width:100%;height:100%;z-index:0;opacity:.45}.cover>*:not(.rays){position:relative;z-index:1}
.cover .foot{position:absolute!important;left:0;right:0;bottom:22mm;font-size:10pt;color:var(--dim)}
.cover .foot b{color:var(--ivory);font-weight:500}
/* favourites */
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:5mm;margin-top:8mm}
.steps div{border-top:1px solid var(--brass);padding-top:3mm}
.steps b{font-family:"Bodoni Moda";font-size:20pt;color:var(--brass);font-weight:400;display:block}
.steps p{font-size:10.5pt;line-height:1.45}
.fav{display:grid;grid-template-columns:1fr;gap:0;margin-top:2mm}
.fav article{display:grid;grid-template-columns:50mm 1fr;gap:6mm;padding:6.5mm 0;border-bottom:.5px solid rgba(198,161,90,.35)}
.fav h4{font-weight:500;font-size:17pt;color:var(--ivory)}
.fav .a{font-style:italic;color:var(--hi);font-size:10pt}
.fav p{font-size:11.8pt;line-height:1.5}
.fav .p{font-size:9.5pt;color:var(--dim);margin-top:1.5mm}
/* lists */
.len ul{list-style:none;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:3mm 9mm}
.len li b{display:block;font-weight:500;font-size:12pt}
.len li span{color:var(--dim);font-size:10pt;line-height:1.38}
/* drawings */
.grid{display:grid;gap:4mm}
.g3{grid-template-columns:repeat(3,1fr)}.g5{grid-template-columns:repeat(5,1fr)}
.fig{border:.5px solid rgba(198,161,90,.45);padding:3mm;text-align:center}
.fig svg{width:26mm;height:auto;display:block;margin:0 auto 2mm}
.g5 .fig svg{width:22mm}
.fig b{display:block;font-weight:500;font-size:11pt}
.fig span{color:var(--dim);font-size:8.8pt;line-height:1.35;display:block;margin-top:1mm}
.fd-line{fill:none;stroke:var(--hi);stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
.fd-ear{fill:var(--fd-skin);stroke:var(--hi);stroke-width:1.2}
.nk-neck,.nk-skin{fill:var(--fd-skin);stroke:var(--hi);stroke-width:1.4}.nk-hair{fill:var(--fd-hair)}
.chips{display:flex;flex-wrap:wrap;gap:2.5mm}
.chips span{border:.5px solid rgba(198,161,90,.6);padding:1.8mm 3.2mm;font-size:10.5pt}
.two{display:grid;grid-template-columns:1fr 1fr;gap:8mm}
.ticket{background:var(--ivory);color:#1B1611;padding:7mm 7mm 6mm;margin-top:6mm;position:relative}
.ticket::before{content:"";position:absolute;inset:2.2mm;border:.5px solid #9C7E44}
.ticket h4{font-family:"Poiret One";letter-spacing:.24em;text-transform:uppercase;font-weight:400;color:#6E5525;text-align:center;font-size:11pt}
.ticket .row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4mm;margin-top:4mm;text-align:center}
.ticket .row b{display:block;font-style:italic;font-weight:400;font-size:12pt}
.ticket .row span{font-size:13pt;letter-spacing:.02em}
.ticket p{text-align:center;font-size:9.5pt;color:#5c4f3d;margin-top:4mm}
.hours{font-size:10pt;color:var(--dim);margin-top:3mm;line-height:1.5}
.note{font-size:10pt;line-height:1.5;color:var(--dim)}
.note b{color:var(--ivory);font-weight:500}
.order{border:1px dashed rgba(227,200,134,.6);padding:5mm 6mm;margin-top:4mm}
.order div{display:flex;justify-content:space-between;border-bottom:.5px solid rgba(198,161,90,.35);padding:2.4mm 0;font-size:10.5pt}
.order div span:last-child{color:var(--dim);font-style:italic}
</style></head><body>
${emblem}${NECK_DEFS}

<section class="page cover">
  <svg class="rays" viewBox="0 0 210 297" preserveAspectRatio="none">${Array.from({ length: 31 }, (_, i) => { const a = Math.PI * (1 + i / 30); return `<line x1="105" y1="230" x2="${105 + Math.cos(a) * 260}" y2="${230 + Math.sin(a) * 260}" stroke="#C6A15A" stroke-width=".25"/>`; }).join('')}</svg>
  <svg class="em"><use href="#emblem"/></svg>
  <p class="k sign">Gentology Barbershop · Est. 2014</p>
  <h1>The Barber’s<br>Book</h1>
  <p class="s">A style catalogue for ladies &amp; gentlemen</p>
  <p class="foot">${BRANCHES.map((b) => `<b>${esc(b.name)}</b> ${esc(b.tel)}`).join(' &nbsp;·&nbsp; ')}<br>Ring your branch to join the waiting list</p>
</section>

<section class="page">
  ${head('Before you sit down', 'Every head is read before it is cut. Use this book to find the words, then let your barber decide what suits your head shape.', 2)}
  <div class="steps">
    <div><b>I</b><p>Pick a style by length, or start from a house favourite.</p></div>
    <div><b>II</b><p>Choose the sides and the neckline from the drawings.</p></div>
    <div><b>III</b><p>Show the barber. They will read your head and fine-tune it.</p></div>
  </div>
  <h3>House favourites</h3>
  <div class="fav">${FAVOURITES.map((f) => `<article><div><h4>${esc(f.name)}</h4><p class="a">${esc(f.also)}</p></div><div><p>${esc(f.text)}</p><p class="p">Usually paired with: ${f.pairs.map(esc).join(', ')}</p></div></article>`).join('')}</div>
</section>

<section class="page">
  ${head('The style, <em>by length</em>', 'Measured on top. Shorter styles keep their shape longest; longer ones need more styling at home.', 3)}
  ${LENGTHS.slice(0, 3).map(styleList).join('')}
</section>

<section class="page">
  ${head('Longer, <em>and the details</em>', '', 4)}
  ${LENGTHS.slice(3).map(styleList).join('')}
  <section class="len"><h3>Details</h3><ul>${DETAILS.map(([n, d]) => `<li><b>${esc(n)}</b><span>${esc(d)}</span></li>`).join('')}</ul></section>
</section>

<section class="page">
  ${head('The sides <em>&amp; the neckline</em>', 'Where the fade starts changes the whole cut. Ask for one of these by name.', 5)}
  <h3>Sides</h3>
  <div class="grid g3">${SIDES.map((s) => `<div class="fig">${fadeSvg(s, 'p' + s.key)}<b>${esc(s.name)}</b><span>${esc(s.text)}</span></div>`).join('')}</div>
  <h3>Neckline</h3>
  <div class="grid g5">${NECKLINES.map((n) => `<div class="fig">${neckSvg(n)}<b>${esc(n.name)}</b><span>${esc(n.text)}</span></div>`).join('')}</div>
</section>

<section class="page">
  ${head('Beard, moustache <em>&amp; your order</em>', '', 6)}
  <h3>Beard &amp; moustache</h3>
  <div class="chips">${BEARDS.map((b) => `<span>${esc(b)}</span>`).join('')}</div>
  <div class="two" style="margin-top:2mm">
    <div>
      <h3>Write your order</h3>
      <div class="order"><div><span>Style</span><span>&nbsp;</span></div><div><span>Sides</span><span>&nbsp;</span></div><div><span>Neckline</span><span>&nbsp;</span></div><div><span>Beard</span><span>&nbsp;</span></div></div>
      <p class="note" style="margin-top:4mm">Or build it on the website and show your phone in the chair.</p>
    </div>
    <div>
      <h3>In the chair</h3>
      <p class="note">Both signature haircuts include <b>${HAIRCUT_INCLUDES.slice(0, -1).join(', ')}</b> and <b>${HAIRCUT_INCLUDES.at(-1)}</b>. Ask for a <b>low, mid or high fade</b> with the fade signature cut.</p>
      <p class="note" style="margin-top:3mm">${HAIRCUTS.map((h) => `${esc(h.name)}: <b>${esc(h.price)}</b>`).join('<br>')}<br>Prices to be confirmed with your branch.</p>
    </div>
  </div>
  <div class="ticket"><h4>Ring for your number</h4>
    <div class="row">${BRANCHES.map((b) => `<div><b>${esc(b.name)}</b><span>${esc(b.tel)}</span></div>`).join('')}</div>
    <p>The waiting list is kept by phone by the store manager. ${HOURS.filter((h) => [1, 5, 6].includes(h.d)).map((h) => `${h.day === 'Monday' ? 'Mon–Thu & Sun' : h.day} ${t12(h.open)}–${t12(h.close)}`).join(' · ')}</p>
  </div>
</section>
</body></html>`;

const out = join(ROOT, 'book-preview.html');
writeFileSync(out, html);
const { chromium } = createRequire(import.meta.url)('playwright');
const b = await chromium.launch();
const p = await b.newPage();
await p.goto(pathToFileURL(out).href, { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
await p.pdf({ path: join(ROOT, 'public/media/gentology-barbers-book.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
await b.close();
console.log('written public/media/gentology-barbers-book.pdf');
