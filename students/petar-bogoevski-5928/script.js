const DATA_URL = 'https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/hugo-books-full.json';

let books = [];
let filteredBooks = [];
let currentSort = [];
let isGroupedByGenre = false;

let nameFilterInput, winnerFilterInput, decadeFilterInput, authorFilterInput, genreFilterInput;
let loadingElement, errorElement, tableBody, resultsCount, noResults, clearFiltersBtn;
let exportCsvBtn, toggleGroupingBtn, sortIndicatorsContainer;

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
    exportCsvBtn = document.getElementById('exportCsv');
    toggleGroupingBtn = document.getElementById('toggleGrouping');
    sortIndicatorsContainer = document.getElementById('sortIndicators');

    nameFilterInput = document.getElementById('nameFilter');
    winnerFilterInput = document.getElementById('winnerFilter');
    decadeFilterInput = document.getElementById('decadeFilter');
    authorFilterInput = document.getElementById('authorFilter');
    genreFilterInput = document.getElementById('genreFilter');

    nameFilterInput.addEventListener('input', debounce(applyFilters, 300));
    winnerFilterInput.addEventListener('change', applyFilters);
    decadeFilterInput.addEventListener('change', applyFilters);
    authorFilterInput.addEventListener('change', applyFilters);
    genreFilterInput.addEventListener('change', applyFilters);
    clearFiltersBtn.addEventListener('click', clearFilters);
    exportCsvBtn.addEventListener('click', exportToCsv);
    toggleGroupingBtn.addEventListener('click', toggleGenreGrouping);

    // Add column sorting with shift-click support
    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', (e) => sortColumn(header.dataset.column, e.shiftKey));
        header.tabIndex = 0;
        header.addEventListener('keydown', e => {
            if (e.key === 'Enter') sortColumn(header.dataset.column, e.shiftKey);
        });
    });

    tableBody.addEventListener('keydown', handleRowNavigation);
}

// ===== Data Loading =====
async function loadData() {
    try {
        showLoading(true);
        showError(false);

        console.log('Loading data from:', DATA_URL);
        
        const response = await fetch(DATA_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Data loaded successfully:', data);

        // Handle different possible data structures
        if (Array.isArray(data)) {
            books = data;
        } else if (data && Array.isArray(data.books)) {
            books = data.books;
        } else if (data && data.data && Array.isArray(data.data)) {
            books = data.data;
        } else {
            throw new Error("Unexpected data format. Expected array or object with 'books' or 'data' array.");
        }

        if (books.length === 0) {
            throw new Error("No books found in the data");
        }

        validateData(books);
        populateEnhancedFilters();

        filteredBooks = [...books];
        applySorting();
        displayBooks();
        
    } catch (err) {
        console.error("Error loading data:", err);
        showError(true);
        errorElement.textContent = `Error loading data: ${err.message}`;
    } finally {
        showLoading(false);
    }
}

function showLoading(state) {
    if (state) {
        loadingElement.classList.remove('hidden');
        errorElement.classList.add('hidden');
    } else {
        loadingElement.classList.add('hidden');
    }
}

function showError(state) {
    if (state) {
        errorElement.classList.remove('hidden');
        loadingElement.classList.add('hidden');
    } else {
        errorElement.classList.add('hidden');
    }
}

function debounce(fn, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
    };
}

// ===== Data Validation =====
function validateData(booksArray) {
    const seenIds = new Set();
    let warnings = 0;

    booksArray.forEach((book, index) => {
        if (!book.id) { 
            console.warn(`Missing book ID at index ${index}`, book); 
            warnings++; 
        }
        if (!book.title) { 
            console.warn(`Missing title at index ${index}`, book); 
            warnings++; 
        }
        if (!book.author) { 
            console.warn(`Missing author at index ${index}`, book); 
            warnings++; 
        }
        if (book.id && seenIds.has(book.id)) { 
            console.warn(`Duplicate ID: ${book.id}`, book); 
            warnings++; 
        }
        seenIds.add(book.id);

        // Ensure award object exists
        if (!book.award) {
            book.award = {};
            console.warn(`Missing award object at index ${index}`, book);
            warnings++;
        }

        if (book.award) {
            if (typeof book.award.is_winner !== 'boolean') {
                console.warn(`Invalid winner status for "${book.title}"`, book); 
                warnings++;
            }
            if (book.award.year && book.award.year > new Date().getFullYear()) {
                console.warn(`Future award year for "${book.title}": ${book.award.year}`, book); 
                warnings++;
            }
        }

        // Ensure genres is an array
        if (!Array.isArray(book.genres)) {
            book.genres = [];
            console.warn(`Invalid genres format for "${book.title}"`, book);
            warnings++;
        }
    });

    if (warnings > 0) {
        console.info(`Total data validation warnings: ${warnings}`);
    }
}

// ===== Enhanced Filters =====
function populateEnhancedFilters() {
    // Clear existing options (keep first option)
    while (decadeFilterInput.children.length > 1) {
        decadeFilterInput.removeChild(decadeFilterInput.lastChild);
    }
    while (authorFilterInput.children.length > 1) {
        authorFilterInput.removeChild(authorFilterInput.lastChild);
    }
    while (genreFilterInput.children.length > 1) {
        genreFilterInput.removeChild(genreFilterInput.lastChild);
    }

    // Populate decades
    const decades = new Set();
    books.forEach(book => {
        if (book.award?.year) {
            const decade = Math.floor(book.award.year / 10) * 10;
            decades.add(decade);
        }
    });
    
    const sortedDecades = Array.from(decades).sort();
    sortedDecades.forEach(decade => {
        const option = document.createElement('option');
        option.value = decade;
        option.textContent = `${decade}s`;
        decadeFilterInput.appendChild(option);
    });

    // Populate authors
    const authors = new Set();
    books.forEach(book => {
        if (book.author) authors.add(book.author);
    });
    
    const sortedAuthors = Array.from(authors).sort();
    sortedAuthors.forEach(author => {
        const option = document.createElement('option');
        option.value = author;
        option.textContent = author;
        authorFilterInput.appendChild(option);
    });

    // Populate genres
    const genres = new Set();
    books.forEach(book => {
        if (Array.isArray(book.genres)) {
            book.genres.forEach(genre => {
                if (genre && genre.trim() !== '') {
                    genres.add(genre);
                }
            });
        }
    });
    
    const sortedGenres = Array.from(genres).sort();
    sortedGenres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre;
        option.textContent = genre;
        genreFilterInput.appendChild(option);
    });
}

function applyFilters() {
    const text = nameFilterInput.value.toLowerCase();
    const filterType = winnerFilterInput.value;
    const decade = decadeFilterInput.value;
    const author = authorFilterInput.value;
    const genre = genreFilterInput.value;

    filteredBooks = books.filter(book => {
        const title = book.title?.toLowerCase() || '';
        const bookAuthor = book.author?.toLowerCase() || '';

        const matchesName = title.includes(text) || bookAuthor.includes(text);

        const isWinner = book.award?.is_winner;
        const matchesWinner = filterType === 'all' ||
            (filterType === 'winner' && isWinner) ||
            (filterType === 'nominee' && isWinner === false);

        const bookDecade = book.award?.year ? Math.floor(book.award.year / 10) * 10 : null;
        const matchesDecade = decade === 'all' || bookDecade == decade;

        const matchesAuthor = author === 'all' || book.author === author;

        const matchesGenre = genre === 'all' || 
            (Array.isArray(book.genres) && book.genres.includes(genre));

        return matchesName && matchesWinner && matchesDecade && matchesAuthor && matchesGenre;
    });

    if (text) {
        smartSort(text);
    } else {
        applySorting();
    }
    displayBooks();
}

function clearFilters() {
    nameFilterInput.value = '';
    winnerFilterInput.value = 'all';
    decadeFilterInput.value = 'all';
    authorFilterInput.value = 'all';
    genreFilterInput.value = 'all';
    filteredBooks = [...books];
    applySorting();
    displayBooks();
}

// ===== Multi-column Sort =====
function sortColumn(column, isMultiSort = false) {
    if (!isMultiSort) {
        // Single column sort - replace current sorts
        const existingIndex = currentSort.findIndex(sort => sort.column === column);
        if (existingIndex >= 0) {
            // Toggle direction of existing sort
            currentSort[existingIndex].direction = 
                currentSort[existingIndex].direction === 'asc' ? 'desc' : 'asc';
        } else {
            // New single column sort
            currentSort = [{ column, direction: 'asc' }];
        }
    } else {
        // Multi-column sort - add to existing sorts
        const existingIndex = currentSort.findIndex(sort => sort.column === column);
        if (existingIndex >= 0) {
            // Remove if already exists
            currentSort.splice(existingIndex, 1);
        } else {
            // Add new sort level
            currentSort.push({ column, direction: 'asc' });
        }
    }

    applySorting();
    displayBooks();
    updateSortIndicators();
}

function applySorting() {
    if (currentSort.length === 0) {
        // Default sort by year descending when no explicit sort
        filteredBooks.sort((a, b) => (b.award?.year || 0) - (a.award?.year || 0));
        return;
    }

    filteredBooks.sort((a, b) => {
        for (const sort of currentSort) {
            let valA, valB;
            
            if (sort.column === 'award') {
                valA = a.award?.year || 0;
                valB = b.award?.year || 0;
            } else {
                valA = (a[sort.column] || '').toString().toLowerCase();
                valB = (b[sort.column] || '').toString().toLowerCase();
            }

            if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });
}

function updateSortIndicators() {
    // Clear all sort classes
    document.querySelectorAll('.sortable').forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
    });

    // Update header classes
    currentSort.forEach((sort, index) => {
        const header = document.querySelector(`[data-column="${sort.column}"]`);
        if (header) {
            header.classList.add(sort.direction === 'asc' ? 'sort-asc' : 'sort-desc');
        }
    });

    // Update sort indicators
    sortIndicatorsContainer.innerHTML = '';
    if (currentSort.length > 0) {
        const indicatorTitle = document.createElement('div');
        indicatorTitle.textContent = 'Sorted by:';
        indicatorTitle.style.fontWeight = 'bold';
        indicatorTitle.style.marginBottom = '5px';
        sortIndicatorsContainer.appendChild(indicatorTitle);

        currentSort.forEach((sort, index) => {
            const indicator = document.createElement('span');
            indicator.className = 'sort-indicator-item';
            indicator.innerHTML = `
                ${getColumnDisplayName(sort.column)} 
                (${sort.direction === 'asc' ? 'A-Z' : 'Z-A'})
                <span class="remove-sort" data-column="${sort.column}">×</span>
            `;
            sortIndicatorsContainer.appendChild(indicator);
        });

        // Add click handlers for remove buttons
        sortIndicatorsContainer.querySelectorAll('.remove-sort').forEach(button => {
            button.addEventListener('click', (e) => {
                const column = e.target.dataset.column;
                currentSort = currentSort.filter(sort => sort.column !== column);
                applySorting();
                displayBooks();
                updateSortIndicators();
            });
        });
    }
}

function getColumnDisplayName(column) {
    const names = {
        'title': 'Title',
        'author': 'Author',
        'category': 'Type',
        'award': 'Year'
    };
    return names[column] || column;
}

// ===== Smart Relevance Sort =====
function smartSort(searchText) {
    if (!searchText) {
        applySorting();
        return;
    }

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

// ===== Export Functionality =====
function exportToCsv() {
    if (filteredBooks.length === 0) {
        alert('No data to export!');
        return;
    }

    const headers = ['Title', 'Author', 'Category', 'Year', 'Award', 'Publisher', 'Series', 'Genres'];
    
    const csvContent = [
        headers.join(','),
        ...filteredBooks.map(book => {
            const row = [
                escapeCsv(book.title || ''),
                escapeCsv(book.author || ''),
                escapeCsv(book.award?.category || ''),
                book.award?.year || '',
                book.award?.is_winner ? 'Winner' : 'Nominee',
                escapeCsv(book.publisher || ''),
                escapeCsv(formatSeries(book.series)),
                escapeCsv(Array.isArray(book.genres) ? book.genres.join('; ') : '')
            ];
            return row.join(',');
        })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `hugo-books-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function escapeCsv(str) {
    if (str === null || str === undefined) return '""';
    str = String(str);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

// ===== Genre Grouping =====
function toggleGenreGrouping() {
    isGroupedByGenre = !isGroupedByGenre;
    toggleGroupingBtn.classList.toggle('active', isGroupedByGenre);
    toggleGroupingBtn.textContent = isGroupedByGenre ? 'Ungroup' : 'Group by Genre';
    displayBooks();
}

function displayBooks() {
    tableBody.innerHTML = '';
    resultsCount.textContent = `Showing ${filteredBooks.length} of ${books.length} books`;
    noResults.classList.toggle('hidden', filteredBooks.length > 0);

    if (filteredBooks.length === 0) return;

    if (isGroupedByGenre) {
        displayBooksGroupedByGenre();
    } else {
        displayBooksUngrouped();
    }
}

function displayBooksUngrouped() {
    document.querySelector('.books-table').classList.remove('grouped');
    
    filteredBooks.forEach(book => {
        const row = createBookRow(book);
        tableBody.appendChild(row);
    });
}

function displayBooksGroupedByGenre() {
    document.querySelector('.books-table').classList.add('grouped');
    
    // Group books by primary genre (first genre in array)
    const booksByGenre = {};
    filteredBooks.forEach(book => {
        const primaryGenre = Array.isArray(book.genres) && book.genres.length > 0 
            ? book.genres[0] 
            : 'Uncategorized';
        
        if (!booksByGenre[primaryGenre]) {
            booksByGenre[primaryGenre] = [];
        }
        booksByGenre[primaryGenre].push(book);
    });

    // Create genre groups
    Object.keys(booksByGenre).sort().forEach(genre => {
        const genreBooks = booksByGenre[genre];
        
        // Genre header row
        const headerRow = document.createElement('tr');
        headerRow.className = 'genre-row';
        headerRow.innerHTML = `
            <td colspan="7" class="genre-header">
                <span>${genre}</span>
                <span class="genre-count">${genreBooks.length} book${genreBooks.length !== 1 ? 's' : ''}</span>
            </td>
        `;
        
        headerRow.addEventListener('click', () => {
            const content = headerRow.nextElementSibling;
            content.classList.toggle('collapsed');
        });
        
        tableBody.appendChild(headerRow);

        // Genre books container
        const contentRow = document.createElement('tr');
        const contentCell = document.createElement('td');
        contentCell.colSpan = 7;
        contentCell.className = 'genre-books';
        
        const contentTable = document.createElement('table');
        contentTable.className = 'books-table';
        
        genreBooks.forEach(book => {
            const bookRow = createBookRow(book);
            contentTable.appendChild(bookRow);
        });
        
        contentCell.appendChild(contentTable);
        contentRow.appendChild(contentCell);
        tableBody.appendChild(contentRow);
    });
}

function createBookRow(book) {
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
    row.tabIndex = 0;
    row.innerHTML = `
        <td title="${title}">${truncatedTitle}</td>
        <td>${author}</td>
        <td>${category}</td>
        <td>${year} <span class="winner-badge ${isWinner ? 'winner' : 'nominee'}">${awardText}</span></td>
        <td>${publisher}</td>
        <td>${series}</td>
        <td>${genres}</td>
    `;
    return row;
}

function formatSeries(series) {
    if (!series) return 'None';
    if (typeof series === 'string') return series;
    if (series.name) return `${series.name} (#${series.order || 1})`;
    return 'None';
}

// ===== Keyboard Navigation =====
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