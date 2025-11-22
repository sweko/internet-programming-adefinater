/**
 * Add Total_Bonus column to pr-test-results.csv
 * 
 * Calculates total bonus points from DataSource_Bonus and any future bonus categories
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

const INPUT_CSV = path.join(__dirname, 'pr-test-results.csv');
const OUTPUT_CSV = path.join(__dirname, 'pr-test-results-updated.csv');

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  📊 ADDING TOTAL_BONUS COLUMN');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Read existing test results
  const students = [];
  
  await new Promise((resolve, reject) => {
    fs.createReadStream(INPUT_CSV)
      .pipe(csv())
      .on('data', (row) => students.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`Loaded ${students.length} students from ${path.basename(INPUT_CSV)}\n`);

  // Calculate total bonus for each student
  const results = [];
  let totalBonusPoints = 0;
  
  for (const student of students) {
    const prNumber = parseInt(student.PR_Number);
    
    // Calculate total bonus (currently only DataSource_Bonus, but extensible)
    const dataSourceBonus = parseInt(student.DataSource_Bonus || 0);
    const totalBonus = dataSourceBonus; // Add more bonus sources here in future
    
    totalBonusPoints += totalBonus;
    
    // Add Total_Bonus column and update Total_Points
    const currentTotal = parseInt(student.Total_Points);
    const newTotal = currentTotal + totalBonus;
    
    if (totalBonus > 0) {
      console.log(`[PR #${prNumber}] ${student.Student_Name}: +${totalBonus} bonus (${currentTotal} → ${newTotal} pts)`);
    }
    
    results.push({
      ...student,
      Total_Bonus: totalBonus,
      Total_Points: newTotal // Update with bonus included
    });
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const studentsWithBonus = results.filter(s => parseInt(s.Total_Bonus) > 0);
  console.log(`  Students with bonus: ${studentsWithBonus.length}`);
  console.log(`  Total bonus awarded: ${totalBonusPoints} pts`);
  console.log(`  Average bonus per student: ${(totalBonusPoints / students.length).toFixed(2)} pts`);
  console.log(`  Average bonus (only recipients): ${(totalBonusPoints / studentsWithBonus.length).toFixed(2)} pts`);
  console.log('');

  // Get all column headers from first row, ensuring Total_Bonus comes before Total_Points
  const allKeys = Object.keys(students[0]);
  const reorderedKeys = [];
  
  // Add all columns up to Total_Points
  for (const key of allKeys) {
    if (key === 'Total_Points') {
      reorderedKeys.push('Total_Bonus'); // Insert Total_Bonus before Total_Points
      reorderedKeys.push('Total_Points');
    } else if (key !== 'Total_Bonus') {
      reorderedKeys.push(key);
    }
  }
  
  // Add Total_Bonus at the end if not already added
  if (!reorderedKeys.includes('Total_Bonus')) {
    reorderedKeys.push('Total_Bonus');
  }

  // Write updated CSV
  const csvWriter = createObjectCsvWriter({
    path: OUTPUT_CSV,
    header: reorderedKeys.map(key => ({ id: key, title: key }))
  });

  await csvWriter.writeRecords(results);

  console.log(`✓ Updated results written to: ${path.basename(OUTPUT_CSV)}\n`);
  console.log('Changes:');
  console.log('  - Added column: Total_Bonus (sum of all bonus categories)');
  console.log('  - Updated: Total_Points (now includes bonus points)');
  console.log('\n═══════════════════════════════════════════════════════════════\n');
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
