const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const MASTER_GRADES = path.join(__dirname, 'master-grades.csv');
const ADJUSTMENTS_FILE = path.join(__dirname, 'manual-adjustments.json');

// Load adjustments from JSON file
const adjustmentsData = JSON.parse(fs.readFileSync(ADJUSTMENTS_FILE, 'utf8'));

// Convert array format to object format for easier lookup
const adjustments = {};
adjustmentsData.adjustments.forEach(adj => {
  adjustments[adj.pr.toString()] = {
    points: adj.points,
    reason: adj.reason
  };
});

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
  console.log('\n Applying manual adjustments...\n');
  
  const students = await loadCSV(MASTER_GRADES);
  let updatedCount = 0;
  
  const updatedStudents = students.map(student => {
    const prNumber = student.PR_Number;
    
    if (!adjustments[prNumber]) {
      return student;
    }
    
    const { points: adjustmentPoints, reason: adjustmentReason } = adjustments[prNumber];
    const sign = adjustmentPoints > 0 ? '+' : '';
    
    // Check if this adjustment has already been applied (idempotency check)
    const adjustmentMarker = `Adjustment: ${sign}${adjustmentPoints} (${adjustmentReason})`;
    if (student.Notes && student.Notes.includes(adjustmentMarker)) {
      console.log(`  PR #${prNumber}: ${student.Student_Name}`);
      console.log(`   Already adjusted by ${sign}${adjustmentPoints} pts, skipping`);
      console.log('');
      return student;
    }
    
    const currentTotal = parseInt(student.Total_Points);
    const currentBonus = parseInt(student.Bonus_Points || 0);
    const currentDeduction = parseInt(student.Deductions || 0);
    
    let newTotal, newBonus, newDeduction;
    
    if (adjustmentPoints > 0) {
      newBonus = currentBonus + adjustmentPoints;
      newDeduction = currentDeduction;
      newTotal = currentTotal + adjustmentPoints;
    } else {
      newBonus = currentBonus;
      newDeduction = currentDeduction + Math.abs(adjustmentPoints);
      newTotal = currentTotal + adjustmentPoints;
    }
    
    const newFinalGrade = Math.max(Math.min((newTotal / 100) * 100, 100), 0);
    const symbol = adjustmentPoints > 0 ? '' : '';
    
    console.log(`${symbol} PR #${prNumber}: ${student.Student_Name}`);
    console.log(`   Adjustment: ${sign}${adjustmentPoints} pts (${adjustmentReason})`);
    console.log(`   Total: ${currentTotal}  ${newTotal} pts`);
    
    if (adjustmentPoints > 0) {
      console.log(`   Bonus: ${currentBonus}  ${newBonus} pts`);
    } else {
      console.log(`   Deduction: ${currentDeduction}  ${newDeduction} pts`);
    }
    
    console.log(`   Final Grade: ${student.Final_Grade}  ${newFinalGrade.toFixed(0)}%\n`);
    
    updatedCount++;
    
    return {
      ...student,
      Bonus_Points: newBonus.toString(),
      Deductions: newDeduction.toString(),
      Total_Points: newTotal.toString(),
      Final_Grade: `${newFinalGrade.toFixed(0)}%`,
      Notes: student.Notes + ` | Adjustment: ${sign}${adjustmentPoints} (${adjustmentReason})`
    };
  });
  
  const csvWriter = createCsvWriter({
    path: MASTER_GRADES,
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
  
  await csvWriter.writeRecords(updatedStudents);
  
  console.log(` Applied adjustments to ${updatedCount} student(s)`);
  console.log(` Updated master-grades.csv\n`);
}

main().catch(console.error);
