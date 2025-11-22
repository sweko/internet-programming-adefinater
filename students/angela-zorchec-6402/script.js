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
    DATE_FORMATS: {
        ISO: 'YYYY-MM-DD',
        UK: 'DD/MM/YYYY',
        LONG: 'MMMM DD, YYYY',
        YEAR: 'YYYY'
    },
    ERA_ORDER: ['Classic', 'Modern', 'Recent']
};

// State
let state = {
    episodes: [],
    filtered: [],
    loading: true,
    error: null,
    sort: { field: 'rank', ascending: true },
    filters: { name: '' }
};

// Initialize Application
async function init() {
    setupEventListeners();
    await loadEpisodes();
}

// Event Listeners Setup
function setupEventListeners() {
    // TODO: Implement event listeners for:
    // 1. Filter input changes
    const nameFilter = document.getElementById('name-filter');
    nameFilter.addEventListener('input', (e) => {
        state.filters.name = e.target.value.trim();
        filterEpisodes();
    });

    const headers = document.querySelectorAll('th[data-sort]');
    headers.forEach(th => {
        th.addEventListener('click', () => sortEpisodes(th.dataset.sort));
    });

    document.getElementById('era-filter').addEventListener('change', (e) => {
        state.filters.era = e.target.value;
        filterEpisodes();
    });

    document.getElementById('doctor-filter').addEventListener('change', (e) => {
        state.filters.doctor = e.target.value;
        filterEpisodes();
    });

    document.getElementById('companion-filter').addEventListener('change', (e) => {
        state.filters.companion = e.target.value;
        filterEpisodes();
    });

    
    // 2. Column header clicks (sorting)
    // 3. Additional filter changes
}

// Data Loading
async function loadEpisodes() {
    try {
         showLoading(true);

        const dataArrays = await Promise.all(CONFIG.DATA_URLS.map(async url => {
            const res = await fetch(url);

            if (!res.ok) {
                // HTTP error (404, 500, etc.)
                throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
            }

            const data = await res.json();
            return data;
        }));

    // Flatten the 'episodes' arrays from each file 
    state.episodes = dataArrays.flatMap(file => file.episodes || []);
    validateEpisodes();
    state.filtered = [...state.episodes];
    displayEpisodes(state.filtered);
    } catch (error) {
        console.error('Error fetching data:', error);  
        showError(error.message);                      
    } finally {
        showLoading(false);
    }
    populateDropdowns();
}

function populateDropdowns() {
    const doctorSet = new Set();
    const companionSet = new Set();

    state.episodes.forEach(ep => {
        if (ep.doctor && ep.doctor.actor) doctorSet.add(ep.doctor.actor);
        if (ep.companion && ep.companion.actor) companionSet.add(ep.companion.actor);
    });

    const doctorSelect = document.getElementById('doctor-filter');
    doctorSet.forEach(doctor => {
        const option = document.createElement('option');
        option.value = doctor;
        option.textContent = doctor;
        doctorSelect.appendChild(option);
    });

    const companionSelect = document.getElementById('companion-filter');
    companionSet.forEach(companion => {
        const option = document.createElement('option');
        option.value = companion;
        option.textContent = companion;
        companionSelect.appendChild(option);
    });
}

// Display Functions
function displayEpisodes(episodes) {
    // TODO: Implement episode display
    // 1. Clear existing rows
    const tbody = document.getElementById('episodes-body');
    tbody.innerHTML = '';

    if (episodes.length === 0) {
        document.getElementById('no-results').style.display = 'block';
        document.getElementById('episodes-table').style.display = 'none';
        return;
    }

    document.getElementById('no-results').style.display = 'none';
    document.getElementById('episodes-table').style.display = 'table';

    const seenRanks = new Set();

    episodes.forEach(ep => {
        const rank = ep.rank ?? 'N/A';

        // Skip if this rank has already been displayed
        if (seenRanks.has(rank)) return;

        seenRanks.add(rank);

        const tr = document.createElement('tr');
        tr.tabIndex = 0;  // make row focusable
        tr.classList.add('episode-row');  // optional for styling
        const title = ep.title ? escapeHtml(ep.title) : 'Untitled Episode';
        const series = ep.series ?? 'N/A';
        const era = ep.era || 'Unknown';
        const year = ep.broadcast_date ? parseBroadcastDate(ep.broadcast_date) : 'Unknown';
        const director = ep.director ? escapeHtml(ep.director) : 'Unknown';

        const doctor = ep.doctor
            ? `${escapeHtml(ep.doctor.actor || 'Unknown')} (${escapeHtml(ep.doctor.incarnation || 'Unknown')})`
            : 'Unknown';

        const companion = ep.companion
            ? `${escapeHtml(ep.companion.actor)} (${escapeHtml(ep.companion.character)})`
            : 'None';

        const castCount = Array.isArray(ep.cast) ? ep.cast.length : 0;
        let writer = Array.isArray(ep.writer) ? ep.writer.join(', ') : (ep.writer || '');

        tr.innerHTML = `
            <td >${rank}</td>
            <td>${title}</td>
            <td >${series}</td>
            <td >${era}</td>
            <td >${year}</td>
            <td >${director}</td>
            <td >${writer}</td>
            <td >${doctor}</td>
            <td >${companion}</td>
            <td ><span class="cast-count">${castCount}</span></td>
        `;

    tbody.appendChild(tr);
    });
}

displayEpisodes(state.filtered);
setupKeyboardNavigation();

function setupKeyboardNavigation() {
    const table = document.getElementById('episodes-table');
    let currentRowIndex = 0;

    function focusRow(index) {
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        if (rows.length === 0) return;

        rows.forEach(r => r.classList.remove('focused'));
        currentRowIndex = Math.max(0, Math.min(index, rows.length - 1));
        const row = rows[currentRowIndex];
        row.classList.add('focused');
        row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        row.querySelector('td').focus();
    }

    table.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            focusRow(currentRowIndex + 1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            focusRow(currentRowIndex - 1);
        } else if (e.key === 'Enter') {
            const focusedCell = document.activeElement;
            if (focusedCell && focusedCell.tagName === 'TD') {
                const ths = table.querySelectorAll('th');
                const index = Array.from(focusedCell.parentNode.children).indexOf(focusedCell);
                const sortField = ths[index]?.dataset.sort;
                if (sortField) sortEpisodes(sortField);
            }
        }
    });

    focusRow(0); // Initial focus
}

function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function parseBroadcastDate(dateStr) {
    if (!dateStr) return 'Unknown';

    let date;
    // ISO: 2024-12-25
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        date = new Date(dateStr);
    }
    // UK: 25/12/2024
    else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const [day, month, year] = dateStr.split('/').map(Number);
        date = new Date(year, month - 1, day);
    }
    // Long: December 25 2024
    else {
        date = new Date(dateStr);
    }

    return isNaN(date.getTime()) ? 'Unknown' : date.getFullYear();
}


// Sorting Functions
function sortEpisodes(field, toggle = true) {
    if (toggle) {
        if (state.sort.field === field) {
            state.sort.ascending = !state.sort.ascending;
        } else {
            state.sort.field = field;
            state.sort.ascending = true;
        }
    }

    state.filtered.sort((a, b) => {
        let valA = a[field] ?? '';
        let valB = b[field] ?? '';

        if (field === 'broadcast_date') {
            valA = parseBroadcastDate(valA) || 0;
            valB = parseBroadcastDate(valB) || 0;
        }
        if (field === 'era') {
            valA = CONFIG.ERA_ORDER.indexOf(valA);
            valB = CONFIG.ERA_ORDER.indexOf(valB);
        }
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return state.sort.ascending ? -1 : 1;
        if (valA > valB) return state.sort.ascending ? 1 : -1;
        return 0;
    });

    displayEpisodes(state.filtered);

    // Update sort indicators
    document.querySelectorAll('th').forEach(th => th.classList.remove('sort-asc', 'sort-desc'));
    const activeTh = document.querySelector(`th[data-sort="${field}"]`);
    if (activeTh) activeTh.classList.add(state.sort.ascending ? 'sort-asc' : 'sort-desc');
}

// Filtering Functions
function filterEpisodes() {
    const name = state.filters.name?.trim() || '';
    const era = state.filters.era || '';
    const doctor = state.filters.doctor || '';
    const companion = state.filters.companion || '';

    state.filtered = state.episodes.filter(ep => {
        const titleMatch = ep.title?.includes(name);
        const eraMatch = era ? ep.era === era : true;
        const doctorMatch = doctor ? ep.doctor?.actor === doctor : true;
        const companionMatch = companion ? ep.companion?.actor === companion : true;

        return titleMatch && eraMatch && doctorMatch && companionMatch;
    });

    sortEpisodes(state.sort.field, false); // Keep current sort after filtering
}

function validateEpisodes() {
    const warnings = [];
    const seenRanks = new Set();
    const now = new Date();

    state.episodes.forEach(ep => {
        // Missing required fields
        if (!ep.rank || !ep.title || !ep.series || !ep.broadcast_date) {
            warnings.push(`Missing required field in episode: ${ep.title || 'Untitled'}`);
        }

        // Future broadcast dates
        const date = new Date(ep.broadcast_date);
        if (!isNaN(date.getTime()) && date > now) {
            warnings.push(`Future broadcast date: ${ep.title} (${ep.broadcast_date})`);
        }

        // Duplicate/invalid ranks
        if (seenRanks.has(ep.rank) || ep.rank <= 0) {
            warnings.push(`Duplicate or invalid rank: ${ep.rank} (${ep.title})`);
        }
        seenRanks.add(ep.rank);

        // Negative series numbers
        if (ep.series < 0) {
            warnings.push(`Negative series number: ${ep.series} (${ep.title})`);
        }
    });

    console.warn(`${warnings.length} warnings found:`, warnings);

    const warningCountEl = document.getElementById('warning-count');
    if (warningCountEl) warningCountEl.textContent = warnings.length;
}


// Utility Functions
function formatDate(date) {
    // TODO: Implement date formatting
    // Handle multiple date formats
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
    document.getElementById('episodes-table').style.display = show ? 'none' : 'table';
}

function showError(message) {
    const errorEl = document.getElementById('error');
    errorEl.textContent = message;
    errorEl.style.display = message ? 'block' : 'none';
}

document.addEventListener('DOMContentLoaded', init);

document.addEventListener('keydown', (e) => {
    const focused = document.activeElement;

    // Arrow navigation for headers
    if (focused.tagName === 'TH') {
        const headers = Array.from(document.querySelectorAll('th[data-sort]'));
        let idx = headers.indexOf(focused);
        if (e.key === 'ArrowRight') idx = Math.min(idx + 1, headers.length - 1);
        else if (e.key === 'ArrowLeft') idx = Math.max(idx - 1, 0);
        headers[idx].focus();
        if (e.key === 'Enter') {
            sortEpisodes(focused.dataset.sort);
        }
        e.preventDefault();
    }

    // Arrow navigation for rows
    if (focused.tagName === 'TR') {
        const rows = Array.from(document.querySelectorAll('#episodes-body tr'));
        let idx = rows.indexOf(focused);
        if (e.key === 'ArrowDown') idx = Math.min(idx + 1, rows.length - 1);
        else if (e.key === 'ArrowUp') idx = Math.max(idx - 1, 0);
        rows[idx].focus();
        e.preventDefault();
    }
});
