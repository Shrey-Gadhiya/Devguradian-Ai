# Vulnerable Demo App

This is an **intentionally vulnerable** Node.js Express application designed for testing DevGuardian AI.

## ⚠️ WARNING

This application contains numerous security vulnerabilities on purpose. **Never deploy this to production.**

## Known Vulnerabilities (for testing)

| ID | Severity | Category | Description |
|----|----------|----------|-------------|
| SEC001 | Critical | Injection | eval() usage in /api/files/evaluate |
| SEC002 | Critical | Injection | Command injection in /api/files/process |
| SEC003 | Critical | SQL Injection | Raw SQL in /api/users/search |
| SEC006 | Critical | Secrets | Hardcoded DB password in db.js |
| SEC007 | Critical | Secrets | Hardcoded admin password in users.js |
| SEC008 | High | Cryptography | MD5 hashing in auth.js |
| SEC009 | High | Cryptography | Math.random() for security tokens |
| SEC010 | High | Path Traversal | Unsanitized file path in /api/files/read |
| SEC011 | High | SSRF | User-controlled URL in /api/files/fetch |
| SEC012 | Medium | Auth | Weak JWT secret "secret" |
| SEC013 | Medium | Auth | Plain text password comparison |
| SEC014 | Medium | CORS | Wildcard CORS enabled |
| SEC015 | Low | Info Disclosure | Passwords logged to console |
| QA002 | Low | Code Quality | TODO/FIXME comments |
| QA003 | Medium | Error Handling | Empty catch blocks |
| DEP001 | High | Dependencies | Outdated vulnerable dependencies |

## Running the Demo

DevGuardian AI will automatically analyze this repository when you click "Load Demo".
