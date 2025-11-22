# Grading Breakdown - PR #36

**Student:** Borjan Angelkovski
**Student ID:** 5839
**GitHub:** @BorjanAngelkovski
**Alternative:** Doctor Who

---

## Score Summary

| Category | Score | Percentage |
|----------|-------|------------|
| **Tier 1** (Basic Functionality) | 30 / 60 | 50% |
| **Tier 2** (Edge Case Handling) | 6 / 25 | 24% |
| **Tier 3** (Advanced Features) | 15 / 15 | 100% |
| **Subtotal** | 51 / 100 | |
| **Bonus Points** | +5 | |
| **Deductions** | -0 | |
| **Total Points** | 56 / 100 | |
| **FINAL GRADE** | **56%** | |

---

## Complete Points Breakdown

| Status | Test | Tier | Max Pts | Earned |
|--------|------|------|---------|--------|
| ❌ | Data Loads Successfully | 1 | 10 | 0 |
| ✅ | Loading Indicator Shown | 1 | 3 | 3 |
| ✅ | All Required Columns Present | 1 | 15 | 15 |
| ✅ | Semantic HTML Structure | 1 | 4 | 4 |
| ❌ | Clicking Headers Sorts Table | 1 | 8 | 0 |
| ❌ | Toggle Ascending/Descending | 1 | 4 | 0 |
| ✅ | Sort Direction Indicator | 1 | 3 | 3 |
| ✅ | Filter Input Field Exists | 1 | 5 | 5 |
| ❌ | Filter Actually Works | 1 | 5 | 0 |
|  | **─── TIER 1 SUBTOTAL ───** |  | 60 | 30 |
| ❌ | No "undefined" or "null" Text | 2 | 5 | 0 |
| ❌ | Empty Arrays Handled Gracefully | 2 | 3 | 0 |
| ❌ | Special Characters Render Correctly | 2 | 4 | 0 |
| ✅ | Error Messages User-Friendly | 2 | 3 | 3 |
| ❌ | Missing Data Fields Handled | 2 | 3 | 0 |
| ❌ | Nested Data Properly Formatted | 2 | 4 | 0 |
| ✅ | Multiple Date Formats Sorted | 2 | 3 | 3 |
|  | **─── TIER 2 SUBTOTAL ───** |  | 25 | 6 |
| ❌ | Performance Optimization | 3 | 5 | 0 |
| ❌ | Keyboard Navigation | 3 | 5 | 0 |
| ❌ | Smart Relevance Sorting | 3 | 5 | 0 |
| ✅ | Data Validation & Warnings | 3 | 5 | 5 |
| ✅ | Additional Filters | 3 | 5 | 5 |
| ❌ | Multi-Column Sorting | 3 | 5 | 0 |
| ❌ | Export to CSV | 3 | 5 | 0 |
| ✅ | Grouping/Decade Display | 3 | 5 | 5 |
|  | **─── TIER 3 SUBTOTAL ───** |  | 15 | 15 |
| | | | | |
|  | **BASE SCORE** |  | 100 | 51 |
| ✨ | BONUS |  |  | +5 |
| | | | | |
| **═══** | **FINAL TOTAL** | ═══ | 100 | 56 |

---

## Error Log

- ⚠️ Clicking headers sorts table: locator.textContent: Error: strict mode violation: locator('table tbody tr:first-child td:first-child') resolved to 6 elements: 1) <td colspan="10">…</td> aka getByRole('cell', { name: '2020s — 18 episodes' }) 2) <td colspan="10">…</td> aka getByRole('cell', { name: '2010s — 15 episodes' }) 3) <td colspan="10">…</td> aka getByRole('cell', { name: '2000s — 16 episodes' }) 4) <td colspan="10">…</td> aka getByRole('cell', { name: '1980s — 2 episodes' }) 5) <td colspan="10">…</td> aka getByRole('cell', { name: '1970s — 11 episodes' }) 6) <td colspan="10">…</td> aka getByRole('cell', { name: '1960s — 3 episodes' }) Call log: - waiting for locator('table tbody tr:first-child td:first-child')
- ⚠️ Toggle ascending/descending: locator.textContent: Error: strict mode violation: locator('table tbody tr:first-child td:first-child') resolved to 6 elements: 1) <td colspan="10">…</td> aka getByRole('cell', { name: '2020s — 18 episodes' }) 2) <td colspan="10">…</td> aka getByRole('cell', { name: '2010s — 15 episodes' }) 3) <td colspan="10">…</td> aka getByRole('cell', { name: '2000s — 16 episodes' }) 4) <td colspan="10">…</td> aka getByRole('cell', { name: '1980s — 2 episodes' }) 5) <td colspan="10">…</td> aka getByRole('cell', { name: '1970s — 11 episodes' }) 6) <td colspan="10">…</td> aka getByRole('cell', { name: '1960s — 3 episodes' }) Call log: - waiting for locator('table tbody tr:first-child td:first-child')
- ⚠️ No "undefined" or "null" text visible: locator.textContent: Error: strict mode violation: locator('table tbody') resolved to 10 elements: 1) <tbody id="episodes-body"></tbody> aka locator('#episodes-body') 2) <tbody class="decade-section">…</tbody> aka getByText('2020s — 18 episodes-7The') 3) <tbody class="decade-section">…</tbody> aka getByText('2010s — 15 episodes2Heaven') 4) <tbody class="decade-section">…</tbody> aka getByText('2000s — 16 episodes1Blink3Modern2007Hettie MacDonaldSteven MoffatDavid Tennant') 5) <tbody class="decade-section">…</tbody> aka getByText('1980s — 2 episodes21The Caves') 6) <tbody class="decade-section">…</tbody> aka getByText('1970s — 11 episodes20Genesis') 7) <tbody class="decade-section">…</tbody> aka getByText('1960s — 3 episodes23The Tomb') 8) <tbody class="decade-section">…</tbody> aka getByText('2020s — 3 episodes35The Power') 9) <tbody class="decade-section">…</tbody> aka getByText('2010s — 4 episodes4The Day of') 10) <tbody class="decade-section">…</tbody> aka getByText('2000s — 1 episode3The Empty') Call log: - waiting for locator('table tbody')
- ⚠️ Empty arrays handled gracefully: locator.textContent: Error: strict mode violation: locator('table tbody') resolved to 10 elements: 1) <tbody id="episodes-body"></tbody> aka locator('#episodes-body') 2) <tbody class="decade-section">…</tbody> aka getByText('2020s — 18 episodes-7The') 3) <tbody class="decade-section">…</tbody> aka getByText('2010s — 15 episodes2Heaven') 4) <tbody class="decade-section">…</tbody> aka getByText('2000s — 16 episodes1Blink3Modern2007Hettie MacDonaldSteven MoffatDavid Tennant') 5) <tbody class="decade-section">…</tbody> aka getByText('1980s — 2 episodes21The Caves') 6) <tbody class="decade-section">…</tbody> aka getByText('1970s — 11 episodes20Genesis') 7) <tbody class="decade-section">…</tbody> aka getByText('1960s — 3 episodes23The Tomb') 8) <tbody class="decade-section">…</tbody> aka getByText('2020s — 3 episodes35The Power') 9) <tbody class="decade-section">…</tbody> aka getByText('2010s — 4 episodes4The Day of') 10) <tbody class="decade-section">…</tbody> aka getByText('2000s — 1 episode3The Empty') Call log: - waiting for locator('table tbody')
- ⚠️ Special characters render correctly: locator.textContent: Error: strict mode violation: locator('table tbody') resolved to 10 elements: 1) <tbody id="episodes-body"></tbody> aka locator('#episodes-body') 2) <tbody class="decade-section">…</tbody> aka getByText('2020s — 18 episodes-7The') 3) <tbody class="decade-section">…</tbody> aka getByText('2010s — 15 episodes2Heaven') 4) <tbody class="decade-section">…</tbody> aka getByText('2000s — 16 episodes1Blink3Modern2007Hettie MacDonaldSteven MoffatDavid Tennant') 5) <tbody class="decade-section">…</tbody> aka getByText('1980s — 2 episodes21The Caves') 6) <tbody class="decade-section">…</tbody> aka getByText('1970s — 11 episodes20Genesis') 7) <tbody class="decade-section">…</tbody> aka getByText('1960s — 3 episodes23The Tomb') 8) <tbody class="decade-section">…</tbody> aka getByText('2020s — 3 episodes35The Power') 9) <tbody class="decade-section">…</tbody> aka getByText('2010s — 4 episodes4The Day of') 10) <tbody class="decade-section">…</tbody> aka getByText('2000s — 1 episode3The Empty') Call log: - waiting for locator('table tbody')
- ⚠️ Missing/null values display placeholders: locator.textContent: Error: strict mode violation: locator('table tbody') resolved to 10 elements: 1) <tbody id="episodes-body"></tbody> aka locator('#episodes-body') 2) <tbody class="decade-section">…</tbody> aka getByText('2020s — 18 episodes-7The') 3) <tbody class="decade-section">…</tbody> aka getByText('2010s — 15 episodes2Heaven') 4) <tbody class="decade-section">…</tbody> aka getByText('2000s — 16 episodes1Blink3Modern2007Hettie MacDonaldSteven MoffatDavid Tennant') 5) <tbody class="decade-section">…</tbody> aka getByText('1980s — 2 episodes21The Caves') 6) <tbody class="decade-section">…</tbody> aka getByText('1970s — 11 episodes20Genesis') 7) <tbody class="decade-section">…</tbody> aka getByText('1960s — 3 episodes23The Tomb') 8) <tbody class="decade-section">…</tbody> aka getByText('2020s — 3 episodes35The Power') 9) <tbody class="decade-section">…</tbody> aka getByText('2010s — 4 episodes4The Day of') 10) <tbody class="decade-section">…</tbody> aka getByText('2000s — 1 episode3The Empty') Call log: - waiting for locator('table tbody')
- ⚠️ Nested data (award/series) formatted properly: locator.textContent: Error: strict mode violation: locator('table tbody') resolved to 10 elements: 1) <tbody id="episodes-body"></tbody> aka locator('#episodes-body') 2) <tbody class="decade-section">…</tbody> aka getByText('2020s — 18 episodes-7The') 3) <tbody class="decade-section">…</tbody> aka getByText('2010s — 15 episodes2Heaven') 4) <tbody class="decade-section">…</tbody> aka getByText('2000s — 16 episodes1Blink3Modern2007Hettie MacDonaldSteven MoffatDavid Tennant') 5) <tbody class="decade-section">…</tbody> aka getByText('1980s — 2 episodes21The Caves') 6) <tbody class="decade-section">…</tbody> aka getByText('1970s — 11 episodes20Genesis') 7) <tbody class="decade-section">…</tbody> aka getByText('1960s — 3 episodes23The Tomb') 8) <tbody class="decade-section">…</tbody> aka getByText('2020s — 3 episodes35The Power') 9) <tbody class="decade-section">…</tbody> aka getByText('2010s — 4 episodes4The Day of') 10) <tbody class="decade-section">…</tbody> aka getByText('2000s — 1 episode3The Empty') Call log: - waiting for locator('table tbody')

---

## Instructor Notes

AutoTest: 56% | T1=30/60 (50%) | T2=6/25 (24%) | T3=15/40 (38%) | Bonus: +5 | Single HTTP source (expected)

### Manual Adjustments

**Tests Updated Based on Manual Review:**
- Data Loads Successfully: ❌ UNCHECKED (data loading failed or incomplete)
- Data Validation & Warnings: ✅ CHECKED (validation and warnings implemented)
- Grouping/Decade Display: ✅ CHECKED (decade grouping feature working)

**Bonus Points Awarded (+5 total):**
- +5 pts: Partial data loading (data loads but with issues/incompleteness)

**Note:** Student implemented 3 advanced features (100% on Tier 3 core requirements) but has significant issues with basic functionality. Data loading is partial (bonus awarded for effort), and weak edge case handling (24% on Tier 2) indicates fundamental problems. Decade grouping implementation caused automated test failures (strict mode violations with multiple tbody elements), but feature verified working through manual review.

