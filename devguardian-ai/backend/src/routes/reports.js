const express = require('express');
const router = express.Router();
const { getSession } = require('../agents/orchestrator');

// GET /api/reports/markdown/:sessionId
router.get('/markdown/:sessionId', (req, res) => {
  const session = getSession(req.params.sessionId);
  if (!session || !session.results) return res.status(404).json({ error: 'No results found' });
  res.setHeader('Content-Type', 'text/markdown');
  res.setHeader('Content-Disposition', 'attachment; filename="devguardian-report.md"');
  res.send(session.results.report.markdown);
});

// GET /api/reports/json/:sessionId
router.get('/json/:sessionId', (req, res) => {
  const session = getSession(req.params.sessionId);
  if (!session || !session.results) return res.status(404).json({ error: 'No results found' });
  res.setHeader('Content-Disposition', 'attachment; filename="devguardian-report.json"');
  res.json(session.results.report.json);
});

// GET /api/reports/summary/:sessionId
router.get('/summary/:sessionId', (req, res) => {
  const session = getSession(req.params.sessionId);
  if (!session || !session.results) return res.status(404).json({ error: 'No results found' });
  const { summary, report, architecture } = session.results;
  res.json({ summary, scores: report.scores, architecture: architecture?.projectInfo });
});

// GET /api/reports/fixes/:sessionId
router.get('/fixes/:sessionId', (req, res) => {
  const session = getSession(req.params.sessionId);
  if (!session || !session.results) return res.status(404).json({ error: 'No results found' });
  res.json(session.results.fixes || []);
});

// GET /api/reports/tests/:sessionId
router.get('/tests/:sessionId', (req, res) => {
  const session = getSession(req.params.sessionId);
  if (!session || !session.results) return res.status(404).json({ error: 'No results found' });
  res.json(session.results.generatedTests || []);
});

module.exports = router;
