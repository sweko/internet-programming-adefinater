# Grading System Setup - Summary

## Created Files

### Scripts (Automation)
1. **extract-pr-data.js** - Extracts PR info and generates all grading CSVs
2. **analyze-code.js** - Analyzes student code in `../students/` folder
3. **populate-from-raw.js** - Converts GitHub MCP PR response to pr-data.json
4. **populate-pr-data.ps1** - PowerShell documentation/helper

### Data Files
1. **pr-data.json** - Stores PR data (to be populated)
2. **prs-raw.json** - Will store raw GitHub MCP response (to be created)

### Documentation
1. **README.md** - Complete workflow guide

## What Gets Generated

### After running `extract-pr-data.js`:
- **master-grades.csv** - Main grading spreadsheet with all 64 students
- **design-analysis.csv** - Track original vs AI-regenerated designs
- **student-checklists/*.csv** - 64 individual detailed grading checklists

### After running `analyze-code.js`:
- **code-analysis-report.csv** - Automated code quality and deduction analysis

## Key Features

### 1. Design Analysis Tracking
The system specifically tracks whether students:
- Kept the original starter template design
- Modified it incrementally
- Completely regenerated it (likely with AI)

Tracked in both:
- `design-analysis.csv` - Dedicated design tracking
- `code-analysis-report.csv` - Automated CSS analysis
- Each student checklist - Manual design notes section

### 2. Automatic Deduction Detection
The `analyze-code.js` script automatically detects:
- Missing files (-10 pts)
- Using local data file (-10 pts)
- Excessive var usage (-3 pts)
- No comments (-2 pts)
- Global namespace pollution (-2 pts)

### 3. Individual Student Checklists
Each student gets a detailed CSV checklist with:
- All grading criteria from GRADING.md
- Space for earned points per item
- Design analysis section
- Notes field
- Automatic subtotal calculations

### 4. Optimization Detection
Automatically detects if students implemented:
- Debouncing/throttling
- Virtual scrolling
- Pagination
- Event delegation

## Quick Start

### Step 1: Get PR Data (YOU DO THIS)
```javascript
// In Copilot chat (GitHub MCP already activated):
// The PR list response is already available from earlier
// Save it to grading/prs-raw.json
```

### Step 2: Process PR Data
```bash
cd grading
node populate-from-raw.js    # Converts raw PR data to pr-data.json
node extract-pr-data.js       # Generates master CSV and 64 checklists
```

### Step 3: Analyze Code
```bash
node analyze-code.js          # Analyzes all ../students/* folders
```

### Step 4: Manual Grading
1. Open `master-grades.csv` in Excel/Google Sheets
2. For each student:
   - Open their `index.html` in browser
   - Use their individual checklist CSV
   - Test functionality
   - Check design vs starter template
   - Record scores

## Design Analysis Workflow

For each student, evaluate:

### 1. **CSS File Comparison**
```bash
# Starter template CSS is in:
../alternative-one/code/styles.css

# Student CSS is in:
../students/student-name-1234/styles.css
```

Compare:
- File size (starter ~4KB)
- Class names
- Overall structure
- Comments style

### 2. **Indicators of Original Work**
- Similar file size to starter
- Builds on existing classes
- Incremental improvements
- Personal style choices

### 3. **Indicators of AI Regeneration**
- Dramatically different file size (< 500 bytes or > 12KB)
- Modern CSS patterns everywhere (Grid, Flexbox, CSS variables)
- AI-style comments ("/* Modern design */", "/* Utility classes */")
- Professional but generic-looking
- Uses CSS framework (Bootstrap, Tailwind)

### 4. **Record in CSVs**
- `design-analysis.csv` - Fill in all design columns
- Student's individual checklist - Design analysis section
- `master-grades.csv` - Design_Analysis column (summary)

## Time Estimates

- **Setup** (Steps 1-3): 30-45 minutes (one time)
- **Per student grading**: 5-7 minutes × 64 = 5-7 hours total
- **Final review**: 30 minutes

Total: ~6-8 hours for complete grading

## Output CSVs Ready for Excel/Google Sheets

All CSVs use standard comma-separated format:
- Quoted fields where needed
- Standard headers
- Ready for spreadsheet formulas
- Can be imported directly

## Automation Level

### ✅ Fully Automated:
- PR information extraction
- File structure checking
- Data loading method detection
- Code quality metrics
- Optimization pattern detection
- CSS file size analysis
- Framework detection
- Automatic deduction flagging

### ⚠️ Semi-Automated:
- Design regeneration likelihood (heuristic)
- Code quality scoring (needs review)

### ❌ Manual Required:
- Functional testing (does it work?)
- Edge case verification
- Visual design quality judgment
- Advanced feature verification
- Final grade review

## Next Steps for You

1. **Get the PR data** - You already have it from the earlier mcp_github_list_pull_requests call
2. **Create prs-raw.json** - Copy the PR array into grading/prs-raw.json
3. **Run the scripts** - Execute populate-from-raw.js and extract-pr-data.js
4. **Review the generated CSVs** - Check master-grades.csv and sample checklists
5. **Run code analysis** - Execute analyze-code.js
6. **Start grading** - Use the workflow in README.md

Would you like me to help with any of these steps?
