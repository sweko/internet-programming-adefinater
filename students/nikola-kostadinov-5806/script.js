// Configuration
const CONFIG = {
    DATA_URLS: [
        'https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/doctor-who-episodes-01-10.json',
        'https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/doctor-who-episodes-11-20.json',
        'https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/doctor-who-episodes-21-30.json',
        'https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/doctor-who-episodes-31-40.json',
        'https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/doctor-who-episodes-41-50.json',
        'https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/doctor-who-episodes-51-65.json'
    ],
    FALLBACK_URL: '../data/doctor-who-episodes-full.json',
    DATE_FORMATS: {
        ISO: 'YYYY-MM-DD',
        UK: 'DD/MM/YYYY',
        LONG: 'MMMM DD, YYYY',
        YEAR: 'YYYY'
    },
    ERA_ORDER: ['Classic', 'Modern', 'Recent']
};

/*
Performance and optimization notes (implemented):

- Goal: keep UI responsive with 1000+ episodes.
- Strategies implemented here:
  1) Pagination (server-side style slicing in the client): we only render a single page of rows
      (controlled by `state.page` and `state.pageSize`) so the DOM never holds all 1000+ rows at once.
  2) Debouncing: filter inputs are debounced (200ms) to avoid repeated expensive recalculations while
      the user types.
  3) Light-weight rendering: display function builds minimal innerHTML per visible row and avoids
      heavy DOM operations for off-screen data.

Notes / future improvements:
- Virtualization (windowing) could further reduce DOM size by rendering only the visible viewport
  rows; this is more involved and is a recommended next step for extremely large datasets.
- If sorting/filtering becomes CPU-bound, consider Web Workers for offloading heavier computation.
*/

// State Management
let state = {
    episodes: [],          // Original data
    filtered: [],          // Filtered results
    loading: true,         // Loading state
    error: null,          // Error message
    sort: {
        field: 'rank',     // Current sort field
        ascending: true    // Sort direction
    },
    filters: {
        name: '',          // Episode name filter
        era: '',          // Era filter
        doctor: '',        // Doctor filter
        companion: ''      // Companion filter
    },
    keyboard: {
        selectedRowIndex: -1,  // Currently selected row index
        selectedColumn: null   // Currently focused column
    }
};

// Pagination & performance state
state.page = 1;
state.pageSize = 50; // default page size; tuned for responsiveness (students can change)

// Simple debouncer for inputs
function debounce(fn, wait) {
    let timer = null;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), wait);
    };
}

const DEBOUNCE_MS = 50;

// Initialize Application
async function init() {
    setupEventListeners();
    setupKeyboardNavigation();
    await loadEpisodes();
}

// Setup Keyboard Navigation
function setupKeyboardNavigation() {
    const table = document.getElementById('episodes-table');
    
    // Handle table keyboard navigation
    table.addEventListener('keydown', (e) => {
        const tbody = document.getElementById('episodes-body');
        const rows = tbody.getElementsByTagName('tr');
        const currentIndex = state.keyboard.selectedRowIndex;
        let newIndex = currentIndex;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                newIndex = Math.min(currentIndex + 1, rows.length - 1);
                if (currentIndex === -1) newIndex = 0;
                selectRow(newIndex);
                break;

            case 'ArrowUp':
                e.preventDefault();
                newIndex = Math.max(currentIndex - 1, 0);
                selectRow(newIndex);
                break;

            case 'Enter':
                e.preventDefault();
                // Prefer the selectedColumn state, but fall back to the currently focused header
                let field = state.keyboard.selectedColumn;
                if (!field) {
                    const active = document.activeElement;
                    if (active && active.matches && active.matches('th[data-sort]')) {
                        field = active.dataset.sort;
                    }
                }

                if (field) {
                    // Toggle sort direction if clicking the same column
                    if (field === state.sort.field) {
                        state.sort.ascending = !state.sort.ascending;
                    } else {
                        state.sort.field = field;
                        state.sort.ascending = true;
                    }

                    // Keep keyboard state in sync
                    state.keyboard.selectedColumn = field;

                    // Update sort indicators and sort
                    const header = document.querySelector(`th[data-sort="${field}"]`);
                    if (header) updateSortIndicators(header);
                    sortEpisodes(field);
                }
                break;
        }
    });

    // Make column headers focusable and handle keyboard selection
    const headers = document.querySelectorAll('th[data-sort]');
    headers.forEach(header => {
        header.setAttribute('tabindex', '0');
        
        header.addEventListener('focus', () => {
            state.keyboard.selectedColumn = header.dataset.sort;
        });

        header.addEventListener('blur', () => {
            if (!header.contains(document.activeElement)) {
                state.keyboard.selectedColumn = null;
            }
        });

        header.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                header.click(); // Trigger the existing click handler
                // Prevent the table-level keydown handler from also handling this Enter
                e.stopPropagation();
            }
        });
    });

    // Ensure only one selected row exists when focus moves (e.g., Tab)
    document.addEventListener('focusin', (e) => {
        const row = e.target.closest && e.target.closest('#episodes-body tr');
        if (row) {
            // If focus moved to a row, select it
            const idx = Number(row.getAttribute('data-row-index'));
            if (!isNaN(idx)) selectRow(idx);
        } else {
            // Focus moved away from rows: clear selection
            clearRowSelection();
        }
    });
}

// Helper function to select a row and scroll it into view
function selectRow(index) {
    const tbody = document.getElementById('episodes-body');
    const rows = tbody.getElementsByTagName('tr');
    
    // Remove previous selection
    if (state.keyboard.selectedRowIndex !== -1 && rows[state.keyboard.selectedRowIndex]) {
        rows[state.keyboard.selectedRowIndex].classList.remove('keyboard-selected');
    }
    
    // Update state and add new selection
    state.keyboard.selectedRowIndex = index;
    if (index !== -1 && rows[index]) {
        rows[index].classList.add('keyboard-selected');
        rows[index].focus();
        rows[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
}

// Clear any row selection without focusing another element
function clearRowSelection() {
    const tbody = document.getElementById('episodes-body');
    if (!tbody) return;
    const rows = tbody.getElementsByTagName('tr');
    if (state.keyboard.selectedRowIndex !== -1 && rows[state.keyboard.selectedRowIndex]) {
        rows[state.keyboard.selectedRowIndex].classList.remove('keyboard-selected');
    }
    state.keyboard.selectedRowIndex = -1;
}

// Populate Filter Options
function populateFilterOptions() {
    // Era filter (static options from CONFIG)
    const eraSelect = document.getElementById('era-filter');
    if (!eraSelect) return;
    // Reset to default option
    eraSelect.innerHTML = '<option value="">All Eras</option>';
    CONFIG.ERA_ORDER.forEach(era => {
        const option = document.createElement('option');
        option.value = era;
        option.textContent = era;
        eraSelect.appendChild(option);
    });
}

// Event Listeners Setup
function setupEventListeners() {
    // Set up sorting on column headers
    const headers = document.querySelectorAll('th[data-sort]');
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const field = header.dataset.sort;
            
            // Toggle sort direction if clicking the same column
            if (field === state.sort.field) {
                state.sort.ascending = !state.sort.ascending;
            } else {
                state.sort.field = field;
                state.sort.ascending = true;
            }

            // Update sort indicators
            updateSortIndicators(header);
            
            // Sort and display
            // Keep keyboard state in sync: mark this column as the selected column
            state.keyboard.selectedColumn = field;
            // Ensure keyboard focus follows clicking so Enter behaves consistently
            try { header.focus(); } catch (err) { /* ignore */ }
            sortEpisodes(field);
        });
    });

    // Set up filters with debouncing for text inputs
    const debouncedFilter = debounce(() => { state.page = 1; filterEpisodes(); }, DEBOUNCE_MS);

    const nameEl = document.getElementById('name-filter');
    if (nameEl) nameEl.addEventListener('input', (e) => {
        state.filters.name = e.target.value;
        debouncedFilter();
    });

    const eraEl = document.getElementById('era-filter');
    if (eraEl) eraEl.addEventListener('change', (e) => {
        state.filters.era = e.target.value;
        state.page = 1;
        filterEpisodes();
    });

    const doctorEl = document.getElementById('doctor-filter');
    if (doctorEl) doctorEl.addEventListener('input', (e) => {
        state.filters.doctor = e.target.value.toLowerCase();
        debouncedFilter();
    });

    const companionEl = document.getElementById('companion-filter');
    if (companionEl) companionEl.addEventListener('input', (e) => {
        state.filters.companion = e.target.value.toLowerCase();
        debouncedFilter();
    });
}

// Update sort indicators in the UI
function updateSortIndicators(activeHeader) {
    // Remove existing sort classes
    document.querySelectorAll('th').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
    });

    // Add appropriate sort class
    activeHeader.classList.add(state.sort.ascending ? 'sort-asc' : 'sort-desc');
}

// Data Loading
async function loadEpisodes() {
    try {
        showLoading(true);
        
        // First try to load from multiple URLs
        try {
            const episodeParts = await Promise.all(
                CONFIG.DATA_URLS.map(url => 
                    fetch(url)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`HTTP error! status: ${response.status}`);
                            }
                            return response.json();
                        })
                )
            );
            
            // Extract episodes from each part and combine them
            state.episodes = episodeParts
                .flatMap(part => part.episodes) // Extract episodes array from each part
                .sort((a, b) => (a.rank || 0) - (b.rank || 0));
                
        } catch (fetchError) {
            console.warn('Failed to load from multiple URLs, falling back to local file:', fetchError);
            showError('Remote data load failed. Loading local backup...');
            
            // Fallback to local file after a short delay to show the message
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const response = await fetch(CONFIG.FALLBACK_URL);
            if (!response.ok) {
                throw new Error('Both remote and local data loads failed');
            }
            const data = await response.json();
            
            // Handle both array and {episodes: [...]} format
            state.episodes = Array.isArray(data) ? data : data.episodes || [];
            
            // Sort by rank regardless of source
            state.episodes.sort((a, b) => (a.rank || 0) - (b.rank || 0));
            
            showError('Successfully loaded from local backup'); // Show success message
            await new Promise(resolve => setTimeout(resolve, 1500)); // Show success message briefly
            showError(''); // Clear error message
        }

        // Initialize filtered episodes with all episodes
    state.filtered = [...state.episodes];

    // Populate filter dropdowns (era, etc.)
    try { populateFilterOptions(); } catch (err) { console.warn('populateFilterOptions failed', err); }

    // Run developer-only validation and log warnings to console (no UI changes)
    try { validateData(state.episodes); } catch (err) { console.warn('validateData failed', err); }

    // Display the episodes and reset keyboard navigation
    displayEpisodes(state.filtered);
    state.keyboard.selectedRowIndex = -1;
    state.keyboard.selectedColumn = null;
        
    } catch (error) {
        showError(`Failed to load episodes: ${error.message}`);
        console.error('Error loading episodes:', error);
    } finally {
        showLoading(false);
    }
}

// Display Functions
function displayEpisodes(episodes) {
    const tbody = document.getElementById('episodes-body');
    const table = document.getElementById('episodes-table');
    const noResults = document.getElementById('no-results');

    // Clear existing rows
    tbody.innerHTML = '';

    // Show/hide appropriate elements based on results
    if (!episodes || episodes.length === 0) {
        table.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }

    table.style.display = 'table';
    noResults.style.display = 'none';

    // Paginate results to keep DOM small for large datasets
    const total = episodes.length;
    const page = state.page || 1;
    const pageSize = state.pageSize || 100;
    const start = (page - 1) * pageSize;
    const end = Math.min(start + pageSize, total);

    for (let i = start; i < end; i++) {
        const episode = episodes[i];
        const row = document.createElement('tr');
        // Make row focusable and navigable
        row.setAttribute('tabindex', '0');
        // Keep data-row-index as the index within the filtered array
        row.setAttribute('data-row-index', i.toString());

        // Format and add each cell with edge case handling
        row.innerHTML = `
            <td>${episode.rank || 'N/A'}</td>
            <td>${sanitizeHtml(episode.title)}</td>
            <td>${episode.series || 'N/A'}</td>
            <td>${episode.era || 'Unknown'}</td>
            <td>${formatDate(episode.broadcast_date)}</td>
            <td>${sanitizeHtml(episode.director) || 'Unknown'}</td>
            <td style="white-space: pre-line">${formatWriters(episode.writer)}</td>
            <td>${formatDoctor(episode.doctor)}</td>
            <td>${formatCompanion(episode.companion)}</td>
            <td><span class="cast-count">${formatCastCount(episode.cast)}</span></td>
        `;

        tbody.appendChild(row);
    }

    // Render pagination controls
    renderPaginationControls(total, page, pageSize);
}

// Pagination controls
function renderPaginationControls(total, page, pageSize) {
    let container = document.getElementById('pagination-controls');
    if (!container) {
        container = document.createElement('div');
        container.id = 'pagination-controls';
        container.style.marginTop = '12px';
        const table = document.getElementById('episodes-table');
        table.parentNode.insertBefore(container, table.nextSibling);
    }

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);

    container.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;">
            <button id="pg-prev">Previous</button>
            <span>Showing ${start}-${end} of ${total}</span>
            <button id="pg-next">Next</button>
            <span style="margin-left:8px;color:#666;">Page ${page} / ${totalPages}</span>
        </div>
    `;

    document.getElementById('pg-prev').disabled = page <= 1;
    document.getElementById('pg-next').disabled = page >= totalPages;

    document.getElementById('pg-prev').addEventListener('click', () => goToPage(Math.max(1, page - 1)));
    document.getElementById('pg-next').addEventListener('click', () => goToPage(Math.min(totalPages, page + 1)));
}

function goToPage(newPage) {
    state.page = newPage;
    displayEpisodes(state.filtered);
}

// Helper functions for formatting display data
function sanitizeHtml(text) {
    if (!text) return 'Unknown';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatWriters(writer) {
    if (!writer) return 'Unknown';
    
    // Split writers before sanitizing HTML
    let writers = writer
        .split(/\s*(?:,|\band\b|&)\s*/) // Split on commas, "and", or "&" with surrounding whitespace
        .map(w => w.trim())
        .filter(w => w.length > 0); // Remove empty strings
    
    if (writers.length === 0) return 'Unknown';
    
    // Sanitize individual writers
    writers = writers.map(w => sanitizeHtml(w));
    
    if (writers.length === 1) return writers[0];
    if (writers.length === 2) return `${writers[0]} and ${writers[1]}`;
    
    // For 3 or more writers
    const lastWriter = writers.pop();
    return `${writers.join(', ')} and ${lastWriter}`;
}

function formatDoctor(doctor) {
    if (!doctor || !doctor.actor || !doctor.incarnation) return 'Unknown';
    return `${sanitizeHtml(doctor.actor)} (${sanitizeHtml(doctor.incarnation)})`;
}

function formatCompanion(companion) {
    if (!companion) return '—';  // Handle null companion
    if (!companion.actor || !companion.character) return 'Unknown';
    return `${sanitizeHtml(companion.actor)} (${sanitizeHtml(companion.character)})`;
}

function formatCastCount(cast) {
    return Array.isArray(cast) ? cast.length : 0;
}

// Utility Functions
function formatDate(date) {
    if (!date) return 'Unknown';

    // Try parsing different date formats
    let year;

    // Handle YYYY format
    if (/^\d{4}$/.test(date)) {
        return date;
    }

    // Try ISO format (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        year = date.split('-')[0];
    }
    // Try UK format (DD/MM/YYYY)
    else if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
        year = date.split('/')[2];
    }
    // Try Long format (Month DD, YYYY)
    else if (/^[A-Za-z]+ \d{1,2}, \d{4}$/.test(date)) {
        year = date.split(', ')[1];
    } else {
        // Try parsing with Date object as fallback
        const parsedDate = new Date(date);
        if (!isNaN(parsedDate.getTime())) {
            year = parsedDate.getFullYear().toString();
        }
    }

    // Log problematic dates for debugging
    if (!year) {
        console.warn(`Unparseable date format:`, date);
    }

    return year || 'Unknown';
}

// Developer-only data validation helpers (console warnings only)
function parseBroadcastDate(dateStr) {
    if (!dateStr) return null;

    // Year-only: YYYY
    if (/^\d{4}$/.test(dateStr)) {
        return new Date(Number(dateStr), 0, 1);
    }

    // ISO YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) return d;
    }

    // UK format DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const parts = dateStr.split('/');
        const day = Number(parts[0]);
        const month = Number(parts[1]) - 1;
        const year = Number(parts[2]);
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) return d;
    }

    // Try Date.parse fallback (e.g., "Month DD, YYYY")
    const fallback = new Date(dateStr);
    if (!isNaN(fallback.getTime())) return fallback;

    return null;
}

function validateData(episodes) {
    if (!Array.isArray(episodes)) return;

    const now = new Date();
    const rankMap = new Map();
    const duplicateRanks = new Set();

    episodes.forEach((ep, idx) => {
        const id = `#${idx + 1}${ep && ep.title ? ' - ' + ep.title : ''}`;

        // Check for missing required fields (developer-only warnings)
        const requiredFields = ['rank', 'title', 'series', 'broadcast_date', 'director', 'writer', 'doctor'];
        requiredFields.forEach(field => {
            const val = ep ? ep[field] : undefined;
            if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
                console.warn(`Validation warning ${id}: Missing required field '${field}'.`, ep);
            }
        });

        // Rank validations: must be a positive integer
        const rawRank = ep && ep.rank;
        const rank = Number(rawRank);
        if (rawRank === undefined || rawRank === null || rawRank === '') {
            console.warn(`Validation warning ${id}: Rank is missing.`, ep);
        } else if (!Number.isFinite(rank) || !Number.isInteger(rank)) {
            console.warn(`Validation warning ${id}: Rank is invalid (${rawRank}). Expected an integer.`, ep);
        } else {
            if (rank <= 0) {
                console.warn(`Validation warning ${id}: Rank should be a positive integer (>0). Found: ${rank}`, ep);
            }

            // Detect duplicates
            if (rankMap.has(rank)) {
                duplicateRanks.add(rank);
            } else {
                rankMap.set(rank, ep);
            }
        }

        // Series number: detect negative values (some entries may use 'Special' or non-numeric series)
        const seriesRaw = ep && ep.series;
        const seriesNum = Number(seriesRaw);
        if (!isNaN(seriesNum) && seriesNum < 0) {
            console.warn(`Validation warning ${id}: Negative series number detected (${seriesRaw}).`, ep);
        }

        // Future broadcast dates
        const parsedDate = parseBroadcastDate(ep && ep.broadcast_date);
        if (parsedDate) {
            if (parsedDate.getTime() > now.getTime()) {
                console.warn(`Validation warning ${id}: Broadcast date is in the future (${ep.broadcast_date}).`, ep);
            }
        } else {
            // Unparseable dates are noted at debug level to avoid noisy warnings but are still helpful
            console.debug(`Validation info ${id}: Unparseable broadcast date (${ep && ep.broadcast_date}).`);
        }

        // Doctor object shape
        if (ep && ep.doctor) {
            if (!ep.doctor.actor || !ep.doctor.incarnation) {
                console.warn(`Validation warning ${id}: Doctor object missing 'actor' or 'incarnation'.`, ep);
            }
        }
    });

    // Report duplicates (summary)
    if (duplicateRanks.size > 0) {
        console.warn(`Validation warning: Duplicate ranks detected: ${Array.from(duplicateRanks).join(', ')}.`);
        // Optionally print an example for each duplicate rank
        duplicateRanks.forEach(r => {
            const example = rankMap.get(r);
            console.warn(` - Example for rank ${r}:`, example);
        });
    }
}

// Sorting Functions
function sortEpisodes(field) {
    const direction = state.sort.ascending ? 1 : -1;

    state.filtered.sort((a, b) => {
        let valueA, valueB;

        // Extract values based on field
        switch (field) {
            case 'rank':
                valueA = a[field] || 0;
                valueB = b[field] || 0;
                return (valueA - valueB) * direction;
                
            case 'series':
                // Handle "Special" episodes by giving them a high value
                valueA = a[field] === 'Special' ? Number.MAX_SAFE_INTEGER : (Number(a[field]) || 0);
                valueB = b[field] === 'Special' ? Number.MAX_SAFE_INTEGER : (Number(b[field]) || 0);
                return (valueA - valueB) * direction;

            case 'title':
            case 'era':
            case 'director':
                valueA = (a[field] || '').toLowerCase();
                valueB = (b[field] || '').toLowerCase();
                return valueA.localeCompare(valueB) * direction;

            case 'broadcast_date':
                // Extract years for comparison
                valueA = formatDate(a.broadcast_date) || '0';
                valueB = formatDate(b.broadcast_date) || '0';
                return valueA.localeCompare(valueB) * direction;

            case 'writer':
                valueA = (a[field] || '').toLowerCase().split(/ (?:&|and) /)[0]; // Use first writer
                valueB = (b[field] || '').toLowerCase().split(/ (?:&|and) /)[0];
                return valueA.localeCompare(valueB) * direction;

            case 'doctor':
                valueA = a.doctor ? (a.doctor.actor || '').toLowerCase() : '';
                valueB = b.doctor ? (b.doctor.actor || '').toLowerCase() : '';
                return valueA.localeCompare(valueB) * direction;

            case 'companion':
                // Handle null companions
                if (!a.companion && !b.companion) return 0;
                if (!a.companion) return direction;
                if (!b.companion) return -direction;
                
                valueA = (a.companion.actor || '').toLowerCase();
                valueB = (b.companion.actor || '').toLowerCase();
                return valueA.localeCompare(valueB) * direction;

            case 'cast':
                valueA = Array.isArray(a.cast) ? a.cast.length : 0;
                valueB = Array.isArray(b.cast) ? b.cast.length : 0;
                return (valueA - valueB) * direction;

            default:
                return 0;
        }
    });

    // Update display
    displayEpisodes(state.filtered);
}

// Filtering Functions
function filterEpisodes() {
    const nameFilter = state.filters.name.toLowerCase().trim();
    const eraFilter = state.filters.era;
    const doctorFilter = state.filters.doctor.toLowerCase().trim();
    const companionFilter = state.filters.companion.toLowerCase().trim();

    state.filtered = state.episodes.filter(episode => {
        // Name filter (case-insensitive partial match)
        if (nameFilter && !(episode.title || '').toLowerCase().includes(nameFilter)) {
            return false;
        }

        // Era filter (exact match)
        if (eraFilter && episode.era !== eraFilter) {
            return false;
        }

        // Doctor filter (case-insensitive partial match on actor name)
        if (doctorFilter && !(episode.doctor?.actor || '').toLowerCase().includes(doctorFilter)) {
            return false;
        }

        // Companion filter (case-insensitive partial match on actor name)
        if (companionFilter && !(episode.companion?.actor || '').toLowerCase().includes(companionFilter)) {
            return false;
        }

        return true;
    });

    // Store currently selected episode if any
    let selectedEpisode = null;
    if (state.keyboard.selectedRowIndex >= 0 && state.keyboard.selectedRowIndex < state.filtered.length) {
        selectedEpisode = state.filtered[state.keyboard.selectedRowIndex];
    }

    // If a name filter is active, apply smart relevance sorting
    if (nameFilter) {
        const term = nameFilter;

        function matchesAnyField(ep) {
            const fields = [];
            fields.push(ep.title || '');
            fields.push(String(ep.series || ''));
            fields.push(ep.era || '');
            fields.push(ep.broadcast_date || '');
            fields.push(ep.director || '');
            fields.push(ep.writer || '');
            if (ep.doctor) {
                fields.push(ep.doctor.actor || '');
                fields.push(ep.doctor.incarnation || '');
            }
            if (ep.companion) {
                fields.push(ep.companion.actor || '');
                fields.push(ep.companion.character || '');
            }
            if (Array.isArray(ep.cast)) {
                fields.push(...ep.cast.map(c => (c.name || c).toString()));
            }
            const joined = fields.join(' ').toLowerCase();
            return joined.includes(term);
        }

        state.filtered.sort((a, b) => {
            const aTitle = (a.title || '').toLowerCase();
            const bTitle = (b.title || '').toLowerCase();

            // Score: 3 = exact title match, 2 = title contains, 1 = any field contains, 0 = none
            function score(ep, title) {
                if (title === term) return 3;
                if (title.includes(term)) return 2;
                if (matchesAnyField(ep)) return 1;
                return 0;
            }

            const sa = score(a, aTitle);
            const sb = score(b, bTitle);
            if (sa !== sb) return sb - sa; // higher score first

            // Tie-breaker: preserve rank order (ascending)
            const ra = a.rank || Number.MAX_SAFE_INTEGER;
            const rb = b.rank || Number.MAX_SAFE_INTEGER;
            return ra - rb;
        });

        // Display sorted results
        displayEpisodes(state.filtered);
    } else {
        // Apply current sort after filtering
        if (state.sort.field) {
            sortEpisodes(state.sort.field);
        } else {
            // If no sort is applied, just display the filtered results
            displayEpisodes(state.filtered);
        }
    }

    // Restore selection if possible
    if (selectedEpisode) {
        const newIndex = state.filtered.findIndex(ep => ep.rank === selectedEpisode.rank);
        if (newIndex !== -1) {
            selectRow(newIndex);
        } else {
            state.keyboard.selectedRowIndex = -1;
        }
    }

    // Show "no results" if filtered array is empty
    const noResults = document.getElementById('no-results');
    const table = document.getElementById('episodes-table');
    
    if (state.filtered.length === 0) {
        table.style.display = 'none';
        noResults.style.display = 'block';
    } else {
        table.style.display = 'table';
        noResults.style.display = 'none';
    }
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
    document.getElementById('episodes-table').style.display = show ? 'none' : 'block';
}

function showError(message) {
    const errorElement = document.getElementById('error');
    errorElement.textContent = message;
    errorElement.style.display = message ? 'block' : 'none';
}

document.addEventListener('DOMContentLoaded', init);
