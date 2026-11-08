/* =====================================================================
   testimonials.js — draggable / swipeable testimonial slider.
   Custom-built (no library): native horizontal scroll + scroll-snap
   as the base, pointer-drag for mouse, arrows + progress rail, and
   keyboard support through real focusable cards.
   ===================================================================== */
export function initTestimonials(ctx) {
  document.querySelectorAll('[data-testimonials]').forEach((slider) => {
    const track = slider.querySelector('[data-t-track]');
    const prev = slider.querySelector('[data-t-prev]');
    const next = slider.querySelector('[data-t-next]');
    const rail = slider.querySelector('[data-t-rail]');
    const cards = Array.from(track?.children || []);
    if (!track || !cards.length) return;

    const cardStep = () => {
      const first = cards[0];
      const gap = parseFloat(getComputedStyle(track).columnGap || '0') || 0;
      return first.getBoundingClientRect().width + gap;
    };

    const scrollByCard = (dir) => {
      track.scrollBy({ left: dir * cardStep(), behavior: ctx.reduced.matches ? 'auto' : 'smooth' });
    };
    prev?.addEventListener('click', () => scrollByCard(-1));
    next?.addEventListener('click', () => scrollByCard(1));

    // Progress rail (0 → 1)
    let raf = null;
    const updateRail = () => {
      raf = null;
      const max = track.scrollWidth - track.clientWidth;
      const p = max > 0 ? track.scrollLeft / max : 0;
      if (rail) rail.style.transform = `scaleX(${Math.max(0.04, p || 0.04)})`;
      const atStart = track.scrollLeft <= 2;
      const atEnd = track.scrollLeft >= max - 2;
      prev?.toggleAttribute('disabled', atStart);
      next?.toggleAttribute('disabled', atEnd);
    };
    track.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(updateRail); }, { passive: true });
    window.addEventListener('resize', updateRail, { passive: true });
    updateRail();

    // Pointer drag (mouse) — touch already scrolls natively.
    let dragging = false;
    let startX = 0;
    let startLeft = 0;
    let moved = false;

    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      dragging = true; moved = false;
      startX = e.clientX; startLeft = track.scrollLeft;
      track.setPointerCapture(e.pointerId);
    });
    track.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      track.scrollLeft = startLeft - dx;
    }, { passive: true });
    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      if (e.pointerId !== undefined) { try { track.releasePointerCapture(e.pointerId); } catch (_) { /* noop */ } }
    };
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    // Prevent accidental link drags when swiping.
    track.addEventListener('click', (e) => { if (moved) { e.preventDefault(); moved = false; } }, true);
  });
}
