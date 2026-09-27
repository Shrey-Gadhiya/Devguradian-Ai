const { readFileLines } = require('../utils/fileUtils');
const path = require('path');

const QUALITY_RULES = [
  { id: 'QA001', severity: 'medium', category: 'Complexity', pattern: /if.*if.*if.*if|for.*for.*for/, message: 'Deeply nested control flow - high cyclomatic complexity' },
  { id: 'QA002', severity: 'low', category: 'Code Style', pattern: /\/\/\s*TODO|\/\/\s*FIXME|\/\/\s*HACK|#\s*TODO|#\s*FIXME/, message: 'Unresolved TODO/FIXME comment' },
  { id: 'QA003', severity: 'medium', category: 'Error Handling', pattern: /catch\s*\(\s*\w+\s*\)\s*\{\s*\}|except\s*:\s*pass/, message: 'Empty catch/except block - swallowing errors' },
  { id: 'QA004', severity: 'low', category: 'Dead Code', pattern: /^\s*\/\/.*function|^\s*\/\/.*class|^\s*#.*def /, message: 'Commented-out function or class definition' },
  { id: 'QA005', severity: 'medium', category: 'Error Handling', pattern: /console\.error\s*\(|console\.warn\s*\(/, message: 'Error logged but not propagated or handled' },
  { id: 'QA006', severity: 'high', category: 'Error Handling', pattern: /\.catch\s*\(\s*\(\s*\)\s*=>\s*\{\s*\}|\.catch\s*\(\s*function\s*\(\s*\)\s*\{\s*\}/, message: 'Empty promise catch handler' },
  { id: 'QA007', severity: 'medium', category: 'Maintainability', pattern: /require\s*\(\s*['"]\.\.\/\.\.\/\.\.\/\.\./, message: 'Deep relative import path - consider path aliases' },
  { id: 'QA008', severity: 'low', category: 'Code Style', pattern: /^\s{0,}(var\s)/, message: 'Use of var - prefer const/let in modern JavaScript' },
  { id: 'QA009', severity: 'medium', category: 'Performance', pattern: /for\s*\(.*in\s+\w+\).*\.length/, message: 'Array length computed in loop condition - cache it' },
  { id: 'QA010', severity: 'low', category: 'Documentation', pattern: /^(export\s+)?(async\s+)?function\s+[a-z]\w{10,}/, message: 'Large public function missing JSDoc documentation' },
];

async function analyzeCodeQuality(file, lang) {
  const findings = [];
  const lines = await readFileLines(file.absPath);
  if (!lines) return findings;

  const jsLangs = ['javascript', 'typescript'];

  // Long function detection
  let inFunction = false;
  let functionStart = 0;
  let braceDepth = 0;
  let maxLineLength = 0;
  let longLines = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (line.length > maxLineLength) maxLineLength = line.length;
    if (line.length > 120) longLines++;

    // Check quality rules
    for (const rule of QUALITY_RULES) {
      if (rule.pattern.test(trimmed)) {
        findings.push({
          ruleId: rule.id,
          severity: rule.severity,
          category: rule.category,
          file: file.path,
          line: i + 1,
          evidence: trimmed.substring(0, 150),
          message: rule.message
        });
        break;
      }
    }

    // Track function length (JS/TS)
    if (jsLangs.includes(lang)) {
      if (/function\s+\w+|=>\s*\{|=\s*function/.test(trimmed)) {
        inFunction = true;
        functionStart = i + 1;
        braceDepth = 0;
      }
      if (inFunction) {
        braceDepth += (line.match(/\{/g) || []).length;
        braceDepth -= (line.match(/\}/g) || []).length;
        if (braceDepth <= 0 && i > functionStart) {
          const functionLen = i - functionStart;
          if (functionLen > 80) {
            findings.push({
              ruleId: 'QA_LONG',
              severity: 'medium',
              category: 'Complexity',
              file: file.path,
              line: functionStart,
              evidence: `Function of ~${functionLen} lines`,
              message: `Long function detected (~${functionLen} lines) - consider breaking it up`
            });
          }
          inFunction = false;
        }
      }
    }
  }

  return {
    findings,
    metrics: {
      lines: lines.length,
      longLines,
      maxLineLength
    }
  };
}

async function runQualityAnalysis(files, langMap) {
  const allFindings = [];
  const fileMetrics = {};

  for (const file of files) {
    const lang = langMap[file.path] || 'unknown';
    const result = await analyzeCodeQuality(file, lang);
    allFindings.push(...result.findings);
    fileMetrics[file.path] = result.metrics;
  }

  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const f of allFindings) {
    if (bySeverity[f.severity] !== undefined) bySeverity[f.severity]++;
  }

  return {
    findings: allFindings,
    fileMetrics,
    summary: {
      total: allFindings.length,
      bySeverity,
      filesAnalyzed: files.length
    }
  };
}

module.exports = { runQualityAnalysis };
