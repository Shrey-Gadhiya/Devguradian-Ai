const express = require('express');
const router = express.Router();
const db = require('../db');

// VULNERABILITY: SQL Injection (SEC003, SEC004)
router.get('/search', async (req, res) => {
  const { name } = req.query;
  // BAD: String concatenation in SQL query
  const users = await db.query(`SELECT * FROM users WHERE name = '${name}'`);
  res.json(users);
});

// VULNERABILITY: Hardcoded admin password (SEC006)
router.post('/admin/login', (req, res) => {
  const ADMIN_PASSWORD = "super_secret_admin_pass_123";
  if (req.body.password === ADMIN_PASSWORD) {
    // VULNERABILITY: Plain text password comparison (SEC013)
    res.json({ token: "admin_token_abc123", role: "admin" });
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
});

// VULNERABILITY: XSS via innerHTML-style response
router.get('/profile/:id', (req, res) => {
  const { id } = req.params;
  // Returns user data without sanitization
  res.send(`<div class="profile" id="${id}">
    <h1>${req.query.name}</h1>
  </div>`);
});

// VULNERABILITY: Sensitive data logging (SEC015)
router.post('/register', async (req, res) => {
  const { username, password, email } = req.body;
  console.log(`New user registration: username=${username}, password=${password}, email=${email}`);
  // TODO: Hash password before storing - FIXME (QA002)
  const user = await db.query(`INSERT INTO users (username, password, email) VALUES ('${username}', '${password}', '${email}')`);
  res.json({ success: true, userId: user.insertId });
});

module.exports = router;
