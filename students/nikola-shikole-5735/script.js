// Configuration and constants
const DATA_URL = '../hugo-books-exam.json'; // Path to the exam data file
let books = [];
let filteredBooks = [];
let currentSort = { column: 'year', ascending: false }; // Default sort by year, newest first

// DOM elements (will be populated when DOM loads)
let loadingElement, errorElement, tableBody, resultsCount, noResults;
let nameFilter, winnerFilter, clearFiltersBtn;

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
    // TODO: Get references to all necessary DOM elements
    loadingElement = document.getElementById('loading');
    errorElement = document.getElementById('error');
    tableBody = document.getElementById('booksTableBody');
    resultsCount = document.getElementById('resultsCount');
    noResults = document.getElementById('noResults');
    
    nameFilter = document.getElementById('nameFilter');
    winnerFilter = document.getElementById('winnerFilter');
    clearFiltersBtn = document.getElementById('clearFilters');
}

/**
 * Set up event listeners for user interactions
 */
function setupEventListeners() {
  // 🔍 Filter input (live search)
  nameFilter.addEventListener("input", handleFilterChange);

  // 🏆 Winner dropdown (we’ll fill options next)
  winnerFilter.innerHTML = `
    <option value="all">All books</option>
    <option value="winners">Winners only</option>
    <option value="nominees">Nominees only</option>
  `;
  winnerFilter.addEventListener("change", handleFilterChange);

  // ❌ Clear filters button
  clearFiltersBtn.addEventListener("click", clearAllFilters);

  // ↕ Sorting on column headers
  document.querySelectorAll(".sortable").forEach((header) => {
    header.addEventListener("click", () => handleSort(header.dataset.column));
  });

    // TODO: Add event listeners for:
    // - Filter inputs (text input, dropdowns)
    // - Sort buttons (table headers)
    // - Clear filters button

    // TODO: Add sort listeners to table headers
}

/**
 * Load book data from JSON file
 */
async function loadData() {
  const urlsBonus = [
    "https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/hugo_books.json",
    "https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/hugo_edges.json",
    "https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/hugo_novellas.json",
  ];

  const urlSingle =
    "https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/hugo-books-full.json";

  try {
    showLoading(true);
    let data = [];

    // Try BONUS multi-source first
    try {
      const responses = await Promise.all(urlsBonus.map((u) => fetch(u)));
      const allOk = responses.every((res) => res.ok);
      if (!allOk) throw new Error("One of the bonus URLs failed");
      const arrays = await Promise.all(responses.map((res) => res.json()));
      data = arrays.flat(); // merge all arrays
      console.log("✅ Loaded from BONUS multi-source (Tier 1 +5 pts)");
    } catch {
      // Fallback to single source
      const res = await fetch(urlSingle);
      if (!res.ok) throw new Error("Single source failed");
      data = await res.json();
      console.log("✅ Loaded from single-source JSON");
    }

    // ✅ Handle multi-source merged structure
    if (Array.isArray(data)) {
      // Each element may contain a "books" array
      books = data.flatMap(entry => entry.books || []);
    } else {
      // Single-source fallback
      books = data.books || [];
    }

    filteredBooks = [...books];
    displayBooks();
  } catch (error) {
    console.error("Error loading data:", error);
    showError(true);
  } finally {
    showLoading(false);
  }
}

/**
 * Display books in the table
 */
function displayBooks() {
    // TODO: Render the filtered and sorted books in the table
    // TODO: Update results count
    // TODO: Show/hide no results message
    
    // Clear existing table content
    tableBody.innerHTML = '';
    
    // DONE: Update results count
  resultsCount.textContent = `Showing ${filteredBooks.length} of ${books.length} books`;

    // Show/hide no results message
    if (filteredBooks.length === 0) {
        noResults.classList.remove('hidden');
        return;
    } else {
        noResults.classList.add('hidden');
    }
    
    // TODO: Create table rows for each book
    // For each book in filteredBooks:
    // - Create a table row
    // - Add cells for each column (title, author, type, award, publisher, series, genres)
    // - Handle edge cases (series: false/string/object, empty genres, special characters)
    // - Append row to tableBody

    filteredBooks.forEach((book) => {
    const tr = document.createElement("tr");

    const awardText = book.award
      ? `${book.award.year} ${book.award.is_winner ? "Winner" : "Nominee"}`
      : "—";

    const seriesText =
      book.series === false
        ? "None"
        : typeof book.series === "string"
        ? book.series
        : book.series && typeof book.series === "object"
        ? `${book.series.name} (#${book.series.order})`
        : "—";

    const genresText =
      Array.isArray(book.genres) && book.genres.length > 0
        ? book.genres.join(", ")
        : "None";

    tr.innerHTML = `
      <td>${book.title}</td>
      <td>${book.author}</td>
      <td>${book.award?.category || "—"}</td>
      <td>${awardText}</td>
      <td>${book.publisher || "—"}</td>
      <td>${seriesText}</td>
      <td>${genresText}</td>
    `;

    tableBody.appendChild(tr);
  });
}

/**
 * Handle sorting by column
 */
function handleSort(column) {
    // TODO: Implement sorting logic
    // - If clicking same column, toggle direction
    // - If clicking different column, sort ascending
    // - Update currentSort object
    // - Sort filteredBooks array
    // - Update sort indicators in table headers
    // - Re-display books
    
  if (currentSort.column === column) {
    currentSort.ascending = !currentSort.ascending;
  } else {
    currentSort.column = column;
    currentSort.ascending = true;
  }

  filteredBooks.sort((a, b) => {
    let valA = getValue(a, column);
    let valB = getValue(b, column);

    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();

    if (valA < valB) return currentSort.ascending ? -1 : 1;
    if (valA > valB) return currentSort.ascending ? 1 : -1;
    return 0;
  });

  updateSortIndicators();
  displayBooks();
}

function getValue(book, column) {
  switch (column) {
    case "title": return book.title;
    case "author": return book.author;
    case "category": return book.award?.category || "";
    case "award": return book.award?.year || 0;
    case "publisher": return book.publisher || "";
    case "series":
      return typeof book.series === "object" ? book.series.name : book.series || "";
    case "genres":
      return (book.genres && book.genres.join(", ")) || "";
    default: return "";
  }
}

function updateSortIndicators() {
  document.querySelectorAll(".sortable").forEach((header) => {
    header.classList.remove("sort-asc", "sort-desc");
    if (header.dataset.column === currentSort.column) {
      header.classList.add(currentSort.ascending ? "sort-asc" : "sort-desc");
    }
  });
}

/**
 * Handle filter changes
 */
function handleFilterChange() {
    // TODO: Implement filtering logic
    // - Get current filter values
    // - Filter books array based on criteria
    // - Update filteredBooks array
    // - Re-display books
  const searchTerm = nameFilter.value.toLowerCase();
  const winnerStatus = winnerFilter.value;

  filteredBooks = books.filter((book) => {
    const title = book.title ? book.title.toLowerCase() : "";
    const author = book.author ? book.author.toLowerCase() : "";

    const matchesSearch =
      title.includes(searchTerm) || author.includes(searchTerm);

    let matchesWinner = true;
    if (winnerStatus === "winners") matchesWinner = book.award?.is_winner;
    else if (winnerStatus === "nominees")
      matchesWinner = !book.award?.is_winner;

    return matchesSearch && matchesWinner;
  });

  displayBooks();
    
    console.log('Filters changed');
}

/**
 * Clear all filters
 */
function clearAllFilters() {
    nameFilter.value = "";
    winnerFilter.value = "all";
    filteredBooks = [...books];
    displayBooks();
    // TODO: Reset all filter inputs to default values
    // TODO: Reset filteredBooks to show all books
    // TODO: Re-display books
    
    console.log('Clear filters');
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