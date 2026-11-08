/* =====================================================================
   tilt.js — subtle 3D tilt on cards (desktop, motion-safe only).
   [data-tilt] optionally accepts data-tilt-max="6" (degrees) and
   data-tilt-scale. Reset is transitioned back to identity.
   ===================================================================== */
export function initTilt(ctx) {
  if (!window.matchMedia('(pointer: fine)').matches || ctx.reduced.matches) return;

  document.querySelectorAll('[data-tilt]').forEach((el) => {
    const max = parseFloat(el.dataset.tiltMax || '5');
    const scale = parseFloat(el.dataset.tiltScale || '1');
    el.style.transformStyle = 'preserve-3d';
    let raf = null;

    const apply = (rx, ry, s) => {
      el.style.transition = 'transform .5s cubic-bezier(0.16,1,0.3,1)';
      el.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${s})`;
    };

    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transition = 'transform .12s linear';
        el.style.transform = `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) scale(${scale})`;
      });
    }, { passive: true });

    el.addEventListener('mouseleave', () => {
      if (raf) cancelAnimationFrame(raf);
      apply(0, 0, 1);
    });
  });
}
