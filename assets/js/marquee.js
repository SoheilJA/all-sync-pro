/* =====================================================================
   marquee.js — infinite client-logo marquee.
   Duplicates each track's content until it is at least 2× its
   container, then lets CSS (transform translateX(-50%)) loop it.
   Clones are aria-hidden; hover pause is pure CSS.
   ===================================================================== */
export function initMarquee() {
  document.querySelectorAll('.marquee').forEach((marquee) => {
    const track = marquee.querySelector('.marquee-track');
    if (!track) return;
    const containerWidth = marquee.offsetWidth;
    const contentWidth = track.scrollWidth;
    if (!contentWidth) return;

    // Duplicate (aria-hidden clones) until the track is ≥ 2× the viewport
    // of the marquee, capped at 4 copies for sanity.
    let copies = 1;
    while (track.scrollWidth < containerWidth * 2 && copies < 4) {
      Array.from(track.children).forEach((child) => {
        const clone = child.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.removeAttribute('id');
        clone.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
        track.appendChild(clone);
      });
      copies += 1;
    }
    // The CSS loop translates exactly -50%, so content must exist twice.
    if (copies % 2 === 1) {
      Array.from(track.children).forEach((child) => {
        const clone = child.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
        track.appendChild(clone);
      });
    }

    // Speed: constant px/s → duration scales with width.
    const pxPerSecond = 62;
    const dur = Math.max(18, Math.round((track.scrollWidth / 2) / pxPerSecond));
    track.style.setProperty('--marquee-dur', `${dur}s`);
  });
}
