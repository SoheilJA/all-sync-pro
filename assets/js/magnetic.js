/* =====================================================================
   magnetic.js — magnetic buttons.
   Desktop only. Elements gently pull toward the cursor and spring
   back on leave. Transform+opacity only, rAF-lerped.
   ===================================================================== */
export function initMagnetic(ctx) {
  if (!window.matchMedia('(pointer: fine)').matches || ctx.reduced.matches) return;

  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const strength = parseFloat(el.dataset.magnetic) || 0.32;
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = null;

    const tick = () => {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      el.style.transform = `translate(${cx.toFixed(2)}px, ${cy.toFixed(2)}px)`;
      if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) raf = requestAnimationFrame(tick);
      else raf = null;
    };

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      tx = (e.clientX - (rect.left + rect.width / 2)) * strength;
      ty = (e.clientY - (rect.top + rect.height / 2)) * strength;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onLeave = () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(tick); };

    el.addEventListener('mousemove', onMove, { passive: true });
    el.addEventListener('mouseleave', onLeave);
  });
}
