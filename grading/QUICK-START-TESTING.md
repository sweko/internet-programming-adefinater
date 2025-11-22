# Quick Start: Automated Browser Testing

## TL;DR

Save 4.5 hours of manual testing with automated browser tests!

## Setup (One Time Only)

```powershell
# Set GitHub token (avoid rate limits - optional but recommended)
$env:GITHUB_TOKEN="your_github_personal_access_token"

# Install dependencies
cd grading
npm install
npx playwright install chromium
```

## Run Tests (3 minutes for all 64 students)

⚠️ **IMPORTANT:** Use `test-prs-directly.js` since student code is in PRs!

```powershell
node test-prs-directly.js --parallel=5
```

## Merge Results

```powershell
# Note: Script expects pr-test-results.csv (from test-prs-directly.js)
# You may need to update merge-test-results.ps1 to read from pr-test-results.csv
.\merge-test-results.ps1
```

## What You Get

- ✅ Tier 1 scores automatically filled in `master-grades-with-automated.csv`
- ✅ Detailed test results in `automated-test-results.csv`
- ✅ Students with issues flagged for manual review

## What You Still Need to Grade Manually

- Tier 2 (edge cases)
- Tier 3 (advanced features)
- Bonus features
- Design analysis (AI detection)

## Time Savings

- **Before:** 5.5 hours of manual testing
- **After:** 40 minutes (setup + review)
- **Saved:** 4.5 hours! 🎉
