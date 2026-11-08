/* =====================================================================
   lenis.js — smooth scrolling via Lenis (CDN, optional).
   Falls back to native scrolling when Lenis or GSAP are unavailable,
   or when the visitor prefers reduced motion. Exposes ctx.scrollTo so
   the rest of the site never depends on the engine being present.
   ===================================================================== */
export function initLenis(ctx) {
  const reduced = ctx.reduced;
  const LenisCtor = window.Lenis;
  let lenis = null;

  if (typeof LenisCtor === 'function' && !reduced.matches) {
    try {
      lenis = new LenisCtor({
        duration: 1.15,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 0.95,
        touchMultiplier: 1.4,
      });
      document.documentElement.classList.add('lenis');

      if (ctx.hasGsap && window.ScrollTrigger) {
        lenis.on('scroll', window.ScrollTrigger.update);
        ctx.gsap.ticker.add((time) => lenis.raf(time * 1000));
        ctx.gsap.ticker.lagSmoothing(0);
      } else {
        const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);
      }
    } catch (_) { lenis = null; }
  }

  ctx.lenis = lenis;

  ctx.scrollTo = (target, opts = {}) => {
    const offset = opts.offset ?? -96;
    if (lenis) {
      lenis.scrollTo(target, { offset, duration: 1.1 });
    } else if (typeof target === 'number') {
      window.scrollTo({ top: target + offset, behavior: reduced.matches ? 'auto' : 'smooth' });
    } else if (target && target.scrollIntoView) {
      target.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
      if (!reduced.matches && offset !== 0) {
        window.scrollBy({ top: offset, behavior: 'smooth' });
      }
    }
  };

  ctx.lockScroll = (locked) => {
    document.documentElement.classList.toggle('menu-locked', locked);
    if (lenis) { locked ? lenis.stop() : lenis.start(); }
  };

  return lenis;
}
