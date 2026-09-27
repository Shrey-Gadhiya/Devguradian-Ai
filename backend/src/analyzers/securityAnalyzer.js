const { readFileLines } = require('../utils/fileUtils');
const path = require('path');

// OWASP-aligned security patterns
const SECURITY_RULES = [
  // Injection
  { id: 'SEC001', severity: 'critical', category: 'Injection', pattern: /eval\s*\(/, message: 'Use of eval() - potential code injection', languages: ['javascript', 'typescript', 'python'] },
  { id: 'SEC002', severity: 'critical', category: 'Injection', pattern: /exec\s*\(\s*[`'"]\s*\$|exec\s*\(\s*f['"]|exec\s*\(.*\+/, message: 'Dynamic command execution with user input - OS injection risk', languages: ['javascript', 'typescript', 'python', 'ruby'] },
  { id: 'SEC003', severity: 'critical', category: 'SQL Injection', pattern: /query\s*\(\s*[`'"]\s*SELECT|query\s*\(\s*[`'"]\s*INSERT|query\s*\(\s*[`'"]\s*UPDATE|query\s*\(\s*[`'"]\s*DELETE/, message: 'Raw SQL query construction - SQL injection risk', languages: ['javascript', 'typescript'] },
  { id: 'SEC004', severity: 'high', category: 'SQL Injection', pattern: /(SELECT|INSERT|UPDATE|DELETE).*\+\s*(req\.|request\.|params\.|query\.|body\.)/, message: 'SQL string concatenation with request data', languages: ['javascript', 'typescript', 'python', 'java', 'php'] },
  // XSS
  { id: 'SEC005', severity: 'high', category: 'XSS', pattern: /innerHTML\s*=|document\.write\s*\(|\.html\s*\(.*req\.|dangerouslySetInnerHTML/, message: 'Potential XSS via unsanitized HTML rendering', languages: ['javascript', 'typescript'] },
  // Secrets / Credentials
  { id: 'SEC006', severity: 'critical', category: 'Secrets', pattern: /(password|passwd|secret|api_key|apikey|token|private_key)\s*=\s*['"][^'"${}]{6,}['"]/, message: 'Hardcoded credential or secret detected', languages: [] },
  { id: 'SEC007', severity: 'critical', category: 'Secrets', pattern: /(sk-[a-zA-Z0-9]{20,}|AKIA[A-Z0-9]{16}|ghp_[a-zA-Z0-9]{36}|xox[baprs]-[a-zA-Z0-9-]+)/, message: 'Possible hardcoded API key (OpenAI/AWS/GitHub/Slack)', languages: [] },
  // Crypto
  { id: 'SEC008', severity: 'high', category: 'Cryptography', pattern: /md5\s*\(|sha1\s*\(|createHash\s*\(\s*['"]md5['"]|createHash\s*\(\s*['"]sha1['"]/, message: 'Weak hashing algorithm (MD5/SHA1) used', languages: ['javascript', 'typescript', 'python'] },
  { id: 'SEC009', severity: 'high', category: 'Cryptography', pattern: /Math\.random\s*\(\s*\).*token|Math\.random\s*\(\s*\).*secret|random\(\).*password/, message: 'Insecure random number generator used for security-sensitive value', languages: ['javascript', 'typescript'] },
  // Path traversal
  { id: 'SEC010', severity: 'high', category: 'Path Traversal', pattern: /readFile\s*\(\s*(req\.|params\.|query\.|body\.)|readFileSync\s*\(\s*(req\.|params\.|query\.|body\.)/, message: 'File read with user-controlled path - path traversal risk', languages: ['javascript', 'typescript'] },
  // SSRF
  { id: 'SEC011', severity: 'high', category: 'SSRF', pattern: /fetch\s*\(\s*(req\.|params\.|query\.|body\.)|(axios|http|https)\.get\s*\(\s*(req\.|params\.|query\.|body\.)/, message: 'HTTP request with user-controlled URL - SSRF risk', languages: ['javascript', 'typescript'] },
  // Auth
  { id: 'SEC012', severity: 'medium', category: 'Authentication', pattern: /jwt\.verify\s*\(.*,\s*['"][^'"]{1,10}['"]/, message: 'JWT verified with short/weak secret', languages: ['javascript', 'typescript'] },
  { id: 'SEC013', severity: 'medium', category: 'Authentication', pattern: /password\s*===\s*|password\s*==\s*/, message: 'Plain text password comparison', languages: ['javascript', 'typescript', 'python'] },
  // CORS
  { id: 'SEC014', severity: 'medium', category: 'CORS', pattern: /cors\s*\(\s*\)|origin\s*:\s*['"]?\*['"]?/, message: 'Wildcard CORS origin - all origins allowed', languages: ['javascript', 'typescript'] },
  // Debug/logging
  { id: 'SEC015', severity: 'low', category: 'Information Disclosure', pattern: /console\.log\s*\(.*password|console\.log\s*\(.*token|console\.log\s*\(.*secret|print\s*\(.*password/, message: 'Sensitive data potentially logged', languages: ['javascript', 'typescript', 'python'] },
  // Python specific
  { id: 'SEC016', severity: 'critical', category: 'Injection', pattern: /pickle\.loads?\s*\(|pickle\.load\s*\(/, message: 'Unsafe deserialization via pickle', languages: ['python'] },
  { id: 'SEC017', severity: 'high', category: 'Injection', pattern: /subprocess\.(call|run|Popen)\s*\(.*shell\s*=\s*True/, message: 'subprocess with shell=True - command injection risk', languages: ['python'] },
  // PHP specific
  { id: 'SEC018', severity: 'critical', category: 'Injection', pattern: /\$_GET\[|\$_POST\[|\$_REQUEST\[/, message: 'Unsanitized superglobal access', languages: ['php'] },
];

const SENSITIVE_FILE_PATTERNS = [
  { pattern: /\.env$/, message: 'Environment file with potential secrets' },
  { pattern: /private.*key|id_rsa|\.pem$|\.p12$|\.pfx$/, message: 'Private key or certificate file' },
  { pattern: /credentials?\.json|secrets?\.json|config\.json/, message: 'Credential/secrets configuration file' }
];

async function analyzeFileSecurity(file, lang) {
  const findings = [];
  const lines = await readFileLines(file.absPath);
  if (!lines || lines.length === 0) return findings;

  for (const rule of SECURITY_RULES) {
    if (rule.languages.length > 0 && !rule.languages.includes(lang) && !rule.languages.includes('*')) continue;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (rule.pattern.test(line)) {
        findings.push({
          ruleId: rule.id,
          severity: rule.severity,
          category: rule.category,
          file: file.path,
          line: i + 1,
          column: 1,
          evidence: line.trim().substring(0, 200),
          message: rule.message,
          remediation: getRemediation(rule.id)
        });
        break; // one finding per rule per file to avoid noise
      }
    }
  }

  // Sensitive file name check
  for (const sp of SENSITIVE_FILE_PATTERNS) {
    if (sp.pattern.test(file.path)) {
      findings.push({
        ruleId: 'SEC_FILE',
        severity: 'high',
        category: 'Secrets',
        file: file.path,
        line: 1,
        column: 1,
        evidence: file.path,
        message: sp.message,
        remediation: 'Ensure this file is in .gitignore and never committed to version control.'
      });
    }
  }

  return findings;
}

function getRemediation(ruleId) {
  const remediations = {
    'SEC001': 'Replace eval() with safe alternatives like JSON.parse() for data, or Function constructors with input validation.',
    'SEC002': 'Use parameterized commands or a command whitelist. Never pass user input directly to shell commands.',
    'SEC003': 'Use parameterized queries or an ORM. Never construct SQL with string concatenation.',
    'SEC004': 'Use prepared statements with parameterized queries.',
    'SEC005': 'Use textContent instead of innerHTML, or sanitize with DOMPurify before rendering.',
    'SEC006': 'Move credentials to environment variables. Use a secrets manager for production.',
    'SEC007': 'Revoke and rotate the exposed key immediately. Use environment variables or secrets manager.',
    'SEC008': 'Use SHA-256 or bcrypt/argon2 for password hashing. Use SHA-256+ for general hashing.',
    'SEC009': 'Use crypto.randomBytes() or crypto.getRandomValues() for security-sensitive randomness.',
    'SEC010': 'Validate and sanitize file paths. Use path.resolve() and check it stays within allowed directory.',
    'SEC011': 'Validate and allowlist URLs before making requests. Reject private/internal IP ranges.',
    'SEC012': 'Use a long random secret (32+ chars) stored in environment variables for JWT signing.',
    'SEC013': 'Use bcrypt.compare() or argon2.verify() for password comparison. Never store plain text.',
    'SEC014': 'Configure CORS with explicit allowed origins. Avoid wildcard in production.',
    'SEC015': 'Remove or redact sensitive data before logging. Use structured logging with field redaction.',
    'SEC016': 'Use json.loads() or other safe serialization formats instead of pickle for untrusted data.',
    'SEC017': 'Use subprocess with shell=False and pass arguments as a list.',
    'SEC018': 'Always sanitize and validate $_GET/$_POST values. Use prepared statements for DB queries.',
  };
  return remediations[ruleId] || 'Review and fix according to OWASP security guidelines.';
}

async function runSecurityScan(files, langMap) {
  const allFindings = [];
  for (const file of files) {
    const lang = langMap[file.path] || 'unknown';
    const findings = await analyzeFileSecurity(file, lang);
    allFindings.push(...findings);
  }

  // Summary stats
  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const f of allFindings) {
    if (bySeverity[f.severity] !== undefined) bySeverity[f.severity]++;
  }

  return {
    findings: allFindings,
    summary: {
      total: allFindings.length,
      bySeverity,
      filesScanned: files.length
    }
  };
}

module.exports = { runSecurityScan, analyzeFileSecurity };
