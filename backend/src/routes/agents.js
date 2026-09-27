const express = require('express');
const router = express.Router();
const { getSession } = require('../agents/orchestrator');

const AGENT_DEFINITIONS = [
  { id: 'code-analyst', name: 'Code Analyst', description: 'Architecture, dependencies, risky code patterns', icon: '🔍', capabilities: ['file-scan', 'architecture-map', 'dependency-risk', 'code-metrics'] },
  { id: 'security-agent', name: 'Security Agent', description: 'OWASP vulnerabilities, secrets, unsafe dependencies', icon: '🔒', capabilities: ['owasp-scan', 'secret-detection', 'dependency-cve', 'injection-detection'] },
  { id: 'test-agent', name: 'Test Agent', description: 'Coverage gaps, test generation, failing tests', icon: '🧪', capabilities: ['coverage-analysis', 'test-generation', 'regression-tests'] },
  { id: 'debug-agent', name: 'Debug Agent', description: 'Root-cause analysis for failures and critical issues', icon: '🐛', capabilities: ['root-cause', 'stack-trace-analysis', 'critical-path'] },
  { id: 'review-agent', name: 'Review Agent', description: 'Review proposed changes and prevent regressions', icon: '👁️', capabilities: ['fix-review', 'regression-prevention', 'code-review'] },
  { id: 'doc-agent', name: 'Documentation Agent', description: 'Generate technical and security summary reports', icon: '📄', capabilities: ['markdown-report', 'json-export', 'security-summary'] }
];

// GET /api/agents — list all agents
router.get('/', (req, res) => {
  res.json({ agents: AGENT_DEFINITIONS });
});

// GET /api/agents/:sessionId/activity — get agent activity for a session
router.get('/:sessionId/activity', (req, res) => {
  const session = getSession(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const agentActivity = {};
  for (const agent of AGENT_DEFINITIONS) {
    agentActivity[agent.id] = { logs: [], status: 'idle' };
  }

  for (const log of session.agentLogs) {
    const agentId = nameToId(log.agent);
    if (agentActivity[agentId]) {
      agentActivity[agentId].logs.push(log);
      agentActivity[agentId].status = session.status === 'complete' ? 'done' : 'active';
    }
  }

  res.json({
    sessionId: session.id,
    currentAgent: session.currentAgent,
    status: session.status,
    agents: AGENT_DEFINITIONS.map(a => ({
      ...a,
      ...agentActivity[a.id],
      logCount: agentActivity[a.id].logs.length
    }))
  });
});

function nameToId(name) {
  const map = {
    'Code Analyst': 'code-analyst',
    'Security Agent': 'security-agent',
    'Test Agent': 'test-agent',
    'Debug Agent': 'debug-agent',
    'Review Agent': 'review-agent',
    'Documentation Agent': 'doc-agent',
    'System': 'doc-agent'
  };
  return map[name] || 'code-analyst';
}

module.exports = router;
