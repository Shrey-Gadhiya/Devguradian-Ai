const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const axios = require('axios');

const BASE_DIR = '/var/www/uploads';

// VULN: Path traversal — user controls filename
router.get('/download', (req, res) => {
  const filename = req.query.filename;
  const filePath = path.join(BASE_DIR, filename);
  res.sendFile(filePath);
});

// VULN: Command injection — user input in shell command
router.post('/process', (req, res) => {
  const filename = req.body.filename;
  exec('convert ' + filename + ' output.png', (err, stdout) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ output: stdout });
  });
});

// VULN: SSRF — HTTP request to user-supplied URL
router.get('/fetch', async (req, res) => {
  const url = req.query.url;
  try {
    const response = await axios.get(req.query.url);
    res.json({ data: response.data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// VULN: eval() with user input
router.post('/eval', (req, res) => {
  const code = req.body.code;
  try {
    const result = eval(req.body.code);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// VULN: Open redirect
router.get('/redirect', (req, res) => {
  res.redirect(req.query.url);
});

module.exports = router;
