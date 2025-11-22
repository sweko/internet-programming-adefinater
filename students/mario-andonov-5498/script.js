const DATA_URL = 'https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/hugo-books-full.json'
let books = [];
let filteredBooks = [];
let currentSort = { column: 'year', ascending: false };

let loadingElement, errorElement, tableBody, resultsCount, noResults;
let nameFilter, winnerFilter, clearFiltersBtn;

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
}

function setupEventListeners() {
    nameFilter.addEventListener('input', handleFilterChange);
    winnerFilter.addEventListener('change', handleFilterChange);
    clearFiltersBtn.addEventListener('click', clearAllFilters);

    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', () => {
            handleSort(header.dataset.column);
        });
    });
}

async function loadData() {
    try {
        showLoading(true);
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        books = data.books; // ✅ FIXED: Access the array inside the object
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

    filteredBooks.forEach(book => {
        const row = document.createElement('tr');

        const awardText = book.award
            ? `${book.award.year} <span class="winner-badge ${book.award.is_winner ? 'winner' : 'nominee'}">${book.award.is_winner ? 'Winner' : 'Nominee'}</span>`
            : '—';

        const seriesText = book.series
            ? typeof book.series === 'string'
                ? `<span class="series-name">${book.series}</span>`
                : `<span class="series-name">${book.series.name} #${book.series.order}</span>`
            : `<span class="no-series">No series</span>`;

        const genresText = book.genres?.length
            ? book.genres.map(g => `<span class="genre-tag">${g}</span>`).join('')
            : `<span class="no-genres">No genres</span>`;

        row.innerHTML = `
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td><span class="book-type">${book.category}</span></td>
            <td>${awardText}</td>
            <td>${book.publisher}</td>
            <td>${seriesText}</td>
            <td class="genres-list">${genresText}</td>
        `;

        tableBody.appendChild(row);
    });
}

function handleSort(column) {
    if (currentSort.column === column) {
        currentSort.ascending = !currentSort.ascending;
    } else {
        currentSort.column = column;
        currentSort.ascending = true;
    }

    filteredBooks.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];

        if (column === 'award') {
            valA = a.award?.year || 0;
            valB = b.award?.year || 0;
        }

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        return currentSort.ascending ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
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
    const nameValue = nameFilter.value.toLowerCase();
    const winnerValue = winnerFilter.value;

    filteredBooks = books.filter(book => {
        const title = book.title?.toLowerCase() || '';
        const author = book.author?.toLowerCase() || '';
        const matchesName = title.includes(nameValue) || author.includes(nameValue);

        const isWinner = book.award?.is_winner ?? null;
        const hasAward = book.award != null;

        const matchesWinner =
            winnerValue === 'all' ||
            (winnerValue === 'winners' && isWinner === true) ||
            (winnerValue === 'nominees' && isWinner === false);

        return matchesName && (winnerValue === 'all' ? true : hasAward && matchesWinner);
    });

    displayBooks();
}

function clearAllFilters() {
    nameFilter.value = '';
    winnerFilter.value = 'all';
    filteredBooks = [...books];
    displayBooks();
}

function showLoading(show) {
    if (loadingElement) {
      loadingElement.classList.toggle('hidden', !show);
    }
    if (errorElement) {
      errorElement.classList.add('hidden');
    }
  }
 
  function showError(show) {
    if (errorElement) {
      errorElement.classList.toggle('hidden', !show);
    }
    if (loadingElement) {
      loadingElement.classList.add('hidden');
    }
  }
 