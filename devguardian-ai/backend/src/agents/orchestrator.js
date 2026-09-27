/**
 * Orchestrator — 6-agent pipeline with session management
 */
const { v4: uuidv4 } = require('uuid');
const { scanDirectory } = require('../utils/fileUtils');
const { analyzeArchitecture } = require('../analyzers/architectureAnalyzer');
const { analyzeSecurityAsync } = require('../analyzers/securityAnalyzer');
const { analyzeCodeQuality } = require('../analyzers/codeQualityAnalyzer');
const { analyzeTests } = require('../analyzers/testAnalyzer');
const { analyzeDependencies } = require('../analyzers/dependencyAnalyzer');
const { generateFixes } = require('./fixAgent');
const { generateTests } = require('./testAgent');
const { generateReport } = require('./reportAgent');

const sessions = new Map();

const AGENTS = [
  { id: 'code-analyst',   name: 'Code Analyst',   description: 'Architecture, dependencies, and risky code patterns',    capabilities: ['File scanning', 'Architecture mapping', 'Language detection', 'Complexity analysis'] },
  { id: 'security-agent', name: 'Security Agent',  description: 'OWASP vulnerabilities, secrets, unsafe dependencies',    capabilities: ['OWASP rules engine', 'Secret detection', 'Dependency CVE check', 'Injection detection'] },
  { id: 'test-agent',     name: 'Test Agent',      description: 'Coverage gaps, unit/integration tests, failing tests',   capabilities: ['Coverage estimation', 'Test quality analysis', 'Test generation', 'Gap identification'] },
  { id: 'debug-agent',    name: 'Debug Agent',     description: 'Root-cause analysis for failures and regressions',       capabilities: ['Error pattern matching', 'Stack trace analysis', 'Regression detection'] },
  { id: 'review-agent',   name: 'Review Agent',    description: 'Review proposed changes and prevent regressions',        capabilities: ['Change review', 'Before/after comparison', 'Fix validation', 'Diff generation'] },
  { id: 'doc-agent',      name: 'Documentation Agent', description: 'Generate technical and security documentation',      capabilities: ['Markdown reports', 'JSON export', 'Executive summary', 'Fix documentation'] },
];

async function startAnalysis(repoPath, sessionId) {
  const session = {
    id: sessionId,
    status: 'running',
    progress: 0,
    currentAgent: null,
    agentLogs: [],
    startTime: Date.now(),
    endTime: null,
    repoPath,
    results: null,
    error: null,
  };
  sessions.set(sessionId, session);

  // Run async, don't await
  runPipeline(session).catch(err => {
    session.status = 'error';
    session.error = err.message;
    log(session, 'orchestrator', `Pipeline failed: ${err.message}`, 'error');
  });

  return session;
}

async function runPipeline(session) {
  const { repoPath } = session;

  try {
    // ── Step 1: Scan repository ──────────────────────────────
    log(session, 'orchestrator', `Scanning repository: ${repoPath}`, 'info');
    session.progress = 5;
    const files = await scanDirectory(repoPath);
    log(session, 'code-analyst', `Scanned ${files.length} files`, 'success');

    // ── Step 2: Architecture Analysis ────────────────────────
    session.currentAgent = 'code-analyst';
    session.progress = 15;
    log(session, 'code-analyst', 'Running architecture analysis…', 'info');
    const architecture = await analyzeArchitecture(repoPath, files);
    log(session, 'code-analyst', `Language: ${architecture.projectInfo.primaryLanguage}, Frameworks: ${architecture.projectInfo.frameworks.join(', ') || 'none'}`, 'success');

    // ── Step 3: Security Analysis ─────────────────────────────
    session.currentAgent = 'security-agent';
    session.progress = 30;
    log(session, 'security-agent', `Running OWASP security scan on ${files.length} files…`, 'info');
    const securityFindings = await analyzeSecurityAsync(files);
    const secBySeverity = countBySeverity(securityFindings);
    log(session, 'security-agent', `Found ${securityFindings.length} security issues: ${secBySeverity.critical} critical, ${secBySeverity.high} high`, securityFindings.length > 0 ? 'warning' : 'success');

    // ── Step 4: Code Quality Analysis ────────────────────────
    session.currentAgent = 'code-analyst';
    session.progress = 45;
    log(session, 'code-analyst', 'Analyzing code quality…', 'info');
    const qualityResult = await analyzeCodeQuality(files);
    log(session, 'code-analyst', `Found ${qualityResult.findings.length} quality issues`, 'success');

    // ── Step 5: Test Analysis ─────────────────────────────────
    session.currentAgent = 'test-agent';
    session.progress = 55;
    log(session, 'test-agent', 'Analyzing test coverage…', 'info');
    const testResult = await analyzeTests(files);
    log(session, 'test-agent', `Estimated coverage: ${testResult.summary.estimatedCoverage}%, ${testResult.summary.testFiles} test files, ${testResult.summary.untestedFiles} untested files`, 'success');

    // ── Step 6: Dependency Analysis ───────────────────────────
    session.currentAgent = 'security-agent';
    session.progress = 65;
    log(session, 'security-agent', 'Scanning dependencies for CVEs…', 'info');
    const depResult = await analyzeDependencies(repoPath);
    log(session, 'security-agent', `${depResult.summary.total} packages, ${depResult.findings.length} vulnerabilities`, depResult.findings.length > 0 ? 'warning' : 'success');

    // ── Step 7: Merge all findings ────────────────────────────
    const allFindings = [
      ...securityFindings,
      ...qualityResult.findings,
      ...testResult.findings,
      ...depResult.findings,
    ].sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity));

    const summary = countBySeverity(allFindings);
    summary.total = allFindings.length;

    // ── Step 8: Fix Agent ─────────────────────────────────────
    session.currentAgent = 'review-agent';
    session.progress = 75;
    const prioritizedFindings = allFindings.filter(f => f.severity === 'critical' || f.severity === 'high').slice(0, 15);
    log(session, 'review-agent', `Generating fixes for ${prioritizedFindings.length} critical/high findings…`, 'info');
    const fixes = await generateFixes(prioritizedFindings);
    log(session, 'review-agent', `Generated ${fixes.length} fix suggestions`, 'success');

    // ── Step 9: Test Generation ───────────────────────────────
    session.currentAgent = 'test-agent';
    session.progress = 85;
    log(session, 'test-agent', 'Generating regression tests…', 'info');
    const generatedTests = await generateTests(files, prioritizedFindings);
    log(session, 'test-agent', `Generated ${generatedTests.length} test suites`, 'success');

    // ── Step 10: Report ───────────────────────────────────────
    session.currentAgent = 'doc-agent';
    session.progress = 95;
    log(session, 'doc-agent', 'Generating final report…', 'info');
    const report = generateReport({ summary, security: { findings: securityFindings }, quality: qualityResult, tests: testResult, dependencies: depResult, architecture, fixes, generatedTests });
    log(session, 'doc-agent', `Report generated. Overall health score: ${report.scores.overall}/100`, 'success');

    session.results = {
      summary,
      findings: allFindings,
      security: { findings: securityFindings, bySeverity: secBySeverity },
      quality: qualityResult,
      tests: testResult,
      dependencies: depResult,
      architecture,
      fixes,
      generatedTests,
      report,
      agentLogs: session.agentLogs,
    };

    session.status = 'complete';
    session.progress = 100;
    session.endTime = Date.now();
    session.currentAgent = null;
    log(session, 'orchestrator', `Analysis complete in ${((session.endTime - session.startTime) / 1000).toFixed(1)}s`, 'success');
  } catch (err) {
    session.status = 'error';
    session.error = err.message;
    throw err;
  }
}

function log(session, agentId, message, level = 'info') {
  const entry = { agentId, message, level, timestamp: new Date().toISOString() };
  session.agentLogs.push(entry);
  console.log(`[${level.toUpperCase()}][${agentId}] ${message}`);
}

function countBySeverity(findings) {
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const f of findings) counts[f.severity] = (counts[f.severity] || 0) + 1;
  return counts;
}

function severityOrder(s) {
  return { critical: 0, high: 1, medium: 2, low: 3 }[s] ?? 4;
}

function getSession(id) { return sessions.get(id); }
function listAgents() { return AGENTS; }

module.exports = { startAnalysis, getSession, listAgents, sessions };
