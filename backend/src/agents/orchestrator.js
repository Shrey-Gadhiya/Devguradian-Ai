const { v4: uuidv4 } = require('uuid');
const { analyzeArchitecture } = require('../analyzers/architectureAnalyzer');
const { runSecurityScan } = require('../analyzers/securityAnalyzer');
const { runQualityAnalysis } = require('../analyzers/codeQualityAnalyzer');
const { analyzeTestCoverage } = require('../analyzers/testAnalyzer');
const { analyzeDependencies } = require('../analyzers/dependencyAnalyzer');
const { scanDirectory, detectLanguage } = require('../utils/fileUtils');
const { generateFixes } = require('./fixAgent');
const { generateTests } = require('./testAgent');
const { generateReport } = require('./reportAgent');

const sessions = new Map();

function createSession(repoPath) {
  const id = uuidv4();
  const session = {
    id,
    repoPath,
    status: 'initializing',
    startTime: Date.now(),
    endTime: null,
    progress: 0,
    currentAgent: null,
    agentLogs: [],
    results: null,
    error: null
  };
  sessions.set(id, session);
  return session;
}

function getSession(id) {
  return sessions.get(id) || null;
}

function updateSession(id, updates) {
  const session = sessions.get(id);
  if (session) {
    Object.assign(session, updates);
  }
}

function logAgent(sessionId, agent, message, level = 'info') {
  const session = sessions.get(sessionId);
  if (session) {
    session.agentLogs.push({
      timestamp: new Date().toISOString(),
      agent,
      message,
      level
    });
  }
}

async function runAnalysis(sessionId, repoPath) {
  try {
    updateSession(sessionId, { status: 'scanning', progress: 5, currentAgent: 'Code Analyst' });
    logAgent(sessionId, 'Code Analyst', 'Scanning repository files...');

    // Scan files
    const files = await scanDirectory(repoPath);
    logAgent(sessionId, 'Code Analyst', `Found ${files.length} files to analyze`);

    // Build language map
    const langMap = {};
    for (const f of files) {
      langMap[f.path] = detectLanguage(f.path);
    }

    updateSession(sessionId, { progress: 15, currentAgent: 'Code Analyst' });
    logAgent(sessionId, 'Code Analyst', 'Analyzing architecture and project structure...');
    const architecture = await analyzeArchitecture(repoPath, files);
    logAgent(sessionId, 'Code Analyst', `Project: ${architecture.projectInfo.primaryLanguage}, ${files.length} files, ~${architecture.metrics.estimatedLinesOfCode} LOC`);

    updateSession(sessionId, { progress: 30, currentAgent: 'Security Agent' });
    logAgent(sessionId, 'Security Agent', 'Running OWASP security scan...');
    const security = await runSecurityScan(files, langMap);
    logAgent(sessionId, 'Security Agent', `Security scan complete: ${security.summary.total} findings (${security.summary.bySeverity.critical} critical, ${security.summary.bySeverity.high} high)`);

    updateSession(sessionId, { progress: 45, currentAgent: 'Security Agent' });
    logAgent(sessionId, 'Security Agent', 'Analyzing dependency risks...');
    const dependencies = await analyzeDependencies(repoPath, files);
    logAgent(sessionId, 'Security Agent', `Dependency analysis: ${dependencies.totalDependencies} deps, ${dependencies.summary.total} risks found`);

    updateSession(sessionId, { progress: 60, currentAgent: 'Test Agent' });
    logAgent(sessionId, 'Test Agent', 'Analyzing test coverage...');
    const tests = await analyzeTestCoverage(files, repoPath);
    logAgent(sessionId, 'Test Agent', `Coverage estimate: ${tests.coverageEstimate}% (${tests.testFiles} test files, ${tests.sourceFiles} source files)`);

    updateSession(sessionId, { progress: 70, currentAgent: 'Code Analyst' });
    logAgent(sessionId, 'Code Analyst', 'Running code quality analysis...');
    const quality = await runQualityAnalysis(files, langMap);
    logAgent(sessionId, 'Code Analyst', `Quality analysis: ${quality.summary.total} findings`);

    // Aggregate all findings
    const allFindings = [
      ...security.findings.map(f => ({ ...f, source: 'security' })),
      ...dependencies.findings.map(f => ({ ...f, source: 'dependency' })),
      ...tests.findings.map(f => ({ ...f, source: 'testing' })),
      ...quality.findings.map(f => ({ ...f, source: 'quality' })),
    ];

    // Prioritize findings
    const prioritized = prioritizeFindings(allFindings);

    updateSession(sessionId, { progress: 75, currentAgent: 'Debug Agent' });
    logAgent(sessionId, 'Debug Agent', 'Root-cause analysis on critical findings...');
    const criticalFindings = prioritized.filter(f => f.severity === 'critical').slice(0, 10);
    for (const f of criticalFindings) {
      logAgent(sessionId, 'Debug Agent', `Analyzing: [${f.ruleId}] ${f.file}:${f.line} - ${f.message}`);
    }

    updateSession(sessionId, { progress: 82, currentAgent: 'Review Agent' });
    logAgent(sessionId, 'Review Agent', 'Generating AI-powered fix suggestions...');
    const fixes = await generateFixes(prioritized.filter(f => ['critical', 'high'].includes(f.severity)).slice(0, 15));
    logAgent(sessionId, 'Review Agent', `Generated ${fixes.length} fix suggestions`);

    updateSession(sessionId, { progress: 88, currentAgent: 'Test Agent' });
    logAgent(sessionId, 'Test Agent', 'Generating regression tests...');
    const generatedTests = await generateTests(prioritized, architecture);
    logAgent(sessionId, 'Test Agent', `Generated ${generatedTests.length} test templates`);

    updateSession(sessionId, { progress: 93, currentAgent: 'Documentation Agent' });
    logAgent(sessionId, 'Documentation Agent', 'Generating engineering report...');

    const beforeMetrics = computeMetrics(prioritized, tests.coverageEstimate, 0);

    const report = await generateReport({
      architecture,
      security,
      dependencies,
      tests,
      quality,
      findings: prioritized,
      fixes,
      generatedTests,
      beforeMetrics,
      repoPath
    });

    logAgent(sessionId, 'Documentation Agent', 'Report generated successfully');

    const results = {
      sessionId,
      repoPath,
      architecture,
      security,
      dependencies,
      tests,
      quality,
      findings: prioritized,
      fixes,
      generatedTests,
      report,
      metrics: beforeMetrics,
      summary: {
        totalFindings: prioritized.length,
        critical: prioritized.filter(f => f.severity === 'critical').length,
        high: prioritized.filter(f => f.severity === 'high').length,
        medium: prioritized.filter(f => f.severity === 'medium').length,
        low: prioritized.filter(f => f.severity === 'low').length,
        filesAnalyzed: files.length,
        testCoverage: tests.coverageEstimate,
        fixesGenerated: fixes.length,
        testsGenerated: generatedTests.length
      }
    };

    updateSession(sessionId, {
      status: 'complete',
      progress: 100,
      currentAgent: null,
      endTime: Date.now(),
      results
    });

    logAgent(sessionId, 'System', `Analysis complete. ${prioritized.length} total findings.`);
    return results;

  } catch (err) {
    updateSession(sessionId, { status: 'error', error: err.message, endTime: Date.now() });
    logAgent(sessionId, 'System', `Error: ${err.message}`, 'error');
    throw err;
  }
}

function prioritizeFindings(findings) {
  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  return findings.sort((a, b) => (order[a.severity] || 4) - (order[b.severity] || 4));
}

function computeMetrics(findings, coverage, testsPass) {
  return {
    totalIssues: findings.length,
    critical: findings.filter(f => f.severity === 'critical').length,
    high: findings.filter(f => f.severity === 'high').length,
    medium: findings.filter(f => f.severity === 'medium').length,
    low: findings.filter(f => f.severity === 'low').length,
    testCoverage: coverage,
    securityScore: computeSecurityScore(findings),
    qualityScore: computeQualityScore(findings)
  };
}

function computeSecurityScore(findings) {
  const secFindings = findings.filter(f => f.source === 'security' || f.source === 'dependency');
  let deductions = 0;
  for (const f of secFindings) {
    if (f.severity === 'critical') deductions += 15;
    else if (f.severity === 'high') deductions += 8;
    else if (f.severity === 'medium') deductions += 3;
    else deductions += 1;
  }
  return Math.max(0, 100 - deductions);
}

function computeQualityScore(findings) {
  const qualFindings = findings.filter(f => f.source === 'quality');
  let deductions = 0;
  for (const f of qualFindings) {
    if (f.severity === 'high') deductions += 5;
    else if (f.severity === 'medium') deductions += 2;
    else deductions += 0.5;
  }
  return Math.max(0, 100 - Math.round(deductions));
}

module.exports = { createSession, getSession, updateSession, runAnalysis, logAgent };
