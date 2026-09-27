const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { startAnalysis, getSession } = require('../agents/orchestrator');

// POST /api/analysis/start
router.post('/start', async (req, res) => {
  const { repoPath } = req.body;
  if (!repoPath) return res.status(400).json({ error: 'repoPath is required' });

  const sessionId = uuidv4();
  try {
    await startAnalysis(repoPath, sessionId);
    res.json({ sessionId, status: 'started' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analysis/status/:sessionId
router.get('/status/:sessionId', (req, res) => {
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
    agentLogs: session.agentLogs.slice(-50),
  });
});

// GET /api/analysis/results/:sessionId
router.get('/results/:sessionId', (req, res) => {
  const session = getSession(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  if (session.status !== 'complete') return res.status(202).json({ status: session.status, progress: session.progress });
  res.json(session.results);
});

module.exports = router;
