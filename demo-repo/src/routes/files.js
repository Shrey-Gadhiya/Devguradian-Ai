const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const axios = require('axios');

// VULNERABILITY: Path traversal (SEC010)
router.get('/read', (req, res) => {
  const { filename } = req.query;
  // BAD: No path validation
  fs.readFile(req.query.filename, 'utf8', (err, data) => {
    if (err) return res.status(404).json({ error: 'File not found' });
    res.send(data);
  });
});

// VULNERABILITY: Command injection (SEC002)
router.post('/process', (req, res) => {
  const { filename } = req.body;
  // BAD: User input directly in shell command
  exec(`cat ${filename} | wc -l`, (err, stdout) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ lines: parseInt(stdout.trim()) });
  });
});

// VULNERABILITY: SSRF (SEC011)
router.get('/fetch', async (req, res) => {
  const { url } = req.query;
  // BAD: Fetch URL controlled by user
  try {
    const response = await axios.get(req.query.url);
    res.json({ data: response.data });
  } catch (err) {
    // VULNERABILITY: Empty catch (QA003)
    res.status(500).json({ error: 'Fetch failed' });
  }
});

// VULNERABILITY: eval() usage (SEC001)
router.post('/evaluate', (req, res) => {
  const { expression } = req.body;
  try {
    const result = eval(expression); // EXTREMELY DANGEROUS
    res.json({ result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
