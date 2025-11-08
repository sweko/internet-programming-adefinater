// Single-file app script: loads data (ALT1 -> ALT2 merge -> local), shows loading/error,
// normalizes records, validates, supports filtering, sorting, pagination, and checklist.
(function () {
  'use strict';

  const ALT1 = 'https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/hugo-books-full.json';
  const ALT2_URLS = [
    'https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/hugo_books.json',
    'https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/hugo_edges.json',
    'https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/hugo_novellas.json'
  ];
  const LOCAL_JSON = './hugo-books-full.json'; // exact local fallback path

  const DEBOUNCE_MS = 150;
  const PAGE_SIZE = 50;

  // state
  let books = [];
  // Clean, single-file Hugo books loader + UI logic
  (function () {
    'use strict';

    const ALT1 = 'https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/hugo-books-full.json';
    const ALT2_URLS = [
      'https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/hugo_books.json',
      'https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/hugo_edges.json',
      'https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/hugo_novellas.json'
    ];
    const LOCAL_JSON = './hugo-books-full.json';

    const DEBOUNCE_MS = 150;
    const PAGE_SIZE = 50;

    let books = [];
    let filtered = [];
    let currentSort = { column: 'award', ascending: false };
    let currentPage = 1;

    const $ = id => document.getElementById(id);
    let loadingEl, errorEl, warningsEl, warningsCountEl, nameFilterEl, winnerFilterEl, clearBtnEl;
    let resultsCountEl, tbodyEl, noResultsEl, paginationEl;

    function initDom() {
      loadingEl = $('loading');
      errorEl = $('error');
      warningsEl = $('warnings');
      warningsCountEl = $('warningsCount');
      nameFilterEl = $('nameFilter');
      winnerFilterEl = $('winnerFilter');
      clearBtnEl = $('clearFilters');
      resultsCountEl = $('resultsCount');
      tbodyEl = $('booksTableBody');
      noResultsEl = $('noResults');
      paginationEl = $('pagination');

      if (!paginationEl) {
        paginationEl = document.createElement('div');
        paginationEl.id = 'pagination';
        const tableContainer = document.querySelector('.table-container');
        tableContainer && tableContainer.parentNode.insertBefore(paginationEl, tableContainer.nextSibling);
      }

      if (winnerFilterEl && winnerFilterEl.children.length === 0) {
        winnerFilterEl.innerHTML = '\n        <option value="all">All books</option>\n        <option value="winners">Winners only</option>\n        <option value="nominees">Nominees only</option>\n      ';
      }
    }

    function debounce(fn, ms = DEBOUNCE_MS) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
    function show(el, yes) { if (!el) return; el.classList.toggle('hidden', !yes); }
    function setText(el, txt) { if (!el) return; el.textContent = txt; }
    function showErrorMessage(msg) { if (!errorEl) return; errorEl.classList.remove('hidden'); errorEl.textContent = msg; }

    async function tryFetch(url) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        const json = await res.json();
        console.debug('fetch success:', url);
        return json;
      } catch (err) {
        console.debug('fetch failed:', url, err?.message || err);
        // show last error message but continue trying other sources
        showErrorMessage(`Failed to load ${url}: ${err?.message || err}`);
        return null;
      }
    }

    function extractArray(root) {
      if (!root) return [];
      if (Array.isArray(root)) return root;
      if (Array.isArray(root.books)) return root.books;
      if (Array.isArray(root.data)) return root.data;
      for (const v of Object.values(root)) if (Array.isArray(v)) return v;
      return [];
    }

    function normalize(r = {}) {
      const genres = Array.isArray(r.genres) ? r.genres : (typeof r.genres === 'string' ? r.genres.split(',').map(s => s.trim()).filter(Boolean) : []);
      return {
        id: r.id != null ? String(r.id) : undefined,
        title: (r.title ?? r.name ?? '').toString(),
        author: (r.author ?? r.authors ?? r.writer ?? '').toString(),
        publisher: r.publisher ?? '',
        award: r.award ?? undefined,
        series: r.series ?? undefined,
        genres
      };
    }

    function validateData(list) {
      const warnings = [];
      const seen = new Set();
      const now = new Date().getFullYear();
      list.forEach((b, i) => {
        if (!b || typeof b !== 'object') { warnings.push(`Invalid entry at index ${i}`); console.warn('Invalid entry', b); return; }
        if (!b.id) { warnings.push(`Missing id at index ${i}`); console.warn('Missing id', b); }
        else { if (seen.has(b.id)) { warnings.push(`Duplicate id: ${b.id}`); console.warn('Duplicate id', b.id); } else seen.add(b.id); }
        if (!b.title) { warnings.push(`Missing title for id=${b.id ?? i}`); console.warn('Missing title', b); }
        const y = b.award?.year; if (y != null && !Number.isNaN(Number(y)) && Number(y) > now) { warnings.push(`Future award year ${y} for id=${b.id}`); console.warn('Future year', b); }
        const win = b.award?.is_winner; if (win != null && typeof win !== 'boolean') { warnings.push(`Invalid winner flag for id=${b.id}`); console.warn('Invalid winner', b); }
      });
      setText(warningsCountEl, String(warnings.length));
      warningsEl?.classList.toggle('hidden', warnings.length === 0);
      return warnings;
    }

    function getAwardYear(b) { const y = b?.award?.year; const n = Number(y); return Number.isFinite(n) ? n : NaN; }
    function formatAward(b) { const y = getAwardYear(b); if (!Number.isFinite(y)) return '—'; return `${y} ${b?.award?.is_winner ? 'Winner' : 'Nominee'}`; }
    function formatSeries(s) { if (s === false || s == null) return 'None'; if (typeof s === 'string') return s || 'None'; if (typeof s === 'object' && s.name) return s.order != null ? `${s.name} (#${s.order})` : s.name; return 'None'; }

    function renderTablePage() {
      if (!tbodyEl || !resultsCountEl) return;
      tbodyEl.innerHTML = '';
      const total = filtered.length;
      const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      if (currentPage > pages) currentPage = pages;
      const start = (currentPage - 1) * PAGE_SIZE;
      const end = Math.min(total, start + PAGE_SIZE);
      setText(resultsCountEl, `Showing ${total===0?0:start + 1}-${end} of ${total} books (page ${currentPage}/${pages})`);
      if (total === 0) { show(noResultsEl, true); buildPagination(0); return; }
      show(noResultsEl, false);
      const frag = document.createDocumentFragment();
      for (let i = start; i < end; i++) {
        const b = filtered[i];
        const tr = document.createElement('tr');
        const mk = (label, text) => { const td = document.createElement('td'); td.setAttribute('data-label', label); td.textContent = (text != null && String(text) !== '') ? String(text) : '—'; return td; };
        tr.appendChild(mk('Title', b.title));
        tr.appendChild(mk('Author', b.author));
        tr.appendChild(mk('Type', b.award?.category ?? '—'));
        tr.appendChild(mk('Award', formatAward(b)));
        tr.appendChild(mk('Publisher', b.publisher));
        tr.appendChild(mk('Series', formatSeries(b.series)));
        tr.appendChild(mk('Genres', Array.isArray(b.genres) && b.genres.length ? b.genres.join(', ') : 'None'));
        frag.appendChild(tr);
      }
      tbodyEl.appendChild(frag);
      buildPagination(Math.max(1, Math.ceil(total / PAGE_SIZE)));
    }

    function buildPagination(pages) {
      if (!paginationEl) return; paginationEl.innerHTML = '';
      if (pages <= 1) return;
      const prev = document.createElement('button'); prev.textContent = '◀ Prev'; prev.disabled = currentPage === 1; prev.addEventListener('click', () => { currentPage = Math.max(1, currentPage - 1); renderTablePage(); });
      const next = document.createElement('button'); next.textContent = 'Next ▶'; next.disabled = currentPage === pages; next.addEventListener('click', () => { currentPage = Math.min(pages, currentPage + 1); renderTablePage(); });
      const goto = document.createElement('span'); goto.textContent = ` Page ${currentPage} of ${pages} `; goto.style.margin = '0 8px';
      paginationEl.appendChild(prev); paginationEl.appendChild(goto); paginationEl.appendChild(next);
    }

    function sortAndRefresh(column) {
      if (column) {
        if (currentSort.column === column) currentSort.ascending = !currentSort.ascending;
        else { currentSort.column = column; currentSort.ascending = true; }
      }
      const col = currentSort.column; const dir = currentSort.ascending ? 1 : -1;
      filtered.sort((a, b) => {
        if (col === 'award') {
          const ay = getAwardYear(a), by = getAwardYear(b);
          if (Number.isFinite(ay) && Number.isFinite(by)) return dir * (ay - by);
          if (Number.isFinite(ay)) return -1 * dir;
          if (Number.isFinite(by)) return 1 * dir;
          return 0;
        }
        const va = String(a[col] ?? '').toLowerCase(); const vb = String(b[col] ?? '').toLowerCase(); if (va < vb) return -1 * dir; if (va > vb) return 1 * dir; return 0;
      });
      document.querySelectorAll('.sort-indicator').forEach(si => si.textContent = '');
      const el = document.querySelector(`th[data-column="${col}"] .sort-indicator`);
      if (el) el.textContent = currentSort.ascending ? '↑' : '↓';
      currentPage = 1; renderTablePage();
    }

    function applyFilters() {
      const q = (nameFilterEl?.value || '').trim().toLowerCase();
      const winner = winnerFilterEl?.value || 'all';
      if (!q) {
        filtered = books.filter(b => {
          if (winner === 'winners') return !!b?.award?.is_winner;
          if (winner === 'nominees') return !!b?.award && !b.award.is_winner;
          return true;
        });
        sortAndRefresh();
        return;
      }
      const exact = [], titleContains = [], anyContains = [];
      books.forEach(b => {
        const title = (b.title || '').toLowerCase(); const author = (b.author || '').toLowerCase();
        const raw = [title, author, (b.publisher||'').toLowerCase(), (b.award?.category||'').toLowerCase(), (b.genres||[]).join(' ').toLowerCase()];
        const winOk = winner === 'all' ? true : (winner === 'winners' ? !!b?.award?.is_winner : (!!b?.award && !b.award.is_winner));
        if (!winOk) return;
        if (title === q) exact.push(b);
        else if (title.includes(q)) titleContains.push(b);
        else if (raw.some(f => f.includes(q))) anyContains.push(b);
      });
      filtered = exact.concat(titleContains, anyContains);
      filtered.sort((a,b) => { const ay = getAwardYear(a)||-Infinity; const by = getAwardYear(b)||-Infinity; return by - ay; });
      currentPage = 1; renderTablePage();
    }

    function clearFilters() { if (nameFilterEl) nameFilterEl.value = ''; if (winnerFilterEl) winnerFilterEl.value = 'all'; filtered = books.slice(); currentPage = 1; sortAndRefresh(); nameFilterEl?.focus(); }

    function attachHandlers() {
      nameFilterEl?.addEventListener('input', debounce(applyFilters, DEBOUNCE_MS));
      winnerFilterEl?.addEventListener('change', applyFilters);
      clearBtnEl?.addEventListener('click', clearFilters);
      document.querySelectorAll('th.sortable[data-column]').forEach(th => { const col = th.getAttribute('data-column'); th.addEventListener('click', () => sortAndRefresh(col)); });
    }

    function buildChecklist(list) {
      let checklistItemsEl = $('checklistItems');
      if (!checklistItemsEl) {
        const root = document.getElementById('checklist') || document.createElement('section');
        if (!root.id) root.id = 'checklist';
        root.innerHTML = '<h2>Books Checklist</h2><div id="checklistItems"></div>';
        const main = document.querySelector('main') || document.body; if (!document.getElementById('checklist')) main.appendChild(root);
        checklistItemsEl = $('checklistItems');
      }
      checklistItemsEl.innerHTML = '';
      const ul = document.createElement('ul'); ul.style.listStyle = 'none'; ul.style.padding = '0';
      (list || []).forEach((b, i) => {
        const li = document.createElement('li'); li.style.marginBottom = '4px';
        const id = `chk-${String(b.id ?? i).replace(/[^a-zA-Z0-9_-]/g,'_')}`;
        const label = document.createElement('label'); const input = document.createElement('input'); input.type = 'checkbox'; input.id = id; input.dataset.bookId = b.id ?? '';
        label.appendChild(input); label.appendChild(document.createTextNode(' ' + (b.title || '(No title)'))); li.appendChild(label); ul.appendChild(li);
      });
      checklistItemsEl.appendChild(ul);
    }

    async function loadFromAlt1() { const j = await tryFetch(ALT1); if (!j) return null; console.debug('source succeeded: ALT1'); return extractArray(j); }
    async function loadFromAlt2Merge() { const merged = []; for (const u of ALT2_URLS) { const res = await tryFetch(u); if (res) { console.debug('source succeeded (ALT2):', u); const arr = extractArray(res); if (arr && arr.length) merged.push(...arr); } } return merged.length ? merged : null; }
    async function loadFromLocal() { const j = await tryFetch(LOCAL_JSON); if (!j) return null; console.debug('source succeeded: LOCAL'); return extractArray(j); }

    async function loadData() {
      initDom(); show(loadingEl, true); if (errorEl) errorEl.classList.add('hidden');
      let dataArr = null; let usedLocal = false;
      try {
        dataArr = await loadFromAlt1();
        if (!dataArr || !dataArr.length) { dataArr = await loadFromAlt2Merge(); if (dataArr && dataArr.length) console.info('✅ Data loaded (merged ALT2)'); }
        if (!dataArr || !dataArr.length) { dataArr = await loadFromLocal(); if (dataArr && dataArr.length) { usedLocal = true; console.warn(`⚠️ Remote failed, using local JSON (${LOCAL_JSON})`); } }
        if (!dataArr || !dataArr.length) { const msg = '❌ Data load error: no data available from remote or local sources.'; console.error(msg); showErrorMessage(msg); books = []; filtered = []; window.__booksLoaded = 0; renderTablePage(); buildChecklist([]); return; }
        books = (dataArr || []).map(normalize);
        validateData(books);
        filtered = books.slice(); window.__booksLoaded = books.length;
        console.info(`✅ Data loaded successfully (${books.length} books)${usedLocal? ' — local fallback' : ''}`);
        if (errorEl) errorEl.classList.add('hidden');
        attachHandlers();
        buildChecklist(books);
        sortAndRefresh();
      } catch (err) {
        const msg = `❌ Data load error: ${err?.message ?? err}`; console.error(msg); showErrorMessage(msg); books = []; filtered = []; window.__booksLoaded = 0; renderTablePage(); buildChecklist([]);
      } finally { show(loadingEl, false); }
    }

    document.addEventListener('DOMContentLoaded', () => { loadData(); window._hugo = { reload: loadData, books: () => books.slice(), filtered: () => filtered.slice() }; });

  })();

  async function loadFromLocal() {
    const j = await tryFetch(LOCAL_JSON);
    if (!j) return null;
    console.debug(`source succeeded: LOCAL -> ${LOCAL_JSON}`);
    return extractArray(j);
  }

  async function loadData() {
    show(loadingEl, true);
    if (errorEl) errorEl.classList.add('hidden');
    let dataArr = null;
    try {
      dataArr = await loadFromAlt1();

      if (!dataArr || !dataArr.length) {
        dataArr = await loadFromAlt2Merge();
        if (dataArr && dataArr.length) console.info('✅ Data loaded successfully (merged ALT2)');
      }

      if (!dataArr || !dataArr.length) {
        dataArr = await loadFromLocal();
        if (dataArr && dataArr.length) console.warn(`⚠️ Remote failed, using local JSON (${LOCAL_JSON})`);
      }

      if (!dataArr || !dataArr.length) {
        const msg = '❌ Data load error: no data available from remote or local sources.';
        console.error(msg);
        showErrorMessage(msg);
        books = [];
        filtered = [];
        window.__booksLoaded = 0;
        renderTable();
        buildChecklist([]);
        return;
      }

      books = (dataArr || []).map(normalize);
      filtered = books.slice();
      window.__booksLoaded = books.length;

      console.info(`✅ Data loaded successfully (${books.length} books)`);
      if (errorEl) errorEl.classList.add('hidden');

      attachHandlers();
      sortAndRender();

      // Build checklist automatically from loaded data (all book titles)
      buildChecklist(books);
    } catch (err) {
      const msg = `❌ Data load error: ${err?.message ?? err}`;
      console.error(msg);
      showErrorMessage(msg);
      books = [];
      filtered = [];
      window.__booksLoaded = 0;
      renderTable();
      buildChecklist([]);
    } finally {
      show(loadingEl, false);
    }
  }

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    initDom();
    attachHandlers();
    loadData();
    // small debug API
    window._hugo = { reload: loadData, books: () => books.slice(), filtered: () => filtered.slice() };
  });

})();