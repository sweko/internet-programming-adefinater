const DATA_URL = 'https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/hugo-books-full.json';
let books = [];
let filteredBooks = [];
let currentSort = { column: 'award', ascending: false };
let currentPage = 1;
const pageSize = 50;

let loadingElement, errorElement, tableBody, resultsCount, noResults;
let nameFilter, winnerFilter, clearFiltersBtn;
let prevPageBtn, nextPageBtn, pageInfo;

document.addEventListener('DOMContentLoaded', function () {
    initializeElements();
    loadData();
    setupEventListeners();
});

function initializeElements() {
    loadingElement = document.getElementById('loading');
    errorElement = document.getElementById('error');
    tableBody = document.getElementById('booksTableBody');
    resultsCount = document.getElementById('resultsCount');
    noResults = document.getElementById('noResults');

    nameFilter = document.getElementById('nameFilter');
    winnerFilter = document.getElementById('winnerFilter');
    clearFiltersBtn = document.getElementById('clearFilters');

    prevPageBtn = document.getElementById('prevPage');
    nextPageBtn = document.getElementById('nextPage');
    pageInfo = document.getElementById('pageInfo');
}

function setupEventListeners() {
    nameFilter.addEventListener('input', debounce(handleFilterChange, 300));
    winnerFilter.addEventListener('change', handleFilterChange);
    clearFiltersBtn.addEventListener('click', clearAllFilters);

    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', () => handleSort(header.dataset.column));
    });

    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayBooks();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        if (currentPage * pageSize < filteredBooks.length) {
            currentPage++;
            displayBooks();
        }
    });
}

async function loadData() {
    try {
        showLoading(true);
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        books = data.books;
        filteredBooks = [...books];
        populateWinnerFilter();
        displayBooks();
    } catch (error) {
        console.error('Error loading data:', error);
        showError(true);
    } finally {
        showLoading(false);
    }
}

function populateWinnerFilter() {
    const options = ['winners', 'nominees'];
    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt.charAt(0).toUpperCase() + opt.slice(1);
        winnerFilter.appendChild(option);
    });
}

function displayBooks() {
    tableBody.innerHTML = '';
    resultsCount.textContent = `Showing ${filteredBooks.length} of ${books.length} books`;

    if (filteredBooks.length === 0) {
        noResults.classList.remove('hidden');
        return;
    } else {
        noResults.classList.add('hidden');
    }

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageBooks = filteredBooks.slice(start, end);

    pageBooks.forEach(book => {
        const row = document.createElement('tr');

        const awardYear = book.award?.year || '—';
        const awardStatus = book.award?.is_winner ? 'Winner' : 'Nominee';
        const awardText = `${awardYear} ${awardStatus}`;
        const type = book.award?.category || '—';

        const series = book.series === false ? 'None' :
            typeof book.series === 'string' ? book.series :
            book.series?.name ? `${book.series.name} (#${book.series.order})` : 'None';

        const genres = Array.isArray(book.genres) && book.genres.length > 0
            ? book.genres.join(', ')
            : 'None';

        const cells = [
            book.title || '—',
            book.author || '—',
            type,
            awardText,
            book.publisher || '—',
            series,
            genres
        ];

        cells.forEach(text => {
            const cell = document.createElement('td');
            cell.textContent = text;
            row.appendChild(cell);
        });

        tableBody.appendChild(row);
    });

    pageInfo.textContent = `Page ${currentPage}`;
}

function handleSort(column) {
    if (currentSort.column === column) {
        currentSort.ascending = !currentSort.ascending;
    } else {
        currentSort.column = column;
        currentSort.ascending = true;
    }

    filteredBooks.sort((a, b) => {
        let valA, valB;

        if (column === 'award') {
            valA = a.award?.year || 0;
            valB = b.award?.year || 0;
        } else {
            valA = (a[column] || '').toString().toLowerCase();
            valB = (b[column] || '').toString().toLowerCase();
        }

        if (valA < valB) return currentSort.ascending ? -1 : 1;
        if (valA > valB) return currentSort.ascending ? 1 : -1;
        return 0;
    });

    updateSortIndicators();
    displayBooks();
}

function updateSortIndicators() {
    document.querySelectorAll('.sortable').forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
        if (header.dataset.column === currentSort.column) {
            header.classList.add(currentSort.ascending ? 'sort-asc' : 'sort-desc');
        }
    });
}

function handleFilterChange() {
    const term = nameFilter.value.toLowerCase();
    const winnerValue = winnerFilter.value;

    filteredBooks = books.filter(book => {
        const title = book.title?.toLowerCase() || '';
        const author = book.author?.toLowerCase() || '';
        const otherFields = [
            book.publisher,
            book.genres?.join(', '),
            book.series?.name || book.series
        ].join(' ').toLowerCase();

        const matchesName = title.includes(term) || author.includes(term);
        const isWinner = book.award?.is_winner;
        const matchesWinner =
            winnerValue === 'all' ||
            (winnerValue === 'winners' && isWinner) ||
            (winnerValue === 'nominees' && !isWinner);

        return matchesName && matchesWinner;
    });

    filteredBooks.sort((a, b) => {
        const score = book => {
            const title = book.title?.toLowerCase() || '';
            const author = book.author?.toLowerCase() || '';
            const other = [
                book.publisher,
                book.genres?.join(', '),
                book.series?.name || book.series
            ].join(' ').toLowerCase();

            if (title === term) return 3;
            if (title.includes(term)) return 2;
            if (author.includes(term) || other.includes(term)) return 1;
            return 0;
        };

        const scoreA = score(a);
        const scoreB = score(b);
        if (scoreA !== scoreB) return scoreB - scoreA;

        return (b.award?.year || 0) - (a.award?.year || 0);
    });

    currentPage = 1;
    displayBooks();
}

function clearAllFilters() {
    nameFilter.value = '';
    winnerFilter.value = 'all';
    filteredBooks = [...books];
    currentPage = 1;
    handleSort(currentSort.column);
}

function showLoading(show) {
    loadingElement.classList.toggle('hidden', !show);
    errorElement.classList.add('hidden');
}

function showError(show) {
    errorElement.textContent = 'Error loading data. Please check your connection or try again later.';
    errorElement.classList.toggle('hidden', !show);
    loadingElement.classList.add('hidden');
}

function debounce(func, delay) {
    let timeout;
    return function () {
        clearTimeout(timeout);
        timeout = setTimeout(func, delay);
    };
}


// Additional helper functions can be added here as needed

/* 
 * IMPLEMENTATION NOTES:
 * 
 * 1. Data Loading:
 *    - Use fetch() to load the JSON data
 *    - Handle loading states and errors gracefully
 *    - Store data in global variables for filtering/sorting
 * 
 * 2. Table Rendering:
 *    - Create table rows dynamically with JavaScript
 *    - Use textContent or innerHTML appropriately for security
 *    - Handle edge cases (null values, empty arrays, special characters)
 * 
 * 3. Sorting:
 *    - Implement ascending/descending toggle
 *    - Handle different data types (strings, numbers, booleans)
 *    - Update visual indicators (arrows) in table headers
 * 
 * 4. Filtering:
 *    - Text filter should be case-insensitive and search title + author
 *    - Winner filter should handle "all", "winners", "nominees"
 *    - Debounce text input for better performance (optional)
 * 
 * 5. Edge Cases to Handle:
 *    - Nested award object: extract award.year, award.category, award.is_winner
 *    - Format award display as "YYYY Winner" or "YYYY Nominee"
 *    - series: false vs string vs object {name, order}
 *    - Empty genres arrays
 *    - Special characters in titles (quotes, apostrophes, etc.)
 *    - Long titles that might overflow table cells
 *    - Mixed ID types (some string, some number)
 * 
 */