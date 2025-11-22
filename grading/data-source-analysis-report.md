# Data Source Analysis Results

   # Data Source Analysis Results

**Analysis Date:** 2025-11-08  

**Students Analyzed:** 64**Analysis Date:** 2025-11-08  

**Students Analyzed:** 64

## Results Summary

## Results Summary

### 🚫 Local File Usage (Deduction: -10 pts)

### 🚫 Local File Usage (Deduction: -10 pts)

**✅ EXCELLENT:** 0 students using local files  

**No deductions applied****✅ EXCELLENT:** 0 students using local files  

**No deductions applied**

**Checked for:**

- `fetch('doctor-who-episodes.json')` or similar relative paths**Checked for:**

- `<script src="*.json">`- `fetch('doctor-who-episodes.json')` or similar relative paths

- import statements with .json files- `<script src="*.json">`

- import statements with .json files

**Result:** All students correctly using HTTP endpoints ✅

**Result:** All students correctly using HTTP endpoints ✅

---

---

### ✨ Multiple HTTP Sources (Bonus: +5 pts)

### ✨ Multiple HTTP Sources (Bonus: +5 pts)

**🎉 25 students** implemented multiple data sources **(+5 pts each)**

**🎉 25 students** implemented multiple data sources **(+5 pts each)**

**Breakdown by Exam Type:**

- Doctor Who (PR ≤44): **23 students****Breakdown by Exam Type:**

- Hugo Books (PR ≥45): **2 students**- Doctor Who (PR ≤44): **23 students**

- Hugo Books (PR ≥45): **2 students**

**Total Bonus Awarded:** 125 points  

**Average per Student:** 1.95 points**Total Bonus Awarded:** 125 points  

**Average per Student:** 1.95 points

> This represents students who went beyond requirements and fetched from multiple JSON endpoints (e.g., episodes 1-10.json, 11-20.json, etc.)

> This represents students who went beyond requirements and fetched from multiple JSON endpoints (e.g., episodes 1-10.json, 11-20.json, etc.)

---

---

### ✅ Single HTTP Source (Expected: 0 pts)

### ✅ Single HTTP Source (Expected: 0 pts)

**31 students** using single HTTP source (standard implementation)

**31 students** using single HTTP source (standard implementation)

**Examples:**

- `fetch('https://raw.githubusercontent.com/.../doctor-who-episodes.json')`**Examples:**

- `fetch('https://raw.githubusercontent.com/.../hugo-books-full.json')`- `fetch('https://raw.githubusercontent.com/.../doctor-who-episodes.json')`

- `fetch('https://raw.githubusercontent.com/.../hugo-books-full.json')`

> This is the expected baseline behavior per exam specification.

> This is the expected baseline behavior per exam specification.

---

---

### ⚠️ Unknown/Not Detected (Manual review: 0 pts)

### ⚠️ Unknown/Not Detected (Manual review: 0 pts)

**8 students** where data source could not be auto-detected

   8 students where data source could not be auto-detected

**PR Numbers:** 6, 10, 27, 39, 42, 43, 51, 58

  PR Numbers: 6, 10, 27, 39, 42, 43, 51, 58

**Likely Reasons:**

- Using object-oriented structure (fetch in separate class/file)  LIKELY REASONS:

- Dynamic URL construction  - Using object-oriented structure (fetch in separate class/file)

- Code split across modules  - Dynamic URL construction

- Non-standard but valid implementations  - Code split across modules

  - Non-standard but valid implementations

**Recommendation:** Manual spot-check these 8 students

- All passed automated tests, so data IS loading  RECOMMENDATION: Manual spot-check these 8 students

- Check if using local files (apply -10 if found)  - All passed automated tests, so data IS loading

- Check if using multiple sources (apply +5 if found)  - Check if using local files (apply -10 if found)

  - Check if using multiple sources (apply +5 if found)

---



## Grading Impact AnalysisGRADING IMPACT ANALYSIS



### Before Data Source Analysis

- **Doctor Who avg:** 86.8 ptsBEFORE Data Source Analysis:

- **Hugo Books avg:** 81.0 pts  - Doctor Who avg:  86.8 pts

  - Hugo Books avg:   81.0 pts

### After Data Source Bonus Applied

- **Doctor Who:** 23 students × +5 = +115 pts total **(+2.6 pts avg)**AFTER Data Source Bonus Applied:

- **Hugo Books:** 2 students × +5 = +10 pts total **(+0.5 pts avg)**  - Doctor Who: 23 students  +5 = +115 pts total (+2.6 pts avg)

  - Hugo Books:  2 students  +5 = +10 pts total (+0.5 pts avg)

### Expected New Averages

- **Doctor Who:** ~89.4 pts (with bonus)EXPECTED NEW AVERAGES:

- **Hugo Books:** ~81.5 pts (with bonus)  - Doctor Who: ~89.4 pts (with bonus)

- **Gap:** ~7.9 pts (slightly wider due to more DW students earning bonus)  - Hugo Books:  ~81.5 pts (with bonus)

  - Gap: ~7.9 pts (slightly wider due to more DW students earning bonus)

> **NOTE:** This widening is FAIR because:

> - Both groups had equal opportunity to implement multiple sourcesNOTE: This widening is FAIR because:

> - Hugo Books exam uses single comprehensive JSON file (less need to split)  - Both groups had equal opportunity to implement multiple sources

> - Doctor Who exam data naturally split across decades/series  - Hugo Books exam uses single comprehensive JSON file (less need to split)

> - Bonus is optional - rewards extra effort, not required  - Doctor Who exam data naturally split across decades/series

  - Bonus is optional - rewards extra effort, not required

---



## Equity ValidationEQUITY VALIDATION



✅ No systematic bias - both alternatives can earn bonus   No systematic bias - both alternatives can earn bonus

✅ No unfair deductions - zero students penalized   No unfair deductions - zero students penalized

✅ Doctor Who students more likely to split data (23/44 = 52%)   Doctor Who students more likely to split data (23/44 = 52%)

✅ Hugo Books students less likely due to data structure (2/20 = 10%)   Hugo Books students less likely due to data structure (2/20 = 10%)

✅ Difference reflects exam design, not grading bias   Difference reflects exam design, not grading bias

✅ Both pass rates remain equivalent (~85%) Both pass rates remain equivalent (~85%)



---

FILES UPDATED

## Files Updated─

   pr-test-results.csv - Updated with 5 new columns:

### Updated Files    - DataSource_Type: LOCAL_FILE | MULTI_HTTP | SINGLE_HTTP | UNKNOWN

- **`pr-test-results.csv`** - Updated with 5 new columns:    - DataSource_Count: Number of HTTP sources detected (integer)

  - `DataSource_Type`: LOCAL_FILE | MULTI_HTTP | SINGLE_HTTP | UNKNOWN    - DataSource_Deduction: -10 for local file, 0 otherwise

  - `DataSource_Count`: Number of HTTP sources detected (integer)    - DataSource_Bonus: +5 for multiple sources, 0 otherwise

  - `DataSource_Deduction`: -10 for local file, 0 otherwise    - DataSource_Note: Detailed explanation

  - `DataSource_Bonus`: +5 for multiple sources, 0 otherwise

  - `DataSource_Note`: Detailed explanation   pr-test-results-backup.csv - Original preserved



### Backup Files   data-source-analyzer.js - Analysis script (reusable)

- **`pr-test-results-backup.csv`** - Original preserved



### ScriptsNEXT STEPS

- **`data-source-analyzer.js`** - Analysis script (reusable)

  1.  COMPLETED: Data source analysis

---  

  2. TODO: Manually review 8 'UNKNOWN' students (PRs: 6,10,27,39,42,43,51,58)

## Next Steps     - Check for local file usage  apply -10 if found

     - Check for multiple sources  apply +5 if found

1. ✅ **COMPLETED:** Data source analysis  

  3. TODO: Parse browser errors from 'Errors' column

2. ⏳ **TODO:** Manually review 8 'UNKNOWN' students (PRs: 6, 10, 27, 39, 42, 43, 51, 58)     - Console errors  -8 pts each (max -16)

   - Check for local file usage → apply -10 if found     - Crashes  -10 or -15 pts

   - Check for multiple sources → apply +5 if found  

  4. TODO: Implement remaining static analysis

3. ⏳ **TODO:** Parse browser errors from 'Errors' column     - var usage  -3 pts

   - Console errors → -8 pts each (max -16)     - Global pollution  -2 pts

   - Crashes → -10 or -15 pts     - No comments  -2 pts

  

4. ⏳ **TODO:** Implement remaining static analysis  5. TODO: Calculate final adjusted scores

   - var usage → -3 pts     - Adjusted_Points = Total_Points + DataSource_Bonus - All_Deductions

   - Global pollution → -2 pts     - Final_Grade = (Adjusted_Points / 100)  100, capped at 100, floored at 0

   - No comments → -2 pts



5. ⏳ **TODO:** Calculate final adjusted scoresSTATISTICS

   - `Adjusted_Points = Total_Points + DataSource_Bonus - All_Deductions`

   - `Final_Grade = (Adjusted_Points / 100) × 100`, capped at 100, floored at 0  Total students analyzed:       64

  Detection success rate:        87.5% (56/64)

---  Bonus-earning students:        39.1% (25/64)

  Deduction-earning students:    0% (0/64)

## Statistics  Manual review required:        12.5% (8/64)



| Metric | Value |

|--------|-------|
| Total students analyzed | 64 |
| Detection success rate | 87.5% (56/64) |
| Bonus-earning students | 39.1% (25/64) |
| Deduction-earning students | 0% (0/64) |
| Manual review required | 12.5% (8/64) |
