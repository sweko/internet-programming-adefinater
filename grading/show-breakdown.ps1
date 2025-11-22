param(
    [Parameter(Mandatory=$true)]
    [int]$PR,
    
    [Parameter(Mandatory=$false)]
    [switch]$SaveMarkdown
)

# Load CSV files
$testResults = Import-Csv "pr-test-results.csv"
$masterGrades = Import-Csv "master-grades.csv"

# Find student data
$student = $testResults | Where-Object { $_.PR_Number -eq $PR }
$master = $masterGrades | Where-Object { $_.PR_Number -eq $PR }

if (-not $student) {
    Write-Host "ERROR: PR #$PR not found in test results" -ForegroundColor Red
    exit 1
}

# Prepare markdown content if requested
$mdContent = @()
if ($SaveMarkdown) {
    $mdContent += "# Grading Breakdown - PR #$PR"
    $mdContent += ""
    $mdContent += "**Student:** $($student.Student_Name)"
    $mdContent += "**Student ID:** $($student.Student_ID)"
    $mdContent += "**GitHub:** @$($student.GitHub_Username)"
    $mdContent += "**Alternative:** Doctor Who"
    $mdContent += ""
    $mdContent += "---"
    $mdContent += ""
}

# Header
Write-Host "`n═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "                    DETAILED POINTS BREAKDOWN - PR #$PR" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Student Name    : $($student.Student_Name)" -ForegroundColor White
Write-Host "  Student ID      : $($student.Student_ID)" -ForegroundColor White
Write-Host "  GitHub Username : $($student.GitHub_Username)" -ForegroundColor White
Write-Host "  Alternative     : Doctor Who" -ForegroundColor White
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "                           SCORE SUMMARY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Tier 1 (Basic Functionality) : $($master.Tier1_Score) / 60  (" -NoNewline -ForegroundColor White
Write-Host "$([math]::Round(($master.Tier1_Score / 60) * 100))%" -NoNewline -ForegroundColor $(if($master.Tier1_Score -ge 48){'Green'}elseif($master.Tier1_Score -ge 36){'Yellow'}else{'Red'})
Write-Host ")" -ForegroundColor White
Write-Host "  Tier 2 (Edge Case Handling)  : $($master.Tier2_Score) / 25  (" -NoNewline -ForegroundColor White
Write-Host "$([math]::Round(($master.Tier2_Score / 25) * 100))%" -NoNewline -ForegroundColor $(if($master.Tier2_Score -ge 20){'Green'}elseif($master.Tier2_Score -ge 15){'Yellow'}else{'Red'})
Write-Host ")" -ForegroundColor White
Write-Host "  Tier 3 (Advanced Features)   : $($master.Tier3_Score) / 15  (" -NoNewline -ForegroundColor White
Write-Host "$([math]::Round(($master.Tier3_Score / 15) * 100))%" -NoNewline -ForegroundColor $(if($master.Tier3_Score -ge 10){'Green'}elseif($master.Tier3_Score -ge 5){'Yellow'}else{'Red'})
Write-Host ")" -ForegroundColor White
Write-Host "  ─────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  Subtotal                      : $($master.Tier1_Score + $master.Tier2_Score + $master.Tier3_Score) / 100" -ForegroundColor White
Write-Host ""
Write-Host "  Bonus Points                  : +$($master.Bonus_Points)" -ForegroundColor Green
Write-Host "  Deductions                    : -$($master.Deductions)" -ForegroundColor Red
Write-Host "  ─────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  Total Points                  : $($master.Total_Points) / 100" -ForegroundColor White
Write-Host ""
Write-Host "  FINAL GRADE                   : " -NoNewline -ForegroundColor White
Write-Host "$($master.Final_Grade)%" -ForegroundColor $(if($master.Final_Grade -ge 90){'Green'}elseif($master.Final_Grade -ge 60){'Yellow'}else{'Red'})
Write-Host ""

if ($SaveMarkdown) {
    $mdContent += "## Score Summary"
    $mdContent += ""
    $mdContent += "| Category | Score | Percentage |"
    $mdContent += "|----------|-------|------------|"
    $mdContent += "| **Tier 1** (Basic Functionality) | $($master.Tier1_Score) / 60 | $([math]::Round(($master.Tier1_Score / 60) * 100))% |"
    $mdContent += "| **Tier 2** (Edge Case Handling) | $($master.Tier2_Score) / 25 | $([math]::Round(($master.Tier2_Score / 25) * 100))% |"
    $mdContent += "| **Tier 3** (Advanced Features) | $($master.Tier3_Score) / 15 | $([math]::Round(($master.Tier3_Score / 15) * 100))% |"
    $mdContent += "| **Subtotal** | $($master.Tier1_Score + $master.Tier2_Score + $master.Tier3_Score) / 100 | |"
    $mdContent += "| **Bonus Points** | +$($master.Bonus_Points) | |"
    $mdContent += "| **Deductions** | -$($master.Deductions) | |"
    $mdContent += "| **Total Points** | $($master.Total_Points) / 100 | |"
    $mdContent += "| **FINAL GRADE** | **$($master.Final_Grade)%** | |"
    $mdContent += ""
    $mdContent += "---"
    $mdContent += ""
}

# Build comprehensive points breakdown table
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "                      COMPLETE POINTS BREAKDOWN" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

if ($SaveMarkdown) {
    $mdContent += "## Complete Points Breakdown"
    $mdContent += ""
    $mdContent += "| Status | Test | Tier | Max Pts | Earned |"
    $mdContent += "|--------|------|------|---------|--------|"
}

$breakdown = @()

# TIER 1 Tests
$breakdown += [PSCustomObject]@{
    Status = if($student.DATA_LOADS -eq 10){'✓'}else{'✗'}
    Test = 'Data Loads Successfully'
    Tier = '1'
    MaxPts = 10
    Earned = [int]$student.DATA_LOADS
}

$breakdown += [PSCustomObject]@{
    Status = if($student.LOADING_INDICATOR -eq 3){'✓'}else{'✗'}
    Test = 'Loading Indicator Shown'
    Tier = '1'
    MaxPts = 3
    Earned = [int]$student.LOADING_INDICATOR
}

$breakdown += [PSCustomObject]@{
    Status = if($student.ALL_COLUMNS -eq 15){'✓'}else{'✗'}
    Test = 'All Required Columns Present'
    Tier = '1'
    MaxPts = 15
    Earned = [int]$student.ALL_COLUMNS
}

if ($student.DATA_FORMATTING -gt 0) {
    $breakdown += [PSCustomObject]@{
        Status = '✨'
        Test = 'Data Formatting (Extra)'
        Tier = '1'
        MaxPts = 0
        Earned = [int]$student.DATA_FORMATTING
    }
}

$breakdown += [PSCustomObject]@{
    Status = if($student.SEMANTIC_HTML -eq 4){'✓'}else{'✗'}
    Test = 'Semantic HTML Structure'
    Tier = '1'
    MaxPts = 4
    Earned = [int]$student.SEMANTIC_HTML
}

$breakdown += [PSCustomObject]@{
    Status = if($student.SORT_FUNCTIONALITY -eq 8){'✓'}else{'✗'}
    Test = 'Clicking Headers Sorts Table'
    Tier = '1'
    MaxPts = 8
    Earned = [int]$student.SORT_FUNCTIONALITY
}

$breakdown += [PSCustomObject]@{
    Status = if($student.SORT_TOGGLE -eq 4){'✓'}else{'✗'}
    Test = 'Toggle Ascending/Descending'
    Tier = '1'
    MaxPts = 4
    Earned = [int]$student.SORT_TOGGLE
}

$breakdown += [PSCustomObject]@{
    Status = if($student.SORT_INDICATOR -eq 3){'✓'}else{'✗'}
    Test = 'Sort Direction Indicator'
    Tier = '1'
    MaxPts = 3
    Earned = [int]$student.SORT_INDICATOR
}

$breakdown += [PSCustomObject]@{
    Status = if($student.FILTER_EXISTS -eq 5){'✓'}else{'✗'}
    Test = 'Filter Input Field Exists'
    Tier = '1'
    MaxPts = 5
    Earned = [int]$student.FILTER_EXISTS
}

$breakdown += [PSCustomObject]@{
    Status = if($student.FILTER_WORKS -eq 5){'✓'}else{'✗'}
    Test = 'Filter Actually Works'
    Tier = '1'
    MaxPts = 5
    Earned = [int]$student.FILTER_WORKS
}

# Tier 1 Subtotal
$breakdown += [PSCustomObject]@{
    Status = ''
    Test = '─── TIER 1 SUBTOTAL ───'
    Tier = ''
    MaxPts = 60
    Earned = [int]$student.Tier1_Points
}

# TIER 2 Tests
$breakdown += [PSCustomObject]@{
    Status = if($student.NO_UNDEFINED_NULL -eq 5){'✓'}else{'✗'}
    Test = 'No "undefined" or "null" Text'
    Tier = '2'
    MaxPts = 5
    Earned = [int]$student.NO_UNDEFINED_NULL
}

$breakdown += [PSCustomObject]@{
    Status = if($student.EMPTY_ARRAYS_HANDLED -eq 3){'✓'}else{'✗'}
    Test = 'Empty Arrays Handled Gracefully'
    Tier = '2'
    MaxPts = 3
    Earned = [int]$student.EMPTY_ARRAYS_HANDLED
}

$breakdown += [PSCustomObject]@{
    Status = if($student.SPECIAL_CHARS_RENDER -eq 4){'✓'}else{'✗'}
    Test = 'Special Characters Render Correctly'
    Tier = '2'
    MaxPts = 4
    Earned = [int]$student.SPECIAL_CHARS_RENDER
}

$breakdown += [PSCustomObject]@{
    Status = if($student.ERROR_MESSAGE_FRIENDLY -eq 3){'✓'}else{'✗'}
    Test = 'Error Messages User-Friendly'
    Tier = '2'
    MaxPts = 3
    Earned = [int]$student.ERROR_MESSAGE_FRIENDLY
}

$breakdown += [PSCustomObject]@{
    Status = if($student.MISSING_DATA_HANDLED -eq 3){'✓'}else{'✗'}
    Test = 'Missing Data Fields Handled'
    Tier = '2'
    MaxPts = 3
    Earned = [int]$student.MISSING_DATA_HANDLED
}

$breakdown += [PSCustomObject]@{
    Status = if($student.NESTED_DATA_FORMATTED -eq 4){'✓'}else{'✗'}
    Test = 'Nested Data Properly Formatted'
    Tier = '2'
    MaxPts = 4
    Earned = [int]$student.NESTED_DATA_FORMATTED
}

$breakdown += [PSCustomObject]@{
    Status = if($student.DATE_FORMATS_HANDLED -eq 3){'✓'}else{'✗'}
    Test = 'Multiple Date Formats Sorted'
    Tier = '2'
    MaxPts = 3
    Earned = [int]$student.DATE_FORMATS_HANDLED
}

# Tier 2 Subtotal
$breakdown += [PSCustomObject]@{
    Status = ''
    Test = '─── TIER 2 SUBTOTAL ───'
    Tier = ''
    MaxPts = 25
    Earned = [int]$student.Tier2_Points
}

# TIER 3 Tests
$breakdown += [PSCustomObject]@{
    Status = if($student.PERFORMANCE_OPTIMIZATION -gt 0){'✓'}else{'✗'}
    Test = 'Performance Optimization'
    Tier = '3'
    MaxPts = 5
    Earned = [int]$student.PERFORMANCE_OPTIMIZATION
}

$breakdown += [PSCustomObject]@{
    Status = if($student.KEYBOARD_NAVIGATION -gt 0){'✓'}else{'✗'}
    Test = 'Keyboard Navigation'
    Tier = '3'
    MaxPts = 5
    Earned = [int]$student.KEYBOARD_NAVIGATION
}

$breakdown += [PSCustomObject]@{
    Status = if($student.RELEVANCE_SORT -gt 0){'✓'}else{'✗'}
    Test = 'Smart Relevance Sorting'
    Tier = '3'
    MaxPts = 5
    Earned = [int]$student.RELEVANCE_SORT
}

$breakdown += [PSCustomObject]@{
    Status = if($student.DATA_VALIDATION -gt 0){'✓'}else{'✗'}
    Test = 'Data Validation & Warnings'
    Tier = '3'
    MaxPts = 5
    Earned = [int]$student.DATA_VALIDATION
}

$breakdown += [PSCustomObject]@{
    Status = if($student.ADDITIONAL_FILTERS -gt 0){'✓'}else{'✗'}
    Test = 'Additional Filters'
    Tier = '3'
    MaxPts = 5
    Earned = [int]$student.ADDITIONAL_FILTERS
}

$breakdown += [PSCustomObject]@{
    Status = if($student.MULTI_COLUMN_SORT -gt 0){'✓'}else{'✗'}
    Test = 'Multi-Column Sorting'
    Tier = '3'
    MaxPts = 5
    Earned = [int]$student.MULTI_COLUMN_SORT
}

$breakdown += [PSCustomObject]@{
    Status = if($student.EXPORT_CSV -gt 0){'✓'}else{'✗'}
    Test = 'Export to CSV'
    Tier = '3'
    MaxPts = 5
    Earned = [int]$student.EXPORT_CSV
}

$breakdown += [PSCustomObject]@{
    Status = if($student.GROUPING_FEATURE -gt 0){'✓'}else{'✗'}
    Test = 'Grouping/Decade Display'
    Tier = '3'
    MaxPts = 5
    Earned = [int]$student.GROUPING_FEATURE
}

# Tier 3 Subtotal
$breakdown += [PSCustomObject]@{
    Status = ''
    Test = '─── TIER 3 SUBTOTAL ───'
    Tier = ''
    MaxPts = 15
    Earned = [int]$student.Tier3_Points
}

# Empty row
$breakdown += [PSCustomObject]@{
    Status = ''
    Test = ''
    Tier = ''
    MaxPts = ''
    Earned = ''
}

# Base score
$breakdown += [PSCustomObject]@{
    Status = ''
    Test = 'BASE SCORE'
    Tier = ''
    MaxPts = 100
    Earned = [int]$student.Tier1_Points + [int]$student.Tier2_Points + [int]$student.Tier3_Points
}

# Bonus
if ($master.Bonus_Points -gt 0) {
    $bonusText = "BONUS"
    if ($student.DataSource -eq 'MULTI_HTTP') {
        $bonusText = "BONUS (Multi-HTTP: $($student.DataSource_Count) sources)"
    }
    $breakdown += [PSCustomObject]@{
        Status = '✨'
        Test = $bonusText
        Tier = ''
        MaxPts = ''
        Earned = "+$($master.Bonus_Points)"
    }
}

# Deductions
if ($master.Deductions -gt 0) {
    $breakdown += [PSCustomObject]@{
        Status = '⚠️'
        Test = "DEDUCTIONS"
        Tier = ''
        MaxPts = ''
        Earned = "-$($master.Deductions)"
    }
}

# Empty row
$breakdown += [PSCustomObject]@{
    Status = ''
    Test = ''
    Tier = ''
    MaxPts = ''
    Earned = ''
}

# Final total
$breakdown += [PSCustomObject]@{
    Status = '═══'
    Test = 'FINAL TOTAL'
    Tier = '═══'
    MaxPts = 100
    Earned = [int]$master.Total_Points
}

# Display table
$breakdown | Format-Table -Property Status, Test, Tier, @{Label='Max Pts'; Expression={$_.MaxPts}}, @{Label='Earned'; Expression={$_.Earned}} -AutoSize

# Generate markdown table
if ($SaveMarkdown) {
    foreach ($row in $breakdown) {
        if ($row.Test -eq '') {
            $mdContent += "| | | | | |"
        } else {
            $status = $row.Status
            if ($status -eq '✓') { $status = '✅' }
            elseif ($status -eq '✗') { $status = '❌' }
            elseif ($status -eq '✨') { $status = '✨' }
            elseif ($status -eq '═══') { $status = '**═══**' }
            else { $status = '' }
            
            $test = $row.Test
            if ($test -like '*SUBTOTAL*' -or $test -eq 'BASE SCORE' -or $test -eq 'FINAL TOTAL') {
                $test = "**$test**"
            }
            
            $mdContent += "| $status | $test | $($row.Tier) | $($row.MaxPts) | $($row.Earned) |"
        }
    }
    $mdContent += ""
    $mdContent += "---"
    $mdContent += ""
}

# Error log
if ($student.Errors -and $student.Errors.Trim() -ne '') {
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "                            ERROR LOG" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan
    
    $errors = $student.Errors -split ';' | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }
    
    if ($SaveMarkdown) {
        $mdContent += "## Error Log"
        $mdContent += ""
    }
    
    foreach ($err in $errors) {
        Write-Host "  ⚠️  $err" -ForegroundColor Yellow
        if ($SaveMarkdown) {
            $mdContent += "- ⚠️ $err"
        }
    }
    Write-Host ""
    
    if ($SaveMarkdown) {
        $mdContent += ""
        $mdContent += "---"
        $mdContent += ""
    }
}

# Instructor notes
if ($master.Notes -and $master.Notes.Trim() -ne '') {
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "                          INSTRUCTOR NOTES" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan
    Write-Host "  $($master.Notes)" -ForegroundColor Gray
    Write-Host ""
    
    if ($SaveMarkdown) {
        $mdContent += "## Instructor Notes"
        $mdContent += ""
        $mdContent += $master.Notes
        $mdContent += ""
    }
}

Write-Host "═══════════════════════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Save markdown file if requested
if ($SaveMarkdown) {
    $outputDir = "student-reports"
    if (-not (Test-Path $outputDir)) {
        New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    }
    
    $filename = "PR-$PR-breakdown.md"
    $filepath = Join-Path $outputDir $filename
    
    $mdContent | Out-File -FilePath $filepath -Encoding UTF8
    
    Write-Host "✅ Markdown file saved: $filepath" -ForegroundColor Green
    Write-Host ""
}
