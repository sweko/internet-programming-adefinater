/**
 * Data Source Analyzer
 * 
 * Analyzes student code to detect:
 * - Local file usage (JSON loaded locally) → -10 pts
 * - Multiple HTTP sources (bonus feature) → +5 pts
 * - Single HTTP source (expected) → 0 pts
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

const STUDENTS_DIR = path.join(__dirname, 'temp-pr-tests');
const INPUT_CSV = path.join(__dirname, 'pr-test-results.csv');
const OUTPUT_CSV = path.join(__dirname, 'pr-test-results-with-datasource.csv');

// Patterns to detect
const PATTERNS = {
  // Local file references (relative paths, not starting with http)
  localFile: [
    /fetch\s*\(\s*['"`](doctor-who-episodes.*\.json)['"`]\s*\)/gi,
    /fetch\s*\(\s*['"`](hugo-books.*\.json)['"`]\s*\)/gi,
    /fetch\s*\(\s*['"`](?!https?:\/\/)([^'"`]+\.json)['"`]\s*\)/gi, // Any .json not starting with http
    /<script\s+src\s*=\s*['"`].*\.json['"`]/gi,
    /import\s+.*from\s+['"`].*\.json['"`]/gi,
  ],
  
  // Any URL in the code (will be in variable declarations or fetch calls)
  anyUrl: [
    /['"`](https?:\/\/[^'"`\s]+)['"`]/gi,
  ]
};

/**
 * Analyze a student's code files for data source usage
 */
function analyzeDataSource(prNumber) {
  const studentDir = path.join(STUDENTS_DIR, `pr-${prNumber}`);
  
  if (!fs.existsSync(studentDir)) {
    return {
      hasLocalFile: false,
      httpSources: [],
      deduction: 0,
      bonus: 0,
      note: 'Student folder not found'
    };
  }

  let hasLocalFile = false;
  let httpSources = new Set();
  let localFileMatches = [];

  // Files to analyze
  const filesToCheck = ['index.html', 'script.js', 'main.js', 'app.js'];
  
  for (const filename of filesToCheck) {
    const filepath = path.join(studentDir, filename);
    
    if (!fs.existsSync(filepath)) {
      continue;
    }

    const content = fs.readFileSync(filepath, 'utf8');

    // Check for local file usage
    for (const pattern of PATTERNS.localFile) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const url = match[1];
        // Make sure it's not an HTTP URL (false positive)
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          hasLocalFile = true;
          localFileMatches.push({
            file: filename,
            match: match[0].substring(0, 100) // Truncate for display
          });
        }
      }
    }

    // Check for any HTTP/HTTPS URLs in the file
    for (const pattern of PATTERNS.anyUrl) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const url = match[1];
        // Only count JSON endpoints
        if (url.includes('.json') || url.includes('api') || url.includes('data')) {
          httpSources.add(url);
        }
      }
    }
  }

  // Calculate deduction/bonus
  let deduction = 0;
  let bonus = 0;
  let note = '';

  if (hasLocalFile) {
    deduction = -10;
    note = `Local file usage detected: ${localFileMatches.map(m => m.file).join(', ')}`;
  } else if (httpSources.size > 1) {
    bonus = 5;
    note = `Multiple HTTP sources (${httpSources.size} sources) - BONUS!`;
  } else if (httpSources.size === 1) {
    note = 'Single HTTP source (expected)';
  } else {
    note = 'No data source detected in code (may be dynamic or missing)';
  }

  return {
    hasLocalFile,
    httpSourceCount: httpSources.size,
    httpSources: Array.from(httpSources),
    deduction,
    bonus,
    note
  };
}

/**
 * Main execution
 */
async function main() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  📊 DATA SOURCE ANALYZER');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Read existing test results
  const students = [];
  
  await new Promise((resolve, reject) => {
    fs.createReadStream(INPUT_CSV)
      .pipe(csv())
      .on('data', (row) => students.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`Loaded ${students.length} students from ${path.basename(INPUT_CSV)}\n`);

  // Analyze each student
  const results = [];
  let localFileCount = 0;
  let multiSourceCount = 0;
  let singleSourceCount = 0;
  let unknownCount = 0;

  for (const student of students) {
    const prNumber = parseInt(student.PR_Number);
    const analysis = analyzeDataSource(prNumber);

    // Update counts
    if (analysis.hasLocalFile) {
      localFileCount++;
      console.log(`[PR #${prNumber}] ❌ LOCAL FILE (-10 pts): ${student.Student_Name}`);
    } else if (analysis.bonus > 0) {
      multiSourceCount++;
      console.log(`[PR #${prNumber}] ✨ MULTIPLE HTTP (+5 pts): ${student.Student_Name}`);
    } else if (analysis.httpSourceCount === 1) {
      singleSourceCount++;
      console.log(`[PR #${prNumber}] ✓ Single HTTP (0 pts): ${student.Student_Name}`);
    } else {
      unknownCount++;
      console.log(`[PR #${prNumber}] ⚠ Unknown source (0 pts): ${student.Student_Name}`);
    }

    // Add data source columns to existing student data
    results.push({
      ...student,
      DataSource_Type: analysis.hasLocalFile ? 'LOCAL_FILE' : 
                       analysis.httpSourceCount > 1 ? 'MULTI_HTTP' :
                       analysis.httpSourceCount === 1 ? 'SINGLE_HTTP' : 'UNKNOWN',
      DataSource_Count: analysis.httpSourceCount,
      DataSource_Deduction: analysis.deduction,
      DataSource_Bonus: analysis.bonus,
      DataSource_Note: analysis.note
    });
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(`  Local file usage:      ${localFileCount} students (-10 pts each)`);
  console.log(`  Multiple HTTP sources: ${multiSourceCount} students (+5 pts each)`);
  console.log(`  Single HTTP source:    ${singleSourceCount} students (0 pts)`);
  console.log(`  Unknown/No source:     ${unknownCount} students (0 pts)`);
  console.log('');

  // Write updated CSV
  const csvWriter = createObjectCsvWriter({
    path: OUTPUT_CSV,
    header: [
      ...Object.keys(students[0]).map(key => ({ id: key, title: key })),
      { id: 'DataSource_Type', title: 'DataSource_Type' },
      { id: 'DataSource_Count', title: 'DataSource_Count' },
      { id: 'DataSource_Deduction', title: 'DataSource_Deduction' },
      { id: 'DataSource_Bonus', title: 'DataSource_Bonus' },
      { id: 'DataSource_Note', title: 'DataSource_Note' }
    ]
  });

  await csvWriter.writeRecords(results);

  console.log(`✓ Updated results written to: ${path.basename(OUTPUT_CSV)}\n`);
  console.log('New columns added:');
  console.log('  - DataSource_Type: LOCAL_FILE | MULTI_HTTP | SINGLE_HTTP | UNKNOWN');
  console.log('  - DataSource_Count: Number of HTTP sources detected');
  console.log('  - DataSource_Deduction: -10 for local file, 0 otherwise');
  console.log('  - DataSource_Bonus: +5 for multiple HTTP sources, 0 otherwise');
  console.log('  - DataSource_Note: Explanation of detection');
  console.log('\n═══════════════════════════════════════════════════════════════\n');
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
