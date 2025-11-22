const fs = require('fs');

const lines = fs.readFileSync('pr-test-results.csv', 'utf8')
  .split('\n')
  .slice(1)
  .filter(l => l.trim());

const scores = lines.map(l => parseFloat(l.split(',')[5]));

const distribution = {};
scores.forEach(s => {
  const bucket = Math.round(s / 10) * 10;
  distribution[bucket] = (distribution[bucket] || 0) + 1;
});

console.log('Score Distribution (by 10% buckets):\n');
Object.entries(distribution)
  .sort((a, b) => a[0] - b[0])
  .forEach(([score, count]) => {
    const bar = '█'.repeat(Math.ceil(count / 2));
    console.log(`  ${score}%: ${bar} (${count} students)`);
  });

console.log('\n\nExact Score Breakdown:\n');
const exactScores = {};
lines.forEach(line => {
  const [pr, name, user, total, max, pct] = line.split(',');
  const score = parseInt(total);
  if (!exactScores[score]) exactScores[score] = [];
  exactScores[score].push(name);
});

Object.entries(exactScores)
  .sort((a, b) => b[0] - a[0])
  .forEach(([score, names]) => {
    console.log(`  ${score}/60 pts: ${names.length} students`);
  });
