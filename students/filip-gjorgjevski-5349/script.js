// Configuration
const CONFIG = {
    DATA_URLS: [
        'https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/doctor-who-episodes-01-10.json',
        'https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/doctor-who-episodes-11-20.json',
        'https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/doctor-who-episodes-21-30.json',
        'https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/doctor-who-episodes-31-40.json',
        'https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/doctor-who-episodes-41-50.json',
        'https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/doctor-who-episodes-51-65.json'
    ]
};

// State Management
let state = {
    episodes: [],
    filtered: [],
    sort: { field: 'rank', ascending: true },
    filters: { name: '' },
    focusedRowIndex: -1 // -1 means no row is focused
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    await loadEpisodes();
});

// Event Listeners Setup
function setupEventListeners() {
    document.getElementById('name-filter').addEventListener('input', (e) => {
        state.filters.name = e.target.value;
        applyFiltersAndSort();
    });

    document.querySelectorAll('#episodes-table thead th[data-sort]').forEach(header => {
        header.addEventListener('click', () => {
            const field = header.dataset.sort;
            if (state.sort.field === field) {
                state.sort.ascending = !state.sort.ascending;
            } else {
                state.sort.field = field;
                state.sort.ascending = true;
            }
            applyFiltersAndSort();
        });
    });

    // Main listener for all keyboard navigation
    document.addEventListener('keydown', handleKeyboardNavigation);
}

// Data Loading
async function loadEpisodes() {
    try {
        showLoading(true);
        const promises = CONFIG.DATA_URLS.map(url => fetch(url));
        const responses = await Promise.all(promises);

        for (const response of responses) {
            if (!response.ok) throw new Error(`Failed to fetch from ${response.url} (${response.statusText})`);
        }

        const jsonDataArray = await Promise.all(responses.map(res => res.json()));
        state.episodes = jsonDataArray.flatMap(data => data.episodes);
        applyFiltersAndSort();
    } catch (error) {
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

// Main function to apply filters and sorting
function applyFiltersAndSort() {
    // Reset row focus whenever data changes
    state.focusedRowIndex = -1;

    const filterText = state.filters.name.toLowerCase();
    let processedData = state.episodes.filter(episode => {
        const title = episode.title?.toLowerCase() || '';
        const doctor = formatDoctor(episode.doctor, false).toLowerCase();
        const companion = formatCompanion(episode.companion, false).toLowerCase();
        const writer = episode.writer?.toLowerCase() || '';
        const director = episode.director?.toLowerCase() || '';
        return title.includes(filterText) || doctor.includes(filterText) ||
               companion.includes(filterText) || writer.includes(filterText) ||
               director.includes(filterText);
    });

    const { field, ascending } = state.sort;
    const direction = ascending ? 1 : -1;
    processedData.sort((a, b) => {
        const valA = getSortValue(a, field);
        const valB = getSortValue(b, field);
        return (valA < valB ? -1 : valA > valB ? 1 : 0) * direction;
    });

    state.filtered = processedData;
    displayEpisodes(state.filtered);
}

// Display Functions
function displayEpisodes(episodes) {
    const tableBody = document.getElementById('episodes-body');
    tableBody.innerHTML = ''; 

    updateSortHeaders();
    document.getElementById('no-results').style.display = episodes.length === 0 ? 'block' : 'none';

    episodes.forEach((episode, index) => {
        const row = tableBody.insertRow();
        const createCell = text => {
            const cell = row.insertCell();
            cell.textContent = text ?? 'N/A';
            return cell;
        };

        createCell(episode.rank);
        createCell(episode.title);
        createCell(episode.series);
        createCell(episode.era);
        createCell(getYear(episode.broadcast_date));
        createCell(episode.director);
        createCell(episode.writer);
        createCell(formatDoctor(episode.doctor));
        createCell(formatCompanion(episode.companion));
        createCell(episode.cast?.length || 0);

        // Add click listener for focus
        row.addEventListener('click', () => {
            state.focusedRowIndex = index;
            updateRowFocus();
        });
    });
    // Ensure focus is visually cleared if it was reset
    updateRowFocus();
}

// KEYBOARD NAVIGATION HANDLER
function handleKeyboardNavigation(e) {
    const tableBody = document.getElementById('episodes-body');
    const isTableFocused = tableBody.contains(document.activeElement) || document.activeElement.tagName === 'TH';

    // Handle Enter to sort focused column
    if (e.key === 'Enter' && document.activeElement.tagName === 'TH') {
        e.preventDefault();
        document.activeElement.click();
    }

    // Handle Arrow keys to navigate table rows
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const direction = e.key === 'ArrowDown' ? 1 : -1;
        const numRows = state.filtered.length;
        if (numRows === 0) return;

        // Move focus index
        state.focusedRowIndex += direction;

        // Clamp the index within bounds
        if (state.focusedRowIndex >= numRows) state.focusedRowIndex = numRows - 1;
        if (state.focusedRowIndex < 0) state.focusedRowIndex = 0;

        updateRowFocus();
    }
}

// UTILITY FUNCTIONS
function getSortValue(episode, field) {
    switch (field) {
        case 'doctor': return formatDoctor(episode.doctor, false).toLowerCase();
        case 'companion': return formatCompanion(episode.companion, false).toLowerCase();
        case 'cast_count': return episode.cast?.length || 0;
        case 'broadcast_date': return normalizeDate(episode.broadcast_date)?.getTime() || 0;
        default: return (episode[field] || '').toString().toLowerCase();
    }
}

function updateSortHeaders() {
    document.querySelectorAll('#episodes-table thead th').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
        if (th.dataset.sort === state.sort.field) {
            th.classList.add(state.sort.ascending ? 'sort-asc' : 'sort-desc');
        }
    });
}

// Visually update which row has focus
function updateRowFocus() {
    const rows = document.getElementById('episodes-body').rows;
    for (let i = 0; i < rows.length; i++) {
        if (i === state.focusedRowIndex) {
            rows[i].classList.add('focused');
            // Scroll the focused row into view if it's not visible
            rows[i].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else {
            rows[i].classList.remove('focused');
        }
    }
}

function normalizeDate(dateString) {
    if (!dateString) return null;
    if (/^\d{4}$/.test(dateString)) return new Date(dateString, 0, 1);
    if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        return new Date(year, month - 1, day);
    }
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
}

function formatDoctor(doctor, includeIncarnation = true) {
    if (!doctor?.actor) return 'N/A';
    return includeIncarnation ? `${doctor.actor} (${doctor.incarnation || 'N/A'})` : doctor.actor;
}

function formatCompanion(companion, includeCharacter = true) {
    if (!companion?.actor) return 'N/A';
    return includeCharacter ? `${companion.actor} (${companion.character || 'N/A'})` : companion.actor;
}

function getYear(dateString) {
    const date = normalizeDate(dateString);
    return date ? date.getFullYear() : 'N/A';
}

// UI State Changers
function showLoading(isLoading) {
    document.getElementById('loading').style.display = isLoading ? 'block' : 'none';
    document.getElementById('episodes-table').style.display = isLoading ? 'none' : 'table';
    if (isLoading) document.getElementById('error').style.display = 'none';
}

function showError(details) {
    const errorElement = document.getElementById('error');
    const userMessage = "Error: Could not load Doctor Who episodes. Please check your network connection and try again.";
    errorElement.textContent = `${userMessage}\nDetails: ${details}`;
    errorElement.style.display = 'block';
    
    document.getElementById('episodes-table').style.display = 'none';
    document.getElementById('loading').style.display = 'none';
}