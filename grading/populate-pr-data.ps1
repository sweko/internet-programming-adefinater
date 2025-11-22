# PowerShell script to populate PR data from GitHub
# This script should be run after the GitHub MCP tools are activated

Write-Host "PR Data Population Script" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Note: This is a template script
# The actual PR fetching is done through the Copilot GitHub MCP tools
# This script documents the process

Write-Host "Instructions:" -ForegroundColor Yellow
Write-Host "1. This script documents the PR data structure needed" -ForegroundColor Gray
Write-Host "2. Use the GitHub Copilot MCP tool: mcp_github_list_pull_requests" -ForegroundColor Gray
Write-Host "3. Parameters: owner='sweko', repo='internet-programming-adefinater', state='open'" -ForegroundColor Gray
Write-Host "4. Save the result to pr-data.json" -ForegroundColor Gray
Write-Host ""

Write-Host "Expected pr-data.json structure:" -ForegroundColor Yellow
Write-Host @"
{
  "generated": "2025-11-06T21:00:00Z",
  "totalCount": 64,
  "prs": [
    {
      "number": 64,
      "title": "Aljban Ramuka 5903",
      "created_at": "2025-11-06T18:39:54Z",
      "updated_at": "2025-11-06T18:39:54Z",
      "user": {
        "login": "Aljban-ramuka",
        "id": 183841236
      },
      "state": "open",
      "html_url": "https://github.com/sweko/internet-programming-adefinater/pull/64"
    }
  ]
}
"@ -ForegroundColor Gray

Write-Host ""
Write-Host "After populating pr-data.json, run:" -ForegroundColor Yellow
Write-Host "  node extract-pr-data.js" -ForegroundColor White
Write-Host ""
