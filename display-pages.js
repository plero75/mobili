/* Present every Joinville line in readable groups on the shared TV.
   Pagination changes presentation only; departure filtering remains upstream. */
(() => {
  function pageState(total, capacity, elapsedMs) {
    const pages = Math.ceil(total / capacity);
    const index = pages ? Math.floor(elapsedMs / 12000) % pages : 0;
    const start = index * capacity;
    return { index, pages, start, end:Math.min(total, start + capacity) };
  }
  window.MobiliBoardPages = { pageState };

  document.addEventListener('DOMContentLoaded', () => {
    const view = document.getElementById('joinville-bus-view');
    if (!view) return;
    const tv = window.matchMedia('(min-width:1200px) and (min-height:680px) and (orientation:landscape)');
    const startedAt = performance.now();
    function renderPage() {
      const grid = view.querySelector('.vhpratp-bus-grid');
      if (!grid) return;
      const lines = Array.from(grid.children);
      const page = pageState(lines.length, tv.matches ? 4 : Math.max(1, lines.length), performance.now() - startedAt);
      lines.forEach((line, index) => {
        const inactive = index < page.start || index >= page.end;
        line.classList.toggle('board-page-hidden', inactive);
        if (inactive) line.setAttribute('aria-hidden', 'true');
        else line.removeAttribute('aria-hidden');
      });
      let indicator = view.querySelector('.board-pagination');
      if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'board-pagination';
        indicator.setAttribute('aria-label', 'Pages des lignes de bus');
        view.appendChild(indicator);
      }
      const text = page.pages > 1 ? `Lignes ${page.start + 1}–${page.end} sur ${lines.length} · page ${page.index + 1}/${page.pages} · alternance 12 s` : '';
      if (indicator.textContent !== text) indicator.textContent = text;
    }
    // The upstream renderer replaces the grid after each feed refresh.
    new MutationObserver(renderPage).observe(view, {childList:true, subtree:true});
    tv.addEventListener('change', renderPage);
    window.setInterval(renderPage, 1000);
    renderPage();
  });
})();
