# Automated Browser Testing Guide

## Overview

This automated testing system uses **Playwright** to test all 64 student submissions for basic functionality and Tier 1 requirements from the grading rubric.

## ⚠️ IMPORTANT: Two Testing Methods

### Method 1: Test PRs Directly (RECOMMENDED)

**Use:** `test-prs-directly.js`

Tests student submissions by **fetching files directly from GitHub PRs**. This is the correct approach since:
- Student work is in their PRs, not the starter templates in `students/` folder
- No need to check out 64 PRs locally
- Always tests the latest PR version

**Setup:**
```powershell
# Set GitHub token (optional but recommended to avoid rate limits)
$env:GITHUB_TOKEN="your_github_personal_access_token"

# Install dependencies
cd grading
npm install
npx playwright install chromium
```

**Usage:**
```powershell
# Test all PRs
node test-prs-directly.js --parallel=5

# Test specific PR
node test-prs-directly.js --pr=64
```

### Method 2: Test Local Folders (For Checked-Out Code)

**Use:** `automated-browser-test.js`

Only use this if you've already checked out all PRs into separate folders. Since you haven't done this, use **Method 1** instead.

## What Gets Tested

### Tier 1 Requirements (60 points automated)

**Data Loading (15 pts):**
- ✓ Data loads successfully from JSON (10 pts)
- ✓ Shows loading indicator (3 pts)
- ✓ Has error handling for data fetch (2 pts)

**Episode Display (25 pts):**
- ✓ All required columns present (15 pts)
- ✓ Data properly formatted in cells (6 pts)
- ✓ Uses semantic table structure (4 pts)

**Sorting (15 pts):**
- ✓ Clicking headers sorts table (8 pts)
- ✓ Toggle ascending/descending (4 pts)
- ✓ Visual sort indicator present (3 pts)

**Filtering (10 pts):**
- ✓ Filter input present (5 pts)
- ✓ Filter reduces displayed rows (5 pts)

### What's NOT Automated

These require manual review:
- **Tier 2** - Edge case handling (null companions, multiple writers, date formats, special characters)
- **Tier 3** - Advanced features (performance optimization, keyboard navigation, smart sorting, data validation)
- **Bonus** - Multi-column sort, filters, CSV export, decade grouping
- **Code quality** - Already handled by `analyze-code.js`

## Setup

### 1. Install Dependencies

```powershell
cd grading
npm install
```

### 2. Install Browser

```powershell
npx playwright install chromium
```

This downloads Chromium (~150MB) for automated testing.

## Usage

### Test All Students

```powershell
node automated-browser-test.js
```

**Output:**
- Tests all 64+ student folders in `../students/`
- Creates `automated-test-results.csv` with detailed results
- Shows real-time progress in terminal
- Takes ~5-10 minutes for all students

### Test Specific Student

```powershell
node automated-browser-test.js --student="5903-aljban-ramuka"
```

Useful for debugging individual submissions.

### Parallel Testing (Faster)

```powershell
node automated-browser-test.js --parallel=5
```

Tests 5 students simultaneously. Reduces total time to ~2-3 minutes.

**⚠️ Warning:** Higher parallelism uses more RAM. Start with 5, increase if your system can handle it.

## Output

### automated-test-results.csv

Generated CSV with these columns:

| Column | Description |
|--------|-------------|
| `Student_Name` | Folder name (e.g., "5903-aljban-ramuka") |
| `Folder_Path` | Full path to student folder |
| `Total_Points` | Points earned (0-60) |
| `Max_Points` | Always 60 for automated tests |
| `Percentage` | Score as percentage |
| `Data_Loads` | Points for data loading (0-10) |
| `Loading_Indicator` | Points for loading UI (0-3) |
| `Error_Handling` | Points for error handling (0-2) |
| `All_Columns` | Points for table columns (0-15) |
| `Data_Formatting` | Points for data formatting (0-6) |
| `Semantic_HTML` | Points for table structure (0-4) |
| `Sort_Functionality` | Points for sorting (0-8) |
| `Sort_Toggle` | Points for sort toggle (0-4) |
| `Sort_Indicator` | Points for sort UI (0-3) |
| `Filter_Exists` | Points for filter input (0-5) |
| `Filter_Works` | Points for filter functionality (0-5) |
| `Errors` | Any errors encountered during testing |

### Terminal Output

Real-time feedback while testing:

```
[5903-aljban-ramuka] Starting tests...
  ✓ Data loads successfully (10 pts)
  ✓ Shows loading indicator (3 pts)
  ✓ Has error handling for data fetch (2 pts)
  ✓ All required columns present (15 pts)
  ✓ Data properly formatted in cells (6 pts)
  ✓ Uses semantic table structure (4 pts)
  ✓ Clicking headers sorts table (8 pts)
  ✓ Toggle ascending/descending (4 pts)
  ✓ Visual sort indicator present (3 pts)
  ✓ Filter input present (5 pts)
  ✓ Filter reduces displayed rows (5 pts)
  Score: 60/60 (100%)
```

## Integration with Grading Workflow

### Step 1: Run Automated Tests

```powershell
node automated-browser-test.js --parallel=5
```

This generates `automated-test-results.csv`.

### Step 2: Merge with Master Grades

Create a PowerShell script to merge results:

```powershell
# merge-test-results.ps1
$masterGrades = Import-Csv master-grades.csv
$testResults = Import-Csv automated-test-results.csv

foreach ($student in $masterGrades) {
    $testResult = $testResults | Where-Object { $_.Student_Name -eq $student.GitHub_Username }
    
    if ($testResult) {
        # Update Tier1_Score with automated results
        $student.Tier1_Score = [int]$testResult.Total_Points
        
        # Add note about automated testing
        $student.Notes = "Automated: $($testResult.Percentage)% Tier1"
    }
}

$masterGrades | Export-Csv master-grades-updated.csv -NoTypeInformation
```

### Step 3: Manual Review

Use automated results to prioritize manual reviews:

1. **Students with <40 points (67%)**: Check for major issues
2. **Students with errors**: Investigate errors in detail
3. **Students missing specific tests**: Target those features in manual review

## Common Issues

### Issue: "Cannot find module 'playwright'"

**Solution:**
```powershell
npm install
```

### Issue: "Browser not found"

**Solution:**
```powershell
npx playwright install chromium
```

### Issue: "File:/// URLs not loading"

**Cause:** Student's page uses fetch() for JSON, which requires HTTP server.

**Workaround:** The script handles this by checking for errors. These students need manual review.

### Issue: "Test timeout"

**Cause:** Student's page hangs or takes too long to load data.

**Solution:** Check student's code for infinite loops or very slow operations. Marked as failed test.

## Customization

### Add New Tests

Edit `automated-browser-test.js` and add to the `TESTS` object:

```javascript
MY_NEW_TEST: {
  name: 'Description of test',
  points: 5,
  test: async (page) => {
    // Your test logic here
    const result = await page.locator('selector').count();
    return result > 0; // Return true/false
  }
}
```

### Change Timeout

Default is 30 seconds per test. To change:

```javascript
const TIMEOUT = 60000; // 60 seconds
```

### Test Different Browser

Change browser in `main()`:

```javascript
// Firefox
const browser = await firefox.launch({ headless: true });

// WebKit (Safari)
const browser = await webkit.launch({ headless: true });
```

## Performance

**Serial (1 at a time):**
- 64 students × 15 seconds = ~16 minutes

**Parallel=5:**
- 64 students / 5 × 15 seconds = ~3 minutes

**Parallel=10:**
- 64 students / 10 × 15 seconds = ~2 minutes

**Recommendation:** Start with `--parallel=5`, increase if stable.

## Limitations

### What Automated Testing CAN'T Detect

1. **Edge case handling** - Requires specific test data (Tier 2)
2. **Code quality** - Use `analyze-code.js` instead
3. **UI/UX polish** - Subjective, requires human judgment
4. **Advanced features** - Too complex for automated detection (Tier 3)
5. **Bonus features** - Varied implementations, need manual testing

### False Positives

Tests may pass even if implementation is poor:

- **Data loading:** Checks if rows exist, not if data is correct
- **Sorting:** Checks if table changes, not if sort is correct
- **Filtering:** Checks if rows reduce, not if filter logic is right

**Mitigation:** Use automated tests as **first pass**, then manually review students with low scores or suspicious patterns.

## Troubleshooting

### Debug Single Student

```powershell
node automated-browser-test.js --student="5903-aljban-ramuka"
```

### Run with Visible Browser (Not Headless)

Edit `automated-browser-test.js`:

```javascript
const browser = await chromium.launch({ headless: false });
```

This shows the browser window, useful for debugging.

### Check Playwright Logs

Set environment variable:

```powershell
$env:DEBUG="pw:api"
node automated-browser-test.js --student="student-name"
```

## Next Steps

After automated testing:

1. **Import results** into master-grades.csv
2. **Flag outliers** - Students with very low/high scores
3. **Manual review** - Focus on Tier 2, Tier 3, and bonus features
4. **Cross-reference** with code-analysis-report.csv
5. **Final grading** - Combine automated + manual scores

## Time Savings

**Manual testing (64 students):**
- Load page, test sorting, filtering, etc.
- ~5 minutes per student
- Total: ~5.5 hours

**Automated testing:**
- Setup: 10 minutes (one time)
- Run: 3 minutes (with --parallel=5)
- Review results: 30 minutes
- **Total: ~40 minutes**

**Savings: ~4.5 hours** 🎉

## Support

For issues or improvements, check:
- Playwright docs: https://playwright.dev/
- Test definitions in `automated-browser-test.js`
- Error messages in `automated-test-results.csv`
