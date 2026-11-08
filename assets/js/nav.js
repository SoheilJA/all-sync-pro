/* =====================================================================
   nav.js — fixed header, services mega-menu (desktop), and the
   full-screen mobile menu with focus trapping + scroll lock.
   The mega-menu itself opens via pure CSS (group-hover /
   group-focus-within); this module syncs ARIA state, Escape and
   outside-click. Anchor links route through the smooth scroller.
   ===================================================================== */
const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, summary, [tabindex]:not([tabindex="-1"])';

export function initNav(ctx) {
  const header = document.querySelector('[data-header]');
  const megaWrap = document.querySelector('[data-mega-wrap]');
  const megaTrigger = document.querySelector('[data-mega-trigger]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  const openBtn = document.querySelector('[data-menu-open]');
  const closeBtn = document.querySelector('[data-menu-close]');

  /* --- Header scroll state --- */
  let scrollRaf = null;
  const paintHeader = () => {
    scrollRaf = null;
    if (!header) return;
    header.dataset.scrolled = String(window.scrollY > 24);
  };
  window.addEventListener('scroll', () => { if (!scrollRaf) scrollRaf = requestAnimationFrame(paintHeader); }, { passive: true });
  paintHeader();

  /* --- Mega menu ARIA + outside click + Escape --- */
  if (megaWrap && megaTrigger) {
    const setOpen = (open) => megaTrigger.setAttribute('aria-expanded', String(open));
    megaWrap.addEventListener('mouseenter', () => setOpen(true), { passive: true });
    megaWrap.addEventListener('mouseleave', () => setOpen(false), { passive: true });
    megaWrap.addEventListener('focusin', () => setOpen(true));
    megaWrap.addEventListener('focusout', () => {
      // delay so focus moving between links inside the wrap doesn't flap
      setTimeout(() => { if (!megaWrap.contains(document.activeElement)) setOpen(false); }, 80);
    });
    megaTrigger.addEventListener('click', () => {
      const open = megaTrigger.getAttribute('aria-expanded') !== 'true';
      setOpen(open);
      if (open) megaWrap.querySelector('a')?.focus();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (megaTrigger.getAttribute('aria-expanded') === 'true') { setOpen(false); megaTrigger.focus(); }
      if (mobileMenu?.dataset.open === 'true') closeMobile();
    });
    document.addEventListener('click', (e) => {
      if (megaTrigger.getAttribute('aria-expanded') !== 'true') return;
      if (!megaWrap.contains(e.target)) setOpen(false);
    });
  }

  /* --- Mobile menu: overlay, stagger, focus trap, scroll lock --- */
  let lastFocused = null;

  const trapFocus = (e) => {
    if (e.key !== 'Tab' || !mobileMenu || mobileMenu.dataset.open !== 'true') return;
    const focusables = Array.from(mobileMenu.querySelectorAll(FOCUSABLE)).filter((n) => n.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  function openMobile() {
    if (!mobileMenu) return;
    lastFocused = document.activeElement;
    mobileMenu.dataset.open = 'true';
    openBtn?.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('menu-locked');
    ctx.lockScroll?.(true);
    const first = mobileMenu.querySelector(FOCUSABLE);
    requestAnimationFrame(() => first?.focus());
  }

  function closeMobile() {
    if (!mobileMenu) return;
    mobileMenu.dataset.open = 'false';
    openBtn?.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('menu-locked');
    ctx.lockScroll?.(false);
    lastFocused?.focus?.();
  }

  openBtn?.addEventListener('click', openMobile);
  closeBtn?.addEventListener('click', closeMobile);
  document.addEventListener('keydown', trapFocus);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && mobileMenu?.dataset.open === 'true') closeMobile(); });
  // Close when a menu link is chosen (nav follows immediately).
  mobileMenu?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => closeMobile()));

  /* --- Smooth anchor links --- */
  document.addEventListener('click', (e) => {
    const link = e.target instanceof Element ? e.target.closest('a[href^="#"]') : null;
    if (!link) return;
    const id = link.getAttribute('href');
    if (!id || id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    ctx.scrollTo?.(target, { offset: -110 });
    history.replaceState(null, '', id);
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
}
