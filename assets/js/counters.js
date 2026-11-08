/* =====================================================================
   counters.js — animated count-up numbers on enter.
   Markup: <span data-counter data-to="120" data-suffix="+"
                  data-decimals="0" data-prefix="" data-duration="1600">
   The final value is authored as the element's text content, so the
   number is correct even without JavaScript.
   ===================================================================== */
export function initCounters(ctx) {
  const nodes = document.querySelectorAll('[data-counter]');
  if (!nodes.length) return;

  const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

  const run = (el) => {
    const to = parseFloat(el.dataset.to || el.textContent.replace(/[^\d.]/g, '')) || 0;
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const duration = parseInt(el.dataset.duration || '1600', 10);

    if (ctx.reduced.matches) { el.textContent = `${prefix}${to.toFixed(decimals)}${suffix}`; return; }

    const start = performance.now();
    const frame = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const value = to * easeOutExpo(p);
      el.textContent = `${prefix}${value.toFixed(decimals)}${suffix}`;
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = `${prefix}${to.toFixed(decimals)}${suffix}`;
    };
    requestAnimationFrame(frame);
  };

  if (!('IntersectionObserver' in window)) { nodes.forEach(run); return; }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      run(entry.target);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.4 });

  nodes.forEach((n) => io.observe(n));
  return () => io.disconnect();
}
