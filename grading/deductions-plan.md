# Deductions Analysis Plan

Based on `GRADING.md`, here's what we can automate vs. manual review:

---

## A. Static Code Analysis (Can automate with scripts)

### 1. File Structure Issues (-10 pts: Missing required files)
- ✅ Check if `index.html`, `script.js`, `styles.css` exist
- ✅ Already handled by our PR download process
- **Status:** COVERED - no students missing files

### 2. Code Quality - var usage (-3 pts: Uses var instead of let/const)
- Scan JavaScript files for `var ` declarations
- Can use regex: `/\bvar\s+\w+/g`
- Count occurrences - threshold: **3+ uses = deduction**
- **TODO:** Implement JavaScript static analysis

### 3. Code Quality - Global pollution (-2 pts: Many global variables)
- Count top-level variable declarations
- Check for `window.varName` assignments
- Threshold: **10+ globals = deduction**
- **TODO:** Implement global variable counter

### 4. Code Quality - No comments (-2 pts: Missing comments for complex logic)
- Count `//` and `/* */` comments in JS files
- Calculate comment-to-code ratio
- Threshold: **<5% comments = deduction**
- **TODO:** Implement comment analyzer

### 5. Code Quality - Formatting (-1 pt: Inconsistent formatting)
- ⚠️ Hard to automate reliably
- **SKIP** for now - not critical, manual review only

### 6. Wrong Data Source (-10 pts: Uses local file instead of fetch)
- ✅ Check for `<script src="doctor-who-episodes.json">`
- ✅ Check for import statements with .json
- ✅ Grep for 'doctor-who-episodes.json' or 'hugo-books.json' in HTML
- **Status:** COMPLETED in data source analysis

---

## B. Browser-Based Testing (Already implemented in Playwright)

### 1. Critical: Doesn't run (-20 pts: Page blank, console errors prevent execution)
- ✅ **ALREADY TESTED:** `page.waitForSelector('table')` with timeout
- If times out = doesn't run
- **Status:** COVERED in automated tests

### 2. Critical: Crashes on load (-15 pts: Crashes on loading page)
- ✅ **ALREADY TESTED:** Console error detection on page load
- Captured in 'Errors' column
- **Status:** COVERED - need to parse Errors for crash keywords

### 3. Major: Crashes on interaction (-10 pts: Clicking sort, typing filter)
- ✅ **ALREADY TESTED:** Try-catch around sort/filter tests
- Test failures indicate crashes
- **Status:** COVERED - need to analyze test failures

### 4. Console errors on load (-8 pts per unique error, max -16)
- ✅ **ALREADY CAPTURED:** `page.on('console')` and `page.on('pageerror')`
- Stored in 'Errors' column
- **Status:** COVERED - need to count unique errors

### 5. Console warnings during use (-3 pts: Warnings during normal operations)
- ✅ **ALREADY CAPTURED:** Same as above
- Need to distinguish warnings from errors
- **Status:** COVERED - need to parse warning vs error

### 6. Missing required feature (-5 pts: Feature specified but missing)
- ✅ **ALREADY TESTED:** Each test = one feature
- Failed tests = missing features
- **Status:** COVERED - but need to identify REQUIRED vs OPTIONAL

---

## C. Cannot Automate (Requires manual review)

### 1. Code organization (-2 pts: Poor separation, everything in one function)
- Requires human judgment on structure quality
- **MANUAL REVIEW:** Spot-check high/low performers

### 2. Understanding check (Academic integrity)
- Requires human judgment
- **MANUAL REVIEW:** Flag suspicious submissions

### 3. Bonus points (Exceptional UI, code quality, creativity)
- Requires human aesthetic/quality judgment
- **MANUAL REVIEW:** Award bonus points manually

---

## Implementation Priority

### 🔴 HIGH PRIORITY (Implement now)

1. Parse existing 'Errors' column for console errors → **-8 pts per unique**
2. Detect crashes from test failures → **-10 or -15 pts**
3. Count failures in required Tier 1 features → **-5 pts per feature**
4. Static analysis: Check for var usage → **-3 pts**
5. Static analysis: Check for local file usage → **-10 pts** (already done ✅)

### 🟡 MEDIUM PRIORITY (Implement if time)

6. Count global variables → **-2 pts**
7. Comment ratio analysis → **-2 pts**

### 🟢 LOW PRIORITY (Manual review acceptable)

8. Code organization quality
9. Formatting consistency
10. Bonus point awards

---

## Proposed Automation Workflow

### Step 1: CREATE `static-code-analyzer.js`

Analyze downloaded student files for:
- var usage count
- Global variable count
- Comment ratio
- Local file usage detection

**Output:** `deductions.csv` with columns:
```
[PR_Number, VarUsage_Deduction, GlobalPollution_Deduction, 
 NoComments_Deduction, LocalFile_Deduction, StaticTotal]
```

---

### Step 2: CREATE `browser-error-analyzer.js`

Parse `pr-test-results.csv` 'Errors' column:
- Count unique console errors → **-8 pts each (max -16)**
- Detect crash patterns → **-15 or -10 pts**

**Output:** Add columns to CSV:
```
[ConsoleErrors_Count, ConsoleErrors_Deduction, Crash_Deduction]
```

---

### Step 3: CREATE `required-feature-analyzer.js`

- Identify which Tier 1 tests are REQUIRED (all of them)
- Check test results for failures
- Calculate: failures → **-5 pts**

**Output:** Add column `[MissingFeatures_Deduction]`

---

### Step 4: MERGE all deduction sources

Combine static + browser + feature deductions:
- Calculate total deductions
- Update `master-grades.csv` with:
  - Deductions column (breakdown)
  - `Adjusted_Points = Total_Points - Deductions`
  - `Final_Grade = (Adjusted_Points / 100) × 100`, capped at 100, floored at 0

---

### Step 5: MANUAL REVIEW (spot-check)

- Review top 5 students (ensure no false negatives)
- Review bottom 5 students (ensure fair deductions)
- Review 5 random mid-range students
- Adjust any obvious errors
- Award bonus points for exceptional work

---

## Deduction Summary Table (Expected Impact)

| Deduction Type | Points | Detection Method | Priority |
|----------------|--------|------------------|----------|
| Doesn't run at all | -20 | Browser test timeout | ✅ AUTO |
| Crashes on load | -15 | Parse Errors column | ✅ AUTO |
| Crashes on interaction | -10 | Test failure analysis | ✅ AUTO |
| Missing required files | -10 | File existence check | ✅ DONE |
| Local file usage | -10 | Static code grep | ✅ DONE |
| Console errors (unique) | -8 ea | Parse Errors column | ✅ AUTO |
| Missing required feature | -5 ea | Test failures (Tier 1) | ✅ AUTO |
| Console warnings | -3 | Parse Errors column | ✅ AUTO |
| var instead of let/const | -3 | Static analysis regex | ✅ AUTO |
| Global pollution | -2 | Static variable count | 🟡 MAYBE |
| No comments | -2 | Comment ratio analysis | 🟡 MAYBE |
| Poor organization | -2 | Manual review | 🔵 MANUAL |
| Inconsistent formatting | -1 | Manual review | 🔵 MANUAL |

---

## Expected Timeline

### Automation
1. Static code analyzer: **30 minutes**
2. Browser error parser: **20 minutes**
3. Feature failure analyzer: **15 minutes**
4. Merge & calculate: **10 minutes**
5. Testing & validation: **15 minutes**

**TOTAL AUTOMATION:** ~90 minutes

### Manual Review
6. Manual spot-checking: **30 minutes**
7. Bonus point awards: **20 minutes**

**TOTAL WITH MANUAL:** ~2.5 hours

---

## Next Action

Ready to implement? I can:

a) **Implement all HIGH priority deductions** (Steps 1-4 above)
b) **Start with just browser error parsing** (quick win)
c) **Create a manual deduction spreadsheet template**
d) **Something else**
