# AllSyncPro — Premium Agency Website

A complete, production-ready static frontend for **AllSyncPro**, a full-service digital studio.
Dark-first, editorial, engineered — 23 pages, zero frameworks, zero build required to run.

**Stack:** HTML5 · Tailwind CSS (Play CDN by default, CLI optional) · vanilla ES modules ·
Three.js (hero, lazily imported) · GSAP + ScrollTrigger · Lenis — every one of them optional by design.

---

## 1. Quick start

The site is pure static HTML — but ES modules are CORS-blocked on the `file://` protocol
in Chromium browsers, so serve it over HTTP (any of these, no build step):

```bash
cd allsyncpro
python3 -m http.server 8080      # → http://localhost:8080
# or
npx serve .                      # → prints a local URL
# or open the folder in VS Code and use the "Live Server" extension
```

Then open `http://localhost:8080`. That's it — Tailwind, fonts, GSAP, Lenis and Three.js
all load from CDNs, and the 3D hero initializes itself when WebGL is available.

> **Resilience model:** if any CDN fails, WebGL is unavailable, or JS never loads,
> the site still renders and navigates fully — the animated gradient hero stands in for
> the WebGL layer, reveals collapse to visible content, FAQ accordions keep working
> (native `<details>`), and the theme defaults to dark. Open it straight from disk
> (`file://`) and you'll see exactly what a no-JS visitor sees: everything readable.

## 2. Structure

```
allsyncpro/
├── index.html                        Home — 3D hero + 14 sections
├── about.html                        Story, values, timeline, team, awards
├── contact.html                      Validated form + studio info
├── services.html                     Services hub
├── services/
│   ├── web-design.html               Flagship
│   ├── web-development.html          Flagship
│   ├── graphic-design.html
│   ├── logo-brand-identity.html
│   └── banner-ad-creative.html
├── blog.html                         Archive: filters, search, pagination
├── blog/post-1.html … post-6.html    Six long-form articles (800+ words each)
├── portfolio.html                    Case studies with category tabs
├── pricing.html                      Toggle, tiers, comparison table, add-ons
├── faq.html                          14 Q&A in four groups
├── 404.html · thank-you.html · privacy-policy.html · terms.html
├── sitemap.xml · robots.txt · site.webmanifest
├── tailwind.config.js                Dual-mode: Play CDN + CLI
├── package.json                      Optional Tailwind CLI tooling
└── assets/
    ├── css/main.css                  Tokens, components, keyframes (the only custom CSS)
    ├── js/                           17 single-purpose ES modules + main.js entry
    └── img/                          SVG logos/icons + generated PNG app icons
```

### JS modules (`assets/js/`)

| Module | Responsibility |
|---|---|
| `main.js` | Entry + shared `ctx`, preloader, scroll progress, back-to-top, cookie bar, toasts, page transitions, mini syntax highlighter, GSAP choreography (parallax + pinned process), work-list cursor previews |
| `hero3d.js` | Three.js "sync gimbal" — 3 rings + wireframe core + particle halo; pointer/scroll/click reactive; DPR-capped, pauses off-screen, downgrades on weak devices |
| `nav.js` | Header morph, mega-menu ARIA, mobile menu (focus trap + scroll lock), smooth anchors |
| `reveal.js` | IntersectionObserver reveals, split text, SVG path draw, gauge fills |
| `theme.js` | Dark/light toggle, localStorage, OS-preference sync |
| `lenis.js` | Smooth scroll wrapper with native fallback |
| `cursor.js` | Custom dot + lagging ring with contextual labels |
| `counters.js` · `marquee.js` · `magnetic.js` · `tilt.js` · `tabs.js` · `accordion.js` | Count-ups, logo marquee, magnetic buttons, 3D tilt, accessible tabs, animated `<details>` FAQ |
| `testimonials.js` | Draggable/swipeable slider (custom, keyboard-friendly) |
| `blog-filter.js` | Category chips + search + working pagination (supports `?q=` deep links) |
| `form.js` | Inline validation, budget slider, file-upload UI, simulated submit → `thank-you.html` |
| `widgets.js` | Rotating hero word, before/after slider, pricing toggle, timeline, copy-link, text scramble, blog TOC + reading progress, thank-you personalization |

## 3. Design tokens & theming

All theme colors are CSS variables holding `R G B` triplets (`assets/css/main.css`),
mapped in `tailwind.config.js` via `rgb(var(--c-ink) / <alpha-value>)` — so utilities like
`bg-ink/70` keep working. Switching theme is one class on `<html>`
(`theme-dark` default ↔ `theme-light`); a 5-line inline `<head>` script applies the stored
preference before first paint (industry-standard FOUC prevention, see `partials/head-shared.html`).

Palette: `ink #06070A` · `surface #0C0E13` · `elevated #12151C` · `mist #A8AEBD` ·
`chalk #F2F4F8` · accents `violet #6E4BFF` → `cyan #22D3EE`, with `ember #FFB86B`
rationed to ~5% (badges, one stat). Light theme is a warm off-white (`#F6F5F2`)
re-derivation, not an inversion.

## 4. Adding content

**A blog post:** copy `blog/post-6.html`, replace the content (keep the section skeleton
and `article-body` classes), then register it in the build step below. Article styling is
fully handled by `.article-body` — write semantic HTML and it looks right.

**A service page:** copy `services/graphic-design.html` (or either flagship), keep the
10-section skeleton, write new copy.

**Any page:** create the fragment and register it. Because there's no templating engine,
this repo keeps header/footer **byte-identical** across pages via an assembly step —
see "Maintaining the chrome" below.

## 5. Maintaining the chrome (byte-identical header/footer)

The delivered pages are 100% static, but you shouldn't hand-edit the same 300-line
header in 23 files. Two options:

**a) The included partial-injection script (recommended for light edits).**
Save this as `assets/js/partials.js` and add
`<script type="module" src="{{ROOT}}assets/js/partials.js"></script>` before `main.js`
on pages you want it active on — it swaps `<header data-partial="header">` /
`<footer data-partial="footer">` placeholders for the shared markup at runtime:

```js
// assets/js/partials.js — optional chrome injection for static hosting
const BASE = new URL('.', import.meta.url).href.replace(/assets\/js\/$/, '');
const load = async (name) => {
  const res = await fetch(`${BASE}partials/${name}.html`);
  return res.ok ? res.text() : '';
};
document.querySelector('[data-partial="header"]')?.insertAdjacentHTML(
  'afterend', (await load('header')).replaceAll('{{ROOT}}', BASE.replace(/\/$/, '') + '/')
);
// …same for footer, then remove the placeholder nodes.
```
(Ship the partials folder alongside the site if you use this.)

**b) Regenerate statically (what produced this build).** Keep fragments +
`partials/` + a small assembly script — the pattern this site was built with:
edit `partials/header.html` once, re-run, all 23 pages update byte-identically,
including active-nav states, breadcrumbs, per-page meta and JSON-LD.

## 6. Tailwind: CDN (default) vs CLI (production)

The default setup uses the pinned Play CDN (`cdn.tailwindcss.com/3.4.16`) +
`tailwind.config.js` (dual-mode: it assigns `window.tailwind.config` in the browser and
exports `module.exports` for the CLI). This runs anywhere with zero tooling.

For production, precompile instead — it removes the ~100 KB runtime compiler and is
strictly faster:

1. `npm install` (installs `tailwindcss` v3)
2. Create `assets/css/tailwind.input.css`:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   @import "./main.css";
   ```
3. `npm run build:css` → `assets/css/tailwind.built.css`
4. In every page, replace the two CDN `<script>` tags with
   `<link rel="stylesheet" href="assets/css/tailwind.built.css">` (keep the existing
   `main.css` link — it's imported either way).

## 7. SEO & accessibility notes

- Unique `<title>`/description/canonical/OG/Twitter on every page; `lang="en"`;
  exactly one `<h1>` per page; no skipped heading levels.
- JSON-LD per page type: `Organization` + `WebSite` (with `SearchAction`) sitewide,
  `Service` on service pages, `BlogPosting` on posts, `BreadcrumbList` everywhere,
  `FAQPage` auto-derived from the **visible** FAQ markup (it can never drift),
  `ItemList` on the blog, `Person` list on About, `AggregateRating` on Home.
- `sitemap.xml` covers all indexable pages (`thank-you.html` and `404.html` are
  `noindex`); `robots.txt` references the sitemap.
- WCAG 2.1 AA: visible focus rings, skip link, ARIA states on menus/tabs/accordions,
  focus trapping in overlays, 44px+ targets, `prefers-reduced-motion` honored globally
  (3D/parallax/scroll-jacking disabled), `<canvas aria-hidden>` with DOM alternatives.
- Images carry `alt`, `width`/`height` (CLS), `loading="lazy"` — the LCP candidates
  (post featured images) use `fetchpriority="high"` + `loading="eager"`.

**Honest performance trade-offs:** the 3D hero and the runtime Tailwind compiler cost
some headroom — that's the price of a zero-build CDN site with a WebGL centerpiece.
Mitigations already in place: dynamic `import()` of Three.js (failure-safe), DPR cap 2,
render loop paused when hidden/off-screen, particle count downgraded on mobile,
everything deferred, headline as real DOM text (fast LCP). For a Lighthouse-obsessed
production deploy, run the CLI build (§6) and consider gating the 3D hero behind
`deviceMemory`/connection checks — the hooks are already there in `hero3d.js`.

## 8. Before you ship

- Replace the placeholder domain `https://allsyncpro.com` (canonicals, sitemap,
  robots, share URLs) with the real one — one find-and-replace + regenerate.
- Swap picsum placeholder imagery for real assets (same dimensions).
- Point `form.js` at a real endpoint (`// TODO: connect endpoint`) and the newsletter/
  comment forms likewise; `thank-you.html?name=` personalization already works.
- Update fictional client names, testimonials, metrics, and awards with real ones —
  all fictional-but-plausible content is clearly concentrated in the fragments.

## 9. Credits

Fonts: Clash Display & Satoshi (Fontshare), JetBrains Mono (Google Fonts) ·
Animation: GSAP + ScrollTrigger (cdnjs) · Smooth scroll: Lenis (jsDelivr) ·
3D: Three.js r160 (jsDelivr) · Placeholder imagery: picsum.photos ·
Logo/icons: original SVGs included in `assets/img/`.
