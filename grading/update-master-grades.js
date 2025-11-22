const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const MASTER_GRADES_AUTOMATED = path.join(__dirname, 'master-grades-with-automated.csv');
const PR_TEST_RESULTS = path.join(__dirname, 'pr-test-results.csv');
const OUTPUT_CSV = path.join(__dirname, 'master-grades.csv');

async function loadCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

async function main() {
  console.log('\n📊 Updating master-grades.csv...\n');

  // Load both CSV files
  const masterGrades = await loadCSV(MASTER_GRADES_AUTOMATED);
  const prTestResults = await loadCSV(PR_TEST_RESULTS);

  console.log(`Loaded ${masterGrades.length} records from master-grades-with-automated.csv`);
  console.log(`Loaded ${prTestResults.length} records from pr-test-results.csv`);

  // Create a map of PR test results for quick lookup
  const prResultsMap = new Map();
  prTestResults.forEach(pr => {
    prResultsMap.set(pr.PR_Number, pr);
  });

  // Update master grades with latest data from PR test results
  const updatedGrades = masterGrades.map(student => {
    const prNumber = student.PR_Number;
    const prResult = prResultsMap.get(prNumber);

    if (!prResult) {
      console.log(`⚠️  PR #${prNumber} not found in test results`);
      return student;
    }

    // Get bonus from pr-test-results (Total_Bonus column)
    const totalBonus = parseInt(prResult.Total_Bonus || 0);
    const dataSourceBonus = parseInt(prResult.DataSource_Bonus || 0);

    // Get tier scores from pr-test-results
    const tier1 = parseInt(prResult.Tier1_Points || 0);
    const tier2 = parseInt(prResult.Tier2_Points || 0);
    const tier3 = parseInt(prResult.Tier3_Points || 0);
    const totalPoints = parseInt(prResult.Total_Points || 0);
    const finalGrade = parseFloat(prResult.Final_Grade || 0);

    // Build bonus note
    let bonusNote = '';
    if (dataSourceBonus > 0) {
      bonusNote = `Multiple HTTP sources (+${dataSourceBonus})`;
    }

    // Calculate Final_Grade based on Total_Points (capped at 100%)
    const calculatedFinalGrade = Math.min((totalPoints / 100) * 100, 100);

    // Build notes
    const autoTestNote = `AutoTest: ${calculatedFinalGrade.toFixed(0)}% | T1=${tier1}/60 (${((tier1/60)*100).toFixed(0)}%) | T2=${tier2}/25 (${((tier2/25)*100).toFixed(0)}%) | T3=${tier3}/40 (${((tier3/40)*100).toFixed(0)}%)`;
    const bonusSection = totalBonus > 0 ? ` | Bonus: +${totalBonus}` : '';
    const dataSourceNote = prResult.DataSource_Note || '';
    
    let notes = autoTestNote + bonusSection;
    if (dataSourceNote) {
      notes += ` | ${dataSourceNote}`;
    }

    return {
      PR_Number: student.PR_Number,
      Student_Name: student.Student_Name,
      Student_ID: student.Student_ID,
      Submission_Date: student.Submission_Date,
      GitHub_Username: student.GitHub_Username,
      Total_Points: totalPoints.toString(),
      Final_Grade: `${calculatedFinalGrade.toFixed(0)}%`,
      Files_Changed: student.Files_Changed,
      Tier1_Score: tier1.toString(),
      Tier2_Score: tier2.toString(),
      Tier3_Score: tier3.toString(),
      Bonus_Points: totalBonus.toString(),
      Deductions: '', // Will be populated later when we implement deductions
      Design_Analysis: student.Design_Analysis || '',
      Notes: notes
    };
  });

  // Write updated master grades
  const csvWriter = createCsvWriter({
    path: OUTPUT_CSV,
    header: [
      { id: 'PR_Number', title: 'PR_Number' },
      { id: 'Student_Name', title: 'Student_Name' },
      { id: 'Student_ID', title: 'Student_ID' },
      { id: 'Submission_Date', title: 'Submission_Date' },
      { id: 'GitHub_Username', title: 'GitHub_Username' },
      { id: 'Total_Points', title: 'Total_Points' },
      { id: 'Final_Grade', title: 'Final_Grade' },
      { id: 'Files_Changed', title: 'Files_Changed' },
      { id: 'Tier1_Score', title: 'Tier1_Score' },
      { id: 'Tier2_Score', title: 'Tier2_Score' },
      { id: 'Tier3_Score', title: 'Tier3_Score' },
      { id: 'Bonus_Points', title: 'Bonus_Points' },
      { id: 'Deductions', title: 'Deductions' },
      { id: 'Design_Analysis', title: 'Design_Analysis' },
      { id: 'Notes', title: 'Notes' }
    ]
  });

  await csvWriter.writeRecords(updatedGrades);

  console.log(`\n✅ Updated master-grades.csv with latest test results`);

  // Show summary
  const studentsWithBonus = updatedGrades.filter(s => parseInt(s.Bonus_Points) > 0);
  const totalBonusAwarded = studentsWithBonus.reduce((sum, s) => sum + parseInt(s.Bonus_Points), 0);
  const avgScore = updatedGrades.reduce((sum, s) => sum + parseInt(s.Total_Points), 0) / updatedGrades.length;

  console.log('\n📈 SUMMARY:');
  console.log(`   Total students: ${updatedGrades.length}`);
  console.log(`   Students with bonus: ${studentsWithBonus.length}`);
  console.log(`   Total bonus awarded: ${totalBonusAwarded} pts`);
  console.log(`   Average total score: ${avgScore.toFixed(1)} pts`);
  console.log(`   Average final grade: ${(avgScore).toFixed(0)}%`);

  // Show sample records
  console.log('\n📋 SAMPLE RECORDS:');
  updatedGrades.slice(0, 5).forEach(student => {
    const bonusMarker = parseInt(student.Bonus_Points) > 0 ? '✨' : '  ';
    console.log(`   ${bonusMarker} PR #${student.PR_Number}: ${student.Student_Name} - ${student.Total_Points} pts (${student.Final_Grade}) | Bonus: ${student.Bonus_Points}`);
  });

  console.log('\n');
}

main().catch(console.error);
