const express = require('express');
const router = express.Router();
const db = require('../db');
const crypto = require('crypto');

// VULN: SQL Injection — string concatenation with user input
router.get('/user', (req, res) => {
  const id = req.query.id;
  const query = 'SELECT * FROM users WHERE id = ' + id;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// VULN: Plain-text password storage
router.post('/register', (req, res) => {
  const password = req.body.password;
  // Directly storing password without hashing
  const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
  db.query(query, [req.body.username, password], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true });
  });
});

// VULN: MD5 for password hashing
router.post('/login', (req, res) => {
  const hashed = crypto.createHash('md5').update(req.body.password).digest('hex');
  const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
  db.query(query, [req.body.username, hashed], (err, results) => {
    if (err || !results.length) return res.status(401).json({ error: 'Unauthorized' });
    res.json({ user: results[0] });
  });
});

module.exports = router;
