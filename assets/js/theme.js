/* =====================================================================
   theme.js — dark/light theme toggle with persistence.
   The initial theme class is applied by a tiny inline <head> script
   (before first paint); this module wires the toggle buttons and keeps
   meta[name=theme-color] in sync.
   ===================================================================== */
const STORE_KEY = 'asp-theme';

export function initTheme(ctx) {
  const root = document.documentElement;
  const buttons = document.querySelectorAll('[data-theme-toggle]');
  const meta = document.querySelector('meta[name="theme-color"]');
  const schemes = { dark: '#06070A', light: '#F6F5F2' };

  const current = () => (root.classList.contains('theme-light') ? 'light' : 'dark');

  const paint = () => {
    if (meta) meta.setAttribute('content', schemes[current()] || schemes.dark);
    buttons.forEach((btn) => {
      btn.setAttribute('aria-pressed', String(current() === 'light'));
      btn.setAttribute('aria-label', current() === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
      // swap icon visibility
      btn.querySelectorAll('[data-icon-sun], [data-icon-moon]').forEach((icon) => {
        icon.toggleAttribute('hidden', false);
      });
      const sun = btn.querySelector('[data-icon-sun]');
      const moon = btn.querySelector('[data-icon-moon]');
      if (sun && moon) {
        sun.hidden = current() === 'dark';   // show sun when dark (click → light)
        moon.hidden = current() === 'light'; // show moon when light (click → dark)
      }
    });
  };

  const set = (mode, { persist = true } = {}) => {
    root.classList.toggle('theme-light', mode === 'light');
    root.classList.toggle('theme-dark', mode !== 'light');
    if (persist) { try { localStorage.setItem(STORE_KEY, mode); } catch (_) { /* storage blocked */ } }
    paint();
  };

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => set(current() === 'light' ? 'dark' : 'light'));
  });

  // Follow OS changes only while the visitor has not made an explicit choice.
  const mq = window.matchMedia('(prefers-color-scheme: light)');
  const onOSChange = (e) => {
    let stored = null;
    try { stored = localStorage.getItem(STORE_KEY); } catch (_) { /* noop */ }
    if (!stored) set(e.matches ? 'light' : 'dark', { persist: false });
  };
  if (mq.addEventListener) mq.addEventListener('change', onOSChange);

  paint();
  ctx.theme = { set, current };
}
