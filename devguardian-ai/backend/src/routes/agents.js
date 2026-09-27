const express = require('express');
const router = express.Router();
const { listAgents, getSession } = require('../agents/orchestrator');

// GET /api/agents
router.get('/', (req, res) => {
  res.json(listAgents());
});

// GET /api/agents/session/:sessionId
router.get('/session/:sessionId', (req, res) => {
  const session = getSession(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json({
    sessionId: session.id,
    status: session.status,
    currentAgent: session.currentAgent,
    agentLogs: session.agentLogs,
    startTime: session.startTime,
    endTime: session.endTime,
  });
});

module.exports = router;
