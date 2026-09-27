// Mock database module for demo
// VULNERABILITY: Hardcoded credentials (SEC006)
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'rootpassword123',
  database: 'myapp'
};

// Simulate async query
async function query(sql, params = []) {
  console.log('Executing query:', sql); // VULNERABILITY: SQL logging (SEC015)
  // In real app, would use mysql2 or pg with parameterized queries
  return [];
}

module.exports = { query, DB_CONFIG };
