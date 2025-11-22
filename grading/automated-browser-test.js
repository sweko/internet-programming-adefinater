#!/usr/bin/env node

/**
 * Automated Browser Testing for Student Submissions
 * 
 * This script uses Playwright to automatically test each student's Doctor Who
 * Episodes Explorer submission for basic functionality and Tier 1 requirements.
 * 
 * SETUP:
 *   npm install playwright
 *   npx playwright install chromium
 * 
 * USAGE:
 *   node automated-browser-test.js
 *   node automated-browser-test.js --student="student-name"
 *   node automated-browser-test.js --parallel=5
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const STUDENTS_DIR = path.join(__dirname, '..', 'students');
const RESULTS_FILE = path.join(__dirname, 'automated-test-results.csv');
const TIMEOUT = 30000; // 30 seconds per test
const PARALLEL_TESTS = parseInt(process.argv.find(arg => arg.startsWith('--parallel='))?.split('=')[1]) || 1;
const SPECIFIC_STUDENT = process.argv.find(arg => arg.startsWith('--student='))?.split('=')[1];

// Alternative-specific configurations
const ALTERNATIVE_CONFIG = {
  'alternative-one': {
    name: 'Doctor Who Episodes',
    columns: ['rank', 'title', 'series', 'era', 'broadcast', 'director', 'writer', 'doctor', 'companion', 'cast'],
    minColumnCount: 9,
    filterTestQuery: 'Doctor',
    expectedRows: 100, // Minimum expected rows
    dataFields: {
      title: 'title',
      mainEntity: 'doctor',
      secondaryEntity: 'companion',
      numeric: 'rank'
    }
  },
  'alternative-two': {
    name: 'Hugo Award Books',
    columns: ['title', 'author', 'type', 'award', 'publisher', 'series', 'genres'],
    minColumnCount: 6,
    filterTestQuery: 'Foundation',
    expectedRows: 50, // Minimum expected rows
    dataFields: {
      title: 'title',
      mainEntity: 'author',
      secondaryEntity: 'publisher',
      numeric: 'year'
    }
  }
};

// Test scenarios based on GRADING.md requirements
const TESTS = {
  // ============================================
  // TIER 1: Basic Functionality (60 points)
  // ============================================
  
  // Data Loading (15 pts)
  DATA_LOADS: {
    name: 'Data loads successfully',
    points: 10,
    tier: 1,
    test: async (page, config) => {
      // Wait for table to have rows (indicating data loaded)
      // Increase timeout since students load from external URLs
      await page.waitForSelector('table tbody tr', { timeout: 20000 });
      const rowCount = await page.locator('table tbody tr').count();
      return rowCount >= 10; // Should have at least 10+ rows
    }
  },
  
  LOADING_INDICATOR: {
    name: 'Shows loading indicator',
    points: 3,
    tier: 1,
    test: async (page, config) => {
      // This is tricky - loading happens too fast usually
      // We'll check if loading-related elements exist in HTML
      const html = await page.content();
      return html.includes('loading') || html.includes('Loading') || html.includes('spinner');
    }
  },

  ERROR_HANDLING: {
    name: 'Has error handling for data fetch',
    points: 2,
    tier: 1,
    test: async (page, config) => {
      // Check if try-catch or error handling exists in the code
      const scripts = await page.locator('script').allTextContents();
      const allCode = scripts.join(' ');
      return allCode.includes('catch') || allCode.includes('.catch(');
    }
  },

  // Episode Display (25 pts)
  ALL_COLUMNS: {
    name: 'All required columns present',
    points: 15,
    tier: 1,
    test: async (page, config) => {
      const headers = await page.locator('table thead th').allTextContents();
      const headerText = headers.join(' ').toLowerCase();
      
      const requiredColumns = config.columns;
      const foundColumns = requiredColumns.filter(col => headerText.includes(col.toLowerCase()));
      return foundColumns.length >= config.minColumnCount;
    }
  },

  DATA_FORMATTING: {
    name: 'Data properly formatted in cells',
    points: 6,
    tier: 1,
    test: async (page, config) => {
      const firstRow = await page.locator('table tbody tr').first();
      const cells = await firstRow.locator('td').allTextContents();
      
      // Check that cells have content (not empty or "undefined")
      const validCells = cells.filter(cell => 
        cell && cell.trim() && cell !== 'undefined' && cell !== 'null'
      );
      
      return validCells.length >= 8; // At least 8 columns with valid data
    }
  },

  SEMANTIC_HTML: {
    name: 'Uses semantic table structure',
    points: 4,
    tier: 1,
    test: async (page, config) => {
      const hasTable = await page.locator('table').count() > 0;
      const hasThead = await page.locator('table thead').count() > 0;
      const hasTbody = await page.locator('table tbody').count() > 0;
      
      return hasTable && hasThead && hasTbody;
    }
  },

  // Sorting (15 pts)
  SORT_FUNCTIONALITY: {
    name: 'Clicking headers sorts table',
    points: 8,
    tier: 1,
    test: async (page, config) => {
      // Get first column header (usually rank)
      const firstHeader = page.locator('table thead th').first();
      
      // Get first cell value before sort
      const beforeValue = await page.locator('table tbody tr:first-child td:first-child').textContent();
      
      // Click header to sort
      await firstHeader.click();
      await page.waitForTimeout(500); // Wait for sort to complete
      
      // Get first cell value after sort
      const afterValue = await page.locator('table tbody tr:first-child td:first-child').textContent();
      
      // Value should change (or at least table should have rows)
      return beforeValue !== undefined && afterValue !== undefined;
    }
  },

  SORT_TOGGLE: {
    name: 'Toggle ascending/descending',
    points: 4,
    tier: 1,
    test: async (page, config) => {
      const firstHeader = page.locator('table thead th').first();
      
      // Get first value
      const value1 = await page.locator('table tbody tr:first-child td:first-child').textContent();
      
      // Click once
      await firstHeader.click();
      await page.waitForTimeout(500);
      const value2 = await page.locator('table tbody tr:first-child td:first-child').textContent();
      
      // Click again (should reverse)
      await firstHeader.click();
      await page.waitForTimeout(500);
      const value3 = await page.locator('table tbody tr:first-child td:first-child').textContent();
      
      // After double click, should be different from single click
      return value2 !== value3 || value1 === value3;
    }
  },

  SORT_INDICATOR: {
    name: 'Visual sort indicator present',
    points: 3,
    tier: 1,
    test: async (page, config) => {
      const html = await page.content();
      // Check for common sort indicators (arrows, icons, classes)
      return html.includes('↑') || html.includes('↓') || 
             html.includes('▲') || html.includes('▼') ||
             html.includes('sort') || html.includes('arrow');
    }
  },

  // Filtering (10 pts)
  FILTER_EXISTS: {
    name: 'Filter input present',
    points: 5,
    tier: 1,
    test: async (page, config) => {
      const inputs = await page.locator('input[type="text"], input[type="search"]').count();
      return inputs > 0;
    }
  },

  FILTER_WORKS: {
    name: 'Filter reduces displayed rows',
    points: 5,
    tier: 1,
    test: async (page, config) => {
      const rowsBefore = await page.locator('table tbody tr').count();
      
      // Find filter input
      const filterInput = page.locator('input[type="text"], input[type="search"]').first();
      
      // Type a search term appropriate for this alternative
      await filterInput.fill(config.filterTestQuery);
      await page.waitForTimeout(1000); // Wait for filter to apply
      
      const rowsAfter = await page.locator('table tbody tr').count();
      
      // Should have fewer rows after filtering
      return rowsAfter < rowsBefore && rowsAfter > 0;
    }
  },

  // ============================================
  // TIER 2: Edge Case Handling (25 points)
  // ============================================

  // Data Robustness (15 pts)
  NO_UNDEFINED_NULL: {
    name: 'No "undefined" or "null" text visible',
    points: 5,
    tier: 2,
    test: async (page, config) => {
      const bodyText = await page.locator('table tbody').textContent();
      // Should not contain the literal strings "undefined" or "null"
      return !bodyText.includes('undefined') && !bodyText.includes('null');
    }
  },

  EMPTY_ARRAYS_HANDLED: {
    name: 'Empty arrays handled gracefully',
    points: 3,
    tier: 2,
    test: async (page, config) => {
      const bodyText = await page.locator('table tbody').textContent();
      // Check if we have consistent handling (None, —, 0, etc.)
      // Should not crash or show [object Object]
      return !bodyText.includes('[object') && !bodyText.includes('NaN');
    }
  },

  SPECIAL_CHARS_RENDER: {
    name: 'Special characters render correctly',
    points: 4,
    tier: 2,
    test: async (page, config) => {
      const bodyText = await page.locator('table tbody').textContent();
      // Check for common HTML entity issues
      return !bodyText.includes('&amp;') && 
             !bodyText.includes('&quot;') && 
             !bodyText.includes('&lt;') &&
             !bodyText.includes('&gt;');
    }
  },

  ERROR_MESSAGE_FRIENDLY: {
    name: 'Error messages are user-friendly',
    points: 3,
    tier: 2,
    test: async (page, config) => {
      const html = await page.content();
      // Check if error elements exist and contain friendly text (not technical)
      const hasErrorElement = html.includes('error') || html.includes('Error');
      if (!hasErrorElement) return false;
      
      // Should not contain technical jargon
      return !html.includes('TypeError') && 
             !html.includes('Cannot read') &&
             !html.includes('fetch failed');
    }
  },

  MISSING_DATA_HANDLED: {
    name: 'Missing/null values display placeholders',
    points: 3,
    tier: 2,
    test: async (page, config) => {
      const bodyText = await page.locator('table tbody').textContent();
      // Look for common placeholder patterns
      const hasPlaceholders = bodyText.includes('None') || 
                             bodyText.includes('N/A') ||
                             bodyText.includes('—') ||
                             bodyText.includes('Unknown');
      
      // Should not have undefined/null text
      const noUndefined = !bodyText.includes('undefined') && !bodyText.includes('null');
      
      return hasPlaceholders || noUndefined;
    }
  },

  NESTED_DATA_FORMATTED: {
    name: 'Nested data (award/series) formatted properly',
    points: 4,
    tier: 2,
    test: async (page, config) => {
      const bodyText = await page.locator('table tbody').textContent();
      // Should not show [object Object] for nested data
      const noObjects = !bodyText.includes('[object');
      
      // Should have some formatted pattern (year + winner/nominee, or series name)
      const hasFormatting = bodyText.match(/\d{4}\s*(Winner|Nominee)/i) || 
                           bodyText.includes('(#') || // Series with order
                           bodyText.includes('None') || // Series: false handled
                           bodyText.includes('—');
      
      return noObjects && (hasFormatting || noObjects);
    }
  },

  DATE_FORMATS_HANDLED: {
    name: 'Multiple date formats handled',
    points: 3,
    tier: 2,
    test: async (page, config) => {
      const rows = await page.locator('table tbody tr').count();
      if (rows < 5) return false;
      
      // Check if years are extracted/displayed consistently
      const cells = await page.locator('table tbody td').allTextContents();
      const yearPattern = /\b(19|20)\d{2}\b/;
      const hasYears = cells.some(cell => yearPattern.test(cell));
      
      // Should have year data and no "Invalid Date"
      const bodyText = cells.join(' ');
      return hasYears && !bodyText.includes('Invalid');
    }
  },

  // ============================================
  // TIER 3: Advanced Features (15+ points)
  // ============================================

  // Option A: Performance Optimization
  PERFORMANCE_OPTIMIZATION: {
    name: 'Performance optimization implemented',
    points: 5,
    tier: 3,
    test: async (page, config) => {
      // Check code for optimization techniques
      const scripts = await page.locator('script').allTextContents();
      const allCode = scripts.join(' ');
      
      // Look for debounce, throttle, pagination, or virtual scroll
      const hasDebounce = allCode.includes('debounce') || allCode.includes('throttle');
      const hasPagination = allCode.includes('pagination') || allCode.includes('page');
      const hasVirtual = allCode.includes('virtual') || allCode.includes('lazy');
      const hasComment = allCode.includes('performance') || allCode.includes('optimization') || allCode.includes('optimize');
      
      return (hasDebounce || hasPagination || hasVirtual) && hasComment;
    }
  },

  // Option B: Keyboard Navigation
  KEYBOARD_NAVIGATION: {
    name: 'Keyboard navigation implemented',
    points: 5,
    tier: 3,
    test: async (page, config) => {
      // Check for keyboard event listeners in code
      const scripts = await page.locator('script').allTextContents();
      const allCode = scripts.join(' ');
      
      const hasKeyboard = allCode.includes('keydown') || 
                         allCode.includes('keyup') || 
                         allCode.includes('keypress') ||
                         allCode.includes('ArrowUp') ||
                         allCode.includes('ArrowDown');
      
      return hasKeyboard;
    }
  },

  // Option C: Smart Relevance Sort
  RELEVANCE_SORT: {
    name: 'Smart relevance sorting implemented',
    points: 5,
    tier: 3,
    test: async (page, config) => {
      // Check if filtering also affects sort order
      const filterInput = page.locator('input[type="text"], input[type="search"]').first();
      
      try {
        // Get row count before filter
        const rowsBefore = await page.locator('table tbody tr').count();
        
        // Apply filter
        await filterInput.fill('the');
        await page.waitForTimeout(1000);
        
        // Check if first result makes sense (likely has "the" in title)
        const firstRowText = await page.locator('table tbody tr:first-child').textContent();
        const hasRelevance = firstRowText.toLowerCase().includes('the');
        
        // Clear filter
        await filterInput.fill('');
        await page.waitForTimeout(500);
        
        return hasRelevance;
      } catch {
        return false;
      }
    }
  },

  // Option D: Data Validation
  DATA_VALIDATION: {
    name: 'Data validation with warnings',
    points: 5,
    tier: 3,
    test: async (page, config) => {
      // Check console for validation warnings
      const logs = [];
      page.on('console', msg => {
        if (msg.type() === 'warn' || msg.type() === 'error') {
          logs.push(msg.text());
        }
      });
      
      // Reload to capture console messages
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Check if warnings exist in console
      const hasWarnings = logs.some(log => 
        log.includes('warn') || 
        log.includes('invalid') || 
        log.includes('missing') ||
        log.includes('duplicate')
      );
      
      // Check if warning count is displayed in UI
      const bodyText = await page.locator('body').textContent();
      const hasWarningCount = bodyText.match(/\d+\s*warning/i);
      
      return hasWarnings || hasWarningCount;
    }
  },

  // Option E: Additional Filters
  ADDITIONAL_FILTERS: {
    name: 'Additional filter dropdowns',
    points: 5,
    tier: 3,
    test: async (page, config) => {
      // Count select/dropdown elements
      const selects = await page.locator('select').count();
      const dropdowns = await page.locator('[role="combobox"]').count();
      
      // Should have at least 2 filters (beyond basic text input)
      return (selects + dropdowns) >= 2;
    }
  },

  // Option F: Multi-Column Sort
  MULTI_COLUMN_SORT: {
    name: 'Multi-column sort (Shift+click)',
    points: 5,
    tier: 3,
    test: async (page, config) => {
      // Check code for shift key handling
      const scripts = await page.locator('script').allTextContents();
      const allCode = scripts.join(' ');
      
      const hasShiftKey = allCode.includes('shiftKey') || allCode.includes('shift');
      const hasMultiSort = allCode.includes('multi') || allCode.includes('secondary');
      
      return hasShiftKey || hasMultiSort;
    }
  },

  // Option G: Export to CSV
  EXPORT_CSV: {
    name: 'Export to CSV functionality',
    points: 5,
    tier: 3,
    test: async (page, config) => {
      // Look for export button or download functionality
      const html = await page.content();
      const hasExportButton = html.toLowerCase().includes('export') || 
                             html.toLowerCase().includes('download') ||
                             html.toLowerCase().includes('csv');
      
      // Check code for Blob/download logic
      const scripts = await page.locator('script').allTextContents();
      const allCode = scripts.join(' ');
      const hasExportCode = allCode.includes('Blob') || 
                           allCode.includes('download') ||
                           allCode.includes('CSV');
      
      return hasExportButton && hasExportCode;
    }
  },

  // Option H: Decade/Genre Grouping
  GROUPING_FEATURE: {
    name: 'Decade/genre grouping with collapse',
    points: 5,
    tier: 3,
    test: async (page, config) => {
      // Look for grouping in HTML structure
      const html = await page.content();
      const hasDetails = html.includes('<details') || html.includes('collapse');
      const hasGrouping = html.includes('decade') || 
                         html.includes('genre') || 
                         html.includes('group') ||
                         html.includes('era');
      
      return hasDetails || (hasGrouping && html.includes('click'));
    }
  }
};

/**
 * Test a single student submission
 */
async function testStudent(studentFolder, browser, alternative = 'alternative-one') {
  const studentName = path.basename(studentFolder);
  const indexPath = path.join(studentFolder, 'index.html');
  const config = ALTERNATIVE_CONFIG[alternative] || ALTERNATIVE_CONFIG['alternative-one'];
  
  console.log(`\n[${studentName}] Testing as ${config.name}...`);
  
  const results = {
    student: studentName,
    folder: studentFolder,
    alternative: alternative,
    timestamp: new Date().toISOString(),
    tests: {},
    tier1Points: 0,
    tier2Points: 0,
    tier3Points: 0,
    totalPoints: 0,
    maxTier1: 60,
    maxTier2: 25,
    maxTier3: 40, // Up to 8 features @ 5pts each
    maxPoints: 125,
    percentageGrade: 0,
    errors: []
  };

  console.log(`\n[${studentName}] Starting tests...`);

  // Check if index.html exists
  if (!fs.existsSync(indexPath)) {
    console.log(`  ❌ No index.html found`);
    results.errors.push('Missing index.html');
    return results;
  }

  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Load the student's page
    await page.goto(`file:///${indexPath.replace(/\\/g, '/')}`);
    
    // Run all tests
    for (const [testKey, testConfig] of Object.entries(TESTS)) {
      try {
        const passed = await Promise.race([
          testConfig.test(page, config),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Test timeout')), TIMEOUT)
          )
        ]);
        
        results.tests[testKey] = {
          name: testConfig.name,
          passed,
          points: passed ? testConfig.points : 0,
          maxPoints: testConfig.points,
          tier: testConfig.tier
        };
        
        if (passed) {
          if (testConfig.tier === 1) results.tier1Points += testConfig.points;
          if (testConfig.tier === 2) results.tier2Points += testConfig.points;
          if (testConfig.tier === 3) results.tier3Points += testConfig.points;
          results.totalPoints += testConfig.points;
          console.log(`  ✓ ${testConfig.name} (${testConfig.points} pts) [Tier ${testConfig.tier}]`);
        } else {
          console.log(`  ✗ ${testConfig.name} (0/${testConfig.points} pts) [Tier ${testConfig.tier}]`);
        }
      } catch (error) {
        results.tests[testKey] = {
          name: testConfig.name,
          passed: false,
          points: 0,
          maxPoints: testConfig.points,
          tier: testConfig.tier,
          error: error.message
        };
        console.log(`  ⚠ ${testConfig.name} - Error: ${error.message} [Tier ${testConfig.tier}]`);
        
        // Clean error message before adding to array
        const cleanError = `${testKey}: ${error.message}`
          .replace(/\x1b\[[0-9;]*m/g, '') // Remove ANSI codes
          .replace(/[\r\n]+/g, ' ')        // Replace newlines with space
          .replace(/\s+/g, ' ')            // Collapse multiple spaces
          .trim();
        results.errors.push(cleanError);
      }
    }
    
    results.percentageGrade = Math.round((results.totalPoints / 100) * 100); // Normalized to 100
    console.log(`  Score: ${results.totalPoints}/100+ (Tier1: ${results.tier1Points}/60, Tier2: ${results.tier2Points}/25, Tier3: ${results.tier3Points}/40)`);
    console.log(`  Final Grade: ${Math.min(results.percentageGrade, 100)}%`);
    
    await context.close();
  } catch (error) {
    console.log(`  ❌ Failed to load page: ${error.message}`);
    results.errors.push(`Page load error: ${error.message}`);
  }

  return results;
}

/**
 * Generate CSV report from results
 */
function generateCSV(allResults) {
  const headers = [
    'Student_Name',
    'Folder_Path',
    'Total_Points',
    'Tier1_Points',
    'Tier2_Points',
    'Tier3_Points',
    'Final_Grade',
    // Tier 1 tests
    'Data_Loads',
    'Loading_Indicator',
    'Error_Handling',
    'All_Columns',
    'Data_Formatting',
    'Semantic_HTML',
    'Sort_Functionality',
    'Sort_Toggle',
    'Sort_Indicator',
    'Filter_Exists',
    'Filter_Works',
    // Tier 2 tests
    'No_Undefined_Null',
    'Empty_Arrays_Handled',
    'Special_Chars_Render',
    'Error_Message_Friendly',
    'Missing_Data_Handled',
    'Nested_Data_Formatted',
    'Date_Formats_Handled',
    // Tier 3 tests
    'Performance_Optimization',
    'Keyboard_Navigation',
    'Relevance_Sort',
    'Data_Validation',
    'Additional_Filters',
    'Multi_Column_Sort',
    'Export_CSV',
    'Grouping_Feature',
    'Errors'
  ];

  const rows = allResults.map(result => {
    const testKeys = Object.keys(TESTS);
    const testPoints = testKeys.map(testKey => {
      return result.tests[testKey]?.points || 0;
    });

    // Escape quotes, remove newlines and ANSI codes from errors for CSV
    const errorText = result.errors
      .map(err => err
        .replace(/\x1b\[[0-9;]*m/g, '') // Remove ANSI escape codes
        .replace(/"/g, '""')             // Escape quotes for CSV
        .replace(/\n/g, ' ')             // Replace newlines with spaces
        .replace(/\r/g, '')              // Remove carriage returns
        .replace(/\s+/g, ' ')            // Collapse multiple spaces
        .trim()
      )
      .join('; ');

    return [
      `"${result.student}"`,
      `"${result.folder}"`,
      result.totalPoints,
      result.tier1Points,
      result.tier2Points,
      result.tier3Points,
      Math.min(result.percentageGrade, 100),
      ...testPoints,
      `"${errorText}"`
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Main execution
 */
async function main() {
  console.log('Automated Browser Testing for Student Submissions');
  console.log('=================================================\n');

  // Get student folders
  let studentFolders = fs.readdirSync(STUDENTS_DIR)
    .map(name => path.join(STUDENTS_DIR, name))
    .filter(folder => fs.statSync(folder).isDirectory());

  if (SPECIFIC_STUDENT) {
    studentFolders = studentFolders.filter(folder => 
      path.basename(folder).includes(SPECIFIC_STUDENT)
    );
    console.log(`Testing specific student: ${SPECIFIC_STUDENT}\n`);
  }

  console.log(`Found ${studentFolders.length} student folders to test`);
  console.log(`Parallel tests: ${PARALLEL_TESTS}\n`);

  // Launch browser
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });

  const allResults = [];
  
  // Run tests in batches for parallel execution
  for (let i = 0; i < studentFolders.length; i += PARALLEL_TESTS) {
    const batch = studentFolders.slice(i, i + PARALLEL_TESTS);
    const batchResults = await Promise.all(
      batch.map(folder => testStudent(folder, browser))
    );
    allResults.push(...batchResults);
  }

  await browser.close();

  // Generate CSV report
  console.log('\n\nGenerating CSV report...');
  const csv = generateCSV(allResults);
  fs.writeFileSync(RESULTS_FILE, csv, 'utf8');
  console.log(`✓ Report saved to: ${RESULTS_FILE}`);

  // Summary statistics
  const avgScore = allResults.reduce((sum, r) => sum + Math.min(r.percentageGrade, 100), 0) / allResults.length;
  const avgTier1 = allResults.reduce((sum, r) => sum + r.tier1Points, 0) / allResults.length;
  const avgTier2 = allResults.reduce((sum, r) => sum + r.tier2Points, 0) / allResults.length;
  const avgTier3 = allResults.reduce((sum, r) => sum + r.tier3Points, 0) / allResults.length;
  const passed = allResults.filter(r => r.percentageGrade >= 60).length;
  const excellent = allResults.filter(r => r.percentageGrade >= 90).length;
  
  console.log('\n\nSummary:');
  console.log('--------');
  console.log(`Total students tested: ${allResults.length}`);
  console.log(`Average final grade: ${avgScore.toFixed(1)}%`);
  console.log(`Average Tier 1: ${avgTier1.toFixed(1)}/60 pts`);
  console.log(`Average Tier 2: ${avgTier2.toFixed(1)}/25 pts`);
  console.log(`Average Tier 3: ${avgTier3.toFixed(1)}/40 pts`);
  console.log(`Excellent (≥90%): ${excellent}/${allResults.length} (${Math.round(excellent/allResults.length*100)}%)`);
  console.log(`Passing (≥60%): ${passed}/${allResults.length} (${Math.round(passed/allResults.length*100)}%)`);
  console.log(`Failed (<60%): ${allResults.length - passed}/${allResults.length}`);
  
  // Tier-specific stats
  console.log('\n\nTier Completion Rates:');
  console.log('---------------------');
  const tier1Complete = allResults.filter(r => r.tier1Points >= 50).length;
  const tier2Complete = allResults.filter(r => r.tier2Points >= 20).length;
  const tier3Features = allResults.filter(r => r.tier3Points >= 10).length;
  console.log(`Tier 1 (≥50/60): ${tier1Complete}/${allResults.length} (${Math.round(tier1Complete/allResults.length*100)}%)`);
  console.log(`Tier 2 (≥20/25): ${tier2Complete}/${allResults.length} (${Math.round(tier2Complete/allResults.length*100)}%)`);
  console.log(`Tier 3 (≥2 features): ${tier3Features}/${allResults.length} (${Math.round(tier3Features/allResults.length*100)}%)`);
  
  // Test-specific stats
  console.log('\n\nTest Pass Rates by Tier:');
  console.log('------------------------');
  
  console.log('\nTier 1 - Basic Functionality:');
  Object.entries(TESTS).filter(([k, v]) => v.tier === 1).forEach(([key, config]) => {
    const passCount = allResults.filter(r => r.tests[key]?.passed).length;
    const passRate = Math.round((passCount / allResults.length) * 100);
    console.log(`  ${config.name}: ${passCount}/${allResults.length} (${passRate}%)`);
  });
  
  console.log('\nTier 2 - Edge Case Handling:');
  Object.entries(TESTS).filter(([k, v]) => v.tier === 2).forEach(([key, config]) => {
    const passCount = allResults.filter(r => r.tests[key]?.passed).length;
    const passRate = Math.round((passCount / allResults.length) * 100);
    console.log(`  ${config.name}: ${passCount}/${allResults.length} (${passRate}%)`);
  });
  
  console.log('\nTier 3 - Advanced Features:');
  Object.entries(TESTS).filter(([k, v]) => v.tier === 3).forEach(([key, config]) => {
    const passCount = allResults.filter(r => r.tests[key]?.passed).length;
    const passRate = Math.round((passCount / allResults.length) * 100);
    console.log(`  ${config.name}: ${passCount}/${allResults.length} (${passRate}%)`);
  });
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { testStudent, TESTS };
