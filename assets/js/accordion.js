/* =====================================================================
   accordion.js — FAQ accordions built on native <details>.
   Native details/summary keeps content accessible and crawlable even
   without JS; this module adds a smooth height animation and
   one-open-at-a-time behaviour inside [data-acc-group] containers.
   ===================================================================== */
export function initAccordion(ctx) {
  const groups = document.querySelectorAll('[data-acc-group]');

  groups.forEach((group) => {
    const items = Array.from(group.querySelectorAll('details.acc'));

    items.forEach((details) => {
      const summary = details.querySelector('summary');
      const panel = details.querySelector('.acc-panel');
      if (!summary || !panel) return;

      const close = () => {
        details.classList.remove('is-open');
        const done = () => { details.removeAttribute('open'); };
        if (ctx.reduced.matches) { done(); return; }
        panel.addEventListener('transitionend', done, { once: true });
        // Safety: force-close if the transition never fires (tab hidden).
        setTimeout(() => { if (!details.classList.contains('is-open')) done(); }, 600);
      };

      summary.addEventListener('click', (e) => {
        e.preventDefault();
        if (details.hasAttribute('open')) { close(); return; }
        // one-open-at-a-time within the group
        items.forEach((other) => {
          if (other !== details && other.hasAttribute('open')) {
            other.classList.remove('is-open');
            const otherPanel = other.querySelector('.acc-panel');
            const fin = () => other.removeAttribute('open');
            if (ctx.reduced.matches) { fin(); return; }
            if (otherPanel) otherPanel.addEventListener('transitionend', fin, { once: true });
            setTimeout(fin, 600);
          }
        });
        details.setAttribute('open', '');
        requestAnimationFrame(() => requestAnimationFrame(() => details.classList.add('is-open')));
      });
    });
  });

  // Open the first item of each group by default (nice default state).
  groups.forEach((group) => {
    const first = group.querySelector('details.acc');
    if (first) { first.setAttribute('open', ''); first.classList.add('is-open'); }
  });
}
