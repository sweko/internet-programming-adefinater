// Configuration
const CONFIG = {
    DATA_URL: 'https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/doctor-who-episodes-full.json',
    DATE_FORMATS: {
        ISO: /^\d{4}-\d{2}-\d{2}$/,           // YYYY-MM-DD
        UK: /^\d{2}\/\d{2}\/\d{4}$/,          // DD/MM/YYYY
        LONG: /^[A-Za-z]+\s+\d{1,2},\s+\d{4}$/, // Month DD, YYYY
        YEAR: /^\d{4}$/                        // YYYY
    },
    ERA_ORDER: ['Classic', 'Modern', 'Recent']
};

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
        name: ''          // Current filter value
    }
};

// Initialize Application
async function init() {
    setupEventListeners();
    await loadEpisodes();
}

// Event Listeners Setup
function setupEventListeners() {
    // Filter input changes
    const nameFilter = document.getElementById('name-filter');
    nameFilter.addEventListener('input', (e) => {
        state.filters.name = e.target.value;
        filterEpisodes();
    });

    // Column header clicks for sorting
    const headers = document.querySelectorAll('th[data-sort]');
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const field = header.getAttribute('data-sort');
            sortEpisodes(field);
        });
    });
}

// Data Loading
async function loadEpisodes() {
    try {
        showLoading(true);
        showError('');
        
        const response = await fetch(CONFIG.DATA_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Validate and store episodes
        if (!Array.isArray(data.episodes)) {
            throw new Error('Invalid data format: episodes array not found');
        }
        
        state.episodes = data.episodes;
        state.filtered = [...state.episodes];
        
        // Apply initial sorting
        applySorting();
        displayEpisodes(state.filtered);
        
    } catch (error) {
        showError('Failed to load episodes: ' + error.message);
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
    
    if (episodes.length === 0) {
        table.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }
    
    table.style.display = 'table';
    noResults.style.display = 'none';
    
    // Create row for each episode
    episodes.forEach(episode => {
        const row = document.createElement('tr');
        
        // Rank
        const rankCell = document.createElement('td');
        rankCell.textContent = episode.rank;
        row.appendChild(rankCell);
        
        // Title - handle special characters
        const titleCell = document.createElement('td');
        titleCell.textContent = episode.title || '—';
        row.appendChild(titleCell);
        
        // Series
        const seriesCell = document.createElement('td');
        seriesCell.textContent = episode.series || '—';
        row.appendChild(seriesCell);
        
        // Era
        const eraCell = document.createElement('td');
        eraCell.textContent = episode.era || '—';
        row.appendChild(eraCell);
        
        // Broadcast Year
        const yearCell = document.createElement('td');
        yearCell.textContent = extractYear(episode.broadcast_date);
        row.appendChild(yearCell);
        
        // Director
        const directorCell = document.createElement('td');
        directorCell.textContent = episode.director || '—';
        row.appendChild(directorCell);
        
        // Writer - handle multiple writers
        const writerCell = document.createElement('td');
        writerCell.textContent = episode.writer || '—';
        row.appendChild(writerCell);
        
        // Doctor - format as "Actor Name (Incarnation)"
        const doctorCell = document.createElement('td');
        if (episode.doctor && episode.doctor.actor) {
            doctorCell.textContent = `${episode.doctor.actor} (${episode.doctor.incarnation || 'Unknown'})`;
        } else {
            doctorCell.textContent = '—';
        }
        row.appendChild(doctorCell);
        
        // Companion - handle null companions
        const companionCell = document.createElement('td');
        if (episode.companion && episode.companion.actor) {
            companionCell.textContent = `${episode.companion.actor} (${episode.companion.character || 'Unknown'})`;
        } else {
            companionCell.textContent = 'None';
        }
        row.appendChild(companionCell);
        
        // Cast Count - handle empty arrays
        const castCell = document.createElement('td');
        const castCount = Array.isArray(episode.cast) ? episode.cast.length : 0;
        const badge = document.createElement('span');
        badge.className = 'cast-count';
        badge.textContent = castCount;
        castCell.appendChild(badge);
        row.appendChild(castCell);
        
        tbody.appendChild(row);
    });
}

// Sorting Functions
function sortEpisodes(field) {
    // Toggle sort direction if same field, otherwise reset to ascending
    if (state.sort.field === field) {
        state.sort.ascending = !state.sort.ascending;
    } else {
        state.sort.field = field;
        state.sort.ascending = true;
    }
    
    // Update header indicators
    updateSortIndicators();
    
    // Apply sorting and update display
    applySorting();
    displayEpisodes(state.filtered);
}

function applySorting() {
    const field = state.sort.field;
    const ascending = state.sort.ascending;
    
    state.filtered.sort((a, b) => {
        let aVal, bVal;
        
        // Handle special cases for different fields
        switch (field) {
            case 'rank':
            case 'series':
                aVal = a[field] || 0;
                bVal = b[field] || 0;
                return ascending ? aVal - bVal : bVal - aVal;
                
            case 'broadcast_date':
                aVal = parseDateForSorting(a.broadcast_date);
                bVal = parseDateForSorting(b.broadcast_date);
                return ascending ? aVal - bVal : bVal - aVal;
                
            case 'doctor':
                aVal = a.doctor?.actor || '';
                bVal = b.doctor?.actor || '';
                break;
                
            case 'companion':
                aVal = a.companion?.actor || 'zzz'; // Push nulls to end
                bVal = b.companion?.actor || 'zzz';
                break;
                
            case 'cast':
                aVal = Array.isArray(a.cast) ? a.cast.length : 0;
                bVal = Array.isArray(b.cast) ? b.cast.length : 0;
                return ascending ? aVal - bVal : bVal - aVal;
                
            case 'era':
                aVal = CONFIG.ERA_ORDER.indexOf(a.era);
                bVal = CONFIG.ERA_ORDER.indexOf(b.era);
                return ascending ? aVal - bVal : bVal - aVal;
                
            default:
                aVal = a[field] || '';
                bVal = b[field] || '';
        }
        
        // String comparison
        if (typeof aVal === 'string' && typeof bVal === 'string') {
            return ascending 
                ? aVal.localeCompare(bVal) 
                : bVal.localeCompare(aVal);
        }
        
        return 0;
    });
}

function updateSortIndicators() {
    const headers = document.querySelectorAll('th[data-sort]');
    headers.forEach(header => {
        const field = header.getAttribute('data-sort');
        header.classList.remove('sort-asc', 'sort-desc');
        
        if (field === state.sort.field) {
            header.classList.add(state.sort.ascending ? 'sort-asc' : 'sort-desc');
        }
    });
}

// Filtering Functions
function filterEpisodes() {
    const nameFilter = state.filters.name.toLowerCase().trim();
    
    if (!nameFilter) {
        state.filtered = [...state.episodes];
    } else {
        state.filtered = state.episodes.filter(episode => {
            // Search in multiple fields (case-insensitive partial match)
            const searchFields = [
                episode.title,
                episode.director,
                episode.writer,
                episode.doctor?.actor,
                episode.doctor?.incarnation,
                episode.companion?.actor,
                episode.companion?.character,
                episode.era
            ];
            
            return searchFields.some(field => 
                field && field.toLowerCase().includes(nameFilter)
            );
        });
    }
    
    applySorting();
    displayEpisodes(state.filtered);
}

// Utility Functions

/**
 * Extract year from various date formats
 * Handles: YYYY-MM-DD, DD/MM/YYYY, Month DD, YYYY, YYYY
 */
function extractYear(dateString) {
    if (!dateString) return '—';
    
    // YYYY format
    if (CONFIG.DATE_FORMATS.YEAR.test(dateString)) {
        return dateString;
    }
    
    // YYYY-MM-DD format
    if (CONFIG.DATE_FORMATS.ISO.test(dateString)) {
        return dateString.split('-')[0];
    }
    
    // DD/MM/YYYY format
    if (CONFIG.DATE_FORMATS.UK.test(dateString)) {
        return dateString.split('/')[2];
    }
    
    // Month DD, YYYY format
    if (CONFIG.DATE_FORMATS.LONG.test(dateString)) {
        return dateString.split(',')[1].trim();
    }
    
    // Try to extract any 4-digit year
    const yearMatch = dateString.match(/\d{4}/);
    return yearMatch ? yearMatch[0] : '—';
}

/**
 * Parse date string to timestamp for sorting
 * Handles multiple date formats with proper conversion
 */
function parseDateForSorting(dateString) {
    if (!dateString) return 0;
    
    // YYYY format
    if (CONFIG.DATE_FORMATS.YEAR.test(dateString)) {
        return new Date(dateString + '-01-01').getTime();
    }
    
    // YYYY-MM-DD format (ISO)
    if (CONFIG.DATE_FORMATS.ISO.test(dateString)) {
        return new Date(dateString).getTime();
    }
    
    // DD/MM/YYYY format
    if (CONFIG.DATE_FORMATS.UK.test(dateString)) {
        const [day, month, year] = dateString.split('/');
        return new Date(`${year}-${month}-${day}`).getTime();
    }
    
    // Month DD, YYYY format
    if (CONFIG.DATE_FORMATS.LONG.test(dateString)) {
        return new Date(dateString).getTime();
    }
    
    // Fallback: try standard Date parsing
    const parsed = new Date(dateString);
    return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    const table = document.getElementById('episodes-table');
    const noResults = document.getElementById('no-results');
    
    if (show) {
        loading.style.display = 'block';
        table.style.display = 'none';
        noResults.style.display = 'none';
    } else {
        loading.style.display = 'none';
    }
}

function showError(message) {
    const errorElement = document.getElementById('error');
    if (message) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    } else {
        errorElement.style.display = 'none';
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', init);
