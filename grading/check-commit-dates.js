const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const REPO_OWNER = 'sweko';
const REPO_NAME = 'internet-programming-adefinater';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Deadline dates - CONFIRMED (inclusive - commits ON these days are OK, AFTER is suspicious)
const TUESDAY_DEADLINE = new Date('2025-11-06T00:00:00Z');  // Alternative One (PR 1-44) - After Tuesday Nov 5, 2025
const THURSDAY_DEADLINE = new Date('2025-11-08T00:00:00Z'); // Alternative Two (PR 45-64) - After Thursday Nov 7, 2025

// Get PR numbers from command line or use all
const prNumbers = process.argv.slice(2).length > 0 
  ? process.argv.slice(2).map(n => parseInt(n))
  : Array.from({length: 64}, (_, i) => i + 1);

async function fetchCommits(prNumber) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${REPO_OWNER}/${REPO_NAME}/pulls/${prNumber}/commits`,
      method: 'GET',
      headers: {
        'User-Agent': 'Node.js-Commit-Checker',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    // Add authentication if token is available
    if (GITHUB_TOKEN) {
      options.headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    }

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

async function checkPR(prNumber) {
  try {
    const commits = await fetchCommits(prNumber);
    const deadline = prNumber <= 44 ? TUESDAY_DEADLINE : THURSDAY_DEADLINE;
    const deadlineName = prNumber <= 44 ? 'Tuesday Nov 5' : 'Thursday Nov 7';
    
    const lateCommits = commits.filter(commit => {
      const commitDate = new Date(commit.commit.author.date);
      return commitDate >= deadline;  // Changed to >= since deadline is start of next day
    });

    if (lateCommits.length > 0) {
      console.log(`\n⚠️  PR #${prNumber} - ${lateCommits.length} commit(s) AFTER ${deadlineName}:`);
      lateCommits.forEach(commit => {
        const date = new Date(commit.commit.author.date);
        console.log(`   ${date.toISOString()} - ${commit.commit.message.split('\n')[0]}`);
      });
      return { pr: prNumber, lateCommits: lateCommits.length, commits: lateCommits };
    }
    
    return null;
  } catch (error) {
    console.error(`Error checking PR #${prNumber}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('\n🔍 Checking for commits after deadline...\n');
  console.log('Alternative One (PR 1-44): Tuesday Nov 5 deadline (commits after Tuesday are late)');
  console.log('Alternative Two (PR 45-64): Thursday Nov 7 deadline (commits after Thursday are late)');
  
  if (GITHUB_TOKEN) {
    console.log('✓ Using GitHub token for authentication\n');
  } else {
    console.log('⚠️  No GitHub token found - may hit rate limits\n');
  }

  const suspicious = [];
  
  for (const prNumber of prNumbers) {
    const result = await checkPR(prNumber);
    if (result) suspicious.push(result);
    
    // Rate limiting: wait 100ms between requests (with token we can go faster)
    await new Promise(resolve => setTimeout(resolve, GITHUB_TOKEN ? 100 : 1000));
  }

  console.log(`\n\n📊 Summary: ${suspicious.length} PR(s) with late commits\n`);
  
  if (suspicious.length > 0) {
    fs.writeFileSync('late-commits.json', JSON.stringify(suspicious, null, 2));
    console.log('✓ Saved details to late-commits.json\n');
  }
}

main().catch(console.error);
