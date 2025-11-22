/**
 * Code Analysis Script
 * Analyzes student code for automatic deductions and design patterns
 * 
 * Usage: node analyze-code.js
 * 
 * This script:
 * - Checks file structure
 * - Analyzes code quality issues
 * - Detects design changes from starter template
 * - Identifies optimization patterns
 * - Flags potential automatic deductions
 */

const fs = require('fs');
const path = require('path');

/**
 * Analyze a student's submission folder
 */
function analyzeStudentFolder(folderPath, studentName) {
    const analysis = {
        studentName,
        folderPath,
        filesPresent: {
            html: false,
            js: false,
            css: false
        },
        deductions: [],
        codeQuality: {
            usesVar: false,
            varCount: 0,
            hasComments: false,
            commentCount: 0,
            hasTryCatch: false,
            usesConst: false,
            usesLet: false
        },
        dataLoading: {
            method: 'UNKNOWN', // URL, LOCAL, MULTI_URL
            urls: [],
            usesLocalFile: false
        },
        optimizations: {
            hasDebounce: false,
            hasThrottle: false,
            hasVirtualization: false,
            hasPagination: false,
            hasEventDelegation: false
        },
        designAnalysis: {
            cssFileSize: 0,
            hasBootstrap: false,
            hasTailwind: false,
            hasCustomClasses: false,
            likelyRegenerated: false
        }
    };
    
    // Check if folder exists
    if (!fs.existsSync(folderPath)) {
        analysis.deductions.push({
            category: 'CRITICAL',
            points: -10,
            reason: 'Student folder not found'
        });
        return analysis;
    }
    
    // Check for required files
    const htmlFile = path.join(folderPath, 'index.html');
    const jsFile = path.join(folderPath, 'script.js');
    const cssFile = path.join(folderPath, 'styles.css');
    
    analysis.filesPresent.html = fs.existsSync(htmlFile);
    analysis.filesPresent.js = fs.existsSync(jsFile);
    analysis.filesPresent.css = fs.existsSync(cssFile);
    
    // Missing files deduction
    const missingFiles = [];
    if (!analysis.filesPresent.html) missingFiles.push('index.html');
    if (!analysis.filesPresent.js) missingFiles.push('script.js');
    if (!analysis.filesPresent.css) missingFiles.push('styles.css');
    
    if (missingFiles.length > 0) {
        analysis.deductions.push({
            category: 'CRITICAL',
            points: -10,
            reason: `Missing required files: ${missingFiles.join(', ')}`
        });
    }
    
    // Analyze JavaScript file
    if (analysis.filesPresent.js) {
        const jsContent = fs.readFileSync(jsFile, 'utf8');
        analyzeJavaScript(jsContent, analysis);
    }
    
    // Analyze CSS file
    if (analysis.filesPresent.css) {
        const cssContent = fs.readFileSync(cssFile, 'utf8');
        analyzeCSS(cssContent, analysis);
    }
    
    // Analyze HTML file
    if (analysis.filesPresent.html) {
        const htmlContent = fs.readFileSync(htmlFile, 'utf8');
        analyzeHTML(htmlContent, analysis);
    }
    
    return analysis;
}

/**
 * Analyze JavaScript code
 */
function analyzeJavaScript(code, analysis) {
    // Check for var usage
    const varMatches = code.match(/\bvar\s+/g);
    if (varMatches) {
        analysis.codeQuality.usesVar = true;
        analysis.codeQuality.varCount = varMatches.length;
        
        // Only deduct if var is used extensively (more than 5 times)
        if (varMatches.length > 5) {
            analysis.deductions.push({
                category: 'CODE_QUALITY',
                points: -3,
                reason: `Uses 'var' ${varMatches.length} times instead of let/const`
            });
        }
    }
    
    // Check for const/let usage
    analysis.codeQuality.usesConst = /\bconst\s+/.test(code);
    analysis.codeQuality.usesLet = /\blet\s+/.test(code);
    
    // Check for comments
    const commentMatches = code.match(/\/\/.*|\/\*[\s\S]*?\*\//g);
    if (commentMatches) {
        analysis.codeQuality.hasComments = true;
        analysis.codeQuality.commentCount = commentMatches.length;
    } else {
        analysis.deductions.push({
            category: 'CODE_QUALITY',
            points: -2,
            reason: 'No comments explaining complex logic'
        });
    }
    
    // Check for try-catch error handling
    analysis.codeQuality.hasTryCatch = /try\s*{/.test(code);
    
    // Check data loading method
    const correctUrl = 'https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/doctor-who-episodes-full.json';
    const multiUrlPattern = /doctor-who-episodes-\d{2}-\d{2}\.json/g;
    const localFilePattern = /doctor-who-episodes-full\.json(?!["']?\s*[),])/;
    
    if (code.includes(correctUrl)) {
        analysis.dataLoading.method = 'URL';
        analysis.dataLoading.urls.push(correctUrl);
    } else if (multiUrlPattern.test(code)) {
        const urls = code.match(multiUrlPattern);
        if (urls && urls.length >= 6) {
            analysis.dataLoading.method = 'MULTI_URL';
            analysis.dataLoading.urls = urls;
        }
    } else if (localFilePattern.test(code)) {
        analysis.dataLoading.method = 'LOCAL';
        analysis.dataLoading.usesLocalFile = true;
        analysis.deductions.push({
            category: 'CRITICAL',
            points: -10,
            reason: 'Uses local data file instead of fetching from URL'
        });
    }
    
    // Check for optimization patterns
    analysis.optimizations.hasDebounce = /debounce|debouncing/i.test(code);
    analysis.optimizations.hasThrottle = /throttle|throttling/i.test(code);
    analysis.optimizations.hasVirtualization = /virtual.*scroll|intersection.*observer/i.test(code);
    analysis.optimizations.hasPagination = /pagination|page.*size|items.*per.*page/i.test(code);
    analysis.optimizations.hasEventDelegation = /event.*delegation|addEventListener.*table|addEventListener.*tbody/i.test(code);
    
    // Check for global namespace pollution
    const globalVarCount = (code.match(/^(var|let|const)\s+\w+/gm) || []).length;
    const functionCount = (code.match(/^function\s+\w+/gm) || []).length;
    const totalGlobals = globalVarCount + functionCount;
    
    if (totalGlobals > 15) {
        analysis.deductions.push({
            category: 'CODE_QUALITY',
            points: -2,
            reason: `${totalGlobals} global variables/functions (namespace pollution)`
        });
    }
}

/**
 * Analyze CSS code
 */
function analyzeCSS(code, analysis) {
    analysis.designAnalysis.cssFileSize = code.length;
    
    // Check for frameworks
    analysis.designAnalysis.hasBootstrap = /bootstrap/i.test(code);
    analysis.designAnalysis.hasTailwind = /tailwind|@apply/i.test(code);
    
    // Count custom classes (rough estimate)
    const classMatches = code.match(/\.[a-zA-Z][\w-]*/g);
    analysis.designAnalysis.hasCustomClasses = classMatches && classMatches.length > 10;
    
    // Heuristic: If CSS is very different in size from starter (which is ~2-3KB)
    // Starter template CSS is approximately 150-300 lines
    const starterCssApproxSize = 4000; // ~4KB
    if (code.length < 500 || code.length > starterCssApproxSize * 3) {
        analysis.designAnalysis.likelyRegenerated = true;
    }
    
    // Check if it looks completely AI-generated (common patterns)
    const aiPatterns = [
        /\/\* Modern.*design \*\//i,
        /\/\* Reset.*defaults \*\//i,
        /box-sizing:\s*border-box.*universal/i,
        /\/\* Utility classes \*\//i
    ];
    
    const aiPatternMatches = aiPatterns.filter(pattern => pattern.test(code)).length;
    if (aiPatternMatches >= 2) {
        analysis.designAnalysis.likelyRegenerated = true;
    }
}

/**
 * Analyze HTML code
 */
function analyzeHTML(code, analysis) {
    // Check for CDN frameworks in HTML
    if (/<link[^>]*bootstrap/i.test(code)) {
        analysis.designAnalysis.hasBootstrap = true;
    }
    if (/<script[^>]*tailwind/i.test(code)) {
        analysis.designAnalysis.hasTailwind = true;
    }
    
    // Check for semantic table structure
    const hasTable = /<table/.test(code);
    const hasThead = /<thead/.test(code);
    const hasTbody = /<tbody/.test(code);
    const hasTh = /<th/.test(code);
    
    if (!hasTable || !hasThead || !hasTbody || !hasTh) {
        // Note: Not adding deduction here, this is checked in manual grading
        // Just flagging for analysis
        analysis.codeQuality.semanticHTML = false;
    }
}

/**
 * Generate analysis report CSV
 */
function generateAnalysisReport(analyses) {
    const headers = [
        'Student_Name',
        'Folder_Path',
        'HTML_Present',
        'JS_Present',
        'CSS_Present',
        'Data_Loading_Method',
        'Uses_Var',
        'Var_Count',
        'Has_Comments',
        'Comment_Count',
        'Has_TryCatch',
        'Has_Debounce',
        'Has_Throttle',
        'Has_Pagination',
        'CSS_Size_Bytes',
        'Has_Bootstrap',
        'Has_Tailwind',
        'Likely_Regenerated',
        'Total_Deduction_Points',
        'Deduction_Details'
    ].join(',');
    
    const rows = analyses.map(a => {
        const totalDeductions = a.deductions.reduce((sum, d) => sum + d.points, 0);
        const deductionDetails = a.deductions.map(d => `${d.reason} (${d.points}pts)`).join('; ');
        
        return [
            `"${a.studentName}"`,
            `"${a.folderPath}"`,
            a.filesPresent.html ? 'YES' : 'NO',
            a.filesPresent.js ? 'YES' : 'NO',
            a.filesPresent.css ? 'YES' : 'NO',
            a.dataLoading.method,
            a.codeQuality.usesVar ? 'YES' : 'NO',
            a.codeQuality.varCount,
            a.codeQuality.hasComments ? 'YES' : 'NO',
            a.codeQuality.commentCount,
            a.codeQuality.hasTryCatch ? 'YES' : 'NO',
            a.optimizations.hasDebounce ? 'YES' : 'NO',
            a.optimizations.hasThrottle ? 'YES' : 'NO',
            a.optimizations.hasPagination ? 'YES' : 'NO',
            a.designAnalysis.cssFileSize,
            a.designAnalysis.hasBootstrap ? 'YES' : 'NO',
            a.designAnalysis.hasTailwind ? 'YES' : 'NO',
            a.designAnalysis.likelyRegenerated ? 'LIKELY' : 'NO',
            totalDeductions,
            `"${deductionDetails.replace(/"/g, '""')}"`
        ].join(',');
    });
    
    return [headers, ...rows].join('\n');
}

/**
 * Main execution
 */
function main() {
    console.log('Code Analysis Script');
    console.log('===================\n');
    
    // Get students folder path
    const studentsPath = path.join(__dirname, '..', 'students');
    
    if (!fs.existsSync(studentsPath)) {
        console.error('Error: students/ folder not found');
        console.error(`Expected path: ${studentsPath}`);
        return;
    }
    
    // Get all student folders
    const studentFolders = fs.readdirSync(studentsPath)
        .filter(item => {
            const fullPath = path.join(studentsPath, item);
            return fs.statSync(fullPath).isDirectory();
        });
    
    console.log(`Found ${studentFolders.length} student folders\n`);
    
    if (studentFolders.length === 0) {
        console.log('No student folders found to analyze.');
        return;
    }
    
    // Analyze each student
    console.log('Analyzing student submissions...\n');
    const analyses = [];
    
    studentFolders.forEach((folder, index) => {
        const folderPath = path.join(studentsPath, folder);
        console.log(`[${index + 1}/${studentFolders.length}] Analyzing ${folder}...`);
        
        const analysis = analyzeStudentFolder(folderPath, folder);
        analyses.push(analysis);
        
        // Show immediate feedback for critical issues
        if (analysis.deductions.length > 0) {
            analysis.deductions.forEach(d => {
                console.log(`  ⚠️  ${d.reason}: ${d.points} pts`);
            });
        }
    });
    
    console.log('\nGenerating code-analysis-report.csv...');
    const reportCSV = generateAnalysisReport(analyses);
    fs.writeFileSync('code-analysis-report.csv', reportCSV);
    console.log('✓ code-analysis-report.csv created\n');
    
    // Generate summary statistics
    const stats = {
        totalAnalyzed: analyses.length,
        missingFiles: analyses.filter(a => 
            !a.filesPresent.html || !a.filesPresent.js || !a.filesPresent.css
        ).length,
        usesLocal: analyses.filter(a => a.dataLoading.usesLocalFile).length,
        usesVar: analyses.filter(a => a.codeQuality.usesVar).length,
        noComments: analyses.filter(a => !a.codeQuality.hasComments).length,
        hasOptimization: analyses.filter(a => 
            a.optimizations.hasDebounce || 
            a.optimizations.hasThrottle || 
            a.optimizations.hasPagination
        ).length,
        likelyRegenerated: analyses.filter(a => a.designAnalysis.likelyRegenerated).length,
        usesFramework: analyses.filter(a => 
            a.designAnalysis.hasBootstrap || a.designAnalysis.hasTailwind
        ).length
    };
    
    console.log('Analysis Summary:');
    console.log('----------------');
    console.log(`Total students analyzed: ${stats.totalAnalyzed}`);
    console.log(`Missing required files: ${stats.missingFiles}`);
    console.log(`Using local data file: ${stats.usesLocal}`);
    console.log(`Using 'var' keyword: ${stats.usesVar}`);
    console.log(`No comments: ${stats.noComments}`);
    console.log(`Has optimization: ${stats.hasOptimization}`);
    console.log(`Likely regenerated design: ${stats.likelyRegenerated}`);
    console.log(`Uses CSS framework: ${stats.usesFramework}`);
    console.log('\nResults saved to code-analysis-report.csv');
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    analyzeStudentFolder,
    analyzeJavaScript,
    analyzeCSS,
    analyzeHTML,
    generateAnalysisReport
};
