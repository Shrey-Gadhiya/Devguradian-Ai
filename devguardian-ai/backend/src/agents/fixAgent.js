/**
 * Fix Agent — generate remediation suggestions for findings
 */
const { generateText } = require('../ai/aiProvider');

const FIX_TEMPLATES = {
  'SEC-001': {
    title: 'Remove hardcoded secret',
    before: `const password = "hardcoded_password";`,
    after: `const password = process.env.DB_PASSWORD;\n// Ensure DB_PASSWORD is set in your .env file`,
  },
  'SEC-003': {
    title: 'Replace MD5 with bcrypt',
    before: `const hash = crypto.createHash('md5').update(password).digest('hex');`,
    after: `const bcrypt = require('bcrypt');\nconst hash = await bcrypt.hash(password, 12);`,
  },
  'SEC-006': {
    title: 'Parameterized SQL query',
    before: `const query = "SELECT * FROM users WHERE id = " + req.params.id;`,
    after: `const query = "SELECT * FROM users WHERE id = ?";\ndb.query(query, [req.params.id], callback);`,
  },
  'SEC-007': {
    title: 'Safe command execution',
    before: `exec("ls " + req.body.dir, callback);`,
    after: `const { execFile } = require('child_process');\nexecFile('ls', [req.body.dir], callback);`,
  },
  'SEC-008': {
    title: 'Remove eval()',
    before: `eval(req.body.code);`,
    after: `// Parse JSON safely instead of eval\nconst data = JSON.parse(req.body.data);`,
  },
  'SEC-012': {
    title: 'Validate URL before fetch',
    before: `const data = await axios.get(req.body.url);`,
    after: `const ALLOWED_HOSTS = ['api.trusted.com'];\nconst u = new URL(req.body.url);\nif (!ALLOWED_HOSTS.includes(u.hostname)) throw new Error('Disallowed host');\nconst data = await axios.get(req.body.url);`,
  },
  'SEC-013': {
    title: 'Safe file path construction',
    before: `const filePath = path.join(baseDir, req.params.filename);`,
    after: `const safe = path.basename(req.params.filename);\nconst filePath = path.join(baseDir, safe);\nif (!filePath.startsWith(baseDir)) throw new Error('Path traversal attempt');`,
  },
  'QA-001': {
    title: 'Fix empty catch block',
    before: `try { operation(); } catch (err) {}`,
    after: `try {\n  operation();\n} catch (err) {\n  console.error('Operation failed:', err);\n  throw err; // or handle gracefully\n}`,
  },
  'QA-004': {
    title: 'Replace var with const/let',
    before: `var result = computeValue();`,
    after: `const result = computeValue(); // or 'let' if reassigned`,
  },
};

async function generateFixes(findings) {
  const fixes = [];

  for (const finding of findings) {
    const template = FIX_TEMPLATES[finding.id];
    let fix = {
      findingId: finding.id,
      file: finding.file,
      line: finding.line,
      severity: finding.severity,
      title: finding.title,
      description: finding.message,
      effort: estimateEffort(finding.severity),
    };

    if (template) {
      fix.codeBefore = template.before;
      fix.codeAfter = template.after;
      fix.suggestion = finding.fix;
      fix.hasTemplate = true;
    } else {
      fix.suggestion = finding.fix;
      fix.codeBefore = finding.evidence || '// See file for context';
      fix.codeAfter = generateRuleBasedFix(finding);
      fix.hasTemplate = false;
    }

    // Try AI enhancement if available
    if (process.env.AI_PROVIDER && process.env.AI_PROVIDER !== 'none') {
      try {
        const aiSuggestion = await generateText(
          `Security finding in ${finding.file} at line ${finding.line}:\n` +
          `Issue: ${finding.title}\n` +
          `Evidence: ${finding.evidence}\n` +
          `Provide a concise code fix in under 100 words.`,
          { maxTokens: 200 }
        );
        if (aiSuggestion) fix.aiSuggestion = aiSuggestion;
      } catch { /* use rule-based */ }
    }

    fixes.push(fix);
  }

  return fixes;
}

function generateRuleBasedFix(finding) {
  const id = finding.id || '';
  if (id.startsWith('SEC')) return `// Security fix required at ${finding.file}:${finding.line}\n// ${finding.fix}`;
  if (id.startsWith('QA')) return `// Code quality fix at ${finding.file}:${finding.line}\n// ${finding.fix}`;
  if (id.startsWith('DEP')) return `# Run: npm update ${(finding.evidence || '').split('@')[0] || 'package'}`;
  if (id.startsWith('TEST')) return `// Add test coverage for ${finding.file}`;
  return `// Fix: ${finding.fix}`;
}

function estimateEffort(severity) {
  const map = { critical: 'high', high: 'medium', medium: 'low', low: 'trivial' };
  return map[severity] || 'medium';
}

module.exports = { generateFixes };
