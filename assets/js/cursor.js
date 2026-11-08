/* =====================================================================
   cursor.js — custom cursor (desktop, fine pointers only).
   A dot that tracks instantly + a lagging ring that grows and shows a
   label ("View", "Drag", "Play") over media targets. Disabled entirely
   for touch visitors and when reduced motion is preferred.
   ===================================================================== */
export function initCursor(ctx) {
  const finePointer = window.matchMedia('(pointer: fine)');
  if (!finePointer.matches || ctx.reduced.matches) return () => {};

  const dot = document.createElement('div');
  const ring = document.createElement('div');
  dot.className = 'cursor-dot';
  ring.className = 'cursor-ring';
  dot.setAttribute('aria-hidden', 'true');
  ring.setAttribute('aria-hidden', 'true');
  ring.innerHTML = '<span class="cursor-label" data-cursor-label></span>';
  document.body.append(dot, ring);
  document.documentElement.classList.add('has-cursor');

  const label = ring.querySelector('[data-cursor-label]');
  const state = { x: -100, y: -100, rx: -100, ry: -100, visible: false };
  let raf = null;

  const INTERACTIVE = 'a, button, summary, [role="button"], [data-cursor], input[type="range"]';

  const onMove = (e) => {
    state.x = e.clientX; state.y = e.clientY;
    if (!state.visible) { state.visible = true; dot.style.opacity = 1; ring.style.opacity = 1; }
    if (!raf) raf = requestAnimationFrame(tick);
    const target = e.target instanceof Element ? e.target.closest(INTERACTIVE) : null;
    if (target) {
      const labelWord = target.getAttribute('data-cursor');
      ring.dataset.state = labelWord ? 'media' : 'link';
      label.textContent = labelWord || '';
    } else if (e.target instanceof Element && e.target.closest('[data-testimonials]')) {
      ring.dataset.state = 'media';
      label.textContent = 'Drag';
    } else {
      ring.dataset.state = 'default';
      label.textContent = '';
    }
  };

  const onLeave = () => { state.visible = false; dot.style.opacity = 0; ring.style.opacity = 0; };

  const tick = () => {
    // Lerp the ring; the dot is instant.
    state.rx += (state.x - state.rx) * 0.16;
    state.ry += (state.y - state.ry) * 0.16;
    dot.style.transform = `translate(${state.x}px, ${state.y}px) translate(-50%, -50%)`;
    ring.style.transform = `translate(${state.rx}px, ${state.ry}px) translate(-50%, -50%)`;
    raf = (Math.abs(state.x - state.rx) > 0.2 || Math.abs(state.y - state.ry) > 0.2)
      ? requestAnimationFrame(tick)
      : null;
  };

  document.addEventListener('mousemove', onMove, { passive: true });
  document.addEventListener('mouseleave', onLeave);

  return () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseleave', onLeave);
    if (raf) cancelAnimationFrame(raf);
    dot.remove(); ring.remove();
    document.documentElement.classList.remove('has-cursor');
  };
}
