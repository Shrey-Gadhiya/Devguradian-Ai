const express = require('express');
const router = express.Router();
const { getSession } = require('../agents/orchestrator');

// GET /api/reports/:sessionId/markdown
router.get('/:sessionId/markdown', (req, res) => {
  const session = getSession(req.params.sessionId);
  if (!session || !session.results) return res.status(404).json({ error: 'No results available' });
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="devguardian-report-${session.id}.md"`);
  res.send(session.results.report.markdown);
});

// GET /api/reports/:sessionId/json
router.get('/:sessionId/json', (req, res) => {
  const session = getSession(req.params.sessionId);
  if (!session || !session.results) return res.status(404).json({ error: 'No results available' });
  res.setHeader('Content-Disposition', `attachment; filename="devguardian-report-${session.id}.json"`);
  res.json(session.results.report.json);
});

// GET /api/reports/:sessionId/summary
router.get('/:sessionId/summary', (req, res) => {
  const session = getSession(req.params.sessionId);
  if (!session || !session.results) return res.status(404).json({ error: 'No results available' });
  res.json({
    sessionId: session.id,
    ...session.results.report.summary,
    scores: {
      security: session.results.report.securityScore,
      quality: session.results.report.qualityScore,
      testCoverage: session.results.tests.coverageEstimate
    },
    generatedAt: session.results.report.generatedAt
  });
});

// GET /api/reports/:sessionId/fixes
router.get('/:sessionId/fixes', (req, res) => {
  const session = getSession(req.params.sessionId);
  if (!session || !session.results) return res.status(404).json({ error: 'No results available' });
  res.json({ fixes: session.results.fixes, total: session.results.fixes.length });
});

// GET /api/reports/:sessionId/tests
router.get('/:sessionId/tests', (req, res) => {
  const session = getSession(req.params.sessionId);
  if (!session || !session.results) return res.status(404).json({ error: 'No results available' });
  res.json({ tests: session.results.generatedTests, total: session.results.generatedTests.length });
});

module.exports = router;
