#!/usr/bin/env node

/**
 * Fetch All Pull Requests Script
 * 
 * This script makes a direct GitHub API call to retrieve all open PRs
 * and saves them to prs-raw.json in the correct format.
 */

const https = require('https');
const fs = require('fs');

const REPO_OWNER = 'sweko';
const REPO_NAME = 'internet-programming-adefinater';
const PER_PAGE = 100;

console.log('Fetching All Pull Requests from GitHub API');
console.log('==========================================\n');

const options = {
  hostname: 'api.github.com',
  path: `/repos/${REPO_OWNER}/${REPO_NAME}/pulls?state=open&per_page=${PER_PAGE}`,
  method: 'GET',
  headers: {
    'User-Agent': 'Node.js-PR-Fetcher',
    'Accept': 'application/vnd.github.v3+json'
  }
};

https.get(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const prs = JSON.parse(data);
      
      if (!Array.isArray(prs)) {
        console.error('Error: Expected array of PRs, got:', typeof prs);
        process.exit(1);
      }

      console.log(`✓ Fetched ${prs.length} pull requests\n`);

      // Simplify PR data to only what we need
      const simplifiedPrs = prs.map(pr => ({
        id: pr.id,
        number: pr.number,
        state: pr.state,
        locked: pr.locked,
        title: pr.title,
        body: pr.body || '',
        created_at: pr.created_at,
        updated_at: pr.updated_at,
        user: {
          login: pr.user.login,
          id: pr.user.id
        },
        html_url: pr.html_url
      }));

      // Write to prs-raw.json
      const output = {
        prs: simplifiedPrs
      };

      fs.writeFileSync('prs-raw.json', JSON.stringify(output, null, 2), 'utf8');
      
      console.log(`✓ Saved ${simplifiedPrs.length} PRs to prs-raw.json\n`);
      
      // Show sample
      console.log('Sample PRs:');
      console.log('-----------');
      simplifiedPrs.slice(0, 5).forEach(pr => {
        console.log(`#${pr.number}: ${pr.title}`);
        console.log(`  User: ${pr.user.login}`);
        console.log(`  Created: ${pr.created_at}\n`);
      });

      console.log('\nNext step: Run populate-from-raw.js to process data');
      console.log('  node populate-from-raw.js');

    } catch (error) {
      console.error('Error parsing response:', error.message);
      process.exit(1);
    }
  });
}).on('error', (error) => {
  console.error('Error fetching PRs:', error.message);
  process.exit(1);
});
