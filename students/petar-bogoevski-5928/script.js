const DATA_URL = 'https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/hugo-books-full.json';

let books = [];
let filteredBooks = [];
let currentSort = { column: null, direction: null };

let nameFilterInput, winnerFilterInput;
let loadingElement, errorElement, tableBody, resultsCount, noResults, clearFiltersBtn;

document.addEventListener('DOMContentLoaded', () => {
    initializeElements();
    loadData();
});

function initializeElements() {
    loadingElement = document.getElementById('loading');
    errorElement = document.getElementById('error');
    tableBody = document.getElementById('booksTableBody');
    resultsCount = document.getElementById('resultsCount');
    noResults = document.getElementById('noResults');
    clearFiltersBtn = document.getElementById('clearFilters');

    nameFilterInput = document.getElementById('nameFilter');
    winnerFilterInput = document.getElementById('winnerFilter');

    nameFilterInput.addEventListener('input', debounce(applyFilters, 300));
    winnerFilterInput.addEventListener('change', applyFilters);
    clearFiltersBtn.addEventListener('click', clearFilters);

    // Add column sorting
    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', () => sortColumn(header.dataset.column));
        header.tabIndex = 0; // make focusable
        header.addEventListener('keydown', e => {
            if (e.key === 'Enter') sortColumn(header.dataset.column);
        });
    });

    // Keyboard navigation
    tableBody.addEventListener('keydown', handleRowNavigation);
}

// Load data from JSON
async function loadData() {
    try {
        showLoading(true);

        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        if (Array.isArray(data)) {
            books = data;
        } else if (Array.isArray(data.books)) {
            books = data.books;
        } else {
            throw new Error("Unexpected data format");
        }

        validateData(books);

        filteredBooks = [...books];
        displayBooks();
    } catch (err) {
        console.error("Error loading data:", err);
        showError(true);
    } finally {
        showLoading(false);
    }
}

function debounce(fn, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
    };
}

function showLoading(state) {
    loadingElement.classList.toggle('hidden', !state);
}

function showError(state) {
    errorElement.classList.toggle('hidden', !state);
}

function applyFilters() {
    const text = nameFilterInput.value.toLowerCase();
    const filterType = winnerFilterInput.value;

    filteredBooks = books.filter(book => {
        const title = book.title?.toLowerCase() || '';
        const author = book.author?.toLowerCase() || '';

        const matchesName = title.includes(text) || author.includes(text);

        const isWinner = book.award?.is_winner;
        const matchesWinner = filterType === 'all' ||
            (filterType === 'winner' && isWinner) ||
            (filterType === 'nominee' && isWinner === false);

        return matchesName && matchesWinner;
    });

    smartSort(text);
    displayBooks();
}

function clearFilters() {
    nameFilterInput.value = '';
    winnerFilterInput.value = 'all';
    filteredBooks = [...books];
    displayBooks();
}

function displayBooks() {
    tableBody.innerHTML = '';
    resultsCount.textContent = `Showing ${filteredBooks.length} of ${books.length} books`;
    noResults.classList.toggle('hidden', filteredBooks.length > 0);

    filteredBooks.forEach(book => {
        const title = book.title || 'Unknown Title';
        const author = book.author || 'Unknown Author';
        const category = book.award?.category || 'Unknown Category';
        const year = book.award?.year || 'N/A';
        const isWinner = book.award?.is_winner;
        const awardText = isWinner === undefined ? 'Unknown' : isWinner ? 'Winner' : 'Nominee';
        const publisher = book.publisher || 'Unknown Publisher';
        const series = formatSeries(book.series);
        const genres = Array.isArray(book.genres) && book.genres.length > 0 ? book.genres.join(', ') : 'None';

        const truncatedTitle = title.length > 80 ? title.slice(0, 77) + '...' : title;

        const row = document.createElement('tr');
        row.tabIndex = 0; // Make row focusable for keyboard navigation
        row.innerHTML = `
            <td title="${title}">${truncatedTitle}</td>
            <td>${author}</td>
            <td>${category}</td>
            <td>${year} <span class="winner-badge ${isWinner ? 'winner' : 'nominee'}">${awardText}</span></td>
            <td>${publisher}</td>
            <td>${series}</td>
            <td>${genres}</td>
        `;
        tableBody.appendChild(row);
    });
}

function formatSeries(series) {
    if (!series) return 'None';
    if (typeof series === 'string') return series;
    if (series.name) return `${series.name} (#${series.order || 1})`;
    return 'None';
}

function validateData(booksArray) {
    const seenIds = new Set();
    let warnings = 0;

    booksArray.forEach(book => {
        if (!book.id) { console.warn('Missing book ID', book); warnings++; }
        if (!book.title) { console.warn('Missing title', book); warnings++; }
        if (!book.author) { console.warn('Missing author', book); warnings++; }
        if (book.id && seenIds.has(book.id)) { console.warn('Duplicate ID', book.id); warnings++; }
        seenIds.add(book.id);

        if (book.award) {
            if (typeof book.award.is_winner !== 'boolean') {
                console.warn('Invalid winner status for', book.title); warnings++;
            }
            if (book.award.year && book.award.year > new Date().getFullYear()) {
                console.warn('Future award year for', book.title); warnings++;
            }
        }
    });

    if (warnings > 0) console.info(`Total warnings: ${warnings}`);
}

// ===== Tier 3: Smart relevance sort =====
function smartSort(searchText) {
    filteredBooks.sort((a, b) => {
        const aTitle = a.title?.toLowerCase() || '';
        const bTitle = b.title?.toLowerCase() || '';
        const aFields = [aTitle, a.author?.toLowerCase() || '', a.publisher?.toLowerCase() || ''].join(' ');
        const bFields = [bTitle, b.author?.toLowerCase() || '', b.publisher?.toLowerCase() || ''].join(' ');

        // Exact title match first
        const aExact = aTitle === searchText ? 0 : 1;
        const bExact = bTitle === searchText ? 0 : 1;
        if (aExact !== bExact) return aExact - bExact;

        // Title contains searchText
        const aContains = aTitle.includes(searchText) ? 0 : 1;
        const bContains = bTitle.includes(searchText) ? 0 : 1;
        if (aContains !== bContains) return aContains - bContains;

        // Any field contains searchText
        const aFieldMatch = aFields.includes(searchText) ? 0 : 1;
        const bFieldMatch = bFields.includes(searchText) ? 0 : 1;
        if (aFieldMatch !== bFieldMatch) return aFieldMatch - bFieldMatch;

        // Default: descending year
        return (b.award?.year || 0) - (a.award?.year || 0);
    });
}

// ===== Tier 3: Column sorting =====
function sortColumn(column) {
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }

    filteredBooks.sort((a, b) => {
        const valA = (a[column] || '').toString().toLowerCase();
        const valB = (b[column] || '').toString().toLowerCase();
        if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });

    displayBooks();
    updateSortIndicators();
}

function updateSortIndicators() {
    document.querySelectorAll('.sortable').forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
        if (header.dataset.column === currentSort.column) {
            header.classList.add(currentSort.direction === 'asc' ? 'sort-asc' : 'sort-desc');
        }
    });
}

// ===== Tier 3: Keyboard navigation in table rows =====
function handleRowNavigation(e) {
    const rows = Array.from(tableBody.querySelectorAll('tr'));
    const focused = document.activeElement;
    const index = rows.indexOf(focused);

    if (e.key === 'ArrowDown' && index < rows.length - 1) {
        rows[index + 1].focus();
        e.preventDefault();
    } else if (e.key === 'ArrowUp' && index > 0) {
        rows[index - 1].focus();
        e.preventDefault();
    }
}
