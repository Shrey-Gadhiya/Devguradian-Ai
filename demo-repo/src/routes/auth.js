const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// VULNERABILITY: Weak JWT secret (SEC012)
const JWT_SECRET = "secret";

// VULNERABILITY: Weak hashing (SEC008)
router.post('/hash-password', (req, res) => {
  const { password } = req.body;
  const hash = crypto.createHash('md5').update(password).digest('hex');
  res.json({ hash });
});

// VULNERABILITY: Insecure random for tokens (SEC009)
router.post('/generate-reset-token', (req, res) => {
  const token = Math.random().toString(36).substring(2);
  res.json({ resetToken: token });
});

// VULNERABILITY: JWT with short secret
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  // ... validate credentials ...
  const token = jwt.sign({ username, role: 'user' }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token });
});

router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    // VULNERABILITY: JWT verified with weak secret
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (err) {
    // VULNERABILITY: Empty catch block (QA003)
    res.status(401).json({ valid: false });
  }
});

module.exports = router;
