/**
 * PR Data Extraction Script
 * Extracts PR information and generates grading CSVs
 * 
 * Usage: node extract-pr-data.js
 * Requires: GitHub PR data (paste from mcp_github_list_pull_requests)
 */

const fs = require('fs');
const path = require('path');

// This would be populated with actual PR data from GitHub MCP
// For now, it's a template showing the structure
const PRS_DATA_FILE = 'pr-data.json';

/**
 * Parse student name and ID from PR title
 * Examples: 
 *   "Aljban Ramuka 5903" -> {name: "Aljban Ramuka", id: "5903"}
 *   "midterm5900" -> {name: "Unknown", id: "5900"}
 *   "[Midterm-Exam] Narcis Nacev 5824" -> {name: "Narcis Nacev", id: "5824"}
 */
function parseStudentInfo(title) {
    // Remove common prefixes
    let cleaned = title
        .replace(/\[?midterm-?exam\]?/i, '')
        .replace(/^midterm/i, '')
        .replace(/^<|>$/g, '')
        .trim();
    
    // Try to extract ID (4 digits)
    const idMatch = cleaned.match(/\b(\d{4})\b/);
    const studentId = idMatch ? idMatch[1] : 'UNKNOWN';
    
    // Remove the ID to get the name
    let studentName = cleaned.replace(/\b\d{4}\b/, '').trim();
    
    // Clean up extra spaces and punctuation
    studentName = studentName.replace(/\s+/g, ' ').replace(/^[-\s]+|[-\s]+$/g, '');
    
    if (!studentName) {
        studentName = 'UNKNOWN';
    }
    
    return {
        name: studentName,
        id: studentId
    };
}

/**
 * Generate master grading CSV with all students
 */
function generateMasterCSV(prs) {
    const headers = [
        'PR_Number',
        'Student_Name',
        'Student_ID',
        'Submission_Date',
        'GitHub_Username',
        'Files_Changed',
        'Tier1_Score',
        'Tier2_Score',
        'Tier3_Score',
        'Bonus_Points',
        'Deductions',
        'Total_Points',
        'Final_Grade',
        'Design_Analysis',
        'Notes'
    ].join(',');
    
    const rows = prs.map(pr => {
        const student = parseStudentInfo(pr.title);
        const submissionDate = new Date(pr.created_at).toISOString().split('T')[0];
        
        return [
            pr.number,
            `"${student.name}"`,
            student.id,
            submissionDate,
            pr.user.login,
            0, // Files changed - to be filled manually or by file checker
            '', // Tier1 - manual grading
            '', // Tier2 - manual grading
            '', // Tier3 - manual grading
            '', // Bonus - manual grading
            '', // Deductions - manual grading
            '', // Total - formula
            '', // Final - formula
            '', // Design analysis - manual
            '""' // Notes - manual
        ].join(',');
    });
    
    return [headers, ...rows].join('\n');
}

/**
 * Generate individual student grading checklist CSV template
 */
function generateStudentChecklistTemplate() {
    const checklist = [
        ['Category', 'Item', 'Max_Points', 'Earned_Points', 'Notes'],
        
        // Tier 1: Basic Functionality (60 points)
        ['TIER_1', '=== DATA LOADING (15 pts) ===', '', '', ''],
        ['TIER_1_DATA', 'Successfully fetches from URL', '10', '', ''],
        ['TIER_1_DATA', 'Shows loading indicator', '3', '', ''],
        ['TIER_1_DATA', 'Displays error message on fail', '2', '', ''],
        
        ['TIER_1', '=== EPISODE DISPLAY (25 pts) ===', '', '', ''],
        ['TIER_1_DISPLAY', 'All columns present and correct', '15', '', ''],
        ['TIER_1_DISPLAY', 'Proper data formatting', '6', '', ''],
        ['TIER_1_DISPLAY', 'Semantic table structure', '4', '', ''],
        
        ['TIER_1', '=== SORTING (15 pts) ===', '', '', ''],
        ['TIER_1_SORT', 'Clicking headers sorts table', '8', '', ''],
        ['TIER_1_SORT', 'Toggle ascending/descending', '4', '', ''],
        ['TIER_1_SORT', 'Visual sort indicator', '3', '', ''],
        
        ['TIER_1', '=== FILTERING (10 pts) ===', '', '', ''],
        ['TIER_1_FILTER', 'Filter works correctly', '7', '', ''],
        ['TIER_1_FILTER', 'Real-time or clear trigger', '3', '', ''],
        
        ['TIER_1', 'TIER 1 SUBTOTAL', '60', '=SUM(D2:D11)', ''],
        
        // Tier 2: Edge Case Handling (25 points)
        ['TIER_2', '=== DATA ROBUSTNESS (15 pts) ===', '', '', ''],
        ['TIER_2_EDGE', 'Null companion handling', '5', '', ''],
        ['TIER_2_EDGE', 'Empty cast arrays', '3', '', ''],
        ['TIER_2_EDGE', 'Multiple writers display', '4', '', ''],
        ['TIER_2_EDGE', 'Special characters rendering', '3', '', ''],
        
        ['TIER_2', '=== DISPLAY FORMATTING (10 pts) ===', '', '', ''],
        ['TIER_2_FORMAT', 'Special chars render correctly', '4', '', ''],
        ['TIER_2_FORMAT', 'Error messages clear', '3', '', ''],
        ['TIER_2_FORMAT', 'Missing/null values graceful', '3', '', ''],
        
        ['TIER_2', 'TIER 2 SUBTOTAL', '25', '=SUM(D14:D20)', ''],
        
        // Tier 3: Advanced Features
        ['TIER_3', '=== ADVANCED FEATURES (15 pts) ===', '', '', ''],
        ['TIER_3_ADV', 'Performance Optimization', '5', '', 'Implemented? Y/N'],
        ['TIER_3_ADV', 'Keyboard Navigation', '5', '', 'Implemented? Y/N'],
        ['TIER_3_ADV', 'Smart Relevance Sort', '5', '', 'Implemented? Y/N'],
        ['TIER_3_ADV', 'Data Validation', '5', '', 'Implemented? Y/N'],
        ['TIER_3_ADV', 'Additional Filters', '5', '', 'Implemented? Y/N'],
        ['TIER_3_ADV', 'Multi-Column Sort', '5', '', 'Implemented? Y/N'],
        ['TIER_3_ADV', 'Export to CSV', '5', '', 'Implemented? Y/N'],
        ['TIER_3_ADV', 'Decade Grouping', '5', '', 'Implemented? Y/N'],
        ['TIER_3_ADV', 'Custom Feature', '5', '', 'Implemented? Y/N'],
        
        ['TIER_3', 'TIER 3 SUBTOTAL (min 2 features = 10 pts)', '15', '', 'Count implemented'],
        
        // Bonus Points
        ['BONUS', '=== BONUS FEATURES ===', '', '', ''],
        ['BONUS_FEAT', 'Additional advanced features (5 pts each)', '25', '', ''],
        ['BONUS_CODE', 'Exceptional code quality', '5', '', ''],
        ['BONUS_UI', 'Outstanding UI/UX', '5', '', ''],
        ['BONUS_CREATIVE', 'Creative problem solving', '5', '', ''],
        ['BONUS_MULTI', 'Multiple URL data loading', '5', '', ''],
        
        ['BONUS', 'BONUS SUBTOTAL', '45', '', ''],
        
        // Deductions
        ['DEDUCTIONS', '=== AUTOMATIC DEDUCTIONS ===', '', '', ''],
        ['DED_CRITICAL', 'Code does not run at all', '-20', '', ''],
        ['DED_CRITICAL', 'Crashes on page load', '-15', '', ''],
        ['DED_CRITICAL', 'Crashes on interaction', '-10', '', ''],
        ['DED_CRITICAL', 'Missing required files', '-10', '', ''],
        ['DED_CRITICAL', 'Uses local data file', '-10', '', ''],
        ['DED_MAJOR', 'Console errors on load', '-8', '', ''],
        ['DED_MAJOR', 'Required feature missing', '-5', '', ''],
        ['DED_MAJOR', 'Non-functional core feature', '-5', '', ''],
        ['DED_MINOR', 'Console warnings during use', '-3', '', ''],
        ['DED_MINOR', 'Uses var instead of let/const', '-3', '', ''],
        ['DED_MINOR', 'Poor code organization', '-2', '', ''],
        ['DED_MINOR', 'No comments on complex logic', '-2', '', ''],
        ['DED_MINOR', 'Global namespace pollution', '-2', '', ''],
        ['DED_MINOR', 'Inconsistent formatting', '-1', '', ''],
        
        ['DEDUCTIONS', 'DEDUCTIONS SUBTOTAL', '', '', 'Sum negative values'],
        
        // Design Analysis
        ['DESIGN', '=== DESIGN ANALYSIS ===', '', '', ''],
        ['DESIGN_CHECK', 'Uses original starter template CSS?', '', '', 'YES/NO/PARTIAL'],
        ['DESIGN_CHECK', 'CSS heavily modified?', '', '', 'YES/NO/PARTIAL'],
        ['DESIGN_CHECK', 'Completely new design?', '', '', 'YES/NO'],
        ['DESIGN_CHECK', 'Evidence of CSS framework (Bootstrap, etc)?', '', '', 'YES/NO'],
        ['DESIGN_CHECK', 'Design quality vs starter', '', '', 'BETTER/SAME/WORSE'],
        ['DESIGN_CHECK', 'Likely AI-regenerated?', '', '', 'YES/NO/MAYBE'],
        
        // Summary
        ['SUMMARY', '=== FINAL CALCULATION ===', '', '', ''],
        ['SUMMARY', 'Tier 1 Points', '', '', ''],
        ['SUMMARY', 'Tier 2 Points', '', '', ''],
        ['SUMMARY', 'Tier 3 Points', '', '', ''],
        ['SUMMARY', 'Bonus Points', '', '', ''],
        ['SUMMARY', 'Deductions', '', '', ''],
        ['SUMMARY', 'TOTAL EARNED', '', '', '=(Tier1+Tier2+Tier3+Bonus+Deductions)'],
        ['SUMMARY', 'FINAL GRADE (capped at 100)', '', '', '=MIN(100, MAX(0, TOTAL/100*100))'],
    ];
    
    return checklist.map(row => row.map(cell => 
        cell.includes(',') || cell.includes('"') ? `"${cell.replace(/"/g, '""')}"` : cell
    ).join(',')).join('\n');
}

/**
 * Generate design analysis tracking CSV
 */
function generateDesignAnalysisCSV(prs) {
    const headers = [
        'PR_Number',
        'Student_Name',
        'Student_ID',
        'Original_Starter_CSS',
        'CSS_Modified',
        'Completely_New_Design',
        'Uses_Framework',
        'Design_Quality',
        'AI_Regenerated_Likelihood',
        'Design_Notes'
    ].join(',');
    
    const rows = prs.map(pr => {
        const student = parseStudentInfo(pr.title);
        
        return [
            pr.number,
            `"${student.name}"`,
            student.id,
            '', // Original CSS - YES/NO/PARTIAL
            '', // Modified - YES/NO/PARTIAL
            '', // New design - YES/NO
            '', // Framework - YES/NO
            '', // Quality - BETTER/SAME/WORSE
            '', // AI likelihood - HIGH/MEDIUM/LOW
            '""' // Notes
        ].join(',');
    });
    
    return [headers, ...rows].join('\n');
}

/**
 * Main execution
 */
function main() {
    console.log('PR Data Extraction Script');
    console.log('========================\n');
    
    // Check if PR data file exists
    if (!fs.existsSync(PRS_DATA_FILE)) {
        console.log(`Creating template ${PRS_DATA_FILE}...`);
        console.log('Please populate this file with PR data from GitHub MCP.\n');
        
        const template = {
            instructions: "Paste the PR array from mcp_github_list_pull_requests here",
            prs: []
        };
        
        fs.writeFileSync(PRS_DATA_FILE, JSON.stringify(template, null, 2));
        console.log(`Template created: ${PRS_DATA_FILE}`);
        console.log('Run this script again after populating the file.\n');
        return;
    }
    
    // Read PR data
    const data = JSON.parse(fs.readFileSync(PRS_DATA_FILE, 'utf8'));
    const prs = data.prs || [];
    
    if (prs.length === 0) {
        console.log('No PR data found. Please populate pr-data.json with actual PR data.\n');
        return;
    }
    
    console.log(`Found ${prs.length} pull requests\n`);
    
    // Generate master CSV
    console.log('Generating master-grades.csv...');
    const masterCSV = generateMasterCSV(prs);
    fs.writeFileSync('master-grades.csv', masterCSV);
    console.log('✓ master-grades.csv created\n');
    
    // Generate design analysis CSV
    console.log('Generating design-analysis.csv...');
    const designCSV = generateDesignAnalysisCSV(prs);
    fs.writeFileSync('design-analysis.csv', designCSV);
    console.log('✓ design-analysis.csv created\n');
    
    // Generate individual student checklists
    console.log('Generating individual student checklists...');
    const checklistTemplate = generateStudentChecklistTemplate();
    
    const checklistDir = 'student-checklists';
    if (!fs.existsSync(checklistDir)) {
        fs.mkdirSync(checklistDir);
    }
    
    prs.forEach(pr => {
        const student = parseStudentInfo(pr.title);
        const filename = `${checklistDir}/PR${pr.number}_${student.id}_${student.name.replace(/\s+/g, '_')}.csv`;
        
        // Add header with student info
        const header = `Student: ${student.name}\nID: ${student.id}\nPR: #${pr.number}\nGitHub: ${pr.user.login}\nSubmission: ${new Date(pr.created_at).toISOString()}\n\n`;
        
        fs.writeFileSync(filename, header + checklistTemplate);
    });
    
    console.log(`✓ ${prs.length} student checklists created in ${checklistDir}/\n`);
    
    // Generate summary
    console.log('Summary:');
    console.log('--------');
    console.log(`Total PRs: ${prs.length}`);
    console.log(`Files created:`);
    console.log(`  - master-grades.csv (main grading sheet)`);
    console.log(`  - design-analysis.csv (design comparison)`);
    console.log(`  - ${checklistDir}/ (${prs.length} individual checklists)`);
    console.log('\nNext steps:');
    console.log('1. Open master-grades.csv in a spreadsheet app');
    console.log('2. Use individual checklists for detailed grading');
    console.log('3. Fill in design-analysis.csv while reviewing code');
    console.log('4. Run analyze-code.js to detect automatic deductions');
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    parseStudentInfo,
    generateMasterCSV,
    generateStudentChecklistTemplate,
    generateDesignAnalysisCSV
};
