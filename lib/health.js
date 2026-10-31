// Site health and on-page SEO checks. Runs on the server so it can read any site.

const UA = 'ArcwiseHealthCheck/1.0 (+https://arcwise-studios.vercel.app)';

async function timed(url, ms = 10000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  const start = Date.now();
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: 'follow', headers: { 'user-agent': UA } });
    const body = await res.text();
    return { ok: res.ok, status: res.status, ms: Date.now() - start, headers: res.headers, body };
  } catch (e) {
    return { ok: false, status: 0, ms: Date.now() - start, error: e.name === 'AbortError' ? 'timeout' : 'unreachable' };
  } finally { clearTimeout(t); }
}

function attr(tag, name) {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i'));
  return m ? m[1] : null;
}
function meta(html, key) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const t of tags) {
    const n = (attr(t, 'name') || attr(t, 'property') || '').toLowerCase();
    if (n === key) return attr(t, 'content');
  }
  return null;
}
function text(s) { return String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); }

export async function checkSite(project) {
  const base = new URL(project.url);
  const [page, robots, sitemap] = await Promise.all([
    timed(project.url),
    timed(new URL('/robots.txt', base).href, 6000),
    timed(new URL('/sitemap.xml', base).href, 6000),
  ]);
  const html = page.body || '';
  const title = text((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]);
  const description = meta(html, 'description') || '';
  const robotsMeta = (meta(html, 'robots') || '') + ' ' + (page.headers?.get('x-robots-tag') || '');
  const noindex = /noindex/i.test(robotsMeta);
  const h1 = (html.match(/<h1\b/gi) || []).length;
  const imgs = html.match(/<img\b[^>]*>/gi) || [];
  const imgsNoAlt = imgs.filter(t => attr(t, 'alt') === null).length;
  const lang = attr((html.match(/<html\b[^>]*>/i) || [''])[0], 'lang');

  const checks = [
    { key: 'title', label: 'Page title', pass: title.length >= 10 && title.length <= 65, detail: title ? `“${title}” (${title.length} characters, best 10–65)` : 'Missing' },
    { key: 'description', label: 'Google description', pass: description.length >= 50 && description.length <= 170, detail: description ? `${description.length} characters (best 50–170)` : 'Missing' },
    { key: 'h1', label: 'One main heading', pass: h1 === 1, detail: `${h1} found` },
    { key: 'viewport', label: 'Mobile-friendly setup', pass: !!meta(html, 'viewport'), detail: meta(html, 'viewport') ? 'Present' : 'Missing viewport tag' },
    { key: 'lang', label: 'Language set', pass: !!lang, detail: lang || 'Missing' },
    { key: 'og', label: 'Share preview image', pass: !!meta(html, 'og:image'), detail: meta(html, 'og:image') ? 'Present' : 'Missing (links look plain on WhatsApp and Instagram)' },
    { key: 'alt', label: 'Image descriptions', pass: imgsNoAlt === 0, detail: imgs.length ? `${imgs.length - imgsNoAlt} of ${imgs.length} images described` : 'No images' },
    { key: 'https', label: 'Secure (https)', pass: base.protocol === 'https:', detail: base.protocol === 'https:' ? 'Yes' : 'No' },
    { key: 'robots', label: 'robots.txt', pass: robots.ok, detail: robots.ok ? 'Found' : 'Missing' },
    { key: 'sitemap', label: 'Sitemap', pass: sitemap.ok && /<urlset|<sitemapindex/i.test(sitemap.body || ''), detail: sitemap.ok ? 'Found' : 'Missing' },
  ];
  const passed = checks.filter(c => c.pass).length;
  const state = !page.ok ? 'down' : page.ms > 3000 ? 'slow' : 'up';

  return {
    id: project.id,
    checkedAt: Date.now(),
    state, status: page.status, ms: page.ms, error: page.error || null,
    sizeKb: Math.round((html.length || 0) / 1024),
    indexable: !noindex,
    frontDeskInstalled: /arcwise-front-desk\.vercel\.app\/widget\.js/.test(html),
    seo: { passed, total: checks.length, checks },
  };
}
