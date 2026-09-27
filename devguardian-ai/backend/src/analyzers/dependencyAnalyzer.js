/**
 * Dependency Analyzer — npm/pip/Maven/Go package risk assessment
 */
const fs = require('fs');
const path = require('path');

// Known vulnerable packages (demo data — in production, integrate with OSV/Snyk API)
const KNOWN_VULNERABLE = {
  // npm
  'lodash': { below: '4.17.21', cve: 'CVE-2021-23337', severity: 'high', description: 'Prototype pollution via zipObjectDeep' },
  'axios': { below: '0.21.2', cve: 'CVE-2021-3749', severity: 'medium', description: 'SSRF and path traversal via protocol-relative URLs' },
  'express': { below: '4.17.3', cve: 'CVE-2022-24999', severity: 'medium', description: 'Open redirect in qs dependency' },
  'jsonwebtoken': { below: '9.0.0', cve: 'CVE-2022-23529', severity: 'critical', description: 'Arbitrary file write via crafted JWK' },
  'node-fetch': { below: '2.6.7', cve: 'CVE-2022-0235', severity: 'high', description: 'Exposure of sensitive information' },
  'minimist': { below: '1.2.6', cve: 'CVE-2021-44906', severity: 'critical', description: 'Prototype pollution' },
  'path-parse': { below: '1.0.7', cve: 'CVE-2021-23343', severity: 'medium', description: 'Regular expression denial of service' },
  'glob-parent': { below: '5.1.2', cve: 'CVE-2020-28469', severity: 'high', description: 'Regular expression denial of service' },
  'underscore': { below: '1.13.0', cve: 'CVE-2021-23358', severity: 'critical', description: 'Arbitrary code injection via template' },
  'serialize-javascript': { below: '6.0.0', cve: 'CVE-2022-0142', severity: 'medium', description: 'XSS via serialized functions' },
  'ws': { below: '7.4.6', cve: 'CVE-2021-32640', severity: 'medium', description: 'ReDoS via special crafted value' },
  'trim': { below: '0.0.3', cve: 'CVE-2020-7753', severity: 'high', description: 'Regular expression DoS' },
  'is-svg': { below: '4.3.2', cve: 'CVE-2021-3770', severity: 'high', description: 'ReDoS' },
  'y18n': { below: '5.0.5', cve: 'CVE-2020-7774', severity: 'critical', description: 'Prototype pollution' },
  'ini': { below: '1.3.6', cve: 'CVE-2020-7788', severity: 'high', description: 'Prototype pollution' },
  'acorn': { below: '7.4.0', cve: 'CVE-2020-7598', severity: 'medium', description: 'Regular expression DoS' },
  'dot-prop': { below: '5.1.1', cve: 'CVE-2020-8116', severity: 'high', description: 'Prototype pollution' },
  'helmet': { above: '999', note: 'Safe — security middleware', severity: 'safe' },
  // Python
  'django': { below: '3.2.14', cve: 'CVE-2022-28347', severity: 'critical', description: 'SQL injection via QuerySet.annotate' },
  'flask': { below: '2.0.0', cve: 'CVE-2018-1000656', severity: 'high', description: 'Improper input validation' },
  'requests': { below: '2.27.0', cve: 'CVE-2023-32681', severity: 'medium', description: 'Proxy-Authorization header forwarded to redirected URLs' },
  'pyyaml': { below: '5.4', cve: 'CVE-2020-14343', severity: 'critical', description: 'Arbitrary code execution via YAML deserialization' },
  'cryptography': { below: '41.0.0', cve: 'CVE-2023-38325', severity: 'high', description: 'Invalid SSH certificate parsing' },
  'pillow': { below: '9.0.0', cve: 'CVE-2022-22817', severity: 'critical', description: 'Expression injection via ImagePath.path' },
};

async function analyzeDependencies(dirPath) {
  const results = { packages: [], findings: [], summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, outdated: 0 } };

  // npm
  const pkgPath = path.join(dirPath, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      for (const [name, version] of Object.entries(allDeps)) {
        const cleanVer = version.replace(/[\^~>=<]/g, '').split(' ')[0];
        const risk = assessRisk(name, cleanVer);
        results.packages.push({ name, version: cleanVer, manager: 'npm', ...risk });
        if (risk.cve) {
          results.findings.push({ severity: risk.severity, rule: 'DEP-001', title: `Vulnerable dependency: ${name}`, file: 'package.json', line: 0, evidence: `${name}@${cleanVer}`, message: risk.description || 'Known vulnerability', fix: `Upgrade ${name} to a patched version.`, cve: risk.cve });
          results.summary[risk.severity] = (results.summary[risk.severity] || 0) + 1;
        }
      }
      results.summary.total = Object.keys(allDeps).length;
    } catch (e) { /* skip */ }
  }

  // Python
  const reqPath = path.join(dirPath, 'requirements.txt');
  if (fs.existsSync(reqPath)) {
    try {
      const lines = fs.readFileSync(reqPath, 'utf8').split('\n').filter(l => l.trim() && !l.startsWith('#'));
      for (const line of lines) {
        const [name, version] = line.split(/[=<>!]+/);
        if (!name) continue;
        const cleanName = name.trim().toLowerCase();
        const cleanVer = (version || '0').trim();
        const risk = assessRisk(cleanName, cleanVer);
        results.packages.push({ name: cleanName, version: cleanVer, manager: 'pip', ...risk });
        if (risk.cve) {
          results.findings.push({ severity: risk.severity, rule: 'DEP-001', title: `Vulnerable Python package: ${cleanName}`, file: 'requirements.txt', line: 0, evidence: line.trim(), message: risk.description || 'Known vulnerability', fix: `Upgrade ${cleanName} to a patched version.`, cve: risk.cve });
          results.summary[risk.severity] = (results.summary[risk.severity] || 0) + 1;
        }
        results.summary.total++;
      }
    } catch (e) { /* skip */ }
  }

  return results;
}

function assessRisk(name, version) {
  const vulnInfo = KNOWN_VULNERABLE[name.toLowerCase()];
  if (!vulnInfo) return { riskLevel: 'unknown' };
  if (vulnInfo.severity === 'safe') return { riskLevel: 'safe' };

  const [major, minor, patch] = (version || '0').split('.').map(Number);
  const [bmajor, bminor, bpatch] = (vulnInfo.below || '0').split('.').map(Number);

  const isVulnerable = major < bmajor ||
    (major === bmajor && minor < bminor) ||
    (major === bmajor && minor === bminor && (patch || 0) < (bpatch || 0));

  if (isVulnerable) {
    return { riskLevel: vulnInfo.severity, severity: vulnInfo.severity, cve: vulnInfo.cve, description: vulnInfo.description, fixVersion: vulnInfo.below };
  }
  return { riskLevel: 'ok' };
}

module.exports = { analyzeDependencies };
