# Grading Workflow

This folder contains all scripts and CSV files for grading student submissions.

## Overview

The grading system has three main components:

1. **PR Data Extraction** - Extract student information from GitHub pull requests
2. **Code Analysis** - Automatically analyze code for deductions and patterns
3. **Manual Grading** - Use checklists to grade each student's work

## Files in This Folder

### Scripts

- `extract-pr-data.js` - Extracts PR info and generates grading CSVs
- `analyze-code.js` - Analyzes student code for automatic deductions
- `populate-pr-data.ps1` - PowerShell helper (documentation only)
- `pr-data.json` - Stores PR data from GitHub (populated manually or via script)

### Generated CSV Files

After running the scripts, you'll have:

- `master-grades.csv` - Main grading spreadsheet with all students
- `design-analysis.csv` - Track design changes from starter template
- `code-analysis-report.csv` - Automated code quality analysis
- `student-checklists/` - Individual grading checklists per student

## Grading Workflow

### Step 1: Fetch PR Data

Use the GitHub MCP tool to get all pull requests:

```javascript
// Via Copilot chat with GitHub MCP active:
// "List all open pull requests for sweko/internet-programming-adefinater"
```

Then manually create the `pr-data.json` file with this structure:

```json
{
  "generated": "2025-11-06T21:00:00Z",
  "totalCount": 64,
  "prs": [
    {
      "number": 1,
      "title": "Student Name 1234",
      "created_at": "2025-11-06T17:04:19Z",
      "user": {
        "login": "studentgithub",
        "id": 12345
      },
      "state": "open"
    }
  ]
}
```

### Step 2: Generate Grading CSVs

```bash
cd grading
node extract-pr-data.js
```

This creates:
- `master-grades.csv` - Main grading sheet
- `design-analysis.csv` - Design comparison tracking
- `student-checklists/*.csv` - Individual student checklists (64 files)

### Step 3: Run Code Analysis

```bash
node analyze-code.js
```

This analyzes the `../students/` folder and creates:
- `code-analysis-report.csv` - Automated deduction detection

### Step 4: Manual Grading

For each student:

1. **Open their PR** on GitHub to see their changes
2. **Check out their code** (optional: merge PR locally or view on GitHub)
3. **Open their folder** in browser (e.g., `students/student-name-1234/index.html`)
4. **Use their checklist** (`student-checklists/PR1_1234_Student_Name.csv`)
5. **Grade systematically**:
   - Tier 1: Data loads? Displays correctly? Sorts? Filters?
   - Tier 2: Edge cases handled? (null companion, special chars, etc.)
   - Tier 3: Which advanced features implemented?
   - Design: Original or regenerated?
6. **Record scores** in both their individual checklist AND `master-grades.csv`
7. **Check `code-analysis-report.csv`** for automatic deductions
8. **Update `design-analysis.csv`** with design observations

### Step 5: Calculate Final Grades

In your spreadsheet app (Excel, Google Sheets, etc.):

1. Open `master-grades.csv`
2. Add formula for Total_Points:
   ```
   =Tier1_Score + Tier2_Score + Tier3_Score + Bonus_Points + Deductions
   ```
3. Add formula for Final_Grade (capped at 100, floored at 0):
   ```
   =MIN(100, MAX(0, Total_Points))
   ```
4. Review and finalize

## CSV File Descriptions

### master-grades.csv

Main grading spreadsheet with columns:
- PR_Number, Student_Name, Student_ID
- Submission_Date, GitHub_Username
- Tier1_Score, Tier2_Score, Tier3_Score
- Bonus_Points, Deductions
- Total_Points, Final_Grade
- Design_Analysis, Notes

### design-analysis.csv

Track design changes with columns:
- Original_Starter_CSS (YES/NO/PARTIAL)
- CSS_Modified (YES/NO/PARTIAL)
- Completely_New_Design (YES/NO)
- Uses_Framework (YES/NO - Bootstrap, Tailwind, etc.)
- Design_Quality (BETTER/SAME/WORSE than starter)
- AI_Regenerated_Likelihood (HIGH/MEDIUM/LOW)
- Design_Notes (free text)

### code-analysis-report.csv

Automated analysis with columns:
- File presence (HTML/JS/CSS)
- Data loading method (URL/LOCAL/MULTI_URL)
- Code quality metrics (var usage, comments, try-catch)
- Optimization patterns (debounce, pagination, etc.)
- Design indicators (CSS size, frameworks, likely regenerated)
- Total automatic deductions
- Deduction details

### student-checklists/*.csv

Individual checklists for detailed grading with sections:
- **Tier 1**: Data Loading (15), Display (25), Sorting (15), Filtering (10)
- **Tier 2**: Data Robustness (15), Display Formatting (10)
- **Tier 3**: Advanced Features (list of 9 options, 5 pts each)
- **Bonus**: Additional features, code quality, UI/UX, creativity
- **Deductions**: Critical (-20 to -10), Major (-8 to -5), Minor (-3 to -1)
- **Design Analysis**: Original vs regenerated tracking
- **Summary**: Final calculation

## Grading Tips

### Design Analysis

**Original Starter Template:**
The starter template in `alternative-one/code/` has:
- ~150-300 lines of CSS (~4KB file)
- Basic table styling
- Simple color scheme
- Minimal custom classes

**Indicators of AI Regeneration:**
- CSS file dramatically different in size (< 500 bytes or > 12KB)
- Modern CSS patterns (CSS Grid everywhere, CSS variables, flexbox heavy)
- AI-style comments ("/* Modern design */", "/* Utility classes */")
- Complete redesign with framework-like utilities
- Professional-looking but inconsistent with starter

**Indicators of Original Work:**
- CSS builds on starter template
- Similar file size and structure
- Incremental improvements
- Student's personal style choices

### Time Management

- **5-7 minutes per student** × 64 students = **~6 hours total**
- Break it into sessions (e.g., 10 students per hour)
- Use `code-analysis-report.csv` to quickly identify problematic submissions
- Grade easiest/cleanest submissions first to establish baseline

### Common Deductions

Check `code-analysis-report.csv` for:
- Missing files: -10 pts (automatic)
- Uses local file: -10 pts (automatic)
- Uses var extensively: -3 pts (automatic)
- No comments: -2 pts (automatic)

Then manually check for:
- Code doesn't run: -20 pts
- Crashes on load: -15 pts
- Crashes on interaction: -10 pts
- Console errors on load: -8 pts each (max -16)

## Batch Operations

### Quickly Review All Submissions

```bash
# List all student folders
ls ../students/

# Check which students have HTML files
ls ../students/*/index.html

# Count total submissions
ls ../students/ | wc -l
```

### Find Specific Issues

```bash
# Find students using local files (in code-analysis-report.csv)
grep "LOCAL" code-analysis-report.csv

# Find students with missing files
grep "NO" code-analysis-report.csv | grep "HTML_Present\|JS_Present\|CSS_Present"

# Find likely regenerated designs
grep "LIKELY" code-analysis-report.csv
```

## Example Grading Session

1. **Start** (10 minutes)
   - Open `master-grades.csv` in spreadsheet
   - Open `code-analysis-report.csv` for reference
   - Set up browser with multiple tabs

2. **Grade First Student** (7 minutes)
   - Check PR #1 on GitHub
   - Open `students/student-name-1234/index.html` in browser
   - Open `student-checklists/PR1_1234_Student_Name.csv`
   - Test functionality (load, sort, filter, edge cases)
   - Check console for errors
   - Compare design to starter template
   - Fill in checklist
   - Transfer scores to master sheet

3. **Repeat for All Students**

4. **Final Review** (30 minutes)
   - Double-check calculations
   - Review outliers (very high or very low scores)
   - Add final notes
   - Export final grades

## Output

After grading, you'll have:
- Complete `master-grades.csv` with all final grades
- Detailed `design-analysis.csv` showing design patterns
- Individual checklists for each student (for detailed feedback)
- `code-analysis-report.csv` for statistical analysis

## Next Steps

1. Export final grades from `master-grades.csv`
2. Optionally provide feedback via PR comments
3. Merge or close PRs as appropriate
4. Upload grades to learning management system

## Automated Browser Testing (NEW!)

### Why Browser Testing?

Manual testing of 64 students' applications is time-consuming:
- Load each page individually
- Test data loading, sorting, filtering
- ~5 minutes per student = ~5.5 hours total

**Automated browser testing saves ~4.5 hours!**

### Quick Start

⚠️ **IMPORTANT:** Student code is in their PRs, not in `students/` folder (those are starter templates)!

```powershell
# Optional but recommended: Set GitHub token to avoid rate limits
$env:GITHUB_TOKEN="your_github_personal_access_token"

# One-time setup
cd grading
npm install
npx playwright install chromium

# Run tests on all PRs (3-10 minutes for all 64 students)
node test-prs-directly.js --parallel=5

# Merge results into master grades
.\merge-test-results.ps1
```

**See `TESTING-PRS.md` for complete guide.**

### What Gets Tested

The automated tests verify **Tier 1 requirements** (60 of 65 points):

✅ Data loading from JSON  
✅ Table rendering with all required columns  
✅ Sorting functionality (click headers, toggle asc/desc)  
✅ Filtering functionality  
✅ Loading indicators  
✅ Error handling  

### Output Files

1. **`automated-test-results.csv`** - Detailed test results
   - Individual test scores for each student
   - Pass/fail for each requirement
   - Error messages if tests failed

2. **`master-grades-with-automated.csv`** - Updated master grades
   - Same as `master-grades.csv` but with Tier1_Score populated
   - Notes field includes automated test percentage

### Test a Specific Student

```powershell
node automated-browser-test.js --student="5903-aljban-ramuka"
```

Useful for debugging or re-testing after fixes.

### What's NOT Automated

These still require manual review:
- **Tier 2** - Edge case handling (null companions, date formats, special characters)
- **Tier 3** - Advanced features (performance optimization, keyboard navigation)
- **Bonus** - Multi-column sort, filters, CSV export, decade grouping
- **Design Analysis** - Whether students kept original design or regenerated

### Integration with Grading

1. Run automated tests → get `automated-test-results.csv`
2. Run merge script → get `master-grades-with-automated.csv`  
3. Review students with low automated scores (<40 pts)
4. Continue with manual Tier 2, Tier 3, and bonus grading
5. Use individual `student-checklists/*.csv` for detailed tracking

### Troubleshooting

See `BROWSER-TESTING.md` for complete guide.

## Notes

- The grading system supports up to 125 points but caps at 100
- Students need 60 points minimum to pass (Tier 1)
- Design analysis helps identify AI usage patterns
- Individual checklists can be returned to students as feedback
