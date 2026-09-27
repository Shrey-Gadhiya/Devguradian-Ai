const path = require('path');
const AIProvider = require('../ai/aiProvider');

async function generateTests(findings, architecture) {
  const generatedTests = [];
  const ai = new AIProvider();

  // Group findings by file
  const findingsByFile = {};
  for (const f of findings) {
    if (!findingsByFile[f.file]) findingsByFile[f.file] = [];
    findingsByFile[f.file].push(f);
  }

  // Generate test templates for critical/high security findings
  const securityFindings = findings.filter(f =>
    (f.source === 'security' || f.source === 'dependency') &&
    ['critical', 'high'].includes(f.severity)
  ).slice(0, 10);

  for (const finding of securityFindings) {
    const test = buildSecurityTest(finding, architecture);
    if (test) generatedTests.push(test);
  }

  // Generate coverage tests for untested files
  const untestedFindings = findings.filter(f => f.ruleId === 'TEST001').slice(0, 5);
  for (const finding of untestedFindings) {
    const test = buildCoverageTest(finding, architecture);
    if (test) generatedTests.push(test);
  }

  return generatedTests;
}

function buildSecurityTest(finding, architecture) {
  const lang = architecture.projectInfo.primaryLanguage;
  const isNode = ['Node.js', 'javascript', 'typescript'].some(l =>
    lang.toLowerCase().includes(l.toLowerCase()) ||
    architecture.projectInfo.frameworks.some(f => f.toLowerCase().includes('express'))
  );

  if (isNode && finding.ruleId === 'SEC003') {
    const lines = [
      '// Auto-generated security regression test',
      '// Tests for: ' + finding.message,
      '// Source: ' + finding.file + ':' + finding.line,
      '',
      "const request = require('supertest');",
      "const app = require('../../src/index'); // adjust path",
      '',
      "describe('SQL Injection Prevention', () => {",
      "  test('should reject SQL injection in query parameters', async () => {",
      '    const maliciousInput = "\'; DROP TABLE users; --";',
      '    const response = await request(app)',
      "      .get('/api/users')",
      '      .query({ id: maliciousInput });',
      '    expect(response.status).not.toBe(500);',
      '  });',
      '',
      "  test('should use parameterized queries', async () => {",
      '    const userId = "1 OR 1=1";',
      '    const response = await request(app)',
      "      .get('/api/users')",
      '      .query({ id: userId });',
      '    expect(response.status).not.toBe(500);',
      '    if (response.body.users) {',
      '      expect(Array.isArray(response.body.users)).toBe(true);',
      '    }',
      '  });',
      '});'
    ];
    return {
      type: 'security',
      finding: finding.ruleId,
      file: '__tests__/security/sqlInjection.test.js',
      language: 'javascript',
      framework: 'jest',
      content: lines.join('\n')
    };
  }

  if (finding.ruleId === 'SEC006' || finding.ruleId === 'SEC007') {
    const lines = [
      '// Auto-generated security regression test',
      '// Tests for: ' + finding.message,
      '// Source: ' + finding.file,
      '',
      "const fs = require('fs');",
      "const path = require('path');",
      "const { glob } = require('glob');",
      '',
      "describe('Hardcoded Secrets Detection', () => {",
      "  test('should not contain hardcoded API keys or passwords', async () => {",
      "    const files = await glob('src/**/*.js', { ignore: ['**/node_modules/**'] });",
      '    const secretPatterns = [',
      "      new RegExp('(?:password|passwd|secret|api_key|token)\\\\s*=\\\\s*[^\\\\s]{6,}', 'i'),",
      "      new RegExp('sk-[a-zA-Z0-9]{20,}'),",
      "      new RegExp('AKIA[A-Z0-9]{16}'),",
      '    ];',
      '    const violations = [];',
      '    for (const file of files) {',
      "      const content = fs.readFileSync(file, 'utf8');",
      '      for (const pattern of secretPatterns) {',
      '        if (pattern.test(content)) violations.push(file);',
      '      }',
      '    }',
      '    expect(violations).toEqual([]);',
      '  });',
      '});'
    ];
    return {
      type: 'security',
      finding: finding.ruleId,
      file: '__tests__/security/secrets.test.js',
      language: 'javascript',
      framework: 'jest',
      content: lines.join('\n')
    };
  }

  return null;
}

function buildCoverageTest(finding, architecture) {
  const filePath = finding.file;
  const baseName = path.basename(filePath, path.extname(filePath));
  const ext = path.extname(filePath);
  const lang = ext === '.py' ? 'python' : 'javascript';

  if (lang === 'javascript') {
    return {
      type: 'coverage',
      finding: finding.ruleId,
      file: `__tests__/${baseName}.test.js`,
      language: 'javascript',
      framework: 'jest',
      content: `// Auto-generated coverage test for: ${filePath}
// TODO: Complete test implementation

const ${baseName} = require('../${filePath.replace(/\.(js|ts)$/, '')}');

describe('${baseName}', () => {
  beforeEach(() => {
    // Setup test fixtures
    jest.clearAllMocks();
  });

  test('should be defined', () => {
    expect(${baseName}).toBeDefined();
  });

  // TODO: Add specific tests for each exported function/class
  // Example:
  // test('should handle valid input', () => {
  //   const result = ${baseName}.someFunction('valid input');
  //   expect(result).toBeDefined();
  // });
  
  // test('should handle invalid input gracefully', () => {
  //   expect(() => ${baseName}.someFunction(null)).not.toThrow();
  // });
});`
    };
  }

  return null;
}

module.exports = { generateTests };
