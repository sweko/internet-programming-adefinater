const DoctorWhoExplorer = (function() {
    // State management
    let episodes = [];
    let filteredEpisodes = [];
    let sortState = [
        { column: 'rank', direction: 'asc' }
    ];
    let filterState = {
        search: '',
        era: '',
        doctor: '',
        companion: ''
    };
    let dataWarnings = [];

    const elements = {
        loading: document.getElementById('loading'),
        error: document.getElementById('error'),
        mainContent: document.getElementById('main-content'),
        episodesBody: document.getElementById('episodes-body'),
        search: document.getElementById('search'),
        eraFilter: document.getElementById('era-filter'),
        doctorFilter: document.getElementById('doctor-filter'),
        companionFilter: document.getElementById('companion-filter'),
        exportBtn: document.getElementById('export-btn'),
        episodeCount: document.getElementById('episode-count'),
        warningCount: document.getElementById('warning-count')
    };

    const EPISODE_URLS = [
        'https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/doctor-who-episodes-01-10.json',
        'https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/doctor-who-episodes-11-20.json',
        'https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/doctor-who-episodes-21-30.json',
        'https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/doctor-who-episodes-31-40.json',
        'https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/doctor-who-episodes-41-50.json',
        'https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/doctor-who-episodes-51-65.json'
    ];

    // Initialize the application
    function init() {
        setupEventListeners();
        loadEpisodeData();
    }

    // Set up event listeners for user interactions
    function setupEventListeners() {
        elements.search.addEventListener('input', debounce(handleSearch, 300));
        elements.eraFilter.addEventListener('change', handleFilterChange);
        elements.doctorFilter.addEventListener('change', handleFilterChange);
        elements.companionFilter.addEventListener('change', handleFilterChange);
        elements.exportBtn.addEventListener('click', handleExport);

        // Make table headers focusable and add click listeners
        document.querySelectorAll('th[data-sort]').forEach(th => {
            th.setAttribute('tabindex', '0');
            th.addEventListener('click', (event) => handleSort(th.dataset.sort, event));
        });

        document.addEventListener('keydown', handleKeyboardNavigation);
    }

    // Load episode data from the API
    async function loadEpisodeData() {
        try {
            showLoading();

            elements.loading.querySelector('p').textContent = 'Loading Doctor Who episodes (0/6)...';

            const fetchPromises = EPISODE_URLS.map(async (url, index) => {
                try {
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status} for ${url}`);
                    }
                    const data = await response.json();

                    elements.loading.querySelector('p').textContent = `Loading Doctor Who episodes (${index + 1}/${EPISODE_URLS.length})...`;

                    return data;
                } catch (error) {
                    console.error(`Error fetching from ${url}:`, error);
                    throw error;
                }
            });

            const results = await Promise.allSettled(fetchPromises);

            episodes = [];
            let failedFetches = 0;

            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    const data = result.value;
                    let episodeData = [];

                    if (data.episodes && Array.isArray(data.episodes)) {
                        episodeData = data.episodes;
                    } else if (Array.isArray(data)) {
                        episodeData = data;
                    } else {
                        console.warn(`Unexpected data structure from URL ${index + 1}:`, data);
                        failedFetches++;
                        return;
                    }

                    console.log(`Loaded ${episodeData.length} episodes from URL ${index + 1}`);
                    episodes.push(...episodeData);
                } else {
                    console.error(`Failed to fetch from URL ${index + 1}:`, result.reason);
                    failedFetches++;
                }
            });

            if (episodes.length === 0) {
                throw new Error('No episode data could be loaded from any source');
            }

            console.log(`Successfully loaded ${episodes.length} episodes total`);
            if (failedFetches > 0) {
                console.warn(`${failedFetches} out of ${EPISODE_URLS.length} sources failed to load`);
            }

            validateData();

            filteredEpisodes = [...episodes];

            populateFilters();

            renderTable();

            updateStats();
            showMainContent();

        } catch (error) {
            console.error('Error loading episode data:', error);

            const errorMessage = episodes.length === 0
                ? 'Failed to load episode data from all sources. Please check your internet connection and try again.'
                : 'Some episode data failed to load, but showing available episodes.';

            elements.error.querySelector('p').textContent = errorMessage;
            showError();

            if (episodes.length > 0) {
                showMainContent();
            }
        }
    }
    function validateData() {
        dataWarnings = [];

        episodes.forEach((episode, index) => {
            if (episode.rank === undefined || episode.rank === null) dataWarnings.push(`Episode ${index + 1}: Missing rank`);
            if (!episode.title) dataWarnings.push(`Episode ${index + 1}: Missing title`);
            if (episode.series === undefined || episode.series === null) dataWarnings.push(`Episode ${index + 1}: Missing series`);
            if (!episode.era) dataWarnings.push(`Episode ${index + 1}: Missing era`);
            if (!episode.broadcast_date) dataWarnings.push(`Episode ${index + 1}: Missing broadcast date`);
            if (!episode.doctor || !episode.doctor.actor) dataWarnings.push(`Episode ${index + 1}: Missing doctor data`);

            if (episode.rank < 0) dataWarnings.push(`Episode ${index + 1}: Negative rank (${episode.rank})`);
            if (episode.series < 0) dataWarnings.push(`Episode ${index + 1}: Negative series number`);

            const broadcastYear = extractYear(episode.broadcast_date);
            const currentYear = new Date().getFullYear();
            if (broadcastYear > currentYear) {
                dataWarnings.push(`Episode ${index + 1}: Future broadcast date (${episode.broadcast_date})`);
            }

            const duplicateRank = episodes.find((e, i) => i !== index && e.rank === episode.rank);
            if (duplicateRank) {
                dataWarnings.push(`Episode ${index + 1}: Duplicate rank (${episode.rank})`);
            }
        });

        if (dataWarnings.length > 0) {
            console.warn('Data validation warnings:', dataWarnings);
        }
    }

    // Populate filter dropdowns with unique values from data
    function populateFilters() {
        const doctors = [...new Set(episodes
            .map(ep => ep.doctor ? `${ep.doctor.actor} (${ep.doctor.incarnation})` : '')
            .filter(Boolean))].sort();

        doctors.forEach(doctor => {
            const option = document.createElement('option');
            option.value = doctor;
            option.textContent = doctor;
            elements.doctorFilter.appendChild(option);
        });

        const companions = [...new Set(episodes
            .map(ep => {
                if (!ep.companion) return null;
                return `${ep.companion.actor} (${ep.companion.character})`;
            })
            .filter(Boolean))].sort();

        companions.forEach(companion => {
            const option = document.createElement('option');
            option.value = companion;
            option.textContent = companion;
            elements.companionFilter.appendChild(option);
        });
    }

    // Handle search input with debouncing
    function handleSearch(e) {
        filterState.search = e.target.value.toLowerCase().trim();
        applyFilters();
    }

    // Handle filter changes
    function handleFilterChange(e) {
        const filterType = e.target.id.replace('-filter', '');
        filterState[filterType] = e.target.value;
        applyFilters();
    }

    // Apply all active filters to the episode data
    function applyFilters() {
        filteredEpisodes = episodes.filter(episode => {
            if (filterState.search) {
                const searchTerm = filterState.search;
                const searchableText = [
                    episode.title,
                    episode.director,
                    episode.writer,
                    episode.doctor?.actor,
                    episode.doctor?.incarnation,
                    episode.companion?.actor,
                    episode.companion?.character,
                    ...(episode.cast || []).flatMap(c => [c.actor, c.character])
                ].filter(Boolean).join(' ').toLowerCase();

                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }

            if (filterState.era && episode.era !== filterState.era) {
                return false;
            }

            if (filterState.doctor) {
                const doctorString = episode.doctor ? `${episode.doctor.actor} (${episode.doctor.incarnation})` : '';
                if (doctorString !== filterState.doctor) {
                    return false;
                }
            }

            if (filterState.companion) {
                const companionString = episode.companion ?
                    `${episode.companion.actor} (${episode.companion.character})` : 'None';
                if (companionString !== filterState.companion) {
                    return false;
                }
            }

            return true;
        });

        if (filterState.search) {
            applyRelevanceSort();
        } else {
            applySort();
        }

        renderTable();
        updateStats();
    }

    // Apply smart relevance sorting when filtering
    function applyRelevanceSort() {
        const searchTerm = filterState.search.toLowerCase();

        filteredEpisodes.sort((a, b) => {
            const aTitleMatch = a.title.toLowerCase() === searchTerm;
            const bTitleMatch = b.title.toLowerCase() === searchTerm;

            if (aTitleMatch && !bTitleMatch) return -1;
            if (!aTitleMatch && bTitleMatch) return 1;

            const aTitleContains = a.title.toLowerCase().includes(searchTerm);
            const bTitleContains = b.title.toLowerCase().includes(searchTerm);

            if (aTitleContains && !bTitleContains) return -1;
            if (!aTitleContains && bTitleContains) return 1;

            const aAnyField = JSON.stringify(a).toLowerCase().includes(searchTerm);
            const bAnyField = JSON.stringify(b).toLowerCase().includes(searchTerm);

            if (aAnyField && !bAnyField) return -1;
            if (!aAnyField && bAnyField) return 1;

            return a.rank - b.rank;
        });
    }

    // Handle column sorting
    function handleSort(column, event) {
        const isShiftClick = event && event.shiftKey;

        if (isShiftClick) {
            const existingLevelIndex = sortState.findIndex(level => level.column === column);

            if (existingLevelIndex !== -1) {
                sortState[existingLevelIndex].direction =
                    sortState[existingLevelIndex].direction === 'asc' ? 'desc' : 'asc';
            } else {
                sortState.push({ column, direction: 'asc' });
            }
        } else {
            const existingLevelIndex = sortState.findIndex(level => level.column === column);

            if (existingLevelIndex !== -1 && sortState.length === 1) {
                sortState[0].direction = sortState[0].direction === 'asc' ? 'desc' : 'asc';
            } else {
                sortState = [{ column, direction: 'asc' }];
            }
        }

        updateSortIndicators();

        applySort();
        renderTable();
    }

    function updateSortIndicators() {
        document.querySelectorAll('th[data-sort]').forEach(th => {
            th.removeAttribute('data-sort-direction');
            th.removeAttribute('data-sort-level');
            th.querySelector('.sort-indicator').textContent = '';
        });

        sortState.forEach((level, index) => {
            const header = document.querySelector(`th[data-sort="${level.column}"]`);
            if (header) {
                header.setAttribute('data-sort-direction', level.direction);
                header.setAttribute('data-sort-level', index + 1);

                const indicator = header.querySelector('.sort-indicator');
                if (indicator) {
                    const arrow = level.direction === 'asc' ? '↑' : '↓';
                    indicator.textContent = `${index + 1}${arrow}`;
                }
            }
        });
    }

    // Apply current sort to filtered episodes
    function applySort() {
        filteredEpisodes.sort((a, b) => {
            for (const level of sortState) {
                let aValue = a[level.column];
                let bValue = b[level.column];

                if (level.column === 'broadcast_year') {
                    aValue = extractYear(a.broadcast_date);
                    bValue = extractYear(b.broadcast_date);
                } else if (level.column === 'doctor') {
                    aValue = a.doctor ? `${a.doctor.actor} (${a.doctor.incarnation})` : '';
                    bValue = b.doctor ? `${b.doctor.actor} (${b.doctor.incarnation})` : '';
                } else if (level.column === 'companion') {
                    aValue = a.companion ? `${a.companion.actor} (${a.companion.character})` : '';
                    bValue = b.companion ? `${b.companion.actor} (${b.companion.character})` : '';
                } else if (level.column === 'cast_count') {
                    aValue = a.cast ? a.cast.length : 0;
                    bValue = b.cast ? b.cast.length : 0;
                }

                if (aValue == null) aValue = '';
                if (bValue == null) bValue = '';

                if (typeof aValue !== 'string') aValue = String(aValue);
                if (typeof bValue !== 'string') bValue = String(bValue);

                let result = 0;
                if (aValue < bValue) result = -1;
                if (aValue > bValue) result = 1;

                if (result !== 0) {
                    return level.direction === 'desc' ? -result : result;
                }
            }

            return 0;
        });
    }

    // Render the episodes table
    function renderTable() {
        elements.episodesBody.innerHTML = '';

        if (filteredEpisodes.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="10" style="text-align: center;">No episodes match your filters</td>`;
            elements.episodesBody.appendChild(row);
            return;
        }

        filteredEpisodes.forEach((episode, index) => {
            const row = document.createElement('tr');
            row.tabIndex = 0;
            row.dataset.index = index;

            const broadcastYear = extractYear(episode.broadcast_date);

            const doctorText = episode.doctor ?
                `${episode.doctor.actor} (${episode.doctor.incarnation})` : '—';

            const companionText = episode.companion ?
                `${episode.companion.actor} (${episode.companion.character})` : 'None';

            const castCount = episode.cast ? episode.cast.length : 0;

            row.innerHTML = `
                <td>${episode.rank != null ? episode.rank : '—'}</td>
                <td>${escapeHtml(episode.title || '—')}</td>
                <td>${episode.series != null ? episode.series : '—'}</td>
                <td>${episode.era || '—'}</td>
                <td>${broadcastYear || '—'}</td>
                <td>${escapeHtml(episode.director || '—')}</td>
                <td>${escapeHtml(episode.writer || '—')}</td>
                <td>${escapeHtml(doctorText)}</td>
                <td>${escapeHtml(companionText)}</td>
                <td>${castCount}</td>
            `;

            elements.episodesBody.appendChild(row);
        });
    }

    // Handle keyboard navigation
    function handleKeyboardNavigation(e) {
        const activeElement = document.activeElement;

        if (activeElement.closest('tr') && activeElement.closest('tbody')) {
            let newRow;

            switch(e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    newRow = activeElement.closest('tr').previousElementSibling;
                    if (newRow) newRow.focus();
                    break;

                case 'ArrowDown':
                    e.preventDefault();
                    newRow = activeElement.closest('tr').nextElementSibling;
                    if (newRow) newRow.focus();
                    break;

                case 'Enter':
                    e.preventDefault();
                    const focusedRow = activeElement.closest('tr');
                    const cellIndex = Array.from(focusedRow.cells).indexOf(activeElement);
                    const headerCell = document.querySelectorAll('th[data-sort]')[cellIndex];
                    if (headerCell) {
                        handleSort(headerCell.dataset.sort);
                    }
                    break;
            }
            return;
        }

        if (e.key === 'Tab') {
            return;
        }

        if (activeElement.tagName === 'TH' && activeElement.hasAttribute('data-sort')) {
            const headers = Array.from(document.querySelectorAll('th[data-sort]'));
            const currentIndex = headers.indexOf(activeElement);

            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    if (currentIndex > 0) {
                        headers[currentIndex - 1].focus();
                    }
                    break;

                case 'ArrowRight':
                    e.preventDefault();
                    if (currentIndex < headers.length - 1) {
                        headers[currentIndex + 1].focus();
                    }
                    break;

                case 'Enter':
                case ' ':
                    e.preventDefault();
                    handleSort(activeElement.dataset.sort);
                    break;
            }
            return;
        }

        const focusableElements = [
            elements.search,
            elements.eraFilter,
            elements.doctorFilter,
            elements.companionFilter,
            elements.exportBtn,
            ...document.querySelectorAll('th[data-sort]')
        ];

        const currentIndex = focusableElements.indexOf(activeElement);

        if (currentIndex === -1) return;

        switch(e.key) {
            case 'ArrowRight':
                e.preventDefault();
                if (currentIndex < focusableElements.length - 1) {
                    focusableElements[currentIndex + 1].focus();
                }
                break;

            case 'ArrowLeft':
                e.preventDefault();
                if (currentIndex > 0) {
                    focusableElements[currentIndex - 1].focus();
                }
                break;

            case 'Enter':
                if (activeElement.tagName === 'TH') {
                    e.preventDefault();
                    handleSort(activeElement.dataset.sort);
                }
                break;
        }
    }

    // Handle CSV export
    function handleExport() {
        if (filteredEpisodes.length === 0) {
            alert('No data to export');
            return;
        }

        const headers = [
            'Rank', 'Title', 'Series', 'Era', 'Broadcast Year',
            'Director', 'Writer', 'Doctor', 'Companion', 'Cast Count'
        ];

        const csvContent = [
            headers.join(','),
            ...filteredEpisodes.map(episode => {
                const broadcastYear = extractYear(episode.broadcast_date);
                const doctorText = episode.doctor ?
                    `${episode.doctor.actor} (${episode.doctor.incarnation})` : '';
                const companionText = episode.companion ?
                    `${episode.companion.actor} (${episode.companion.character})` : 'None';
                const castCount = episode.cast ? episode.cast.length : 0;

                return [
                    episode.rank,
                    csvEscape(episode.title || ''),
                    episode.series,
                    episode.era,
                    broadcastYear,
                    csvEscape(episode.director || ''),
                    csvEscape(episode.writer || ''),
                    csvEscape(doctorText),
                    csvEscape(companionText),
                    castCount
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'doctor-who-episodes.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Update statistics display
    function updateStats() {
        elements.episodeCount.textContent = `Showing ${filteredEpisodes.length} of ${episodes.length} episodes`;

        if (dataWarnings.length > 0) {
            elements.warningCount.textContent = `${dataWarnings.length} warnings`;
            elements.warningCount.classList.remove('hidden');
        } else {
            elements.warningCount.classList.add('hidden');
        }
    }

    // UI state management
    function showLoading() {
        elements.loading.classList.remove('hidden');
        elements.error.classList.add('hidden');
        elements.mainContent.classList.add('hidden');
    }

    function showError() {
        elements.loading.classList.add('hidden');
        elements.error.classList.remove('hidden');
        elements.mainContent.classList.add('hidden');
    }

    function showMainContent() {
        elements.loading.classList.add('hidden');
        elements.error.classList.add('hidden');
        elements.mainContent.classList.remove('hidden');
    }

    // Utility functions
    function extractYear(dateString) {
        if (!dateString) return null;

        const isoMatch = dateString.match(/^(\d{4})-\d{2}-\d{2}$/);
        if (isoMatch) return parseInt(isoMatch[1]);

        const euMatch = dateString.match(/^\d{2}\/\d{2}\/(\d{4})$/);
        if (euMatch) return parseInt(euMatch[1]);

        const usMatch = dateString.match(/^[A-Za-z]+\s+\d{1,2},\s*(\d{4})$/);
        if (usMatch) return parseInt(usMatch[1]);

        const yearMatch = dateString.match(/^\d{4}$/);
        if (yearMatch) return parseInt(yearMatch[0]);

        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            return date.getFullYear();
        }

        return null;
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Escape CSV values
    function csvEscape(value) {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
    }

    // Debounce function for performance optimization
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    return {
        init
    };
})();

document.addEventListener('DOMContentLoaded', DoctorWhoExplorer.init);