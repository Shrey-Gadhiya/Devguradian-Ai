/**
 * Code Quality Analyzer
 */
const { readFileSafe } = require('../utils/fileUtils');

const CODE_EXTS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.py', '.java', '.go', '.rb', '.php']);

async function analyzeCodeQuality(files) {
  const findings = [];
  const metrics = { filesAnalyzed: 0, totalIssues: 0, bySeverity: { critical: 0, high: 0, medium: 0, low: 0 } };

  for (const file of files) {
    if (!CODE_EXTS.has(file.ext)) continue;
    const content = readFileSafe(file.path);
    if (!content) continue;

    metrics.filesAnalyzed++;
    const lines = content.split('\n');
    const fileFindings = [];

    // Empty catch blocks
    const emptyCatch = /catch\s*\([^)]*\)\s*\{\s*\}/g;
    let m;
    while ((m = emptyCatch.exec(content)) !== null) {
      const line = content.substring(0, m.index).split('\n').length;
      fileFindings.push({ severity: 'high', rule: 'QA-001', title: 'Empty catch block', file: file.relativePath, line, evidence: lines[line - 1]?.trim(), message: 'Empty catch block swallows errors silently.', fix: 'Log the error or re-throw it: catch(err) { console.error(err); }' });
    }

    // TODO / FIXME comments
    const todoRe = /\/\/\s*(TODO|FIXME|HACK|XXX|BUG)\b(.{0,80})/gi;
    while ((m = todoRe.exec(content)) !== null) {
      const line = content.substring(0, m.index).split('\n').length;
      fileFindings.push({ severity: 'low', rule: 'QA-002', title: `${m[1]} comment`, file: file.relativePath, line, evidence: lines[line - 1]?.trim(), message: `Unresolved ${m[1]}: ${m[2].trim()}`, fix: 'Resolve or create a tracked issue.' });
    }

    // console.log in production code
    const consoleRe = /console\.(log|debug|info)\s*\(/g;
    while ((m = consoleRe.exec(content)) !== null) {
      const line = content.substring(0, m.index).split('\n').length;
      if (!file.relativePath.includes('test') && !file.relativePath.includes('spec')) {
        fileFindings.push({ severity: 'low', rule: 'QA-003', title: 'Console statement in production code', file: file.relativePath, line, evidence: lines[line - 1]?.trim(), message: 'console.log() left in production code.', fix: 'Remove or replace with a proper logger.' });
      }
    }

    // var usage (JS)
    if (file.ext === '.js' || file.ext === '.jsx' || file.ext === '.ts' || file.ext === '.tsx') {
      const varRe = /^\s*var\s+/gm;
      while ((m = varRe.exec(content)) !== null) {
        const line = content.substring(0, m.index).split('\n').length;
        fileFindings.push({ severity: 'low', rule: 'QA-004', title: 'var declaration', file: file.relativePath, line, evidence: lines[line - 1]?.trim(), message: "Use 'const' or 'let' instead of 'var'.", fix: "Replace 'var' with 'const' or 'let'." });
      }
    }

    // Long functions (>60 lines)
    const funcRe = /(?:function\s+\w+|(?:const|let|var)\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>)\s*\{/g;
    while ((m = funcRe.exec(content)) !== null) {
      const startLine = content.substring(0, m.index).split('\n').length;
      // Count braces to find function end
      let depth = 0, i = m.index;
      while (i < content.length) {
        if (content[i] === '{') depth++;
        else if (content[i] === '}') { depth--; if (depth === 0) break; }
        i++;
      }
      const endLine = content.substring(0, i).split('\n').length;
      if (endLine - startLine > 60) {
        fileFindings.push({ severity: 'medium', rule: 'QA-005', title: 'Long function', file: file.relativePath, line: startLine, evidence: lines[startLine - 1]?.trim(), message: `Function is ${endLine - startLine} lines long. Consider splitting.`, fix: 'Extract logical sections into smaller helper functions.' });
      }
    }

    // Deep nesting
    for (let li = 0; li < lines.length; li++) {
      const indent = lines[li].match(/^(\s+)/)?.[1]?.length || 0;
      if (indent >= 24) {
        fileFindings.push({ severity: 'medium', rule: 'QA-006', title: 'Deep nesting', file: file.relativePath, line: li + 1, evidence: lines[li]?.trim(), message: 'Deeply nested code reduces readability.', fix: 'Use early returns or extract functions to reduce nesting.' });
      }
    }

    // Duplicate code detection (simple — same 3+ consecutive lines repeated)
    const lineHashes = new Map();
    for (let li = 0; li + 2 < lines.length; li++) {
      const block = lines.slice(li, li + 3).join('\n').trim();
      if (block.length < 30) continue;
      if (lineHashes.has(block)) {
        fileFindings.push({ severity: 'low', rule: 'QA-007', title: 'Duplicate code block', file: file.relativePath, line: li + 1, evidence: lines[li]?.trim(), message: 'Duplicate code block found.', fix: 'Extract into a shared function.' });
        lineHashes.delete(block); // report only once per block
      } else {
        lineHashes.set(block, li + 1);
      }
    }

    findings.push(...fileFindings);
    for (const f of fileFindings) metrics.bySeverity[f.severity] = (metrics.bySeverity[f.severity] || 0) + 1;
    metrics.totalIssues += fileFindings.length;
  }

  return { findings, metrics };
}

module.exports = { analyzeCodeQuality };
