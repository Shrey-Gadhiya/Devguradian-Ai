const path = require('path');
const fs = require('fs-extra');
const { readFileLines, readFile } = require('../utils/fileUtils');

const TEST_PATTERNS = {
  javascript: [/describe\s*\(/, /it\s*\(/, /test\s*\(/, /expect\s*\(/],
  typescript: [/describe\s*\(/, /it\s*\(/, /test\s*\(/, /expect\s*\(/, /@Test/],
  python: [/def test_/, /class Test/, /assert /],
  java: [/@Test/, /assert/, /assertEquals/],
  go: [/func Test/, /t\.Error/, /t\.Fatal/],
  ruby: [/describe/, /it ['"]/, /expect\(/],
};

const SOURCE_PATTERN = /\.(js|jsx|ts|tsx|py|java|go|rb|cs|php)$/;
const TEST_FILE_PATTERN = /(test|spec|__tests__|_test)\.(js|jsx|ts|tsx|py|java|go|rb|cs|php)$|(\.test\.|\.spec\.)/;

async function analyzeTestCoverage(files, dirPath) {
  const sourceFiles = files.filter(f => SOURCE_PATTERN.test(f.path) && !isTestFile(f.path));
  const testFiles = files.filter(f => isTestFile(f.path));

  // Check which source files have corresponding test files
  const testedFiles = new Set();
  for (const tf of testFiles) {
    const baseName = getSourceBaseName(tf.path);
    for (const sf of sourceFiles) {
      const sfBase = path.basename(sf.path, path.extname(sf.path)).toLowerCase();
      if (baseName.includes(sfBase) || sfBase.includes(baseName)) {
        testedFiles.add(sf.path);
      }
    }
  }

  const untestedFiles = sourceFiles.filter(f => !testedFiles.has(f.path));

  // Analyze test quality
  const testQuality = [];
  for (const tf of testFiles) {
    const lines = await readFileLines(tf.absPath);
    if (!lines) continue;
    const content = lines.join('\n');
    const lang = getLangFromExt(tf.path);
    const patterns = TEST_PATTERNS[lang] || TEST_PATTERNS.javascript;

    let assertions = 0;
    let testCases = 0;
    for (const line of lines) {
      if (patterns[0].test(line) || patterns[1]?.test(line)) testCases++;
      if (patterns[3]?.test(line) || /assert/.test(line)) assertions++;
    }

    testQuality.push({
      file: tf.path,
      testCases,
      assertions,
      hasSetup: /beforeEach|beforeAll|setUp|before\s*\(/.test(content),
      hasTeardown: /afterEach|afterAll|tearDown|after\s*\(/.test(content),
      quality: assertions > 0 ? (assertions / Math.max(testCases, 1) >= 2 ? 'good' : 'fair') : 'poor'
    });
  }

  // Coverage findings
  const findings = [];
  for (const f of untestedFiles.slice(0, 20)) { // limit findings
    findings.push({
      ruleId: 'TEST001',
      severity: 'medium',
      category: 'Test Coverage',
      file: f.path,
      line: 1,
      evidence: f.path,
      message: 'No corresponding test file found for this source file'
    });
  }

  const coverageEstimate = sourceFiles.length > 0
    ? Math.round((testedFiles.size / sourceFiles.length) * 100)
    : 0;

  return {
    findings,
    testFiles: testFiles.length,
    sourceFiles: sourceFiles.length,
    testedFiles: testedFiles.size,
    untestedFiles: untestedFiles.slice(0, 20).map(f => f.path),
    coverageEstimate,
    testQuality,
    summary: {
      coverageEstimate,
      testFiles: testFiles.length,
      sourceFiles: sourceFiles.length
    }
  };
}

function isTestFile(filePath) {
  return TEST_FILE_PATTERN.test(filePath) || filePath.includes('__tests__') || filePath.includes('/test/') || filePath.includes('/tests/') || filePath.includes('/spec/');
}

function getSourceBaseName(testPath) {
  return path.basename(testPath)
    .replace(/\.(test|spec)\.(js|jsx|ts|tsx|py|java|go|rb)$/, '')
    .replace(/_test\.(js|jsx|ts|tsx|py|java|go|rb)$/, '')
    .toLowerCase();
}

function getLangFromExt(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = { '.js': 'javascript', '.jsx': 'javascript', '.ts': 'typescript', '.tsx': 'typescript', '.py': 'python', '.java': 'java', '.go': 'go', '.rb': 'ruby' };
  return map[ext] || 'javascript';
}

module.exports = { analyzeTestCoverage, isTestFile };
