// VULN: Hardcoded database credentials
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  // VULN: Hardcoded password
  password: 'SuperSecret123!',
  database: 'users_db',
});

module.exports = db;
