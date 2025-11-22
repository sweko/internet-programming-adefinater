# Grading Breakdown - PR #43

**Student:** Matej Tasevski
**Student ID:** 5940
**GitHub:** @matejtasevski
**Alternative:** Doctor Who

---

## Score Summary

| Category | Score | Percentage |
|----------|-------|------------|
| **Tier 1** (Basic Functionality) | 60 / 65 | 92% |
| **Tier 2** (Edge Case Handling) | 22 / 25 | 88% |
| **Tier 3** (Advanced Features) | 5 / 40 | 13% |
| **Subtotal** | 87 / 100 | |
| **Bonus Points** | +0 | |
| **Deductions** | -5 |
| **Total Points** | 82 / 100 | |
| **FINAL GRADE** | **82%** | |

---

## Complete Points Breakdown

| Status | Test | Tier | Max Pts | Earned |
|--------|------|------|---------|--------|
| ✅ | Data Loads Successfully | 1 | 10 | 10 |
| ✅ | Loading Indicator Shown | 1 | 3 | 3 |
| ❌ | Error Handling for Data Fetch | 1 | 2 | 0 |
| ✅ | All Required Columns Present | 1 | 15 | 15 |
| ✅ | Data Properly Formatted | 1 | 6 | 6 |
| ✅ | Semantic HTML Structure | 1 | 4 | 4 |
| ✅ | Clicking Headers Sorts Table | 1 | 8 | 8 |
| ✅ | Toggle Ascending/Descending | 1 | 4 | 4 |
| ❌ | Sort Direction Indicator | 1 | 3 | 0 |
| ✅ | Filter Input Field Exists | 1 | 5 | 5 |
| ✅ | Filter Actually Works | 1 | 5 | 5 |
|  | **─── TIER 1 SUBTOTAL ───** |  | 65 | 60 |
| ✅ | No "undefined" or "null" Text | 2 | 5 | 5 |
| ✅ | Empty Arrays Handled Gracefully | 2 | 3 | 3 |
| ✅ | Special Characters Render Correctly | 2 | 4 | 4 |
| ❌ | Error Messages User-Friendly | 2 | 3 | 0 |
| ✅ | Missing Data Fields Handled | 2 | 3 | 3 |
| ✅ | Nested Data Properly Formatted | 2 | 4 | 4 |
| ✅ | Multiple Date Formats Sorted | 2 | 3 | 3 |
|  | **─── TIER 2 SUBTOTAL ───** |  | 25 | 22 |
| ❌ | Performance Optimization | 3 | 5 | 0 |
| ❌ | Keyboard Navigation | 3 | 5 | 0 |
| ✅ | Smart Relevance Sorting | 3 | 5 | 5 |
| ❌ | Data Validation & Warnings | 3 | 5 | 0 |
| ❌ | Additional Filters | 3 | 5 | 0 |
| ❌ | Multi-Column Sorting | 3 | 5 | 0 |
| ❌ | Export to CSV | 3 | 5 | 0 |
| ❌ | Grouping/Decade Display | 3 | 5 | 0 |
|  | **─── TIER 3 SUBTOTAL ───** |  | 40 | 5 |
| | | | | |
|  | **BASE SCORE** |  | 100 | 87 |
|  | **DEDUCTIONS** |  |  | -5 |
| | | | | |
| **═══** | **FINAL TOTAL** | ═══ | 100 | 82 |

---

## Error Log

No critical errors - tests passed successfully.

---

## Instructor Notes

Manual Test Results: 82% | T1=60/65 (92%) | T2=22/25 (88%) | T3=5/40 (13%) | Deduction=-5

**Deductions:**
- **-5 pts**: Using local data file instead of fetching from external URL

**Test Details:**
- Strong core functionality implementation
- Good edge case handling
- Smart relevance sorting implemented
- Missing: error handling for data fetch (-2 pts)
- Missing: visual sort indicators (-3 pts)
- Missing: user-friendly error messages (-3 pts)

**Strengths:**
- All basic features work correctly
- Proper data loading and display
- Sorting and filtering functional
- Good handling of null/undefined values
- Proper date format handling
- Smart search relevance implemented

**Areas for Improvement:**
- Add visual sort direction indicators (arrows)
- Implement try-catch for data fetching
- Add user-friendly error messages
- Fetch data from external URL instead of local file
- Consider implementing additional advanced features

