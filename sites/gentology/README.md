# Gentology concept site (v2)

Unofficial concept redesign. Static output, no dependencies.

```
node build.mjs                                   # concept build: noindex everywhere, robots.txt blocks crawling
SITE_ENV=production node build.mjs               # indexable, robots.txt lists the sitemap
SITE_URL=https://example.com node build.mjs      # base for canonical, OG, sitemap, JSON-LD
```

Output goes to `dist/`: `/`, `/cideng/`, `/tanjung-duren/`, `/cipete/`, `sitemap.xml`, `robots.txt`.

- `src/content.mjs`: every fact (addresses, phones, hours, prices). These were checked against gentology-barbershop.com on 2026-10-22. Edit facts here only.
- `src/partials/`: sections carried over unchanged from the original concept (`art/index.html`).
- `public/media/`: 360 px WebP versions of the three photos (kept small for upload), plus `og.jpg` (600×315).

Before going live, confirm three things with Gentology:
1. Which haircut costs 90k and which costs 80k.
2. Whether the opening hours are the same at all three branches.
3. Which domain the site will use.
