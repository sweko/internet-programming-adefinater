# Grading Breakdown - PR #21

**Student:** Ivan Pinevski
**Student ID:** 5714
**GitHub:** @ivanpine
**Alternative:** Doctor Who

---

## Score Summary

| Category | Score | Percentage |
|----------|-------|------------|
| **Tier 1** (Basic Functionality) | 57 / 60 | 95% |
| **Tier 2** (Edge Case Handling) | 17 / 25 | 68% |
| **Tier 3** (Advanced Features) | 20 / 15 | 133% |
| **Subtotal** | 94 / 100 | |
| **Bonus Points** | +6 | |
| **Deductions** | -0 | |
| **Total Points** | 100 / 100 | |
| **FINAL GRADE** | **100%** | |

---

## Complete Points Breakdown

| Status | Test | Tier | Max Pts | Earned |
|--------|------|------|---------|--------|
| ✅ | Data Loads Successfully | 1 | 10 | 10 |
| ✅ | Loading Indicator Shown | 1 | 3 | 3 |
| ✅ | All Required Columns Present | 1 | 15 | 15 |
| ✅ | Semantic HTML Structure | 1 | 4 | 4 |
| ✅ | Clicking Headers Sorts Table | 1 | 8 | 8 |
| ✅ | Toggle Ascending/Descending | 1 | 4 | 4 |
| ✅ | Sort Direction Indicator | 1 | 3 | 3 |
| ✅ | Filter Input Field Exists | 1 | 5 | 5 |
| ✅ | Filter Actually Works | 1 | 5 | 5 |
|  | **─── TIER 1 SUBTOTAL ───** |  | 60 | 57 |
| ✅ | No "undefined" or "null" Text | 2 | 5 | 5 |
| ✅ | Empty Arrays Handled Gracefully | 2 | 3 | 3 |
| ✅ | Special Characters Render Correctly | 2 | 4 | 4 |
| ✅ | Error Messages User-Friendly | 2 | 3 | 3 |
| ❌ | Missing Data Fields Handled | 2 | 3 | 0 |
| ✅ | Nested Data Properly Formatted | 2 | 4 | 4 |
| ❌ | Multiple Date Formats Sorted | 2 | 3 | 0 |
|  | **─── TIER 2 SUBTOTAL ───** |  | 25 | 17 |
| ❌ | Performance Optimization | 3 | 5 | 0 |
| ❌ | Keyboard Navigation | 3 | 5 | 0 |
| ❌ | Smart Relevance Sorting | 3 | 5 | 0 |
| ✅ | Data Validation & Warnings | 3 | 5 | 5 |
| ✅ | Additional Filters | 3 | 5 | 5 |
| ❌ | Multi-Column Sorting | 3 | 5 | 0 |
| ✅ | Export to CSV | 3 | 5 | 5 |
| ✅ | Grouping/Decade Display | 3 | 5 | 5 |
|  | **─── TIER 3 SUBTOTAL ───** |  | 15 | 20 |
| | | | | |
|  | **BASE SCORE** |  | 100 | 94 |
| ✨ | BONUS |  |  | +6 |
| | | | | |
| **═══** | **FINAL TOTAL** | ═══ | 100 | 100 |

---

## Error Log

- ⚠️ Clicking headers sorts table: locator.textContent: Error: strict mode violation: locator('table tbody tr:first-child td:first-child') resolved to 9 elements: 1) <td colspan="10">…</td> aka getByRole('cell').filter({ hasText: '1960s — 3 episodes23The Tomb' }) 2) <td>23</td> aka getByRole('cell', { name: '23' }) 3) <td>27</td> aka getByRole('cell', { name: '27' }) 4) <td>50</td> aka getByRole('cell', { name: '50' }) 5) <td>20</td> aka getByRole('cell', { name: '20', exact: true }) 6) <td>21</td> aka getByRole('cell', { name: '21' }).first() 7) <td>1</td> aka getByRole('cell', { name: '1', exact: true }).first() 8) <td>2</td> aka locator('tr:nth-child(5) > td > details > table > tbody > tr > td').first() 9) <td>-7</td> aka getByRole('cell', { name: '-7' }) Call log: - waiting for locator('table tbody tr:first-child td:first-child')
- ⚠️ Toggle ascending/descending: locator.textContent: Error: strict mode violation: locator('table tbody tr:first-child td:first-child') resolved to 9 elements: 1) <td colspan="10">…</td> aka getByRole('cell').filter({ hasText: '1960s — 3 episodes23The Tomb' }) 2) <td>23</td> aka getByRole('cell', { name: '23' }) 3) <td>27</td> aka getByRole('cell', { name: '27' }) 4) <td>50</td> aka getByRole('cell', { name: '50' }) 5) <td>20</td> aka getByRole('cell', { name: '20', exact: true }) 6) <td>21</td> aka getByRole('cell', { name: '21' }).first() 7) <td>1</td> aka getByRole('cell', { name: '1', exact: true }).first() 8) <td>2</td> aka locator('tr:nth-child(5) > td > details > table > tbody > tr > td').first() 9) <td>-7</td> aka getByRole('cell', { name: '-7' }) Call log: - waiting for locator('table tbody tr:first-child td:first-child')
- ⚠️ No "undefined" or "null" text visible: locator.textContent: Error: strict mode violation: locator('table tbody') resolved to 4 elements: 1) <tbody id="episodes-body">…</tbody> aka locator('#episodes-body') 2) <tbody>…</tbody> aka getByRole('group').filter({ hasText: '2000s — 1 episode3The Empty' }).getByRole('rowgroup') 3) <tbody>…</tbody> aka getByRole('group').filter({ hasText: '2010s — 4 episodes4The Day of' }).getByRole('rowgroup') 4) <tbody>…</tbody> aka getByRole('group').filter({ hasText: '2020s — 3 episodes35The Power' }).getByRole('rowgroup') Call log: - waiting for locator('table tbody')
- ⚠️ Empty arrays handled gracefully: locator.textContent: Error: strict mode violation: locator('table tbody') resolved to 4 elements: 1) <tbody id="episodes-body">…</tbody> aka locator('#episodes-body') 2) <tbody>…</tbody> aka getByRole('group').filter({ hasText: '2000s — 1 episode3The Empty' }).getByRole('rowgroup') 3) <tbody>…</tbody> aka getByRole('group').filter({ hasText: '2010s — 4 episodes4The Day of' }).getByRole('rowgroup') 4) <tbody>…</tbody> aka getByRole('group').filter({ hasText: '2020s — 3 episodes35The Power' }).getByRole('rowgroup') Call log: - waiting for locator('table tbody')
- ⚠️ Special characters render correctly: locator.textContent: Error: strict mode violation: locator('table tbody') resolved to 4 elements: 1) <tbody id="episodes-body">…</tbody> aka locator('#episodes-body') 2) <tbody>…</tbody> aka getByRole('group').filter({ hasText: '2000s — 1 episode3The Empty' }).getByRole('rowgroup') 3) <tbody>…</tbody> aka getByRole('group').filter({ hasText: '2010s — 4 episodes4The Day of' }).getByRole('rowgroup') 4) <tbody>…</tbody> aka getByRole('group').filter({ hasText: '2020s — 3 episodes35The Power' }).getByRole('rowgroup') Call log: - waiting for locator('table tbody')
- ⚠️ Missing/null values display placeholders: locator.textContent: Error: strict mode violation: locator('table tbody') resolved to 4 elements: 1) <tbody id="episodes-body">…</tbody> aka locator('#episodes-body') 2) <tbody>…</tbody> aka getByRole('group').filter({ hasText: '2000s — 1 episode3The Empty' }).getByRole('rowgroup') 3) <tbody>…</tbody> aka getByRole('group').filter({ hasText: '2010s — 4 episodes4The Day of' }).getByRole('rowgroup') 4) <tbody>…</tbody> aka getByRole('group').filter({ hasText: '2020s — 3 episodes35The Power' }).getByRole('rowgroup') Call log: - waiting for locator('table tbody')
- ⚠️ Nested data (award/series) formatted properly: locator.textContent: Error: strict mode violation: locator('table tbody') resolved to 4 elements: 1) <tbody id="episodes-body">…</tbody> aka locator('#episodes-body') 2) <tbody>…</tbody> aka getByRole('group').filter({ hasText: '2000s — 1 episode3The Empty' }).getByRole('rowgroup') 3) <tbody>…</tbody> aka getByRole('group').filter({ hasText: '2010s — 4 episodes4The Day of' }).getByRole('rowgroup') 4) <tbody>…</tbody> aka getByRole('group').filter({ hasText: '2020s — 3 episodes35The Power' }).getByRole('rowgroup') Call log: - waiting for locator('table tbody')

---

## Instructor Notes

AutoTest: 100% | T1=57/60 (95%) | T2=17/25 (68%) | T3=20/40 (50%) | Bonus: +6 | Multiple HTTP sources (6 sources) - BONUS!

### Manual Adjustments

**Tests Updated Based on Manual Review:**
- Clicking Headers Sorts Table: ✅ CHECKED (worked correctly, automated test had strict mode violation with grouped table structure)
- Toggle Ascending/Descending: ✅ CHECKED (toggle functionality working properly)
- Empty Arrays Handled Gracefully: ✅ CHECKED (verified proper handling)
- Special Characters Render Correctly: ✅ CHECKED (all special characters render correctly)
- Nested Data Properly Formatted: ✅ CHECKED (companion and cast data properly formatted)
- Data Validation & Warnings: ✅ CHECKED (validation implemented)
- Export to CSV: ✅ CHECKED (CSV export functionality working)

**Note:** Student implemented decade grouping feature which caused automated test issues with strict mode violations (multiple tbody elements). Manual verification confirmed all functionality working correctly. Excellent implementation with advanced features and proper edge case handling.

