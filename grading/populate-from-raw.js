/**
 * Populate PR Data from GitHub MCP Response
 * 
 * This script converts the GitHub MCP PR list into the format needed
 * by extract-pr-data.js
 * 
 * Usage:
 * 1. Save the PR array from mcp_github_list_pull_requests to prs-raw.json
 * 2. Run: node populate-from-raw.js
 */

const fs = require('fs');

console.log('Populating PR Data from Raw GitHub Response');
console.log('===========================================\n');

// Check if raw file exists
if (!fs.existsSync('prs-raw.json')) {
    console.log('Creating template prs-raw.json...');
    console.log('Please paste the PR array from GitHub MCP into this file.\n');
    
    const template = {
        instructions: "Paste the PR array from mcp_github_list_pull_requests here",
        note: "This should be the raw array of PR objects",
        prs: []
    };
    
    fs.writeFileSync('prs-raw.json', JSON.stringify(template, null, 2));
    console.log('Template created: prs-raw.json');
    console.log('Edit this file and run the script again.\n');
    process.exit(0);
}

// Read raw PR data
const rawData = JSON.parse(fs.readFileSync('prs-raw.json', 'utf8'));
const rawPrs = rawData.prs || rawData;

if (!Array.isArray(rawPrs) || rawPrs.length === 0) {
    console.error('Error: No PR data found in prs-raw.json');
    console.error('Make sure the "prs" field contains an array of PR objects.\n');
    process.exit(1);
}

console.log(`Found ${rawPrs.length} pull requests\n`);

// Transform to simplified format
const simplifiedPrs = rawPrs.map(pr => ({
    number: pr.number,
    title: pr.title,
    created_at: pr.created_at,
    updated_at: pr.updated_at,
    user: {
        login: pr.user.login,
        id: pr.user.id
    },
    state: pr.state,
    html_url: pr.html_url
}));

// Create output data
const outputData = {
    generated: new Date().toISOString(),
    totalCount: simplifiedPrs.length,
    prs: simplifiedPrs
};

// Write to pr-data.json
fs.writeFileSync('pr-data.json', JSON.stringify(outputData, null, 2));

console.log('✓ Successfully populated pr-data.json');
console.log(`  Total PRs: ${simplifiedPrs.length}`);
console.log(`  Generated: ${outputData.generated}\n`);

// Show sample of first few PRs
console.log('Sample PRs:');
console.log('-----------');
simplifiedPrs.slice(0, 5).forEach(pr => {
    console.log(`#${pr.number}: ${pr.title}`);
    console.log(`  User: ${pr.user.login}`);
    console.log(`  Created: ${pr.created_at}`);
    console.log('');
});

if (simplifiedPrs.length > 5) {
    console.log(`... and ${simplifiedPrs.length - 5} more\n`);
}

console.log('Next step: Run extract-pr-data.js to generate grading CSVs');
console.log('  node extract-pr-data.js\n');
