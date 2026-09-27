const fs = require('fs-extra');
const path = require('path');
const { readFile } = require('../utils/fileUtils');

// Known vulnerable package patterns (simplified SBOM-like check)
const KNOWN_RISKY_PACKAGES = {
  'lodash': { minSafeVersion: '4.17.21', cve: 'CVE-2021-23337', severity: 'high', description: 'Prototype pollution in lodash < 4.17.21' },
  'moment': { note: 'Deprecated package - use date-fns or dayjs', severity: 'low' },
  'node-fetch': { minSafeVersion: '2.6.7', cve: 'CVE-2022-0235', severity: 'high', description: 'Exposure of sensitive headers in node-fetch < 2.6.7' },
  'axios': { minSafeVersion: '0.21.2', cve: 'CVE-2021-3749', severity: 'medium', description: 'ReDoS in axios < 0.21.2' },
  'minimist': { minSafeVersion: '1.2.6', cve: 'CVE-2021-44906', severity: 'high', description: 'Prototype pollution in minimist' },
  'ansi-regex': { minSafeVersion: '5.0.1', cve: 'CVE-2021-3807', severity: 'high', description: 'ReDoS in ansi-regex' },
  'glob-parent': { minSafeVersion: '5.1.2', cve: 'CVE-2020-28469', severity: 'high', description: 'ReDoS in glob-parent' },
  'json5': { minSafeVersion: '2.2.2', cve: 'CVE-2022-46175', severity: 'high', description: 'Prototype pollution in json5' },
  'express': { minSafeVersion: '4.18.0', cve: 'CVE-2022-24999', severity: 'medium', description: 'Open redirect in express' },
  'qs': { minSafeVersion: '6.9.7', cve: 'CVE-2022-24999', severity: 'high', description: 'Prototype poisoning in qs' },
  'xmlhttprequest-ssl': { note: 'Abandoned package with known security issues', severity: 'high' },
  'debug': { minSafeVersion: '2.6.9', cve: 'CVE-2017-16137', severity: 'medium', description: 'ReDoS in debug' },
  'serialize-javascript': { minSafeVersion: '3.1.0', cve: 'CVE-2020-7660', severity: 'high', description: 'Arbitrary code execution via serialized regex' },
};

async function analyzeDependencies(dirPath, files) {
  const findings = [];
  const allDeps = {};

  // Find package.json files (not in node_modules)
  const pkgFiles = files.filter(f => path.basename(f.path) === 'package.json' && !f.path.includes('node_modules'));

  for (const pkgFile of pkgFiles) {
    try {
      const content = await readFile(pkgFile.absPath);
      const pkg = JSON.parse(content);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      for (const [name, versionSpec] of Object.entries(deps)) {
        allDeps[name] = versionSpec;
        const risk = KNOWN_RISKY_PACKAGES[name];
        if (risk) {
          findings.push({
            ruleId: 'DEP001',
            severity: risk.severity,
            category: 'Dependency Risk',
            file: pkgFile.path,
            line: 1,
            evidence: `"${name}": "${versionSpec}"`,
            message: risk.description || risk.note || `Risky dependency: ${name}`,
            cve: risk.cve,
            remediation: risk.minSafeVersion
              ? `Update ${name} to >= ${risk.minSafeVersion}`
              : `Replace ${name} with a maintained alternative`
          });
        }
      }
    } catch { /* skip */ }
  }

  // Check for requirements.txt
  const reqFile = files.find(f => path.basename(f.path) === 'requirements.txt');
  if (reqFile) {
    try {
      const content = await readFile(reqFile.absPath);
      const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
      for (const line of lines) {
        const [name] = line.split(/[>=<!]/);
        const trimName = name.trim().toLowerCase();
        if (!line.includes('>=') && !line.includes('==')) {
          findings.push({
            ruleId: 'DEP002',
            severity: 'low',
            category: 'Dependency Risk',
            file: reqFile.path,
            line: 1,
            evidence: line.trim(),
            message: `Unpinned dependency: ${trimName} - no version constraint`,
            remediation: `Pin version: ${trimName}==<specific_version>`
          });
        }
      }
    } catch { /* skip */ }
  }

  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const f of findings) {
    if (bySeverity[f.severity] !== undefined) bySeverity[f.severity]++;
  }

  return {
    findings,
    totalDependencies: Object.keys(allDeps).length,
    summary: { total: findings.length, bySeverity }
  };
}

module.exports = { analyzeDependencies };
