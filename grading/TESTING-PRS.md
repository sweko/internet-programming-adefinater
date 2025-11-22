# Testing Student PRs - Complete Guide

## The Problem

- Student starter templates are in `students/` folder
- Student **actual submissions** are in their **GitHub PRs**
- We need to test the PR code, not the starter templates!

## The Solution

Use `test-prs-directly.js` to:
1. Fetch file contents directly from GitHub PRs
2. Create temporary test directories
3. Test each PR in a real browser
4. Generate results CSV

## Setup (One Time)

### 1. Get GitHub Personal Access Token (Optional but Recommended)

Without a token, you're limited to 60 API requests/hour. With a token, you get 5,000/hour.

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo` (full control of private repositories)
4. Generate and copy the token

Set it in PowerShell:
```powershell
$env:GITHUB_TOKEN="ghp_your_token_here"

# To persist across sessions, add to your PowerShell profile:
[System.Environment]::SetEnvironmentVariable('GITHUB_TOKEN', 'ghp_your_token_here', 'User')
```

### 2. Install Dependencies

```powershell
cd grading
npm install
npx playwright install chromium
```

## Usage

### Test All 64 PRs (Parallel for Speed)

```powershell
node test-prs-directly.js --parallel=5
```

**What happens:**
1. Reads `pr-data.json` to get list of PRs
2. For each PR:
   - Fetches HTML, JS, CSS files from GitHub API
   - Creates temporary directory with these files
   - Opens in browser and runs tests
   - Records results
3. Generates `pr-test-results.csv`

**Time:** ~5-10 minutes for all 64 PRs (depends on parallel setting)

### Test Specific PR

```powershell
node test-prs-directly.js --pr=64
```

Useful for debugging individual student issues.

### Adjust Parallelism

```powershell
# Slower, less memory
node test-prs-directly.js --parallel=3

# Faster, more memory
node test-prs-directly.js --parallel=10
```

## Output

### pr-test-results.csv

Same structure as `automated-test-results.csv` but with PR numbers:

| Column | Description |
|--------|-------------|
| `PR_Number` | GitHub PR number (1-64) |
| `Student_Name` | Parsed from PR title |
| `GitHub_Username` | GitHub login |
| `Total_Points` | Points earned (0-60) |
| `Percentage` | Score percentage |
| `Data_Loads` | Data loading test (0-10 pts) |
| `Loading_Indicator` | Loading UI test (0-3 pts) |
| `Error_Handling` | Error handling test (0-2 pts) |
| ... | (other test columns) |
| `Errors` | Any errors encountered |

### temp-pr-tests/ Directory

Temporary directories created for each PR test:
- `temp-pr-tests/pr-1/` - PR #1 files
- `temp-pr-tests/pr-2/` - PR #2 files
- etc.

**Note:** Files persist after testing for debugging. Delete manually if needed.

## Merge Results into Master Grades

```powershell
.\merge-test-results.ps1
```

This script:
- Reads `pr-test-results.csv` (or `automated-test-results.csv`)
- Matches by PR number or GitHub username
- Updates `master-grades.csv` with Tier1_Score
- Creates `master-grades-with-automated.csv`

## Troubleshooting

### "GitHub API error: 403"

**Cause:** Rate limit exceeded (60 requests/hour without token)

**Solution:** Set `GITHUB_TOKEN` environment variable

### "No HTML file found in PR"

**Cause:** Student PR doesn't contain an `index.html` file

**Solution:** Check PR manually, may need manual review

### "Test timeout"

**Cause:** Student's page takes too long to load or has infinite loops

**Solution:** Review that student's code manually

### "Failed to fetch PR files"

**Cause:** Network issue or PR doesn't exist

**Solution:** Check internet connection and verify PR number

## How It Works

### 1. Fetch PR Files from GitHub

```javascript
GET /repos/sweko/internet-programming-adefinater/pulls/:pr/files
```

Returns list of changed files with their raw URLs.

### 2. Download Raw Content

For each file (HTML, JS, CSS):
```javascript
GET https://raw.githubusercontent.com/.../index.html
```

### 3. Create Temporary Directory

```
grading/temp-pr-tests/pr-64/
  ├── index.html (from PR)
  ├── script.js (from PR)
  ├── styles.css (from PR)
  └── doctor-who-episodes.json (copied from data/)
```

### 4. Test in Browser

Same tests as `automated-browser-test.js`:
- Data loads
- Table renders
- Sorting works
- Filtering works
- etc.

### 5. Clean Up (Optional)

Temp directories persist for debugging. Delete manually:
```powershell
Remove-Item temp-pr-tests -Recurse -Force
```

## Comparison: Two Methods

### test-prs-directly.js ✅ (RECOMMENDED)

**Pros:**
- Tests actual PR submissions
- No need to check out PRs locally
- Always tests latest version
- Matches PR numbers directly

**Cons:**
- Requires GitHub API access
- Slower due to network requests
- Rate limited without token

**When to use:** Always, for grading student PRs

### automated-browser-test.js

**Pros:**
- Faster (no network requests)
- No API limits
- Works offline

**Cons:**
- Requires checking out all PRs locally first
- Tests whatever is in `students/` folder
- Extra manual work

**When to use:** Only if you've already checked out all PRs into separate folders

## Next Steps

1. ✅ Run `test-prs-directly.js --parallel=5`
2. ✅ Review `pr-test-results.csv`
3. ✅ Run `merge-test-results.ps1`
4. ✅ Check `master-grades-with-automated.csv`
5. ⏭️ Continue with manual Tier 2, Tier 3, bonus grading
6. ⏭️ Use individual `student-checklists/` for detailed tracking

## API Rate Limits

**Without GitHub Token:**
- 60 requests per hour
- Testing 64 PRs = ~128-192 requests (2-3 per PR)
- Will take multiple hours due to rate limiting

**With GitHub Token:**
- 5,000 requests per hour
- Testing 64 PRs completes in ~5-10 minutes

**Recommendation:** Set up GitHub token for better experience!
