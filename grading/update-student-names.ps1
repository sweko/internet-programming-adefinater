# Update Student Names and IDs from student-github.tsv
#
# This script properly assigns each PR to the correct student using the
# standardized format: firstName-lastName-ID

$ErrorActionPreference = "Stop"

Write-Host "Updating Student Information from TSV" -ForegroundColor Cyan
Write-Host "======================================`n" -ForegroundColor Cyan

# Load the TSV file with GitHub username mappings
$tsvPath = "student-github.tsv"
if (-not (Test-Path $tsvPath)) {
    Write-Host "❌ student-github.tsv not found" -ForegroundColor Red
    exit 1
}

Write-Host "Loading student-github.tsv..." -ForegroundColor Gray
$studentMap = @{}
$studentById = @{}

# Parse TSV file (tab-separated: standardized-name<tab>github-username)
Get-Content $tsvPath | ForEach-Object {
    $line = $_.Trim()
    if ($line) {
        $parts = $line -split "`t"
        $standardName = $parts[0].Trim()
        $githubUsername = if ($parts.Length -gt 1) { $parts[1].Trim() } else { "" }
        
        # Extract components from standardized name: firstName-lastName-ID
        if ($standardName -match '^([^-]+)-([^-]+)-(\d+)$') {
            $firstName = $matches[1]
            $lastName = $matches[2]
            $studentId = $matches[3]
            
            # Capitalize first letter of each name
            $firstName = (Get-Culture).TextInfo.ToTitleCase($firstName.ToLower())
            $lastName = (Get-Culture).TextInfo.ToTitleCase($lastName.ToLower())
            
            $fullName = "$firstName $lastName"
            
            $studentInfo = @{
                FullName = $fullName
                StudentID = $studentId
                StandardName = $standardName
                GitHubUsername = $githubUsername
            }
            
            # Map by GitHub username (if exists)
            if ($githubUsername) {
                $studentMap[$githubUsername.ToLower()] = $studentInfo
            }
            
            # Also map by student ID for fallback
            $studentById[$studentId] = $studentInfo
            
            Write-Host "  Mapped: $githubUsername → $fullName ($studentId)" -ForegroundColor DarkGray
        }
    }
}

Write-Host "`nLoaded $($studentMap.Count) student mappings`n" -ForegroundColor Green

# Load master grades CSV
if (-not (Test-Path "master-grades.csv")) {
    Write-Host "❌ master-grades.csv not found" -ForegroundColor Red
    exit 1
}

Write-Host "Loading master-grades.csv..." -ForegroundColor Gray
$masterGrades = Import-Csv "master-grades.csv"

# Update each record
$updated = 0
$notFound = 0

foreach ($student in $masterGrades) {
    $githubUsername = $student.GitHub_Username
    $currentId = $student.Student_ID
    
    if ($githubUsername) {
        $key = $githubUsername.ToLower()
        
        # Try to find by GitHub username
        if ($studentMap.ContainsKey($key)) {
            $info = $studentMap[$key]
            
            # Update name and ID
            $oldName = $student.Student_Name
            $oldId = $student.Student_ID
            
            $student.Student_Name = $info.FullName
            $student.Student_ID = $info.StudentID
            
            if ($oldName -ne $info.FullName -or $oldId -ne $info.StudentID) {
                Write-Host "✓ PR #$($student.PR_Number): " -ForegroundColor Green -NoNewline
                Write-Host "$oldName ($oldId)" -ForegroundColor Yellow -NoNewline
                Write-Host " → " -NoNewline
                Write-Host "$($info.FullName) ($($info.StudentID))" -ForegroundColor Cyan
                $updated++
            }
        }
        # Fallback: Try to find by Student_ID if exists and not UNKNOWN
        elseif ($currentId -and $currentId -ne "UNKNOWN" -and $studentById.ContainsKey($currentId)) {
            $info = $studentById[$currentId]
            
            $oldName = $student.Student_Name
            $oldId = $student.Student_ID
            
            $student.Student_Name = $info.FullName
            $student.Student_ID = $info.StudentID
            
            Write-Host "✓ PR #$($student.PR_Number): " -ForegroundColor Green -NoNewline
            Write-Host "$oldName ($oldId)" -ForegroundColor Yellow -NoNewline
            Write-Host " → " -NoNewline
            Write-Host "$($info.FullName) ($($info.StudentID)) [by ID]" -ForegroundColor Cyan
            $updated++
        }
        else {
            Write-Host "⚠ PR #$($student.PR_Number): " -ForegroundColor Yellow -NoNewline
            Write-Host "GitHub user '$githubUsername' (ID: $currentId) not found in TSV" -ForegroundColor Gray
            $notFound++
        }
    } else {
        Write-Host "⚠ PR #$($student.PR_Number): " -ForegroundColor Yellow -NoNewline
        Write-Host "No GitHub username" -ForegroundColor Gray
        $notFound++
    }
}

# Save updated CSV
$outputPath = "master-grades.csv"
$masterGrades | Export-Csv $outputPath -NoTypeInformation -Encoding UTF8

Write-Host "`nResults:" -ForegroundColor Cyan
Write-Host "--------" -ForegroundColor Cyan
Write-Host "  Updated: $updated" -ForegroundColor Green
Write-Host "  Not found in TSV: $notFound" -ForegroundColor Yellow
Write-Host "  Total records: $($masterGrades.Count)" -ForegroundColor Gray

Write-Host "`n✓ Saved to: $outputPath" -ForegroundColor Green

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "-----------" -ForegroundColor Cyan
Write-Host "1. Review the updated master-grades.csv" -ForegroundColor Gray
Write-Host "2. Re-run merge-test-results.ps1 to update automated grades" -ForegroundColor Gray
Write-Host "3. Check for any students not found in TSV" -ForegroundColor Gray
