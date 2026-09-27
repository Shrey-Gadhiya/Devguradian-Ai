/**
 * Security Analyzer — OWASP-based rule engine
 */
const path = require('path');
const { readFileSafe } = require('../utils/fileUtils');

const RULES = [
  // A01 Broken Access Control
  {
    id: 'SEC-001', category: 'A01', owasp: 'Broken Access Control', severity: 'critical',
    title: 'Hardcoded credentials or secrets',
    pattern: /(password|passwd|secret|api_?key|access_?key|private_?key)\s*[:=]\s*['"`][^'"`\s]{4,}/gi,
    message: 'Hardcoded secret detected. Use environment variables.',
    fix: 'Replace with process.env.SECRET_NAME or equivalent environment variable.',
  },
  {
    id: 'SEC-002', category: 'A01', owasp: 'Broken Access Control', severity: 'high',
    title: 'Wildcard CORS origin',
    pattern: /cors\(\s*\{[^}]*origin\s*:\s*['"]\*['"]/gi,
    message: 'CORS allows all origins (*). Restrict to trusted domains.',
    fix: "Set cors({ origin: ['https://yourdomain.com'] }) or use an allowlist.",
  },
  // A02 Cryptographic Failures
  {
    id: 'SEC-003', category: 'A02', owasp: 'Cryptographic Failures', severity: 'critical',
    title: 'MD5/SHA1 used for passwords',
    pattern: /createHash\s*\(\s*['"`](md5|sha1)['"`]\s*\)/gi,
    message: 'MD5/SHA1 are broken for password hashing. Use bcrypt or argon2.',
    fix: 'Replace with bcrypt.hash(password, 12) or argon2.hash(password).',
  },
  {
    id: 'SEC-004', category: 'A02', owasp: 'Cryptographic Failures', severity: 'high',
    title: 'Weak JWT secret or algorithm',
    pattern: /jwt\.(sign|verify)\s*\([^)]*['"`](hs256|none|secret|password)['"`]/gi,
    message: 'Weak JWT configuration. Use RS256 with a strong secret (32+ chars).',
    fix: 'Use RS256 algorithm with a cryptographically secure random secret.',
  },
  {
    id: 'SEC-005', category: 'A02', owasp: 'Cryptographic Failures', severity: 'medium',
    title: 'Math.random() for security purposes',
    pattern: /Math\.random\(\)/g,
    message: 'Math.random() is not cryptographically secure.',
    fix: 'Use crypto.randomBytes() or crypto.randomUUID() instead.',
  },
  // A03 Injection
  {
    id: 'SEC-006', category: 'A03', owasp: 'Injection', severity: 'critical',
    title: 'SQL Injection — string concatenation',
    linewise: true,
    pattern: /(?:SELECT|INSERT|UPDATE|DELETE|DROP)\b.{0,80}\+/i,
    message: 'SQL query built with string concatenation — possible SQL injection.',
    fix: 'Use parameterized queries: db.query("SELECT * FROM users WHERE id = ?", [id])',
  },
  {
    id: 'SEC-007', category: 'A03', owasp: 'Injection', severity: 'critical',
    title: 'Command Injection — exec/execSync with string concatenation',
    linewise: true,
    pattern: /\b(?:exec|execSync|spawn)\s*\([^)]*\+/i,
    message: 'Shell command built via string concatenation — command injection risk.',
    fix: 'Use execFile() with an argument array, never string concatenation.',
  },
  {
    id: 'SEC-008', category: 'A03', owasp: 'Injection', severity: 'critical',
    title: 'eval() with dynamic input',
    pattern: /\beval\s*\([^)]*(?:req\.|params\.|body\.|query\.|input|data)/gi,
    message: 'eval() with user-controlled input is a critical injection vulnerability.',
    fix: 'Remove eval(). Parse JSON with JSON.parse() or use a safe expression evaluator.',
  },
  // A05 Security Misconfiguration
  {
    id: 'SEC-009', category: 'A05', owasp: 'Security Misconfiguration', severity: 'high',
    title: 'Express running without Helmet',
    pattern: /require\s*\(\s*['"`]express['"`]\s*\)/g,
    helmetCheck: true,
    message: 'Express app may be missing Helmet security headers.',
    fix: "Add: const helmet = require('helmet'); app.use(helmet());",
  },
  {
    id: 'SEC-010', category: 'A05', owasp: 'Security Misconfiguration', severity: 'medium',
    title: 'Debug mode or stack traces exposed',
    pattern: /app\.(set|enable)\s*\(\s*['"`](debug|x-powered-by)['"`]/gi,
    message: 'Debug information may be exposed to clients.',
    fix: "Disable with app.disable('x-powered-by') and remove debug middleware in production.",
  },
  // A07 Authentication Failures
  {
    id: 'SEC-011', category: 'A07', owasp: 'Identification and Authentication Failures', severity: 'high',
    title: 'Plain-text password storage',
    pattern: /\bpassword\s*[:=]\s*(req\.body\.|params\.)password/gi,
    message: 'Password may be stored or compared in plain text.',
    fix: 'Use bcrypt.compare() for verification and bcrypt.hash() for storage.',
  },
  // A10 SSRF
  {
    id: 'SEC-012', category: 'A10', owasp: 'Server-Side Request Forgery', severity: 'high',
    title: 'SSRF — HTTP request from user-supplied URL',
    pattern: /axios\.get\s*\(\s*(req\.|params\.|body\.|query\.)/gi,
    message: 'HTTP request made to a URL from user input — SSRF risk.',
    fix: 'Validate and allowlist URLs before making server-side requests.',
  },
  // Path traversal
  {
    id: 'SEC-013', category: 'A01', owasp: 'Broken Access Control', severity: 'critical',
    title: 'Path traversal — user input in file path',
    pattern: /(?:readFile|writeFile|createReadStream|join\(.*dir)\s*\([^)]*(?:req\.|params\.|body\.|query\.)/gi,
    message: 'File path constructed from user input — path traversal risk.',
    fix: "Sanitize paths with path.basename() and validate against an allowed base directory.",
  },
  // Secrets in env files
  {
    id: 'SEC-014', category: 'A02', owasp: 'Cryptographic Failures', severity: 'medium',
    title: 'Potential secret in .env file committed',
    pattern: /^(?!#)(?:.*_KEY|.*_SECRET|.*_PASSWORD|.*_TOKEN)\s*=\s*.{6,}/gim,
    envFileOnly: true,
    message: '.env file with real secrets may be committed to version control.',
    fix: 'Add .env to .gitignore. Use .env.example with placeholder values.',
  },
  // Insecure randomness
  {
    id: 'SEC-015', category: 'A02', owasp: 'Cryptographic Failures', severity: 'medium',
    title: 'Insecure token generation',
    pattern: /token\s*=\s*Math\.random|session.*Math\.random/gi,
    message: 'Security token generated with Math.random() is predictable.',
    fix: 'Use crypto.randomBytes(32).toString("hex") for tokens.',
  },
  // Prototype pollution
  {
    id: 'SEC-016', category: 'A03', owasp: 'Injection', severity: 'high',
    title: 'Potential prototype pollution',
    pattern: /\[['"`]__proto__['"`]\]|\[['"`]constructor['"`]\]/g,
    message: 'Prototype pollution vector detected.',
    fix: 'Validate object keys and use Object.create(null) for safe maps.',
  },
  // Insecure cookie
  {
    id: 'SEC-017', category: 'A05', owasp: 'Security Misconfiguration', severity: 'medium',
    title: 'Cookie without Secure/HttpOnly flags',
    pattern: /res\.cookie\s*\([^)]+\)\s*(?!.*secure)(?!.*httpOnly)/gi,
    message: 'Cookie may be missing Secure and HttpOnly flags.',
    fix: "Set cookie options: { secure: true, httpOnly: true, sameSite: 'strict' }",
  },
  // Open redirect
  {
    id: 'SEC-018', category: 'A01', owasp: 'Broken Access Control', severity: 'high',
    title: 'Open redirect — redirect to user input',
    pattern: /res\.redirect\s*\(\s*(req\.|params\.|body\.|query\.)/gi,
    message: 'Redirect target from user input — open redirect vulnerability.',
    fix: 'Validate redirect URLs against an allowlist before redirecting.',
  },
];

const CODE_EXTS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  '.py', '.java', '.go', '.rb', '.php', '.cs',
]);

async function analyzeSecurityAsync(files) {
  const findings = [];

  for (const file of files) {
    if (!CODE_EXTS.has(file.ext) && file.ext !== '.env') continue;
    const content = readFileSafe(file.path);
    if (!content) continue;

    const lines = content.split('\n');

    for (const rule of RULES) {
      if (rule.envFileOnly && file.ext !== '.env') continue;
      if (rule.envFileOnly && file.ext === '.env') {
        // Check .env files only if not .env.example
        if (file.name.includes('.example')) continue;
      }

      // Special check for Helmet
      if (rule.helmetCheck) {
        if (!content.includes('helmet')) {
          findings.push({
            id: rule.id, category: rule.category, owasp: rule.owasp,
            severity: rule.severity, title: rule.title,
            file: file.relativePath, line: 1,
            evidence: 'helmet not found in file',
            message: rule.message, fix: rule.fix,
          });
        }
        continue;
      }

      // Linewise rules — test each line individually
      if (rule.linewise) {
        const seen = new Set();
        lines.forEach((line, idx) => {
          if (rule.pattern.test(line)) {
            const lineNum = idx + 1;
            const key = `${rule.id}:${file.relativePath}:${lineNum}`;
            if (seen.has(key)) return;
            seen.add(key);
            findings.push({
              id: rule.id, category: rule.category, owasp: rule.owasp,
              severity: rule.severity, title: rule.title,
              file: file.relativePath, line: lineNum,
              evidence: line.trim(),
              message: rule.message, fix: rule.fix,
            });
          }
        });
        continue;
      }

      rule.pattern.lastIndex = 0;
      let match;
      const seen = new Set();
      while ((match = rule.pattern.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        const key = `${rule.id}:${file.relativePath}:${lineNum}`;
        if (seen.has(key)) continue;
        seen.add(key);
        findings.push({
          id: rule.id, category: rule.category, owasp: rule.owasp,
          severity: rule.severity, title: rule.title,
          file: file.relativePath, line: lineNum,
          evidence: lines[lineNum - 1]?.trim() || match[0],
          message: rule.message, fix: rule.fix,
        });
      }
    }
  }

  // Deduplicate by id+file+line
  const seen = new Set();
  return findings.filter(f => {
    const key = `${f.id}:${f.file}:${f.line}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

module.exports = { analyzeSecurityAsync };
