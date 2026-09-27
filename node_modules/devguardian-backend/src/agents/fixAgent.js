const AIProvider = require('../ai/aiProvider');

async function generateFixes(findings) {
  const fixes = [];
  const ai = new AIProvider();

  for (const finding of findings) {
    const fix = await generateSingleFix(finding, ai);
    fixes.push(fix);
  }
  return fixes;
}

async function generateSingleFix(finding, ai) {
  const baseRemediation = finding.remediation || 'Review and fix according to best practices.';

  // Build a structured fix suggestion based on the finding
  const fixTemplate = buildFixTemplate(finding);

  // Attempt AI enhancement if available
  let aiSuggestion = null;
  if (ai.isAvailable()) {
    try {
      const prompt = `You are a security engineer. Given this code issue, provide a concise specific fix.

Issue: ${finding.message}
Category: ${finding.category}
Severity: ${finding.severity}
Evidence: ${finding.evidence}
File: ${finding.file}:${finding.line}

Provide a brief (2-3 sentences) specific code fix suggestion. Be concrete, not generic.`;

      aiSuggestion = await ai.complete(prompt, 300);
    } catch { /* fallback to template */ }
  }

  return {
    findingId: `${finding.ruleId}-${finding.file}-${finding.line}`,
    ruleId: finding.ruleId,
    severity: finding.severity,
    category: finding.category,
    file: finding.file,
    line: finding.line,
    issue: finding.message,
    evidence: finding.evidence,
    remediation: baseRemediation,
    codeExample: fixTemplate,
    aiEnhanced: aiSuggestion,
    approved: false,
    applied: false
  };
}

function buildFixTemplate(finding) {
  const templates = {
    'SEC001': `// Instead of:\neval(userInput);\n\n// Use:\nconst data = JSON.parse(userInput); // for JSON\n// or use a whitelist approach for dynamic behavior`,
    'SEC002': `// Instead of:\nexec(\`command \${userInput}\`);\n\n// Use:\nconst { execFile } = require('child_process');\nexecFile('command', [sanitizedArg], callback);`,
    'SEC003': `// Instead of:\ndb.query(\`SELECT * FROM users WHERE id = \${userId}\`);\n\n// Use:\ndb.query('SELECT * FROM users WHERE id = ?', [userId]);`,
    'SEC006': `// Instead of:\nconst apiKey = "sk-abc123...";\n\n// Use:\nconst apiKey = process.env.API_KEY;\n// Add API_KEY to .env file (never commit)`,
    'SEC008': `// Instead of:\nconst hash = crypto.createHash('md5').update(password).digest('hex');\n\n// Use:\nconst bcrypt = require('bcrypt');\nconst hash = await bcrypt.hash(password, 12);`,
    'SEC010': `// Instead of:\nfs.readFile(req.params.filename, callback);\n\n// Use:\nconst safePath = path.resolve('/allowed/dir', path.basename(req.params.filename));\nif (!safePath.startsWith('/allowed/dir')) throw new Error('Invalid path');\nfs.readFile(safePath, callback);`,
    'QA003': `// Instead of:\ntry { ... } catch (err) {}\n\n// Use:\ntry { ... } catch (err) {\n  logger.error('Operation failed', { error: err.message });\n  throw err; // or handle appropriately\n}`,
  };
  return templates[finding.ruleId] || null;
}

module.exports = { generateFixes };
