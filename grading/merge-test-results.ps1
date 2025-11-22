# Merge Automated Test Results into Master Grades
#
# This script merges pr-test-results.csv (from test-prs-directly.js)
# OR automated-test-results.csv (from automated-browser-test.js)
# into master-grades.csv by matching PR number or GitHub username.
#
# USAGE:
#   .\merge-test-results.ps1

$ErrorActionPreference = "Stop"

Write-Host "Merging Automated Test Results" -ForegroundColor Cyan
Write-Host "==============================`n" -ForegroundColor Cyan

# Check if files exist
if (-not (Test-Path "master-grades.csv")) {
    Write-Host "❌ master-grades.csv not found" -ForegroundColor Red
    exit 1
}

# Check which test results file exists
$testResultsFile = $null
if (Test-Path "pr-test-results.csv") {
    $testResultsFile = "pr-test-results.csv"
    Write-Host "Using: pr-test-results.csv (from test-prs-directly.js)`n" -ForegroundColor Green
} elseif (Test-Path "automated-test-results.csv") {
    $testResultsFile = "automated-test-results.csv"
    Write-Host "Using: automated-test-results.csv (from automated-browser-test.js)`n" -ForegroundColor Green
} else {
    Write-Host "❌ No test results file found" -ForegroundColor Red
    Write-Host "   Expected: pr-test-results.csv or automated-test-results.csv" -ForegroundColor Yellow
    Write-Host "   Run test-prs-directly.js or automated-browser-test.js first" -ForegroundColor Yellow
    exit 1
}

# Load CSVs
Write-Host "Loading CSV files..." -ForegroundColor Gray
$masterGrades = Import-Csv "master-grades.csv"
$testResults = Import-Csv $testResultsFile

Write-Host "  Master grades: $($masterGrades.Count) students" -ForegroundColor Gray
Write-Host "  Test results: $($testResults.Count) students`n" -ForegroundColor Gray

# Counters
$matched = 0
$notFound = 0
$updated = 0

# Process each student
foreach ($student in $masterGrades) {
    $prNumber = $student.PR_Number
    $username = $student.GitHub_Username
    
    # Try to find matching test result
    # Priority: match by PR number, then by username
    $testResult = $null
    
    # Method 1: Match by PR_Number (if available in test results)
    if ($testResults[0].PSObject.Properties.Name -contains 'PR_Number') {
        $testResult = $testResults | Where-Object { $_.PR_Number -eq $prNumber } | Select-Object -First 1
    }
    
    # Method 2: Match by GitHub_Username
    if (-not $testResult -and $username) {
        $testResult = $testResults | Where-Object { $_.GitHub_Username -eq $username } | Select-Object -First 1
    }
    
    # Method 3: Match by Student_Name containing username
    if (-not $testResult -and $username) {
        $testResult = $testResults | Where-Object { $_.Student_Name -like "*$username*" } | Select-Object -First 1
    }
    
    if ($testResult) {
        $matched++
        
        # Get automated scores from all tiers
        $tier1Score = if ($testResult.Tier1_Points) { [int]$testResult.Tier1_Points } else { 0 }
        $tier2Score = if ($testResult.Tier2_Points) { [int]$testResult.Tier2_Points } else { 0 }
        $tier3Score = if ($testResult.Tier3_Points) { [int]$testResult.Tier3_Points } else { 0 }
        $totalScore = if ($testResult.Total_Points) { [int]$testResult.Total_Points } else { 0 }
        $finalGrade = if ($testResult.Final_Grade) { [int]$testResult.Final_Grade } else { 0 }
        
        # Update all tier scores if automated scores are available
        if ($totalScore -gt 0) {
            $student.Tier1_Score = $tier1Score
            $student.Tier2_Score = $tier2Score
            $student.Tier3_Score = $tier3Score
            $student.Total_Points = $totalScore
            $student.Final_Grade = "$finalGrade%"
            $updated++
            
            # Add note about automated testing with tier breakdown
            $existingNotes = if ($student.Notes) { $student.Notes } else { "" }
            $automatedNote = "AutoTest: $finalGrade% | T1=$tier1Score/60 ($([math]::Round($tier1Score/60*100))%) | T2=$tier2Score/25 ($([math]::Round($tier2Score/25*100))%) | T3=$tier3Score/40 ($([math]::Round($tier3Score/40*100))%)"
            
            if ($existingNotes) {
                $student.Notes = "$existingNotes | $automatedNote"
            } else {
                $student.Notes = $automatedNote
            }
            
            # If there were errors, add them to notes (but truncate if too long)
            if ($testResult.Errors -and $testResult.Errors.Length -gt 0) {
                $errorNote = $testResult.Errors
                if ($errorNote.Length -gt 200) {
                    $errorNote = $errorNote.Substring(0, 197) + "..."
                }
                $student.Notes += " | Errors: $errorNote"
            }
            
            Write-Host "✓ $username" -ForegroundColor Green -NoNewline
            Write-Host " - Total: $totalScore/125 pts ($finalGrade%) | T1=$tier1Score T2=$tier2Score T3=$tier3Score" -ForegroundColor Gray
        } else {
            Write-Host "⚠ $username" -ForegroundColor Yellow -NoNewline
            Write-Host " - No automated score (0 pts)" -ForegroundColor Gray
        }
    } else {
        $notFound++
        Write-Host "✗ $username" -ForegroundColor Red -NoNewline
        Write-Host " - No test result found" -ForegroundColor Gray
    }
}

# Save updated master grades
$outputFile = "master-grades-with-automated.csv"
$masterGrades | Export-Csv $outputFile -NoTypeInformation -Encoding UTF8

Write-Host "`nResults:" -ForegroundColor Cyan
Write-Host "--------" -ForegroundColor Cyan
Write-Host "  Matched: $matched/$($masterGrades.Count)" -ForegroundColor Gray
Write-Host "  Updated: $updated" -ForegroundColor Green
Write-Host "  Not found: $notFound" -ForegroundColor $(if ($notFound -gt 0) { "Yellow" } else { "Gray" })

Write-Host "`n✓ Saved to: $outputFile" -ForegroundColor Green

# Show students with low scores (potential issues)
Write-Host "`nStudents with Low Total Scores (<60 pts out of 125):" -ForegroundColor Yellow
Write-Host "----------------------------------------------------" -ForegroundColor Yellow

$lowScorers = $masterGrades | Where-Object { 
    $_.Total_Points -and ([int]$_.Total_Points -lt 60)
} | Select-Object PR_Number, Student_Name, GitHub_Username, Total_Points, Final_Grade | Sort-Object { [int]$_.Total_Points }

if ($lowScorers.Count -gt 0) {
    $lowScorers | ForEach-Object {
        Write-Host "  PR #$($_.PR_Number): $($_.Student_Name) ($($_.GitHub_Username)) - $($_.Total_Points)/125 pts ($($_.Final_Grade))" -ForegroundColor Yellow
    }
} else {
    Write-Host "  None! All students scored ≥60 points (passing)." -ForegroundColor Green
}

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "-----------" -ForegroundColor Cyan
Write-Host "1. Review $outputFile" -ForegroundColor Gray
Write-Host "2. Check students with low scores manually" -ForegroundColor Gray
Write-Host "3. Continue with Tier 2, Tier 3, and Bonus grading" -ForegroundColor Gray
Write-Host "4. Use student-checklists/ for detailed rubric tracking" -ForegroundColor Gray
