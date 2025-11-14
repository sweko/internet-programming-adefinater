const DATA_URL = 'https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/hugo-books-full.json';

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
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

async function loadData() {
    try {
        showLoading(true);

        const response = await fetch(DATA_URL);

        // Check if the response status is OK (200-299)
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        // Log the response headers to check what kind of data we're receiving
        console.log('Response Headers:', response.headers);

        // Try to parse the response as JSON
        const data = await response.json();

        // Log the raw data to the console for inspection
        console.log('Fetched data:', data);

        // Check if the data is in the correct format (an array)
        if (data && Array.isArray(data)) {
            books = data;
            filteredBooks = [...books]; // Start with all books filtered
            displayBooks();
        } else if (data && Array.isArray(data.books)) {
            // If data is an object containing a "books" array, use that
            books = data.books;
            filteredBooks = [...books]; // Start with all books filtered
            displayBooks();
        } else {
            throw new Error('Data format is incorrect. Expected an array or an object containing an array under the "books" key.');
        }
    } catch (error) {
        console.error('Error loading data:', error);
        showError(true);
    } finally {
        showLoading(false);
    }
}

function showLoading(show) {
    if (show) {
        loadingElement.classList.remove('hidden');
        errorElement.classList.add('hidden');
    } else {
        loadingElement.classList.add('hidden');
    }
}

function showError(show) {
    if (show) {
        errorElement.classList.remove('hidden');
        loadingElement.classList.add('hidden');
    } else {
        errorElement.classList.add('hidden');
    }
}

function displayBooks() {
    // Clear existing table content
    tableBody.innerHTML = '';

    // Update results count
    resultsCount.textContent = `Showing ${filteredBooks.length} of ${books.length} books`;

    // Show/hide no results message
    if (filteredBooks.length === 0) {
        noResults.classList.remove('hidden');
    } else {
        noResults.classList.add('hidden');
    }

    // Loop through each book and create a table row
    filteredBooks.forEach(book => {
        const row = document.createElement('tr');
        
        // Title
        const titleCell = document.createElement('td');
        titleCell.textContent = book.title;
        row.appendChild(titleCell);

        // Author
        const authorCell = document.createElement('td');
        authorCell.textContent = book.author;
        row.appendChild(authorCell);

        // Type (Category)
        const typeCell = document.createElement('td');
        typeCell.textContent = book.award.category;
        row.appendChild(typeCell);

        // Award (Year and Winner/Nominee)
        const awardCell = document.createElement('td');
        const awardText = `${book.award.year} ${book.award.is_winner ? 'Winner' : 'Nominee'}`;
        awardCell.textContent = awardText;
        row.appendChild(awardCell);

        // Publisher
        const publisherCell = document.createElement('td');
        publisherCell.textContent = book.publisher;
        row.appendChild(publisherCell);

        // Series (handle different formats)
        const seriesCell = document.createElement('td');
        if (book.series === false) {
            seriesCell.textContent = '—';
        } else if (typeof book.series === 'string') {
            seriesCell.textContent = book.series;
        } else if (typeof book.series === 'object' && book.series.name) {
            seriesCell.textContent = `${book.series.name} (#${book.series.order})`;
        }
        row.appendChild(seriesCell);

        // Genres
        const genresCell = document.createElement('td');
        genresCell.textContent = book.genres.length > 0 ? book.genres.join(', ') : 'None';
        row.appendChild(genresCell);

        // Append the row to the table body
        tableBody.appendChild(row);
    });
}

function handleFilterChange() {
    const nameFilterValue = nameFilter.value.toLowerCase();
    const winnerFilterValue = winnerFilter.value;

    filteredBooks = books.filter(book => {
        const nameMatch = book.title.toLowerCase().includes(nameFilterValue) || book.author.toLowerCase().includes(nameFilterValue);
        
        const winnerMatch = winnerFilterValue === 'all' || (winnerFilterValue === 'winner' && book.award.is_winner) || (winnerFilterValue === 'nominee' && !book.award.is_winner);

        return nameMatch && winnerMatch;
    });

    displayBooks();
}

function setupEventListeners() {
    nameFilter.addEventListener('input', handleFilterChange);
    winnerFilter.addEventListener('change', handleFilterChange);
    clearFiltersBtn.addEventListener('click', clearAllFilters);
}

function clearAllFilters() {
    nameFilter.value = '';
    winnerFilter.value = 'all';
    filteredBooks = [...books]; // Reset to all books
    displayBooks();
}

function handleSort(column) {
    const isAscending = currentSort.column === column && currentSort.ascending;

    currentSort = {
        column,
        ascending: !isAscending,
    };

    filteredBooks.sort((a, b) => {
        const aValue = a[column];
        const bValue = b[column];

        if (aValue < bValue) return isAscending ? -1 : 1;
        if (aValue > bValue) return isAscending ? 1 : -1;
        return 0;
    });

    displayBooks();
}