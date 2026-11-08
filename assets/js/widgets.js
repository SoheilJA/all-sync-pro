/* =====================================================================
   widgets.js — page-level interactive widgets:
   · [data-rotator]        rotating word in the hero headline
   · [data-ba]             before/after drag comparison slider
   · [data-price-toggle]   monthly ↔ project pricing switch
   · [data-timeline]       interactive milestone timeline (About)
   · [data-copy]           copy-to-clipboard share buttons
   · [data-scramble]       text-scramble hover on mono labels
   · [data-toc]            sticky table of contents active-heading sync
   ===================================================================== */
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&@$0123456789';

/* ---------- Rotating hero word ---------- */
function initRotators() {
  document.querySelectorAll('[data-rotator]').forEach((el) => {
    const words = (el.dataset.rotator || '').split(',').map((w) => w.trim()).filter(Boolean);
    if (words.length < 2) return;
    let i = 0;
    const swap = () => {
      if (document.hidden) return;
      i = (i + 1) % words.length;
      el.classList.add('is-swapping');
      setTimeout(() => {
        el.textContent = words[i];
        el.classList.remove('is-swapping');
      }, 260);
    };
    setInterval(swap, 2800);
  });
}

/* ---------- Before / after slider ---------- */
function initBeforeAfter(ctx) {
  document.querySelectorAll('[data-ba]').forEach((widget) => {
    const after = widget.querySelector('[data-ba-after]');
    const handle = widget.querySelector('.ba-handle');
    const range = widget.querySelector('input[type="range"]');
    if (!after || !range) return;

    let value = parseFloat(range.value) || 55;
    const paint = () => {
      after.style.clipPath = `inset(0 0 0 ${value}%)`;
      if (handle) handle.style.left = `${value}%`;
      range.setAttribute('aria-valuenow', String(Math.round(value)));
    };

    const fromEvent = (e) => {
      const rect = widget.getBoundingClientRect();
      const x = (e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0].clientX)) - rect.left;
      value = Math.min(96, Math.max(4, (x / rect.width) * 100));
      range.value = String(value);
      paint();
    };

    let dragging = false;
    widget.addEventListener('pointerdown', (e) => {
      if (e.target === range) return; // let the native range behave
      dragging = true;
      widget.setPointerCapture(e.pointerId);
      fromEvent(e);
    });
    widget.addEventListener('pointermove', (e) => { if (dragging) fromEvent(e); });
    const stop = () => { dragging = false; };
    widget.addEventListener('pointerup', stop);
    widget.addEventListener('pointercancel', stop);

    range.addEventListener('input', () => { value = parseFloat(range.value); paint(); });
    paint();
    if (ctx.reduced.matches) { value = 50; range.value = '50'; paint(); }
  });
}

/* ---------- Pricing toggle (monthly ↔ one-off project) ---------- */
function initPriceToggle() {
  const toggle = document.querySelector('[data-price-toggle]');
  if (!toggle) return;
  const nodes = document.querySelectorAll('[data-price]');
  const paint = () => {
    const mode = toggle.getAttribute('aria-checked') === 'true' ? 'monthly' : 'project';
    nodes.forEach((n) => {
      const price = n.dataset[mode] || n.dataset.project;
      if (n.textContent !== price) {
        n.classList.remove('price-swap');
        void n.offsetWidth; // restart animation
        n.textContent = price;
        n.classList.add('price-swap');
      }
    });
    document.querySelectorAll('[data-price-unit]').forEach((u) => { u.textContent = mode === 'monthly' ? '/mo' : 'project'; });
    document.querySelectorAll('[data-price-note]').forEach((note) => {
      note.textContent = mode === 'monthly' ? (note.dataset.monthly || '') : (note.dataset.project || '');
    });
  };
  toggle.addEventListener('click', () => {
    toggle.setAttribute('aria-checked', String(toggle.getAttribute('aria-checked') !== 'true'));
    paint();
  });
  toggle.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      toggle.setAttribute('aria-checked', String(e.key === 'ArrowRight'));
      paint();
    }
  });
  paint();
}

/* ---------- Interactive timeline (About page) ---------- */
function initTimeline() {
  document.querySelectorAll('[data-timeline]').forEach((timeline) => {
    const nodes = Array.from(timeline.querySelectorAll('[data-tl-node]'));
    const panels = Array.from(timeline.querySelectorAll('[data-tl-panel]'));
    nodes.forEach((node) => {
      node.addEventListener('click', () => {
        const year = node.dataset.tlNode;
        nodes.forEach((n) => n.setAttribute('aria-selected', String(n === node)));
        panels.forEach((p) => { p.hidden = p.dataset.tlPanel !== year; });
      });
    });
    if (nodes[0]) nodes[0].click();
  });
}

/* ---------- Copy-to-clipboard share buttons ---------- */
function initCopy(ctx) {
  document.addEventListener('click', async (e) => {
    const btn = e.target instanceof Element ? e.target.closest('[data-copy]') : null;
    if (!btn) return;
    const kind = btn.dataset.copy;
    let value = location.href;
    if (kind === 'text') value = btn.getAttribute('data-copy-text') || value;
    try {
      await navigator.clipboard.writeText(value);
      ctx.toast('Link copied to clipboard');
      const label = btn.querySelector('[data-copy-label]');
      if (label) {
        const prev = label.textContent;
        label.textContent = 'Copied';
        setTimeout(() => { label.textContent = prev; }, 1600);
      }
    } catch (_) {
      ctx.toast('Copy failed — your browser blocked clipboard access', 'error');
    }
  });
}

/* ---------- Text scramble on hover ---------- */
function initScramble(ctx) {
  if (ctx.reduced.matches) return;
  document.querySelectorAll('[data-scramble]').forEach((el) => {
    const original = el.textContent;
    let timer = null;
    const scramble = () => {
      let frame = 0;
      clearInterval(timer);
      timer = setInterval(() => {
        frame += 1;
        el.textContent = original.split('').map((ch, idx) => {
          if (frame > idx / 1.6 + 2) return ch;
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }).join('');
        if (frame > original.length + 3) { clearInterval(timer); el.textContent = original; }
      }, 28);
    };
    el.addEventListener('mouseenter', scramble);
    el.addEventListener('focus', scramble);
  });
}

/* ---------- Blog reading progress bar ---------- */
function initReadProgress() {
  const bar = document.querySelector('[data-read-progress]');
  const article = document.querySelector('.article-body');
  if (!bar || !article) return;
  let raf = null;
  const paint = () => {
    raf = null;
    const rect = article.getBoundingClientRect();
    const total = rect.height - window.innerHeight * 0.6;
    const done = Math.min(Math.max(-rect.top + window.innerHeight * 0.3, 0), Math.max(total, 1));
    bar.style.transform = `scaleX(${done / Math.max(total, 1)})`;
  };
  window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(paint); }, { passive: true });
  window.addEventListener('resize', paint, { passive: true });
  paint();
}

/* ---------- Blog TOC: highlight the active heading ---------- */
function initToc() {
  const toc = document.querySelector('[data-toc]');
  if (!toc || !('IntersectionObserver' in window)) return;
  const links = Array.from(toc.querySelectorAll('a[href^="#"]'));
  const headings = links
    .map((l) => document.querySelector(l.getAttribute('href')))
    .filter(Boolean);
  if (!headings.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((l) => {
        const active = l.getAttribute('href') === `#${entry.target.id}`;
        l.setAttribute('aria-current', active ? 'true' : 'false');
        l.classList.toggle('text-chalk', active);
        l.classList.toggle('border-plum', active);
        l.classList.toggle('text-mist/70', !active);
      });
    });
  }, { rootMargin: '-20% 0px -70% 0px' });
  headings.forEach((h) => io.observe(h));
}

/* ---------- Thank-you page: personalized greeting ---------- */
function initThankYou() {
  const slot = document.querySelector('[data-ty-name]');
  if (!slot) return;
  const name = new URLSearchParams(location.search).get('name');
  if (!name) return;
  const first = name.replace(/[^\p{L}\p{N}' -]/gu, '').trim().slice(0, 40);
  if (!first) return;
  const target = slot.querySelector('[data-ty-firstname]');
  if (target) target.textContent = first;
  slot.hidden = false;
}

export function initWidgets(ctx) {
  initRotators();
  initBeforeAfter(ctx);
  initPriceToggle();
  initTimeline();
  initCopy(ctx);
  initScramble(ctx);
  initReadProgress();
  initToc();
  initThankYou();
}
