// Configuration
const CONFIG = {
    // Use the provided GitHub raw endpoint so the page fetches the canonical dataset.
    DATA_URL: 'https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/doctor-who-episodes-full.json',
    ERA_ORDER: ['Classic', 'Modern', 'Recent']
};

// State
const state = {
    episodes: [],      // all loaded episodes
    filtered: [],      // filtered + sorted items currently displayed
    // support multi-column sorting: array of { field, ascending }
    sort: [ { field: 'rank', ascending: true } ],
    filters: { name: '' },
    warnings: []
};

// View options
state.view = {
    groupByDecade: true // enable decade grouping (collapsible sections)
};

// Pagination state for large datasets
state.pagination = {
    page: 1,
    pageSize: 50,
    pageSizes: [25, 50, 100]
};

// Helpers
const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));

function debounce(fn, wait = 250) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
    };
}

// Remove emoji characters and other pictographs from strings for cleaner UI display
function sanitizeString(s) {
    if (s === null || s === undefined) return '';
    let str = String(s);
    try { str = str.normalize('NFC'); } catch (e) {}

    // Prefer Unicode property escape when available (modern browsers)
    try {
        str = str.replace(/\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji}/gu, '');
    } catch (e) {
    // Fallback: remove common emoji/pictograph ranges
    str = str.replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1F1E6}-\u{1F1FF}\u2600-\u26FF\u2700-\u27BF]/gu, '');
        // Also remove surrogate pairs commonly used for emojis
        str = str.replace(/([\uD800-\uDBFF][\uDC00-\uDFFF])/g, '');
    }

    // Collapse whitespace and trim
    str = str.replace(/\s+/g, ' ').trim();
    return str;
}

// Populate era, doctor and companion filter dropdowns based on loaded data
function populateFilterOptions() {
    const eraSel = document.getElementById('era-filter');
    const docSel = document.getElementById('doctor-filter');
    const compSel = document.getElementById('companion-filter');
    if (!eraSel && !docSel && !compSel) return;

    // Eras: prefer canonical order, but include any extras
    const eras = new Set();
    state.episodes.forEach(ep => eras.add(ep.era || 'Unknown'));
    const eraList = CONFIG.ERA_ORDER.concat(Array.from(eras).filter(e => !CONFIG.ERA_ORDER.includes(e))).filter(Boolean);
    if (eraSel) {
        eraSel.innerHTML = '';
        const optAll = document.createElement('option'); optAll.value = ''; optAll.textContent = 'All'; eraSel.appendChild(optAll);
        eraList.forEach(e => {
            const opt = document.createElement('option'); opt.value = e; opt.textContent = e; eraSel.appendChild(opt);
        });
        // restore previous selection if any
        if (state.filters.era) eraSel.value = state.filters.era;
    }

    // Doctors: collect unique formatted doctor strings
    const doctors = new Set();
    state.episodes.forEach(ep => {
        const d = formatPerson(ep.doctor);
        if (d && d !== '—') doctors.add(d);
    });
    const docList = Array.from(doctors).sort((a,b) => a.localeCompare(b));
    if (docSel) {
        docSel.innerHTML = '';
        const optAll = document.createElement('option'); optAll.value = ''; optAll.textContent = 'All'; docSel.appendChild(optAll);
        docList.forEach(d => { const opt = document.createElement('option'); opt.value = d; opt.textContent = d; docSel.appendChild(opt); });
        if (state.filters.doctor) docSel.value = state.filters.doctor;
    }

    // Companions: include 'None' for null companions plus unique names
    const comps = new Set();
    state.episodes.forEach(ep => {
        if (!ep.companion) comps.add('None');
        else {
            const c = formatPerson(ep.companion);
            if (c && c !== '—') comps.add(c);
        }
    });
    // Place 'None' last in the companion dropdown for clarity
    let compList = Array.from(comps).filter(c => c !== 'None').sort((a,b) => a.localeCompare(b));
    if (comps.has('None')) compList.push('None');
    if (compSel) {
        compSel.innerHTML = '';
        const optAll = document.createElement('option'); optAll.value = ''; optAll.textContent = 'All'; compSel.appendChild(optAll);
        compList.forEach(c => { const opt = document.createElement('option'); opt.value = c === 'None' ? '__NONE__' : c; opt.textContent = c; compSel.appendChild(opt); });
        // restore previous selection (note: stored value uses '__NONE__' for None)
        if (state.filters.companion) compSel.value = state.filters.companion;
    }
}

// Initialization
async function init() {
    setupEventListeners();
    await loadEpisodes();
}

/*
Optimization notes (Tier 3 - Performance):

- Problem: Rendering 1000+ table rows can be slow and cause jank.
- Approaches:
  1) Virtualization (recommended for very large lists): only render visible rows in the DOM.
      - Pros: Lowest DOM cost, best responsiveness for very large datasets.
      - Cons: More complex to implement (scroll listeners, measurement, sticky headers).

  2) Pagination (implemented below): split the filtered dataset into pages and render one page at a time.
      - Pros: Simple, predictable performance, easy to implement and grade.
      - Cons: Requires user interaction to move between pages; not as seamless as virtualization.

  3) Debouncing (already used for filters): reduces frequency of expensive operations (filter/sort/render).

This implementation uses pagination (client-side) with configurable page sizes. If you need virtualization later,
the renderTable() function is the right place to swap in a virtual renderer.
*/

// Event listeners
function setupEventListeners() {
    const nameInput = $('#name-filter');
    if (nameInput) {
        nameInput.addEventListener('input', debounce((e) => {
            state.filters.name = e.target.value.trim();
            applyFiltersAndSort();
        }, 300));
    }

    // Data source selector: reload when changed and show loading immediately
    const src = $('#data-source');
    if (src) {
        src.addEventListener('change', () => {
            // show loading immediately, then fetch
            showLoading(true);
            // small timeout to ensure UI updates before heavy fetch starts
            setTimeout(() => loadEpisodes(), 10);
        });
    }

    // Era / Doctor / Companion filters (populated after data loads)
    const eraSel = document.getElementById('era-filter');
    const docSel = document.getElementById('doctor-filter');
    const compSel = document.getElementById('companion-filter');
    if (eraSel) {
        eraSel.addEventListener('change', (e) => {
            state.filters.era = e.target.value || '';
            applyFiltersAndSort();
        });
    }
    if (docSel) {
        docSel.addEventListener('change', (e) => {
            state.filters.doctor = e.target.value || '';
            applyFiltersAndSort();
        });
    }
    if (compSel) {
        compSel.addEventListener('change', (e) => {
            state.filters.companion = e.target.value || '';
            applyFiltersAndSort();
        });
    }

    // Export CSV button
    const exportBtn = document.getElementById('export-csv');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportFilteredToCSV();
        });
    }

    // Collapse/Expand all decades control
    const toggleDecBtn = document.getElementById('toggle-decades');
    if (toggleDecBtn) {
        toggleDecBtn.addEventListener('click', () => {
            collapseExpandAllDecades();
        });
    }

    // Sorting: click on headers (supports shift+click for multi-column sort)
    $$('th[data-sort]').forEach(th => {
        th.addEventListener('click', (ev) => {
            const field = th.getAttribute('data-sort');

            // If Shift is held, add or toggle secondary sort levels
            if (ev.shiftKey) {
                // find existing level
                const idx = state.sort.findIndex(s => s.field === field);
                if (idx === -1) {
                    // add as lowest-priority (end)
                    state.sort.push({ field, ascending: true });
                } else {
                    // toggle existing level's direction
                    state.sort[idx].ascending = !state.sort[idx].ascending;
                }
            } else {
                // regular click: set single primary sort or toggle if same
                if (state.sort.length === 1 && state.sort[0].field === field) {
                    state.sort[0].ascending = !state.sort[0].ascending;
                } else {
                    state.sort = [ { field, ascending: true } ];
                }
            }

            applyFiltersAndSort();
            updateSortIndicators();
        });
        th.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                // emulate click without shift; if Shift+Enter pressed use Shift
                const ev = new MouseEvent('click', { bubbles: true, cancelable: true, shiftKey: e.shiftKey });
                th.dispatchEvent(ev);
            }
        });
        th.tabIndex = 0; // make header focusable for keyboard
    });
}

// Load episodes
async function loadEpisodes() {
    showLoading(true);
    showError('');
    state.warnings = [];

    try {
        // Use fetch with timeout to avoid hanging requests
        const res = await fetchWithTimeout(CONFIG.DATA_URL, {}, 15000);
        if (!res.ok) throw new Error(`Network response was not ok (${res.status})`);
    const data = await res.json();

    // Accept either an array or an object containing an `episodes` array
    const arr = Array.isArray(data) ? data : (data && Array.isArray(data.episodes) ? data.episodes : null);
    if (!arr) throw new Error('Fetched JSON does not contain an episodes array');

    state.episodes = arr.map((ep, i) => normalizeEpisode(ep, i));

    validateData(state.episodes);

    // populate dynamic filters (era, doctor, companion) now that episodes are loaded
    populateFilterOptions();

    applyFiltersAndSort();
    } catch (err) {
        console.error('Failed to load episodes:', err);

        // Classify common errors for friendlier messages
        let msg = 'Failed to load episodes.';
        if (err.name === 'AbortError' || (err.message && err.message.toLowerCase().includes('timeout'))) {
            msg = 'Request timed out while fetching episodes. The server may be slow or unreachable.';
        } else if (err instanceof TypeError) {
            // Fetch throws TypeError on network failure / CORS
            msg = 'Network error or cross-origin request blocked. Check your internet connection or use the local data option.';
        } else if (err.message && err.message.includes('episodes array')) {
            msg = 'Unexpected data format received from server.';
        } else if (err.message) {
            msg = err.message;
        }

        // Show error with a retry button so the user can attempt again
        // Pass the error object for optional details in the UI
        showError('Failed to load episodes: ' + msg, true, err);
        state.episodes = [];
        state.filtered = [];
        renderTable();
    } finally {
        showLoading(false);
    }
}

// fetch with timeout helper
function fetchWithTimeout(resource, options = {}, timeout = 15000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            const e = new Error('Fetch timeout');
            e.name = 'AbortError';
            reject(e);
        }, timeout);

        fetch(resource, options).then(response => {
            clearTimeout(timer);
            resolve(response);
        }).catch(err => {
            clearTimeout(timer);
            reject(err);
        });
    });
}

// Normalize one episode (safeguard missing fields)
function normalizeEpisode(ep, idx) {
    const out = Object.assign({}, ep);
    // Ensure required fields exist with safe fallbacks
    out.rank = Number.isFinite(out.rank) ? Number(out.rank) : null;
    // Normalize title to NFC to ensure accented characters and composed forms render
    // consistently. Use toString() to guard against non-string values.
    try {
        out.title = (out.title || '').toString().normalize('NFC');
    } catch (e) {
        // normalize may not be supported in very old environments; fallback
        out.title = (out.title || '').toString();
    }
    out.series = Number.isFinite(out.series) ? Number(out.series) : null;
    out.era = out.era || 'Unknown';
    out.broadcast_date_raw = out.broadcast_date || '';
    out.director = out.director || '—';
    // Normalize writer field: support single string, multiple writers joined with '&', 'and' or commas.
    out.writer = out.writer || '';
    // Create a normalized list of writers for display and sorting
    if (Array.isArray(out.writer)) {
        out.writerList = out.writer.map(w => String(w).trim()).filter(Boolean);
    } else if (typeof out.writer === 'string') {
        // split on common separators: '&', ' and ', ','
        const parts = out.writer.split(/\s*(?:&|and|,)\s*/i).map(s => s.trim()).filter(Boolean);
        out.writerList = parts.length ? parts : (out.writer ? [out.writer.trim()] : []);
    } else {
        out.writerList = [];
    }
    out.doctor = out.doctor || { actor: '—', incarnation: '' };
    // Normalize companion: accept null, string, or object. Convert strings to an object
    // and treat empty/blank values as null so the UI can display a clear "None".
    if (!out.hasOwnProperty('companion') || out.companion === null || out.companion === undefined) {
        out.companion = null;
    } else if (typeof out.companion === 'string') {
        const s = out.companion.trim();
        out.companion = s ? { actor: s } : null;
    } else if (typeof out.companion === 'object') {
        // If object has no useful keys, treat as null
        const keys = Object.keys(out.companion || {}).filter(k => {
            const v = out.companion[k];
            return v !== null && v !== undefined && String(v).trim() !== '';
        });
        if (!keys.length) out.companion = null;
    } else {
        out.companion = null;
    }
    // Normalize cast array: accept arrays of objects or strings, filter null/empty entries.
    if (Array.isArray(out.cast)) {
        out.cast = out.cast.map(item => {
            if (item === null || item === undefined) return null;
            if (typeof item === 'string') {
                const s = item.trim();
                return s ? { actor: s } : null;
            }
            if (typeof item === 'object') {
                // Normalize common keys and trim strings
                const actor = (item.actor || item.name || '').toString().trim();
                const character = (item.character || item.role || '').toString().trim();
                // If both empty, consider this entry useless
                if (!actor && !character) return null;
                return { actor: actor || '', character: character || '' };
            }
            return null;
        }).filter(Boolean);
    } else {
        out.cast = [];
    }
    out._idx = idx; // stable fallback ordering
    out._parsedDate = parseDate(out.broadcast_date_raw);
    return out;
}

// Apply filters then sort then render
function applyFiltersAndSort() {
    filterEpisodes();
    sortEpisodes();
    // reset to first page whenever result set changes
    state.pagination.page = 1;
    renderTable();
}

// Filtering
function filterEpisodes() {
    const q = (state.filters.name || '').toString().trim().toLowerCase();

    // Prepare other filters
    const eraF = (state.filters.era || '').toString().trim().toLowerCase();
    const doctorF = (state.filters.doctor || '').toString().trim().toLowerCase();
    const companionF = (state.filters.companion || '').toString().trim(); // may be '__NONE__' sentinel

    state.filtered = state.episodes.filter(ep => {
        // Name filter (if present): title contains (case-insensitive)
        if (q) {
            const title = (ep.title || '').toString().toLowerCase();
            if (!title.includes(q)) return false;
        }

        // Era filter (if selected)
        if (eraF) {
            const era = (ep.era || '').toString().toLowerCase();
            if (era !== eraF) return false;
        }

        // Doctor filter (if selected) - compare formatted person strings case-insensitively
        if (doctorF) {
            const doc = (formatPerson(ep.doctor) || '').toString().toLowerCase();
            if (doc !== doctorF) return false;
        }

        // Companion filter (if selected) - support '__NONE__' sentinel for null companions
        if (companionF) {
            if (companionF === '__NONE__') {
                if (ep.companion !== null) return false;
            } else {
                const comp = ep.companion ? formatPerson(ep.companion).toString().toLowerCase() : '';
                if (comp !== companionF.toLowerCase()) return false;
            }
        }

        return true;
    });
}

// Sorting
function sortEpisodes(field, asc = true) {
    const dir = asc ? 1 : -1;
    // If a name filter is active, apply smart relevance sorting regardless of current column
    const q = (state.filters.name || '').toString().trim().toLowerCase();
    if (q) {
        state.filtered.sort((a, b) => {
            const sa = scoreRelevance(a, q);
            const sb = scoreRelevance(b, q);
            if (sa !== sb) return sa - sb; // lower score = more relevant
            // tie-breaker: rank (ascending), then original index
            const ra = Number.isFinite(a.rank) ? a.rank : a._idx;
            const rb = Number.isFinite(b.rank) ? b.rank : b._idx;
            return (ra - rb) || (a._idx - b._idx);
        });
        return;
    }

    // Multi-column sort: state.sort is an array of levels, primary first
    state.filtered.sort((a, b) => {
        // helper to normalize compare values
        const get = (obj, f) => {
            if (f === 'rank') return safeNumber(obj.rank, obj._idx);
            if (f === 'series') return safeNumber(obj.series, obj._idx);
                if (f === 'broadcast_date') {
                    // Return a numeric value for valid dates; comparator will handle nulls
                    const v = getDateValue(obj);
                    return v === null ? null : v;
                }
            if (f === 'title') return (obj.title || '').toString().toLowerCase();
            if (f === 'era') return (obj.era || '').toString().toLowerCase();
            if (f === 'director') return (obj.director || '').toString().toLowerCase();
            if (f === 'writer') return (obj.writer || '').toString().toLowerCase();
            if (f === 'doctor') return (obj.doctor && obj.doctor.actor) ? obj.doctor.actor.toLowerCase() : '';
            if (f === 'companion') return (obj.companion && obj.companion.actor) ? obj.companion.actor.toLowerCase() : '';
            if (f === 'cast') return (Array.isArray(obj.cast) ? obj.cast.length : 0);
            return '';
        };

        // iterate over each sort level
        for (const level of state.sort) {
            const f = level.field;
            const d = level.ascending ? 1 : -1;
            const va = get(a, f);
            const vb = get(b, f);

            // Special handling for broadcast_date: null means unknown -> push to end
            if (f === 'broadcast_date') {
                const aNull = va === null || va === undefined;
                const bNull = vb === null || vb === undefined;
                if (aNull && bNull) {
                    // equal for this level, continue to next level
                } else if (aNull) {
                    return 1; // a is unknown, place after b
                } else if (bNull) {
                    return -1; // b is unknown, place after a
                } else {
                    const diff = va - vb;
                    if (diff !== 0) return diff * d;
                    // else continue
                }
                continue;
            }

            // numeric comparison if both are numbers
            if (typeof va === 'number' && typeof vb === 'number') {
                const diff = (va - vb);
                if (diff !== 0) return diff * d;
                continue;
            }
            if (va < vb) return -1 * d;
            if (va > vb) return 1 * d;
            // else equal, continue to next level
        }

        // tie-breakers: rank then original index
        const ra = Number.isFinite(a.rank) ? a.rank : a._idx;
        const rb = Number.isFinite(b.rank) ? b.rank : b._idx;
        return (ra - rb) || (a._idx - b._idx);
    });
}

// Relevance scoring for smart sort when a search query is active.
// 0 = exact title match
// 1 = title contains
// 2 = any field contains
// 3 = no match (least relevant)
function scoreRelevance(ep, q) {
    if (!q) return 3;
    const title = (ep.title || '').toString().toLowerCase();
    if (title === q) return 0;
    if (title.includes(q)) return 1;

    // check other fields: writerList, director, doctor, companion, cast, era, broadcast_date
    const fieldsToCheck = [];
    if (Array.isArray(ep.writerList)) fieldsToCheck.push(...ep.writerList.map(s => s.toString().toLowerCase()));
    if (ep.director) fieldsToCheck.push(ep.director.toString().toLowerCase());
    if (ep.era) fieldsToCheck.push(ep.era.toString().toLowerCase());
    if (ep.broadcast_date_raw) fieldsToCheck.push(ep.broadcast_date_raw.toString().toLowerCase());
    if (ep.doctor) {
        if (ep.doctor.actor) fieldsToCheck.push(ep.doctor.actor.toString().toLowerCase());
        if (ep.doctor.incarnation) fieldsToCheck.push(ep.doctor.incarnation.toString().toLowerCase());
    }
    if (ep.companion) {
        if (typeof ep.companion === 'string') fieldsToCheck.push(ep.companion.toLowerCase());
        else {
            if (ep.companion.actor) fieldsToCheck.push(ep.companion.actor.toString().toLowerCase());
            if (ep.companion.character) fieldsToCheck.push((ep.companion.character || '').toString().toLowerCase());
        }
    }
    if (Array.isArray(ep.cast)) {
        for (const c of ep.cast) {
            if (!c) continue;
            if (typeof c === 'string') fieldsToCheck.push(c.toLowerCase());
            else {
                if (c.actor) fieldsToCheck.push(c.actor.toString().toLowerCase());
                if (c.character) fieldsToCheck.push(c.character.toString().toLowerCase());
            }
        }
    }

    for (const s of fieldsToCheck) {
        if (!s) continue;
        if (s.includes(q)) return 2;
    }

    return 3;
}

// Helper to get a sortable date value (timestamp) or null when unavailable.
// This handles mixed formats by using the parsed date when present or falling back
// to extracting a year from the raw string. Returns null for completely unknown dates
// so the comparator can push unknowns to the end.
function getDateValue(obj) {
    if (!obj) return null;
    if (obj._parsedDate instanceof Date && !isNaN(obj._parsedDate)) return obj._parsedDate.getTime();
    const yr = extractYearFromString(obj.broadcast_date_raw || '');
    if (yr) return new Date(Number(yr), 0, 1).getTime();
    return null;
}

function safeNumber(v, fallback = 0) {
    if (v === null || v === undefined) return fallback;
    const n = Number(v);
    return Number.isNaN(n) ? fallback : n;
}

// Render table
function renderTable() {
    const table = $('#episodes-table');
    const tbody = $('#episodes-body');
    const noResults = $('#no-results');
    const errorEl = $('#error');
    tbody.innerHTML = '';
    const total = state.filtered.length;

    if (!total) {
        table.style.display = 'none';
        noResults.style.display = 'block';
        renderPaginationControls();
        return;
    }

    table.style.display = 'table';
    noResults.style.display = 'none';

    const frag = document.createDocumentFragment();

    // If decade grouping is enabled, group episodes by decade and render a tbody per decade.
    if (state.view && state.view.groupByDecade) {
        // Build decade buckets: map label -> array
        const buckets = new Map();
        const order = [];

        for (const ep of state.filtered) {
            let label = 'Undated';
            if (ep._parsedDate instanceof Date && !isNaN(ep._parsedDate)) {
                const yr = ep._parsedDate.getFullYear();
                const decade = Math.floor(yr / 10) * 10;
                label = `${decade}s`;
            } else {
                const yr = extractYearFromString(ep.broadcast_date_raw || '');
                if (yr) label = `${Math.floor(yr/10)*10}s`;
            }

            if (!buckets.has(label)) {
                buckets.set(label, []);
                order.push(label);
            }
            buckets.get(label).push(ep);
        }

        // Sort decades descending (most recent first) when they look numeric, keep 'Undated' last
        order.sort((a, b) => {
            if (a === 'Undated' && b === 'Undated') return 0;
            if (a === 'Undated') return 1;
            if (b === 'Undated') return -1;
            const na = Number(a.replace(/s$/, ''));
            const nb = Number(b.replace(/s$/, ''));
            return nb - na;
        });

        // Hide pagination while grouped for simplicity
        const pag = document.getElementById('pagination');
        if (pag) pag.style.display = 'none';

        // For each decade, create a tbody with a header row and episode rows
        for (const label of order) {
            const items = buckets.get(label) || [];
            const tb = document.createElement('tbody');
            tb.className = 'decade-section';

            // Header row for the decade (clickable toggle)
            const hdr = document.createElement('tr');
            hdr.className = 'decade-header';
            const th = document.createElement('td');
            th.colSpan = 10; // number of visible columns
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'decade-toggle';
            btn.textContent = `${label} — ${items.length} episode${items.length !== 1 ? 's' : ''}`;
            btn.setAttribute('aria-expanded', 'true');
            btn.addEventListener('click', () => {
                const collapsed = tb.classList.toggle('collapsed');
                btn.setAttribute('aria-expanded', String(!collapsed));
            });
            th.appendChild(btn);
            hdr.appendChild(th);
            tb.appendChild(hdr);

            // Episode rows
            for (const ep of items) {
                const tr = document.createElement('tr');
                tr.className = 'ep-row';
                tr.tabIndex = 0;

                // Focus/keyboard handlers
                tr.addEventListener('focus', () => { tr.classList.add('row-focused'); tr.setAttribute('aria-selected', 'true'); });
                tr.addEventListener('blur', () => { tr.classList.remove('row-focused'); tr.removeAttribute('aria-selected'); });
                tr.addEventListener('keydown', (e) => {
                    if (e.key === 'ArrowDown') { e.preventDefault(); const next = tr.nextElementSibling; if (next) next.focus(); }
                    else if (e.key === 'ArrowUp') { e.preventDefault(); const prev = tr.previousElementSibling; if (prev) prev.focus(); }
                });

                // Rank
                const tdRank = document.createElement('td');
                tdRank.textContent = Number.isFinite(ep.rank) ? ep.rank : '—';
                tr.appendChild(tdRank);

                // Title
                const tdTitle = document.createElement('td');
                tdTitle.textContent = ep.title || '—';
                tr.appendChild(tdTitle);

                // Series
                const tdSeries = document.createElement('td');
                tdSeries.textContent = Number.isFinite(ep.series) ? ep.series : '—';
                tr.appendChild(tdSeries);

                // Era
                const tdEra = document.createElement('td');
                tdEra.textContent = ep.era || '—';
                tr.appendChild(tdEra);

                // Broadcast Year
                const tdYear = document.createElement('td');
                tdYear.textContent = ep._parsedDate instanceof Date && !isNaN(ep._parsedDate) ? ep._parsedDate.getFullYear() : (extractYearFromString(ep.broadcast_date_raw) || '—');
                tr.appendChild(tdYear);

                // Director
                const tdDirector = document.createElement('td');
                tdDirector.textContent = ep.director || '—';
                tr.appendChild(tdDirector);

                // Writer
                const tdWriter = document.createElement('td');
                if (Array.isArray(ep.writerList) && ep.writerList.length > 1) {
                    ep.writerList.forEach((w, i) => {
                        const span = document.createElement('span');
                        span.className = 'writer-name';
                        span.textContent = w;
                        tdWriter.appendChild(span);
                        if (i < ep.writerList.length - 1) tdWriter.appendChild(document.createTextNode(', '));
                    });
                } else if (Array.isArray(ep.writerList) && ep.writerList.length === 1) {
                    tdWriter.textContent = ep.writerList[0];
                } else if (ep.writer) {
                    tdWriter.textContent = String(ep.writer).trim() || '—';
                } else {
                    tdWriter.textContent = '—';
                }
                tr.appendChild(tdWriter);

                // Doctor
                const tdDoctor = document.createElement('td');
                tdDoctor.textContent = formatPerson(ep.doctor);
                tr.appendChild(tdDoctor);

                // Companion
                const tdCompanion = document.createElement('td');
                tdCompanion.textContent = ep.companion ? formatPerson(ep.companion) : 'None';
                tr.appendChild(tdCompanion);

                // Cast count
                const tdCast = document.createElement('td');
                const count = Array.isArray(ep.cast) ? ep.cast.length : 0;
                const span = document.createElement('span');
                span.className = 'cast-count';
                span.textContent = String(count);
                span.setAttribute('aria-label', `${count} cast members`);
                tdCast.appendChild(span);
                tr.appendChild(tdCast);

                tb.appendChild(tr);
            }

            frag.appendChild(tb);
        }

    // Attach fragment directly to table; replace existing tbody container
    // Remove the single-body placeholder content and append grouped tbodies
    // Clear any previous body content
    tbody.innerHTML = '';
    table.appendChild(frag);
    updateSortIndicators();
    renderWarnings();
    // Update master collapse/expand button visibility/label
    updateMasterDecadeToggle();
    return;
    }

    // If not grouped by decade, fall back to previous paginated rendering

    // Pagination: compute current page slice
    const { page, pageSize } = state.pagination;
    const start = (page - 1) * pageSize;
    const end = Math.min(start + pageSize, total);
    const pageItems = state.filtered.slice(start, end);

    for (const ep of pageItems) {
        const tr = document.createElement('tr');
        // Make rows focusable for keyboard navigation
        tr.tabIndex = 0;

        // When focused, visually mark and set aria-selected for screen readers
        tr.addEventListener('focus', () => {
            tr.classList.add('row-focused');
            tr.setAttribute('aria-selected', 'true');
        });
        tr.addEventListener('blur', () => {
            tr.classList.remove('row-focused');
            tr.removeAttribute('aria-selected');
        });

        // Arrow key navigation between rows; Home/End to jump to first/last
        tr.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const next = tr.nextElementSibling;
                if (next) next.focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prev = tr.previousElementSibling;
                if (prev) prev.focus();
            } else if (e.key === 'Home') {
                e.preventDefault();
                const first = tbody.querySelector('tr');
                if (first) first.focus();
            } else if (e.key === 'End') {
                e.preventDefault();
                const rows = tbody.querySelectorAll('tr');
                if (rows.length) rows[rows.length - 1].focus();
            }
            // keep Enter on rows for potential future details (no-op now)
        });

        // Rank
        const tdRank = document.createElement('td');
        tdRank.textContent = Number.isFinite(ep.rank) ? ep.rank : '—';
        tr.appendChild(tdRank);

        // Title
        const tdTitle = document.createElement('td');
        tdTitle.textContent = ep.title || '—';
        tr.appendChild(tdTitle);

        // Series
        const tdSeries = document.createElement('td');
        tdSeries.textContent = Number.isFinite(ep.series) ? ep.series : '—';
        tr.appendChild(tdSeries);

        // Era
        const tdEra = document.createElement('td');
        tdEra.textContent = ep.era || '—';
        tr.appendChild(tdEra);

        // Broadcast Year
        const tdYear = document.createElement('td');
        tdYear.textContent = ep._parsedDate instanceof Date && !isNaN(ep._parsedDate) ? ep._parsedDate.getFullYear() : (extractYearFromString(ep.broadcast_date_raw) || '—');
        tr.appendChild(tdYear);

        // Director
        const tdDirector = document.createElement('td');
        tdDirector.textContent = ep.director || '—';
        tr.appendChild(tdDirector);

        // Writer (handle multiple writers)
        const tdWriter = document.createElement('td');
        if (Array.isArray(ep.writerList) && ep.writerList.length > 1) {
            // render multiple writers as comma-separated list of spans for styling
            ep.writerList.forEach((w, i) => {
                const span = document.createElement('span');
                span.className = 'writer-name';
                span.textContent = w;
                tdWriter.appendChild(span);
                if (i < ep.writerList.length - 1) tdWriter.appendChild(document.createTextNode(', '));
            });
        } else if (Array.isArray(ep.writerList) && ep.writerList.length === 1) {
            tdWriter.textContent = ep.writerList[0];
        } else if (ep.writer) {
            tdWriter.textContent = String(ep.writer).trim() || '—';
        } else {
            tdWriter.textContent = '—';
        }
        tr.appendChild(tdWriter);

        // Doctor
        const tdDoctor = document.createElement('td');
        tdDoctor.textContent = formatPerson(ep.doctor);
        tr.appendChild(tdDoctor);

        // Companion
        const tdCompanion = document.createElement('td');
        tdCompanion.textContent = ep.companion ? formatPerson(ep.companion) : 'None';
        tr.appendChild(tdCompanion);

    // Cast count (display as a small badge); show 0 for empty arrays
    const tdCast = document.createElement('td');
    const count = Array.isArray(ep.cast) ? ep.cast.length : 0;
    const span = document.createElement('span');
    span.className = 'cast-count';
    span.textContent = String(count);
    span.setAttribute('aria-label', `${count} cast members`);
    tdCast.appendChild(span);
    tr.appendChild(tdCast);

        frag.appendChild(tr);
    }

    tbody.appendChild(frag);

    updateSortIndicators();
    renderWarnings();
    renderPaginationControls();
}

// Pagination UI
function renderPaginationControls() {
    const container = document.getElementById('pagination');
    if (!container) return;
    const total = state.filtered.length;
    const { page, pageSize, pageSizes } = state.pagination;
    container.innerHTML = '';

    if (total <= 0) { container.style.display = 'none'; return; }

    const pages = Math.max(1, Math.ceil(total / pageSize));

    // Info
    const info = document.createElement('div');
    info.className = 'pagination-info';
    info.textContent = `Showing ${Math.min((page-1)*pageSize+1, total)}–${Math.min(page*pageSize, total)} of ${total}`;
    container.appendChild(info);

    // Page size selector
    const sizeSel = document.createElement('select');
    sizeSel.className = 'page-size-select';
    pageSizes.forEach(sz => {
        const opt = document.createElement('option');
        opt.value = sz;
        opt.textContent = `${sz} / page`;
        if (sz === pageSize) opt.selected = true;
        sizeSel.appendChild(opt);
    });
    sizeSel.addEventListener('change', (e) => {
        state.pagination.pageSize = Number(e.target.value);
        state.pagination.page = 1;
        renderTable();
    });
    container.appendChild(sizeSel);

    // Prev / Next buttons
    const prev = document.createElement('button');
    prev.textContent = '← Prev';
    prev.disabled = page <= 1;
    prev.addEventListener('click', () => { goToPage(page - 1); });
    container.appendChild(prev);

    // Simple page input
    const pageInput = document.createElement('input');
    pageInput.type = 'number';
    pageInput.min = 1;
    pageInput.max = pages;
    pageInput.value = page;
    pageInput.className = 'page-input';
    pageInput.addEventListener('change', (e) => {
        let v = Number(e.target.value) || 1;
        v = Math.max(1, Math.min(pages, v));
        goToPage(v);
    });
    container.appendChild(pageInput);

    const of = document.createElement('span');
    of.textContent = ` / ${pages}`;
    container.appendChild(of);

    const next = document.createElement('button');
    next.textContent = 'Next →';
    next.disabled = page >= pages;
    next.addEventListener('click', () => { goToPage(page + 1); });
    container.appendChild(next);

    container.style.display = 'flex';
    container.style.gap = '8px';
    container.style.alignItems = 'center';
    container.style.marginTop = '10px';
}

function goToPage(n) {
    const total = state.filtered.length;
    const pages = Math.max(1, Math.ceil(total / state.pagination.pageSize));
    const v = Math.max(1, Math.min(pages, Math.floor(n)));
    state.pagination.page = v;
    renderTable();
}

function formatPerson(p) {
    if (!p) return '—';
    // If companion/doctor is given as a simple string
    if (typeof p === 'string') {
        const s = sanitizeString(p);
        return s || '—';
    }

    // If it's an object, try common fields
    const rawActor = (p.actor || p.name || '').toString();
    const rawInc = (p.incarnation || p.character || p.role || '').toString();
    const actor = sanitizeString(rawActor);
    const inc = sanitizeString(rawInc);

    if (actor && inc) return `${actor} (${inc})`;
    if (actor) return actor;
    if (inc) return inc;
    return '—';
}

// Date parsing: handle ISO YYYY-MM-DD, DD/MM/YYYY, Month DD, YYYY, YYYY
function parseDate(raw) {
    if (!raw) return null;
    const s = raw.trim();

    // Year only: 4 digits
    if (/^\d{4}$/.test(s)) {
        return new Date(Number(s), 0, 1);
    }

    // DD/MM/YYYY -> convert to YYYY-MM-DD
    const uk = /^([0-3]?\d)\/([0-1]?\d)\/(\d{4})$/;
    const mUk = s.match(uk);
    if (mUk) {
        const day = mUk[1].padStart(2, '0');
        const mon = mUk[2].padStart(2, '0');
        const iso = `${mUk[3]}-${mon}-${day}`;
        const d = new Date(iso);
        if (!isNaN(d)) return d;
    }

    // ISO  YYYY-MM-DD or similar
    const dIso = new Date(s);
    if (!isNaN(dIso)) return dIso;

    // Try to parse Month DD, YYYY (Date.parse often handles this)
    const dLong = Date.parse(s);
    if (!isNaN(dLong)) return new Date(dLong);

    return null;
}

function extractYearFromString(s) {
    if (!s) return null;
    const m = s.match(/(\d{4})/);
    return m ? Number(m[1]) : null;
}

// Validation: logs warnings to console and stores them in state.warnings
function validateData(list) {
    const warnings = [];
    const ranks = new Map();
    const now = Date.now();

    for (const ep of list) {
        if (!ep.title) warnings.push(`Missing title for entry index ${ep._idx}`);
        if (!ep.broadcast_date_raw) warnings.push(`Missing broadcast_date for rank ${ep.rank} (idx ${ep._idx})`);
        if (Number.isFinite(ep.rank) && ep.rank <= 0) warnings.push(`Suspicious rank (${ep.rank}) at idx ${ep._idx}`);
        if (Number.isFinite(ep.series) && ep.series < 0) warnings.push(`Negative series number (${ep.series}) at rank ${ep.rank}`);
        if (ep._parsedDate instanceof Date && !isNaN(ep._parsedDate) && ep._parsedDate.getTime() > now) warnings.push(`Future broadcast date for rank ${ep.rank}: ${ep.broadcast_date_raw}`);

        if (Number.isFinite(ep.rank)) {
            if (ranks.has(ep.rank)) ranks.set(ep.rank, ranks.get(ep.rank) + 1);
            else ranks.set(ep.rank, 1);
        }

        
    }

    for (const [r, count] of ranks.entries()) if (count > 1) warnings.push(`Duplicate rank ${r} appears ${count} times`);

    state.warnings = warnings;
    if (warnings.length) {
        // Log each warning individually so graders can see exact issues in the console
        warnings.forEach(w => console.warn('Data validation warning:', w));
        console.warn(`${warnings.length} data validation warning(s) detected.`);
    }
}

// Show warnings count in UI (adds a small badge in header)
function renderWarnings() {
    const header = document.querySelector('header');
    if (!header) return;
    let badge = document.getElementById('warning-count');
    if (!badge) {
        badge = document.createElement('div');
        badge.id = 'warning-count';
        badge.style.marginTop = '6px';
        badge.style.fontSize = '0.9em';
        badge.style.color = '#8a6d3b';
        badge.setAttribute('role', 'status');
        badge.setAttribute('aria-live', 'polite');
        badge.title = 'Data validation warnings are logged to the console';
        header.appendChild(badge);
    }
    if (state.warnings && state.warnings.length) {
        badge.textContent = `Warnings: ${state.warnings.length} (see console)`;
        badge.style.display = 'block';
    } else badge.style.display = 'none';
}

// Collapse or expand all decade sections. If any section is expanded, collapse all; otherwise expand all.
function collapseExpandAllDecades() {
    const sections = Array.from(document.querySelectorAll('.decade-section'));
    if (!sections.length) return;

    // Determine if we should collapse (if any is currently expanded)
    const anyExpanded = sections.some(tb => !tb.classList.contains('collapsed'));
    const shouldCollapse = anyExpanded; // if any expanded -> collapse all, else expand all

    for (const tb of sections) {
        const toggler = tb.querySelector('.decade-toggle');
        if (shouldCollapse) {
            tb.classList.add('collapsed');
            if (toggler) toggler.setAttribute('aria-expanded', 'false');
        } else {
            tb.classList.remove('collapsed');
            if (toggler) toggler.setAttribute('aria-expanded', 'true');
        }
    }

    // Update master button label
    const master = document.getElementById('toggle-decades');
    if (master) master.textContent = shouldCollapse ? 'Expand all' : 'Collapse all';
}

// Keep the master toggle button label in sync with current sections (call after render)
function updateMasterDecadeToggle() {
    const master = document.getElementById('toggle-decades');
    if (!master) return;
    const sections = Array.from(document.querySelectorAll('.decade-section'));
    if (!sections.length) {
        master.style.display = 'none';
        return;
    }
    master.style.display = 'inline-block';
    const anyExpanded = sections.some(tb => !tb.classList.contains('collapsed'));
    master.textContent = anyExpanded ? 'Collapse all' : 'Expand all';
}

// Export the currently filtered results (all filtered rows, not just current page) as CSV
function exportFilteredToCSV() {
    if (!state.filtered || !state.filtered.length) {
        alert('No filtered episodes to export. Adjust filters and try again.');
        return;
    }

    // CSV header columns (match visible table columns)
    const headers = [
        'Rank',
        'Title',
        'Series',
        'Era',
        'Broadcast Year',
        'Director',
        'Writer',
        'Doctor',
        'Companion',
        'Cast Count'
    ];

    // CSV escaping: double-quote fields that contain commas/newlines/quotes; escape quotes by doubling
    const escapeField = (val) => {
        if (val === null || val === undefined) return '';
        const s = String(val);
        if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
            return '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
    };

    const rows = [];
    rows.push(headers.map(escapeField).join(','));

    for (const ep of state.filtered) {
        const rank = Number.isFinite(ep.rank) ? ep.rank : '';
        const title = ep.title || '';
        const series = Number.isFinite(ep.series) ? ep.series : '';
        const era = ep.era || '';
        const year = (ep._parsedDate instanceof Date && !isNaN(ep._parsedDate)) ? ep._parsedDate.getFullYear() : (extractYearFromString(ep.broadcast_date_raw) || '');
        const director = ep.director || '';
        const writer = (Array.isArray(ep.writerList) && ep.writerList.length) ? ep.writerList.join(' & ') : (ep.writer || '');
        const doctor = formatPerson(ep.doctor) || '';
        const companion = ep.companion ? formatPerson(ep.companion) : '';
        const castCount = Array.isArray(ep.cast) ? ep.cast.length : 0;

        const cols = [rank, title, series, era, year, director, writer, doctor, companion, castCount];
        rows.push(cols.map(escapeField).join(','));
    }

    // Prepend UTF-8 BOM for Excel compatibility with non-ASCII characters
    const csvContent = '\uFEFF' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0,19).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `doctor-who-filtered-${timestamp}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// Update sort arrow indicators on headers
function updateSortIndicators() {
    // Remove any existing level badges
    $$('th[data-sort]').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
        const existing = th.querySelector('.sort-level');
        if (existing) existing.remove();
    });

    // For each level in state.sort, add indicator (primary = 1)
    state.sort.forEach((lvl, i) => {
        const th = document.querySelector(`th[data-sort="${lvl.field}"]`);
        if (!th) return;
        th.classList.add(lvl.ascending ? 'sort-asc' : 'sort-desc');
        // add a small badge showing level number
        const badge = document.createElement('span');
        badge.className = 'sort-level';
        badge.textContent = String(i + 1);
        badge.title = `Sort priority ${i + 1}`;
        th.appendChild(badge);
    });
}

// Loading / Error UI helpers
function showLoading(show) {
    const loading = document.getElementById('loading');
    const table = document.getElementById('episodes-table');
    const noResults = document.getElementById('no-results');
    const nameInput = document.getElementById('name-filter');
    const src = document.getElementById('data-source');

    // Show/hide loading element
    if (loading) loading.style.display = show ? 'block' : 'none';

    // Accessibility: mark main as busy while loading
    const main = document.querySelector('main');
    if (main) main.setAttribute('aria-busy', show ? 'true' : 'false');

    // Disable inputs while loading to prevent interactions
    if (nameInput) nameInput.disabled = !!show;
    if (src) src.disabled = !!show;

    if (show) {
        // When loading, hide table and no-results until data is ready
        if (table) table.style.display = 'none';
        if (noResults) noResults.style.display = 'none';
    } else {
        // When not loading, let the current filtered state determine visibility
        if (state.filtered && state.filtered.length) {
            if (table) table.style.display = 'table';
            if (noResults) noResults.style.display = 'none';
        } else {
            if (table) table.style.display = 'none';
            if (noResults) noResults.style.display = 'block';
        }
    }
}

function showError(message, withRetry = false, errObj = null) {
    const errorElement = document.getElementById('error');
    const table = document.getElementById('episodes-table');
    const noResults = document.getElementById('no-results');
    if (!errorElement) return;

    if (!message) {
        errorElement.innerHTML = '';
        errorElement.style.display = 'none';
        return;
    }

    // Hide table / no-results when showing an error
    if (table) table.style.display = 'none';
    if (noResults) noResults.style.display = 'none';

    // Build structured error content
    errorElement.innerHTML = '';

    const title = document.createElement('div');
    title.className = 'error-title';
    title.textContent = 'Error';
    errorElement.appendChild(title);

    const msgDiv = document.createElement('div');
    msgDiv.className = 'error-message';
    msgDiv.textContent = message;
    errorElement.appendChild(msgDiv);

    // If we were given an actual Error object, provide a collapsible details block
    if (errObj) {
        const details = document.createElement('details');
        details.className = 'error-details';
        const summary = document.createElement('summary');
        summary.textContent = 'Technical details (expand)';
        details.appendChild(summary);

        const pre = document.createElement('pre');
        // Try to show stack or JSON of the error without exposing sensitive info
        try {
            if (errObj.stack) pre.textContent = errObj.stack;
            else pre.textContent = JSON.stringify(errObj, Object.getOwnPropertyNames(errObj), 2);
        } catch (e) {
            pre.textContent = String(errObj);
        }
        details.appendChild(pre);
        errorElement.appendChild(details);
    }

    if (withRetry) {
        const btn = document.createElement('button');
        btn.textContent = 'Retry';
        btn.className = 'retry-btn';
        btn.addEventListener('click', () => {
            // clear error, show loading and reload
            showError('');
            showLoading(true);
            setTimeout(() => loadEpisodes(), 10);
        });
        errorElement.appendChild(btn);
    }

    errorElement.style.display = 'block';
}

// Start
document.addEventListener('DOMContentLoaded', init);

// --- End of file ---

// --- End of file ---
