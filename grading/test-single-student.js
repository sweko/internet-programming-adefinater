#!/usr/bin/env node

/**
 * Test a single student submission from a specific folder
 * Usage: node test-single-student.js <path-to-student-folder>
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');

const TIMEOUT = 30000;
const HTTP_PORT = 8766;

// Import test definitions
const { TESTS } = require('./automated-browser-test.js');

async function startServer(folderPath) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(folderPath, req.url === '/' ? 'index.html' : req.url);
      
      const ext = path.extname(filePath);
      const contentType = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json'
      }[ext] || 'text/plain';

      fs.readFile(filePath, (err, content) => {
        if (err) {
          if (err.code === 'ENOENT') {
            res.writeHead(404);
            res.end('File not found');
          } else {
            res.writeHead(500);
            res.end('Server error');
          }
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content);
        }
      });
    });

    server.listen(HTTP_PORT, () => {
      console.log(`Test server started on http://localhost:${HTTP_PORT}`);
      resolve(server);
    });

    server.on('error', reject);
  });
}

async function runTests(folderPath) {
  const config = {
    name: 'Doctor Who Episodes',
    columns: ['rank', 'title', 'series', 'era', 'broadcast', 'director', 'writer', 'doctor', 'companion', 'cast'],
    minColumnCount: 9,
    filterTestQuery: 'Doctor',
    expectedRows: 100,
  };

  const server = await startServer(folderPath);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = {
    folder: folderPath,
    tier1: 0,
    tier2: 0,
    tier3: 0,
    total: 0,
    details: []
  };

  try {
    await page.goto(`http://localhost:${HTTP_PORT}`, { waitUntil: 'networkidle', timeout: TIMEOUT });
    
    // Run all tests
    for (const [key, test] of Object.entries(TESTS)) {
      try {
        const passed = await test.test(page, config);
        const points = passed ? test.points : 0;
        
        results.details.push({
          name: test.name,
          tier: test.tier,
          maxPoints: test.points,
          earned: points,
          passed: passed
        });

        if (test.tier === 1) results.tier1 += points;
        else if (test.tier === 2) results.tier2 += points;
        else if (test.tier === 3) results.tier3 += points;
        
        results.total += points;

        console.log(`${passed ? '✅' : '❌'} ${test.name} (${points}/${test.points} pts)`);
      } catch (error) {
        console.log(`❌ ${test.name} - ERROR: ${error.message}`);
        results.details.push({
          name: test.name,
          tier: test.tier,
          maxPoints: test.points,
          earned: 0,
          passed: false,
          error: error.message
        });
      }
    }

  } catch (error) {
    console.error('Failed to load page:', error.message);
  } finally {
    await browser.close();
    server.close();
  }

  // Calculate totals
  const tier1Total = results.details.filter(t => t.tier === 1).reduce((sum, t) => sum + t.maxPoints, 0);
  const tier2Total = results.details.filter(t => t.tier === 2).reduce((sum, t) => sum + t.maxPoints, 0);
  const tier3Total = results.details.filter(t => t.tier === 3).reduce((sum, t) => sum + t.maxPoints, 0);

  console.log('\n' + '='.repeat(60));
  console.log('RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`Tier 1: ${results.tier1}/${tier1Total} (${Math.round(results.tier1/tier1Total*100)}%)`);
  console.log(`Tier 2: ${results.tier2}/${tier2Total} (${Math.round(results.tier2/tier2Total*100)}%)`);
  console.log(`Tier 3: ${results.tier3}/${tier3Total} (${Math.round(results.tier3/tier3Total*100)}%)`);
  console.log(`TOTAL: ${results.total}/100`);
  console.log('='.repeat(60));

  return results;
}

// Main
const studentFolder = process.argv[2];
if (!studentFolder) {
  console.error('Usage: node test-single-student.js <path-to-student-folder>');
  process.exit(1);
}

const resolvedPath = path.resolve(studentFolder);
if (!fs.existsSync(resolvedPath)) {
  console.error(`Folder not found: ${resolvedPath}`);
  process.exit(1);
}

console.log(`Testing: ${resolvedPath}\n`);
runTests(resolvedPath).then(() => {
  console.log('\nTest complete!');
  process.exit(0);
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
