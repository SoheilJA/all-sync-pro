/* =====================================================================
   main.js — single entry point. Builds a shared ctx and boots every
   module, guarded by element presence so the same bundle runs on all
   21 pages. Also owns page chrome: preloader, scroll progress,
   back-to-top, cookie bar, toasts, page transitions, the mini syntax
   highlighter, and GSAP scroll choreography (with graceful fallback).
   ===================================================================== */
import { initTheme } from './theme.js';
import { initLenis } from './lenis.js';
import { initNav } from './nav.js';
import { initCursor } from './cursor.js';
import { initReveal } from './reveal.js';
import { initCounters } from './counters.js';
import { initMarquee } from './marquee.js';
import { initTabs } from './tabs.js';
import { initAccordion } from './accordion.js';
import { initTestimonials } from './testimonials.js';
import { initBlogFilter } from './blog-filter.js';
import { initForm } from './form.js';
import { initWidgets } from './widgets.js';
import { initHero3D } from './hero3d.js';

/* ---------------- shared context ---------------- */
const root = document.documentElement;
root.classList.replace('no-js', 'js');

const ctx = {
  reduced: window.matchMedia('(prefers-reduced-motion: reduce)'),
  gsap: window.gsap || null,
  hasGsap: Boolean(window.gsap),
  toast: () => {},
  scrollTo: () => {},
  lockScroll: () => {},
  lenis: null,
};
if (ctx.hasGsap && window.ScrollTrigger) ctx.gsap.registerPlugin(window.ScrollTrigger);

/* ---------------- toasts ---------------- */
const toastHost = document.querySelector('[data-toasts]');
if (toastHost) {
  toastHost.setAttribute('role', 'status');
  toastHost.setAttribute('aria-live', 'polite');
  ctx.toast = (message, type = 'ok') => {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"
        class="${type === 'error' ? 'text-red-400' : 'text-cyan'}">
        ${type === 'error'
          ? '<circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M8 5v3.5M8 11h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'
          : '<circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M5.2 8.2l1.9 1.9L10.8 6.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'}
      </svg><span></span>`;
    el.querySelector('span').textContent = message;
    toastHost.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity .4s cubic-bezier(0.16,1,0.3,1)';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 420);
    }, 3400);
  };
}

/* ---------------- scroll progress bar ---------------- */
function initProgress() {
  const bar = document.querySelector('[data-progress]');
  if (!bar) return;
  let raf = null;
  const paint = () => {
    raf = null;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
  };
  window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(paint); }, { passive: true });
  window.addEventListener('resize', paint, { passive: true });
  paint();
}

/* ---------------- back to top ---------------- */
function initBackToTop() {
  const btn = document.querySelector('[data-backtotop]');
  if (!btn) return;
  let raf = null;
  const paint = () => {
    raf = null;
    btn.dataset.visible = String(window.scrollY > 640);
  };
  window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(paint); }, { passive: true });
  paint();
  btn.addEventListener('click', () => ctx.scrollTo(0, { offset: 0 }));
}

/* ---------------- cookie / consent bar ---------------- */
function initCookieBar() {
  const bar = document.querySelector('[data-cookiebar]');
  if (!bar) return;
  let consent = null;
  try { consent = localStorage.getItem('asp-consent'); } catch (_) { /* storage blocked */ }
  if (consent) { bar.remove(); return; }
  const show = () => { bar.dataset.visible = 'true'; };
  setTimeout(show, 1400);
  bar.querySelectorAll('[data-cookie-accept]').forEach((btn) => {
    btn.addEventListener('click', () => {
      try { localStorage.setItem('asp-consent', '1'); } catch (_) { /* noop */ }
      bar.dataset.visible = 'false';
      setTimeout(() => bar.remove(), 500);
    });
  });
}

/* ---------------- preloader (once per session) ---------------- */
function runPreloader(onDone) {
  const pre = document.querySelector('[data-preloader]');
  if (!pre) { onDone(); return; }
  let seen = false;
  try { seen = sessionStorage.getItem('asp-loaded') === '1'; } catch (_) { /* noop */ }
  if (seen || ctx.reduced.matches) {
    try { sessionStorage.setItem('asp-loaded', '1'); } catch (_) { /* noop */ }
    pre.dataset.state = 'off';
    onDone();
    return;
  }

  const num = pre.querySelector('[data-preloader-num]');
  const start = performance.now();
  const MIN = 900;
  const MAX = 2800;
  let target = 0;
  let shown = 0;
  let loaded = false;
  let fontsDone = false;

  const images = Array.from(document.images);
  const countReady = () => images.filter((img) => img.complete || img.naturalWidth > 0).length;

  const recompute = () => {
    const imgP = images.length ? (countReady() / images.length) * 80 : 80;
    target = Math.min(98, imgP + (fontsDone ? 18 : 0));
  };
  recompute();

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { fontsDone = true; recompute(); }).catch(() => {});
  }
  window.addEventListener('load', () => { loaded = true; recompute(); target = 100; }, { once: true });

  const finish = () => {
    try { sessionStorage.setItem('asp-loaded', '1'); } catch (_) { /* noop */ }
    pre.dataset.state = 'exit';
    setTimeout(() => { pre.dataset.state = 'off'; }, 950);
    onDone();
  };

  const frame = () => {
    const elapsed = performance.now() - start;
    recompute();
    if (loaded) target = 100;
    shown += (target - shown) * 0.09;
    if (num) num.textContent = `${Math.min(100, Math.round(shown))}`;
    const complete = shown > 99.2 && elapsed >= MIN;
    if (complete || elapsed >= MAX) { finish(); return; }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/* ---------------- page transition curtain ---------------- */
function initTransitions() {
  const overlay = document.querySelector('[data-pt-overlay]');
  const isInternal = (url) => {
    try {
      const target = new URL(url, location.href);
      if (target.origin !== location.origin) return false;
      if (!target.pathname.endsWith('.html') && !target.pathname.endsWith('/')) return false;
      if (target.pathname === location.pathname && target.hash) return false;
      return true;
    } catch (_) { return false; }
  };

  document.addEventListener('click', (e) => {
    if (!overlay || ctx.reduced.matches) return;
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = e.target instanceof Element ? e.target.closest('a[href]') : null;
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;
    if (!isInternal(href)) return;
    e.preventDefault();
    overlay.dataset.phase = 'in';
    setTimeout(() => { window.location.href = href; }, 430);
  });

  // Clean state when returning via back/forward (bfcache included).
  window.addEventListener('pageshow', () => { if (overlay) overlay.dataset.phase = 'idle'; });
  if (overlay) overlay.dataset.phase = 'idle';
}

/* ---------------- mini syntax highlighter ---------------- */
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const RULES = {
  html: [
    [/<!--[\s\S]*?-->/g, 'tok-com'],
    [/"[^"\n]*"|'[^'\n]*'/g, 'tok-str'],
    [/<\/?[\w-]+/g, 'tok-tag'],
    [/[\w-]+(?==)/g, 'tok-attr'],
    [/\/?>/g, 'tok-pun'],
  ],
  js: [
    [/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, 'tok-com'],
    [/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g, 'tok-str'],
    [/\b(?:const|let|var|function|return|if|else|for|while|import|from|export|default|class|new|await|async|try|catch|throw|typeof|of|in|=>)\b/g, 'tok-kw'],
    [/\b\d+(?:\.\d+)?\b/g, 'tok-num'],
    [/\b[A-Za-z_$][\w$]*(?=\s*\()/g, 'tok-fn'],
  ],
  css: [
    [/\/\*[\s\S]*?\*\//g, 'tok-com'],
    [/"[^"\n]*"|'[^'\n]*'/g, 'tok-str'],
    [/@[\w-]+/g, 'tok-kw'],
    [/#[0-9a-fA-F]{3,8}\b/g, 'tok-num'],
    [/[\w-]+(?=\s*:)/g, 'tok-attr'],
    [/\b\d+(?:\.\d+)?(?:px|rem|em|%|s|ms|vh|vw|fr|deg)?\b/g, 'tok-num'],
  ],
  bash: [
    [/#[^\n]*/g, 'tok-com'],
    [/"[^"\n]*"|'[^'\n]*'/g, 'tok-str'],
    [/\b(?:sudo|npm|npx|cd|ls|mkdir|python3?|node|git|install|build|deploy)\b/g, 'tok-kw'],
    [/\B--?[\w-]+/g, 'tok-attr'],
  ],
};

function highlight(code, lang) {
  const rules = RULES[lang] || [];
  const store = [];
  let out = code;
  rules.forEach(([re, cls]) => {
    out = out.replace(re, (match) => {
      const i = store.push(`<span class="${cls}">${esc(match)}</span>`) - 1;
      return `\x00k${i}z\x00`;
    });
  });
  return esc(out).replace(/\x00k(\d+)z\x00/g, (_, i) => store[Number(i)]);
}

function initCodeHighlight() {
  document.querySelectorAll('[data-code]').forEach((block) => {
    const lang = (block.closest('[data-lang]')?.getAttribute('data-lang') || block.dataset.code || 'js').toLowerCase();
    const raw = block.textContent;
    if (!raw.trim()) return;
    block.innerHTML = highlight(raw.replace(/^\n+|\s+$/g, ''), lang);
  });
}

/* ---------------- GSAP scroll choreography (optional) ---------------- */
function initScrollFx() {
  const gsap = ctx.gsap;
  const ST = window.ScrollTrigger;
  if (!gsap || !ST || ctx.reduced.matches) return;

  // Layered parallax
  gsap.utils.toArray('[data-parallax]').forEach((el) => {
    const depth = parseFloat(el.dataset.parallax) || 0.2;
    gsap.to(el, {
      yPercent: depth * -42,
      ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  // Pinned horizontal process section (desktop only; falls back to
  // the authored native overflow-x snap track otherwise).
  const pin = document.querySelector('[data-process-pin]');
  const track = pin?.querySelector('[data-process-track]');
  const progress = document.querySelector('[data-process-progress]');
  const progressNum = document.querySelector('[data-process-num]');
  if (pin && track && window.matchMedia('(min-width: 1024px)').matches) {
    const wrapper = track.parentElement;
    const stepEls = Array.from(track.children);
    pin.classList.add('is-pinned');
    const distance = () => Math.max(0, track.scrollWidth - wrapper.clientWidth);

    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: pin,
        start: 'top top+=92',
        end: () => `+=${distance() + window.innerHeight * 0.4}`,
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          if (progress) progress.style.transform = `scaleX(${self.progress})`;
          if (progressNum && stepEls.length) {
            const idx = Math.min(stepEls.length, Math.max(1, Math.round(self.progress * stepEls.length) || 1));
            progressNum.textContent = String(idx).padStart(2, '0');
            stepEls.forEach((s, i) => s.toggleAttribute('data-active', i < idx));
          }
        },
      },
    });
    return () => { tween.scrollTrigger?.kill(); tween.kill(); };
  }
  return undefined;
}

/* ---------------- cursor-following work preview ---------------- */
function initWorkPreview() {
  const list = document.querySelector('[data-work-list]');
  if (!list || !window.matchMedia('(pointer: fine)').matches || ctx.reduced.matches) return;

  const preview = document.createElement('div');
  preview.className = 'pointer-events-none fixed z-[120] hidden overflow-hidden rounded-xl border border-line-strong shadow-card opacity-0 transition-opacity duration-300 ease-engineered';
  preview.style.width = '300px';
  preview.setAttribute('aria-hidden', 'true');
  const img = document.createElement('img');
  img.width = 300; img.height = 195;
  img.decoding = 'async';
  img.alt = '';
  img.className = 'aspect-[40/26] w-full object-cover';
  preview.appendChild(img);
  document.body.appendChild(preview);

  const state = { x: 0, y: 0, px: 0, py: 0, raf: null };
  const tick = () => {
    state.px += (state.x - state.px) * 0.14;
    state.py += (state.y - state.py) * 0.14;
    preview.style.transform = `translate(${state.px + 26}px, ${state.py - 98}px) rotate(${((state.x - state.px) * 0.02).toFixed(2)}deg)`;
    if (Math.abs(state.x - state.px) > 0.4 || Math.abs(state.y - state.py) > 0.4) state.raf = requestAnimationFrame(tick);
    else state.raf = null;
  };

  list.querySelectorAll('[data-work-preview-src]').forEach((row) => {
    row.addEventListener('mouseenter', () => {
      img.src = row.dataset.workPreviewSrc;
      img.alt = row.getAttribute('aria-label') || 'Case preview';
      preview.classList.remove('hidden');
      requestAnimationFrame(() => preview.style.opacity = '1');
    }, { passive: true });
    row.addEventListener('mousemove', (e) => {
      state.x = e.clientX; state.y = e.clientY;
      if (!state.raf) state.raf = requestAnimationFrame(tick);
    }, { passive: true });
    row.addEventListener('mouseleave', () => {
      preview.style.opacity = '0';
      setTimeout(() => preview.classList.add('hidden'), 320);
    }, { passive: true });
  });
}

/* ---------------- footer year ---------------- */
function initYear() {
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
}

/* ---------------- newsletter (footer) ---------------- */
function initNewsletter() {
  document.querySelectorAll('[data-newsletter]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const value = (input?.value || '').trim();
      if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        ctx.toast('Please enter a valid email address.', 'error');
        input?.focus();
        return;
      }
      // TODO: connect endpoint — POST to your newsletter provider here.
      ctx.toast('You are on the list. One email a month, zero noise.');
      form.reset();
    });
  });
}

/* ---------------- boot ---------------- */
initTheme(ctx);
initLenis(ctx);
initNav(ctx);
initCursor(ctx);
initMarquee();
initTabs();
initAccordion(ctx);
initTestimonials(ctx);
initBlogFilter(ctx);
initForm(ctx);
initWidgets(ctx);
initCounters(ctx);
initProgress();
initBackToTop();
initCookieBar();
initTransitions();
initCodeHighlight();
initYear();
initNewsletter();
initWorkPreview();
initScrollFx();

// 3D hero is independent + resilient; never let it break the page.
initHero3D(ctx).catch(() => {
  document.querySelector('[data-hero-canvas]')?.remove();
});

// Reveals wait for the preloader curtain so the hero entrance lands.
let revealsStarted = false;
const startReveals = () => {
  if (revealsStarted) return;
  revealsStarted = true;
  try { initReveal(ctx); } catch (err) { console.warn('reveal fallback', err); }
};
runPreloader(startReveals);
setTimeout(startReveals, 3000); // hard safety net
