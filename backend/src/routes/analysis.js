const express = require('express');
const router = express.Router();
const { createSession, getSession, runAnalysis } = require('../agents/orchestrator');
const { activeRepos } = require('./repository');

// POST /api/analysis/start
router.post('/start', async (req, res) => {
  const { repoId, repoPath } = req.body;

  let targetPath = repoPath;

  if (repoId) {
    const repo = activeRepos.get(repoId);
    if (!repo) return res.status(404).json({ error: 'Repository not found. Load it first via /api/repository' });
    targetPath = repo.path;
  }

  if (!targetPath) return res.status(400).json({ error: 'repoId or repoPath is required' });

  try {
    const session = createSession(targetPath);
    // Start analysis async
    runAnalysis(session.id, targetPath).catch(err => {
      console.error(`Analysis ${session.id} failed:`, err.message);
    });
    res.json({ sessionId: session.id, status: session.status, message: 'Analysis started' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analysis/:sessionId/status
router.get('/:sessionId/status', (req, res) => {
  const session = getSession(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json({
    sessionId: session.id,
    status: session.status,
    progress: session.progress,
    currentAgent: session.currentAgent,
    startTime: session.startTime,
    endTime: session.endTime,
    error: session.error,
    agentLogs: session.agentLogs.slice(-50) // last 50 logs
  });
});

// GET /api/analysis/:sessionId/results
router.get('/:sessionId/results', (req, res) => {
  const session = getSession(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  if (session.status !== 'complete') {
    return res.status(202).json({ status: session.status, progress: session.progress });
  }
  res.json(session.results);
});

// GET /api/analysis/:sessionId/findings
router.get('/:sessionId/findings', (req, res) => {
  const session = getSession(req.params.sessionId);
  if (!session || !session.results) return res.status(404).json({ error: 'No results yet' });
  const { severity, category, source } = req.query;
  let findings = session.results.findings;
  if (severity) findings = findings.filter(f => f.severity === severity);
  if (category) findings = findings.filter(f => f.category === category);
  if (source) findings = findings.filter(f => f.source === source);
  res.json({ findings, total: findings.length });
});

// GET /api/analysis/:sessionId/logs
router.get('/:sessionId/logs', (req, res) => {
  const session = getSession(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json({ logs: session.agentLogs });
});

module.exports = router;
