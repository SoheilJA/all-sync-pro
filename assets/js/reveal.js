/* =====================================================================
   reveal.js — scroll-triggered reveals via IntersectionObserver.
   Handles: [data-reveal] blocks (with variants), staggered groups,
   character/word split headlines, SVG path draw-in, and the streaming
   code panels. Pure IO + CSS transitions — works even when GSAP
   fails to load, and collapses to "always visible" without JS.
   ===================================================================== */
const STAGGER = 70; // ms between staggered children

function splitText(el, mode) {
  const source = el.textContent;
  const frag = document.createDocumentFragment();
  const units = mode === 'chars' ? Array.from(source) : source.split(/(\s+)/);
  let index = 0;
  units.forEach((unit) => {
    if (/^\s+$/.test(unit)) { frag.appendChild(document.createTextNode(' ')); return; }
    if (unit === '') return;
    if (mode === 'chars') {
      const span = document.createElement('span');
      span.className = 'split-char';
      span.textContent = unit;
      span.style.setProperty('--char-delay', `${index * 28}ms`);
      frag.appendChild(span);
      index += 1;
    } else {
      const span = document.createElement('span');
      span.className = 'split-word';
      span.textContent = unit;
      span.style.setProperty('--char-delay', `${index * 55}ms`);
      frag.appendChild(span);
      index += 1;
    }
  });
  el.textContent = '';
  el.appendChild(frag);
}

export function initReveal(ctx) {
  // 1) Prepare split headlines.
  document.querySelectorAll('[data-split]').forEach((el) => {
    splitText(el, el.getAttribute('data-split') === 'chars' ? 'chars' : 'words');
  });

  // 2) Prepare SVG draws — normalize every path to length 1.
  document.querySelectorAll('[data-draw]').forEach((svg) => {
    svg.querySelectorAll('path, circle, line').forEach((p) => p.setAttribute('pathLength', '1'));
  });

  // 3) Assign stagger delays to grouped children.
  document.querySelectorAll('[data-reveal-group]').forEach((group) => {
    const step = parseFloat(group.getAttribute('data-reveal-group')) || STAGGER;
    Array.from(group.children).forEach((child, i) => {
      if (child.hasAttribute('data-reveal')) child.style.setProperty('--reveal-delay', `${i * step}ms`);
    });
  });

  // 4) Observe everything.
  const targets = document.querySelectorAll('[data-reveal], [data-split], [data-draw], .code-panel');

  if (!('IntersectionObserver' in window) || ctx.reduced.matches) {
    targets.forEach((t) => t.classList.add('is-in'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      // Animated gauges (stroke-dashoffset rings) inside revealed blocks
      entry.target.querySelectorAll?.('[data-gauge]').forEach((g) => {
        const v = parseFloat(g.dataset.gauge) || 0;
        g.style.strokeDashoffset = String(Math.max(0, 1 - v));
      });
      io.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });

  targets.forEach((t) => io.observe(t));
  return () => io.disconnect();
}
