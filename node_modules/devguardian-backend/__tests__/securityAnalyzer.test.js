const { runSecurityScan } = require('../src/analyzers/securityAnalyzer');
const path = require('path');
const fs = require('fs-extra');
const tmp = require('tmp');

describe('Security Analyzer', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = tmp.dirSync({ unsafeCleanup: true });
  });

  afterEach(() => {
    tmpDir.removeCallback();
  });

  async function createTestFile(filename, content) {
    const absPath = path.join(tmpDir.name, filename);
    await fs.writeFile(absPath, content);
    return { path: filename, absPath, size: content.length, ext: path.extname(filename) };
  }

  test('detects eval() usage', async () => {
    const file = await createTestFile('test.js', `
const result = eval(userInput);
`);
    const result = await runSecurityScan([file], { 'test.js': 'javascript' });
    const evalFindings = result.findings.filter(f => f.ruleId === 'SEC001');
    expect(evalFindings.length).toBeGreaterThan(0);
    expect(evalFindings[0].severity).toBe('critical');
  });

  test('detects hardcoded secrets', async () => {
    const file = await createTestFile('config.js', `
const apiKey = "sk-abc123defghijklmnopqrstuvwxyz";
const password = "my_super_secret_password";
`);
    const result = await runSecurityScan([file], { 'config.js': 'javascript' });
    const secretFindings = result.findings.filter(f => ['SEC006', 'SEC007'].includes(f.ruleId));
    expect(secretFindings.length).toBeGreaterThan(0);
  });

  test('detects MD5 usage', async () => {
    const file = await createTestFile('crypto.js', `
const hash = crypto.createHash('md5').update(data).digest('hex');
`);
    const result = await runSecurityScan([file], { 'crypto.js': 'javascript' });
    const cryptoFindings = result.findings.filter(f => f.ruleId === 'SEC008');
    expect(cryptoFindings.length).toBeGreaterThan(0);
  });

  test('detects wildcard CORS', async () => {
    const file = await createTestFile('server.js', `
app.use(cors({ origin: '*' }));
`);
    const result = await runSecurityScan([file], { 'server.js': 'javascript' });
    const corsFindings = result.findings.filter(f => f.ruleId === 'SEC014');
    expect(corsFindings.length).toBeGreaterThan(0);
  });

  test('returns summary with severity counts', async () => {
    const file = await createTestFile('test.js', `
eval(x);
const secret = "hardcoded_password_123";
`);
    const result = await runSecurityScan([file], { 'test.js': 'javascript' });
    expect(result.summary).toHaveProperty('total');
    expect(result.summary).toHaveProperty('bySeverity');
    expect(result.summary.bySeverity).toHaveProperty('critical');
  });

  test('clean file returns no findings', async () => {
    const file = await createTestFile('clean.js', `
const x = 1 + 2;
console.log(x);
function add(a, b) { return a + b; }
`);
    const result = await runSecurityScan([file], { 'clean.js': 'javascript' });
    expect(result.findings.length).toBe(0);
  });
});
