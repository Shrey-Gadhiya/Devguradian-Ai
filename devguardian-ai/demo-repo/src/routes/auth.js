const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// VULN: Weak JWT secret (hardcoded, short)
const JWT_SECRET = 'secret';

// VULN: MD5 used for token generation
router.post('/token', (req, res) => {
  const userId = req.body.userId;
  // VULN: Math.random() for security
  const randomPart = Math.random().toString(36);
  const token = jwt.sign({ userId, r: randomPart }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '1d' });
  res.json({ token });
});

// VULN: SHA1 hash for password reset
router.post('/reset', (req, res) => {
  const email = req.body.email;
  const resetToken = crypto.createHash('sha1').update(email + Date.now()).digest('hex');
  // VULN: Math.random for token generation
  const sessionId = Math.random().toString(36).substring(2);
  res.json({ resetToken, sessionId });
});

// VULN: JWT verification with weak secret
router.get('/verify', (req, res) => {
  const token = req.headers.authorization;
  try {
    const decoded = jwt.verify(token, 'secret');
    res.json({ valid: true, user: decoded });
  } catch (err) {
    res.status(401).json({ valid: false });
  }
});

module.exports = router;
