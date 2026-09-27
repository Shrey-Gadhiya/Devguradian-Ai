/**
 * Test Analyzer — coverage estimation, test quality, untested files
 */
const path = require('path');
const { readFileSafe } = require('../utils/fileUtils');

const TEST_PATTERNS = [
  /\.(test|spec)\.(js|ts|jsx|tsx|py|java|go|rb)$/,
  /__(tests?|mocks?)__\//,
  /\/tests?\//,
  /\/spec\//,
];

const CODE_EXTS = new Set(['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rb']);

async function analyzeTests(files) {
  const testFiles = files.filter(f => TEST_PATTERNS.some(p => p.test(f.relativePath)));
  const codeFiles = files.filter(f => CODE_EXTS.has(f.ext) && !TEST_PATTERNS.some(p => p.test(f.relativePath)));

  const findings = [];
  const testSummaries = [];
  const untestedFiles = [];

  for (const tf of testFiles) {
    const content = readFileSafe(tf.path);
    if (!content) continue;

    const describeCount = (content.match(/\bdescribe\s*\(/g) || []).length;
    const itCount = (content.match(/\b(?:it|test)\s*\(/g) || []).length;
    const expectCount = (content.match(/\bexpect\s*\(/g) || []).length;
    const assertCount = (content.match(/\bassert\b/g) || []).length;
    const mockCount = (content.match(/\b(?:jest\.mock|sinon\.|mock\.|patch\()/g) || []).length;
    const beforeEachCount = (content.match(/\bbeforeEach\s*\(/g) || []).length;
    const afterEachCount = (content.match(/\bafterEach\s*\(/g) || []).length;
    const hasAsyncTests = /async\s+\(|await\s+/.test(content);
    const assertionsPerTest = itCount > 0 ? ((expectCount + assertCount) / itCount).toFixed(1) : 0;

    testSummaries.push({
      file: tf.relativePath,
      describes: describeCount,
      tests: itCount,
      expectations: expectCount + assertCount,
      mocks: mockCount,
      beforeEach: beforeEachCount,
      afterEach: afterEachCount,
      hasAsync: hasAsyncTests,
      assertionsPerTest: Number(assertionsPerTest),
      quality: scoreTestQuality(itCount, expectCount + assertCount, mockCount, hasAsyncTests),
    });

    // Findings
    if (itCount === 0) {
      findings.push({ severity: 'medium', rule: 'TEST-001', title: 'Empty test file', file: tf.relativePath, line: 1, evidence: '', message: 'Test file has no test cases.', fix: 'Add test cases or remove the file.' });
    }
    if (itCount > 0 && (expectCount + assertCount) === 0) {
      findings.push({ severity: 'high', rule: 'TEST-002', title: 'Tests without assertions', file: tf.relativePath, line: 1, evidence: '', message: 'Tests have no assertions — they will always pass.', fix: 'Add expect() or assert() statements.' });
    }
    if (assertionsPerTest < 1 && itCount > 0) {
      findings.push({ severity: 'medium', rule: 'TEST-003', title: 'Low assertion density', file: tf.relativePath, line: 1, evidence: `${assertionsPerTest} assertions per test`, message: 'Low assertion count per test reduces effectiveness.', fix: 'Add more assertions to cover edge cases.' });
    }
  }

  // Find untested code files
  const testedPaths = new Set(
    testFiles.map(tf => tf.name.replace(/\.(test|spec)\./, '.').replace(/\.test$/, ''))
  );

  for (const cf of codeFiles) {
    const isTested = testFiles.some(tf => {
      const testBase = tf.name.replace(/\.(test|spec)\.(js|ts|jsx|tsx|py)$/, '');
      const codeBase = path.basename(cf.name, cf.ext);
      return testBase === codeBase;
    });
    if (!isTested) {
      untestedFiles.push({ file: cf.relativePath, language: cf.language, ext: cf.ext });
    }
  }

  // Estimate coverage
  const coveredFiles = codeFiles.length - untestedFiles.length;
  const estimatedCoverage = codeFiles.length > 0
    ? Math.round((coveredFiles / codeFiles.length) * 100)
    : 0;

  if (estimatedCoverage < 50) {
    findings.push({ severity: 'high', rule: 'TEST-004', title: 'Low test coverage', file: 'overall', line: 0, evidence: `Estimated coverage: ${estimatedCoverage}%`, message: `Only ${estimatedCoverage}% of files have corresponding tests.`, fix: 'Add tests for uncovered files, especially critical modules.' });
  }

  return {
    findings,
    summary: {
      testFiles: testFiles.length,
      codeFiles: codeFiles.length,
      estimatedCoverage,
      coveredFiles,
      untestedFiles: untestedFiles.length,
    },
    testSummaries,
    untestedFiles,
  };
}

function scoreTestQuality(tests, assertions, mocks, hasAsync) {
  if (tests === 0) return 'none';
  const ratio = assertions / tests;
  if (ratio >= 3 && (mocks > 0 || hasAsync)) return 'excellent';
  if (ratio >= 2) return 'good';
  if (ratio >= 1) return 'fair';
  return 'poor';
}

module.exports = { analyzeTests };
