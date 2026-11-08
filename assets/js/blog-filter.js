/* =====================================================================
   blog-filter.js — blog archive filtering.
   Category chips + live search (title/tags) + batched pagination with
   a working page bar and load-more. Supports ?q= deep links (used by
   the site's SearchAction structured data).
   ===================================================================== */
const PAGE_SIZE = 6;

export function initBlogFilter(ctx) {
  const grid = document.querySelector('[data-blog-grid]');
  if (!grid) return;

  const items = Array.from(grid.querySelectorAll('[data-post]'));
  const chips = document.querySelectorAll('[data-filter]');
  const search = document.querySelector('[data-blog-search]');
  const count = document.querySelector('[data-results-count]');
  const loadMore = document.querySelector('[data-load-more]');
  const pagination = document.querySelector('[data-pagination]');
  const empty = document.querySelector('[data-blog-empty]');

  let category = 'all';
  let query = '';
  let page = 0;
  let visible = [];

  const matches = (item) => {
    const cats = (item.dataset.cats || '').split(',').map((s) => s.trim()).filter(Boolean);
    const catOk = category === 'all' || cats.includes(category);
    const haystack = `${item.dataset.title || ''} ${item.dataset.tags || ''}`.toLowerCase();
    const q = query.trim().toLowerCase();
    return catOk && (!q || haystack.includes(q));
  };

  const render = () => {
    visible = items.filter(matches);
    const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
    page = Math.min(page, pages - 1);

    items.forEach((item) => {
      const idx = visible.indexOf(item);
      const show = idx !== -1 && Math.floor(idx / PAGE_SIZE) === page;
      item.hidden = !show;
      item.classList.toggle('is-filtered-out', !show);
      if (show) {
        // soft re-entry animation
        item.classList.remove('is-in');
        requestAnimationFrame(() => requestAnimationFrame(() => item.classList.add('is-in')));
        item.style.setProperty('--reveal-delay', `${(idx % PAGE_SIZE) * 60}ms`);
      }
    });

    if (count) count.textContent = `${visible.length} article${visible.length === 1 ? '' : 's'}`;
    if (empty) empty.hidden = visible.length !== 0;
    if (loadMore) loadMore.hidden = page >= pages - 1;

    if (pagination) {
      const buttons = [];
      for (let p = 0; p < pages; p += 1) {
        buttons.push(`<li><button type="button" data-page="${p}" ${p === page ? 'aria-current="page"' : ''} class="${p === page ? 'text-chalk' : 'text-mist/70 hover:text-chalk'} font-mono text-xs tracking-[0.18em] px-3 py-2 transition-colors">${String(p + 1).padStart(2, '0')}</button></li>`);
      }
      pagination.innerHTML = `
        <li><button type="button" data-page-nav="prev" ${page === 0 ? 'disabled' : ''} class="chip" aria-label="Previous page">←</button></li>
        ${buttons.join('')}
        <li><button type="button" data-page-nav="next" ${page >= pages - 1 ? 'disabled' : ''} class="chip" aria-label="Next page">→</button></li>`;
    }
  };

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      category = chip.dataset.filter || 'all';
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      page = 0;
      render();
    });
  });

  let debounce = null;
  search?.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => { query = search.value || ''; page = 0; render(); }, 180);
  });

  loadMore?.addEventListener('click', () => { page += 1; render(); });

  pagination?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn || btn.disabled) return;
    if (btn.dataset.pageNav === 'prev') page -= 1;
    else if (btn.dataset.pageNav === 'next') page += 1;
    else page = parseInt(btn.dataset.page, 10) || 0;
    render();
    grid.scrollIntoView({ behavior: ctx.reduced.matches ? 'auto' : 'smooth', block: 'start' });
  });

  // Deep link ?q= (matches the WebSite SearchAction schema)
  const initial = new URLSearchParams(location.search).get('q');
  if (initial && search) { search.value = initial; query = initial; }

  render();
}
