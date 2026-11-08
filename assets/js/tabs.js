/* =====================================================================
   tabs.js — accessible tabbed content ([data-tabs]).
   Full keyboard support (Left/Right/Home/End), roving tabindex,
   aria-selected + hidden panel management. Without JS, all panels
   remain visible stacked (progressive enhancement).
   ===================================================================== */
export function initTabs() {
  document.querySelectorAll('[data-tabs]').forEach((widget) => {
    const tabs = Array.from(widget.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;
    const panels = Array.from(widget.querySelectorAll('[role="tabpanel"]'));

    const activate = (tab, focus = true) => {
      tabs.forEach((t) => {
        const selected = t === tab;
        t.setAttribute('aria-selected', String(selected));
        t.tabIndex = selected ? 0 : -1;
        if (selected && focus) t.focus();
      });
      panels.forEach((panel) => {
        const isTarget = panel.id === tab.getAttribute('aria-controls');
        panel.hidden = !isTarget;
        if (isTarget) {
          panel.classList.remove('hidden');
          panel.dataset.active = 'true';
          // re-trigger reveal animations inside the panel
          panel.querySelectorAll('[data-reveal]:not(.is-in)').forEach((n) => n.classList.add('is-in'));
        } else {
          delete panel.dataset.active;
        }
      });
    };

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => activate(tab, false));
      tab.addEventListener('keydown', (e) => {
        const i = tabs.indexOf(tab);
        let next = null;
        if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') next = tabs[0];
        else if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); activate(next); }
      });
    });

    // Initial state — first tab wins; panels without a tab stay visible.
    activate(tabs[0], false);
  });
}
