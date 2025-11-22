// Configuration and constants
// Using the first alternative URL for data loading
const DATA_URL = 'https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/hugo-books-full.json';
let books = [];
let filteredBooks = [];
let currentSort = { column: 'award', ascending: false }; // Default sort by award year, newest first
let sortLevels = []; // For multi-column sorting
let dataWarnings = []; // Store data validation warnings

// Performance optimization variables
let searchDebounceTimer = null;
const ITEMS_PER_PAGE = 100; // Pagination for large datasets
let currentPage = 1;

// Keyboard navigation variables
let currentFocusedRow = -1;

// Genre grouping variables
let isGenreGroupingActive = false;

// DOM elements (will be populated when DOM loads)
let loadingElement, errorElement, tableBody, resultsCount, noResults;
let nameFilter, winnerFilter, decadeFilter, authorFilter, clearFiltersBtn, exportBtn, toggleGroupingBtn, genreGroupingContainer;

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    loadData();
    setupEventListeners();
});

/**
 * Initialize DOM element references
 */
function initializeElements() {
    // Get references to all necessary DOM elements
    loadingElement = document.getElementById('loading');
    errorElement = document.getElementById('error');
    tableBody = document.getElementById('booksTableBody');
    resultsCount = document.getElementById('resultsCount');
    noResults = document.getElementById('noResults');
    
    nameFilter = document.getElementById('nameFilter');
    winnerFilter = document.getElementById('winnerFilter');
    decadeFilter = document.getElementById('decadeFilter');
    authorFilter = document.getElementById('authorFilter');
    clearFiltersBtn = document.getElementById('clearFilters');
    exportBtn = document.getElementById('exportBtn');
    toggleGroupingBtn = document.getElementById('toggleGrouping');
    genreGroupingContainer = document.getElementById('genreGrouping');
}

/**
 * Set up event listeners for user interactions
 */
function setupEventListeners() {
    // Filter inputs with debouncing for performance
    nameFilter.addEventListener('input', handleFilterChangeDebounced);
    winnerFilter.addEventListener('change', handleFilterChange);
    decadeFilter.addEventListener('change', handleFilterChange);
    authorFilter.addEventListener('change', handleFilterChange);
    
    // Clear filters button
    clearFiltersBtn.addEventListener('click', clearAllFilters);
    
    // BONUS FEATURE: Export CSV button
    exportBtn.addEventListener('click', exportToCSV);
    
    // BONUS FEATURE: Genre Grouping toggle button
    toggleGroupingBtn.addEventListener('click', toggleGenreGrouping);
    
    // Sort listeners to table headers
    const sortableHeaders = document.querySelectorAll('.sortable');
    sortableHeaders.forEach(header => {
        header.addEventListener('click', (event) => {
            const column = header.getAttribute('data-column');
            
            // BONUS FEATURE: Multi-column sort with Shift+click
            if (event.shiftKey) {
                handleMultiSort(column);
            } else {
                handleSort(column);
            }
        });
        // Add cursor pointer style for better UX
        header.style.cursor = 'pointer';
    });
    
    // TIER 3 FEATURE: Keyboard Navigation (5 points)
    document.addEventListener('keydown', handleKeyboardNavigation);
}

/**
 * Load book data from JSON file
 */
async function loadData() {
    try {
        showLoading(true);

        // Fetch data from DATA_URL
        const response = await fetch(DATA_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        books = Array.isArray(data) ? data : data.books || [];
        filteredBooks = [...books];
        
        console.log(`Loaded ${books.length} books from data source`);
        
        // Validate data and log warnings
        validateData();
        
        // Populate winner filter options
        populateWinnerFilter();
        
        // BONUS FEATURE: Populate enhanced filters
        populateEnhancedFilters();
        
        // Sort by default (award year, newest first)
        sortBooks();
        updateSortIndicators();
        displayBooks();

    } catch (error) {
        console.error('Error loading data:', error);
        showError(true);
    } finally {
        showLoading(false);
    }
}

/**
 * Display books in the table
 * PERFORMANCE OPTIMIZATION: Uses pagination for large datasets
 */
function displayBooks() {
    // Clear existing table content
    tableBody.innerHTML = '';
    
    // Update results count with pagination info
    const totalResults = filteredBooks.length;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalResults);
    const currentPageBooks = filteredBooks.slice(startIndex, endIndex);
    
    resultsCount.textContent = `Showing ${startIndex + 1}-${endIndex} of ${totalResults} books`;
    if (totalResults > ITEMS_PER_PAGE) {
        resultsCount.textContent += ` (Page ${currentPage} of ${Math.ceil(totalResults / ITEMS_PER_PAGE)})`;
    }
    
    // Add warning count display if there are warnings
    if (dataWarnings.length > 0) {
        resultsCount.textContent += ` | ⚠️ ${dataWarnings.length} data warnings (check console)`;
    }

    // Show/hide no results message
    if (filteredBooks.length === 0) {
        noResults.classList.remove('hidden');
        return;
    } else {
        noResults.classList.add('hidden');
    }
    
    // Create table rows for current page only (PERFORMANCE OPTIMIZATION)
    currentPageBooks.forEach((book, index) => {
        const row = document.createElement('tr');
        
        // Add data attribute for keyboard navigation
        row.setAttribute('data-row-index', startIndex + index);
        
        // Title
        const titleCell = document.createElement('td');
        titleCell.textContent = book.title || 'Unknown Title';
        // Handle long titles
        titleCell.style.maxWidth = '200px';
        titleCell.style.wordWrap = 'break-word';
        row.appendChild(titleCell);
        
        // Author
        const authorCell = document.createElement('td');
        authorCell.textContent = book.author || 'Unknown Author';
        row.appendChild(authorCell);
        
        // Type (extracted from award.category)
        const typeCell = document.createElement('td');
        if (book.award && book.award.category) {
            typeCell.textContent = book.award.category;
        } else {
            typeCell.textContent = book.category || book.type || 'Unknown';
        }
        row.appendChild(typeCell);
        
        // Award (format: "YYYY Winner" or "YYYY Nominee")
        const awardCell = document.createElement('td');
        if (book.award && typeof book.award === 'object') {
            const year = book.award.year || '';
            const status = book.award.is_winner ? 'Winner' : 'Nominee';
            awardCell.textContent = `${year} ${status}`;
        } else if (book.award) {
            awardCell.textContent = book.award;
        } else {
            awardCell.textContent = '—';
        }
        row.appendChild(awardCell);
        
        // Publisher
        const publisherCell = document.createElement('td');
        publisherCell.textContent = book.publisher || '—';
        row.appendChild(publisherCell);
        
        // Series (handle false/string/object formats)
        const seriesCell = document.createElement('td');
        if (book.series === false || book.series === null || book.series === undefined) {
            seriesCell.textContent = 'None';
        } else if (typeof book.series === 'string') {
            seriesCell.textContent = book.series;
        } else if (typeof book.series === 'object' && book.series.name) {
            const order = book.series.order ? ` (#${book.series.order})` : '';
            seriesCell.textContent = `${book.series.name}${order}`;
        } else {
            seriesCell.textContent = 'None';
        }
        row.appendChild(seriesCell);
        
        // Genres (comma-separated list)
        const genresCell = document.createElement('td');
        if (book.genres && Array.isArray(book.genres) && book.genres.length > 0) {
            genresCell.textContent = book.genres.join(', ');
        } else {
            genresCell.textContent = 'None';
        }
        row.appendChild(genresCell);
        
        tableBody.appendChild(row);
    });
    
    // Update row focus after rendering
    updateRowFocus();
}

/**
 * Handle sorting by column
 */
function handleSort(column) {
    // Clear multi-sort levels when doing single sort
    sortLevels = [];
    
    // If clicking same column, toggle direction
    if (currentSort.column === column) {
        currentSort.ascending = !currentSort.ascending;
    } else {
        // If clicking different column, sort ascending
        currentSort.column = column;
        currentSort.ascending = true;
    }
    
    // Sort filteredBooks array
    sortBooks();
    
    // Update sort indicators in table headers
    updateSortIndicators();
    
    // Re-display books
    displayBooks();
}

/**
 * BONUS FEATURE: Multi-column Sort (5 points)
 * Handle multi-column sorting with Shift+click
 */
function handleMultiSort(column) {
    // Find if this column is already in sort levels
    const existingIndex = sortLevels.findIndex(level => level.column === column);
    
    if (existingIndex >= 0) {
        // Column exists, toggle direction
        sortLevels[existingIndex].ascending = !sortLevels[existingIndex].ascending;
    } else {
        // Add new sort level
        sortLevels.push({ column, ascending: true });
    }
    
    // Limit to 3 sort levels for performance
    if (sortLevels.length > 3) {
        sortLevels = sortLevels.slice(-3);
    }
    
    // Update primary sort to match first sort level
    if (sortLevels.length > 0) {
        currentSort = { ...sortLevels[0] };
    }
    
    // Sort filteredBooks array
    sortBooksMultiLevel();
    
    // Update sort indicators in table headers
    updateSortIndicators();
    
    // Re-display books
    displayBooks();
}

/**
 * PERFORMANCE OPTIMIZATION: Debounced filter change handler
 * Reduces unnecessary filtering operations for better performance with large datasets
 */
function handleFilterChangeDebounced() {
    // Clear existing timer
    if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
    }
    
    // Set new timer (300ms delay)
    searchDebounceTimer = setTimeout(() => {
        handleFilterChange();
    }, 300);
}

/**
 * Handle filter changes
 */
function handleFilterChange() {
    const nameValue = nameFilter.value.toLowerCase().trim();
    const winnerValue = winnerFilter.value;
    const decadeValue = decadeFilter.value;
    const authorValue = authorFilter.value;
    
    // Reset to first page when filtering
    currentPage = 1;
    
    // Start with all books
    filteredBooks = books.filter(book => {
        // Name filter (search in title and author)
        let nameMatch = true;
        if (nameValue) {
            const title = (book.title || '').toLowerCase();
            const author = (book.author || '').toLowerCase();
            nameMatch = title.includes(nameValue) || author.includes(nameValue);
        }
        
        // Winner filter
        let winnerMatch = true;
        if (winnerValue !== 'all') {
            if (book.award && typeof book.award === 'object') {
                if (winnerValue === 'winners') {
                    winnerMatch = book.award.is_winner === true;
                } else if (winnerValue === 'nominees') {
                    winnerMatch = book.award.is_winner === false;
                }
            } else {
                // If award is not an object, assume it's a nominee
                winnerMatch = winnerValue === 'nominees';
            }
        }
        
        // BONUS FEATURE: Decade filter
        let decadeMatch = true;
        if (decadeValue !== 'all') {
            if (book.award && book.award.year) {
                const bookDecade = Math.floor(book.award.year / 10) * 10;
                decadeMatch = bookDecade.toString() === decadeValue;
            } else {
                decadeMatch = false; // No year data
            }
        }
        
        // BONUS FEATURE: Author filter
        let authorMatch = true;
        if (authorValue !== 'all') {
            authorMatch = (book.author || '') === authorValue;
        }
        
        return nameMatch && winnerMatch && decadeMatch && authorMatch;
    });
    
    // Sort the filtered results
    sortBooks();
    
    // Re-display books
    displayBooks();
}

/**
 * Clear all filters
 */
function clearAllFilters() {
    // Reset all filter inputs to default values
    nameFilter.value = '';
    winnerFilter.value = 'all';
    decadeFilter.value = 'all';
    authorFilter.value = 'all';
    
    // Reset filteredBooks to show all books
    filteredBooks = [...books];
    
    // Reset to first page
    currentPage = 1;
    
    // Sort by default
    sortBooks();
    
    // Re-display books
    displayBooks();
}

/**
 * Show/hide loading state
 */
function showLoading(show) {
    if (show) {
        loadingElement.classList.remove('hidden');
        errorElement.classList.add('hidden');
    } else {
        loadingElement.classList.add('hidden');
    }
}

/**
 * Show/hide error state
 */
function showError(show) {
    if (show) {
        errorElement.classList.remove('hidden');
        loadingElement.classList.add('hidden');
    } else {
        errorElement.classList.add('hidden');
    }
}


// Additional helper functions can be added here as needed

/**
 * Populate the winner filter dropdown with options
 */
function populateWinnerFilter() {
    // Clear existing options except "All books"
    winnerFilter.innerHTML = '<option value="all">All books</option>';
    
    // Add winner/nominee options
    const winnersOption = document.createElement('option');
    winnersOption.value = 'winners';
    winnersOption.textContent = 'Winners only';
    winnerFilter.appendChild(winnersOption);
    
    const nomineesOption = document.createElement('option');
    nomineesOption.value = 'nominees';
    nomineesOption.textContent = 'Nominees only';
    winnerFilter.appendChild(nomineesOption);
}

/**
 * BONUS FEATURE: Enhanced Filters (5 points)
 * Populate decade and author filter dropdowns with options from data
 */
function populateEnhancedFilters() {
    // Populate decade filter
    const decades = new Set();
    const authors = new Set();
    
    books.forEach(book => {
        // Extract decades from award years
        if (book.award && book.award.year) {
            const decade = Math.floor(book.award.year / 10) * 10;
            decades.add(decade);
        }
        
        // Extract unique authors
        if (book.author && book.author.trim() !== '') {
            authors.add(book.author.trim());
        }
    });
    
    // Populate decade dropdown
    decadeFilter.innerHTML = '<option value="all">All decades</option>';
    const sortedDecades = Array.from(decades).sort((a, b) => a - b);
    sortedDecades.forEach(decade => {
        const option = document.createElement('option');
        option.value = decade.toString();
        option.textContent = `${decade}s`;
        decadeFilter.appendChild(option);
    });
    
    // Populate author dropdown (limit to first 50 for performance)
    authorFilter.innerHTML = '<option value="all">All authors</option>';
    const sortedAuthors = Array.from(authors).sort().slice(0, 50);
    sortedAuthors.forEach(author => {
        const option = document.createElement('option');
        option.value = author;
        option.textContent = author.length > 30 ? author.substring(0, 30) + '...' : author;
        option.title = author; // Full name on hover
        authorFilter.appendChild(option);
    });
    
    console.log(`Populated ${sortedDecades.length} decades and ${sortedAuthors.length} authors in filter dropdowns`);
}

/**
 * Sort the filteredBooks array based on current sort settings
 * TIER 3 FEATURE: Smart Relevance Sort when filtering (5 points)
 */
function sortBooks() {
    const searchTerm = nameFilter.value.toLowerCase().trim();
    
    filteredBooks.sort((a, b) => {
        // If there's a search term, apply relevance sorting
        if (searchTerm) {
            const aRelevance = getSearchRelevance(a, searchTerm);
            const bRelevance = getSearchRelevance(b, searchTerm);
            
            // Sort by relevance first (higher relevance = lower number, so higher priority)
            if (aRelevance !== bRelevance) {
                return aRelevance - bRelevance;
            }
            
            // If same relevance, fall back to regular sorting
        }
        
        // Regular sorting logic
        let aValue = getValueForSort(a, currentSort.column);
        let bValue = getValueForSort(b, currentSort.column);
        
        // Handle null/undefined values
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;
        
        // Convert to strings for comparison if not numbers
        if (typeof aValue !== 'number' && typeof bValue !== 'number') {
            aValue = String(aValue).toLowerCase();
            bValue = String(bValue).toLowerCase();
        }
        
        let result;
        if (aValue < bValue) {
            result = -1;
        } else if (aValue > bValue) {
            result = 1;
        } else {
            result = 0;
        }
        
        // Apply ascending/descending
        return currentSort.ascending ? result : -result;
    });
}

/**
 * TIER 3 FEATURE: Smart Relevance Sort (5 points)
 * Calculate search relevance score for smart sorting
 */
function getSearchRelevance(book, searchTerm) {
    const title = (book.title || '').toLowerCase();
    const author = (book.author || '').toLowerCase();
    const publisher = (book.publisher || '').toLowerCase();
    const genres = (book.genres || []).join(' ').toLowerCase();
    
    // Exact title match (highest priority)
    if (title === searchTerm) {
        return 1;
    }
    
    // Title contains search term (second priority)
    if (title.includes(searchTerm)) {
        return 2;
    }
    
    // Author contains search term (third priority)
    if (author.includes(searchTerm)) {
        return 3;
    }
    
    // Any other field contains search term (fourth priority)
    if (publisher.includes(searchTerm) || genres.includes(searchTerm)) {
        return 4;
    }
    
    // Default (lowest priority)
    return 5;
}

/**
 * BONUS FEATURE: Multi-level sorting function
 * Sort by multiple columns with priority order
 */
function sortBooksMultiLevel() {
    const searchTerm = nameFilter.value.toLowerCase().trim();
    
    filteredBooks.sort((a, b) => {
        // If there's a search term, apply relevance sorting first
        if (searchTerm) {
            const aRelevance = getSearchRelevance(a, searchTerm);
            const bRelevance = getSearchRelevance(b, searchTerm);
            
            if (aRelevance !== bRelevance) {
                return aRelevance - bRelevance;
            }
        }
        
        // Apply each sort level in order
        for (const sortLevel of sortLevels) {
            let aValue = getValueForSort(a, sortLevel.column);
            let bValue = getValueForSort(b, sortLevel.column);
            
            // Handle null/undefined values
            if (aValue == null && bValue == null) continue;
            if (aValue == null) return 1;
            if (bValue == null) return -1;
            
            // Convert to strings for comparison if not numbers
            if (typeof aValue !== 'number' && typeof bValue !== 'number') {
                aValue = String(aValue).toLowerCase();
                bValue = String(bValue).toLowerCase();
            }
            
            let result;
            if (aValue < bValue) {
                result = -1;
            } else if (aValue > bValue) {
                result = 1;
            } else {
                continue; // Values are equal, check next sort level
            }
            
            // Apply ascending/descending and return
            return sortLevel.ascending ? result : -result;
        }
        
        // If all sort levels are equal, maintain original order
        return 0;
    });
}

/**
 * Get the sortable value for a specific column from a book object
 */
function getValueForSort(book, column) {
    switch (column) {
        case 'title':
            return book.title || '';
        case 'author':
            return book.author || '';
        case 'category':
            return book.category || book.type || '';
        case 'award':
            if (book.award && typeof book.award === 'object') {
                return book.award.year || 0;
            }
            return book.award || '';
        case 'publisher':
            return book.publisher || '';
        case 'series':
            if (book.series === false || book.series == null) return '';
            if (typeof book.series === 'string') return book.series;
            if (typeof book.series === 'object' && book.series.name) return book.series.name;
            return '';
        case 'genres':
            if (book.genres && Array.isArray(book.genres)) {
                return book.genres.join(', ');
            }
            return '';
        default:
            return book[column] || '';
    }
}

/**
 * Update sort indicators in table headers
 */
function updateSortIndicators() {
    // Clear all existing sort indicators
    const sortIndicators = document.querySelectorAll('.sort-indicator');
    sortIndicators.forEach(indicator => {
        indicator.textContent = '';
    });
    
    // Show multi-level sort indicators if they exist
    if (sortLevels.length > 0) {
        sortLevels.forEach((sortLevel, index) => {
            const header = document.querySelector(`[data-column="${sortLevel.column}"]`);
            if (header) {
                const indicator = header.querySelector('.sort-indicator');
                if (indicator) {
                    const arrow = sortLevel.ascending ? '↑' : '↓';
                    const priority = sortLevels.length > 1 ? ` ${index + 1}` : '';
                    indicator.textContent = ` ${arrow}${priority}`;
                }
            }
        });
    } else {
        // Show single sort indicator
        const currentHeader = document.querySelector(`[data-column="${currentSort.column}"]`);
        if (currentHeader) {
            const indicator = currentHeader.querySelector('.sort-indicator');
            if (indicator) {
                indicator.textContent = currentSort.ascending ? ' ↑' : ' ↓';
            }
        }
    }
}

/**
 * TIER 3 FEATURE: Data Validation (5 points)
 * Validate data and log console warnings for suspicious entries
 */
function validateData() {
    dataWarnings = []; // Reset warnings array
    const currentYear = new Date().getFullYear();
    const seenIds = new Set();
    
    books.forEach((book, index) => {
        // Check for missing required fields
        if (!book.title || book.title.trim() === '') {
            dataWarnings.push(`Book at index ${index}: Missing or empty title`);
            console.warn(`Data validation: Book at index ${index} has missing or empty title`, book);
        }
        
        if (!book.author || book.author.trim() === '') {
            dataWarnings.push(`Book at index ${index}: Missing or empty author`);
            console.warn(`Data validation: Book at index ${index} has missing or empty author`, book);
        }
        
        // Check for future publication years
        if (book.award && book.award.year && book.award.year > currentYear) {
            dataWarnings.push(`Book "${book.title}": Future award year ${book.award.year}`);
            console.warn(`Data validation: Book "${book.title}" has future award year ${book.award.year}`, book);
        }
        
        // Check for duplicate IDs
        if (book.id) {
            if (seenIds.has(book.id)) {
                dataWarnings.push(`Duplicate ID found: ${book.id}`);
                console.warn(`Data validation: Duplicate ID ${book.id} found for book "${book.title}"`, book);
            } else {
                seenIds.add(book.id);
            }
        }
        
        // Check for invalid winner status values
        if (book.award && book.award.hasOwnProperty('is_winner')) {
            if (typeof book.award.is_winner !== 'boolean') {
                dataWarnings.push(`Book "${book.title}": Invalid winner status (not boolean)`);
                console.warn(`Data validation: Book "${book.title}" has invalid winner status`, book.award.is_winner, book);
            }
        }
        
        // Check for suspicious award years (too old)
        if (book.award && book.award.year && book.award.year < 1953) { // Hugo Awards started in 1953
            dataWarnings.push(`Book "${book.title}": Award year ${book.award.year} is before Hugo Awards began (1953)`);
            console.warn(`Data validation: Book "${book.title}" has award year before Hugo Awards began`, book);
        }
        
        // Check for negative or zero series order
        if (book.series && typeof book.series === 'object' && book.series.order && book.series.order <= 0) {
            dataWarnings.push(`Book "${book.title}": Invalid series order ${book.series.order}`);
            console.warn(`Data validation: Book "${book.title}" has invalid series order`, book);
        }
    });
    
    // Log summary
    if (dataWarnings.length > 0) {
        console.warn(`Data validation complete: Found ${dataWarnings.length} potential issues`);
        console.group('Data Validation Summary');
        dataWarnings.forEach(warning => console.warn('⚠️ ' + warning));
        console.groupEnd();
    } else {
        console.log('Data validation complete: No issues found');
    }
}

/**
 * TIER 3 FEATURE: Keyboard Navigation (5 points)
 * Handle keyboard navigation for the table
 */
function handleKeyboardNavigation(event) {
    // Don't interfere if user is typing in an input field
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT') {
        return;
    }
    
    const currentPageBooks = getCurrentPageBooks();
    const maxRows = currentPageBooks.length;
    
    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault();
            if (currentFocusedRow < maxRows - 1) {
                currentFocusedRow++;
                updateRowFocus();
            }
            break;
            
        case 'ArrowUp':
            event.preventDefault();
            if (currentFocusedRow > 0) {
                currentFocusedRow--;
                updateRowFocus();
            }
            break;
            
        case 'Enter':
            event.preventDefault();
            // Sort by the first column (title) when Enter is pressed
            handleSort('title');
            break;
            
        case 'Escape':
            event.preventDefault();
            // Clear row focus
            currentFocusedRow = -1;
            updateRowFocus();
            break;
    }
}

/**
 * Update visual focus on table rows
 */
function updateRowFocus() {
    // Clear all existing focus
    const allRows = tableBody.querySelectorAll('tr');
    allRows.forEach(row => {
        row.style.backgroundColor = '';
        row.style.outline = '';
    });
    
    // Apply focus to current row
    if (currentFocusedRow >= 0 && currentFocusedRow < allRows.length) {
        const focusedRow = allRows[currentFocusedRow];
        focusedRow.style.backgroundColor = '#e3f2fd';
        focusedRow.style.outline = '2px solid #2196f3';
        focusedRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

/**
 * Get current page books array
 */
function getCurrentPageBooks() {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredBooks.length);
    return filteredBooks.slice(startIndex, endIndex);
}

/**
 * BONUS FEATURE: Export Functionality (5 points)
 * Export filtered results as CSV with proper string escaping
 */
function exportToCSV() {
    // CSV headers
    const headers = ['Title', 'Author', 'Type', 'Award', 'Publisher', 'Series', 'Genres'];
    
    // Convert filteredBooks to CSV rows
    const csvRows = filteredBooks.map(book => {
        // Title
        const title = escapeCsvField(book.title || 'Unknown Title');
        
        // Author
        const author = escapeCsvField(book.author || 'Unknown Author');
        
        // Type (extracted from award.category)
        let type = '';
        if (book.award && book.award.category) {
            type = book.award.category;
        } else {
            type = book.category || book.type || 'Unknown';
        }
        type = escapeCsvField(type);
        
        // Award (format: "YYYY Winner" or "YYYY Nominee")
        let award = '';
        if (book.award && typeof book.award === 'object') {
            const year = book.award.year || '';
            const status = book.award.is_winner ? 'Winner' : 'Nominee';
            award = `${year} ${status}`;
        } else if (book.award) {
            award = book.award;
        } else {
            award = '—';
        }
        award = escapeCsvField(award);
        
        // Publisher
        const publisher = escapeCsvField(book.publisher || '—');
        
        // Series (handle false/string/object formats)
        let series = '';
        if (book.series === false || book.series === null || book.series === undefined) {
            series = 'None';
        } else if (typeof book.series === 'string') {
            series = book.series;
        } else if (typeof book.series === 'object' && book.series.name) {
            const order = book.series.order ? ` (#${book.series.order})` : '';
            series = `${book.series.name}${order}`;
        } else {
            series = 'None';
        }
        series = escapeCsvField(series);
        
        // Genres (comma-separated list)
        let genres = '';
        if (book.genres && Array.isArray(book.genres) && book.genres.length > 0) {
            genres = book.genres.join(', ');
        } else {
            genres = 'None';
        }
        genres = escapeCsvField(genres);
        
        return [title, author, type, award, publisher, series, genres].join(',');
    });
    
    // Combine headers and rows
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `hugo-award-books-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    console.log(`Exported ${filteredBooks.length} books to CSV`);
}

/**
 * Escape CSV field content for proper formatting
 * Handles quotes, commas, and newlines
 */
function escapeCsvField(field) {
    if (field == null) return '';
    
    const fieldStr = String(field);
    
    // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n') || fieldStr.includes('\r')) {
        return `"${fieldStr.replace(/"/g, '""')}"`;
    }
    
    return fieldStr;
}

/**
 * BONUS FEATURE: Genre Grouping (5 points)
 * Toggle between table view and genre-grouped view
 */
function toggleGenreGrouping() {
    isGenreGroupingActive = !isGenreGroupingActive;
    
    if (isGenreGroupingActive) {
        // Show genre grouping, hide table
        displayBooksGroupedByGenre();
        document.getElementById('tableContainer').classList.add('hidden');
        genreGroupingContainer.classList.remove('hidden');
        toggleGroupingBtn.textContent = 'Show Table View';
    } else {
        // Show table, hide genre grouping
        displayBooks();
        genreGroupingContainer.classList.add('hidden');
        document.getElementById('tableContainer').classList.remove('hidden');
        toggleGroupingBtn.textContent = 'Group by Genre';
    }
}

/**
 * Display books grouped by their primary genre
 * With collapsible sections and book counts
 */
function displayBooksGroupedByGenre() {
    // Clear existing content
    genreGroupingContainer.innerHTML = '';
    
    // Group books by primary genre
    const genreGroups = {};
    
    filteredBooks.forEach(book => {
        let primaryGenre = 'Unknown Genre';
        if (book.genres && Array.isArray(book.genres) && book.genres.length > 0) {
            primaryGenre = book.genres[0]; // Use first genre as primary
        }
        
        if (!genreGroups[primaryGenre]) {
            genreGroups[primaryGenre] = [];
        }
        genreGroups[primaryGenre].push(book);
    });
    
    // Sort genres by book count (descending)
    const sortedGenres = Object.keys(genreGroups).sort((a, b) => 
        genreGroups[b].length - genreGroups[a].length
    );
    
    // Create genre sections
    sortedGenres.forEach(genre => {
        const books = genreGroups[genre];
        
        // Create genre section
        const genreSection = document.createElement('div');
        genreSection.className = 'genre-section';
        
        // Create genre header (collapsible)
        const genreHeader = document.createElement('div');
        genreHeader.className = 'genre-header';
        genreHeader.innerHTML = `
            <h3>
                <span class="genre-toggle">▼</span>
                ${genre} 
                <span class="genre-count">(${books.length} books)</span>
            </h3>
        `;
        genreHeader.style.cursor = 'pointer';
        genreHeader.style.padding = '10px';
        genreHeader.style.backgroundColor = '#f8f9ff';
        genreHeader.style.borderRadius = '8px';
        genreHeader.style.marginBottom = '10px';
        genreHeader.style.border = '1px solid #e9ecef';
        
        // Create books container
        const booksContainer = document.createElement('div');
        booksContainer.className = 'genre-books';
        booksContainer.style.marginLeft = '20px';
        booksContainer.style.marginBottom = '20px';
        
        // Add books to container
        books.forEach(book => {
            const bookItem = document.createElement('div');
            bookItem.className = 'genre-book-item';
            bookItem.style.padding = '8px';
            bookItem.style.marginBottom = '5px';
            bookItem.style.backgroundColor = 'white';
            bookItem.style.borderRadius = '4px';
            bookItem.style.border = '1px solid #e9ecef';
            bookItem.style.fontSize = '0.9em';
            
            // Format award info
            let awardInfo = '';
            if (book.award && typeof book.award === 'object') {
                const year = book.award.year || '';
                const status = book.award.is_winner ? 'Winner' : 'Nominee';
                awardInfo = ` (${year} ${status})`;
            }
            
            bookItem.innerHTML = `
                <strong>${book.title || 'Unknown Title'}</strong> by ${book.author || 'Unknown Author'}${awardInfo}
                <br><small style="color: #6c757d;">Publisher: ${book.publisher || '—'}</small>
            `;
            
            booksContainer.appendChild(bookItem);
        });
        
        // Add click handler for collapsing/expanding
        genreHeader.addEventListener('click', () => {
            const toggle = genreHeader.querySelector('.genre-toggle');
            if (booksContainer.style.display === 'none') {
                booksContainer.style.display = 'block';
                toggle.textContent = '▼';
            } else {
                booksContainer.style.display = 'none';
                toggle.textContent = '▶';
            }
        });
        
        genreSection.appendChild(genreHeader);
        genreSection.appendChild(booksContainer);
        genreGroupingContainer.appendChild(genreSection);
    });
    
    // Update results count for genre view
    resultsCount.textContent = `Showing ${filteredBooks.length} books grouped by ${sortedGenres.length} genres`;
    
    console.log(`Genre grouping: ${sortedGenres.length} genres, ${filteredBooks.length} total books`);
}

